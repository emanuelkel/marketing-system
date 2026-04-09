"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { createSubscription, cancelSubscription, generateInvoiceManually } from "@/app/actions/billing";
import { format } from "date-fns";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Subscription {
  id: string;
  status: string;
  billingDay: number;
  daysBeforeDue: number;
  planName: string;
  planPrice: number;
  nextDue: string | null;
}

interface Props {
  clientId: string;
  subscription: Subscription | null;
  plans: Plan[];
}

export function SubscriptionPanel({ clientId, subscription, plans }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    startTransition(async () => {
      try {
        await createSubscription(fd);
        setSuccess("Assinatura criada com sucesso!");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar assinatura");
      }
    });
  }

  function handleCancel() {
    if (!subscription) return;
    if (!confirm("Cancelar a assinatura? As faturas pendentes serão canceladas.")) return;
    setError("");
    startTransition(async () => {
      try {
        await cancelSubscription(subscription.id);
        setSuccess("Assinatura cancelada.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cancelar");
      }
    });
  }

  function handleGenerate() {
    if (!subscription) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        await generateInvoiceManually(subscription.id);
        setSuccess("Fatura gerada e enviada por email!");
        setTimeout(() => setSuccess(""), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao gerar fatura");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Assinatura</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

      {!subscription || subscription.status === "CANCELLED" ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-slate-500">
            {subscription?.status === "CANCELLED" ? "Assinatura cancelada. Crie uma nova:" : "Nenhuma assinatura ativa. Crie uma:"}
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plano *</label>
            <select
              name="planId"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecione um plano...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dia de vencimento</label>
              <input
                type="number"
                name="billingDay"
                min={1}
                max={28}
                defaultValue={10}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">Entre 1 e 28</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gerar boleto X dias antes</label>
              <input
                type="number"
                name="daysBeforeDue"
                min={1}
                max={30}
                defaultValue={5}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar assinatura
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-0.5">Plano</p>
              <p className="font-medium text-slate-900">{subscription.planName}</p>
              <p className="text-sm text-slate-600">
                {subscription.planPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-0.5">Vencimento</p>
              <p className="font-medium text-slate-900">Todo dia {subscription.billingDay}</p>
              <p className="text-sm text-slate-600">
                Boleto {subscription.daysBeforeDue} dias antes
              </p>
            </div>
          </div>

          {subscription.nextDue && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700">
              Próxima fatura prevista: <strong>{format(new Date(subscription.nextDue), "dd/MM/yyyy")}</strong>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-1.5 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 text-indigo-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Gerar fatura agora
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancelar assinatura
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
