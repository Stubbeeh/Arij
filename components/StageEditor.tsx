"use client";

import { useState } from "react";
import { api, type StagePayload } from "@/lib/api-client";
import { Modal } from "./Modal";
import { CATEGORIES, CATEGORY_LABELS, type BoardDetail, type Category } from "@/shared/types";

export function StageEditor({
  board,
  onClose,
  onSaved,
}: {
  board: BoardDetail;
  onClose: () => void;
  onSaved: (b: BoardDetail) => void;
}) {
  const [stages, setStages] = useState<StagePayload[]>(board.stages.map(({ name, category, statusIds }) => ({ name, category, statusIds })));
  const [error, setError] = useState("");

  const mapped = new Set(stages.flatMap((s) => s.statusIds));
  const unmapped = board.statuses.filter((s) => !mapped.has(s.id));

  const patch = (i: number, p: Partial<StagePayload>) => setStages((ss) => ss.map((s, j) => (j === i ? { ...s, ...p } : s)));

  function toggle(i: number, statusId: number) {
    setStages((ss) =>
      ss.map((s, j) => {
        const without = s.statusIds.filter((x) => x !== statusId);
        if (j !== i) return { ...s, statusIds: without };
        return { ...s, statusIds: s.statusIds.includes(statusId) ? without : [...without, statusId] };
      }),
    );
  }

  function move(i: number, d: -1 | 1) {
    setStages((ss) => {
      const j = i + d;
      if (j < 0 || j >= ss.length) return ss;
      const copy = [...ss];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  async function save() {
    setError("");
    const empty = stages.find((s) => s.statusIds.length === 0);
    if (empty) return setError(`Stage "${empty.name || "(unnamed)"}" needs at least one status`);
    try {
      onSaved(await api.boards.setStages(board.id, stages));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="stack">
        <h2>Board stages</h2>
        {stages.map((s, i) => (
          <div key={i} className="stage-edit stack">
            <div className="row">
              <input value={s.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="Stage name" style={{ flex: 1 }} />
              <select value={s.category} onChange={(e) => patch(i, { category: e.target.value as Category })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="chips">
              {board.statuses.map((st) => (
                <label key={st.id}>
                  <input type="checkbox" checked={s.statusIds.includes(st.id)} onChange={() => toggle(i, st.id)} />
                  {st.name}
                </label>
              ))}
            </div>
            <div className="row">
              <button onClick={() => move(i, -1)} disabled={i === 0}>
                Up
              </button>
              <button onClick={() => move(i, 1)} disabled={i === stages.length - 1}>
                Down
              </button>
              <span className="spacer" />
              <button className="danger" onClick={() => setStages((ss) => ss.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <div>
          <button onClick={() => setStages((ss) => [...ss, { name: "", category: "todo", statusIds: [] }])}>Add stage</button>
        </div>
        {unmapped.length > 0 && (
          <p className="error">Tickets with these statuses are hidden: {unmapped.map((s) => s.name).join(", ")}</p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="row">
          <span className="spacer" />
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save} disabled={stages.length === 0 || stages.some((s) => !s.name.trim())}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
