import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  instagramHandle: z.string().max(50).optional().or(z.literal("")),
  facebookPageId: z.string().max(50).optional().or(z.literal("")),
  whatsappNumber: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Número inválido")
    .optional()
    .or(z.literal("")),
  timezone: z.string().default("America/Sao_Paulo"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  brandColors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
    })
    .optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
