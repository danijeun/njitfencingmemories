"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, PenLine, User, LogIn, Search, CalendarRange, Users, Images } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  auth: "in" | "out" | "any";
};

const ITEMS: Item[] = [
  {
    label: "Memories feed",
    href: "/memories",
    icon: BookOpen,
    keywords: ["archive", "stories"],
    auth: "any",
  },
  {
    label: "New memory",
    href: "/memories/new",
    icon: PenLine,
    keywords: ["write", "create"],
    auth: "in",
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: Images,
    keywords: ["photos", "images", "covers"],
    auth: "any",
  },
  {
    label: "Alumni directory",
    href: "/alumni",
    icon: Users,
    keywords: ["roster", "people", "directory"],
    auth: "in",
  },
  { label: "My profile", href: "/profile/me", icon: User, keywords: ["account"], auth: "in" },
  { label: "Edit profile", href: "/profile/edit", icon: User, keywords: ["settings"], auth: "in" },
  { label: "Log in", href: "/login", icon: LogIn, auth: "out" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsAuthed(Boolean(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const items = useMemo(
    () =>
      ITEMS.filter((it) =>
        it.auth === "any" ? true : isAuthed ? it.auth === "in" : it.auth === "out",
      ),
    [isAuthed],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const trimmedQuery = query.trim();
  const yearMatch = /^(19[8-9]\d|20\d{2}|2100)$/.test(trimmedQuery) ? Number(trimmedQuery) : null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[18%] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-ivory)] shadow-xl"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command label="Command palette" loop>
            <div className="flex items-center gap-2 border-b border-[color:var(--color-rule)] px-3">
              <Search className="size-4 text-[color:var(--color-ink)]/70" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search or jump to…"
                className="h-12 w-full bg-transparent text-base outline-none placeholder:text-[color:var(--color-ink)]/50"
              />
              <kbd className="hidden font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-ink)]/60 sm:inline">
                Esc
              </kbd>
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]/60">
                No results.
              </Command.Empty>
              {yearMatch !== null ? (
                <Command.Group
                  heading="Jump"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[color:var(--color-ink)]/60"
                >
                  <Command.Item
                    value={`jump-era-${yearMatch}`}
                    onSelect={() => go(`/memories?era=${yearMatch}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[color:var(--color-ink)] data-[selected=true]:bg-[color:var(--color-paper)]"
                  >
                    <CalendarRange className="size-4" />
                    Jump to {yearMatch}
                  </Command.Item>
                </Command.Group>
              ) : null}
              {trimmedQuery ? (
                <Command.Group
                  heading="Search"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[color:var(--color-ink)]/60"
                >
                  <Command.Item
                    value={`search-memories-${trimmedQuery}`}
                    onSelect={() => go(`/search?q=${encodeURIComponent(trimmedQuery)}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[color:var(--color-ink)] data-[selected=true]:bg-[color:var(--color-paper)]"
                  >
                    <Search className="size-4" />
                    Search memories for &ldquo;{trimmedQuery}&rdquo;
                  </Command.Item>
                </Command.Group>
              ) : null}
              <Command.Group
                heading="Navigate"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[color:var(--color-ink)]/60"
              >
                {items.map(({ label, href, icon: Icon, keywords }) => (
                  <Command.Item
                    key={href}
                    value={`${label} ${(keywords ?? []).join(" ")}`}
                    onSelect={() => go(href)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[color:var(--color-ink)] data-[selected=true]:bg-[color:var(--color-paper)]"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
