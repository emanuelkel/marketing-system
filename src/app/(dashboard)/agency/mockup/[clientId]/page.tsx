import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InstagramFeed } from "@/components/mockup/instagram-feed";
import { getInstagramProfile, getInstagramMedia } from "@/lib/meta-api";
import { notFound } from "next/navigation";

export default async function MockupEditorPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await auth();
  const agencyId = session?.user.agencyId;
  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: agencyId ?? "" },
    select: {
      id: true,
      name: true,
      instagramHandle: true,
      logoUrl: true,
    },
  });

  if (!client) notFound();

  const [posts, instagramProfile, realMedia] = await Promise.all([
    prisma.post.findMany({
      where: {
        clientId,
        status: { notIn: ["ARCHIVED", "CANCELLED"] as never[] },
        network: { in: ["INSTAGRAM", "INSTAGRAM_REEL"] },
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        network: true,
        status: true,
        position: true,
        scheduledAt: true,
        media: {
          orderBy: { order: "asc" },
          select: { url: true, type: true, order: true },
          take: 1,
        },
      },
    }),
    getInstagramProfile(clientId),
    getInstagramMedia(clientId),
  ]);

  const realPosts = realMedia.map((item, idx) => ({
    id: `ig_${item.id}`,
    title: item.caption?.slice(0, 60) ?? "Post publicado",
    network: "INSTAGRAM" as const,
    isRealPost: true as const,
    position: 9999 + idx,
    mediaUrl: item.mediaUrl,
    media: [] as Array<{ url: string; type: string; order: number }>,
  }));

  const allPosts = [...posts, ...realPosts];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
          Mockup do Feed — {client.name}
        </h1>
        {client.instagramHandle && (
          <p className="text-sm text-slate-500">@{client.instagramHandle}</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <InstagramFeed
            posts={allPosts}
            handle={client.instagramHandle ?? undefined}
            logoUrl={client.logoUrl ?? undefined}
            profile={instagramProfile}
          />
        </div>

        <div className="w-full lg:w-64 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">
              Legenda de status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-600">Rascunho</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-slate-600">Aguardando aprovação</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-600">Agendado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-slate-600">Publicado</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-1">
              Total de posts
            </h3>
            <p className="text-2xl font-bold text-slate-900">{allPosts.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
