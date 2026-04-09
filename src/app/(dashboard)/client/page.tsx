import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Palette, CheckSquare, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user.clientId;

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Conta não vinculada a um cliente.</p>
      </div>
    );
  }

  const [pendingApprovals, openRequests, scheduledPosts, client] =
    await Promise.all([
      prisma.approval.count({
        where: { status: "PENDING", post: { clientId } },
      }),
      prisma.artRequest.count({
        where: { clientId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      }),
      prisma.post.count({
        where: { clientId, status: "SCHEDULED" },
      }),
      prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true, instagramHandle: true },
      }),
    ]);

  const stats = [
    { label: "Posts agendados", value: scheduledPosts, icon: Calendar, href: "/client/calendar", color: "bg-blue-100 text-blue-700" },
    { label: "Aprovações pendentes", value: pendingApprovals, icon: CheckSquare, href: "/client/approvals", color: "bg-yellow-100 text-yellow-700" },
    { label: "Minhas solicitações", value: openRequests, icon: Palette, href: "/client/art-requests", color: "bg-purple-100 text-purple-700" },
  ];

  const recentApprovals = await prisma.approval.findMany({
    where: { status: "PENDING", post: { clientId } },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      post: {
        select: {
          id: true,
          title: true,
          network: true,
          scheduledAt: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {session?.user.name}!
        </h1>
        <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>
          {client?.name} · {formatDate(new Date(), "EEEE, dd 'de' MMMM")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/client/art-requests/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-5 flex items-center gap-4 transition-colors"
        >
          <Palette className="w-6 h-6" />
          <div>
            <p className="font-semibold">Nova solicitação de arte</p>
            <p className="text-sm text-indigo-200">Envie um briefing para a agência</p>
          </div>
        </Link>

        <Link
          href="/client/mockup"
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl p-5 flex items-center gap-4 transition-colors"
        >
          <MonitorSmartphone className="w-6 h-6" />
          <div>
            <p className="font-semibold">Ver mockup do feed</p>
            <p className="text-sm text-slate-400">
              {client?.instagramHandle ? `@${client.instagramHandle}` : "Visualizar seu feed"}
            </p>
          </div>
        </Link>
      </div>

      {/* Pending approvals */}
      {recentApprovals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              Aguardando sua aprovação
            </h2>
            <Link
              href="/client/approvals"
              className="text-sm text-indigo-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentApprovals.map(({ id, post }) => (
              <Link
                key={id}
                href={`/client/approvals/${id}`}
                className="flex items-start justify-between p-4 gap-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{post.title}</p>
                  <p className="text-xs text-slate-500">
                    {post.network} {post.scheduledAt ? `· ${formatDate(post.scheduledAt)}` : ""}
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Aguardando
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
