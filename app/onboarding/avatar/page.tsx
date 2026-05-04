import { Stepper } from "../Stepper";
import { saveAvatar } from "../actions";
import { AvatarUploadField } from "@/components/profile/AvatarUploadField";

export default function OnboardingAvatar() {
  return (
    <>
      <Stepper current="avatar" />
      <h1 className="mt-6 font-display text-3xl text-[color:var(--color-ink)]">
        Add a photo. Optional.
      </h1>
      <p className="mt-2 text-[color:var(--color-body)]">JPG or PNG, 5MB max.</p>
      <form action={saveAvatar} className="mt-8 flex flex-col gap-3">
        <AvatarUploadField />
        <button
          type="submit"
          className="mt-2 rounded bg-[color:var(--color-ink)] px-4 py-3 text-base font-medium text-[color:var(--color-ivory)]"
        >
          Continue
        </button>
        <button
          type="submit"
          name="skip"
          value="1"
          formNoValidate
          className="text-sm text-[color:var(--color-ink)] underline"
        >
          Skip for now
        </button>
      </form>
    </>
  );
}
