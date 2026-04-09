import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  price: z
    .string()
    .transform((v) => parseFloat(v.replace(",", ".")))
    .refine((v) => !isNaN(v) && v > 0, "Valor inválido"),
  cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
});

export const subscriptionSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório"),
  planId: z.string().min(1, "Plano obrigatório"),
  billingDay: z
    .string()
    .transform((v) => parseInt(v))
    .refine((v) => v >= 1 && v <= 28, "Dia de vencimento deve ser entre 1 e 28"),
  daysBeforeDue: z
    .string()
    .transform((v) => parseInt(v))
    .refine((v) => v >= 1 && v <= 30, "Deve ser entre 1 e 30 dias"),
});

export const clientBillingSchema = z.object({
  billingCpfCnpj: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, "CPF (11 dígitos) ou CNPJ (14 dígitos) sem pontuação"),
  billingTipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  billingEmail: z.string().email("Email inválido"),
  billingAddress: z.string().min(5, "Endereço muito curto").max(200),
  billingCity: z.string().min(2, "Cidade obrigatória").max(100),
  billingState: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  billingZipCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 01310-100 ou 01310100)"),
});

export const interConfigSchema = z.object({
  clientId: z.string().min(1, "Client ID obrigatório"),
  clientSecret: z.string().min(1, "Client Secret obrigatório"),
  certBase64: z.string().min(10, "Certificado (.crt) obrigatório"),
  keyBase64: z.string().min(10, "Chave privada (.key) obrigatória"),
  contaCorrente: z.string().min(1, "Conta corrente obrigatória"),
  webhookSecret: z.string().optional(),
});

export type PlanFormData = z.input<typeof planSchema>;
export type SubscriptionFormData = z.input<typeof subscriptionSchema>;
export type ClientBillingFormData = z.infer<typeof clientBillingSchema>;
export type InterConfigFormData = z.input<typeof interConfigSchema>;
