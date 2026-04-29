"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfile } from "./actions";

const schema = z.object({
  full_name: z.string().trim().min(2, "Required"),
  class_year: z.number({ error: "Required" }).int().min(1980, "Too early").max(2100, "Too late"),
  major: z.string().trim().min(2, "Required"),
  bio: z.string().max(1000, "Max 1000 chars").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const ERROR_MESSAGES: Record<string, string> = {
  required: "Please fill out every required field.",
  bad_avatar: "Avatar must be an image under 5 MB.",
  upload_failed: "Avatar upload failed. Try again.",
};

export function EditProfileForm({ defaults }: { defaults: Partial<FormValues> }) {
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaults.full_name ?? "",
      class_year: defaults.class_year ?? undefined,
      major: defaults.major ?? "",
      bio: defaults.bio ?? "",
    },
  });

  useEffect(() => {
    const err = params.get("error");
    if (err) toast.error(ERROR_MESSAGES[err] ?? "Something went wrong.");
  }, [params]);

  const onValid = (_values: FormValues, event?: React.BaseSyntheticEvent) => {
    const form = event?.target as HTMLFormElement | undefined;
    if (!form) return;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        await saveProfile(data);
      } catch (e) {
        if ((e as { digest?: string })?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
        toast.error("Could not save profile.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="mt-6 flex flex-col gap-5" noValidate>
      <Field label="Full name" error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" {...register("full_name")} />
      </Field>

      <Field label="Class year" error={errors.class_year?.message}>
        <Input
          id="class_year"
          type="number"
          inputMode="numeric"
          min={1980}
          max={2100}
          {...register("class_year", { valueAsNumber: true })}
        />
      </Field>

      <Field label="Major" error={errors.major?.message}>
        <Input id="major" {...register("major")} />
      </Field>

      <Field label="Bio" error={errors.bio?.message}>
        <Textarea id="bio" rows={5} maxLength={1000} {...register("bio")} />
      </Field>

      <Field label="Replace avatar">
        <Input id="avatar" name="avatar" type="file" accept="image/*" className="h-auto py-2" />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="mt-2 self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {error ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-oxblood)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
