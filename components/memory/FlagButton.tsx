"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { flagMemory } from "@/app/(app)/memories/[id]/actions";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "off-topic", label: "Off-topic" },
  { value: "other", label: "Other" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

export function FlagButton({ memoryId }: { memoryId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("spam");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await flagMemory({
        memoryId,
        reason,
        note: note.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Reported. An admin will review.");
      setOpen(false);
      setNote("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:text-[color:var(--color-brand-red)]"
        >
          Report
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this memory</DialogTitle>
          <DialogDescription>
            Tell an admin what&apos;s wrong. Reports are private to admins.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="flag-reason">Reason</Label>
            <select
              id="flag-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
              className="flex h-11 w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-3 py-2 text-base text-[color:var(--color-body)]"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="flag-note">Notes (optional)</Label>
            <Textarea
              id="flag-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Anything else an admin should know"
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={pending} onClick={submit}>
              {pending ? "Sending…" : "Submit report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
