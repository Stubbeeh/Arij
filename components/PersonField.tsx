"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { Collaborator } from "@/shared/types";

// Free-text field backed by the project's collaborators; unknown names require confirmation to be added.
export function PersonField({
  projectId,
  label,
  value,
  onChange,
}: {
  projectId: number;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [options, setOptions] = useState<Collaborator[]>([]);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => api.collaborators.list(projectId, text.trim()).then(setOptions).catch(() => {}), 120);
    return () => clearTimeout(t);
  }, [text, open, projectId]);

  const trimmed = text.trim();
  const exact = options.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());

  async function commit(raw: string) {
    const name = raw.trim();
    if (busy.current) return;
    setOpen(false);
    if (!name) return onChange("");
    busy.current = true;
    try {
      const all = await api.collaborators.list(projectId, name);
      const found = all.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (found) {
        setText(found.name);
        onChange(found.name);
      } else if (window.confirm(`"${name}" is not a collaborator of this project. Add them?`)) {
        const c = await api.collaborators.add(projectId, name);
        setText(c.name);
        onChange(c.name);
      } else {
        setText(value);
      }
    } finally {
      busy.current = false;
    }
  }

  return (
    <label className="field combo">
      {label}
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
          }
        }}
        autoComplete="off"
      />
      {open && (options.length > 0 || trimmed) && (
        <ul>
          {options.map((o) => (
            <li
              key={o.id}
              onMouseDown={(e) => {
                e.preventDefault();
                setText(o.name);
                setOpen(false);
                onChange(o.name);
              }}
            >
              {o.name}
            </li>
          ))}
          {trimmed && !exact && (
            <li
              className="add"
              onMouseDown={(e) => {
                e.preventDefault();
                commit(trimmed);
              }}
            >
              Add &quot;{trimmed}&quot;…
            </li>
          )}
        </ul>
      )}
    </label>
  );
}
