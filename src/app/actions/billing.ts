"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { encrypt } from "@/lib/crypto";
import { cancelPendingInvoices, generateAndSendInvoice, calcNextDueDate } from "@/lib/billing";
import { testConnection } from "@/lib/inter-api";
import { planSchema, subscriptionSchema, clientBillingSchema, interConfigSchema } from "@/schemas/billing";
import { addMonths } from "date-fns";

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function createPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.plan.create({
    data: {
      ...parsed.data,
      agencyId: session.user.agencyId,
    },
  });

  revalidatePath("/admin/billing/plans");
}

export async function updatePlan(planId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const plan = await prisma.plan.findFirst({
    where: { id: planId, agencyId: session.user.agencyId },
  });
  if (!plan) throw new Error("Plano não encontrado");

  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.plan.update({
    where: { id: planId },
    data: parsed.data,
  });

  revalidatePath("/admin/billing/plans");
}

export async function togglePlanActive(planId: string) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const plan = await prisma.plan.findFirst({
    where: { id: planId, agencyId: session.user.agencyId },
  });
  if (!plan) throw new Error("Plano não encontrado");

  await prisma.plan.update({
    where: { id: planId },
    data: { isActive: !plan.isActive },
  });

  revalidatePath("/admin/billing/plans");
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function createSubscription(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { clientId, planId, billingDay, daysBeforeDue } = parsed.data;

  // Verifica se o cliente pertence à agência
  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: session.user.agencyId },
  });
  if (!client) throw new Error("Cliente não encontrado");

  // Verifica dados de billing
  if (!client.billingCpfCnpj || !client.billingEmail) {
    throw new Error("Preencha os dados de cobrança do cliente (CPF/CNPJ e email) antes de criar uma assinatura");
  }

  // Verifica se já existe assinatura ativa
  const existing = await prisma.subscription.findFirst({
    where: { clientId, status: "ACTIVE" },
  });
  if (existing) throw new Error("Cliente já possui uma assinatura ativa");

  const now = new Date();
  const periodStart = now;
  const periodEnd = addMonths(now, 1);

  await prisma.subscription.create({
    data: {
      clientId,
      planId,
      billingDay,
      daysBeforeDue,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/billing`);
  revalidatePath("/admin/billing/subscriptions");
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      client: { agencyId: session.user.agencyId },
    },
    include: { client: true },
  });
  if (!subscription) throw new Error("Assinatura não encontrada");

  // Cancela invoices pendentes no Inter
  await cancelPendingInvoices(subscriptionId, session.user.agencyId);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath(`/admin/clients/${subscription.clientId}/billing`);
  revalidatePath("/admin/billing/subscriptions");
}

export async function generateInvoiceManually(subscriptionId: string) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      client: { agencyId: session.user.agencyId },
    },
  });
  if (!subscription) throw new Error("Assinatura não encontrada");
  if (subscription.status !== "ACTIVE") throw new Error("Assinatura não está ativa");

  await generateAndSendInvoice(subscriptionId);

  revalidatePath(`/admin/clients/${subscription.clientId}/billing`);
}

export async function resendInvoiceEmail(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      subscription: { client: { agencyId: session.user.agencyId } },
    },
    include: {
      subscription: {
        include: {
          plan: true,
          client: { include: { agency: true } },
        },
      },
    },
  });
  if (!invoice) throw new Error("Fatura não encontrada");
  if (!invoice.nossoNumero) throw new Error("Boleto ainda não foi gerado");

  const { client, plan } = invoice.subscription;
  if (!client.billingEmail) throw new Error("Email de cobrança não configurado");

  const { sendMail } = await import("@/lib/mailer");
  const { getCobrancaPdfBase64 } = await import("@/lib/inter-api");
  const { format } = await import("date-fns");
  const { ptBR } = await import("date-fns/locale");

  let pdfBase64 = "";
  try {
    pdfBase64 = await getCobrancaPdfBase64(client.agency.id, invoice.nossoNumero);
  } catch {
    // PDF opcional
  }

  const amountStr = Number(invoice.amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const monthStr = format(new Date(invoice.referenceMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR });

  await sendMail({
    to: client.billingEmail,
    subject: `[Reenvio] Fatura ${monthStr} — ${plan.name} — ${amountStr}`,
    html: `<p>Segue o reenvio da fatura ${monthStr}. Consulte sua fatura no portal ou entre em contato conosco.</p>`,
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT", sentAt: new Date() },
  });

  revalidatePath(`/admin/clients/${client.id}/billing`);
}

// ─── Client billing data ──────────────────────────────────────────────────────

export async function updateClientBillingData(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: session.user.agencyId },
  });
  if (!client) throw new Error("Cliente não encontrado");

  const parsed = clientBillingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.client.update({
    where: { id: clientId },
    data: parsed.data,
  });

  revalidatePath(`/admin/clients/${clientId}/billing`);
}

// ─── Inter config ─────────────────────────────────────────────────────────────

export async function saveInterConfig(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const parsed = interConfigSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { clientSecret, keyBase64, ...rest } = parsed.data;

  const data = {
    ...rest,
    clientSecret: encrypt(clientSecret),
    keyBase64: encrypt(keyBase64),
    agencyId: session.user.agencyId,
  };

  await prisma.interConfig.upsert({
    where: { agencyId: session.user.agencyId },
    create: data,
    update: data,
  });

  revalidatePath("/admin/settings/inter");
}

export async function testInterConnection(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const ok = await testConnection(session.user.agencyId);
  return ok ? { ok: true } : { ok: false, error: "Falha na autenticação. Verifique as credenciais e o certificado." };
}
