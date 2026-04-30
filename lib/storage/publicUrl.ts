const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

function build(bucket: string, path: string): string {
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export const coverUrl = (path: string) => build("memory-covers", path);
export const mediaUrl = (path: string) => build("memory-media", path);
export const avatarUrl = (path: string) => build("avatars", path);
