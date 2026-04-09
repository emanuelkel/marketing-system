import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-month-view";
import { startOfMonth, endOfMonth } from "date-fns";

interface SearchParams { month?: string; year?: string; network?: string; }

export default async function ClientCalendarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  const clientId = session?.user.clientId;
  const params = await searchParams;

  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth();

  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  const posts = await prisma.post.findMany({
    where: {
      clientId: clientId ?? "",
      scheduledAt: { gte: start, lte: end },
      status: { notIn: ["ARCHIVED", "CANCELLED"] as never[] },
      ...(params.network ? { network: params.network as never } : {}),
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true, title: true, network: true, status: true, scheduledAt: true,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Calendário</h1>
      <CalendarView posts={posts} year={year} month={month} basePath="/client/calendar" />
    </div>
  );
}
