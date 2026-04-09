import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSendInvoice, shouldGenerateToday } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const results = { processed: 0, generated: 0, failed: 0, skipped: 0 };

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      client: { isActive: true },
    },
    include: {
      client: { select: { id: true, name: true, billingCpfCnpj: true } },
    },
  });

  for (const subscription of subscriptions) {
    results.processed++;

    try {
      // Verifica se deve gerar hoje
      if (!shouldGenerateToday(subscription.billingDay, subscription.daysBeforeDue, today)) {
        results.skipped++;
        continue;
      }

      // Verifica se já existe invoice ativa para o período
      const { format } = await import("date-fns");
      const { calcNextDueDate } = await import("@/lib/billing");
      const dueDate = calcNextDueDate(subscription.billingDay, today);
      const referenceMonth = format(dueDate, "yyyy-MM");

      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: subscription.id,
          referenceMonth,
          status: { in: ["PENDING", "BOLETO_CREATED", "SENT", "PAID"] },
        },
      });

      if (existingInvoice) {
        results.skipped++;
        continue;
      }

      await generateAndSendInvoice(subscription.id);
      results.generated++;
    } catch (error) {
      console.error(`Erro ao gerar fatura para subscription ${subscription.id} (cliente: ${subscription.client.name}):`, error);
      results.failed++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
