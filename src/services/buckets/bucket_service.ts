import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompletedPart,
} from '@aws-sdk/client-s3';
import { Pool } from 'pg';

let _s3: S3Client | null = null;

function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      endpoint: process.env.LOCALSTACK_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }
  return _pool;
}

export interface Bucket {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  s3_bucket_name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BucketService {
  getByOrganization(orgID: string, limit?: number, offset?: number): Promise<Bucket[]>;
  getByOrganizationName(orgName: string, limit?: number, offset?: number): Promise<Bucket[]>;
  resolveOrganizationID(organizationName: string): Promise<{ id: string; error?: string }>;
  getByID(id: string): Promise<Bucket | null>;
  createBucket(
    name: string,
    description?: string | null,
    file?: File,
    organizationName?: string
  ): Promise<{ bucket: Bucket; error?: string }>;
  listBucketsByOrganizationName(orgName: string): Promise<Bucket[]>;
}

const S3_PART_SIZE = 5 * 1024 * 1024;

export class DefaultBucketService implements BucketService {
  /**
   * Armazena a URL base (possivelmente vazia).
   * A validação é feita em runtime, dentro de getAuthToken(),
   * para não quebrar o build da Vercel (que não tem todas as envs).
   */
  private readonly baseUrl: string;
  private readonly internalBaseUrl: string;

  constructor() {
    const baseUrl = process.env.EXTERNAL_GO_API_BASE_URL || '';
    this.baseUrl = baseUrl.replace(/\/$/, '');

    const internalBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    this.internalBaseUrl = internalBaseUrl.replace(/\/$/, '');
  }

  private async getAuthToken(): Promise<string> {
    // Validação em runtime — só falha se o método for realmente chamado
    // sem a env configurada.
    if (!this.baseUrl) {
      throw new Error(
        'Variável de ambiente obrigatória não configurada: EXTERNAL_GO_API_BASE_URL'
      );
    }

    const url = `${this.internalBaseUrl}/api/auth/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID_1,
        secret: process.env.SECRET_1,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let details = '';
      try {
        const data = await response.json();
        details = data?.error || data?.details || '';
      } catch { /* resposta não é JSON */ }
      throw new Error(
        `Falha ao obter token em /api/auth/token (${response.status}): ${details || response.statusText}`
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      throw new Error('Resposta de /api/auth/token não contém "token"');
    }
    return data.token;
  }

  async getByOrganization(orgID: string, limit?: number, offset?: number): Promise<Bucket[]> {
    const url = `${this.baseUrl}/buckets/organization/${orgID}`;
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (response.status !== 200) {
      throw new Error('Falha ao obter buckets da API Go ' + response.status);
    }
    return (await response.json()) as Bucket[];
  }

  async getByOrganizationName(orgName: string, limit?: number, offset?: number): Promise<Bucket[]> {
    const url = `${this.baseUrl}/buckets/organization/name/${orgName}`;
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (response.status !== 200) {
      throw new Error('Falha ao obter buckets da API Go ' + response.status);
    }
    return (await response.json()) as Bucket[];
  }

  async getByID(id: string): Promise<Bucket | null> {
    const url = `${this.baseUrl}/buckets/${id}`;
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (response.status !== 200) {
      return null;
    }
    return (await response.json()) as Bucket;
  }

  async resolveOrganizationID(organizationName: string): Promise<{ id: string; error?: string }> {
    const url = `${this.baseUrl}/organizations/name/${organizationName}`;
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (response.status !== 200) {
      let errorData: { error: string; details?: string } | null = null;
      try { errorData = await response.json(); } catch { /* resposta não é JSON */ }
      return { id: '', error: errorData?.details || errorData?.error || response.statusText };
    }
    return (await response.json()) as { id: string };
  }

  private async resolveOrganizationIDFromSession(): Promise<{ id: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}/organizations/me`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (response.status !== 200) {
        let details = '';
        try {
          const data = await response.json();
          details = data?.error || data?.details || '';
        } catch { /* não é JSON */ }
        return {
          id: '',
          error: `Organização não encontrada na sessão (HTTP ${response.status})${details ? ': ' + details : ''}`,
        };
      }
      const data = await response.json();
      return { id: data.id || data.organization_id || '' };
    } catch (err: any) {
      return {
        id: '',
        error: `Falha ao resolver organização da sessão: ${err?.message || err}`,
      };
    }
  }

  async createBucket(
    name: string,
    description?: string | null,
    file?: File,
    organizationName?: string
  ): Promise<{ bucket: Bucket; error?: string }> {
    let orgId = '';
    const pool = getPool();

    if (organizationName && organizationName.trim()) {
      const trimmedName = organizationName.trim();

      const orgResult = await pool.query(
        `SELECT id FROM public.organizations WHERE "name" = $1`,
        [trimmedName]
      );
      const orgRow = orgResult.rows[0];
      if (!orgRow) {
        return {
          bucket: {} as Bucket,
          error: `Organização não encontrada: "${trimmedName}"`,
        };
      }
      orgId = orgRow.id;
    } else {
      const sessionResult = await this.resolveOrganizationIDFromSession();
      if (sessionResult.error || !sessionResult.id) {
        return {
          bucket: {} as Bucket,
          error: sessionResult.error || 'Organização não encontrada',
        };
      }
      orgId = sessionResult.id;
    }

    const s3BucketName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const s3 = getS3();

    try {
      await s3.send(new CreateBucketCommand({ Bucket: s3BucketName }));
    } catch (err: any) {
      return { bucket: {} as Bucket, error: `Falha ao criar bucket S3: ${err.message}` };
    }

    const now = new Date().toISOString();
    let result;
    try {
      result = await pool.query(
        `INSERT INTO public.buckets (organization_id, "name", description, s3_bucket_name, created_at, updated_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, organization_id, "name", description, s3_bucket_name, created_at, updated_at`,
        [orgId, name, description, s3BucketName, now, now, null]
      );
    } catch (err: any) {
      return { bucket: {} as Bucket, error: `Falha ao inserir bucket no banco: ${err.message}` };
    }

    const newBucket: Bucket = {
      id: result.rows[0].id,
      organization_id: result.rows[0].organization_id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      s3_bucket_name: result.rows[0].s3_bucket_name,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
    };

    if (file) {
      try {
        const key = `${newBucket.id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        await this.uploadFileToS3(s3BucketName, key, file);
      } catch (err: any) {
        return { bucket: newBucket, error: `Falha ao fazer upload do arquivo: ${err.message}` };
      }
    }

    return { bucket: newBucket, error: undefined };
  }

  private async uploadFileToS3(bucketName: string, key: string, file: File): Promise<void> {
    const fileSize = file.size;
    const contentType = file.type || 'application/octet-stream';
    const s3 = getS3();

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    if (fileSize <= S3_PART_SIZE) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBytes,
          ContentType: contentType,
          ContentLength: fileSize,
        })
      );
      return;
    }

    const createRes = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      })
    );

    const uploadId = createRes.UploadId;
    if (!uploadId) {
      throw new Error('Falha ao iniciar upload multi-part: UploadId ausente');
    }

    const completedParts: CompletedPart[] = [];

    try {
      let partNumber = 1;
      let offset = 0;

      while (offset < fileSize) {
        const end = Math.min(offset + S3_PART_SIZE, fileSize);
        const chunk = fileBytes.subarray(offset, end);

        const partRes = await s3.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            PartNumber: partNumber,
            UploadId: uploadId,
            Body: chunk,
            ContentLength: chunk.byteLength,
          })
        );

        if (!partRes.ETag) {
          throw new Error(`Parte ${partNumber} não retornou ETag`);
        }

        completedParts.push({ ETag: partRes.ETag, PartNumber: partNumber });
        offset = end;
        partNumber++;
      }

      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: completedParts },
        })
      );
    } catch (err) {
      try {
        await s3.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        );
      } catch { /* ignora */ }
      throw err;
    }
  }

  async listBucketsByOrganizationName(orgName: string): Promise<Bucket[]> {
    const pool = getPool();
    const trimmed = orgName.trim();
    const result = await pool.query(
      `SELECT id, organization_id, "name", description, s3_bucket_name, created_at, updated_at, deleted_at
       FROM public.buckets
       WHERE organization_id = (SELECT id FROM public.organizations WHERE "name" = $1)
       AND deleted_at IS NULL`,
      [trimmed]
    );
    return result.rows as Bucket[];
  }
}

export const bucketService = new DefaultBucketService();