import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import type { InterWebhookPayload } from "@/lib/inter-api";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  let payload: InterWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.nossoNumero) {
    return NextResponse.json({ error: "nossoNumero ausente" }, { status: 400 });
  }

  // Busca invoice pelo nossoNumero
  const invoice = await prisma.invoice.findUnique({
    where: { nossoNumero: payload.nossoNumero },
    include: {
      subscription: {
        include: {
          plan: true,
          client: {
            include: {
              agency: {
                include: { interConfig: true, users: { where: { role: "ADMIN" }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    // Retorna 200 para evitar retries do Inter
    console.warn(`Inter webhook: nossoNumero ${payload.nossoNumero} não encontrado`);
    return NextResponse.json({ ok: true });
  }

  // Valida assinatura se webhookSecret estiver configurado
  const webhookSecret = invoice.subscription.client.agency.interConfig?.webhookSecret;
  if (webhookSecret) {
    const signature = req.headers.get("x-inter-hmac-sha256") ?? "";
    if (!verifySignature(body, signature, webhookSecret)) {
      console.warn("Inter webhook: assinatura inválida");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const adminUser = invoice.subscription.client.agency.users[0];
  const { client, plan } = invoice.subscription;
  const amountStr = Number(invoice.amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  switch (payload.situacao) {
    case "PAGO": {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: payload.dataHoraPagamento ? new Date(payload.dataHoraPagamento) : new Date(),
          paidAmount: payload.valorTotalRecebimento ?? invoice.amount,
        },
      });

      if (adminUser) {
        await prisma.notification.create({
          data: {
            channel: "EMAIL",
            subject: `Pagamento confirmado — ${client.name}`,
            body: `A fatura de ${amountStr} (${plan.name}) do cliente ${client.name} foi paga.`,
            userId: adminUser.id,
          },
        });
      }
      break;
    }

    case "CANCELADO": {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      break;
    }

    case "EXPIRADO":
    case "VENCIDO": {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "EXPIRED" },
      });

      if (adminUser) {
        await prisma.notification.create({
          data: {
            channel: "EMAIL",
            subject: `Fatura vencida sem pagamento — ${client.name}`,
            body: `A fatura de ${amountStr} (${plan.name}) do cliente ${client.name} venceu sem pagamento.`,
            userId: adminUser.id,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
