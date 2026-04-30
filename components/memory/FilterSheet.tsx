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
import { TimelineRail, type EraCount } from "./TimelineRail";

export function FilterSheet({ eras, active }: { eras: EraCount[]; active: number | null }) {
  const [open, setOpen] = useState(false);
  const label = active !== null ? `Era · ${active}` : "Filter";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Filter className="size-4" aria-hidden />
          <span className="ml-2 font-mono text-xs uppercase tracking-widest">{label}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter by era</DrawerTitle>
        </DrawerHeader>
        <div
          className="px-5 pb-6"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <TimelineRail eras={eras} active={active} orientation="vertical" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
