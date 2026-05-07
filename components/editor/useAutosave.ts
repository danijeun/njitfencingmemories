"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

type AutosavePayload = {
  title: string;
  excerpt: string;
  era: number | null;
  body: object;
  cover_path: string | null;
};

type AutosaveResult = { ok: true; id: string; savedAt: string } | { ok: false; error: string };

type Options = {
  initialId: string | null;
  payload: AutosavePayload;
  save: (input: AutosavePayload & { id: string | null }) => Promise<AutosaveResult>;
  delayMs?: number;
  enabled?: boolean;
};

// Debounced autosave. Re-fires whenever payload changes, ignoring the first
// render (so we don't write the form's initial state back over itself).
export function useAutosave({ initialId, payload, save, delayMs = 1500, enabled = true }: Options) {
  const [id, setId] = useState<string | null>(initialId);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const firstRunRef = useRef(true);
  const idRef = useRef<string | null>(initialId);

  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      dirtyRef.current = true;
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      dirtyRef.current = true;
      return;
    }
    inFlightRef.current = true;
    dirtyRef.current = false;
    setStatus("saving");
    setError(null);
    try {
      const res = await save({ ...payload, id: idRef.current });
      if (res.ok) {
        idRef.current = res.id;
        setId(res.id);
        setSavedAt(res.savedAt);
        setStatus("saved");
      } else {
        setError(res.error);
        setStatus("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      if (dirtyRef.current) {
        // Coalesce — schedule one more save with the latest payload.
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => void flush(), delayMs);
      }
    }
  }, [payload, save, delayMs]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, delayMs);
  }, [delayMs, flush]);

  useEffect(() => {
    if (!enabled) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    scheduleSave();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, scheduleSave, payload]);

  // Save on tab hide / unload if dirty.
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        void flush();
      }
    };
    window.addEventListener("visibilitychange", handler);
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("visibilitychange", handler);
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled, flush]);

  return { id, status, savedAt, error };
}
