import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/posts/post-form";
import { createPost } from "@/app/actions/posts";

export default async function NewPostPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const clients = await prisma.client.findMany({
    where: { agencyId: agencyId ?? "", isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo post</h1>
        <p className="text-sm text-slate-500 mt-1">Crie um post para agendar nas redes sociais</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <PostForm clients={clients} action={createPost} />
      </div>
    </div>
  );
}
