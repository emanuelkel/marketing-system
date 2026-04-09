import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterConfigForm } from "./inter-config-form";

export default async function InterSettingsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const config = await prisma.interConfig.findUnique({
    where: { agencyId: agencyId ?? "" },
    select: { clientId: true, contaCorrente: true, isActive: true, webhookSecret: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Banco Inter</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure a integração com o Banco Inter para emissão automática de boletos
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Como obter as credenciais</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Acesse o Internet Banking do Inter Empresas</li>
          <li>Vá em <strong>Soluções para empresas → APIs</strong></li>
          <li>Crie uma nova integração com permissão <strong>cobrança</strong></li>
          <li>Baixe o certificado (.crt) e a chave privada (.key)</li>
          <li>Converta para Base64: <code className="bg-blue-100 px-1 rounded">base64 -w 0 &lt; arquivo.crt</code></li>
        </ol>
      </div>

      <InterConfigForm hasConfig={!!config} defaultClientId={config?.clientId ?? ""} defaultContaCorrente={config?.contaCorrente ?? ""} />
    </div>
  );
}
