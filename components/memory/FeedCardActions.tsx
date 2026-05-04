"use client";

import { useState, useTransition } from "react";
import { Link } from "next-view-transitions";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { toggleReaction } from "@/app/(app)/memories/[id]/actions";
import { HEART } from "@/components/memory/reactions";
import { cn } from "@/lib/utils";

export function FeedCardActions({
  memoryId,
  initialLikeCount,
  initialReacted,
  commentCount,
  canReact,
}: {
  memoryId: string;
  initialLikeCount: number;
  initialReacted: boolean;
  commentCount: number;
  canReact: boolean;
}) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [reacted, setReacted] = useState(initialReacted);
  const [pending, startTransition] = useTransition();

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canReact || pending) return;
    const next = !reacted;
    setReacted(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleReaction({ memoryId, emoji: HEART });
      if (!result.ok) {
        setReacted(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        toast.error(result.error);
      }
    });
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="mt-3 flex items-center gap-6 text-[color:var(--color-body)]">
      <Link
        href={`/memories/${memoryId}#comments`}
        onClick={stop}
        aria-label={`Comments (${commentCount})`}
        className="pointer-events-auto relative flex items-center gap-1.5 text-xs hover:text-[color:var(--color-brand-red)]"
      >
        <MessageCircle className="size-4" aria-hidden />
        <span className="tabular-nums">{commentCount}</span>
      </Link>
      {canReact ? (
        <button
          type="button"
          onClick={onLike}
          disabled={pending}
          aria-pressed={reacted}
          aria-label={reacted ? `Unlike (${likeCount})` : `Like (${likeCount})`}
          className={cn(
            "pointer-events-auto relative flex items-center gap-1.5 text-xs transition-colors",
            reacted
              ? "text-[color:var(--color-brand-red)]"
              : "hover:text-[color:var(--color-brand-red)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <Heart
            className="size-4"
            aria-hidden
            fill={reacted ? "currentColor" : "none"}
            strokeWidth={reacted ? 0 : 2}
          />
          <span className="tabular-nums">{likeCount}</span>
        </button>
      ) : (
        <Link
          href={`/login?from=/memories/${memoryId}`}
          onClick={stop}
          aria-label={`Sign in to like (${likeCount})`}
          className="pointer-events-auto relative flex items-center gap-1.5 text-xs hover:text-[color:var(--color-brand-red)]"
        >
          <Heart className="size-4" aria-hidden />
          <span className="tabular-nums">{likeCount}</span>
        </Link>
      )}
      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
        Read →
      </span>
    </div>
  );
}
