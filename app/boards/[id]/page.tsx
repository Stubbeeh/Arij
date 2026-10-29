"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { api } from "@/lib/api-client";
import { StageEditor } from "@/components/StageEditor";
import { TicketDrawer } from "@/components/TicketDrawer";
import { TicketForm } from "@/components/TicketForm";
import { TypeFilter } from "@/components/TypeFilter";
import { CATEGORY_LABELS, type BoardDetail, type Stage, type TicketSummary, type TicketType } from "@/shared/types";

function Card({ t }: { t: TicketSummary }) {
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <span className={`badge ${t.type}`}>{t.type}</span>
        <span className="key">{t.key}</span>
        {t.estimation != null && <span className="est">{t.estimation}</span>}
      </div>
      <div className="title">{t.title}</div>
      {t.parent && (
        <div className="meta">
          <span className="key">{t.parent.key}</span>
          <span>{t.parent.title}</span>
        </div>
      )}
    </>
  );
}

function DraggableCard({ t, onOpen }: { t: TicketSummary; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: t.key });
  return (
    <div ref={setNodeRef} className={`tcard ${isDragging ? "ghost" : ""}`} onClick={onOpen} {...listeners} {...attributes}>
      <Card t={t} />
    </div>
  );
}

function Zone({
  statusId,
  label,
  dragging,
  tickets,
  onOpen,
}: {
  statusId: number;
  label?: string;
  dragging: boolean;
  tickets: TicketSummary[];
  onOpen: (key: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `status-${statusId}` });
  return (
    <div ref={setNodeRef} className={`zone ${dragging ? "dragging" : ""} ${isOver ? "over" : ""}`}>
      {label && <div className="zone-label">{label}</div>}
      {tickets.map((t) => (
        <DraggableCard key={t.key} t={t} onOpen={() => onOpen(t.key)} />
      ))}
    </div>
  );
}

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const boardId = Number(use(params).id);
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<TicketType[]>([]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const reload = useCallback(() => api.boards.get(boardId).then(setBoard).catch((e) => setError(e.message)), [boardId]);
  useEffect(() => {
    reload();
  }, [reload]);

  if (!board) return <main className="container">{error ? <p className="error">{error}</p> : "Loading…"}</main>;

  const visible = board.tickets.filter((t) => filter.length === 0 || filter.includes(t.type));
  const mapped = new Set(board.stages.flatMap((s) => s.statusIds));
  const unmapped = board.statuses.filter((s) => !mapped.has(s.id));
  const dragged = board.tickets.find((t) => t.key === dragKey);

  async function onDragEnd(e: DragEndEvent) {
    setDragKey(null);
    if (!board || !e.over) return;
    const statusId = Number(String(e.over.id).replace("status-", ""));
    const key = String(e.active.id);
    const t = board.tickets.find((x) => x.key === key);
    if (!t || t.statusId === statusId) return;
    setBoard({ ...board, tickets: board.tickets.map((x) => (x.key === key ? { ...x, statusId } : x)) });
    setError("");
    try {
      await api.tickets.update(key, { statusId });
    } catch (err) {
      setError((err as Error).message);
      reload();
    }
  }

  const stageTickets = (s: Stage) => visible.filter((t) => s.statusIds.includes(t.statusId));

  return (
    <main className="container" style={{ maxWidth: "none" }}>
      <div className="row wrap">
        <Link href={`/projects/${board.projectId}`} className="muted">
          ← Project
        </Link>
        <h1>{board.name}</h1>
        <span className="spacer" />
        <TypeFilter value={filter} onChange={setFilter} />
        <button onClick={() => setEditing(true)}>Edit stages</button>
        <button className="primary" onClick={() => setCreating(true)}>
          New ticket
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {unmapped.length > 0 && (
        <p className="muted">Hidden statuses (no stage): {unmapped.map((s) => s.name).join(", ")}</p>
      )}
      <DndContext sensors={sensors} onDragStart={(e) => setDragKey(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragKey(null)}>
        <div className="board" style={{ marginTop: 16 }}>
          {board.stages.map((s) => {
            const tickets = stageTickets(s);
            const split = dragKey !== null && s.statusIds.length > 1;
            return (
              <section key={s.id} className={`stage ${s.category}`}>
                <div className="stage-head">
                  <span>{s.name}</span>
                  <small>
                    {CATEGORY_LABELS[s.category]} · {tickets.length}
                  </small>
                </div>
                {split ? (
                  s.statusIds.map((sid) => (
                    <Zone
                      key={sid}
                      statusId={sid}
                      label={board.statuses.find((x) => x.id === sid)?.name}
                      dragging
                      tickets={tickets.filter((t) => t.statusId === sid)}
                      onOpen={setOpenKey}
                    />
                  ))
                ) : (
                  <Zone statusId={s.statusIds[0]} dragging={dragKey !== null} tickets={tickets} onOpen={setOpenKey} />
                )}
              </section>
            );
          })}
        </div>
        <DragOverlay>
          {dragged && (
            <div className="tcard overlay-card">
              <Card t={dragged} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editing && (
        <StageEditor
          board={board}
          onClose={() => setEditing(false)}
          onSaved={(b) => {
            setBoard(b);
            setEditing(false);
          }}
        />
      )}
      {creating && (
        <TicketForm
          projectId={board.projectId}
          statuses={board.statuses}
          tickets={board.tickets}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {openKey && (
        <TicketDrawer
          ticketKey={openKey}
          projectId={board.projectId}
          statuses={board.statuses}
          tickets={board.tickets}
          onClose={() => setOpenKey(null)}
          onChanged={reload}
        />
      )}
    </main>
  );
}
