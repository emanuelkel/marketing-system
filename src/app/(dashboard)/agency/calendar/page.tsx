import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-month-view";
import { startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { Building2 } from "lucide-react";

interface SearchParams {
  month?: string;
  year?: string;
  clientId?: string;
  network?: string;
}

export default async function AgencyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const agencyId = session?.user.agencyId;
  const params = await searchParams;

  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth();

  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  const where = {
    client: { agencyId: agencyId ?? "" },
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.network ? { network: params.network as never } : {}),
    scheduledAt: { gte: start, lte: end },
  };

  const [posts, clients] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        network: true,
        status: true,
        scheduledAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { agencyId: agencyId ?? "", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Calendário</h1>
        <Link
          href="/agency/posts/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo post
        </Link>
      </div>

      {/* Client filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/agency/calendar?month=${month}&year=${year}`}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !params.clientId
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
          }`}
        >
          <Building2 className="w-3 h-3" />
          Todos
        </Link>
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/agency/calendar?month=${month}&year=${year}&clientId=${c.id}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              params.clientId === c.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <CalendarView posts={posts} year={year} month={month} basePath="/agency/calendar" />
    </div>
  );
}
