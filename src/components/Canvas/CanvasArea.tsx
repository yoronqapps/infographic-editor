import { useState, type RefObject } from 'react';

interface CanvasAreaProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToViewport: () => void;
}

export default function CanvasArea({ canvasRef, zoom, onZoomChange, onFitToViewport }: CanvasAreaProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  return (
    <main className="relative flex-1 bg-slate-200 p-8 flex justify-center items-center overflow-auto">
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-slate-300 bg-white/90 px-2 py-1 shadow-lg">
        <button onClick={() => onZoomChange(zoom - 0.1)} className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">−</button>
        <span className="w-12 text-center text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(zoom + 0.1)} className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">+</button>
        <button onClick={onFitToViewport} className="border-l border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">Fit</button>
        <button onClick={() => setShowGrid((value) => !value)} className={`border-l border-slate-200 px-2 py-1 text-xs ${showGrid ? 'text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Grid</button>
        <button onClick={() => setShowRulers((value) => !value)} className={`border-l border-slate-200 px-2 py-1 text-xs ${showRulers ? 'text-slate-900' : 'text-slate-700'} hover:bg-slate-50`}>Rulers</button>
      </div>
      <div className={`relative shadow-2xl rounded bg-white overflow-hidden border border-slate-300 ${showGrid ? 'canvas-grid' : ''}`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
        {showRulers && <><div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 border-b border-slate-300 bg-slate-100 text-[8px] text-slate-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 19px, #94a3b8 20px)' }} /><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 border-r border-slate-300 bg-slate-100" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 19px, #94a3b8 20px)' }} /></>}
        <canvas ref={canvasRef} />
      </div>
    </main>
  );
}