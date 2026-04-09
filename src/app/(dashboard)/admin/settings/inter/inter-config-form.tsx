"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { saveInterConfig, testInterConnection } from "@/app/actions/billing";

interface Props {
  hasConfig: boolean;
  defaultClientId: string;
  defaultContaCorrente: string;
}

function MaskedInput({ name, placeholder, label }: { name: string; placeholder?: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder ?? "••••••••"}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function InterConfigForm({ hasConfig, defaultClientId, defaultContaCorrente }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveInterConfig(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      try {
        const result = await testInterConnection();
        setTestResult(result.ok ? "ok" : "fail");
      } catch {
        setTestResult("fail");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Credenciais OAuth2</h2>
          <p className="text-xs text-slate-400 mt-0.5">Obtidas no portal Inter Empresas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
          <input
            type="text"
            name="clientId"
            defaultValue={defaultClientId}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <MaskedInput name="clientSecret" label="Client Secret" />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Conta Corrente</label>
          <input
            type="text"
            name="contaCorrente"
            defaultValue={defaultContaCorrente}
            placeholder="123456789"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Certificado mTLS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cole o conteúdo dos arquivos convertidos para Base64</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Certificado (.crt) em Base64</label>
          <textarea
            name="certBase64"
            rows={4}
            required
            placeholder="Cole aqui o conteúdo do certificado .crt convertido em Base64..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chave Privada (.key) em Base64</label>
          <textarea
            name="keyBase64"
            rows={4}
            required
            placeholder="Cole aqui o conteúdo da chave privada .key convertida em Base64..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Webhook (opcional)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure no portal Inter: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/inter</span>
          </p>
        </div>
        <MaskedInput name="webhookSecret" label="Webhook Secret" placeholder="Segredo para validar requisições" />
      </div>

      <div className="flex gap-3">
        {hasConfig && (
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : testResult === "ok" ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : testResult === "fail" ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : null}
            {testResult === "ok" ? "Conexão OK!" : testResult === "fail" ? "Falha na conexão" : "Testar conexão"}
          </button>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar configurações
        </button>
      </div>
    </form>
  );
}
