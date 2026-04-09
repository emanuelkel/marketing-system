"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!name) throw new Error("Nome obrigatório");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) throw new Error("Usuário não encontrado");

  const data: Record<string, unknown> = { name, phone: phone || null };

  if (newPassword) {
    if (newPassword.length < 6) throw new Error("Nova senha deve ter pelo menos 6 caracteres");
    if (!currentPassword) throw new Error("Informe a senha atual para alterar a senha");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash ?? "");
    if (!valid) throw new Error("Senha atual incorreta");
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({ where: { id: session.user.id }, data });
  revalidatePath("/profile");
}
