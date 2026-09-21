import { Square, Circle as CircleIcon, Triangle as TriangleIcon } from 'lucide-react';

interface ShapePanelProps {
  onAddRectangle: () => void;
  onAddRoundedRectangle: () => void;
  onAddPill: () => void;
  onAddLine: () => void;
  onAddDonut: () => void;
  onAddCloud: () => void;
  onAddLightning: () => void;
  onAddSpeechBubble: () => void;
  onAddBarChart: () => void;
  onAddLineChart: () => void;
  onAddPieChart: () => void;
  onAddProgressChart: () => void;
  onAddCircle: () => void;
  onAddTriangle: () => void;
  onAddDiamond: () => void;
  onAddHexagon: () => void;
  onAddStar: () => void;
  onAddBurst: () => void;
  onAddHeart: () => void;
  onAddArrow: (headType?: 'classic' | 'chevron' | 'double') => void;
  onAddCurvedArrow: () => void;
  onStartConnector: (mode: 'straight' | 'curved') => void;
  isDrawingConnector: boolean;
}

export default function ShapePanel({
  onAddRectangle,
  onAddRoundedRectangle,
  onAddPill,
  onAddLine,
  onAddDonut,
  onAddCloud,
  onAddLightning,
  onAddSpeechBubble,
  onAddBarChart,
  onAddLineChart,
  onAddPieChart,
  onAddProgressChart,
  onAddCircle,
  onAddTriangle,
  onAddDiamond,
  onAddHexagon,
  onAddStar,
  onAddBurst,
  onAddHeart,
  onAddArrow,
  onAddCurvedArrow,
  onStartConnector,
  isDrawingConnector,
}: ShapePanelProps) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Geometric Shapes
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onAddRectangle}
          className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition gap-2"
        >
          <Square className="w-6 h-6 text-blue-500" />
          <span className="text-xs font-medium">Rectangle</span>
        </button>

        <button onClick={onAddRoundedRectangle} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100">
          <span className="h-6 w-10 rounded-lg border-2 border-blue-500" />
          <span className="text-xs font-medium">Rounded</span>
        </button>

        <button onClick={onAddPill} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100">
          <span className="h-5 w-12 rounded-full border-2 border-amber-500" />
          <span className="text-xs font-medium">Pill</span>
        </button>

        <button
          onClick={onAddCircle}
          className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition gap-2"
        >
          <CircleIcon className="w-6 h-6 text-emerald-500" />
          <span className="text-xs font-medium">Circle</span>
        </button>

        <button
          onClick={onAddTriangle}
          className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition gap-2"
        >
          <TriangleIcon className="w-6 h-6 text-amber-500" />
          <span className="text-xs font-medium">Triangle</span>
        </button>
      </div>
      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Charts</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Bar chart', onAddBarChart],
            ['Line chart', onAddLineChart],
            ['Pie chart', onAddPieChart],
            ['Progress', onAddProgressChart],
          ].map(([label, action]) => <button key={label as string} onClick={action as () => void} className="rounded border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-700 hover:bg-slate-100">{label as string}</button>)}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Diagram shapes</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Line', onAddLine, '—'],
            ['Donut', onAddDonut, '○'],
            ['Cloud', onAddCloud, '☁'],
            ['Lightning', onAddLightning, 'ϟ'],
            ['Callout', onAddSpeechBubble, '▢'],
          ].map(([label, action, icon]) => (
            <button key={label as string} onClick={action as () => void} className="flex flex-col items-center gap-1 rounded border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100">
              <span className="text-lg">{icon as string}</span><span className="text-[10px]">{label as string}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Arrow types</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onAddArrow('classic')} className="rounded border border-blue-200 bg-blue-50 p-2 text-lg text-blue-700 hover:bg-blue-100" title="Classic arrow">→</button>
          <button onClick={() => onAddArrow('chevron')} className="rounded border border-blue-200 bg-blue-50 p-2 text-lg text-blue-700 hover:bg-blue-100" title="Chevron arrow">›</button>
          <button onClick={() => onAddArrow('double')} className="rounded border border-blue-200 bg-blue-50 p-2 text-lg text-blue-700 hover:bg-blue-100" title="Double-headed arrow">↔</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Diamond', action: onAddDiamond, icon: '◆' },
          { label: 'Hexagon', action: onAddHexagon, icon: '⬢' },
          { label: 'Star', action: onAddStar, icon: '★' },
          { label: 'Burst', action: onAddBurst, icon: '✹' },
          { label: 'Heart', action: onAddHeart, icon: '♥' },
        ].map((shape) => (
          <button key={shape.label} onClick={shape.action} className="flex flex-col items-center justify-center gap-1 rounded border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100">
            <span className="text-lg text-slate-600">{shape.icon}</span>
            <span className="text-[10px]">{shape.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onAddCurvedArrow}
        className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-blue-700 transition"
      >
        <span className="text-lg">↗</span>
        <span className="text-xs font-medium">Curved arrow</span>
      </button>
      <div className="border-t border-slate-200 pt-3 mt-1 flex flex-col gap-2">
        <p className="text-[10px] text-slate-400">Multi-point connector</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onStartConnector('straight')} className="border rounded px-2 py-2 text-xs hover:bg-slate-50">{isDrawingConnector ? 'Click points' : 'Straight path'}</button>
          <button onClick={() => onStartConnector('curved')} className="border rounded px-2 py-2 text-xs hover:bg-slate-50">{isDrawingConnector ? 'Double-click end' : 'Curved path'}</button>
        </div>
      </div>
    </div>
  );
}