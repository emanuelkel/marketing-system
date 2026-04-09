"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPostComment(postId: string, body: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
  if (!body.trim()) throw new Error("Comentário não pode ser vazio");

  await prisma.postComment.create({
    data: { postId, body: body.trim(), authorId: session.user.id },
  });

  revalidatePath(`/agency/posts/${postId}`);
}
