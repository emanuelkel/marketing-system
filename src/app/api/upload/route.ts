import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateFileKey, getPresignedUploadUrl, saveLocalFile, getPublicUrl } from "@/lib/s3";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 50MB" },
        { status: 400 }
      );
    }

    const key = generateFileKey(folder, file.name);

    if (process.env.STORAGE_DRIVER === "minio") {
      // Return presigned URL for client-side upload
      const presignedUrl = await getPresignedUploadUrl(key, file.type);
      return NextResponse.json({
        presignedUrl,
        key,
        publicUrl: getPublicUrl(key),
      });
    } else {
      // Save locally (dev)
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await saveLocalFile(buffer, key);
      return NextResponse.json({ url, key });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
