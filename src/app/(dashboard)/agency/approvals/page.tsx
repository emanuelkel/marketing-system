import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime, networkLabel, networkColor } from "@/lib/utils";
import { CheckSquare, Image as ImageIcon } from "lucide-react";

export default async function AgencyApprovalsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const approvals = await prisma.approval.findMany({
    where: {
      status: "PENDING",
      post: { client: { agencyId: agencyId ?? "" } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          network: true,
          scheduledAt: true,
          caption: true,
          media: { take: 1, orderBy: { order: "asc" }, select: { url: true, type: true } },
          client: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aprovações pendentes</h1>
          <p className="text-sm text-slate-500 mt-1">Posts aguardando aprovação dos clientes</p>
        </div>
        <span className="text-sm font-medium text-slate-500">
          {approvals.length} pendente{approvals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma aprovação pendente</p>
          <p className="text-sm text-slate-400 mt-1">Todos os posts foram revisados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(({ id, post, createdAt }) => (
            <Link key={id} href={`/agency/posts/${post.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:border-indigo-300 hover:shadow-sm transition-all">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                {post.media[0] ? (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{post.title}</p>
                    <p className="text-xs text-slate-500">{post.client.name}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: `${networkColor(post.network)}15`, color: networkColor(post.network) }}>
                    {networkLabel(post.network)}
                  </span>
                </div>

                {post.caption && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{post.caption}</p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
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
