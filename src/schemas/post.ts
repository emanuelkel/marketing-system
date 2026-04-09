import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(100),
  caption: z.string().max(2200).optional().or(z.literal("")),
  hashtags: z.array(z.string().max(50)).max(30).default([]),
  network: z.enum(["INSTAGRAM", "FACEBOOK", "INSTAGRAM_STORY", "INSTAGRAM_REEL"]),
  scheduledAt: z.coerce.date().optional(),
  clientId: z.string().min(1, "Cliente obrigatório"),
  socialAccountId: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  isCarousel: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
});

export type PostInput = z.infer<typeof postSchema>;

export const postUpdateSchema = postSchema.partial().extend({
  id: z.string(),
});

export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
