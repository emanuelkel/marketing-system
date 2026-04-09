import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Users, Calendar, Palette, BarChart2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const [clientCount, userCount, postCount, requestCount] = await Promise.all([
    prisma.client.count({ where: { agencyId: agencyId ?? "" } }),
    prisma.user.count({ where: { agencyId: agencyId ?? "" } }),
    prisma.post.count({
      where: { client: { agencyId: agencyId ?? "" } },
    }),
    prisma.artRequest.count({
      where: {
        client: { agencyId: agencyId ?? "" },
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
    }),
  ]);

  const stats = [
    { label: "Clientes ativos", value: clientCount, icon: Building2, color: "bg-indigo-100 text-indigo-700" },
    { label: "Usuários", value: userCount, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Posts criados", value: postCount, icon: Calendar, color: "bg-green-100 text-green-700" },
    { label: "Solicitações abertas", value: requestCount, icon: Palette, color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bem-vindo, {session?.user.name}!
        </p>
      </div>

      <div className="flex justify-end">
        <Link href="/admin/analytics"
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          <BarChart2 className="w-4 h-4" />
          Ver analytics completo
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
