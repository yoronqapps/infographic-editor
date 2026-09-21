import { useEffect, useState } from 'react';
import type { ActiveTool } from '../../types/editor';
import * as fabric from 'fabric';
import { Type, Shapes, Image, MousePointer } from 'lucide-react';
import TextPanel from './TextPanel';
import ShapePanel from './ShapePanel';
import ImagePanel from './ImagePanel';
import TemplatePanel from './TemplatePanel';

interface SidebarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onAddText: (text: string, options?: any) => void;
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
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  canvasSize: { width: number; height: number };
  onResizeCanvas: (width: number, height: number, mode: 'scale' | 'recenter' | 'keep') => void;
  onAddImageFromUrl: (url: string) => void;
  onUploadAsset: (file: File) => Promise<string | null>;
  onAddImageFrame: (kind: 'rect' | 'rounded' | 'circle') => void;
  fabricCanvas: fabric.Canvas | null;
  onApplyTemplate: (template: 'process' | 'comparison' | 'quote' | 'timeline' | 'funnel' | 'cycle' | 'stats' | 'org') => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onToggleFreehand: () => void;
  isDrawingFreehand: boolean;
  onAddFrame: (preset: 'mobile' | 'desktop' | 'card' | 'section') => void;
  onSaveComponent: (name: string) => void;
  onInsertComponent: (component: { state: any[] }) => void;
}

export default function Sidebar({
  activeTool,
  setActiveTool,
  onAddText,
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
  backgroundColor,
  onBackgroundColorChange,
  canvasSize,
  onResizeCanvas,
  onAddImageFromUrl,
  onUploadAsset,
  onAddImageFrame,
  fabricCanvas,
  onApplyTemplate,
  snapEnabled,
  onToggleSnap,
  onToggleFreehand,
  isDrawingFreehand,
  onAddFrame,
  onSaveComponent,
  onInsertComponent,
}: SidebarProps) {
  const [layers, setLayers] = useState<fabric.Object[]>([]);
  const [layerQuery, setLayerQuery] = useState('');
  const [components, setComponents] = useState<Array<{ id: string; name: string; state: any[] }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('infographic-editor:components') || '[]') as Array<{ id: string; name: string; state: any[] }>;
    } catch {
      return [];
    }
  });

  const refreshComponents = () => {
    setComponents(JSON.parse(localStorage.getItem('infographic-editor:components') || '[]'));
  };

  useEffect(() => {
    if (!fabricCanvas) return;
    const refreshLayers = () => setLayers([...fabricCanvas.getObjects()].reverse());
    refreshLayers();
    fabricCanvas.on('object:added', refreshLayers);
    fabricCanvas.on('object:removed', refreshLayers);
    fabricCanvas.on('object:modified', refreshLayers);
    return () => {
      fabricCanvas.off('object:added', refreshLayers);
      fabricCanvas.off('object:removed', refreshLayers);
      fabricCanvas.off('object:modified', refreshLayers);
    };
  }, [fabricCanvas]);
  const tools = [
    { id: 'select' as ActiveTool, label: 'Select', icon: MousePointer },
    { id: 'text' as ActiveTool, label: 'Text', icon: Type },
    { id: 'shapes' as ActiveTool, label: 'Shapes', icon: Shapes },
    { id: 'images' as ActiveTool, label: 'Images', icon: Image },
    { id: 'templates' as ActiveTool, label: 'Templates', icon: Shapes },
  ];

  return (
    <div className="flex h-full border-r border-slate-200 bg-white">
      {/* Tool Icons Rail */}
      <nav className="w-16 border-r border-slate-200 flex flex-col items-center py-4 gap-4 bg-slate-900 text-slate-400">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-3 rounded-xl transition flex flex-col items-center gap-1 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Sub-panel */}
      <aside className="w-64 bg-white overflow-y-auto">
        {activeTool === 'select' && (
          <div className="p-4 flex flex-col gap-4">
            <p className="text-xs text-slate-400 italic">Click an item on the canvas to inspect its properties.</p>
            <button onClick={onToggleSnap} className={`rounded border px-3 py-2 text-left text-xs font-medium ${snapEnabled ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>Grid snapping: {snapEnabled ? 'On' : 'Off'}</button>
            <button onClick={onToggleFreehand} className={`rounded border px-3 py-2 text-left text-xs font-medium ${isDrawingFreehand ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Pen tool: {isDrawingFreehand ? 'Active' : 'Off'}</button>
            <div className="border-t border-slate-200 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Frames</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(['mobile', 'desktop', 'card', 'section'] as const).map((preset) => <button key={preset} onClick={() => onAddFrame(preset)} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] capitalize text-slate-700 hover:bg-slate-50">{preset}</button>)}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Components</h3>
              <button onClick={() => { const name = window.prompt('Component name'); if (name) { onSaveComponent(name); refreshComponents(); } }} className="mb-2 w-full rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">Save selection as component</button>
              <div className="flex flex-col gap-1">
                {components.map((component) => <button key={component.id} onClick={() => onInsertComponent(component)} className="rounded bg-slate-50 px-2 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">{component.name}</button>)}
                {components.length === 0 && <p className="text-[11px] text-slate-400">Save a selection to reuse it here.</p>}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Canvas background</h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => onBackgroundColorChange(event.target.value)}
                  aria-label="Canvas background color"
                  className="h-9 w-9 cursor-pointer rounded border border-slate-300 p-0"
                />
                <span className="font-mono text-xs text-slate-600">{backgroundColor}</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                {['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#111827'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onBackgroundColorChange(color)}
                    aria-label={`Set background ${color}`}
                    className="h-5 w-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Canvas size</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['Portrait', 600, 800],
                  ['Square', 800, 800],
                  ['Story', 1080, 1920],
                  ['Landscape', 1200, 675],
                  ['A4', 794, 1123],
                  ['Presentation', 1600, 900],
                ].map(([label, width, height]) => (
                  <button
                    key={label}
                    onClick={() => onResizeCanvas(Number(width), Number(height), 'scale')}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    <span className="block font-semibold">{label}</span>
                    <span className="text-[10px] text-slate-400">{width} x {height}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <label className="text-[11px] font-medium text-slate-600">Width
                  <input type="number" min="160" value={canvasSize.width} onChange={(event) => onResizeCanvas(Number(event.target.value), canvasSize.height, 'keep')} className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
                </label>
                <label className="text-[11px] font-medium text-slate-600">Height
                  <input type="number" min="160" value={canvasSize.height} onChange={(event) => onResizeCanvas(canvasSize.width, Number(event.target.value), 'keep')} className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
                </label>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => onResizeCanvas(canvasSize.width, canvasSize.height, 'recenter')} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Recenter</button>
                <button onClick={() => onResizeCanvas(canvasSize.width, canvasSize.height, 'scale')} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50">Scale content</button>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layers</h3>
              <input
                value={layerQuery}
                onChange={(event) => setLayerQuery(event.target.value)}
                placeholder="Search layers"
                aria-label="Search layers"
                className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <div className="flex flex-col gap-1">
                {layers.length === 0 && <p className="text-xs text-slate-400">Your canvas is empty.</p>}
                {layers.length > 0 && layers.filter((layer) => {
                  const label = (layer as any).name || (layer.type === 'i-text' ? 'Text' : layer.type);
                  return label.toLowerCase().includes(layerQuery.toLowerCase());
                }).length === 0 && <p className="text-xs text-slate-400">No matching layers.</p>}
                {layers.filter((layer) => {
                  const label = (layer as any).name || (layer.type === 'i-text' ? 'Text' : layer.type);
                  return label.toLowerCase().includes(layerQuery.toLowerCase());
                }).map((layer, index) => (
                  <button
                    key={`${layer.type}-${index}`}
                    onClick={() => { fabricCanvas?.setActiveObject(layer); fabricCanvas?.renderAll(); }}
                    className={`flex items-center justify-between rounded px-2 py-2 text-left text-xs capitalize ${layer.visible === false ? 'bg-slate-100 text-slate-400 line-through' : 'bg-slate-50 text-slate-600 hover:bg-blue-50'}`}
                  >
                    <span>{(layer as any).name || (layer.type === 'i-text' ? 'Text' : layer.type)}</span>
                    <span className="text-[10px] text-slate-400">{Math.round((layer.opacity ?? 1) * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTool === 'text' && <TextPanel onAddText={onAddText} />}
        {activeTool === 'shapes' && (
          <ShapePanel
            onAddRectangle={onAddRectangle}
            onAddRoundedRectangle={onAddRoundedRectangle}
            onAddPill={onAddPill}
            onAddLine={onAddLine}
            onAddDonut={onAddDonut}
            onAddCloud={onAddCloud}
            onAddLightning={onAddLightning}
            onAddSpeechBubble={onAddSpeechBubble}
            onAddBarChart={onAddBarChart}
            onAddLineChart={onAddLineChart}
            onAddPieChart={onAddPieChart}
            onAddProgressChart={onAddProgressChart}
            onAddCircle={onAddCircle}
            onAddTriangle={onAddTriangle}
            onAddDiamond={onAddDiamond}
            onAddHexagon={onAddHexagon}
            onAddStar={onAddStar}
            onAddBurst={onAddBurst}
            onAddHeart={onAddHeart}
            onAddArrow={onAddArrow}
            onAddCurvedArrow={onAddCurvedArrow}
            onStartConnector={onStartConnector}
            isDrawingConnector={isDrawingConnector}
          />
        )}
        {activeTool === 'images' && <ImagePanel onAddImageFromUrl={onAddImageFromUrl} onUploadAsset={onUploadAsset} onAddImageFrame={onAddImageFrame} />}
        {activeTool === 'templates' && <TemplatePanel onApplyTemplate={onApplyTemplate} />}
      </aside>
    </div>
  );
}