import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ClientEditForm } from "./client-edit-form";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const agencyId = session?.user.agencyId;
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, agencyId: agencyId ?? "" },
    include: {
      _count: { select: { posts: true, artRequests: true, users: true } },
    },
  });

  if (!client) notFound();

  const recentPosts = await prisma.post.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, status: true, network: true, createdAt: true },
  });

  const primaryColor = (client.brandColors as { primary?: string })?.primary ?? "#6366f1";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/clients" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: primaryColor }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
            {client.instagramHandle && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />@{client.instagramHandle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Posts", value: client._count.posts },
          { label: "Solicitações", value: client._count.artRequests },
          { label: "Usuários", value: client._count.users },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Dados do cliente</h2>
            <ClientEditForm clientId={id} defaultValues={{
              name: client.name,
              instagramHandle: client.instagramHandle ?? "",
              whatsappNumber: client.whatsappNumber ?? "",
              timezone: client.timezone,
              primaryColor,
              isActive: client.isActive,
            }} />
          </div>
        </div>

        {/* Recent posts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Posts recentes</h2>
              <Link href={`/agency/calendar?clientId=${id}`} className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum post</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.map((p) => (
                  <Link key={p.id} href={`/agency/posts/${p.id}`}
                    className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.network} · {formatDate(p.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Instagram connection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
            <h2 className="font-semibold text-slate-900 mb-2">Meta / Instagram</h2>
            {client.instagramAccountId ? (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Conta conectada
                {client.metaTokenExpiry && (
                  <span className="text-xs text-slate-400 ml-1">Expira {formatDate(client.metaTokenExpiry)}</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Conta não conectada</p>
                <Link href={`/admin/clients/${id}/connect-instagram`}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  <Camera className="w-4 h-4" />
                  Conectar Instagram
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
