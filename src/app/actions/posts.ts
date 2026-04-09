"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyUser } from "@/lib/notifications";
import type { SocialNetwork } from "@prisma/client";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const caption = formData.get("caption") as string;
  const hashtagsRaw = formData.get("hashtags") as string;
  const network = formData.get("network") as SocialNetwork;
  const scheduledAt = formData.get("scheduledAt") as string;
  const mediaUrls = formData.getAll("mediaUrls") as string[];
  const sendForApproval = formData.get("sendForApproval") === "true";

  if (!clientId || !title || !network) {
    throw new Error("Campos obrigatórios faltando");
  }

  const hashtags = hashtagsRaw
    ? hashtagsRaw.split(/[\s,]+/).filter((h) => h.replace("#", "").length > 0).map((h) => h.replace(/^#/, ""))
    : [];

  const post = await prisma.post.create({
    data: {
      title,
      caption: caption || null,
      hashtags,
      network,
      status: sendForApproval ? "PENDING_APPROVAL" : "DRAFT",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      clientId,
      media: {
        create: mediaUrls.map((url, i) => ({
          url,
          type: url.match(/\.(mp4|mov|avi)$/i) ? "video" : "image",
          order: i,
        })),
      },
    },
  });

  if (sendForApproval) {
    await prisma.approval.create({
      data: {
        postId: post.id,
        requestedById: session.user.id,
      },
    });
  }

  revalidatePath("/agency/calendar");
  revalidatePath("/agency/approvals");
  redirect(`/agency/posts/${post.id}`);
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  const title = formData.get("title") as string;
  const caption = formData.get("caption") as string;
  const hashtagsRaw = formData.get("hashtags") as string;
  const network = formData.get("network") as SocialNetwork;
  const scheduledAt = formData.get("scheduledAt") as string;
  const newMediaUrls = formData.getAll("newMediaUrls") as string[];

  const hashtags = hashtagsRaw
    ? hashtagsRaw.split(/[\s,]+/).filter((h) => h.replace("#", "").length > 0).map((h) => h.replace(/^#/, ""))
    : [];

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      caption: caption || null,
      hashtags,
      network,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      ...(newMediaUrls.length > 0 && {
        media: {
          create: newMediaUrls.map((url, i) => ({
            url,
            type: url.match(/\.(mp4|mov|avi)$/i) ? "video" : "image",
            order: i + 100,
          })),
        },
      }),
    },
  });

  revalidatePath(`/agency/posts/${postId}`);
  revalidatePath("/agency/calendar");
}

export async function submitForApproval(postId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.approval.findFirst({ where: { postId, status: "PENDING" } });
    if (!existing) {
      await tx.approval.create({ data: { postId, requestedById: session.user.id } });
    }
    await tx.post.update({ where: { id: postId }, data: { status: "PENDING_APPROVAL" } });
  });

  // Notificar usuários CLIENT do cliente vinculado ao post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, clientId: true },
  });
  if (post) {
    const clientUsers = await prisma.user.findMany({
      where: { clientId: post.clientId, isActive: true, role: "CLIENT" },
      select: { id: true },
    });
    for (const u of clientUsers) {
      notifyUser({
        userId: u.id,
        subject: "Novo post aguardando sua aprovação",
        body: `Um novo post foi enviado para aprovação: "${post.title}".\n\nAcesse o sistema para revisar e aprovar.`,
      }).catch(() => {});
    }
  }

  revalidatePath(`/agency/posts/${postId}`);
  revalidatePath("/agency/approvals");
}

export async function deletePostMedia(mediaId: string, postId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  const media = await prisma.postMedia.findUnique({
    where: { id: mediaId },
    include: { post: { select: { client: { select: { agencyId: true } } } } },
  });
  if (!media || media.post.client.agencyId !== session.user.agencyId) {
    throw new Error("Não autorizado");
  }

  await prisma.postMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/agency/posts/${postId}`);
}
