import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/users/user-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewUserPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";

  const clients = await prisma.client.findMany({
    where: { agencyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo usuário</h1>
          <p className="text-sm text-slate-500 mt-0.5">Adicionar membro à equipe ou usuário cliente</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UserForm mode="create" clients={clients} />
      </div>
    </div>
  );
}
