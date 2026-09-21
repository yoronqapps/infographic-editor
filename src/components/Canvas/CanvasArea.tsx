import { useState, type RefObject } from 'react';
import type { FitMode } from '../../lib/canvasViewport';
import type { EditorGuide } from '../../types/editor';

interface CanvasAreaProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToViewport: (mode: FitMode) => void;
  onFitSelection: () => void;
  hasSelection: boolean;
  panMode: boolean;
  onTogglePan: () => void;
  guides: EditorGuide[];
  onAddGuide: (axis: EditorGuide['axis'], position: number) => void;
  onUpdateGuide: (id: string, position: number) => void;
  onRemoveGuide: (id: string) => void;
}

export default function CanvasArea({ canvasRef, zoom, onZoomChange, onFitToViewport, onFitSelection, hasSelection, panMode, onTogglePan, guides, onAddGuide, onUpdateGuide, onRemoveGuide }: CanvasAreaProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [safeMargin, setSafeMargin] = useState(32);
  const [gridSize, setGridSize] = useState(20);
  const rulerTicks = Array.from({ length: 9 }, (_, index) => index * 100);
  const addCenterGuide = (axis: EditorGuide['axis']) => onAddGuide(axis, axis === 'horizontal' ? 400 : 300);
  return (
    <main className="relative min-w-0 flex-1 bg-slate-200 p-4 pb-20 sm:p-8 sm:pb-20 flex justify-center items-center overflow-auto">
      <div className="fixed bottom-3 left-1/2 z-10 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white/95 px-2 py-1 shadow-lg sm:bottom-4 sm:gap-2">
        <button onClick={() => onZoomChange(zoom - 0.1)} className="min-h-8 min-w-8 px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">−</button>
        <span className="w-12 text-center text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(zoom + 0.1)} className="min-h-8 min-w-8 px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">+</button>
        <button onClick={() => onFitToViewport('page')} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">Page</button>
        <button onClick={() => onFitToViewport('width')} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">Width</button>
        <button onClick={() => onFitToViewport('height')} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">Height</button>
        <button onClick={() => onZoomChange(1)} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">100%</button>
        <button onClick={onFitSelection} disabled={!hasSelection} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40">Selection</button>
        <button onClick={onTogglePan} className={`border-l border-slate-200 px-2 py-1 text-xs ${panMode ? 'font-semibold text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Pan</button>
        <button onClick={() => setShowGrid((value) => !value)} className={`border-l border-slate-200 px-2 py-1 text-xs ${showGrid ? 'font-semibold text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Grid</button>
        {showGrid && <label className="flex items-center gap-1 border-l border-slate-200 pl-2 text-[10px] text-slate-600">Size <input type="number" min="5" max="100" step="5" value={gridSize} onChange={(event) => setGridSize(Math.min(100, Math.max(5, Number(event.target.value) || 20)))} className="w-10 rounded border border-slate-200 px-1 py-1 text-[10px]" /></label>}
        <button onClick={() => setShowRulers((value) => !value)} className={`border-l border-slate-200 px-2 py-1 text-xs ${showRulers ? 'font-semibold text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Rulers</button>
        <button onClick={() => addCenterGuide('vertical')} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">V guide</button>
        <button onClick={() => addCenterGuide('horizontal')} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">H guide</button>
        <button onClick={() => setShowSafeArea((value) => !value)} className={`border-l border-slate-200 px-2 py-1 text-xs ${showSafeArea ? 'font-semibold text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Safe area</button>
        {showSafeArea && <input aria-label="Safe area margin" type="number" min="0" max="200" value={safeMargin} onChange={(event) => setSafeMargin(Math.min(200, Math.max(0, Number(event.target.value) || 0)))} className="w-12 rounded border border-slate-200 px-1 py-1 text-[10px]" />}
      </div>
      <div className={`relative shadow-2xl rounded bg-white overflow-hidden border border-slate-300 ${showGrid ? 'canvas-grid' : ''}`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', '--grid-size': `${gridSize}px` } as React.CSSProperties}>
        {showRulers && <><div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 border-b border-slate-300 bg-slate-100 text-[8px] text-slate-500">{rulerTicks.map((tick) => <span key={`x-${tick}`} className="absolute top-1" style={{ left: tick }}>{tick}</span>)}</div><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 border-r border-slate-300 bg-slate-100 text-[8px] text-slate-500">{rulerTicks.slice(0, 9).map((tick) => <span key={`y-${tick}`} className="absolute left-1" style={{ top: tick }}>{tick}</span>)}</div></>}
        {showSafeArea && <div className="pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-amber-500/70" style={{ margin: safeMargin }} />}
        {guides.map((guide) => <div key={guide.id} role="separator" aria-label={`${guide.axis} guide`} onDoubleClick={() => onRemoveGuide(guide.id)} onPointerDown={(event) => {
          const start = guide.axis === 'vertical' ? event.clientX : event.clientY;
          const move = (moveEvent: PointerEvent) => onUpdateGuide(guide.id, Math.max(0, (guide.position + (guide.axis === 'vertical' ? moveEvent.clientX : moveEvent.clientY) - start) / zoom));
          const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
          window.addEventListener('pointermove', move); window.addEventListener('pointerup', end);
        }} className={`absolute z-30 bg-blue-500/80 ${guide.axis === 'vertical' ? 'top-0 bottom-0 w-px cursor-ew-resize' : 'left-0 right-0 h-px cursor-ns-resize'}`} style={guide.axis === 'vertical' ? { left: guide.position } : { top: guide.position }} />)}
        <canvas ref={canvasRef} />
      </div>
    </main>
  );
}