import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { createCobranca, getCobrancaPdfBase64, cancelarCobranca } from "@/lib/inter-api";
import { format, addMonths, setDate, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Next due date calculator ─────────────────────────────────────────────────

export function calcNextDueDate(billingDay: number, fromDate: Date = new Date()): Date {
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  // Tenta o vencimento no mês corrente
  let candidate = setDate(new Date(today.getFullYear(), today.getMonth(), 1), billingDay);

  // Se já passou, usa o próximo mês
  if (candidate <= today) {
    candidate = setDate(new Date(today.getFullYear(), today.getMonth() + 1, 1), billingDay);
  }

  return candidate;
}

export function calcGenerateDate(dueDate: Date, daysBeforeDue: number): Date {
  return subDays(dueDate, daysBeforeDue);
}

// ─── Generate invoice sequence number ────────────────────────────────────────

async function nextSeuNumero(agencySlug: string, referenceMonth: string): Promise<string> {
  const count = await prisma.invoice.count({
    where: {
      seuNumero: { startsWith: `INV-${agencySlug}-${referenceMonth.replace("-", "")}` },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${agencySlug.toUpperCase()}-${referenceMonth.replace("-", "")}-${seq}`;
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildBoletoEmail(params: {
  clientName: string;
  agencyName: string;
  planName: string;
  amount: number;
  dueDate: Date;
  referenceMonth: string;
  linhaDigitavel: string;
  pdfBase64: string;
}): { subject: string; html: string } {
  const dueDateStr = format(params.dueDate, "dd/MM/yyyy");
  const monthStr = format(
    new Date(params.referenceMonth + "-01"),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  );
  const amountStr = params.amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return {
    subject: `Fatura ${monthStr} — ${params.planName} — ${amountStr}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="background:#4f46e5;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px">${params.agencyName}</h1>
          <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">Fatura de serviço</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="color:#374151;font-size:16px;margin:0 0 8px">Olá, <strong>${params.clientName}</strong></p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Segue sua fatura referente ao mês de <strong>${monthStr}</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
            <tr>
              <td style="color:#6b7280;font-size:13px">Plano</td>
              <td align="right" style="color:#111827;font-size:13px;font-weight:600">${params.planName}</td>
            </tr>
            <tr><td colspan="2" style="padding:6px 0"></td></tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Vencimento</td>
              <td align="right" style="color:#111827;font-size:13px;font-weight:600">${dueDateStr}</td>
            </tr>
            <tr><td colspan="2" style="padding:6px 0"></td></tr>
            <tr style="border-top:1px solid #e5e7eb">
              <td style="color:#111827;font-size:15px;font-weight:700;padding-top:12px">Total</td>
              <td align="right" style="color:#4f46e5;font-size:18px;font-weight:700;padding-top:12px">${amountStr}</td>
            </tr>
          </table>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px">
            <p style="margin:0 0 4px;font-size:12px;color:#92400e;font-weight:600">LINHA DIGITÁVEL</p>
            <p style="margin:0;font-size:13px;color:#78350f;font-family:monospace;word-break:break-all">${params.linhaDigitavel}</p>
          </div>

          <p style="color:#6b7280;font-size:13px;margin:0 0 8px">
            O boleto completo está anexo a este email. Você também pode imprimir digitalizando o código de barras ou pagando pela linha digitável acima.
          </p>

          <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
            Em caso de dúvidas, entre em contato com ${params.agencyName}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

// ─── Core: generate and send invoice ─────────────────────────────────────────

export async function generateAndSendInvoice(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      client: {
        include: {
          agency: {
            include: { interConfig: true },
          },
        },
      },
    },
  });

  if (!subscription) throw new Error(`Subscription ${subscriptionId} não encontrada`);
  if (subscription.status !== "ACTIVE") throw new Error("Assinatura não está ativa");

  const { client, plan } = subscription;
  const { agency } = client;

  // Valida dados de billing do cliente
  if (!client.billingCpfCnpj || !client.billingEmail || !client.billingAddress ||
      !client.billingCity || !client.billingState || !client.billingZipCode) {
    throw new Error(`Dados de cobrança incompletos para o cliente ${client.name}. Preencha CPF/CNPJ, email e endereço.`);
  }

  if (!agency.interConfig) {
    throw new Error("Configuração do Banco Inter não encontrada para esta agência");
  }

  const dueDate = calcNextDueDate(subscription.billingDay);
  const referenceMonth = format(dueDate, "yyyy-MM");
  const seuNumero = await nextSeuNumero(agency.slug, referenceMonth);

  // Cria invoice no banco
  const invoice = await prisma.invoice.create({
    data: {
      seuNumero,
      status: "PENDING",
      amount: plan.price,
      dueDate,
      referenceMonth,
      subscriptionId,
    },
  });

  let nossoNumero: string | null = null;
  let linhaDigitavel = "";

  try {
    // Cria cobrança no Inter
    const cobranca = await createCobranca(agency.id, {
      seuNumero,
      valorNominal: Number(plan.price),
      dataVencimento: format(dueDate, "yyyy-MM-dd"),
      numDiasAgenda: 60,
      pagador: {
        cpfCnpj: client.billingCpfCnpj,
        tipoPessoa: (client.billingTipoPessoa ?? "JURIDICA") as "FISICA" | "JURIDICA",
        nome: client.name,
        email: client.billingEmail,
        endereco: client.billingAddress,
        cidade: client.billingCity,
        uf: client.billingState,
        cep: client.billingZipCode.replace(/\D/g, ""),
      },
      mensagem: {
        linha1: `${plan.name} — ${format(dueDate, "MMMM/yyyy", { locale: ptBR })}`,
      },
    });

    nossoNumero = cobranca.nossoNumero;
    linhaDigitavel = cobranca.linhaDigitavel;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        nossoNumero,
        status: "BOLETO_CREATED",
        boletoCreatedAt: new Date(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao criar cobrança no Inter";
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "CANCELLED", errorMessage: msg },
    });
    throw error;
  }

  // Busca PDF e envia email
  let pdfBase64 = "";
  try {
    pdfBase64 = await getCobrancaPdfBase64(agency.id, nossoNumero!);
  } catch {
    // PDF opcional — não bloqueia o envio do email com linha digitável
  }

  const emailTo = client.billingEmail;
  const { subject, html } = buildBoletoEmail({
    clientName: client.name,
    agencyName: agency.name,
    planName: plan.name,
    amount: Number(plan.price),
    dueDate,
    referenceMonth,
    linhaDigitavel,
    pdfBase64,
  });

  await sendMail({ to: emailTo, subject, html });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "SENT", sentAt: new Date() },
  });
}

// ─── Cancel pending invoices for a subscription ───────────────────────────────

export async function cancelPendingInvoices(
  subscriptionId: string,
  agencyId: string
): Promise<void> {
  const invoices = await prisma.invoice.findMany({
    where: {
      subscriptionId,
      status: { in: ["PENDING", "BOLETO_CREATED", "SENT"] },
    },
  });

  for (const invoice of invoices) {
    if (invoice.nossoNumero) {
      try {
        await cancelarCobranca(agencyId, invoice.nossoNumero);
      } catch {
        // Não bloqueia o cancelamento da assinatura
      }
    }
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }
}

// ─── Check if invoice should be generated today ───────────────────────────────

export function shouldGenerateToday(
  billingDay: number,
  daysBeforeDue: number,
  today: Date = new Date()
): boolean {
  const dueDate = calcNextDueDate(billingDay, today);
  const generateDate = calcGenerateDate(dueDate, daysBeforeDue);

  const todayStr = format(today, "yyyy-MM-dd");
  const generateStr = format(generateDate, "yyyy-MM-dd");

  return todayStr === generateStr;
}
