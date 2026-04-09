import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcNextDueDate } from "@/lib/billing";

export default async function SubscriptionsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";

  const subscriptions = await prisma.subscription.findMany({
    where: { client: { agencyId } },
    include: {
      client: { select: { id: true, name: true } },
      plan: { select: { name: true, price: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabel: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Ativa", className: "bg-green-100 text-green-700" },
    SUSPENDED: { label: "Suspensa", className: "bg-yellow-100 text-yellow-700" },
    CANCELLED: { label: "Cancelada", className: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assinaturas</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhe as assinaturas de todos os clientes</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma assinatura encontrada</p>
          <p className="text-sm text-slate-400 mt-1">
            Crie assinaturas na página de cada cliente
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Plano</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Próx. boleto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Faturas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subscriptions.map((sub) => {
                const st = statusLabel[sub.status] ?? statusLabel.CANCELLED;
                const nextDue = sub.status === "ACTIVE" ? calcNextDueDate(sub.billingDay) : null;
                const amount = Number(sub.plan.price).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                });
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${sub.client.id}/billing`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {sub.client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{sub.plan.name}</div>
                      <div className="text-xs text-slate-400">{amount}/mês</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Dia {sub.billingDay}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {nextDue ? format(nextDue, "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub._count.invoices}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
