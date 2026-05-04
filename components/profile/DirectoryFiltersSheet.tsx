"use client";

import { useState, type ReactNode } from "react";
import { Filter } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export function DirectoryFiltersSheet({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Filter className="size-4" aria-hidden />
          <span className="ml-2 font-mono text-xs uppercase tracking-widest">
            Filter{activeCount > 0 ? ` · ${activeCount}` : ""}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter directory</DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
