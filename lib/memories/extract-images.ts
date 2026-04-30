type Node = { type?: string; attrs?: Record<string, unknown>; content?: Node[] };

export function extractImageSrcs(body: unknown): string[] {
  const out: string[] = [];
  const walk = (node: Node | null | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "image") {
      const src = node.attrs?.src;
      if (typeof src === "string" && src.length > 0) out.push(src);
    }
    if (Array.isArray(node.content)) for (const child of node.content) walk(child);
  };
  walk(body as Node);
  return out;
}
