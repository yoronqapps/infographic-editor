import { describe, expect, it } from 'vitest';
import { migrateDocument, parseDocument } from './documentSchema';

describe('parseDocument', () => {
  it('accepts a complete infographic document', () => {
    const result = parseDocument({
      version: 1,
      title: 'Quarterly story',
      pages: [{ id: 1, name: 'Page 1', state: { objects: [{ type: 'rect', left: 10, top: 20 }] } }],
      activePageId: 1,
      guides: [],
      assets: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.pages[0].state.objects[0].type).toBe('rect');
  });

  it('rejects malformed documents instead of trusting imported JSON', () => {
    const result = parseDocument({ title: 'Broken', pages: [{ id: 'wrong' }] });

    expect(result).toEqual({ ok: false, error: 'Document version is missing or invalid' });
  });

  it('migrates a legacy single-canvas project into the current document shape', () => {
    const migrated = migrateDocument({ title: 'Legacy', canvas_state: { objects: [{ type: 'circle' }] } });

    expect(migrated.version).toBe(1);
    expect(migrated.pages).toHaveLength(1);
    expect(migrated.pages[0].state.objects).toEqual([{ type: 'circle' }]);
    expect(migrated.activePageId).toBe(1);
  });
});
