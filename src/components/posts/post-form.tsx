"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface PostFormProps {
  clients: Client[];
  defaultClientId?: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  showApprovalToggle?: boolean;
}

const NETWORKS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "INSTAGRAM_REEL", label: "Instagram Reels" },
  { value: "INSTAGRAM_STORY", label: "Instagram Story" },
  { value: "FACEBOOK", label: "Facebook" },
];

export function PostForm({ clients, defaultClientId, action, submitLabel = "Salvar rascunho", showApprovalToggle = true }: PostFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [sendForApproval, setSendForApproval] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "posts");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) uploaded.push(data.url);
        else setError(data.error ?? "Erro no upload");
      }
      setMediaUrls((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Falha ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      mediaUrls.forEach((url) => fd.append("mediaUrls", url));
      fd.set("sendForApproval", sendForApproval ? "true" : "false");
      await action(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Client */}
      {clients.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
          <select name="clientId" defaultValue={defaultClientId} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Selecione...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      {clients.length === 1 && (
        <input type="hidden" name="clientId" value={clients[0].id} />
      )}

      {/* Network */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rede social *</label>
        <div className="grid grid-cols-2 gap-2">
          {NETWORKS.map((n) => (
            <label key={n.value} className="relative">
              <input type="radio" name="network" value={n.value} required className="peer sr-only" />
              <span className="block border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-pointer hover:border-indigo-300 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition-colors">
                {n.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
        <input type="text" name="title" required placeholder="Nome interno do post"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Legenda</label>
        <textarea name="caption" rows={4} placeholder="Texto do post..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Hashtags</label>
        <input type="text" name="hashtags" placeholder="#marketing #socialmedia (separados por espaço ou vírgula)"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Scheduled date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Data de agendamento</label>
        <input type="datetime-local" name="scheduledAt"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Media upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Mídia</label>
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors",
            uploading && "opacity-50 cursor-not-allowed"
          )}>
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          <span className="text-sm">{uploading ? "Enviando..." : "Clique para adicionar imagens ou vídeos"}</span>
          <span className="text-xs">JPG, PNG, WebP, MP4 — máx. 50MB por arquivo</span>
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4,video/quicktime"
          onChange={handleFileChange} className="hidden" />
      </div>

      {/* Send for approval toggle */}
      {showApprovalToggle && (
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <input type="checkbox" id="sendForApproval" checked={sendForApproval}
            onChange={(e) => setSendForApproval(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="sendForApproval" className="text-sm">
            <span className="font-medium text-slate-900">Enviar para aprovação</span>
            <span className="block text-slate-500 text-xs mt-0.5">O cliente receberá uma notificação para revisar o post</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={submitting || uploading}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {sendForApproval ? "Enviar para aprovação" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function MediaPreview({ url, type }: { url: string; type: string }) {
  if (type === "video") {
    return (
      <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center">
        <video src={url} className="w-full h-full object-cover rounded-lg" controls />
      </div>
    );
  }
  return (
    <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      <img src={url} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

export function EmptyMedia() {
  return (
    <div className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2">
      <ImageIcon className="w-8 h-8" />
      <span className="text-xs">Sem mídia</span>
    </div>
  );
}
