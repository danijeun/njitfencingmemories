"use client";

import { cloneElement, isValidElement, useState, type ReactElement } from "react";
import { MessageCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/responsive/useMediaQuery";

export function ThreadShell({
  children,
  initialCount,
}: {
  children: React.ReactNode;
  initialCount: number;
}) {
  // SSR baseline = mobile so first paint matches the smaller layout; hydration
  // corrects on desktop. Avoids a flash of the wrong shell.
  const isDesktop = useMediaQuery("(min-width: 1024px)", false);
  const [count, setCount] = useState(initialCount);
  // Auto-open the drawer when arriving via /memories/[id]#comments. Lazy
  // initializer reads the hash once at mount; ignored by the desktop branch.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#comments",
  );

  // Pipe the live count from MemoryThread into our trigger badge. Cloning
  // would re-mount the child every render; instead we rely on a context-free
  // callback prop the child accepts.
  const childWithCallback = wrap(children, setCount);

  if (isDesktop) {
    return (
      <aside
        id="comments"
        aria-label="Comments and reactions"
        className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col self-start overflow-hidden rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] scroll-mt-24"
      >
        <header className="flex items-center justify-between border-b border-[color:var(--color-rule)] px-4 py-3">
          <h2 className="font-display text-lg text-[color:var(--color-ink)]">Comments</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
            {count}
          </span>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{childWithCallback}</div>
      </aside>
    );
  }

  return (
    <>
      <div id="comments" aria-hidden className="scroll-mt-24" />
      <div className="mt-6 flex items-center justify-between border-t border-[color:var(--color-rule)] pt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] px-4 py-2 text-sm text-[color:var(--color-ink)] hover:border-[color:var(--color-ink)]"
          aria-label={`View comments (${count})`}
        >
          <MessageCircle className="size-4" aria-hidden />
          <span>Comments</span>
          <span className="font-mono text-xs tabular-nums text-[color:var(--color-body)]">
            {count}
          </span>
        </button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90dvh]">
          <DrawerHeader className="border-b border-[color:var(--color-rule)] py-3">
            <DrawerTitle className="text-lg">Comments · {count}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">{childWithCallback}</div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Cloning React children to inject a prop is fine for a single-element child.
// The MemoryThread element identity stays the same so its internal state
// survives across the desktop/mobile flip.
function wrap(children: React.ReactNode, onCountChange: (n: number) => void): React.ReactNode {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ onCountChange?: (n: number) => void }>, {
      onCountChange,
    });
  }
  return children;
}
