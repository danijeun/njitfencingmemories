"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { togglePin } from "@/app/(app)/memories/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PinToggle({ memoryId, pinned }: { memoryId: string; pinned: boolean }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await togglePin({ memoryId, pinned: !pinned });
      if (result.ok) {
        toast.success(pinned ? "Unpinned" : "Pinned to top");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        aria-label="Memory actions"
        className="pointer-events-auto relative grid size-8 place-items-center rounded-full text-[color:var(--color-body)] hover:bg-[color:var(--color-rule)] hover:text-[color:var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-red)]"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem disabled={isPending} onSelect={onClick}>
          {pinned ? (
            <>
              <PinOff className="size-3.5" aria-hidden /> Unpin
            </>
          ) : (
            <>
              <Pin className="size-3.5" aria-hidden /> Pin to top
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
