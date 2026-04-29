"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
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

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col gap-2">
      <Toolbar
        items={[
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
          { icon: Link2, label: "Link", active: editor.isActive("link"), onClick: promptLink },
          { icon: Undo2, label: "Undo", onClick: () => editor.chain().focus().undo().run() },
          { icon: Redo2, label: "Redo", onClick: () => editor.chain().focus().redo().run() },
        ]}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolbarItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function Toolbar({ items }: { items: ToolbarItem[] }) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-14 z-30 -mx-1 flex gap-1 overflow-x-auto rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-ivory)]/90 px-1 py-1 backdrop-blur md:static md:top-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.25rem)" }}
    >
      {items.map(({ icon: Icon, label, active, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={!!active}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]",
            active &&
              "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:opacity-90",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
