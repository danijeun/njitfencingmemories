"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CoverPicker } from "@/components/memory/CoverPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMemory, updateMemory } from "./actions";

const MemoryEditor = dynamic(
  () => import("@/components/editor/MemoryEditor").then((m) => m.MemoryEditor),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

export type EditMemoryInitial = {
  id: string;
  title: string;
  excerpt: string;
  era: number | null;
  body: object | null;
  cover_path: string | null;
  status: "draft" | "published";
};

export function EditMemoryClient({ initial }: { initial: EditMemoryInitial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [era, setEra] = useState<string>(initial.era ? String(initial.era) : "");
  const [body, setBody] = useState<object>(
    initial.body && typeof initial.body === "object"
      ? initial.body
      : { type: "doc", content: [{ type: "paragraph" }] },
  );
  const [coverPath, setCoverPath] = useState<string | null>(initial.cover_path ?? null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  const submit = (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      const res = await updateMemory(initial.id, {
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
      toast.success(publish ? "Saved + published." : "Saved as draft.");
      router.push(`/memories/${initial.id}`);
      router.refresh();
    });
  };

  const onDelete = () => {
    startDelete(async () => {
      const res = await deleteMemory(initial.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Memory deleted.");
      router.push("/memories");
      router.refresh();
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
        <MemoryEditor initialContent={body} onChange={setBody} placeholder="Tell the story…" />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-2 flex flex-wrap gap-3 border-t border-[color:var(--color-rule)] bg-[color:var(--color-ivory)]/90 px-4 py-3 pb-safe backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:pb-0">
        <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
          {initial.status === "published" ? "Unpublish (save draft)" : "Save draft"}
        </Button>
        <Button type="button" disabled={pending} onClick={() => submit(true)}>
          {pending ? "Saving…" : initial.status === "published" ? "Save changes" : "Publish"}
        </Button>
        <div className="ms-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="oxblood" disabled={deleting}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the memory and its body. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
