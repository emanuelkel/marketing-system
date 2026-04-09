"use client";

import Image from "next/image";
import { Grid3X3, MonitorSmartphone } from "lucide-react";

interface FeedPost {
  id: string;
  title: string;
  network: string;
  status?: string;
  position: number;
  isRealPost?: boolean;
  mediaUrl?: string;
  media: Array<{ url: string; type: string; order: number }>;
}

interface InstagramProfile {
  username: string;
  name: string;
  biography: string;
  followersCount: number;
  mediaCount: number;
  profilePictureUrl: string | null;
}

interface InstagramFeedProps {
  posts: FeedPost[];
  handle?: string;
  logoUrl?: string;
  profile?: InstagramProfile | null;
}

function PostTile({ post }: { post: FeedPost }) {
  const mediaUrl = post.mediaUrl ?? post.media[0]?.url;

  return (
    <div className="relative aspect-square group overflow-hidden bg-slate-100">
      {mediaUrl ? (
        <Image
          src={mediaUrl}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
          unoptimized={post.isRealPost}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
          <MonitorSmartphone className="w-8 h-8 text-slate-400" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <p className="text-white text-xs font-medium text-center px-2 line-clamp-3">
          {post.title}
        </p>
      </div>

      {/* Status badge */}
      {post.isRealPost && (
        <div className="absolute top-1 right-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded">
          Instagram
        </div>
      )}
      {!post.isRealPost && post.status === "DRAFT" && (
        <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
          Rascunho
        </div>
      )}
      {!post.isRealPost && post.status === "PENDING_APPROVAL" && (
        <div className="absolute top-1 right-1 bg-yellow-500/90 text-white text-xs px-1.5 py-0.5 rounded">
          Aguardando
        </div>
      )}
      {!post.isRealPost && post.status === "SCHEDULED" && (
        <div className="absolute top-1 right-1 bg-blue-500/90 text-white text-xs px-1.5 py-0.5 rounded">
          Agendado
        </div>
      )}
      {!post.isRealPost && post.status === "PUBLISHED" && (
        <div className="absolute top-1 right-1 bg-green-500/90 text-white text-xs px-1.5 py-0.5 rounded">
          Publicado
        </div>
      )}
      {!post.isRealPost && post.status === "FAILED" && (
        <div className="absolute top-1 right-1 bg-red-500/90 text-white text-xs px-1.5 py-0.5 rounded">
          Falhou
        </div>
      )}
    </div>
  );
}

export function InstagramFeed({ posts, handle, logoUrl, profile }: InstagramFeedProps) {
  const instagramPosts = posts
    .filter((p) => ["INSTAGRAM", "INSTAGRAM_REEL"].includes(p.network))
    .sort((a, b) => a.position - b.position);

  const displayHandle = profile?.username ?? handle;
  const displayName = profile?.name;
  const displayBio = profile?.biography;
  const displayFollowers = profile?.followersCount;
  const displayAvatar = profile?.profilePictureUrl ?? logoUrl;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-lg">
      {/* Phone-style header */}
      <div className="bg-white border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {displayAvatar ? (
                <Image src={displayAvatar} alt={displayHandle ?? "perfil"} width={52} height={52} className="object-cover rounded-full" unoptimized />
              ) : (
                <MonitorSmartphone className="w-7 h-7 text-slate-400" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900">
              {displayHandle ? `@${displayHandle}` : "perfil"}
            </p>
            {displayName && <p className="text-xs text-slate-700 font-medium">{displayName}</p>}
            {displayFollowers !== undefined && (
              <p className="text-xs text-slate-500">
                {displayFollowers.toLocaleString("pt-BR")} seguidores · {instagramPosts.length} posts
              </p>
            )}
            {!displayFollowers && (
              <p className="text-xs text-slate-500">{instagramPosts.length} posts</p>
            )}
          </div>
        </div>
        {displayBio && (
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{displayBio}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        <div className="flex-1 flex items-center justify-center py-2 border-b-2 border-slate-900">
          <Grid3X3 className="w-4 h-4 text-slate-900" />
        </div>
      </div>

      {/* Feed grid */}
      <div className="grid grid-cols-3 gap-px bg-slate-100">
        {instagramPosts.length === 0 ? (
          <div className="col-span-3 py-12 flex flex-col items-center gap-2">
            <MonitorSmartphone className="w-10 h-10 text-slate-300" />
            <p className="text-xs text-slate-400">Nenhum post ainda</p>
          </div>
        ) : (
          instagramPosts.map((post) => (
            <PostTile key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
