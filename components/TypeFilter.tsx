"use client";

import { TICKET_TYPES, type TicketType } from "@/shared/types";

export function TypeFilter({ value, onChange }: { value: TicketType[]; onChange: (v: TicketType[]) => void }) {
  return (
    <div className="chips" role="group" aria-label="Filter by type">
      {TICKET_TYPES.map((t) => (
        <label key={t}>
          <input
            type="checkbox"
            checked={value.includes(t)}
            onChange={() => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])}
          />
          {t}
        </label>
      ))}
    </div>
  );
}
