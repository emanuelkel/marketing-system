import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishInstagramPost, publishFacebookPost } from "@/lib/meta-api";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    include: {
      media: { orderBy: { order: "asc" } },
      client: {
        select: {
          id: true,
          metaAccessToken: true,
          instagramAccountId: true,
          facebookPageId: true,
        },
      },
    },
  });

  const results = { published: 0, failed: 0 };

  for (const post of scheduledPosts) {
    try {
      const mediaUrls = post.media.map((m) => m.url);
      if (mediaUrls.length === 0) {
        throw new Error("Nenhuma mídia anexada ao post");
      }
      const caption = [post.caption, ...(post.hashtags.map((h) => `#${h}`))].filter(Boolean).join("\n\n");
      let metaPostId: string | null = null;

      if (["INSTAGRAM", "INSTAGRAM_REEL"].includes(post.network)) {
        if (!post.client.instagramAccountId) {
          throw new Error("Instagram Account ID não configurado");
        }
        metaPostId = await publishInstagramPost(post.clientId, mediaUrls, caption);
      } else if (post.network === "FACEBOOK") {
        if (!post.client.facebookPageId) {
          throw new Error("Facebook Page ID não configurado");
        }
        metaPostId = await publishFacebookPost(post.clientId, caption, mediaUrls);
      }

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          metaPostId,
        },
      });

      results.published++;
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
        },
      });

      results.failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: scheduledPosts.length,
    ...results,
  });
}
