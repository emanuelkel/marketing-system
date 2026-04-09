import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditCard, FileText, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcNextDueDate } from "@/lib/billing";

export default async function ClientBillingPage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/client");

  const clientId = session.user.clientId;

  const subscription = await prisma.subscription.findFirst({
    where: { clientId, status: "ACTIVE" },
    include: { plan: true },
  });

  const invoices = await prisma.invoice.findMany({
    where: { subscription: { clientId } },
    orderBy: { dueDate: "desc" },
    take: 24,
  });

  const nextDue = subscription ? calcNextDueDate(subscription.billingDay) : null;

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    PENDING: { label: "Processando", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-slate-100 text-slate-500" },
    BOLETO_CREATED: { label: "Aguardando pagamento", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-blue-100 text-blue-700" },
    SENT: { label: "Aguardando pagamento", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-indigo-100 text-indigo-700" },
    PAID: { label: "Pago", icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-green-100 text-green-700" },
    OVERDUE: { label: "Vencido", icon: <AlertCircle className="w-3.5 h-3.5" />, className: "bg-orange-100 text-orange-700" },
    CANCELLED: { label: "Cancelado", icon: <XCircle className="w-3.5 h-3.5" />, className: "bg-slate-100 text-slate-400" },
    EXPIRED: { label: "Expirado", icon: <AlertCircle className="w-3.5 h-3.5" />, className: "bg-red-100 text-red-600" },
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-slate-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minha assinatura</h1>
          <p className="text-sm text-slate-500">Acompanhe seu plano e suas faturas</p>
        </div>
      </div>

      {/* Plano atual */}
      {subscription ? (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
          <p className="text-indigo-200 text-sm mb-1">Plano atual</p>
          <h2 className="text-xl font-bold">{subscription.plan.name}</h2>
          <p className="text-3xl font-bold mt-2">
            {Number(subscription.plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            <span className="text-indigo-300 text-base font-normal">/mês</span>
          </p>
          <div className="mt-4 pt-4 border-t border-indigo-500 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-indigo-300">Vencimento</p>
              <p className="font-medium">Todo dia {subscription.billingDay}</p>
            </div>
            {nextDue && (
              <div>
                <p className="text-indigo-300">Próxima fatura</p>
                <p className="font-medium">{format(nextDue, "dd/MM/yyyy")}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma assinatura ativa</p>
          <p className="text-sm text-slate-400 mt-1">Entre em contato com sua agência</p>
        </div>
      )}

      {/* Histórico de faturas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Histórico de faturas</h2>

        {invoices.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma fatura emitida ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const st = statusConfig[inv.status] ?? statusConfig.PENDING;
              const monthStr = format(new Date(inv.referenceMonth + "-02"), "MMMM/yyyy", { locale: ptBR });
              const amountStr = Number(inv.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
              const isPending = ["BOLETO_CREATED", "SENT"].includes(inv.status);

              return (
                <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isPending ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{monthStr}</p>
                    <p className="text-xs text-slate-400">
                      Venc. {format(new Date(inv.dueDate), "dd/MM/yyyy")}
                      {inv.paidAt && ` · Pago em ${format(new Date(inv.paidAt), "dd/MM/yyyy")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{amountStr}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                      {st.icon}
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Dúvidas sobre cobranças? Entre em contato com sua agência.
      </p>
    </div>
  );
}
