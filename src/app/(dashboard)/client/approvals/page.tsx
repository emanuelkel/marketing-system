import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime, networkLabel, networkColor } from "@/lib/utils";
import { CheckSquare, Image as ImageIcon } from "lucide-react";

export default async function ClientApprovalsPage() {
  const session = await auth();
  const clientId = session?.user.clientId;

  const approvals = await prisma.approval.findMany({
    where: { status: "PENDING", post: { clientId: clientId ?? "" } },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          network: true,
          scheduledAt: true,
          caption: true,
          media: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aprovações</h1>
        <p className="text-sm text-slate-500 mt-1">Posts aguardando sua aprovação</p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma aprovação pendente</p>
          <p className="text-sm text-slate-400 mt-1">Você está em dia! Nenhum post aguardando revisão.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(({ id, post, createdAt }) => (
            <Link key={id} href={`/client/approvals/${id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                {post.media[0] ? (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900 truncate">{post.title}</p>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                    Pendente
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{networkLabel(post.network)}</p>
                {post.caption && <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{post.caption}</p>}
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                  {post.scheduledAt && <span>Agendado: {formatDateTime(post.scheduledAt)}</span>}
                  <span>Enviado: {formatDateTime(createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
