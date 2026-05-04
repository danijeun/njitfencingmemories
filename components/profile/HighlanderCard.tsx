import { Link } from "next-view-transitions";

type Profile = {
  id: string;
  full_name: string;
  slug: string | null;
  role: "athlete" | "alumni" | "coach";
  class_year: number;
  major: string | null;
};

const ROLE_LABEL: Record<Profile["role"], string> = {
  athlete: "Athlete",
  alumni: "Alum",
  coach: "Coach",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function HighlanderCard({
  profile,
  avatarUrl,
}: {
  profile: Profile;
  avatarUrl: string | null;
}) {
  const href = profile.slug ? `/profile/${profile.slug}` : "#";
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 transition-colors hover:border-[color:var(--color-ink)]"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-ivory)] font-display text-lg text-[color:var(--color-ink)]">
          {initials(profile.full_name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-tight text-[color:var(--color-ink)] transition-colors group-hover:text-[color:var(--color-oxblood)]">
          {profile.full_name}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          {ROLE_LABEL[profile.role]} · ’{String(profile.class_year).slice(-2)}
        </p>
        {profile.major ? (
          <p className="mt-0.5 truncate text-xs text-[color:var(--color-body)]">{profile.major}</p>
        ) : null}
      </div>
    </Link>
  );
}
