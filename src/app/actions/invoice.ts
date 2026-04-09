"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getInvoicesForClient(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  // ADMIN/EMPLOYEE: verifica agência
  if (session.user.role !== "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { id: clientId, agencyId: session.user.agencyId ?? "" },
    });
    if (!client) throw new Error("Cliente não encontrado");
  } else {
    // CLIENT: só pode ver suas próprias faturas
    if (session.user.clientId !== clientId) throw new Error("Não autorizado");
  }

  return prisma.invoice.findMany({
    where: { subscription: { clientId } },
    include: { subscription: { include: { plan: { select: { name: true } } } } },
    orderBy: { dueDate: "desc" },
  });
}

export async function getClientSubscription(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  if (session.user.role === "CLIENT" && session.user.clientId !== clientId) {
    throw new Error("Não autorizado");
  }

  return prisma.subscription.findFirst({
    where: { clientId, status: "ACTIVE" },
    include: { plan: true },
  });
}
