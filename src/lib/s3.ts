import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const BUCKET = process.env.MINIO_BUCKET ?? "marketing-assets";
const STORAGE_DRIVER = process.env.STORAGE_DRIVER ?? "local";
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? "./public/uploads";

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "us-east-1",
      endpoint: process.env.MINIO_ENDPOINT,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteObject(key: string) {
  if (STORAGE_DRIVER === "local") {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    await fs.unlink(filePath).catch(() => null);
    return;
  }
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function generateFileKey(
  folder: string,
  originalName: string
): string {
  const ext = path.extname(originalName);
  return `${folder}/${randomUUID()}${ext}`;
}

export function getPublicUrl(key: string): string {
  if (STORAGE_DRIVER === "local") {
    return `/uploads/${key}`;
  }
  const endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
  return `${endpoint}/${BUCKET}/${key}`;
}

export async function saveLocalFile(
  buffer: Buffer,
  key: string
): Promise<string> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  return getPublicUrl(key);
}
