import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, Mail, Pencil, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", EMPLOYEE: "Equipe", CLIENT: "Cliente" };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700",
  EMPLOYEE: "bg-blue-100 text-blue-700",
  CLIENT: "bg-slate-100 text-slate-600",
};

export default async function UsersPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const users = await prisma.user.findMany({
    where: { agencyId: agencyId ?? "" },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      client: { select: { name: true } },
    },
  });

  const clientUsers = await prisma.user.findMany({
    where: { client: { agencyId: agencyId ?? "" }, agencyId: null },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      client: { select: { name: true } },
    },
  });

  const allUsers = [...users, ...clientUsers];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">{allUsers.length} usuário{allUsers.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/users/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" />
          Novo usuário
        </Link>
      </div>

      {allUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum usuário</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {allUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  {!user.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                  <Mail className="w-3 h-3" />
                  {user.email}
                  {user.client && <span className="ml-2">· {user.client.name}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block flex-shrink-0">{formatDate(user.createdAt)}</p>
              <Link href={`/admin/users/${user.id}`}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0">
                <Pencil className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
