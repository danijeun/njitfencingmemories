import Link from "next/link";
import { RequestAccessForm } from "./RequestAccessForm";

export const metadata = {
  title: "Request access — NJIT Fencing Memories",
};

export default function RequestAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          Access
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-[color:var(--color-ink)]">
          Request access
        </h1>
        <p className="mt-3 text-[color:var(--color-body)]">
          For NJIT fencing athletes, alumni, and coaches who aren&apos;t on the roster yet. An admin
          will review and email you back.
        </p>

        <RequestAccessForm />

        <p className="mt-6 text-sm text-[color:var(--color-body)]">
          Already approved?{" "}
          <Link
            href="/login"
            className="underline decoration-[color:var(--color-brand-red)] underline-offset-4"
          >
            Sign in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
