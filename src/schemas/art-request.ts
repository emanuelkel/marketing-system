import { z } from "zod";

export const artRequestSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(150),
  type: z.enum(["POST", "STORY", "REEL", "BANNER", "CAROUSEL", "COVER"]),
  briefing: z.string().min(20, "Briefing deve ter pelo menos 20 caracteres").max(5000),
  format: z.string().max(20).optional().or(z.literal("")),
  deadline: z.coerce.date().optional(),
  priority: z.number().int().min(0).max(2).default(0),
  clientId: z.string().min(1),
  attachmentUrls: z.array(z.string()).max(10).default([]),
});

export type ArtRequestInput = z.infer<typeof artRequestSchema>;

export const artRequestStatusSchema = z.object({
  id: z.string(),
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "IN_REVIEW",
    "REVISION_REQUESTED",
    "APPROVED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export type ArtRequestStatusInput = z.infer<typeof artRequestStatusSchema>;
