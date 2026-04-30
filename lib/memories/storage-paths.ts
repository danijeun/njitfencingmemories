import { extractImageSrcs } from "./extract-images";

const BUCKET_PUBLIC_PREFIX = "/storage/v1/object/public/";

export type StoragePath = { bucket: string; path: string };

export function srcToStoragePath(src: string): StoragePath | null {
  try {
    const u = new URL(src);
    const idx = u.pathname.indexOf(BUCKET_PUBLIC_PREFIX);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + BUCKET_PUBLIC_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    const bucket = rest.slice(0, slash);
    const path = decodeURIComponent(rest.slice(slash + 1));
    return { bucket, path };
  } catch {
    return null;
  }
}

export function inlineStoragePaths(body: unknown): StoragePath[] {
  const out: StoragePath[] = [];
  for (const src of extractImageSrcs(body)) {
    const sp = srcToStoragePath(src);
    if (sp && sp.bucket === "memory-media") out.push(sp);
  }
  return out;
}

export function diffPathsToRemove(oldPaths: StoragePath[], newPaths: StoragePath[]): StoragePath[] {
  const keep = new Set(newPaths.map((p) => `${p.bucket}/${p.path}`));
  return oldPaths.filter((p) => !keep.has(`${p.bucket}/${p.path}`));
}
