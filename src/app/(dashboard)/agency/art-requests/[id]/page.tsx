import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Paperclip, ImageIcon, Clock } from "lucide-react";
import { formatDateTime, formatDate, priorityLabel } from "@/lib/utils";
import { ArtRequestActions } from "./art-request-actions";
import type { ArtRequestStatus } from "@prisma/client";

const STATUS_LABELS: Record<ArtRequestStatus, string> = {
  OPEN: "Aberto", IN_PROGRESS: "Em andamento", IN_REVIEW: "Em revisão",
  REVISION_REQUESTED: "Revisão solicitada", APPROVED: "Aprovado",
  DELIVERED: "Entregue", CANCELLED: "Cancelado",
};
const STATUS_COLORS: Record<ArtRequestStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700", IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700", REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700", DELIVERED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
};
const TYPE_LABELS: Record<string, string> = {
  POST: "Post", STORY: "Story", REEL: "Reel", BANNER: "Banner", CAROUSEL: "Carrossel", COVER: "Capa",
};

export default async function ArtRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const agencyId = session?.user.agencyId;
  const { id } = await params;

  const request = await prisma.artRequest.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, agencyId: true } },
      requestedBy: { select: { name: true } },
      attachments: true,
      deliverables: { orderBy: { version: "asc" } },
      revisions: { orderBy: { createdAt: "desc" }, include: { artRequest: { select: { id: true } } } },
    },
  });

  if (!request || request.client.agencyId !== agencyId) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/agency/art-requests" className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{request.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{request.client.name}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[request.type]}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[request.status]}`}>
                {STATUS_LABELS[request.status]}
              </span>
              {request.priority > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${request.priority >= 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                  {priorityLabel(request.priority)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Briefing */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Briefing</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.briefing}</p>
            {request.format && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Formato</p>
                <p className="text-sm text-slate-600">{request.format}</p>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Entregáveis ({request.deliverables.length})
              </h2>
            </div>
            {request.deliverables.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum entregável enviado ainda</p>
            ) : (
              <div className="space-y-2">
                {request.deliverables.map((d) => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                    <ImageIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{d.fileName}</p>
                      <p className="text-xs text-slate-400">v{d.version} · {formatDate(d.createdAt)}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Revisions */}
          {request.revisions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Histórico de revisões</h2>
              <div className="space-y-3">
                {request.revisions.map((r) => (
                  <div key={r.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700">{r.comment}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400">Solicitado por</p>
              <p className="text-sm text-slate-700 font-medium">{request.requestedBy.name}</p>
            </div>
            {request.deadline && (
              <div>
                <p className="text-xs text-slate-400">Prazo</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(request.deadline)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Criado em</p>
              <p className="text-sm text-slate-700">{formatDateTime(request.createdAt)}</p>
            </div>
          </div>

          {/* Attachments */}
          {request.attachments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Anexos ({request.attachments.length})
              </h3>
              <div className="space-y-2">
                {request.attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                    <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{a.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <ArtRequestActions requestId={id} currentStatus={request.status} />
        </div>
      </div>
    </div>
  );
}
