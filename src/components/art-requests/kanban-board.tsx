"use client";

import { useState } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { formatDate, priorityLabel } from "@/lib/utils";
import { updateArtRequestStatus } from "@/app/actions/art-requests";
import type { ArtRequestStatus, ArtRequestType } from "@prisma/client";
import { Clock, Paperclip, ImageIcon } from "lucide-react";

const STATUS_LABELS: Record<ArtRequestStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  IN_REVIEW: "Em revisão",
  REVISION_REQUESTED: "Revisão solicitada",
  APPROVED: "Aprovado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<ArtRequestStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  DELIVERED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<ArtRequestType, string> = {
  POST: "Post", STORY: "Story", REEL: "Reel",
  BANNER: "Banner", CAROUSEL: "Carrossel", COVER: "Capa",
};

interface KanbanRequest {
  id: string;
  title: string;
  type: ArtRequestType;
  status: ArtRequestStatus;
  priority: number;
  deadline: Date | null;
  client: { id: string; name: string };
  requestedBy: { id: string; name: string };
  _count: { attachments: number; deliverables: number };
}

interface KanbanColumn {
  status: ArtRequestStatus;
  requests: KanbanRequest[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export function KanbanBoard({ columns: initialColumns }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId as ArtRequestStatus;
    const dstStatus = destination.droppableId as ArtRequestStatus;

    // Optimistic update
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, requests: [...col.requests] }));
      const srcCol = next.find((c) => c.status === srcStatus)!;
      const dstCol = next.find((c) => c.status === dstStatus)!;
      const [moved] = srcCol.requests.splice(source.index, 1);
      moved.status = dstStatus;
      dstCol.requests.splice(destination.index, 0, moved);
      return next;
    });

    try {
      await updateArtRequestStatus(draggableId, dstStatus);
    } catch {
      // Reverter em caso de erro
      setColumns(initialColumns);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.status} className="flex-shrink-0 w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[column.status]}`}>
                {STATUS_LABELS[column.status]}
              </span>
              <span className="text-xs text-slate-400 font-medium">{column.requests.length}</span>
            </div>

            <Droppable droppableId={column.status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[80px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50" : ""}`}
                >
                  {column.requests.map((req, index) => (
                    <Draggable key={req.id} draggableId={req.id} index={index}>
                      {(draggable, dragSnapshot) => (
                        <div
                          ref={draggable.innerRef}
                          {...draggable.draggableProps}
                          {...draggable.dragHandleProps}
                          className={`bg-white rounded-lg border p-3 transition-all ${
                            dragSnapshot.isDragging
                              ? "border-indigo-300 shadow-lg rotate-1"
                              : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                          }`}
                        >
                          <Link href={`/agency/art-requests/${req.id}`} onClick={(e) => dragSnapshot.isDragging && e.preventDefault()}>
                            {req.priority > 0 && (
                              <div className={`text-xs font-medium px-1.5 py-0.5 rounded inline-block mb-2 ${
                                req.priority >= 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                              }`}>
                                {priorityLabel(req.priority)}
                              </div>
                            )}
                            <p className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">{req.title}</p>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{TYPE_LABELS[req.type]}</span>
                              <span className="text-xs text-slate-400 truncate">{req.client.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                {req._count.attachments > 0 && (
                                  <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{req._count.attachments}</span>
                                )}
                                {req._count.deliverables > 0 && (
                                  <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" />{req._count.deliverables}</span>
                                )}
                              </div>
                              {req.deadline && (
                                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatDate(req.deadline)}</span>
                              )}
                            </div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {column.requests.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-slate-300">Vazio</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
