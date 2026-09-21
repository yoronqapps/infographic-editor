import { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { fontCatalog } from '../../lib/fontCatalog';
import type { ChartDatum } from '../../types/editor';

const toHexColor = (value: string) => {
  if (value.startsWith('#')) return value;
  const match = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return '#000000';
  return `#${[match[1], match[2], match[3]].map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`;
};

interface StyleEditorProps {
  selectedObject: fabric.Object | null;
  onUpdateSelected: (properties: Partial<fabric.Object>) => void;
  onApplyImageFilter: (filterName: string) => void;
  onSetImageMask: (mask: 'none' | 'circle' | 'rounded') => void;
  onCropImage: (mode: 'square' | 'portrait' | 'landscape' | 'reset') => void;
  onToggleLock: () => void;
  onMakeReference: () => void;
  onAnalyzeImage: () => void;
  ocrStatus: string;
  onToggleVisibility: () => void;
  onMoveLayer: (direction: 'forward' | 'back') => void;
  onUpdateStroke: (stroke: string, strokeWidth: number, dash: number[]) => void;
  onUpdateArrowPoint: (point: 'start' | 'end' | 'control', axis: 'x' | 'y', value: number) => void;
  onApplyGradient: () => void;
  onAnimateEntrance: () => void;
  isEditingPoints: boolean;
  onTogglePointEditing: () => void;
  onClipImageToShape: () => void;
  onEditText: () => void;
  onAlignSelected: (axis: 'horizontal' | 'vertical') => void;
  onSetLayerOrder: (direction: 'front' | 'back') => void;
  onRenameSelected: (name: string) => void;
  onUpdateChartData: (data: ChartDatum[]) => void;
}

export default function StyleEditor({ selectedObject, onUpdateSelected, onApplyImageFilter, onSetImageMask, onCropImage, onToggleLock, onMakeReference, onAnalyzeImage, ocrStatus, onToggleVisibility, onMoveLayer, onUpdateStroke, onUpdateArrowPoint, onApplyGradient, onAnimateEntrance, isEditingPoints, onTogglePointEditing, onClipImageToShape, onEditText, onAlignSelected, onSetLayerOrder, onRenameSelected, onUpdateChartData }: StyleEditorProps) {
  const [fill, setFill] = useState('#000000');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState<string>(fontCatalog[0].family);
  const [opacity, setOpacity] = useState(100);
  const [angle, setAngle] = useState(0);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [objectWidth, setObjectWidth] = useState(100);
  const [objectHeight, setObjectHeight] = useState(100);
  const [stroke, setStroke] = useState('#235347');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.16);
  const [textAlign, setTextAlign] = useState('left');
  const [dashStyle, setDashStyle] = useState('solid');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [underline, setUnderline] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [hasShadow, setHasShadow] = useState(false);
  const [palette, setPalette] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('infographic-editor:palette') || '[]') as string[];
    } catch {
      return [];
    }
  });
  const [chartData, setChartData] = useState<ChartDatum[]>([]);

  useEffect(() => {
    if (!selectedObject) return;
    if (selectedObject.fill && typeof selectedObject.fill === 'string') {
      setFill(toHexColor(selectedObject.fill));
    }
    if ('fontSize' in selectedObject && typeof (selectedObject as any).fontSize === 'number') {
      setFontSize((selectedObject as any).fontSize);
    }
    if ('fontFamily' in selectedObject && typeof (selectedObject as any).fontFamily === 'string') {
      const selectedFont = (selectedObject as any).fontFamily as string;
      setFontFamily(fontCatalog.find((font) => font.name === selectedFont || font.family === selectedFont)?.family ?? selectedFont);
    }
    setOpacity(Math.round((selectedObject.opacity ?? 1) * 100));
    setAngle(selectedObject.angle ?? 0);
    setLeft(Math.round(selectedObject.left ?? 0));
    setTop(Math.round(selectedObject.top ?? 0));
    setObjectWidth(Math.round(selectedObject.getScaledWidth()));
    setObjectHeight(Math.round(selectedObject.getScaledHeight()));
    if (typeof selectedObject.stroke === 'string') setStroke(toHexColor(selectedObject.stroke));
    setStrokeWidth(selectedObject.strokeWidth ?? 4);
    if ('charSpacing' in selectedObject) setCharSpacing((selectedObject as any).charSpacing ?? 0);
    if ('lineHeight' in selectedObject) setLineHeight((selectedObject as any).lineHeight ?? 1.16);
    if ('textAlign' in selectedObject) setTextAlign((selectedObject as any).textAlign ?? 'left');
    if ('fontWeight' in selectedObject) setFontWeight((selectedObject as any).fontWeight ?? 'normal');
    if ('fontStyle' in selectedObject) setFontStyle((selectedObject as any).fontStyle ?? 'normal');
    if ('underline' in selectedObject) setUnderline(Boolean((selectedObject as any).underline));
    if (selectedObject.type === 'rect') setCornerRadius((selectedObject as fabric.Rect).rx ?? 0);
    setHasShadow(Boolean(selectedObject.shadow));
    setChartData(Array.isArray((selectedObject as any).chartData) ? (selectedObject as any).chartData : []);
  }, [selectedObject]);

  useEffect(() => {
    localStorage.setItem('infographic-editor:palette', JSON.stringify(palette));
  }, [palette]);

  if (!selectedObject) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 p-4 text-xs text-slate-400">
        No element selected. Click an object on the canvas to inspect and edit style properties.
      </div>
    );
  }

  const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFill(val);
    onUpdateSelected({ fill: val });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setFontSize(val);
    if ('fontSize' in selectedObject) {
      onUpdateSelected({ fontSize: val } as Partial<fabric.Object>);
    }
  };

  const handleOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setOpacity(value);
    onUpdateSelected({ opacity: value / 100 });
  };

  const handleAngleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAngle(value);
    onUpdateSelected({ angle: value });
  };

  const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFontFamily(value);
    onUpdateSelected({ fontFamily: value } as Partial<fabric.Object>);
  };

  const updatePosition = (property: 'left' | 'top', value: number) => {
    if (property === 'left') setLeft(value);
    else setTop(value);
    onUpdateSelected({ [property]: value });
  };

  const updateSize = (property: 'width' | 'height', value: number) => {
    const safeValue = Math.max(10, value);
    if (property === 'width') {
      setObjectWidth(safeValue);
      onUpdateSelected({ scaleX: safeValue / (selectedObject.width || 1) });
    } else {
      setObjectHeight(safeValue);
      onUpdateSelected({ scaleY: safeValue / (selectedObject.height || 1) });
    }
  };

  const updateCornerRadius = (value: number) => {
    const safeValue = Math.max(0, value);
    setCornerRadius(safeValue);
    if (selectedObject.type === 'rect') onUpdateSelected({ rx: safeValue, ry: safeValue } as Partial<fabric.Object>);
  };

  const toggleShadow = () => {
    const next = !hasShadow;
    setHasShadow(next);
    onUpdateSelected({ shadow: next ? new fabric.Shadow({ color: 'rgba(15, 23, 42, 0.25)', blur: 14, offsetX: 0, offsetY: 6 }) : undefined } as Partial<fabric.Object>);
  };

  const applyPaletteColor = (color: string) => {
    setFill(color);
    onUpdateSelected({ fill: color });
  };

  const savePaletteColor = () => {
    setPalette((colors) => colors.includes(fill) ? colors : [...colors, fill]);
  };

  const isImage = selectedObject.type === 'image';
  const isLocked = selectedObject.selectable === false;
  const arrow = selectedObject as fabric.Group & { arrowKind?: 'straight' | 'curved'; startX?: number; startY?: number; endX?: number; endY?: number; controlX?: number; controlY?: number };
  const isArrow = selectedObject.type === 'group' && Boolean(arrow.arrowKind);
  const isPointEditable = selectedObject.type === 'polygon' || selectedObject.type === 'polyline';
  const chartKind = (selectedObject as any).chartKind as string | undefined;

  const updateChartDatum = (index: number, field: keyof ChartDatum, value: string) => {
    const nextData = chartData.map((datum, datumIndex) => datumIndex === index
      ? { ...datum, [field]: field === 'value' ? Number(value) || 0 : value }
      : datum);
    setChartData(nextData);
    onUpdateChartData(nextData);
  };

  const addChartDatum = () => {
    const nextData = [...chartData, { label: `Item ${chartData.length + 1}`, value: 10 }];
    setChartData(nextData);
    onUpdateChartData(nextData);
  };

  const removeChartDatum = (index: number) => {
    if (chartData.length <= 1) return;
    const nextData = chartData.filter((_datum, datumIndex) => datumIndex !== index);
    setChartData(nextData);
    onUpdateChartData(nextData);
  };

  return (
    <aside className="hidden w-64 bg-white border-l border-slate-200 p-4 xl:flex flex-col gap-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Inspector Properties
      </h3>
      <label className="text-xs font-medium text-slate-600">Layer name
        <input defaultValue={(selectedObject as any).name || selectedObject.type} onBlur={(event) => onRenameSelected(event.target.value)} className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs" />
      </label>

      {chartKind && (
        <div className="border-t border-slate-200 pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Chart data</h4>
          <div className="flex flex-col gap-1.5">
            {chartData.map((datum, index) => (
              <div key={`${index}-${datum.label}`} className="flex gap-1">
                <input value={datum.label} onChange={(event) => updateChartDatum(index, 'label', event.target.value)} aria-label={`Chart label ${index + 1}`} className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]" />
                <input type="number" value={datum.value} onChange={(event) => updateChartDatum(index, 'value', event.target.value)} aria-label={`Chart value ${index + 1}`} className="w-16 rounded border border-slate-200 px-2 py-1 text-[11px]" />
                <button onClick={() => removeChartDatum(index)} title="Remove data point" className="rounded px-1.5 text-red-500 hover:bg-red-50">×</button>
              </div>
            ))}
          </div>
          <button onClick={addChartDatum} className="mt-2 w-full rounded border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50">Add data point</button>
          {chartKind === 'progress' && <p className="mt-1 text-[10px] text-slate-400">Progress values are limited to 0-100.</p>}
        </div>
      )}

      <button onClick={onToggleLock} className="border border-slate-200 rounded px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
        {isLocked ? 'Unlock layer' : 'Lock layer'}
      </button>
      <div className="grid grid-cols-5 gap-1.5">
        <button onClick={onToggleVisibility} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">{selectedObject.visible === false ? 'Show' : 'Hide'}</button>
        <button onClick={() => onMoveLayer('forward')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Forward</button>
        <button onClick={() => onMoveLayer('back')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Back</button>
        <button onClick={() => onSetLayerOrder('front')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Top</button>
        <button onClick={() => onSetLayerOrder('back')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Bottom</button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onAlignSelected('horizontal')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Center horizontal</button>
        <button onClick={() => onAlignSelected('vertical')} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Center vertical</button>
      </div>

      {'fontSize' in selectedObject && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
          <button onClick={onEditText} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Edit text on canvas</button>
          <label className="text-xs font-medium text-slate-600">Letter spacing ({charSpacing})
            <input type="range" min="-100" max="300" value={charSpacing} onChange={(event) => { const value = Number(event.target.value); setCharSpacing(value); onUpdateSelected({ charSpacing: value } as Partial<fabric.Object>); }} className="mt-1 w-full" />
          </label>
          <label className="text-xs font-medium text-slate-600">Line height ({lineHeight.toFixed(2)})
            <input type="range" min="0.8" max="2.5" step="0.05" value={lineHeight} onChange={(event) => { const value = Number(event.target.value); setLineHeight(value); onUpdateSelected({ lineHeight: value } as Partial<fabric.Object>); }} className="mt-1 w-full" />
          </label>
          <div className="grid grid-cols-3 gap-1">
            {['left', 'center', 'right'].map((alignment) => (
              <button key={alignment} onClick={() => { setTextAlign(alignment); onUpdateSelected({ textAlign: alignment } as Partial<fabric.Object>); }} className={`rounded border px-2 py-1.5 text-[11px] capitalize ${textAlign === alignment ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{alignment}</button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => { const value = fontWeight === 'bold' ? 'normal' : 'bold'; setFontWeight(value); onUpdateSelected({ fontWeight: value } as Partial<fabric.Object>); }} className={`rounded border px-2 py-1.5 text-[11px] font-bold ${fontWeight === 'bold' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>B</button>
            <button onClick={() => { const value = fontStyle === 'italic' ? 'normal' : 'italic'; setFontStyle(value); onUpdateSelected({ fontStyle: value } as Partial<fabric.Object>); }} className={`rounded border px-2 py-1.5 text-[11px] italic ${fontStyle === 'italic' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>I</button>
            <button onClick={() => { const value = !underline; setUnderline(value); onUpdateSelected({ underline: value } as Partial<fabric.Object>); }} className={`rounded border px-2 py-1.5 text-[11px] underline ${underline ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>U</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-600">Fill Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={handleFillChange}
            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
          />
          <span className="text-xs font-mono text-slate-600">{fill}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {['#0f172a', '#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#f8fafc', ...palette].map((color, index) => (
            <button key={`${color}-${index}`} onClick={() => applyPaletteColor(color)} title={`Use ${color}`} aria-label={`Use color ${color}`} className={`h-6 w-6 rounded border ${fill === color ? 'border-slate-900 ring-2 ring-blue-200' : 'border-slate-300'}`} style={{ backgroundColor: color }} />
          ))}
          <button onClick={savePaletteColor} title="Save current color" className="h-6 w-6 rounded border border-dashed border-slate-400 text-xs text-slate-500 hover:bg-slate-50">+</button>
        </div>
      </div>
      <button onClick={onApplyGradient} className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100">Apply blue / green gradient</button>
      <div className="border-t border-slate-200 pt-3">
        <h4 className="mb-2 text-xs font-semibold text-slate-600">Style presets</h4>
        <div className="grid grid-cols-3 gap-1.5">
          <button onClick={() => onUpdateSelected({ fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2, shadow: undefined })} className="rounded border border-blue-200 bg-blue-50 px-1.5 py-2 text-[10px] text-blue-800">Focus</button>
          <button onClick={() => onUpdateSelected({ fill: '#dcfce7', stroke: '#16a34a', strokeWidth: 2, shadow: new fabric.Shadow({ color: 'rgba(22, 101, 52, 0.2)', blur: 10, offsetY: 4 }) })} className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-2 text-[10px] text-emerald-800">Fresh</button>
          <button onClick={() => onUpdateSelected({ fill: '#111827', stroke: '#f59e0b', strokeWidth: 3, shadow: new fabric.Shadow({ color: 'rgba(15, 23, 42, 0.3)', blur: 16, offsetY: 6 }) })} className="rounded border border-amber-200 bg-slate-800 px-1.5 py-2 text-[10px] text-amber-300">Bold</button>
        </div>
      </div>

      {selectedObject.type === 'rect' && (
        <label className="text-xs font-medium text-slate-600">Corner radius ({cornerRadius}px)
          <input type="range" min="0" max="80" value={cornerRadius} onChange={(event) => updateCornerRadius(Number(event.target.value))} className="mt-1 w-full" />
        </label>
      )}
      <button onClick={toggleShadow} className={`rounded border px-3 py-2 text-xs font-medium ${hasShadow ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{hasShadow ? 'Remove shadow' : 'Add soft shadow'}</button>
      <button onClick={onAnimateEntrance} className="rounded border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-100">Animate entrance</button>
      {isPointEditable && <button onClick={onTogglePointEditing} className={`rounded border px-3 py-2 text-xs font-medium ${isEditingPoints ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{isEditingPoints ? 'Exit point editing' : 'Edit vector points'}</button>}
      <button onClick={onClipImageToShape} className="rounded border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Mask image with shape</button>

      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <input type="color" value={stroke} onChange={(event) => { setStroke(event.target.value); onUpdateStroke(event.target.value, strokeWidth, []); }} className="h-8 w-8 rounded border border-slate-300 p-0" aria-label="Stroke color" />
        <label className="text-xs font-medium text-slate-600">Stroke {strokeWidth}px
          <input type="range" min="0" max="24" value={strokeWidth} onChange={(event) => { const value = Number(event.target.value); setStrokeWidth(value); onUpdateStroke(stroke, value, []); }} className="mt-1 w-full" />
        </label>
      </div>
      <label className="text-xs font-medium text-slate-600">Line style
        <select value={dashStyle} onChange={(event) => { const value = event.target.value; setDashStyle(value); onUpdateStroke(stroke, strokeWidth, value === 'dashed' ? [12, 8] : value === 'dotted' ? [2, 8] : []); }} className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-slate-600">X
          <input type="number" value={left} onChange={(event) => updatePosition('left', Number(event.target.value))} className="mt-1 w-full border rounded px-2 py-1 text-xs" />
        </label>
        <label className="text-xs font-medium text-slate-600">Y
          <input type="number" value={top} onChange={(event) => updatePosition('top', Number(event.target.value))} className="mt-1 w-full border rounded px-2 py-1 text-xs" />
        </label>
        <label className="text-xs font-medium text-slate-600">Width
          <input type="number" min="10" value={objectWidth} onChange={(event) => updateSize('width', Number(event.target.value))} className="mt-1 w-full border rounded px-2 py-1 text-xs" />
        </label>
        <label className="text-xs font-medium text-slate-600">Height
          <input type="number" min="10" value={objectHeight} onChange={(event) => updateSize('height', Number(event.target.value))} className="mt-1 w-full border rounded px-2 py-1 text-xs" />
        </label>
      </div>

      {isArrow && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
          <h4 className="text-xs font-semibold text-slate-600">Arrow points</h4>
          {(['start', 'end'] as const).map((point) => (
            <div key={point} className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium capitalize text-slate-600">{point} X
                <input type="number" value={Math.round(arrow[`${point}X` as 'startX' | 'endX'] ?? 0)} onChange={(event) => onUpdateArrowPoint(point, 'x', Number(event.target.value))} className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
              </label>
              <label className="text-[11px] font-medium capitalize text-slate-600">{point} Y
                <input type="number" value={Math.round(arrow[`${point}Y` as 'startY' | 'endY'] ?? 0)} onChange={(event) => onUpdateArrowPoint(point, 'y', Number(event.target.value))} className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
              </label>
            </div>
          ))}
          {arrow.arrowKind === 'curved' && (
            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y'] as const).map((axis) => (
                <label key={axis} className="text-[11px] font-medium text-slate-600">Control {axis.toUpperCase()}
                  <input type="number" value={Math.round(arrow[`control${axis.toUpperCase()}` as 'controlX' | 'controlY'] ?? 0)} onChange={(event) => onUpdateArrowPoint('control', axis, Number(event.target.value))} className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {'fontSize' in selectedObject && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600">Font Size ({fontSize}px)</label>
          <input
            type="range"
            min="8"
            max="120"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="w-full"
          />
        </div>
      )}

      {'fontSize' in selectedObject && (
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          Font family
          <select value={fontFamily} onChange={handleFontChange} className="border border-slate-200 rounded px-2 py-1.5 text-sm font-normal">
            {fontCatalog.map((font) => <option key={font.name} value={font.family}>{font.name}</option>)}
          </select>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-600">Opacity ({opacity}%)</label>
        <input type="range" min="0" max="100" value={opacity} onChange={handleOpacityChange} className="w-full" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-600">Rotation ({angle}°)</label>
        <input type="range" min="-180" max="180" value={angle} onChange={handleAngleChange} className="w-full" />
      </div>

      {isImage && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onUpdateSelected({ flipX: !selectedObject.flipX })} className="border rounded px-2 py-1.5 text-xs hover:bg-slate-50">Flip horizontal</button>
            <button onClick={() => onUpdateSelected({ flipY: !selectedObject.flipY })} className="border rounded px-2 py-1.5 text-xs hover:bg-slate-50">Flip vertical</button>
          </div>
          <button onClick={onMakeReference} className="border border-amber-200 bg-amber-50 rounded px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100">
            Use as reconstruction reference
          </button>
          <button onClick={onAnalyzeImage} disabled={ocrStatus !== '' && !ocrStatus.includes('added') && !ocrStatus.includes('found') && !ocrStatus.includes('failed')} className="border border-blue-200 bg-blue-50 rounded px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50">
            Detect editable text locally
          </button>
          {ocrStatus && <p className="text-[11px] leading-4 text-slate-500">{ocrStatus}</p>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Image filter</label>
            <select onChange={(event) => onApplyImageFilter(event.target.value)} defaultValue="none" className="border border-slate-200 rounded px-2 py-1.5 text-sm">
              <option value="none">Original</option>
              <option value="grayscale">Grayscale</option>
              <option value="sepia">Sepia</option>
              <option value="vintage">Vintage</option>
              <option value="bright">Brighten</option>
              <option value="contrast">Contrast</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Image mask</label>
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => onSetImageMask('none')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Square</button>
              <button onClick={() => onSetImageMask('rounded')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Rounded</button>
              <button onClick={() => onSetImageMask('circle')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Circle</button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Crop image</label>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => onCropImage('square')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Square</button>
              <button onClick={() => onCropImage('portrait')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Portrait</button>
              <button onClick={() => onCropImage('landscape')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Landscape</button>
              <button onClick={() => onCropImage('reset')} className="border rounded px-1 py-1.5 text-xs hover:bg-slate-50">Reset crop</button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}