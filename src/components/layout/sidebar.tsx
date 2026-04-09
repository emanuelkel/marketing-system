"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Calendar,
  Palette,
  CheckSquare,
  MonitorSmartphone,
  Users,
  Settings,
  Building2,
  LogOut,
  ChevronRight,
  X,
  UserCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clientes", href: "/admin/clients", icon: Building2 },
  { label: "Equipe", href: "/admin/users", icon: Users },
  { label: "Configurações", href: "/admin/settings", icon: Settings },
];

const AGENCY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/agency", icon: LayoutDashboard },
  { label: "Calendário", href: "/agency/calendar", icon: Calendar },
  { label: "Solicitações", href: "/agency/art-requests", icon: Palette },
  { label: "Aprovações", href: "/agency/approvals", icon: CheckSquare },
];

const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/client", icon: LayoutDashboard },
  { label: "Calendário", href: "/client/calendar", icon: Calendar },
  { label: "Minhas artes", href: "/client/art-requests", icon: Palette },
  { label: "Aprovações", href: "/client/approvals", icon: CheckSquare },
  { label: "Feed mockup", href: "/client/mockup", icon: MonitorSmartphone },
];

function getNavItems(role: UserRole): NavItem[] {
  if (role === "ADMIN") return [...ADMIN_NAV, ...AGENCY_NAV];
  if (role === "EMPLOYEE") return AGENCY_NAV;
  return CLIENT_NAV;
}

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(user.role);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 min-h-screen bg-slate-900 text-white",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out",
        "lg:static lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm truncate">Marketing System</span>
        <button
          onClick={onClose}
          className="lg:hidden ml-auto p-1 rounded hover:bg-slate-700 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/agency" &&
              item.href !== "/client" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        <div className="flex items-start justify-between px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              {user.role === "ADMIN" ? "Admin" : user.role === "EMPLOYEE" ? "Equipe" : "Cliente"}
            </span>
          </div>
          <NotificationBell />
        </div>
        <Link href="/profile" onClick={onClose}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/profile" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}>
          <UserCircle className="w-4 h-4" />
          Meu perfil
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
