"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId || session.user.role !== "ADMIN") throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as UserRole;
  const phone = formData.get("phone") as string;
  const clientId = formData.get("clientId") as string;

  if (!name || !email || !password || !role) throw new Error("Campos obrigatórios faltando");
  if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email já cadastrado");

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      phone: phone || null,
      agencyId: session.user.agencyId,
      clientId: role === "CLIENT" && clientId ? clientId : null,
      isActive: true,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId || session.user.role !== "ADMIN") throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as UserRole;
  const phone = formData.get("phone") as string;
  const clientId = formData.get("clientId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!name || !email || !role) throw new Error("Campos obrigatórios faltando");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) throw new Error("Email já cadastrado por outro usuário");

  const data: Record<string, unknown> = {
    name,
    email,
    role,
    phone: phone || null,
    clientId: role === "CLIENT" && clientId ? clientId : null,
  };

  if (newPassword) {
    if (newPassword.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.agencyId || session.user.role !== "ADMIN") throw new Error("Não autorizado");
  if (userId === session.user.id) throw new Error("Não é possível desativar sua própria conta");

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
}
