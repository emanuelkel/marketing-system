"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

export async function createClient(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const instagramHandle = formData.get("instagramHandle") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;
  const timezone = (formData.get("timezone") as string) || "America/Sao_Paulo";
  const primaryColor = (formData.get("primaryColor") as string) || "#6366f1";

  if (!name) throw new Error("Nome obrigatório");

  const slug = slugify(name);

  const client = await prisma.client.create({
    data: {
      name,
      slug: `${slug}-${Date.now()}`,
      instagramHandle: instagramHandle || null,
      whatsappNumber: whatsappNumber || null,
      timezone,
      brandColors: { primary: primaryColor },
      agencyId: session.user.agencyId,
    },
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const instagramHandle = formData.get("instagramHandle") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;
  const timezone = formData.get("timezone") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const isActive = formData.get("isActive") === "true";

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      instagramHandle: instagramHandle || null,
      whatsappNumber: whatsappNumber || null,
      timezone,
      isActive,
      brandColors: { primary: primaryColor || "#6366f1" },
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function updateAgencySettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.agencyId) throw new Error("Não autorizado");

  const metaAppId = formData.get("metaAppId") as string;
  const metaAppSecret = formData.get("metaAppSecret") as string;
  const metaWebhookSecret = formData.get("metaWebhookSecret") as string;
  const smtpHost = formData.get("smtpHost") as string;
  const smtpPort = formData.get("smtpPort") as string;
  const smtpUser = formData.get("smtpUser") as string;
  const smtpPass = formData.get("smtpPass") as string;

  await prisma.agency.update({
    where: { id: session.user.agencyId },
    data: {
      metaAppId: metaAppId || null,
      metaAppSecret: metaAppSecret || null,
      metaWebhookSecret: metaWebhookSecret || null,
      smtpHost: smtpHost || null,
      smtpPort: smtpPort ? parseInt(smtpPort) : null,
      smtpUser: smtpUser || null,
      smtpPass: smtpPass || null,
    },
  });

  revalidatePath("/admin/settings");
}
