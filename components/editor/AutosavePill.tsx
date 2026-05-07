"use client";

import type { AutosaveStatus } from "./useAutosave";

function formatRelative(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

export function AutosavePill({
  status,
  savedAt,
  error,
}: {
  status: AutosaveStatus;
  savedAt: string | null;
  error: string | null;
}) {
  let label: string;
  let tone: "muted" | "saved" | "error" | "offline";
  switch (status) {
    case "saving":
      label = "Saving…";
      tone = "muted";
      break;
    case "saved":
      label = savedAt ? `Saved · ${formatRelative(savedAt)}` : "Saved";
      tone = "saved";
      break;
    case "error":
      label = error ? `Save failed — ${error}` : "Save failed";
      tone = "error";
      break;
    case "offline":
      label = "Offline — will retry";
      tone = "offline";
      break;
    default:
      label = "Draft";
      tone = "muted";
  }

  const palette =
    tone === "error"
      ? "border-[color:var(--color-brand-red)] text-[color:var(--color-brand-red)]"
      : tone === "saved"
        ? "border-[color:var(--color-rule)] text-[color:var(--color-ink)]/70"
        : tone === "offline"
          ? "border-[color:var(--color-brand-red)]/50 text-[color:var(--color-brand-red)]/80"
          : "border-[color:var(--color-rule)] text-[color:var(--color-ink)]/60";

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border bg-[color:var(--color-paper)] px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${palette}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          status === "saving"
            ? "animate-pulse bg-[color:var(--color-ink)]/60"
            : status === "saved"
              ? "bg-[color:var(--color-brand-red)]"
              : status === "error" || status === "offline"
                ? "bg-[color:var(--color-brand-red)]"
                : "bg-[color:var(--color-rule)]"
        }`}
      />
      {label}
    </span>
  );
}
