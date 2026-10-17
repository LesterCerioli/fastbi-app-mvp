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
  getByID(id: string): Promise<Bucket | null>;
  createBucket(
    name: string,
    description?: string | null,
    file?: File,
    organizationName?: string
  ): Promise<{ bucket: Bucket; error?: string }>;
  listBucketsByOrganizationName(orgName: string): Promise<Bucket[]>;
}

const S3_PART_SIZE = 5 * 1024 * 1024; // 5 MiB

export class DefaultBucketService implements BucketService {
  
  async getByOrganization(orgID: string, limit?: number, offset?: number): Promise<Bucket[]> {
    const pool = getPool();
    const params: any[] = [orgID];
    let sql = `
      SELECT id, organization_id, "name", description, s3_bucket_name, created_at, updated_at, deleted_at
      FROM public.buckets
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    if (typeof limit === 'number') {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (typeof offset === 'number') {
      params.push(offset);
      sql += ` OFFSET $${params.length}`;
    }
    const result = await pool.query(sql, params);
    return result.rows as Bucket[];
  }

  async getByOrganizationName(orgName: string, limit?: number, offset?: number): Promise<Bucket[]> {
    const pool = getPool();
    const trimmed = orgName.trim();
    const params: any[] = [trimmed];
    let sql = `
      SELECT b.id, b.organization_id, b."name", b.description, b.s3_bucket_name, b.created_at, b.updated_at, b.deleted_at
      FROM public.buckets b
      INNER JOIN public.organizations o ON o.id = b.organization_id
      WHERE o."name" = $1 AND b.deleted_at IS NULL
      ORDER BY b.created_at DESC
    `;
    if (typeof limit === 'number') {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (typeof offset === 'number') {
      params.push(offset);
      sql += ` OFFSET $${params.length}`;
    }
    const result = await pool.query(sql, params);
    return result.rows as Bucket[];
  }

  async getByID(id: string): Promise<Bucket | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, organization_id, "name", description, s3_bucket_name, created_at, updated_at, deleted_at
       FROM public.buckets
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return (result.rows[0] as Bucket) || null;
  }

  async createBucket(
    name: string,
    description?: string | null,
    file?: File,
    organizationName?: string
  ): Promise<{ bucket: Bucket; error?: string }> {
    if (!organizationName || !organizationName.trim()) {
      return { bucket: {} as Bucket, error: 'organization_name é obrigatório' };
    }

    const trimmedName = organizationName.trim();
    const pool = getPool();

    
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
    const orgId = orgRow.id;
    
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
       AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [trimmed]
    );
    return result.rows as Bucket[];
  }
}

export const bucketService = new DefaultBucketService();