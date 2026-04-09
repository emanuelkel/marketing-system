import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Palette, CheckSquare, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function AgencyDashboardPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const [postsToday, pendingApprovals, openRequests, scheduledNext7Days] =
    await Promise.all([
      prisma.post.count({
        where: {
          client: { agencyId: agencyId ?? "" },
          scheduledAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.approval.count({
        where: {
          status: "PENDING",
          post: { client: { agencyId: agencyId ?? "" } },
        },
      }),
      prisma.artRequest.count({
        where: {
          client: { agencyId: agencyId ?? "" },
          status: "OPEN",
        },
      }),
      prisma.post.count({
        where: {
          client: { agencyId: agencyId ?? "" },
          status: "SCHEDULED",
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const recentRequests = await prisma.artRequest.findMany({
    where: {
      client: { agencyId: agencyId ?? "" },
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      priority: true,
      deadline: true,
      client: { select: { name: true } },
    },
  });

  const stats = [
    { label: "Posts hoje", value: postsToday, icon: Calendar, href: "/agency/calendar", color: "bg-blue-100 text-blue-700" },
    { label: "Aprovações pendentes", value: pendingApprovals, icon: CheckSquare, href: "/agency/approvals", color: "bg-yellow-100 text-yellow-700" },
    { label: "Solicitações abertas", value: openRequests, icon: Palette, href: "/agency/art-requests", color: "bg-purple-100 text-purple-700" },
    { label: "Agendados (7 dias)", value: scheduledNext7Days, icon: Clock, href: "/agency/calendar", color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>
          {formatDate(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent Art Requests */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Solicitações recentes</h2>
          <Link
            href="/agency/art-requests"
            className="text-sm text-indigo-600 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentRequests.length === 0 ? (
            <p className="p-5 text-sm text-slate-400 text-center">
              Nenhuma solicitação aberta
            </p>
          ) : (
            recentRequests.map((req) => (
              <Link
                key={req.id}
                href={`/agency/art-requests/${req.id}`}
                className="flex items-start justify-between p-4 gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {req.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {req.client.name} · {req.type}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                  {req.priority > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${req.priority >= 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                      {req.priority >= 2 ? "Crítico" : "Urgente"}
                    </span>
                  )}
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {req.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
