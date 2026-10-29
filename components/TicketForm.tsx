"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Modal } from "./Modal";
import { PersonField } from "./PersonField";
import { ALLOWED_PARENTS, TICKET_TYPES, type Status, type Ticket, type TicketSummary, type TicketType } from "@/shared/types";

const REPORTER_KEY = "arij.lastReporter";

export function TicketForm({
  projectId,
  statuses,
  tickets,
  ticket,
  initialStatusId,
  onClose,
  onSaved,
}: {
  projectId: number;
  statuses: Status[];
  tickets: TicketSummary[];
  ticket?: Ticket;
  initialStatusId?: number;
  onClose: () => void;
  onSaved: (t: Ticket) => void;
}) {
  const [type, setType] = useState<TicketType>(ticket?.type ?? "task");
  const [title, setTitle] = useState(ticket?.title ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [reporter, setReporter] = useState(ticket?.reporter ?? (typeof window !== "undefined" ? localStorage.getItem(REPORTER_KEY) ?? "" : ""));
  const [assignee, setAssignee] = useState(ticket?.assignee ?? "");
  const [estimation, setEstimation] = useState(ticket?.estimation?.toString() ?? "");
  const [statusId, setStatusId] = useState(ticket?.statusId ?? initialStatusId ?? statuses[0]?.id);
  const [parentId, setParentId] = useState<number | null>(ticket?.parent?.id ?? null);
  const [error, setError] = useState("");

  const parentTypes = ALLOWED_PARENTS[type];
  const parents = tickets.filter((t) => parentTypes.includes(t.type) && t.id !== ticket?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      type,
      title,
      description,
      reporter,
      assignee: assignee || null,
      estimation: estimation === "" ? null : Number(estimation),
      statusId,
      parentId: parentTypes.length ? parentId : null,
    };
    try {
      const saved = ticket ? await api.tickets.update(ticket.key, body) : await api.tickets.create(projectId, body);
      if (reporter) localStorage.setItem(REPORTER_KEY, reporter);
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <h2>{ticket ? `Edit ${ticket.key}` : "New ticket"}</h2>
        <div className="row">
          <label className="field">
            Type
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TicketType);
                setParentId(null);
              }}
            >
              {TICKET_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select value={statusId} onChange={(e) => setStatusId(Number(e.target.value))}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Estimation
            <input type="number" min={0} step="any" value={estimation} onChange={(e) => setEstimation(e.target.value)} style={{ width: 90 }} />
          </label>
        </div>
        <label className="field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
        </label>
        <label className="field">
          Description
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {parentTypes.length > 0 && (
          <label className="field">
            Parent ({parentTypes.join(" or ")})
            <select value={parentId ?? ""} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">None</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="row">
          <div style={{ flex: 1 }}>
            <PersonField projectId={projectId} label="Reporter" value={reporter} onChange={setReporter} />
          </div>
          <div style={{ flex: 1 }}>
            <PersonField projectId={projectId} label="Assignee (optional)" value={assignee} onChange={setAssignee} />
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={!reporter || !title.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
