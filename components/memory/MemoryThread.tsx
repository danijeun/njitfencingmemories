"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addComment,
  deleteComment,
  hideComment,
  toggleReaction,
  REACTION_EMOJIS,
  type ReactionEmoji,
} from "@/app/(app)/memories/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { useMemoryChannel } from "@/lib/realtime/useMemoryChannel";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ThreadComment = {
  comment_id: string;
  body: string;
  hidden_at: string | null;
  created_at: string;
  author_id: string;
  author_full_name: string;
  author_slug: string | null;
  author_avatar_path: string | null;
  author_role: string | null;
  author_class_year: number | null;
};

export type ThreadReaction = { emoji: string; author_id: string };

export type ThreadViewer = { id: string; isAdmin: boolean } | null;

type LocalComment = ThreadComment & { _temp?: boolean };

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];
function relativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  for (const [unit, secs] of TIME_UNITS) {
    if (Math.abs(seconds) >= secs) {
      return RTF.format(-Math.round(seconds / secs), unit);
    }
  }
  return "just now";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemoryThread({
  memoryId,
  initialComments,
  initialReactions,
  viewer,
}: {
  memoryId: string;
  initialComments: ThreadComment[];
  initialReactions: ThreadReaction[];
  viewer: ThreadViewer;
}) {
  const [comments, setComments] = useState<LocalComment[]>(initialComments);
  const [reactions, setReactions] = useState<ThreadReaction[]>(initialReactions);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [announce, setAnnounce] = useState("");
  const [supabase] = useState(() => createClient());
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const inset = window.innerHeight - (vv.height + vv.offsetTop);
      setKeyboardInset(inset > 0 ? inset : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const avatarUrl = useCallback(
    (path: string | null) =>
      path ? supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl : null,
    [supabase],
  );

  const refetchSnapshot = useCallback(async () => {
    const [thread, react] = await Promise.all([
      supabase.rpc("get_memory_thread", { p_memory_id: memoryId }),
      supabase.from("memory_reactions").select("emoji, author_id").eq("memory_id", memoryId),
    ]);
    if (thread.data) setComments(thread.data as ThreadComment[]);
    if (react.data) setReactions(react.data as ThreadReaction[]);
  }, [memoryId, supabase]);

  useMemoryChannel(memoryId, {
    onCommentInsert: async (row) => {
      if (row.author_id === viewer?.id) return; // self-echo handled optimistically
      const { data } = await supabase.rpc("get_public_profile", {
        p_id: row.author_id,
      });
      const author = (data as ThreadComment[] | null)?.[0];
      const next: ThreadComment = {
        comment_id: row.id,
        body: row.body,
        hidden_at: row.hidden_at,
        created_at: row.created_at,
        author_id: row.author_id,
        author_full_name: author?.author_full_name ?? "Highlander",
        author_slug: author?.author_slug ?? null,
        author_avatar_path: author?.author_avatar_path ?? null,
        author_role: author?.author_role ?? null,
        author_class_year: author?.author_class_year ?? null,
      };
      setComments((prev) => (prev.some((c) => c.comment_id === row.id) ? prev : [...prev, next]));
      setAnnounce(`New comment from ${next.author_full_name}`);
    },
    onCommentUpdate: (row) => {
      setComments((prev) => {
        const visible = row.hidden_at === null || viewer?.isAdmin;
        if (!visible) return prev.filter((c) => c.comment_id !== row.id);
        return prev.map((c) =>
          c.comment_id === row.id ? { ...c, body: row.body, hidden_at: row.hidden_at } : c,
        );
      });
    },
    onCommentDelete: ({ id }) => {
      setComments((prev) => prev.filter((c) => c.comment_id !== id));
    },
    onReactionInsert: (row) => {
      setReactions((prev) =>
        prev.some((r) => r.author_id === row.author_id && r.emoji === row.emoji)
          ? prev
          : [...prev, { emoji: row.emoji, author_id: row.author_id }],
      );
      if (row.author_id !== viewer?.id) setAnnounce(`Someone reacted with ${row.emoji}`);
    },
    onReactionDelete: ({ author_id, emoji }) => {
      setReactions((prev) => prev.filter((r) => !(r.author_id === author_id && r.emoji === emoji)));
    },
    onResubscribe: () => {
      void refetchSnapshot();
    },
  });

  const tally = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const e of REACTION_EMOJIS) map.set(e, { count: 0, mine: false });
    for (const r of reactions) {
      const cur = map.get(r.emoji);
      if (!cur) continue;
      cur.count += 1;
      if (viewer && r.author_id === viewer.id) cur.mine = true;
    }
    return map;
  }, [reactions, viewer]);

  const onSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed || !viewer) return;
    const tempId = `temp_${crypto.randomUUID()}`;
    const optimistic: LocalComment = {
      comment_id: tempId,
      body: trimmed,
      hidden_at: null,
      created_at: new Date().toISOString(),
      author_id: viewer.id,
      author_full_name: "You",
      author_slug: null,
      author_avatar_path: null,
      author_role: null,
      author_class_year: null,
      _temp: true,
    };
    setComments((prev) => [...prev, optimistic]);
    setBody("");
    startTransition(async () => {
      const result = await addComment({ memoryId, body: trimmed });
      if (!result.ok) {
        setComments((prev) => prev.filter((c) => c.comment_id !== tempId));
        toast.error(result.error);
        return;
      }
      const realId = result.id;
      setComments((prev) =>
        prev.map((c) => (c.comment_id === tempId ? { ...c, comment_id: realId, _temp: false } : c)),
      );
    });
  };

  const onToggleReaction = (emoji: ReactionEmoji) => {
    if (!viewer) return;
    const cur = tally.get(emoji);
    if (!cur) return;
    const willReact = !cur.mine;
    setReactions((prev) =>
      willReact
        ? [...prev, { emoji, author_id: viewer.id }]
        : prev.filter((r) => !(r.author_id === viewer.id && r.emoji === emoji)),
    );
    startTransition(async () => {
      const result = await toggleReaction({ memoryId, emoji });
      if (!result.ok) {
        setReactions((prev) =>
          willReact
            ? prev.filter((r) => !(r.author_id === viewer.id && r.emoji === emoji))
            : [...prev, { emoji, author_id: viewer.id }],
        );
        toast.error(result.error);
      }
    });
  };

  const onDelete = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteComment({ commentId, memoryId });
      if (!result.ok) toast.error(result.error);
    });
  };

  const onHide = (commentId: string, hidden: boolean) => {
    startTransition(async () => {
      const result = await hideComment({ commentId, memoryId, hidden });
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <section
      aria-label="Comments and reactions"
      className="mt-12 border-t border-[color:var(--color-rule)] pt-8"
      style={{ minHeight: "12rem" }}
    >
      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-2">
        {REACTION_EMOJIS.map((e) => {
          const t = tally.get(e)!;
          return (
            <button
              key={e}
              type="button"
              disabled={!viewer || pending}
              onClick={() => onToggleReaction(e)}
              aria-pressed={t.mine}
              aria-label={`React with ${e} (${t.count})`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                t.mine
                  ? "border-[color:var(--color-brand-red)] bg-[color:var(--color-brand-red)]/10 text-[color:var(--color-ink)]"
                  : "border-[color:var(--color-rule)] text-[color:var(--color-body)] hover:border-[color:var(--color-ink)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <span aria-hidden>{e}</span>
              <span className="font-mono text-xs tabular-nums">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Composer */}
      <div className="mt-8">
        <h2 className="font-display text-2xl text-[color:var(--color-ink)]">Comments</h2>
        {viewer ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="sticky bottom-0 z-10 -mx-4 mt-3 border-t border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-4 py-3 sm:mx-0 sm:rounded-md sm:border sm:px-4"
            style={{ paddingBottom: `calc(0.75rem + ${keyboardInset}px)` }}
          >
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder="Add a comment…"
              maxLength={2000}
              disabled={pending}
              aria-label="Comment body"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                ⌘/Ctrl + Enter to post
              </p>
              <button
                type="submit"
                disabled={pending || body.trim().length === 0}
                className="rounded-full bg-[color:var(--color-brand-red)] px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-[color:var(--color-body)]">
            <Link
              href={`/login?from=/memories/${memoryId}`}
              className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-red)] hover:opacity-70"
            >
              Sign in to join the conversation →
            </Link>
          </p>
        )}
      </div>

      {/* Thread */}
      <ul className="mt-8 space-y-6">
        {comments.length === 0 ? (
          <li className="text-sm text-[color:var(--color-body)]">No comments yet. Be the first.</li>
        ) : (
          comments.map((c) => {
            const url = avatarUrl(c.author_avatar_path);
            const canDelete = viewer && (viewer.id === c.author_id || viewer.isAdmin);
            const canHide = viewer?.isAdmin && !c._temp;
            return (
              <li key={c.comment_id} className="flex gap-3">
                <div className="shrink-0">
                  {url ? (
                    <Image
                      src={url}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-10 place-items-center rounded-full bg-[color:var(--color-rule)] font-mono text-[10px] uppercase text-[color:var(--color-ink)]"
                    >
                      {initials(c.author_full_name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    {c.author_slug ? (
                      <Link
                        href={`/profile/${c.author_slug}`}
                        className="font-medium text-[color:var(--color-ink)] hover:underline"
                      >
                        {c.author_full_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[color:var(--color-ink)]">
                        {c.author_full_name}
                      </span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                      {relativeTime(c.created_at)}
                    </span>
                    {c.hidden_at ? (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-red)]">
                        hidden
                      </span>
                    ) : null}
                    {(canDelete || canHide) && !c._temp ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Comment actions"
                          className="ml-auto grid size-7 place-items-center rounded-full text-[color:var(--color-body)] hover:bg-[color:var(--color-rule)]"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canHide ? (
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() => onHide(c.comment_id, !c.hidden_at)}
                            >
                              {c.hidden_at ? (
                                <>
                                  <Eye className="size-3.5" aria-hidden /> Unhide
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-3.5" aria-hidden /> Hide
                                </>
                              )}
                            </DropdownMenuItem>
                          ) : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() => onDelete(c.comment_id)}
                            >
                              <Trash2 className="size-3.5" aria-hidden /> Delete
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-1 whitespace-pre-wrap text-base text-[color:var(--color-body)]",
                      c.hidden_at ? "opacity-60" : "",
                    )}
                  >
                    {c.body}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div role="status" aria-live="polite" aria-atomic="false" className="sr-only">
        {announce}
      </div>
    </section>
  );
}
