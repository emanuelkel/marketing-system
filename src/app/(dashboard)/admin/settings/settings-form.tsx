"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { updateAgencySettings } from "@/app/actions/clients";

interface Props {
  defaultValues: {
    metaAppId: string; metaAppSecret: string; metaWebhookSecret: string;
    smtpHost: string; smtpPort: string; smtpUser: string;
  };
}

function MaskedInput({ name, defaultValue, placeholder }: { name: string; defaultValue: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} name={name} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function SettingsForm({ defaultValues }: Props) {
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
        await updateAgencySettings(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">Configurações salvas!</div>}

      {/* Meta API */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Meta / Facebook API</h2>
          <p className="text-xs text-slate-400 mt-0.5">Necessário para publicação automática no Instagram e Facebook</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">App ID</label>
          <input type="text" name="metaAppId" defaultValue={defaultValues.metaAppId} placeholder="123456789"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">App Secret</label>
          <MaskedInput name="metaAppSecret" defaultValue={defaultValues.metaAppSecret} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Secret</label>
          <MaskedInput name="metaWebhookSecret" defaultValue={defaultValues.metaWebhookSecret} placeholder="••••••••" />
        </div>
      </div>

      {/* SMTP */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Email (SMTP)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Para envio de notificações por email</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Servidor SMTP</label>
            <input type="text" name="smtpHost" defaultValue={defaultValues.smtpHost} placeholder="smtp.gmail.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Porta</label>
            <input type="number" name="smtpPort" defaultValue={defaultValues.smtpPort} placeholder="587"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
          <input type="email" name="smtpUser" defaultValue={defaultValues.smtpUser} placeholder="email@exemplo.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
          <MaskedInput name="smtpPass" defaultValue="" placeholder="••••••••" />
        </div>
      </div>

      <button type="submit" disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar configurações
      </button>
    </form>
  );
}
