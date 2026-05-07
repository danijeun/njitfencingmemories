"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CoverPicker } from "@/components/memory/CoverPicker";
import { AutosavePill } from "@/components/editor/AutosavePill";
import { useAutosave } from "@/components/editor/useAutosave";
import { autosaveDraft, createMemory } from "./actions";

const MemoryEditor = dynamic(
  () => import("@/components/editor/MemoryEditor").then((m) => m.MemoryEditor),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

export function NewMemoryClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [era, setEra] = useState<string>("");
  const [body, setBody] = useState<object>({ type: "doc", content: [{ type: "paragraph" }] });
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const payload = useMemo(
    () => ({
      title,
      excerpt,
      era: era ? Number(era) : null,
      body,
      cover_path: coverPath,
    }),
    [title, excerpt, era, body, coverPath],
  );

  const autosave = useAutosave({
    initialId: null,
    payload,
    save: autosaveDraft,
    enabled: title.trim().length > 0,
  });

  const submit = (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      const res = await createMemory({
        title,
        excerpt,
        era: era ? Number(era) : null,
        body,
        cover_path: coverPath,
        publish,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(publish ? "Published." : "Saved as draft.");
      router.push(`/memories/${res.id}`);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-title">Title</Label>
        <Input
          id="m-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A meet, a road trip, a coach…"
          maxLength={200}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-excerpt">Excerpt</Label>
          <Textarea
            id="m-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="One or two sentences for the feed."
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-era">Era</Label>
          <Input
            id="m-era"
            type="number"
            inputMode="numeric"
            min={1980}
            max={2100}
            value={era}
            onChange={(e) => setEra(e.target.value)}
            placeholder="2008"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Cover image</Label>
        <CoverPicker value={coverPath} onChange={setCoverPath} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Body</Label>
        <MemoryEditor onChange={setBody} placeholder="Tell the story…" />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-2 flex flex-wrap items-center gap-3 border-t border-[color:var(--color-rule)] bg-[color:var(--color-ivory)]/90 px-4 py-3 pb-safe backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:pb-0">
        <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
          Save draft
        </Button>
        <Button type="button" disabled={pending} onClick={() => submit(true)}>
          {pending ? "Publishing…" : "Publish"}
        </Button>
        <div className="ms-auto">
          <AutosavePill
            status={autosave.status}
            savedAt={autosave.savedAt}
            error={autosave.error}
          />
        </div>
      </div>
    </div>
  );
}
