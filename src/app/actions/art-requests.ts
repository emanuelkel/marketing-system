"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyUser } from "@/lib/notifications";
import type { ArtRequestStatus, ArtRequestType } from "@prisma/client";

export async function createArtRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  const clientId = (formData.get("clientId") as string) || session.user.clientId;
  const title = formData.get("title") as string;
  const type = formData.get("type") as ArtRequestType;
  const briefing = formData.get("briefing") as string;
  const format = formData.get("format") as string;
  const deadline = formData.get("deadline") as string;
  const priority = parseInt(formData.get("priority") as string) || 0;

  if (!clientId || !title || !type || !briefing) {
    throw new Error("Campos obrigatórios faltando");
  }

  const request = await prisma.artRequest.create({
    data: {
      title,
      type,
      briefing,
      format: format || null,
      deadline: deadline ? new Date(deadline) : null,
      priority,
      clientId,
      requestedById: session.user.id,
    },
  });

  const attachmentData = formData.getAll("attachments") as string[];
  if (attachmentData.length > 0) {
    const attachments = attachmentData.map((raw) => {
      const a = JSON.parse(raw) as { url: string; name: string; size: number; type: string };
      return { artRequestId: request.id, url: a.url, fileName: a.name, mimeType: a.type, sizeBytes: a.size };
    });
    await prisma.artRequestAttachment.createMany({ data: attachments });
  }

  // Notificar equipe da agência sobre nova solicitação
  const agencyUsers = await prisma.user.findMany({
    where: { agencyId: session.user.agencyId ?? "", isActive: true, role: { in: ["ADMIN", "EMPLOYEE"] } },
    select: { id: true },
  });
  for (const u of agencyUsers) {
    notifyUser({
      userId: u.id,
      subject: "Nova solicitação de arte",
      body: `Nova solicitação de arte recebida: "${title}".\n\nAcesse o sistema para ver os detalhes.`,
    }).catch(() => {});
  }

  revalidatePath("/agency/art-requests");
  revalidatePath("/client/art-requests");
  redirect(session.user.role === "CLIENT" ? `/client/art-requests` : `/agency/art-requests/${request.id}`);
}

export async function updateArtRequestStatus(requestId: string, status: ArtRequestStatus, comment?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  await prisma.artRequest.update({
    where: { id: requestId },
    data: { status },
  });

  if (comment) {
    await prisma.artRequestRevision.create({
      data: { artRequestId: requestId, comment, authorId: session.user.id },
    });
  }

  // Notificar cliente quando status muda para DELIVERED ou IN_REVIEW
  if (["DELIVERED", "IN_REVIEW", "REVISION_REQUESTED"].includes(status)) {
    const artReq = await prisma.artRequest.findUnique({
      where: { id: requestId },
      select: { title: true, clientId: true },
    });
    if (artReq) {
      const clientUsers = await prisma.user.findMany({
        where: { clientId: artReq.clientId, isActive: true, role: "CLIENT" },
        select: { id: true },
      });
      const statusMsg: Record<string, string> = {
        DELIVERED: "entregue",
        IN_REVIEW: "em revisão",
        REVISION_REQUESTED: "com revisão solicitada",
      };
      for (const u of clientUsers) {
        notifyUser({
          userId: u.id,
          subject: `Solicitação de arte atualizada`,
          body: `Sua solicitação de arte "${artReq.title}" está ${statusMsg[status] ?? status}.${comment ? `\n\nComentário: ${comment}` : ""}`,
        }).catch(() => {});
      }
    }
  }

  revalidatePath(`/agency/art-requests/${requestId}`);
  revalidatePath("/agency/art-requests");
}

export async function addDeliverable(requestId: string, url: string, fileName: string, mimeType: string, sizeBytes: number) {
  const existing = await prisma.artRequestDeliverable.findMany({ where: { artRequestId: requestId } });
  const version = existing.length + 1;

  await prisma.artRequestDeliverable.create({
    data: { artRequestId: requestId, url, fileName, mimeType, sizeBytes, version },
  });

  revalidatePath(`/agency/art-requests/${requestId}`);
}

export async function addAttachment(requestId: string, url: string, fileName: string, mimeType: string, sizeBytes: number) {
  await prisma.artRequestAttachment.create({
    data: { artRequestId: requestId, url, fileName, mimeType, sizeBytes },
  });
  revalidatePath(`/agency/art-requests/${requestId}`);
}
