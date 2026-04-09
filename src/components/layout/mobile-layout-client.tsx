"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import type { UserRole } from "@prisma/client";

interface Props {
  user: { name?: string | null; email?: string | null; role: UserRole };
  children: React.ReactNode;
}

export function MobileLayoutClient({ user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top bar — visível apenas no mobile */}
      <div className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <span className="ml-3 font-semibold text-sm text-slate-900">
          Marketing System
        </span>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content row */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
