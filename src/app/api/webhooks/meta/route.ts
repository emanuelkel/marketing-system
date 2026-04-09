import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

// Verify Meta webhook signature
function verifySignature(body: string, signature: string): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;

  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(body)
    .digest("hex")}`;

  return signature === expected;
}

// GET: Meta webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Receive Meta webhook events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const payload = JSON.parse(body);

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === "feed" || change.field === "media") {
          const postId = change.value?.post_id ?? change.value?.media_id;
          if (!postId) continue;

          // Update post status to PUBLISHED when Meta confirms
          await prisma.post.updateMany({
            where: { metaPostId: postId },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
