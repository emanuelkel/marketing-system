"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Loader2 } from "lucide-react";
import { approvePost, requestRevision } from "@/app/actions/approvals";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRevision, setShowRevision] = useState(false);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<"approved" | "revision" | null>(null);

  function handleApprove() {
    startTransition(async () => {
      await approvePost(approvalId);
      setDone("approved");
      setTimeout(() => router.push("/client/approvals"), 1500);
    });
  }

  function handleRevision() {
    if (!comment.trim()) return;
    startTransition(async () => {
      await requestRevision(approvalId, comment);
      setDone("revision");
      setTimeout(() => router.push("/client/approvals"), 1500);
    });
  }

  if (done === "approved") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-700">Post aprovado!</p>
        <p className="text-sm text-green-600 mt-1">Redirecionando...</p>
      </div>
    );
  }

  if (done === "revision") {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
        <RotateCcw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
        <p className="font-semibold text-orange-700">Revisão solicitada!</p>
        <p className="text-sm text-orange-600 mt-1">Redirecionando...</p>
      </div>
    );
  }

  if (showRevision) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Solicitar revisão</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva o que precisa ser alterado..."
          rows={4}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={() => setShowRevision(false)}
            className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleRevision} disabled={isPending || !comment.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => setShowRevision(true)}
        className="flex items-center justify-center gap-2 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-medium py-3 px-4 rounded-xl transition-colors">
        <RotateCcw className="w-4 h-4" />
        Solicitar revisão
      </button>
      <button onClick={handleApprove} disabled={isPending}
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-colors">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Aprovar
      </button>
    </div>
  );
}
