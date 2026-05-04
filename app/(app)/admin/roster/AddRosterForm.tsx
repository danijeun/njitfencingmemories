"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addRosterEntry } from "./actions";

export function AddRosterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addRosterEntry(formData);
      if (!res.ok) setError(res.error);
      else (document.getElementById("add-roster-form") as HTMLFormElement | null)?.reset();
    });
  }

  return (
    <form
      id="add-roster-form"
      action={onSubmit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="lg:col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue="athlete"
          className="flex h-11 w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-3 py-2 text-base text-[color:var(--color-body)]"
        >
          <option value="athlete">Athlete</option>
          <option value="alumni">Alumni</option>
          <option value="coach">Coach</option>
        </select>
      </div>
      <div>
        <Label htmlFor="class_year">Class year</Label>
        <Input id="class_year" name="class_year" type="number" min={1980} max={2100} required />
      </div>

      <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-[color:var(--color-oxblood)]" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add member"}
        </Button>
      </div>
    </form>
  );
}
