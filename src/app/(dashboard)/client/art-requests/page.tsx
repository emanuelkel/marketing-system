import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Palette } from "lucide-react";
import { formatDate, priorityLabel } from "@/lib/utils";
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

export default async function ClientArtRequestsPage() {
  const session = await auth();
  const clientId = session?.user.clientId;

  const requests = await prisma.artRequest.findMany({
    where: { clientId: clientId ?? "" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, title: true, type: true, status: true, priority: true,
      deadline: true, createdAt: true,
      _count: { select: { deliverables: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas artes</h1>
          <p className="text-sm text-slate-500 mt-1">{requests.length} solicitaç{requests.length !== 1 ? "ões" : "ão"}</p>
        </div>
        <Link href="/client/art-requests/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Nova solicitação
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Palette className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma solicitação ainda</p>
          <p className="text-sm text-slate-400 mt-1">Envie um briefing para a agência criar suas artes.</p>
          <Link href="/client/art-requests/new"
            className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Nova solicitação
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[req.type]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                  {req.priority > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${req.priority >= 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                      {priorityLabel(req.priority)}
                    </span>
                  )}
                </div>
                <p className="font-medium text-slate-900">{req.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-400">
                  {req.deadline && <span>Prazo: {formatDate(req.deadline)}</span>}
                  {req._count.deliverables > 0 && <span>{req._count.deliverables} entregável{req._count.deliverables !== 1 ? "is" : ""}</span>}
                  <span>{formatDate(req.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
