import { NextRequest, NextResponse } from "next/server";
import { createHmac, createVerify, X509Certificate } from "crypto";
import { prisma } from "@/lib/prisma";
import type { InterWebhookPayload } from "@/lib/inter-api";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

// Verifica se o certificado do cliente (enviado pelo Inter via mTLS) é válido
// e foi emitido pela CA do Inter. Em produção, isso é feito pelo proxy reverso,
// mas validamos aqui também via header x-ssl-client-cert quando disponível.
function verifyInterCACert(clientCertHeader: string | null): boolean {
  const caCertBase64 = process.env.INTER_CA_CERT_BASE64;
  if (!caCertBase64 || !clientCertHeader) return true; // sem CA configurada, skip

  try {
    const caCertPem = Buffer.from(caCertBase64, "base64").toString("utf8");
    const clientCertPem = decodeURIComponent(clientCertHeader);
    const caCert = new X509Certificate(caCertPem);
    const clientCert = new X509Certificate(clientCertPem);
    return clientCert.verify(caCert.publicKey);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Valida certificado do cliente Inter (quando proxy repassa via header)
  const clientCert = req.headers.get("x-ssl-client-cert");
  if (!verifyInterCACert(clientCert)) {
    console.warn("Inter webhook: certificado do cliente inválido");
    return NextResponse.json({ error: "Invalid client certificate" }, { status: 403 });
  }

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
