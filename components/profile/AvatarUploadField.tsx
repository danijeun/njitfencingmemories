"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  name?: string;
  id?: string;
  initialPreviewUrl?: string | null;
  initialName?: string | null;
  maxSizeMb?: number;
  className?: string;
};

const ICON_UPLOAD = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 16V4" />
    <path d="m6 10 6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

const ICON_X = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export function AvatarUploadField({
  name = "avatar",
  id = "avatar",
  initialPreviewUrl = null,
  initialName = null,
  maxSizeMb = 5,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl);
  const [fileName, setFileName] = useState<string | null>(initialName);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const accept = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMb} MB.`);
      return;
    }
    setError(null);
    setFileName(file.name);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const onPick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) accept(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    accept(file);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(initialPreviewUrl);
    setFileName(null);
    setError(null);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-stretch gap-3 rounded-2xl border border-dashed p-3 transition-colors sm:flex-row sm:items-center",
          dragOver
            ? "border-[color:var(--color-brand-red)] bg-[color:var(--color-brand-red)]/5"
            : "border-[color:var(--color-rule)] bg-[color:var(--color-paper)]/40",
        )}
      >
        <div
          aria-hidden="true"
          className="relative size-16 shrink-0 overflow-hidden rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]"
        >
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
              No photo
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-1">
          <p className="truncate text-sm text-[color:var(--color-ink)]">
            {fileName ?? "Drag an image here or pick a file."}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
            JPG or PNG · up to {maxSizeMb} MB
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPick} aria-controls={id}>
            {ICON_UPLOAD}
            {fileName ? "Change" : "Choose file"}
          </Button>
          {fileName ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clear}
              aria-label="Remove selected image"
              className="h-9 w-9"
            >
              {ICON_X}
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="sr-only"
        />
      </div>

      {error ? (
        <span
          role="alert"
          className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-oxblood)]"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
