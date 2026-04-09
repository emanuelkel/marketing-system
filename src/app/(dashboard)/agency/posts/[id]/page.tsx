import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Calendar } from "lucide-react";
import { formatDateTime, networkLabel, networkColor } from "@/lib/utils";
import { submitForApproval } from "@/app/actions/posts";
import { MediaPreview, EmptyMedia } from "@/components/posts/post-form";
import { PostComments } from "@/components/posts/post-comments";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  FAILED: "Falhou",
  ARCHIVED: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-indigo-100 text-indigo-700",
  FAILED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, agencyId: true } },
      media: { orderBy: { order: "asc" } },
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { reviewer: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!post || post.client.agencyId !== session?.user.agencyId) notFound();

  const canSendForApproval = post.status === "DRAFT" || post.status === "FAILED";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/agency/calendar" className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{post.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-500">{post.client.name}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${networkColor(post.network)}20`, color: networkColor(post.network) }}>
                {networkLabel(post.network)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>
                {STATUS_LABELS[post.status]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 pl-9 sm:pl-0">
          <Link href={`/agency/posts/${id}/edit`}
            className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Editar
          </Link>
          {canSendForApproval && (
            <form action={submitForApproval.bind(null, id)}>
              <button type="submit"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" />
                Enviar para aprovação
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-medium text-slate-700 mb-3">Mídia ({post.media.length})</h2>
          {post.media.length === 0 ? (
            <EmptyMedia />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {post.media.map((m) => (
                <MediaPreview key={m.id} url={m.url} type={m.type} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            {post.scheduledAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                Agendado para {formatDateTime(post.scheduledAt)}
              </div>
            )}

            {post.caption && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Legenda</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.caption}</p>
              </div>
            )}

            {post.hashtags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((h) => (
                    <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{h}</span>
                  ))}
                </div>
              </div>
            )}

            {post.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-medium text-red-700 mb-1">Erro na publicação</p>
                <p className="text-xs text-red-600">{post.errorMessage}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <PostComments postId={post.id} comments={post.comments} />

          {/* Approval history */}
          {post.approvals.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Histórico de aprovações</h3>
              <div className="space-y-3">
                {post.approvals.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      a.status === "APPROVED" ? "bg-green-500" :
                      a.status === "REVISION_REQUESTED" ? "bg-orange-500" : "bg-yellow-400"
                    }`} />
                    <div>
                      <span className="font-medium text-slate-700">
                        {a.status === "APPROVED" ? "Aprovado" : a.status === "REVISION_REQUESTED" ? "Revisão solicitada" : "Aguardando"}
                      </span>
                      {a.reviewer && <span className="text-slate-400"> por {a.reviewer.name}</span>}
                      {a.comment && <p className="text-slate-500 text-xs mt-0.5">{a.comment}</p>}
                      <p className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
