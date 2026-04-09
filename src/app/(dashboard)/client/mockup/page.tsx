import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InstagramFeed } from "@/components/mockup/instagram-feed";
import { getInstagramProfile, getInstagramMedia } from "@/lib/meta-api";

export default async function ClientMockupPage() {
  const session = await auth();
  const clientId = session?.user.clientId;

  if (!clientId) return null;

  const [client, instagramProfile, posts, realMedia] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true, instagramHandle: true, logoUrl: true },
    }),
    getInstagramProfile(clientId),
    prisma.post.findMany({
      where: {
        clientId,
        network: { in: ["INSTAGRAM", "INSTAGRAM_REEL"] },
        status: { notIn: ["ARCHIVED"] as never[] },
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        network: true,
        status: true,
        position: true,
        media: {
          take: 1,
          orderBy: { order: "asc" },
          select: { url: true, type: true, order: true },
        },
      },
    }),
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
        <h1 className="text-2xl font-bold text-slate-900">Seu Feed do Instagram</h1>
        <p className="text-sm text-slate-500">
          Veja como seu perfil vai ficar com os posts planejados.
        </p>
      </div>

      <InstagramFeed
        posts={allPosts}
        handle={client?.instagramHandle ?? undefined}
        logoUrl={client?.logoUrl ?? undefined}
        profile={instagramProfile}
      />
    </div>
  );
}
