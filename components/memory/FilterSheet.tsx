"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { type EraCount } from "./TimelineRail";
import { FeedFiltersPanel, useFeedFilterState } from "./FeedFilters";

export function FilterSheet({ eras }: { eras: EraCount[] }) {
  const [open, setOpen] = useState(false);
  const { sort, roles, eras: activeEras } = useFeedFilterState();
  const activeCount = (sort !== "newest" ? 1 : 0) + roles.length + activeEras.length;
  const label = activeCount > 0 ? `Filters · ${activeCount}` : "Filter";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Filter className="size-4" aria-hidden />
          <span className="ml-2 font-mono text-xs uppercase tracking-widest">{label}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter memories</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[70dvh] overflow-y-auto px-5 pb-8">
          <FeedFiltersPanel eras={eras} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
