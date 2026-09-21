export type ActiveTool = 'select' | 'text' | 'shapes' | 'images' | 'templates';

export interface ObjectProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  opacity: number;
}

export type ChartKind = 'bar' | 'line' | 'pie' | 'progress';

export interface ChartDatum {
  label: string;
  value: number;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type FabricObjectState = { [key: string]: JsonValue };

export interface CanvasState {
  version?: string;
  objects: FabricObjectState[];
  background?: string;
  [key: string]: JsonValue | undefined;
}

export interface EditorGuide {
  id: string;
  axis: 'horizontal' | 'vertical';
  position: number;
  color?: string;
  locked?: boolean;
}

export interface EditorAsset {
  id: string;
  name: string;
  url: string;
  kind: 'image' | 'font' | 'svg';
  width?: number;
  height?: number;
  alt?: string;
}

export interface EditorAnimation {
  id: string;
  objectId: string;
  type: 'entrance' | 'emphasis' | 'exit';
  duration: number;
  delay?: number;
}

export interface EditorPage {
  id: number;
  name: string;
  state: CanvasState;
  thumbnail?: string;
}

export interface EditorDocument {
  version: 1;
  title: string;
  pages: EditorPage[];
  activePageId: number;
  guides: EditorGuide[];
  assets: EditorAsset[];
  animations: EditorAnimation[];
  saved_at?: string;
}

export interface SelectionContext {
  objects: string[];
  primaryId?: string;
  count: number;
  hasSelection: boolean;
  hasMultipleSelection: boolean;
}