"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/app/actions/clients";

export default function NewClientPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await createClient(fd); }
      catch (err) { setError(err instanceof Error ? err.message : "Erro ao criar cliente"); }
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/clients" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input type="text" name="name" required placeholder="Nome da empresa"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
            <input type="text" name="instagramHandle" placeholder="handle"
              className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
          <input type="text" name="whatsappNumber" placeholder="+55 11 99999-9999"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cor da marca</label>
          <div className="flex items-center gap-3">
            <input type="color" name="primaryColor" defaultValue="#6366f1"
              className="w-10 h-10 rounded border border-slate-200 cursor-pointer" />
            <span className="text-sm text-slate-500">Cor principal da marca</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar cliente
          </button>
        </div>
      </form>
    </div>
  );
}
