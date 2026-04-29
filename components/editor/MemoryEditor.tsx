"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Editor } from "@tiptap/react";

type Props = {
  initialContent?: object | string | null;
  onChange?: (json: object) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function MemoryEditor({
  initialContent,
  onChange,
  placeholder = "Tell the story…",
  ariaLabel = "Memory body",
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image,
      Typography,
      CharacterCount,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class:
          "prose-tight min-h-64 max-w-none rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-4 py-3 text-base text-[color:var(--color-body)] focus-visible:outline-none focus-visible:border-[color:var(--color-ink)] [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-4 [&_h3]:font-display [&_h3]:text-xl [&_h3]:mt-3 [&_p]:leading-7 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--color-ink)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:underline [&_a]:underline-offset-2",
      },
    },
    onUpdate: ({ editor: e }) => onChange?.(e.getJSON()),
  });

  if (!editor) {
    return (
      <div className="min-h-64 rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]" />
    );
  }

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <Toolbar editor={editor} />
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e, from, to }) => from !== to && e.isEditable}
          className="flex gap-1 rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-ink)] p-1 shadow-lg"
        >
          <BubbleButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={Bold}
          />
          <BubbleButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={Italic}
          />
          <BubbleButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={Quote}
          />
          <LinkPopoverTrigger editor={editor} variant="bubble" />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
      <div className="flex justify-end font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]/70">
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const items = [
    {
      icon: Bold,
      label: "Bold",
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Heading2,
      label: "Heading",
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: "Bullet list",
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Numbered list",
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Quote",
      active: editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-14 z-30 -mx-1 flex gap-1 overflow-x-auto rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-ivory)]/90 px-1 py-1 backdrop-blur md:static md:top-auto"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.25rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.25rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.25rem)",
      }}
    >
      {items.map(({ icon: Icon, label, active, onClick }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClick}
              aria-label={label}
              aria-pressed={!!active}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper)] [@media(pointer:coarse)]:size-11",
                active &&
                  "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:opacity-90",
              )}
            >
              <Icon className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
      <LinkPopoverTrigger editor={editor} variant="toolbar" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            aria-label="Undo"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper)] [@media(pointer:coarse)]:size-11"
          >
            <Undo2 className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            aria-label="Redo"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper)] [@media(pointer:coarse)]:size-11"
          >
            <Redo2 className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
    </div>
  );
}

function BubbleButton({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded text-[color:var(--color-paper)] hover:bg-white/10",
        active && "bg-white/20",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function LinkPopoverTrigger({
  editor,
  variant,
}: {
  editor: Editor;
  variant: "toolbar" | "bubble";
}) {
  const [open, setOpen] = React.useState(false);
  const [href, setHref] = React.useState("");
  const active = editor.isActive("link");

  function handleOpenChange(next: boolean) {
    if (next) setHref((editor.getAttributes("link").href as string) ?? "");
    setOpen(next);
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const url = href.trim();
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setOpen(false);
  }

  function clear() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  }

  const triggerClass =
    variant === "toolbar"
      ? cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper)] [@media(pointer:coarse)]:size-11",
          active && "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:opacity-90",
        )
      : cn(
          "inline-flex size-8 items-center justify-center rounded text-[color:var(--color-paper)] hover:bg-white/10",
          active && "bg-white/20",
        );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Link" aria-pressed={active} className={triggerClass}>
              <Link2 className="size-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Link</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80">
        <form onSubmit={apply} className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
            URL
          </label>
          <Input
            autoFocus
            type="url"
            inputMode="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://"
          />
          <div className="flex justify-end gap-2">
            {active && (
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Remove
              </Button>
            )}
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
