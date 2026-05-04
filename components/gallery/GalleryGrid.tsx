"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryItem = {
  key: string;
  memoryId: string;
  title: string;
  src: string;
  kind: "cover" | "inline";
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const open = openIndex !== null;

  return (
    <>
      <ul
        className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3 [&>li]:break-inside-avoid"
        aria-label="Memory gallery"
      >
        {items.map((it, i) => (
          <li key={it.key}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Open image: ${it.title}`}
              className="group relative block w-full overflow-hidden rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-ivory)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-red)]"
            >
              <Image
                src={it.src}
                alt={it.title}
                width={800}
                height={600}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="h-auto w-full object-cover transition-opacity group-hover:opacity-90"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-ink)]/80 to-transparent p-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-white)] opacity-0 transition-opacity group-hover:opacity-100">
                {it.title}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        items={items}
        open={open}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}

function Lightbox({
  items,
  open,
  startIndex,
  onClose,
}: {
  items: GalleryItem[];
  open: boolean;
  startIndex: number;
  onClose: () => void;
}) {
  const [emblaRef, api] = useEmblaCarousel({
    startIndex,
    loop: false,
    containScroll: "trimSnaps",
  });
  const [active, setActive] = React.useState(startIndex);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (open && api) api.scrollTo(startIndex, true);
  }, [open, startIndex, api]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, api]);

  const current = items[active];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {current?.title ?? "Image"}
          </DialogPrimitive.Title>

          <div className="flex items-center justify-between px-4 py-3 text-[color:var(--color-brand-white)] sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest">
              {active + 1} / {items.length}
            </p>
            <DialogPrimitive.Close
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-red)]"
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative min-h-0 flex-1">
            <div ref={emblaRef} className="h-full overflow-hidden">
              <div className="flex h-full">
                {items.map((it) => (
                  <div
                    key={it.key}
                    role="group"
                    aria-roledescription="slide"
                    className="relative flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4 sm:px-10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.src}
                      alt={it.title}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => api?.scrollPrev()}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[color:var(--color-brand-white)] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-red)] sm:left-4"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => api?.scrollNext()}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[color:var(--color-brand-white)] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-red)] sm:right-4"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-4 text-[color:var(--color-brand-white)] sm:px-6">
            <p className="truncate font-display text-base sm:text-lg">{current?.title}</p>
            {current ? (
              <Link
                href={`/memories/${current.memoryId}`}
                onClick={onClose}
                className="shrink-0 font-mono text-[11px] uppercase tracking-widest underline decoration-white/40 underline-offset-4 hover:decoration-[color:var(--color-brand-red)]"
              >
                View memory →
              </Link>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
