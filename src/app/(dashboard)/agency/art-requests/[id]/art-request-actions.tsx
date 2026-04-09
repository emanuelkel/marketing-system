"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { updateArtRequestStatus, addDeliverable } from "@/app/actions/art-requests";
import type { ArtRequestStatus } from "@prisma/client";

const NEXT_STATUSES: Partial<Record<ArtRequestStatus, { value: ArtRequestStatus; label: string; color: string }[]>> = {
  OPEN: [{ value: "IN_PROGRESS", label: "Iniciar", color: "bg-blue-600 hover:bg-blue-700 text-white" }],
  IN_PROGRESS: [{ value: "IN_REVIEW", label: "Enviar para revisão", color: "bg-yellow-500 hover:bg-yellow-600 text-white" }],
  IN_REVIEW: [
    { value: "APPROVED", label: "Aprovar", color: "bg-green-600 hover:bg-green-700 text-white" },
    { value: "REVISION_REQUESTED", label: "Solicitar revisão", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  ],
  REVISION_REQUESTED: [{ value: "IN_PROGRESS", label: "Retomar", color: "bg-blue-600 hover:bg-blue-700 text-white" }],
  APPROVED: [{ value: "DELIVERED", label: "Marcar como entregue", color: "bg-purple-600 hover:bg-purple-700 text-white" }],
};

export function ArtRequestActions({ requestId, currentStatus }: { requestId: string; currentStatus: ArtRequestStatus }) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextOptions = NEXT_STATUSES[currentStatus] ?? [];

  function changeStatus(status: ArtRequestStatus) {
    startTransition(() => updateArtRequestStatus(requestId, status, comment || undefined));
    setComment("");
  }

  async function handleDeliverable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "deliverables");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string };
      if (data.url) {
        await addDeliverable(requestId, data.url, file.name, file.type, file.size);
      }
    } finally {
      setUploading(false);
    }
  }

  if (nextOptions.length === 0 && currentStatus !== "IN_PROGRESS" && currentStatus !== "IN_REVIEW") return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Ações</h3>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Comentário opcional..."
        rows={2}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

      {nextOptions.map((opt) => (
        <button key={opt.value} onClick={() => changeStatus(opt.value)} disabled={isPending}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${opt.color}`}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {opt.label}
        </button>
      ))}

      {/* Upload deliverable */}
      {(currentStatus === "IN_PROGRESS" || currentStatus === "IN_REVIEW") && (
        <>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Enviando..." : "Enviar entregável"}
          </button>
          <input ref={fileRef} type="file" onChange={handleDeliverable} className="hidden"
            accept="image/*,video/*,application/pdf" />
        </>
      )}
    </div>
  );
}
