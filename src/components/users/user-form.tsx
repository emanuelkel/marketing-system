"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createUser, updateUser } from "@/app/actions/users";

interface Client {
  id: string;
  name: string;
}

interface Props {
  mode: "create" | "edit";
  userId?: string;
  clients: Client[];
  defaultValues?: {
    name: string;
    email: string;
    role: string;
    phone: string;
    clientId: string;
  };
}

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Equipe" },
  { value: "CLIENT", label: "Cliente" },
];

export function UserForm({ mode, userId, clients, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [role, setRole] = useState(defaultValues?.role ?? "EMPLOYEE");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createUser(fd);
        } else {
          await updateUser(userId!, fd);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            type="text" name="name" required defaultValue={defaultValues?.name}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email" name="email" required defaultValue={defaultValues?.email}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Perfil *</label>
          <select
            name="role" required value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
          <input
            type="text" name="phone" defaultValue={defaultValues?.phone}
            placeholder="+55 11 99999-9999"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {role === "CLIENT" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente vinculado</label>
          <select
            name="clientId" defaultValue={defaultValues?.clientId}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecionar cliente...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {mode === "create" ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha *</label>
          <input
            type="password" name="password" required minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha <span className="text-slate-400 font-normal">(deixe em branco para manter)</span></label>
          <input
            type="password" name="newPassword" minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <button
        type="submit" disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {mode === "create" ? "Criar usuário" : "Salvar alterações"}
      </button>
    </form>
  );
}
