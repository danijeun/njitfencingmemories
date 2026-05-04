import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/auth/profile";

export function Stepper({ current }: { current: OnboardingStep }) {
  const i = ONBOARDING_STEPS.indexOf(current);
  return (
    <ol className="mt-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
      {ONBOARDING_STEPS.map((s, idx) => (
        <li
          key={s}
          aria-current={idx === i ? "step" : undefined}
          className={
            idx <= i
              ? "rounded bg-[color:var(--color-ink)] px-2 py-1 text-[color:var(--color-ivory)]"
              : "rounded border border-[color:var(--color-ink)]/30 px-2 py-1 opacity-60"
          }
        >
          {idx + 1}. {s}
        </li>
      ))}
    </ol>
  );
}
