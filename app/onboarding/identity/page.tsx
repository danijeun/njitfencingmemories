import { redirect } from "next/navigation";
import { Stepper } from "../Stepper";
import { saveIdentity } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingIdentity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, major")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Stepper current="identity" />
      <h1 className="mt-6 font-display text-3xl text-[color:var(--color-ink)]">Who are you?</h1>
      <form action={saveIdentity} className="mt-8 flex flex-col gap-3">
        <label className="text-sm" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name ?? ""}
          className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2 text-base"
        />
        <label className="mt-2 text-sm" htmlFor="major">
          Major
        </label>
        <input
          id="major"
          name="major"
          type="text"
          required
          defaultValue={profile?.major ?? ""}
          className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2 text-base"
        />
        <button
          type="submit"
          className="mt-4 rounded bg-[color:var(--color-ink)] px-4 py-3 text-base font-medium text-[color:var(--color-ivory)]"
        >
          Continue
        </button>
      </form>
    </>
  );
}
