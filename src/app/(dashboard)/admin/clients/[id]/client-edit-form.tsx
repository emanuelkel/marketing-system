"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateClient } from "@/app/actions/clients";

interface Props {
  clientId: string;
  defaultValues: {
    name: string;
    instagramHandle: string;
    whatsappNumber: string;
    timezone: string;
    primaryColor: string;
    isActive: boolean;
  };
}

export function ClientEditForm({ clientId, defaultValues }: Props) {
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
        await updateClient(clientId, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">Salvo com sucesso!</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
        <input type="text" name="name" required defaultValue={defaultValues.name}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
          <input type="text" name="instagramHandle" defaultValue={defaultValues.instagramHandle}
            className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
        <input type="text" name="whatsappNumber" defaultValue={defaultValues.whatsappNumber}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cor da marca</label>
        <div className="flex items-center gap-3">
          <input type="color" name="primaryColor" defaultValue={defaultValues.primaryColor}
            className="w-10 h-10 rounded border border-slate-200 cursor-pointer" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isActive" id="isActive" value="true" defaultChecked={defaultValues.isActive}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="isActive" className="text-sm text-slate-700">Cliente ativo</label>
      </div>
      <input type="hidden" name="timezone" value={defaultValues.timezone} />

      <button type="submit" disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar alterações
      </button>
    </form>
  );
}
