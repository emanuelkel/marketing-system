import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "";

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${baseUrl}/admin/clients?error=oauth_cancelled`);
  }

  let state: { clientId: string; agencyId: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64").toString());
  } catch {
    return NextResponse.redirect(`${baseUrl}/admin/clients?error=invalid_state`);
  }

  const { clientId, agencyId } = state;

  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { metaAppId: true, metaAppSecret: true },
    });

    const appId = agency?.metaAppId ?? process.env.META_APP_ID;
    const appSecret = agency?.metaAppSecret ?? process.env.META_APP_SECRET;
    const redirectUri = `${baseUrl}/api/meta/callback`;

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message ?? "Token exchange failed");
    }

    // Exchange for long-lived token
    const longRes = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json() as { access_token?: string; expires_in?: number };
    const longToken = longData.access_token ?? tokenData.access_token;
    const expiresAt = longData.expires_in ? new Date(Date.now() + longData.expires_in * 1000) : null;

    // Get Instagram Business Account ID
    const pagesRes = await fetch(
      `${GRAPH_API_BASE}/me/accounts?access_token=${longToken}&fields=id,name,instagram_business_account`
    );
    const pagesData = await pagesRes.json() as { data?: Array<{ id: string; instagram_business_account?: { id: string } }> };
    const igAccountId = pagesData.data?.[0]?.instagram_business_account?.id ?? null;

    await prisma.client.update({
      where: { id: clientId },
      data: {
        metaAccessToken: longToken,
        metaTokenExpiry: expiresAt,
        instagramAccountId: igAccountId,
      },
    });

    return NextResponse.redirect(`${baseUrl}/admin/clients/${clientId}?connected=true`);
  } catch (err) {
    console.error("Meta OAuth error:", err);
    return NextResponse.redirect(`${baseUrl}/admin/clients/${clientId}?error=oauth_failed`);
  }
}
