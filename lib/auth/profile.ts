import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  role: "athlete" | "alumni";
  class_year: number;
  full_name: string;
  major: string | null;
  avatar_path: string | null;
  bio: string | null;
  slug: string | null;
  onboarded_at: string | null;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return (data as Profile) ?? null;
}

export const ONBOARDING_ENTRY = "/onboarding/class";
export const ONBOARDING_STEPS = ["class", "identity", "avatar", "bio"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function nextStepPath(current: OnboardingStep): string {
  const i = ONBOARDING_STEPS.indexOf(current);
  const next = ONBOARDING_STEPS[i + 1];
  return next ? `/onboarding/${next}` : "/profile/me";
}
