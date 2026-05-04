"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage, UploadError } from "@/lib/storage/upload-image";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon, X } from "lucide-react";

type Props = {
  value: string | null;
  onChange: (path: string | null) => void;
};

function publicUrl(path: string) {
  return createClient().storage.from("memory-covers").getPublicUrl(path).data.publicUrl;
}

export function CoverPicker({ value, onChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const img = await uploadImage(file, "memory-covers");
      onChange(img.path);
    } catch (err) {
      const msg = err instanceof UploadError ? err.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={pick}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-[color:var(--color-rule)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicUrl(value)} alt="Cover preview" className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove cover"
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[color:var(--color-rule)] bg-[color:var(--color-paper)] text-sm text-[color:var(--color-body)] transition-colors hover:border-[color:var(--color-ink)] disabled:opacity-50"
        >
          <ImageIcon className="size-5" />
          {busy ? "Uploading…" : "Add cover image"}
        </button>
      )}
      {value ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="self-start"
        >
          {busy ? "Uploading…" : "Replace cover"}
        </Button>
      ) : null}
    </div>
  );
}
