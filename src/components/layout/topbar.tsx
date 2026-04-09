import { Bell } from "lucide-react";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      {title && (
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
