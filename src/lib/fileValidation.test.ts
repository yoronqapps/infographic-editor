import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_FILE_SIZE, validateImageFile } from './fileValidation';

const createFile = (type: string, size = 4, name = 'image.png') => new File([new Uint8Array(size)], name, { type });

describe('validateImageFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])('accepts %s after decoding', async (type) => {
    const objectUrl = 'blob:test-image';
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }

    vi.stubGlobal('Image', MockImage);

    await expect(validateImageFile(createFile(type))).resolves.toEqual({ ok: true });
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it('rejects SVG and other unsupported MIME types', async () => {
    await expect(validateImageFile(createFile('image/svg+xml'))).resolves.toEqual({
      ok: false,
      error: 'Please choose a PNG, JPEG, WebP, or GIF image.',
    });
  });

  it('rejects files larger than 10 MB', async () => {
    await expect(validateImageFile(createFile('image/png', MAX_IMAGE_FILE_SIZE + 1))).resolves.toEqual({
      ok: false,
      error: 'Image files must be 10 MB or smaller.',
    });
  });

  it('rejects files that fail to decode as images', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:invalid-image');

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onerror?.();
      }
    }

    vi.stubGlobal('Image', MockImage);

    await expect(validateImageFile(createFile('image/png'))).resolves.toEqual({
      ok: false,
      error: 'That file could not be decoded as an image.',
    });
  });
});
