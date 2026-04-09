"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateClientBillingData } from "@/app/actions/billing";

interface Props {
  clientId: string;
  defaultValues: {
    billingCpfCnpj: string;
    billingTipoPessoa: "FISICA" | "JURIDICA";
    billingEmail: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingZipCode: string;
  };
}

export function ClientBillingForm({ clientId, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateClientBillingData(clientId, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Dados salvos!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de pessoa *</label>
          <select
            name="billingTipoPessoa"
            defaultValue={defaultValues.billingTipoPessoa}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="JURIDICA">Jurídica</option>
            <option value="FISICA">Física</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ *</label>
          <input
            type="text"
            name="billingCpfCnpj"
            defaultValue={defaultValues.billingCpfCnpj}
            placeholder="Somente números"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email para receber boletos *</label>
        <input
          type="email"
          name="billingEmail"
          defaultValue={defaultValues.billingEmail}
          placeholder="financeiro@empresa.com"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço *</label>
        <input
          type="text"
          name="billingAddress"
          defaultValue={defaultValues.billingAddress}
          placeholder="Rua das Flores, 123, Sala 45"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Cidade *</label>
          <input
            type="text"
            name="billingCity"
            defaultValue={defaultValues.billingCity}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">UF *</label>
          <input
            type="text"
            name="billingState"
            defaultValue={defaultValues.billingState}
            maxLength={2}
            placeholder="SP"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CEP *</label>
          <input
            type="text"
            name="billingZipCode"
            defaultValue={defaultValues.billingZipCode}
            placeholder="01310-100"
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
        Salvar dados de cobrança
      </button>
    </form>
  );
}
