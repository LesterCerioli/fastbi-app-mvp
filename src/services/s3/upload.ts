import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.S3_BUCKET_NAME || "fastbi";

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
  bucketName?: string
): Promise<string> {
  const targetBucket = bucketName || BUCKET;

  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  const endpoint = process.env.LOCALSTACK_ENDPOINT;
  if (endpoint) {
    return `${endpoint}/${targetBucket}/${key}`;
  }
  return `https://${targetBucket}.s3.amazonaws.com/${key}`;
}
