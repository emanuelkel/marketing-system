import axios, { AxiosInstance } from "axios";
import https from "https";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

const INTER_BASE_URL = "https://cdpj.partners.bancointer.com.br";
const TOKEN_URL = `${INTER_BASE_URL}/oauth/v2/token`;

// ─── Token cache ──────────────────────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

// ─── HTTPS Agent cache ────────────────────────────────────────────────────────

const agentCache = new Map<string, https.Agent>();

function buildHttpsAgent(certBase64: string, keyBase64: string): https.Agent {
  return new https.Agent({
    cert: Buffer.from(certBase64, "base64").toString("utf8"),
    key: Buffer.from(keyBase64, "base64").toString("utf8"),
    rejectUnauthorized: true,
  });
}

// ─── Inter config loader ──────────────────────────────────────────────────────

interface InterConfig {
  clientId: string;
  clientSecret: string;
  certBase64: string;
  keyBase64: string;
  contaCorrente: string;
  webhookSecret: string | null;
  agencyId: string;
}

async function getInterConfig(agencyId: string): Promise<InterConfig> {
  const config = await prisma.interConfig.findUnique({
    where: { agencyId },
  });
  if (!config || !config.isActive) {
    throw new Error("Configuração do Banco Inter não encontrada ou inativa para esta agência");
  }
  return {
    clientId: config.clientId,
    clientSecret: decrypt(config.clientSecret),
    certBase64: config.certBase64,
    keyBase64: decrypt(config.keyBase64),
    contaCorrente: config.contaCorrente,
    webhookSecret: config.webhookSecret,
    agencyId,
  };
}

// ─── Token management ─────────────────────────────────────────────────────────

async function getAccessToken(config: InterConfig): Promise<string> {
  const cached = tokenCache.get(config.agencyId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const agent = getOrCreateAgent(config);
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "cobranca.write cobranca.read",
  });

  const response = await axios.post<{ access_token: string; expires_in: number }>(
    TOKEN_URL,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpsAgent: agent,
    }
  );

  const ttl = (response.data.expires_in - 100) * 1000;
  tokenCache.set(config.agencyId, {
    token: response.data.access_token,
    expiresAt: Date.now() + ttl,
  });

  return response.data.access_token;
}

function getOrCreateAgent(config: InterConfig): https.Agent {
  const cacheKey = config.agencyId;
  if (!agentCache.has(cacheKey)) {
    agentCache.set(cacheKey, buildHttpsAgent(config.certBase64, config.keyBase64));
  }
  return agentCache.get(cacheKey)!;
}

// ─── Axios instance factory ───────────────────────────────────────────────────

async function getClient(agencyId: string): Promise<{ axios: AxiosInstance; config: InterConfig }> {
  const config = await getInterConfig(agencyId);
  const token = await getAccessToken(config);
  const agent = getOrCreateAgent(config);

  const instance = axios.create({
    baseURL: INTER_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    httpsAgent: agent,
  });

  return { axios: instance, config };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InterCobrancaPayload {
  seuNumero: string;
  valorNominal: number;
  dataVencimento: string; // "YYYY-MM-DD"
  numDiasAgenda: number;
  pagador: {
    cpfCnpj: string;
    tipoPessoa: "FISICA" | "JURIDICA";
    nome: string;
    email: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  mensagem?: {
    linha1?: string;
    linha2?: string;
  };
}

export interface InterCobrancaResponse {
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
}

export interface InterWebhookPayload {
  nossoNumero: string;
  situacao: "PAGO" | "CANCELADO" | "EXPIRADO" | "VENCIDO" | "EMABERTO";
  dataHoraPagamento?: string;
  valorTotalRecebimento?: number;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export async function createCobranca(
  agencyId: string,
  payload: InterCobrancaPayload
): Promise<InterCobrancaResponse> {
  const { axios: client } = await getClient(agencyId);
  const response = await client.post<InterCobrancaResponse>(
    "/cobranca/v3/cobrancas",
    payload
  );
  return response.data;
}

export async function getCobranca(agencyId: string, nossoNumero: string) {
  const { axios: client } = await getClient(agencyId);
  const response = await client.get(`/cobranca/v3/cobrancas/${nossoNumero}`);
  return response.data;
}

export async function getCobrancaPdfBase64(
  agencyId: string,
  nossoNumero: string
): Promise<string> {
  const { axios: client } = await getClient(agencyId);
  const response = await client.get<{ pdf: string }>(
    `/cobranca/v3/cobrancas/${nossoNumero}/pdf`
  );
  return response.data.pdf;
}

export async function cancelarCobranca(
  agencyId: string,
  nossoNumero: string,
  motivoCancelamento: string = "ACERTOS"
): Promise<void> {
  const { axios: client } = await getClient(agencyId);
  await client.put(`/cobranca/v3/cobrancas/${nossoNumero}/cancelar`, {
    motivoCancelamento,
  });
}

export async function testConnection(agencyId: string): Promise<boolean> {
  try {
    const config = await getInterConfig(agencyId);
    await getAccessToken(config);
    return true;
  } catch {
    return false;
  }
}

export { getInterConfig };
