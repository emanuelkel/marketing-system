"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { createArtRequest } from "@/app/actions/art-requests";

const TYPES = ["POST", "STORY", "REEL", "BANNER", "CAROUSEL", "COVER"];
const TYPE_LABELS: Record<string, string> = {
  POST: "Post", STORY: "Story", REEL: "Reel", BANNER: "Banner", CAROUSEL: "Carrossel", COVER: "Capa",
};

export default function NewArtRequestPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<{ url: string; name: string; size: number; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "attachments");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string };
      if (data.url) setAttachments((prev) => [...prev, { url: data.url!, name: file.name, size: file.size, type: file.type }]);
    }
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    attachments.forEach((a) => fd.append("attachments", JSON.stringify(a)));
    startTransition(async () => {
      try {
        await createArtRequest(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar solicitação");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/art-requests" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova solicitação de arte</h1>
          <p className="text-sm text-slate-500 mt-0.5">Envie um briefing para a agência</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de arte *</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <label key={t} className="relative">
                <input type="radio" name="type" value={t} required className="peer sr-only" />
                <span className="block border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 text-center cursor-pointer hover:border-indigo-300 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition-colors">
                  {TYPE_LABELS[t]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input type="text" name="title" required placeholder="Ex: Post lançamento produto X"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Briefing */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Briefing *</label>
          <textarea name="briefing" required rows={5}
            placeholder="Descreva detalhadamente o que precisa: cores, textos, referências, objetivo da peça..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Formato / Dimensões</label>
          <input type="text" name="format" placeholder="Ex: 1080x1080px, 9:16, A4..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
          <input type="date" name="deadline"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Referências visuais</label>
          {attachments.length > 0 && (
            <div className="space-y-1 mb-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span className="flex-1 truncate text-slate-600">{a.name}</span>
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Enviando..." : "Adicionar referências"}
          </button>
          <input ref={fileRef} type="file" multiple onChange={handleAttachment} className="hidden"
            accept="image/*,application/pdf" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar solicitação
          </button>
        </div>
      </form>
    </div>
  );
}
