import * as React from "react";

type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

function applyMarks(text: string, marks: TiptapMark[] | undefined, key: string): React.ReactNode {
  let node: React.ReactNode = text;
  if (!marks || marks.length === 0) return <React.Fragment key={key}>{node}</React.Fragment>;
  marks.forEach((mark, i) => {
    const k = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        node = <strong key={k}>{node}</strong>;
        break;
      case "italic":
        node = <em key={k}>{node}</em>;
        break;
      case "strike":
        node = <s key={k}>{node}</s>;
        break;
      case "code":
        node = (
          <code
            key={k}
            className="rounded bg-[color:var(--color-paper)] px-1 py-0.5 font-mono text-[0.9em]"
          >
            {node}
          </code>
        );
        break;
      case "underline":
        node = <u key={k}>{node}</u>;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "#";
        const target = mark.attrs?.target as string | undefined;
        node = (
          <a
            key={k}
            href={href}
            target={target}
            rel={target === "_blank" ? "noopener noreferrer" : undefined}
            className="underline hover:opacity-70"
          >
            {node}
          </a>
        );
        break;
      }
      default:
        break;
    }
  });
  return <React.Fragment key={key}>{node}</React.Fragment>;
}

function renderNode(node: TiptapNode, key: string): React.ReactNode {
  const children = node.content?.map((child, i) => renderNode(child, `${key}-${i}`));

  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return (
        <p key={key} className="my-4 leading-8">
          {children}
        </p>
      );
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 1), 6);
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const sizes: Record<number, string> = {
        1: "mt-10 mb-4 font-display text-3xl sm:text-4xl",
        2: "mt-8 mb-3 font-display text-2xl sm:text-3xl",
        3: "mt-6 mb-2 font-display text-xl sm:text-2xl",
        4: "mt-6 mb-2 font-display text-lg",
        5: "mt-4 mb-2 font-display text-base",
        6: "mt-4 mb-2 font-display text-sm uppercase tracking-widest",
      };
      return (
        <Tag key={key} className={sizes[level]}>
          {children}
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="my-4 list-disc space-y-2 pl-6 leading-8">
          {children}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="my-4 list-decimal space-y-2 pl-6 leading-8">
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-6 border-l-2 border-[color:var(--color-brand-red)] pl-4 italic text-[color:var(--color-body)]"
        >
          {children}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre
          key={key}
          className="my-6 overflow-x-auto rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 font-mono text-sm"
        >
          <code>{children}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} className="my-8 border-[color:var(--color-rule)]" />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = node.attrs?.src as string | undefined;
      if (!src) return null;
      const alt = (node.attrs?.alt as string) ?? "";
      const w = typeof node.attrs?.width === "number" ? node.attrs.width : undefined;
      const h = typeof node.attrs?.height === "number" ? node.attrs.height : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={src}
          alt={alt}
          width={w}
          height={h}
          loading="lazy"
          decoding="async"
          className="my-6 h-auto w-full rounded-lg border border-[color:var(--color-rule)]"
        />
      );
    }
    case "text":
      return applyMarks(node.text ?? "", node.marks, key);
    default:
      return children ? <React.Fragment key={key}>{children}</React.Fragment> : null;
  }
}

export function MemoryBody({ body }: { body: unknown }) {
  if (!body || typeof body !== "object") return null;
  const doc = body as TiptapNode;
  if (doc.type !== "doc" || !doc.content?.length) return null;
  return <div className="text-[color:var(--color-ink)]">{renderNode(doc, "n")}</div>;
}
