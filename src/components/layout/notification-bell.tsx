"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Notification {
  id: string;
  subject: string | null;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="Notificações">
        <Bell className="w-4 h-4 text-slate-400" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Notificações</span>
            {notifications.some((n) => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700">Marcar todas como lidas</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n.read ? "bg-indigo-50/50" : ""}`}>
                  {n.subject && <p className="text-xs font-semibold text-slate-800 mb-0.5">{n.subject}</p>}
                  <p className="text-xs text-slate-600 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(new Date(n.createdAt))}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
