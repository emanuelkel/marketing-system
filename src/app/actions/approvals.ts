"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notifications";

export async function approvePost(approvalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") throw new Error("Não autorizado");

  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { post: { select: { id: true, scheduledAt: true, clientId: true } } },
  });
  if (!approval) throw new Error("Aprovação não encontrada");
  if (approval.post.clientId !== session.user.clientId) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: approvalId },
      data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() },
    });
    await tx.post.update({
      where: { id: approval.postId },
      data: { status: approval.post.scheduledAt ? "SCHEDULED" : "APPROVED" },
    });
  });

  // Notificar quem criou o post
  notifyUser({
    userId: approval.requestedById,
    subject: "Post aprovado pelo cliente",
    body: `O post foi aprovado.${approval.post.scheduledAt ? " Ele está agendado para publicação automática." : ""}`,
  }).catch(() => {});

  revalidatePath("/client/approvals");
  revalidatePath(`/client/approvals/${approvalId}`);
  revalidatePath("/agency/approvals");
}

export async function requestRevision(approvalId: string, comment: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") throw new Error("Não autorizado");

  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { post: { select: { id: true, clientId: true } } },
  });
  if (!approval) throw new Error("Aprovação não encontrada");
  if (approval.post.clientId !== session.user.clientId) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: approvalId },
      data: { status: "REVISION_REQUESTED", comment, reviewedById: session.user.id, reviewedAt: new Date() },
    });
    await tx.post.update({ where: { id: approval.postId }, data: { status: "DRAFT" } });
  });

  // Notificar quem criou o post
  notifyUser({
    userId: approval.requestedById,
    subject: "Revisão solicitada pelo cliente",
    body: `O cliente solicitou revisão no post.${comment ? `\n\nComentário: ${comment}` : ""}`,
  }).catch(() => {});

  revalidatePath("/client/approvals");
  revalidatePath(`/client/approvals/${approvalId}`);
  revalidatePath("/agency/approvals");
}
