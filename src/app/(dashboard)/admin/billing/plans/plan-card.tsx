"use client";

import { useTransition } from "react";
import { Users, Loader2 } from "lucide-react";
import { togglePlanActive } from "@/app/actions/billing";

interface Props {
  id: string;
  name: string;
  description: string;
  price: number;
  cycle: string;
  activeSubscriptions: number;
  isActive: boolean;
}

export function PlanCard({ id, name, description, price, cycle, activeSubscriptions, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`bg-white rounded-xl border p-5 space-y-3 ${isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{name}</h3>
          {description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{description}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {isActive ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900">
          {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        <span className="text-sm text-slate-400">/{cycle.toLowerCase()}</span>
      </div>

      <div className="flex items-center gap-1 text-sm text-slate-500">
        <Users className="w-3.5 h-3.5" />
        <span>{activeSubscriptions} assinante{activeSubscriptions !== 1 ? "s" : ""} ativo{activeSubscriptions !== 1 ? "s" : ""}</span>
      </div>

      <button
        onClick={() => startTransition(() => togglePlanActive(id))}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-1.5 text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
      >
        {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        {isActive ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}
