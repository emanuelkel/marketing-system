import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { formatDateTime, networkLabel } from "@/lib/utils";
import { ApprovalActions } from "./approval-actions";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const clientId = session?.user.clientId;
  const { id } = await params;

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      post: {
        include: {
          client: { select: { id: true } },
          media: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!approval || approval.post.client.id !== clientId) notFound();

  const post = approval.post;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/approvals" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{post.title}</h1>
          <p className="text-sm text-slate-500">{networkLabel(post.network)}</p>
        </div>
      </div>

      {/* Media */}
      {post.media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.media.map((m) => (
            <div key={m.id} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
              {m.type === "video" ? (
                <video src={m.url} controls className="w-full h-full object-cover" />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post info */}
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
      </div>

      {/* Actions — client component */}
      {approval.status === "PENDING" && (
        <ApprovalActions approvalId={id} />
      )}

      {approval.status !== "PENDING" && (
        <div className={`rounded-xl border p-4 text-sm font-medium text-center ${
          approval.status === "APPROVED" ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"
        }`}>
          {approval.status === "APPROVED" ? "✓ Você aprovou este post" : "↩ Você solicitou revisão"}
          {approval.comment && <p className="text-xs font-normal mt-1 opacity-75">{approval.comment}</p>}
        </div>
      )}
    </div>
  );
}
