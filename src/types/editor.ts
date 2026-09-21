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