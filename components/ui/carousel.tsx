"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];

const CarouselContext = React.createContext<{ api: CarouselApi } | null>(null);

export function Carousel({
  className,
  children,
  options,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  options?: Parameters<typeof useEmblaCarousel>[0];
}) {
  const [emblaRef, api] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    ...options,
  });
  return (
    <CarouselContext.Provider value={{ api }}>
      <div
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">{children}</div>
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselSlide({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4 first:pl-0", className)}
      {...props}
    />
  );
}

export function CarouselButtons() {
  const ctx = React.useContext(CarouselContext);
  const api = ctx?.api;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-1">
      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        aria-label="Previous slide"
        className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--color-ivory)]/85 text-[color:var(--color-ink)] shadow backdrop-blur hover:opacity-90"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        aria-label="Next slide"
        className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--color-ivory)]/85 text-[color:var(--color-ink)] shadow backdrop-blur hover:opacity-90"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
