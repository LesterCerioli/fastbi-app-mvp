import * as bcrypt from "bcryptjs";
import { query } from "./db";

export interface UserDTO {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserWithPassword extends UserDTO {
  password: string;
}

function verifyPassword(plain: string, hashed: string): boolean {
  if (!plain || !hashed) return false;
  return bcrypt.compareSync(plain, hashed);
}

export class LoginService {
  async verifyCredentials(email: string, password: string, role: string): Promise<{ ok: boolean; user?: UserDTO }> {
    if (!email || !password || !role) {
      throw new Error("email, password and role are required");
    }

    const result = await query(
      `SELECT id, created_at, updated_at, organization_id, name, email, role, password
       FROM public.users
       WHERE email = $1 AND role = $2 AND deleted_at IS NULL AND password IS NOT NULL`,
      [email, role]
    );

    const row = result.rows[0] as UserWithPassword | undefined;
    if (!row) return { ok: false };

    if (!verifyPassword(password, row.password)) return { ok: false };

    const { password: _, ...safeUser } = row;
    return { ok: true, user: safeUser };
  }
}
