"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { removeRosterEntry, updateRosterEntry } from "./actions";

type Row = {
  email: string;
  role: "athlete" | "alumni" | "coach";
  class_year: number;
  full_name: string;
  invited_at: string;
  claimed_at: string | null;
};

export function RosterRow({ row }: { row: Row }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave(formData: FormData) {
    setError(null);
    formData.set("original_email", row.email);
    startTransition(async () => {
      const res = await updateRosterEntry(formData);
      if (!res.ok) setError(res.error);
      else setEditing(false);
    });
  }

  function onDelete() {
    if (!confirm(`Remove ${row.email} from the roster?`)) return;
    setError(null);
    const fd = new FormData();
    fd.set("email", row.email);
    startTransition(async () => {
      const res = await removeRosterEntry(fd);
      if (!res.ok) setError(res.error);
    });
  }

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form action={onSave} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <Input
            name="email"
            type="email"
            defaultValue={row.email}
            required
            className="lg:col-span-2"
          />
          <Input name="full_name" defaultValue={row.full_name} required />
          <select
            name="role"
            defaultValue={row.role}
            className="flex h-11 w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-3"
          >
            <option value="athlete">Athlete</option>
            <option value="alumni">Alumni</option>
            <option value="coach">Coach</option>
          </select>
          <Input
            name="class_year"
            type="number"
            min={1980}
            max={2100}
            defaultValue={row.class_year}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
          {error && (
            <p className="lg:col-span-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-[color:var(--color-ink)]">{row.full_name}</div>
        <div className="truncate font-mono text-xs text-[color:var(--color-ink)]/60">
          {row.email}
        </div>
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]/70">
        {row.role}
      </span>
      <span className="font-mono text-xs text-[color:var(--color-ink)]/70">{row.class_year}</span>
      <span
        className="font-mono text-xs"
        title={row.claimed_at ? `Claimed ${row.claimed_at}` : "Not yet signed in"}
      >
        {row.claimed_at ? "✓ claimed" : "pending"}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={isPending}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={isPending}>
          Delete
        </Button>
      </div>
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
