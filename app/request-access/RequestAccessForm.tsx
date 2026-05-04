"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitAccessRequest } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "alreadyApproved" }
  | { kind: "error"; message: string };

export function RequestAccessForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setState({ kind: "submitting" });
    startTransition(async () => {
      const res = await submitAccessRequest(formData);
      if (res.ok) {
        setState({ kind: "ok" });
        return;
      }
      if (res.code === "alreadyApproved") {
        setState({ kind: "alreadyApproved" });
        return;
      }
      setState({ kind: "error", message: res.error });
    });
  }

  if (state.kind === "ok") {
    return (
      <div className="mt-8 rounded border border-[color:var(--color-ink)]/20 bg-[color:var(--color-paper)] p-4 text-sm">
        <p className="font-medium text-[color:var(--color-ink)]">Request submitted.</p>
        <p className="mt-1 text-[color:var(--color-body)]">
          An admin will review it. You&apos;ll get an email at the address you provided once a
          decision is made.
        </p>
      </div>
    );
  }

  if (state.kind === "alreadyApproved") {
    return (
      <div className="mt-8 rounded border border-[color:var(--color-ink)]/20 bg-[color:var(--color-paper)] p-4 text-sm">
        <p className="font-medium text-[color:var(--color-ink)]">You&apos;re already approved.</p>
        <p className="mt-1 text-[color:var(--color-body)]">
          That email is on the roster. Sign in with it at{" "}
          <Link
            href="/login"
            className="underline decoration-[color:var(--color-brand-red)] underline-offset-4"
          >
            the login page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="mt-8 flex flex-col gap-3">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Submitting…" : "Request access"}
      </Button>
      {state.kind === "error" && (
        <p className="text-sm text-[color:var(--color-oxblood)]" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
