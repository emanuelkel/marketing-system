import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Building2, MonitorSmartphone, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const clients = await prisma.client.findMany({
    where: { agencyId: agencyId ?? "" },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, posts: true, artRequests: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum cliente cadastrado</p>
          <p className="text-sm text-slate-400 mt-1">
            Comece adicionando seu primeiro cliente.
          </p>
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar cliente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      backgroundColor:
                        (client.brandColors as { primary?: string })?.primary ?? "#6366f1",
                    }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    {client.instagramHandle && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MonitorSmartphone className="w-3 h-3" />
                        @{client.instagramHandle}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    client.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {client.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    {client._count.users}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Usuários
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    {client._count.posts}
                  </p>
                  <p className="text-xs text-slate-400">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    {client._count.artRequests}
                  </p>
                  <p className="text-xs text-slate-400">Artes</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                Desde {formatDate(client.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
