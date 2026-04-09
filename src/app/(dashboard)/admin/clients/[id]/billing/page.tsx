import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientBillingForm } from "./client-billing-form";
import { SubscriptionPanel } from "./subscription-panel";
import { InvoicesList } from "./invoices-list";
import { calcNextDueDate } from "@/lib/billing";

export default async function ClientBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, agencyId },
  });
  if (!client) notFound();

  const plans = await prisma.plan.findMany({
    where: { agencyId, isActive: true },
    orderBy: { price: "asc" },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { clientId: id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { subscription: { clientId: id } },
    orderBy: { dueDate: "desc" },
    take: 20,
  });

  const nextDue = subscription?.status === "ACTIVE"
    ? calcNextDueDate(subscription.billingDay)
    : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/clients/${id}`} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cobrança — {client.name}</h1>
            <p className="text-sm text-slate-500">Gerencie assinatura e faturas</p>
          </div>
        </div>
      </div>

      {/* Dados de cobrança */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Dados de cobrança</h2>
        <ClientBillingForm
          clientId={id}
          defaultValues={{
            billingCpfCnpj: client.billingCpfCnpj ?? "",
            billingTipoPessoa: (client.billingTipoPessoa ?? "JURIDICA") as "FISICA" | "JURIDICA",
            billingEmail: client.billingEmail ?? "",
            billingAddress: client.billingAddress ?? "",
            billingCity: client.billingCity ?? "",
            billingState: client.billingState ?? "",
            billingZipCode: client.billingZipCode ?? "",
          }}
        />
      </div>

      {/* Assinatura */}
      <SubscriptionPanel
        clientId={id}
        subscription={subscription ? {
          id: subscription.id,
          status: subscription.status,
          billingDay: subscription.billingDay,
          daysBeforeDue: subscription.daysBeforeDue,
          planName: subscription.plan.name,
          planPrice: Number(subscription.plan.price),
          nextDue: nextDue?.toISOString() ?? null,
        } : null}
        plans={plans.map(p => ({ id: p.id, name: p.name, price: Number(p.price) }))}
      />

      {/* Histórico de faturas */}
      <InvoicesList invoices={invoices.map(inv => ({
        id: inv.id,
        seuNumero: inv.seuNumero,
        status: inv.status,
        amount: Number(inv.amount),
        dueDate: inv.dueDate.toISOString(),
        referenceMonth: inv.referenceMonth,
        paidAt: inv.paidAt?.toISOString() ?? null,
        sentAt: inv.sentAt?.toISOString() ?? null,
        errorMessage: inv.errorMessage ?? null,
      }))} />
    </div>
  );
}
