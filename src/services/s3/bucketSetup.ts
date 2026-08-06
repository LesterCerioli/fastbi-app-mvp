import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { BUCKET } from "./upload";

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function ensureBucket(bucketName: string): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    return;
  } catch {
    /* bucket does not exist yet */
  }

  try {
    await s3.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );
  } catch (err: any) {
    if (err.name !== "BucketAlreadyOwnedByYou" && err.name !== "BucketAlreadyExists") {
      throw err;
    }
  }
}

export async function ensureGeneralBucket(): Promise<void> {
  await ensureBucket(BUCKET);
}

export async function ensurePhotosBucket(): Promise<void> {
  const bucketName = process.env.S3_AVATAR_BUCKET;
  if (!bucketName) {
    throw new Error("S3_AVATAR_BUCKET environment variable is not set");
  }
  await ensureBucket(bucketName);
}
