import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/users/user-form";
import { ToggleActiveButton } from "./toggle-active-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";

  const [user, clients] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id,
        OR: [{ agencyId }, { client: { agencyId } }],
      },
      select: { id: true, name: true, email: true, role: true, phone: true, clientId: true, isActive: true },
    }),
    prisma.client.findMany({
      where: { agencyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar usuário</h1>
          <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UserForm
          mode="edit"
          userId={user.id}
          clients={clients}
          defaultValues={{
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone ?? "",
            clientId: user.clientId ?? "",
          }}
        />
      </div>

      {session?.user.id !== user.id && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Status da conta</h2>
          <ToggleActiveButton userId={user.id} isActive={user.isActive} />
        </div>
      )}
    </div>
  );
}
