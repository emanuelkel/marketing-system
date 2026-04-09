"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleUserActive } from "@/app/actions/users";

interface Props {
  userId: string;
  isActive: boolean;
}

export function ToggleActiveButton({ userId, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleUserActive(userId, !isActive);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
        isActive
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-green-200 text-green-600 hover:bg-green-50"
      }`}
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      {isActive ? "Desativar conta" : "Reativar conta"}
    </button>
  );
}
