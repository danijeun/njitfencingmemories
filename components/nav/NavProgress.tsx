"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { onNavStart } from "./nav-progress-bus";

export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (fadeRef.current) clearTimeout(fadeRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    setActive(true);
    setProgress(8);
    tickRef.current = setInterval(() => {
      setProgress((p) => (p < 80 ? p + (80 - p) * 0.12 : p));
    }, 200);
  }

  function done() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    fadeRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 240);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank") return;
      try {
        const url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }
      start();
    }
    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.method.toLowerCase() !== "get") return;
      try {
        const url = new URL(form.action, window.location.href);
        if (url.origin !== window.location.origin) return;
      } catch {
        return;
      }
      start();
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    const offBus = onNavStart(start);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      offBus();
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing nav-completion signal into local progress state
    done();
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [pathname, searchParams]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-[color:var(--color-brand-red)] shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-red)_70%,transparent)] transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
