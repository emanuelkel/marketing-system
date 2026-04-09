import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/art-requests/kanban-board";
import Link from "next/link";
import type { ArtRequestStatus } from "@prisma/client";

const STATUS_ORDER: ArtRequestStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "IN_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "DELIVERED",
];

export default async function ArtRequestsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  const requests = await prisma.artRequest.findMany({
    where: {
      client: { agencyId: agencyId ?? "" },
      status: { notIn: ["CANCELLED"] },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      _count: { select: { attachments: true, deliverables: true } },
    },
  });

  const columns = STATUS_ORDER.map((status) => ({
    status,
    requests: requests.filter((r) => r.status === status),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Solicitações de Arte</h1>
        <span className="text-sm text-slate-500">
          {requests.length} solicitaç{requests.length !== 1 ? "ões" : "ão"}
        </span>
      </div>

      <KanbanBoard columns={columns} />
    </div>
  );
}
