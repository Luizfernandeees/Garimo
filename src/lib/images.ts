import { env } from "./env";
import { EXTERNAL_IMAGE_HOSTS } from "./image-hosts";

export const STORAGE_BUCKET = "product-images";
export const MAX_IMAGES = 10;

export function storagePublicPrefix() {
  return `${env.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`;
}

// Caminho do arquivo no bucket, se a URL for do nosso Storage.
export function storagePathFromUrl(url: string) {
  const prefix = storagePublicPrefix();
  return env.supabaseUrl && url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

export function isAllowedImageUrl(url: string) {
  if (storagePathFromUrl(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && EXTERNAL_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
