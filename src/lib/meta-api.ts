import { prisma } from "./prisma";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MetaResponse<T = unknown> {
  data?: T;
  error?: { message: string; type: string; code: number };
}

async function graphRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GRAPH_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = (await response.json()) as MetaResponse<T>;

  if (json.error) {
    throw new Error(`Meta API Error: ${json.error.message} (code: ${json.error.code})`);
  }

  return json as T;
}

async function getClientToken(clientId: string): Promise<string> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { metaAccessToken: true, name: true },
  });

  if (!client?.metaAccessToken) {
    throw new Error(`Cliente ${clientId} não tem token Meta configurado.`);
  }

  return client.metaAccessToken;
}

// ─── Instagram ───────────────────────────────────────────────────────────────

export async function publishInstagramPost(
  clientId: string,
  mediaUrls: string[],
  caption: string
): Promise<string> {
  const token = await getClientToken(clientId);
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { instagramAccountId: true },
  });

  if (!client?.instagramAccountId) {
    throw new Error("Instagram Account ID não configurado para este cliente.");
  }

  const igUserId = client.instagramAccountId;

  if (mediaUrls.length === 1) {
    // Single image/video
    const container = await graphRequest<{ id: string }>(
      `/${igUserId}/media`,
      {
        method: "POST",
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption,
          access_token: token,
        }),
      }
    );

    const publish = await graphRequest<{ id: string }>(
      `/${igUserId}/media_publish`,
      {
        method: "POST",
        body: JSON.stringify({
          creation_id: container.id,
          access_token: token,
        }),
      }
    );

    return publish.id;
  }

  // Carousel
  const containerIds: string[] = [];
  for (const url of mediaUrls) {
    const container = await graphRequest<{ id: string }>(
      `/${igUserId}/media`,
      {
        method: "POST",
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: token,
        }),
      }
    );
    containerIds.push(container.id);
  }

  const carousel = await graphRequest<{ id: string }>(
    `/${igUserId}/media`,
    {
      method: "POST",
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: containerIds.join(","),
        caption,
        access_token: token,
      }),
    }
  );

  const publish = await graphRequest<{ id: string }>(
    `/${igUserId}/media_publish`,
    {
      method: "POST",
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: token,
      }),
    }
  );

  return publish.id;
}

// ─── Facebook ────────────────────────────────────────────────────────────────

export async function publishFacebookPost(
  clientId: string,
  message: string,
  mediaUrls?: string[]
): Promise<string> {
  const token = await getClientToken(clientId);
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { facebookPageId: true },
  });

  if (!client?.facebookPageId) {
    throw new Error("Facebook Page ID não configurado para este cliente.");
  }

  const pageId = client.facebookPageId;

  if (!mediaUrls || mediaUrls.length === 0) {
    const result = await graphRequest<{ id: string }>(`/${pageId}/feed`, {
      method: "POST",
      body: JSON.stringify({ message, access_token: token }),
    });
    return result.id;
  }

  const result = await graphRequest<{ id: string }>(`/${pageId}/photos`, {
    method: "POST",
    body: JSON.stringify({
      url: mediaUrls[0],
      caption: message,
      access_token: token,
    }),
  });

  return result.id;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface PostInsights {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
}

export async function getPostInsights(
  clientId: string,
  metaPostId: string
): Promise<PostInsights> {
  const token = await getClientToken(clientId);

  const result = await graphRequest<{
    data: Array<{ name: string; values: Array<{ value: number }> }>;
  }>(
    `/${metaPostId}/insights?metric=impressions,reach,engagement&access_token=${token}`
  );

  const insights: PostInsights = {
    impressions: 0,
    reach: 0,
    engagement: 0,
    likes: 0,
    comments: 0,
  };

  if (result.data) {
    for (const metric of result.data) {
      const value = metric.values?.[0]?.value ?? 0;
      if (metric.name === "impressions") insights.impressions = value;
      if (metric.name === "reach") insights.reach = value;
      if (metric.name === "engagement") insights.engagement = value;
    }
  }

  return insights;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface InstagramProfile {
  username: string;
  name: string;
  biography: string;
  followersCount: number;
  mediaCount: number;
  profilePictureUrl: string | null;
}

export async function getInstagramProfile(clientId: string): Promise<InstagramProfile | null> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { metaAccessToken: true, instagramAccountId: true },
    });

    if (!client?.metaAccessToken || !client?.instagramAccountId) return null;

    const result = await graphRequest<{
      username: string;
      name: string;
      biography: string;
      followers_count: number;
      media_count: number;
      profile_picture_url?: string;
    }>(
      `/${client.instagramAccountId}?fields=username,name,biography,followers_count,media_count,profile_picture_url&access_token=${client.metaAccessToken}`
    );

    return {
      username: result.username,
      name: result.name,
      biography: result.biography ?? "",
      followersCount: result.followers_count ?? 0,
      mediaCount: result.media_count ?? 0,
      profilePictureUrl: result.profile_picture_url ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface InstagramMediaPost {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  permalink: string;
}

export async function getInstagramMedia(clientId: string): Promise<InstagramMediaPost[]> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { metaAccessToken: true, instagramAccountId: true },
    });

    if (!client?.metaAccessToken || !client?.instagramAccountId) return [];

    const result = await graphRequest<{
      data: Array<{
        id: string;
        media_url?: string;
        thumbnail_url?: string;
        caption?: string;
        timestamp: string;
        media_type: string;
        permalink: string;
      }>;
    }>(
      `/${client.instagramAccountId}/media?fields=id,media_url,thumbnail_url,caption,timestamp,media_type,permalink&limit=24&access_token=${client.metaAccessToken}`
    );

    return (result.data ?? []).map((item) => ({
      id: item.id,
      mediaUrl: item.media_url ?? item.thumbnail_url ?? "",
      thumbnailUrl: item.thumbnail_url,
      caption: item.caption,
      timestamp: item.timestamp,
      mediaType: item.media_type as InstagramMediaPost["mediaType"],
      permalink: item.permalink,
    }));
  } catch {
    return [];
  }
}

// ─── Token Management ────────────────────────────────────────────────────────

export async function refreshLongLivedToken(
  clientId: string,
  shortLivedToken: string
): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  const result = await graphRequest<{ access_token: string; expires_in: number }>(
    `/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );

  const expiresAt = new Date(Date.now() + result.expires_in * 1000);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      metaAccessToken: result.access_token,
      metaTokenExpiry: expiresAt,
    },
  });

  return result.access_token;
}
