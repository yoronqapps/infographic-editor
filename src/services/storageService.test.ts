import { describe, expect, it } from 'vitest';
import { buildUserAssetPath } from './storageService';

describe('buildUserAssetPath', () => {
  it('scopes a UUID filename under the authenticated user directory', () => {
    expect(buildUserAssetPath('user-123', 'photo.png')).toMatch(/^user_assets\/user-123\/[0-9a-f-]{36}\.png$/);
  });

  it('uses a safe fallback extension for names without an extension', () => {
    expect(buildUserAssetPath('user-123', 'photo')).toMatch(/^user_assets\/user-123\/[0-9a-f-]{36}\.bin$/);
  });
});
