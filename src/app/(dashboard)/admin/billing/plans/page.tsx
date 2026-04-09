import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { PlanCard } from "./plan-card";

export default async function PlansPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";

  const plans = await prisma.plan.findMany({
    where: { agencyId },
    include: {
      _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const cycleLabel: Record<string, string> = {
    MONTHLY: "Mensal",
    QUARTERLY: "Trimestral",
    YEARLY: "Anual",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planos</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os planos de serviço para seus clientes</p>
        </div>
        <Link
          href="/admin/billing/plans/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo plano
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum plano criado</p>
          <p className="text-sm text-slate-400 mt-1">Crie seu primeiro plano para começar a cobrar clientes</p>
          <Link
            href="/admin/billing/plans/new"
            className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar plano
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              description={plan.description ?? ""}
              price={Number(plan.price)}
              cycle={cycleLabel[plan.cycle] ?? plan.cycle}
              activeSubscriptions={plan._count.subscriptions}
              isActive={plan.isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
