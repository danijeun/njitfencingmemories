import { redirect } from "next/navigation";
import { Stepper } from "../Stepper";
import { saveClass } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingClass() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("class_year, role")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Stepper current="class" />
      <h1 className="mt-6 font-display text-3xl text-[color:var(--color-ink)]">
        Confirm your class.
      </h1>
      <p className="mt-2 text-[color:var(--color-body)]">
        You&apos;re registered as a{profile?.role === "athlete" ? " current athlete" : "n alum"}.
      </p>
      <form action={saveClass} className="mt-8 flex flex-col gap-3">
        <label className="text-sm" htmlFor="class_year">
          Class year
        </label>
        <input
          id="class_year"
          name="class_year"
          type="number"
          min={1980}
          max={2100}
          defaultValue={profile?.class_year ?? ""}
          required
          className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2 text-base"
        />
        <button
          type="submit"
          className="mt-2 rounded bg-[color:var(--color-ink)] px-4 py-3 text-base font-medium text-[color:var(--color-ivory)]"
        >
          Continue
        </button>
      </form>
    </>
  );
}
