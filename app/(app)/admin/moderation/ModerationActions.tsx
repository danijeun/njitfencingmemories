"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { resolveFlag, restoreMemory, softDeleteMemory } from "./actions";

type Props = {
  memoryId: string;
  flagId?: string;
  isDeleted?: boolean;
};

export function ModerationActions({ memoryId, flagId, isDeleted }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) => {
    startTransition(async () => {
      const res = await fn(fd);
      if (!res.ok) toast.error(res.error ?? "Failed");
      else toast.success("Done.");
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {flagId ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id", flagId);
            run(resolveFlag, fd);
          }}
        >
          Dismiss
        </Button>
      ) : null}
      {!isDeleted ? (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="oxblood" disabled={pending}>
              Soft-delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hide this memory from the feed?</AlertDialogTitle>
              <AlertDialogDescription>
                It will be removed from public views and the author can no longer see it. You can
                restore it from the Deleted tab.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="oxblood"
                  size="sm"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("id", memoryId);
                    run(softDeleteMemory, fd);
                    setConfirmDelete(false);
                  }}
                >
                  Soft-delete
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id", memoryId);
            run(restoreMemory, fd);
          }}
        >
          Restore
        </Button>
      )}
    </div>
  );
}
