import { createClient } from "@/lib/supabase/client";

export type UploadedImage = {
  path: string;
  publicUrl: string;
  width: number;
  height: number;
};

const MAX_LONG_EDGE = 2400;
const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_GIF_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function ext(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

async function processToWebp(
  file: File,
): Promise<{ blob: Blob; mime: string; width: number; height: number }> {
  // Strips EXIF, fixes rotation, caps long edge, re-encodes to webp.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width: srcW, height: srcH } = bitmap;
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d");
  if (!ctx) throw new UploadError("Could not process image.");
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob: Blob =
    canvas instanceof OffscreenCanvas
      ? await canvas.convertToBlob({ type: "image/webp", quality: 0.85 })
      : await new Promise<Blob>((resolve, reject) => {
          (canvas as HTMLCanvasElement).toBlob(
            (b) => (b ? resolve(b) : reject(new UploadError("Encode failed."))),
            "image/webp",
            0.85,
          );
        });
  return { blob, mime: "image/webp", width: w, height: h };
}

async function gifDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const out = { width: bitmap.width, height: bitmap.height };
  bitmap.close?.();
  return out;
}

export async function uploadImage(
  file: File,
  bucket: "memory-media" | "memory-covers",
): Promise<UploadedImage> {
  if (!file.type) throw new UploadError("Unknown file type.");
  if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    throw new UploadError("HEIC isn't supported. Export as JPEG from Photos and try again.");
  }
  if (!ACCEPTED.includes(file.type)) {
    throw new UploadError("Use JPG, PNG, WebP, or GIF.");
  }
  const isGif = file.type === "image/gif";
  if (isGif && file.size > MAX_GIF_BYTES) {
    throw new UploadError("GIF must be under 5MB.");
  }
  if (!isGif && file.size > MAX_RAW_BYTES) {
    throw new UploadError("Image must be under 10MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UploadError("Sign in to upload images.");

  let blob: Blob;
  let mime: string;
  let width: number;
  let height: number;
  if (isGif) {
    blob = file;
    mime = "image/gif";
    ({ width, height } = await gifDimensions(file));
  } else {
    const processed = await processToWebp(file);
    blob = processed.blob;
    mime = processed.mime;
    width = processed.width;
    height = processed.height;
  }

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.${ext(mime)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new UploadError(error.message);

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, publicUrl, width, height };
}
