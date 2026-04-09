import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatRelative } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: ptBR });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelativeDate(date: Date | string) {
  return formatRelative(new Date(date), new Date(), { locale: ptBR });
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function networkLabel(network: string) {
  const labels: Record<string, string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    INSTAGRAM_STORY: "Story",
    INSTAGRAM_REEL: "Reels",
  };
  return labels[network] ?? network;
}

export function networkColor(network: string) {
  const colors: Record<string, string> = {
    INSTAGRAM: "#E1306C",
    FACEBOOK: "#1877F2",
    INSTAGRAM_STORY: "#9B51E0",
    INSTAGRAM_REEL: "#F77737",
  };
  return colors[network] ?? "#6366f1";
}

export function priorityLabel(priority: number) {
  if (priority >= 2) return "Crítico";
  if (priority === 1) return "Urgente";
  return "Normal";
}

export function bytesToSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
