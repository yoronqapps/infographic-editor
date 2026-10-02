export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export type ImageValidationResult = { ok: true } | { ok: false; error: string };

const isAllowedImageMimeType = (type: string): type is (typeof ALLOWED_IMAGE_MIME_TYPES)[number] =>
  ALLOWED_IMAGE_MIME_TYPES.includes(type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]);

const decodeImageFile = (file: File): Promise<boolean> => new Promise((resolve) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  const cleanup = () => URL.revokeObjectURL(objectUrl);
  image.onload = () => {
    cleanup();
    resolve(true);
  };
  image.onerror = () => {
    cleanup();
    resolve(false);
  };
  image.src = objectUrl;
});

export const validateImageFile = async (file: File): Promise<ImageValidationResult> => {
  if (!isAllowedImageMimeType(file.type)) {
    return { ok: false, error: 'Please choose a PNG, JPEG, WebP, or GIF image.' };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return { ok: false, error: 'Image files must be 10 MB or smaller.' };
  }

  if (!(await decodeImageFile(file))) {
    return { ok: false, error: 'That file could not be decoded as an image.' };
  }

  return { ok: true };
};
