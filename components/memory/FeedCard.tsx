import Image from "next/image";
import { Link } from "next-view-transitions";
import { MessageCircle, Heart, Share2, Pin } from "lucide-react";
import type { FeedItem } from "@/app/(app)/memories/feed";
import { PinToggle } from "./PinToggle";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleLabel(role: FeedItem["author"]["role"]): string {
  if (role === "athlete") return "Athlete";
  if (role === "alumni") return "Alumni";
  if (role === "coach") return "Coach";
  return "";
}

function initials(name: string | null): string {
  if (!name) return "·";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function FeedCard({
  memory,
  priority = false,
  isAdmin = false,
}: {
  memory: FeedItem;
  priority?: boolean;
  isAdmin?: boolean;
}) {
  const { author } = memory;
  const isPinned = Boolean(memory.pinned_at);
  const profileHref = author.slug ? `/profile/${author.slug}` : null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="@container relative border-b border-[color:var(--color-rule)] px-4 py-5 transition-colors hover:bg-[color:var(--color-paper)] focus-within:bg-[color:var(--color-paper)] sm:px-6">
      <Link
        href={`/memories/${memory.id}`}
        aria-label={memory.title}
        className="absolute inset-0 focus-visible:outline-none"
      />
      <article className="pointer-events-none flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {author.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-11 place-items-center rounded-full bg-[color:var(--color-rule)] font-mono text-xs uppercase text-[color:var(--color-ink)]"
            >
              {initials(author.full_name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header line */}
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm leading-tight">
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={stop}
                className="pointer-events-auto relative font-semibold text-[color:var(--color-ink)] hover:underline"
              >
                {author.full_name ?? "Unknown"}
              </Link>
            ) : (
              <span className="font-semibold text-[color:var(--color-ink)]">
                {author.full_name ?? "Unknown"}
              </span>
            )}
            {author.role ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                {roleLabel(author.role)}
              </span>
            ) : null}
            {author.class_year ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                · &rsquo;{String(author.class_year).slice(-2)}
              </span>
            ) : null}
            <span className="text-[color:var(--color-body)]">·</span>
            <time
              dateTime={memory.published_at ?? undefined}
              className="text-xs text-[color:var(--color-body)]"
            >
              {relativeTime(memory.published_at)}
            </time>
            <span className="ml-auto flex items-center gap-2">
              {isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-brand-red)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-red)]">
                  <Pin className="size-3" aria-hidden /> Pinned
                </span>
              ) : null}
              {memory.era ? (
                <span className="rounded-full border border-[color:var(--color-rule)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                  Era {memory.era}
                </span>
              ) : null}
              {isAdmin ? <PinToggle memoryId={memory.id} pinned={isPinned} /> : null}
            </span>
          </div>

          {/* Title */}
          <h2 className="mt-1.5 line-clamp-2 font-display text-xl leading-tight text-[color:var(--color-ink)] @md:text-2xl">
            {memory.title}
          </h2>

          {/* Excerpt */}
          {memory.excerpt ? (
            <p className="mt-2 line-clamp-3 text-[15px] leading-6 text-[color:var(--color-body)]">
              {memory.excerpt}
            </p>
          ) : null}

          {/* Cover */}
          {memory.cover_url ? (
            <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-rule)]">
              <Image
                src={memory.cover_url}
                alt=""
                fill
                sizes="(min-width: 64rem) 600px, 100vw"
                className="object-cover"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
              />
            </div>
          ) : null}

          {/* Action row (placeholders) */}
          <div className="mt-3 flex items-center gap-6 text-[color:var(--color-body)]">
            <button
              type="button"
              onClick={stop}
              disabled
              aria-label="Comments (coming soon)"
              className="pointer-events-auto relative flex items-center gap-1.5 text-xs hover:text-[color:var(--color-brand-red)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="size-4" aria-hidden />
              <span className="tabular-nums">0</span>
            </button>
            <button
              type="button"
              onClick={stop}
              disabled
              aria-label="React (coming soon)"
              className="pointer-events-auto relative flex items-center gap-1.5 text-xs hover:text-[color:var(--color-brand-red)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart className="size-4" aria-hidden />
              <span className="tabular-nums">0</span>
            </button>
            <button
              type="button"
              onClick={stop}
              disabled
              aria-label="Share (coming soon)"
              className="pointer-events-auto relative flex items-center gap-1.5 text-xs hover:text-[color:var(--color-brand-red)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="size-4" aria-hidden />
            </button>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
              Read →
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
