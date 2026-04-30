type Node = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: unknown;
  text?: string;
};

function isAllowedImageSrc(src: unknown, supabaseHost: string | null): boolean {
  if (typeof src !== "string") return false;
  if (!src.startsWith("https://")) return false;
  if (!supabaseHost) return true;
  try {
    const u = new URL(src);
    return u.host === supabaseHost && u.pathname.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

function getSupabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function sanitizeMemoryBody(body: unknown): object {
  const host = getSupabaseHost();

  const walk = (node: Node | null | undefined): Node | null => {
    if (!node || typeof node !== "object") return null;
    if (node.type === "image") {
      if (!isAllowedImageSrc(node.attrs?.src, host)) return null;
      const next: Node = {
        type: "image",
        attrs: {
          src: node.attrs?.src,
          alt: typeof node.attrs?.alt === "string" ? node.attrs.alt : null,
          title: typeof node.attrs?.title === "string" ? node.attrs.title : null,
          width: typeof node.attrs?.width === "number" ? node.attrs.width : null,
          height: typeof node.attrs?.height === "number" ? node.attrs.height : null,
        },
      };
      return next;
    }
    const cloned: Node = { ...node };
    if (Array.isArray(node.content)) {
      cloned.content = node.content.map(walk).filter((n): n is Node => n !== null);
    }
    return cloned;
  };

  const out = walk(body as Node);
  return (out as object) ?? { type: "doc", content: [{ type: "paragraph" }] };
}
