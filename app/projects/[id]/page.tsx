"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { TicketDrawer } from "@/components/TicketDrawer";
import { TicketForm } from "@/components/TicketForm";
import { TypeFilter } from "@/components/TypeFilter";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Board,
  type Category,
  type Collaborator,
  type Project,
  type Status,
  type TicketSummary,
  type TicketType,
} from "@/shared/types";

type Tab = "boards" | "tickets" | "statuses" | "collaborators";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const projectId = Number(use(params).id);
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("boards");
  const [boards, setBoards] = useState<Board[]>([]);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TicketType[]>([]);

  const reload = useCallback(async () => {
    try {
      const [p, b, t, s, c] = await Promise.all([
        api.projects.get(projectId),
        api.boards.list(projectId),
        api.tickets.list(projectId),
        api.statuses.list(projectId),
        api.collaborators.list(projectId),
      ]);
      setProject(p);
      setBoards(b);
      setTickets(t);
      setStatuses(s);
      setCollabs(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Runs a mutation, then refreshes; surfaces API errors inline.
  async function run(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!project) return <main className="container">{error ? <p className="error">{error}</p> : "Loading…"}</main>;

  return (
    <main className="container">
      <div className="row">
        <span className="key">{project.prefix}</span>
        <h1>{project.name}</h1>
        <span className="spacer" />
        <button
          onClick={() => {
            const name = window.prompt("Project name", project.name);
            if (name?.trim()) run(() => api.projects.update(projectId, { name: name.trim() }));
          }}
        >
          Rename
        </button>
        <button
          className="danger"
          onClick={async () => {
            if (window.confirm(`Delete project ${project.name} with all its boards and tickets?`)) {
              await api.projects.remove(projectId);
              window.location.href = "/";
            }
          }}
        >
          Delete
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="tabs">
        {(["boards", "tickets", "statuses", "collaborators"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "boards" && (
        <div className="stack">
          <div>
            <button
              className="primary"
              onClick={() => {
                const name = window.prompt("Board name");
                if (name?.trim()) run(() => api.boards.create(projectId, name.trim()));
              }}
            >
              New board
            </button>
          </div>
          <div className="grid">
            {boards.map((b) => (
              <div key={b.id} className="card row">
                <Link href={`/boards/${b.id}`} style={{ flex: 1 }}>
                  <h3>{b.name}</h3>
                </Link>
                <button
                  className="danger"
                  onClick={() => window.confirm(`Delete board ${b.name}?`) && run(() => api.boards.remove(b.id))}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          {boards.length === 0 && <p className="muted">No board yet.</p>}
        </div>
      )}

      {tab === "tickets" && (
        <div className="stack">
          <div className="row wrap">
            <button className="primary" onClick={() => setCreating(true)}>
              New ticket
            </button>
            <span className="spacer" />
            <TypeFilter value={typeFilter} onChange={setTypeFilter} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Parent</th>
                <th>Est.</th>
              </tr>
            </thead>
            <tbody>
              {tickets
                .filter((t) => typeFilter.length === 0 || typeFilter.includes(t.type))
                .map((t) => (
                <tr key={t.id} className="clickable" onClick={() => setOpenKey(t.key)}>
                  <td className="key">{t.key}</td>
                  <td>
                    <span className={`badge ${t.type}`}>{t.type}</span>
                  </td>
                  <td>{t.title}</td>
                  <td>{statuses.find((s) => s.id === t.statusId)?.name}</td>
                  <td className="key">{t.parent?.key ?? ""}</td>
                  <td>{t.estimation ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "statuses" && <StatusesTab projectId={projectId} statuses={statuses} run={run} />}

      {tab === "collaborators" && (
        <div className="stack">
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement;
              const name = input.value.trim();
              if (name) run(() => api.collaborators.add(projectId, name)).then(() => (input.value = ""));
            }}
          >
            <input name="name" placeholder="Collaborator name" />
            <button className="primary">Add</button>
          </form>
          <table>
            <tbody>
              {collabs.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td style={{ width: 1 }}>
                    <button className="danger" onClick={() => run(() => api.collaborators.remove(projectId, c.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <TicketForm
          projectId={projectId}
          statuses={statuses}
          tickets={tickets}
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
          projectId={projectId}
          statuses={statuses}
          tickets={tickets}
          onClose={() => setOpenKey(null)}
          onChanged={reload}
        />
      )}
    </main>
  );
}

function StatusesTab({
  projectId,
  statuses,
  run,
}: {
  projectId: number;
  statuses: Status[];
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("todo");
  const [sort, setSort] = useState<{ key: "name" | "category"; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const sorted = [...statuses].sort((a, b) => {
    const r =
      sort.key === "name"
        ? a.name.localeCompare(b.name)
        : CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name);
    return sort.dir === "asc" ? r : -r;
  });

  const header = (key: "name" | "category", title: string) => {
    const active = sort.key === key;
    return (
      <th>
        <button
          type="button"
          className="sort"
          onClick={() => setSort({ key, dir: active && sort.dir === "asc" ? "desc" : "asc" })}
        >
          {title} <span className={active ? "" : "muted"}>{active && sort.dir === "desc" ? "▼" : "▲"}</span>
        </button>
      </th>
    );
  };

  return (
    <div className="stack">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => api.statuses.create(projectId, { name, category })).then(() => setName(""));
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New status" required />
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button className="primary">Add status</button>
      </form>
      <table>
        <thead>
          <tr>
            {header("name", "Name")}
            {header("category", "Type")}
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <select value={s.category} onChange={(e) => run(() => api.statuses.update(projectId, s.id, { category: e.target.value as Category }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ width: 1, whiteSpace: "nowrap" }}>
                <button
                  onClick={() => {
                    const n = window.prompt("Status name", s.name);
                    if (n?.trim()) run(() => api.statuses.update(projectId, s.id, { name: n.trim() }));
                  }}
                >
                  Rename
                </button>{" "}
                <button
                  className="danger"
                  onClick={() => {
                    const others = statuses.filter((o) => o.id !== s.id);
                    const ans = window.prompt(
                      `Delete "${s.name}". Tickets using it move to which status?\n${others.map((o) => o.name).join(", ")}`,
                      others[0]?.name,
                    );
                    const target = others.find((o) => o.name.toLowerCase() === ans?.trim().toLowerCase());
                    if (ans !== null) {
                      if (!target) return window.alert("Unknown status name");
                      run(() => api.statuses.remove(projectId, s.id, target.id));
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
