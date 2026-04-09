"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createPlan } from "@/app/actions/billing";

export function NewPlanForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createPlan(fd);
        router.push("/admin/billing/plans");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar plano");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do plano *</label>
        <input
          type="text"
          name="name"
          required
          placeholder="ex: Plano Gestão de Redes Sociais"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Descrição opcional do plano..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
          <input
            type="text"
            name="price"
            required
            placeholder="ex: 500,00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ciclo *</label>
          <select
            name="cycle"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="MONTHLY">Mensal</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Criar plano
        </button>
      </div>
    </form>
  );
}
