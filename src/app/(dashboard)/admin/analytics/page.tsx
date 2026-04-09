import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "./analytics-charts";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AnalyticsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId ?? "";

  // Posts por status
  const postsByStatus = await prisma.post.groupBy({
    by: ["status"],
    where: { client: { agencyId } },
    _count: { status: true },
  });

  // Posts por rede social
  const postsByNetwork = await prisma.post.groupBy({
    by: ["network"],
    where: { client: { agencyId } },
    _count: { network: true },
  });

  // Posts por mês (últimos 6 meses)
  const now = new Date();
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return prisma.post.count({
        where: { client: { agencyId }, createdAt: { gte: start, lte: end } },
      }).then((count) => ({
        month: format(date, "MMM", { locale: ptBR }),
        posts: count,
      }));
    })
  );

  // Taxa de aprovação
  const [totalApprovals, approvedCount] = await Promise.all([
    prisma.approval.count({ where: { post: { client: { agencyId } } } }),
    prisma.approval.count({ where: { post: { client: { agencyId } }, status: "APPROVED" } }),
  ]);

  // Top clientes por volume de posts
  const topClients = await prisma.client.findMany({
    where: { agencyId },
    select: {
      name: true,
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 5,
  });

  // Art requests por status
  const artByStatus = await prisma.artRequest.groupBy({
    by: ["status"],
    where: { client: { agencyId } },
    _count: { status: true },
  });

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Rascunho",
    PENDING_APPROVAL: "Aguardando",
    APPROVED: "Aprovado",
    SCHEDULED: "Agendado",
    PUBLISHED: "Publicado",
    FAILED: "Falhou",
    ARCHIVED: "Arquivado",
  };

  const NETWORK_LABELS: Record<string, string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    INSTAGRAM_STORY: "Story",
    INSTAGRAM_REEL: "Reels",
  };

  const ART_STATUS_LABELS: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    IN_REVIEW: "Em revisão",
    REVISION_REQUESTED: "Revisão solicitada",
    APPROVED: "Aprovado",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral de desempenho</p>
      </div>

      <AnalyticsCharts
        postsByStatus={postsByStatus.map((p) => ({ name: STATUS_LABELS[p.status] ?? p.status, value: p._count.status }))}
        postsByNetwork={postsByNetwork.map((p) => ({ name: NETWORK_LABELS[p.network] ?? p.network, value: p._count.network }))}
        monthlyData={monthlyData}
        approvalRate={totalApprovals > 0 ? Math.round((approvedCount / totalApprovals) * 100) : 0}
        totalApprovals={totalApprovals}
        approvedCount={approvedCount}
        topClients={topClients.map((c) => ({ name: c.name, posts: c._count.posts }))}
        artByStatus={artByStatus.map((a) => ({ name: ART_STATUS_LABELS[a.status] ?? a.status, value: a._count.status }))}
      />
    </div>
  );
}
