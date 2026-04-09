"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { addPostComment } from "@/app/actions/comments";
import { formatDateTime } from "@/lib/utils";

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string };
}

interface Props {
  postId: string;
  comments: Comment[];
}

export function PostComments({ postId, comments }: Props) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await addPostComment(postId, text);
        setText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao comentar");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        Comentários {comments.length > 0 && <span className="text-slate-400 font-normal">({comments.length})</span>}
      </h3>

      {comments.length === 0 ? (
        <p className="text-xs text-slate-400 mb-4">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0 mt-0.5">
                {c.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-700">{c.author.name}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar comentário..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={isPending || !text.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
