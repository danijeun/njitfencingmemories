"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { approveRequest, declineRequest } from "./actions";

export type RequestRowData = {
  id: string;
  email: string;
  full_name: string;
  status: "pending" | "approved" | "declined";
  requested_at: string;
  decided_at: string | null;
  decided_by_name: string | null;
  prior_count: number;
};

export function RequestRow({ row }: { row: RequestRowData }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);

  function onApprove(formData: FormData) {
    setError(null);
    formData.set("id", row.id);
    startTransition(async () => {
      const res = await approveRequest(formData);
      if (!res.ok) setError(res.error);
      else setApproveOpen(false);
    });
  }

  function onDecline() {
    setError(null);
    const fd = new FormData();
    fd.set("id", row.id);
    startTransition(async () => {
      const res = await declineRequest(fd);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-[color:var(--color-ink)]">
          {row.full_name}
          {row.prior_count > 0 && (
            <span
              className="ml-2 rounded bg-[color:var(--color-rule)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-ink)]/70"
              title={`${row.prior_count} previous request(s) from this email`}
            >
              {row.prior_count} prior
            </span>
          )}
        </div>
        <div className="truncate font-mono text-xs text-[color:var(--color-ink)]/60">
          {row.email}
        </div>
      </div>
      <span
        className="font-mono text-xs text-[color:var(--color-ink)]/60"
        title={new Date(row.requested_at).toLocaleString()}
      >
        {new Date(row.requested_at).toLocaleDateString()}
      </span>

      {row.status === "pending" ? (
        <div className="flex gap-2">
          <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={isPending}>
                Approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve {row.full_name}?</DialogTitle>
                <DialogDescription>
                  Adds them to the roster and sends an approval email to {row.email}.
                </DialogDescription>
              </DialogHeader>
              <form action={onApprove} className="grid gap-3">
                <div>
                  <Label htmlFor={`role-${row.id}`}>Role</Label>
                  <select
                    id={`role-${row.id}`}
                    name="role"
                    required
                    defaultValue="alumni"
                    className="flex h-11 w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-3 py-2 text-base text-[color:var(--color-body)]"
                  >
                    <option value="athlete">Athlete</option>
                    <option value="alumni">Alumni</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`year-${row.id}`}>Class year</Label>
                  <Input
                    id={`year-${row.id}`}
                    name="class_year"
                    type="number"
                    min={1980}
                    max={2100}
                    required
                    defaultValue={new Date().getFullYear()}
                  />
                </div>
                {error && (
                  <p className="text-sm text-[color:var(--color-oxblood)]" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Approving…" : "Approve & email"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" disabled={isPending}>
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.full_name} ({row.email}) will get a decline email. They can request again
                  later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="oxblood" size="sm" onClick={onDecline}>
                    Decline
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <span
          className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]/70"
          title={
            row.decided_at
              ? `${row.status} ${new Date(row.decided_at).toLocaleString()}${row.decided_by_name ? ` by ${row.decided_by_name}` : ""}`
              : row.status
          }
        >
          {row.status}
        </span>
      )}

      {error && (
        <p className="w-full text-sm text-[color:var(--color-oxblood)]" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
