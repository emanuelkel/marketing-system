"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

interface Props {
  defaultValues: { name: string; phone: string };
}

export function ProfileForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProfile(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Perfil atualizado!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input type="text" name="name" required defaultValue={defaultValues.name}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
          <input type="text" name="phone" defaultValue={defaultValues.phone} placeholder="+55 11 99999-9999"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Alterar senha <span className="font-normal text-slate-400">(opcional)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha atual</label>
            <input type="password" name="currentPassword" placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
            <input type="password" name="newPassword" placeholder="Mínimo 6 caracteres"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isPending}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar alterações
      </button>
    </form>
  );
}
