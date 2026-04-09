import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
    select: { name: true, email: true, phone: true, role: true },
  });
  if (!user) return null;

  const ROLE_LABELS = { ADMIN: "Administrador", EMPLOYEE: "Equipe", CLIENT: "Cliente" };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu perfil</h1>
        <p className="text-sm text-slate-500 mt-1">{ROLE_LABELS[user.role]} · {user.email}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ProfileForm defaultValues={{ name: user.name, phone: user.phone ?? "" }} />
      </div>
    </div>
  );
}
