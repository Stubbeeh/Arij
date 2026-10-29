"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Project } from "@/shared/types";

export default function Home() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.projects.list().then(setProjects).catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const p = await api.projects.create({ name, prefix });
      setProjects((ps) => [...(ps ?? []), p].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setPrefix("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="container stack">
      <h1>Projects</h1>
      <form className="card row wrap" onSubmit={create}>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <label className="field">
          Prefix
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            required
            pattern="[A-Z0-9]{2,5}"
            title="2-5 uppercase letters or digits"
            maxLength={5}
            style={{ width: 90 }}
          />
        </label>
        <button className="primary" style={{ alignSelf: "flex-end" }}>
          Create project
        </button>
        {error && <span className="error">{error}</span>}
      </form>
      {projects?.length === 0 && <p className="muted">No project yet.</p>}
      <div className="grid">
        {projects?.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card">
            <span className="key">{p.prefix}</span>
            <h3>{p.name}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}
