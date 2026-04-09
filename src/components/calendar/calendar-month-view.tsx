"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { networkColor, networkLabel } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarPost {
  id: string;
  title: string;
  network: string;
  status: string;
  scheduledAt: Date | null;
  client?: { id: string; name: string };
}

interface CalendarViewProps {
  posts: CalendarPost[];
  year: number;
  month: number;
  basePath: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarView({ posts, year, month, basePath }: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDate = new Date(year, month);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Group posts by day
  const postsByDay = new Map<string, CalendarPost[]>();
  for (const post of posts) {
    if (!post.scheduledAt) continue;
    const key = format(new Date(post.scheduledAt), "yyyy-MM-dd");
    if (!postsByDay.has(key)) postsByDay.set(key, []);
    postsByDay.get(key)!.push(post);
  }

  function navigate(direction: -1 | 1) {
    const newDate = new Date(year, month + direction);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newDate.getMonth()));
    params.set("year", String(newDate.getFullYear()));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="font-semibold text-slate-900 capitalize">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-slate-400"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[60px] sm:min-h-[96px] p-1 sm:p-1.5 ${
                !isCurrentMonth ? "bg-slate-50/50" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1 ${
                  isCurrentDay
                    ? "bg-indigo-600 text-white"
                    : isCurrentMonth
                    ? "text-slate-700"
                    : "text-slate-300"
                }`}
              >
                {format(day, "d")}
              </span>

              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/agency/posts/${post.id}`}
                    title={`${post.title} (${networkLabel(post.network)})`}
                    style={{ backgroundColor: networkColor(post.network) }}
                    className="hidden sm:block truncate text-xs px-1.5 py-0.5 rounded text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    {post.title}
                  </Link>
                ))}
                <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <span
                      key={post.id}
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: networkColor(post.network) }}
                      title={post.title}
                    />
                  ))}
                </div>
                {dayPosts.length > 3 && (
                  <span className="text-xs text-slate-400 px-1.5">
                    +{dayPosts.length - 3}
                    <span className="hidden sm:inline"> mais</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
