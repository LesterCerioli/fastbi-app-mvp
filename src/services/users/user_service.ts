import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import { EmailSenderService } from "../email_sender_service";

export interface UserDTO {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: string;
  password?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OrganizationDTO {
  id: string;
  name: string;
}

interface UserWithPassword extends UserDTO {
  password: string;
}

interface Semaphore {
  acquire(signal?: AbortSignal): Promise<void>;
  release(): void;
}

function createSemaphore(max: number): Semaphore {
  const queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  let active = 0;

  return {
    async acquire(signal?: AbortSignal): Promise<void> {
      if (active < max) {
        active++;
        return;
      }
      return new Promise<void>((resolve, reject) => {
        const entry = { resolve, reject };
        queue.push(entry);
        if (signal) {
          const onAbort = () => {
            const idx = queue.indexOf(entry);
            if (idx !== -1) queue.splice(idx, 1);
            reject(new DOMException("The operation was aborted", "AbortError"));
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    },
    release(): void {
      if (queue.length > 0) {
        const next = queue.shift()!;
        next.resolve();
      } else {
        active--;
      }
    },
  };
}

function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error("password cannot be empty");
  return bcrypt.hash(password, 10);
}

function verifyPassword(plain: string, hashed: string): boolean {
  if (!plain || !hashed) return false;
  return bcrypt.compareSync(plain, hashed);
}

async function withCancellation<T>(
  fn: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return fn();

  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("The operation was aborted", "AbortError"));
      return;
    }

    const onAbort = () => reject(new DOMException("The operation was aborted", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });

    fn().then(
      (result) => {
        signal.removeEventListener("abort", onAbort);
        resolve(result);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      }
    );
  });
}

export class UserService {
  private emailSender: EmailSenderService | null;
  private hashSem: Semaphore;
  private querySem: Semaphore;

  constructor(emailSender?: EmailSenderService) {
    this.emailSender = emailSender || null;
    this.hashSem = createSemaphore(4);
    this.querySem = createSemaphore(8);
  }

  private async hashPasswordAsync(password: string, signal?: AbortSignal): Promise<string> {
    await this.hashSem.acquire(signal);
    try {
      return await withCancellation(() => hashPassword(password), signal);
    } finally {
      this.hashSem.release();
    }
  }

  private async resolveOrganizationId(organizationName: string, signal?: AbortSignal): Promise<string | null> {
    if (!organizationName.trim()) throw new Error("organization name cannot be empty");

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        let id = await this.getOrganizationIdExact(organizationName);
        if (id) return id;

        id = await this.getOrganizationIdTrim(organizationName);
        if (id) return id;

        return this.getOrganizationIdByName(organizationName);
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getOrganizationIdByName(organizationName: string): Promise<string | null> {
    const result = await query(
      "SELECT id FROM public.organizations WHERE LOWER(name) = LOWER($1) LIMIT 1",
      [organizationName]
    );
    return result.rows[0]?.id || null;
  }

  async getOrganizationIdExact(organizationName: string): Promise<string | null> {
    const result = await query(
      "SELECT id FROM public.organizations WHERE name = $1 LIMIT 1",
      [organizationName]
    );
    return result.rows[0]?.id || null;
  }

  async getOrganizationIdTrim(organizationName: string): Promise<string | null> {
    const result = await query(
      "SELECT id FROM public.organizations WHERE TRIM(name) = TRIM($1) LIMIT 1",
      [organizationName]
    );
    return result.rows[0]?.id || null;
  }

  async organizationExists(organizationName: string): Promise<boolean> {
    const id = await this.resolveOrganizationId(organizationName);
    return id !== null;
  }

  async getAllOrganizations(): Promise<OrganizationDTO[]> {
    const result = await query("SELECT id, name FROM public.organizations");
    return result.rows;
  }

  async create(
    user: UserDTO,
    signal?: AbortSignal
  ): Promise<string> {
    if (!user.name || !user.email || !user.role) {
      throw new Error("missing required fields: name, email, or role");
    }

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const dup = await query(
          "SELECT COUNT(*) FROM public.users WHERE email = $1 AND deleted_at IS NULL",
          [user.email]
        );
        if (parseInt(dup.rows[0]?.count || "0", 10) > 0) {
          throw new Error("email already exists");
        }

        const result = await query(
          `INSERT INTO public.users (organization_id, name, email, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [user.organization_id, user.name, user.email, user.role]
        );
        return result.rows[0].id;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async createWithPassword(
    user: UserDTO,
    password: string,
    signal?: AbortSignal
  ): Promise<string> {
    if (!user.name || !user.email || !user.role || !password) {
      throw new Error("missing required fields: name, email, role or password");
    }

    const hashed = await this.hashPasswordAsync(password, signal);

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const dup = await query(
          "SELECT COUNT(*) FROM public.users WHERE email = $1 AND deleted_at IS NULL",
          [user.email]
        );
        if (parseInt(dup.rows[0]?.count || "0", 10) > 0) {
          throw new Error("email already exists");
        }

        const result = await query(
          `INSERT INTO public.users (organization_id, name, email, password, role)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [user.organization_id, user.name, user.email, hashed, user.role]
        );
        return result.rows[0].id;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async createWithOrganizationName(
    name: string,
    email: string,
    password: string,
    role: string,
    organizationName: string,
    signal?: AbortSignal
  ): Promise<UserDTO> {
    if (!name || !email || !password || !role || !organizationName) {
      throw new Error("missing required fields");
    }

    const orgId = await this.resolveOrganizationId(organizationName, signal);
    if (!orgId) {
      throw new Error(`organization '${organizationName}' not found`);
    }

    const id = await this.createWithPassword(
      {
        id: "",
        organization_id: orgId,
        name,
        email,
        role,
        created_at: "",
        updated_at: "",
      },
      password,
      signal
    );

    return this.getByID(id, signal);
  }

  async setPassword(userId: string, password: string, signal?: AbortSignal): Promise<void> {
    if (!password) throw new Error("password cannot be empty");

    const hashed = await this.hashPasswordAsync(password, signal);

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        await query(
          `UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND deleted_at IS NULL`,
          [hashed, userId]
        );
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async verifyCredentials(
    email: string,
    password: string,
    signal?: AbortSignal
  ): Promise<{ ok: boolean; user?: UserDTO }> {
    if (!email || !password) {
      throw new Error("email and password are required");
    }

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, organization_id, name, email, role, password
           FROM public.users
           WHERE email = $1 AND deleted_at IS NULL AND password IS NOT NULL`,
          [email]
        );

        const row = result.rows[0] as UserWithPassword | undefined;
        if (!row) return { ok: false };

        if (!verifyPassword(password, row.password)) return { ok: false };

        const { password: _, ...safeUser } = row;
        return { ok: true, user: safeUser };
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async authenticateByOrganization(
    email: string,
    password: string,
    organizationName: string,
    signal?: AbortSignal
  ): Promise<UserDTO | null> {
    if (!email || !password || !organizationName) {
      throw new Error("email, password and organization_name are required");
    }

    const exists = await this.organizationExists(organizationName);
    if (!exists) throw new Error("organization not found");

    const orgId = await this.resolveOrganizationId(organizationName, signal);
    if (!orgId) return null;

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, organization_id, name, email, role, password
           FROM public.users
           WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL AND password IS NOT NULL`,
          [email, orgId]
        );

        const row = result.rows[0] as UserWithPassword | undefined;
        if (!row) return null;

        if (!verifyPassword(password, row.password)) return null;

        const { password: _, ...safeUser } = row;
        return safeUser;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async authenticateByRole(
    email: string,
    password: string,
    role: string,
    signal?: AbortSignal
  ): Promise<UserDTO | null> {
    if (!email || !password || !role) {
      throw new Error("email, password and role are required");
    }

    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, organization_id, name, email, role, password
           FROM public.users
           WHERE email = $1 AND role = $2 AND deleted_at IS NULL AND password IS NOT NULL`,
          [email, role]
        );

        const row = result.rows[0] as UserWithPassword | undefined;
        if (!row) return null;

        if (!verifyPassword(password, row.password)) return null;

        const { password: _, ...safeUser } = row;
        return safeUser;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByID(id: string, signal?: AbortSignal): Promise<UserDTO> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, organization_id, name, email, role
           FROM public.users WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (!result.rows[0]) throw new Error("user not found");
        return result.rows[0] as UserDTO;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByEmail(email: string, signal?: AbortSignal): Promise<UserDTO[]> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE email = $1 AND deleted_at IS NULL`,
          [email]
        );
        return result.rows as UserDTO[];
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getSingleByEmail(email: string, signal?: AbortSignal): Promise<UserDTO | null> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
          [email]
        );
        return (result.rows[0] as UserDTO) || null;
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByName(name: string, signal?: AbortSignal): Promise<UserDTO[]> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE name = $1 AND deleted_at IS NULL`,
          [name]
        );
        return result.rows as UserDTO[];
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByRole(role: string, signal?: AbortSignal): Promise<UserDTO[]> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE role = $1 AND deleted_at IS NULL`,
          [role]
        );
        return result.rows as UserDTO[];
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByCreatedAt(createdAt: string, signal?: AbortSignal): Promise<UserDTO[]> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE DATE(created_at) = $1 AND deleted_at IS NULL`,
          [createdAt]
        );
        return result.rows as UserDTO[];
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async getByUpdatedAt(updatedAt: string, signal?: AbortSignal): Promise<UserDTO[]> {
    await this.querySem.acquire(signal);
    try {
      return await withCancellation(async () => {
        const result = await query(
          `SELECT id, created_at, updated_at, deleted_at, organization_id, name, email, role
           FROM public.users WHERE DATE(updated_at) = $1 AND deleted_at IS NULL`,
          [updatedAt]
        );
        return result.rows as UserDTO[];
      }, signal);
    } finally {
      this.querySem.release();
    }
  }

  async batchCreateWithPassword(
    users: Array<{ user: UserDTO; password: string }>,
    signal?: AbortSignal
  ): Promise<{ ids: string[]; errors: (Error | null)[] }> {
    const ids: string[] = [];
    const errors: (Error | null)[] = [];
    const batchSem = createSemaphore(8);

    await Promise.all(
      users.map(async (u, i) => {
        await batchSem.acquire(signal);
        try {
          const id = await this.createWithPassword(u.user, u.password, signal);
          ids[i] = id;
          errors[i] = null;
        } catch (err) {
          ids[i] = "";
          errors[i] = err instanceof Error ? err : new Error(String(err));
        } finally {
          batchSem.release();
        }
      })
    );

    return { ids, errors };
  }

  async updateUser(userId: string, name?: string, role?: string): Promise<UserDTO> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      params.push(role);
    }

    if (updates.length === 0) throw new Error("no fields to update");

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(userId);

    const result = await query(
      `UPDATE public.users SET ${updates.join(", ")}
       WHERE id = $${idx} AND deleted_at IS NULL
       RETURNING id, name, email, role, organization_id, created_at, updated_at`,
      params
    );
    if (!result.rows[0]) throw new Error("user not found");
    return result.rows[0] as UserDTO;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await query(
      `UPDATE public.users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [userId]
    );
    return result.rows.length > 0;
  }

  async resetPasswordDirect(email: string, newPassword: string): Promise<boolean> {
    const user = await this.getSingleByEmail(email);
    if (!user) throw new Error("user not found");

    const hashedPassword = await this.hashPasswordAsync(newPassword);
    await query(
      `UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
      [hashedPassword, user.id]
    );

    if (this.emailSender) {
      await this.emailSender.sendPasswordReset(user.name, email, newPassword);
    }
    return true;
  }

  async resetPasswordWithUserID(userId: string, newPassword: string): Promise<boolean> {
    const userResult = await query(
      `SELECT name, email FROM public.users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    if (!userResult.rows[0]) throw new Error("user not found");

    const { name, email } = userResult.rows[0];
    const hashedPassword = await this.hashPasswordAsync(newPassword);

    await query(
      `UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
      [hashedPassword, userId]
    );

    if (this.emailSender) {
      await this.emailSender.sendPasswordReset(name, email, newPassword);
    }
    return true;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const result = await query(
      `SELECT email, name, password FROM public.users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    if (!result.rows[0]) throw new Error("user not found");

    const { email, name, password: hashedPassword } = result.rows[0];
    if (!verifyPassword(oldPassword, hashedPassword)) {
      throw new Error("invalid current password");
    }

    const newHashedPassword = await this.hashPasswordAsync(newPassword);
    await query(
      `UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHashedPassword, userId]
    );
    return true;
  }

  async listUsersByOrganization(organizationName: string, limit = 100, offset = 0): Promise<UserDTO[]> {
    const orgId = await this.getOrganizationIdByName(organizationName);
    if (!orgId) return [];

    const result = await query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM public.users WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    return result.rows as UserDTO[];
  }

  async getUserCountByOrganization(organizationName: string): Promise<number> {
    const orgId = await this.getOrganizationIdByName(organizationName);
    if (!orgId) return 0;

    const result = await query(
      `SELECT COUNT(*) FROM public.users WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId]
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }
}
