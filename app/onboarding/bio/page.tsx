import { Stepper } from "../Stepper";
import { saveBio } from "../actions";

export default function OnboardingBio() {
  return (
    <>
      <Stepper current="bio" />
      <h1 className="mt-6 font-display text-3xl text-[color:var(--color-ink)]">
        A short bio. Optional.
      </h1>
      <p className="mt-2 text-[color:var(--color-body)]">
        A line or two about your time on the team. You can edit later.
      </p>
      <form action={saveBio} className="mt-8 flex flex-col gap-3">
        <textarea
          id="bio"
          name="bio"
          rows={6}
          maxLength={1000}
          className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2 text-base"
        />
        <button
          type="submit"
          className="mt-2 rounded bg-[color:var(--color-ink)] px-4 py-3 text-base font-medium text-[color:var(--color-ivory)]"
        >
          Finish
        </button>
        <button
          type="submit"
          name="skip"
          value="1"
          formNoValidate
          className="text-sm text-[color:var(--color-ink)] underline"
        >
          Skip and finish
        </button>
      </form>
    </>
  );
}
