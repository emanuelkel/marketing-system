import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId ?? "" },
    select: {
      name: true, metaAppId: true, metaAppSecret: true, metaWebhookSecret: true,
      smtpHost: true, smtpPort: true, smtpUser: true,
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">{agency?.name}</p>
      </div>

      <SettingsForm defaultValues={{
        metaAppId: agency?.metaAppId ?? "",
        metaAppSecret: agency?.metaAppSecret ?? "",
        metaWebhookSecret: agency?.metaWebhookSecret ?? "",
        smtpHost: agency?.smtpHost ?? "",
        smtpPort: agency?.smtpPort?.toString() ?? "",
        smtpUser: agency?.smtpUser ?? "",
      }} />
    </div>
  );
}
