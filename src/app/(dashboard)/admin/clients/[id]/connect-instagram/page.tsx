import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, ExternalLink } from "lucide-react";

export default async function ConnectInstagramPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const agencyId = session?.user.agencyId;
  const { id } = await params;

  const [client, agency] = await Promise.all([
    prisma.client.findFirst({ where: { id, agencyId: agencyId ?? "" }, select: { id: true, name: true } }),
    prisma.agency.findUnique({ where: { id: agencyId ?? "" }, select: { metaAppId: true } }),
  ]);

  if (!client) notFound();

  const appId = agency?.metaAppId ?? process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL ?? process.env.AUTH_URL}/api/meta/callback`;
  const scope = "instagram_basic,instagram_content_publish,pages_read_engagement";
  const state = Buffer.from(JSON.stringify({ clientId: id, agencyId })).toString("base64");

  const oauthUrl = appId
    ? `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`
    : null;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/clients/${id}`} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Conectar Instagram</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{client.name}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Conecte a conta do Instagram Business para permitir publicação automática de posts.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-700">O que será autorizado:</p>
          <ul className="space-y-1 list-disc list-inside text-slate-500">
            <li>Publicar fotos e vídeos</li>
            <li>Publicar carrosséis</li>
            <li>Ler métricas básicas da conta</li>
          </ul>
        </div>

        {!appId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            <strong>Atenção:</strong> Configure o Meta App ID nas{" "}
            <Link href="/admin/settings" className="underline">Configurações</Link> antes de continuar.
          </div>
        )}

        {oauthUrl ? (
          <a href={oauthUrl}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-opacity">
            <Camera className="w-5 h-5" />
            Autorizar com Facebook/Instagram
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>
        ) : (
          <button disabled
            className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed">
            Configure o App ID primeiro
          </button>
        )}
      </div>
    </div>
  );
}
