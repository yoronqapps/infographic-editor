import type { CanvasState, EditorDocument, FabricObjectState } from '../types/editor';

export type EditorDocumentInput = Pick<EditorDocument, 'title' | 'pages' | 'activePageId'> & Partial<Omit<EditorDocument, 'title' | 'pages' | 'activePageId'>>;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const emptyCanvas = (): CanvasState => ({ objects: [] });

export const migrateDocument = (input: unknown): EditorDocument => {
  const source = isRecord(input) ? input : {};
  const legacyCanvas = isRecord(source.canvas_state) ? source.canvas_state : emptyCanvas();
  const pages = Array.isArray(source.pages) ? source.pages : [{ id: 1, name: 'Page 1', state: legacyCanvas }];

  return {
    version: 1,
    title: typeof source.title === 'string' && source.title.trim() ? source.title : 'Untitled infographic',
    pages: pages.map((page, index) => {
      const record = isRecord(page) ? page : {};
      const state = isRecord(record.state) ? record.state : isRecord(record.canvas_state) ? record.canvas_state : Array.isArray(record.objects) ? { objects: record.objects } : emptyCanvas();
      return {
        id: isFiniteNumber(record.id) ? record.id : index + 1,
        name: typeof record.name === 'string' && record.name.trim() ? record.name : `Page ${index + 1}`,
        state: { ...state, objects: Array.isArray(state.objects) ? state.objects.filter(isRecord) as FabricObjectState[] : [] },
        ...(typeof record.thumbnail === 'string' ? { thumbnail: record.thumbnail } : {}),
      };
    }),
    activePageId: isFiniteNumber(source.activePageId) ? source.activePageId : 1,
    guides: Array.isArray(source.guides) ? source.guides as EditorDocument['guides'] : [],
    assets: Array.isArray(source.assets) ? source.assets as EditorDocument['assets'] : [],
    animations: Array.isArray(source.animations) ? source.animations as EditorDocument['animations'] : [],
    ...(typeof source.saved_at === 'string' ? { saved_at: source.saved_at } : {}),
  };
};

export const parseDocument = (input: unknown): { ok: true; value: EditorDocument } | { ok: false; error: string } => {
  if (!isRecord(input) || input.version !== 1) return { ok: false, error: 'Document version is missing or invalid' };
  if (typeof input.title !== 'string' || !Array.isArray(input.pages) || input.pages.length === 0) return { ok: false, error: 'Document title or pages are invalid' };
  if (!isFiniteNumber(input.activePageId)) return { ok: false, error: 'Active page is invalid' };
  if (input.pages.some((page) => !isRecord(page) || !isFiniteNumber(page.id) || typeof page.name !== 'string' || !isRecord(page.state) || !Array.isArray(page.state.objects))) return { ok: false, error: 'One or more pages are invalid' };
  return { ok: true, value: migrateDocument(input) };
};