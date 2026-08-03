import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const GENERAL_FILES_TABLE =
  process.env.DYNAMODB_GENERAL_FILES_TABLE || "FASTBI_general_files";

const ORGANIZATIONS_TABLE =
  process.env.DYNAMODB_ORGANIZATIONS_TABLE || "FASTBI_ORGANIZATIONS";

const FILE_PROJECTION =
  "id, organization_id, file_name, s3_key, bucket_name, file_size, " +
  "file_extension, row_count, #cols, #st, #err, truncated, created_at, updated_at";

const FILE_EXPRESSION_ATTRIBUTE_NAMES = {
  "#cols": "columns",
  "#st": "status",
  "#err": "error",
};

export interface GeneralFile {
  id: string;
  organization_id: string;
  file_name: string;
  s3_key: string;
  bucket_name: string;
  file_size: number;
  file_extension: string;
  row_count: number;
  columns: string[];
  status: string;
  error?: string;
  truncated?: boolean;
  created_at: string;
  updated_at: string;
}

export class GeneralFileNotFoundError extends Error {
  constructor(organizationName: string) {
    super(`organization not found for name '${organizationName}'`);
    this.name = "GeneralFileNotFoundError";
  }
}

export class GeneralFileDetailNotFoundError extends Error {
  constructor(fileId: string) {
    super(`file not found for id '${fileId}'`);
    this.name = "GeneralFileDetailNotFoundError";
  }
}

async function getOrganizationIdByName(
  organizationName: string
): Promise<string> {
  const target = organizationName.trim().toLowerCase();
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: ORGANIZATIONS_TABLE,
        ProjectionExpression: "id, #name",
        ExpressionAttributeNames: { "#name": "name" },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of result.Items || []) {
      if (
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        item.name.trim().toLowerCase() === target
      ) {
        return item.id;
      }
    }
    lastEvaluatedKey = result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (lastEvaluatedKey);

  throw new GeneralFileNotFoundError(organizationName);
}

export async function getGeneralFilesByOrganization(
  organizationName: string
): Promise<GeneralFile[]> {
  const organizationId = await getOrganizationIdByName(organizationName);

  const items: Record<string, unknown>[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: GENERAL_FILES_TABLE,
        FilterExpression: "organization_id = :orgId",
        ExpressionAttributeNames: FILE_EXPRESSION_ATTRIBUTE_NAMES,
        ExpressionAttributeValues: { ":orgId": organizationId },
        ProjectionExpression: FILE_PROJECTION,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (lastEvaluatedKey);

  const files: GeneralFile[] = items.map((item) => {
    let columns: string[] = [];
    if (typeof item.columns === "string") {
      try {
        const parsed = JSON.parse(item.columns);
        if (Array.isArray(parsed)) {
          columns = parsed.map(String);
        }
      } catch {
        columns = [];
      }
    } else if (Array.isArray(item.columns)) {
      columns = item.columns.map(String);
    }

    return {
      id: String(item.id || ""),
      organization_id: String(item.organization_id || ""),
      file_name: String(item.file_name || ""),
      s3_key: String(item.s3_key || ""),
      bucket_name: String(item.bucket_name || ""),
      file_size: Number(item.file_size || 0),
      file_extension: String(item.file_extension || ""),
      row_count: Number(item.row_count || 0),
      columns,
      status: String(item.status || ""),
      error: typeof item.error === "string" ? item.error : undefined,
      truncated: Boolean(item.truncated),
      created_at: String(item.created_at || ""),
      updated_at: String(item.updated_at || ""),
    };
  });

  files.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return files;
}

function parseColumns(raw: unknown): string[] {
  let columns: string[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        columns = parsed.map(String);
      }
    } catch {
      columns = [];
    }
  } else if (Array.isArray(raw)) {
    columns = raw.map(String);
  }
  return columns;
}

function parseRows(raw: unknown): Record<string, unknown>[] {
  if (typeof raw !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (row): row is Record<string, unknown> =>
          typeof row === "object" && row !== null
      );
    }
  } catch {
    return [];
  }
  return [];
}

export async function getGeneralFileById(
  fileId: string
): Promise<GeneralFile & { rows: Record<string, unknown>[] }> {
  const result = await docClient.send(
    new GetCommand({
      TableName: GENERAL_FILES_TABLE,
      Key: { id: fileId },
    })
  );

  const item = result.Item;
  if (!item) {
    throw new GeneralFileDetailNotFoundError(fileId);
  }

  return {
    id: String(item.id || ""),
    organization_id: String(item.organization_id || ""),
    file_name: String(item.file_name || ""),
    s3_key: String(item.s3_key || ""),
    bucket_name: String(item.bucket_name || ""),
    file_size: Number(item.file_size || 0),
    file_extension: String(item.file_extension || ""),
    row_count: Number(item.row_count || 0),
    columns: parseColumns(item.columns),
    rows: parseRows(item.data),
    status: String(item.status || ""),
    error: typeof item.error === "string" ? item.error : undefined,
    truncated: Boolean(item.truncated),
    created_at: String(item.created_at || ""),
    updated_at: String(item.updated_at || ""),
  };
}
