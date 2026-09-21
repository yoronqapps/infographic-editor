import { useRef } from 'react';
import { Download, Trash2, Undo2, Redo2, Save, FolderOpen, Library, History, Share2, Copy, Group, Ungroup, FileJson, Upload, Plus, Presentation } from 'lucide-react';
import jsPDF from 'jspdf';
import * as fabric from 'fabric';
import AuthPanel from './AuthPanel';

interface HeaderProps {
  pages: Array<{ id: number; name: string; thumbnail?: string }>;
  activePageId: number;
  onSwitchPage: (pageId: number) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onRenamePage: (pageId: number) => void;
  onMovePage: (pageId: number, direction: 'left' | 'right') => void;
  presentationMode: boolean;
  onTogglePresentation: () => void;
  fabricCanvas: fabric.Canvas | null;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  projectTitle: string;
  onProjectTitleChange: (title: string) => void;
  saveStatus: string;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  hasMultipleSelection: boolean;
  onDistribute: () => void;
  onAlignMultiple: (axis: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistributeMultiple: (axis: 'horizontal' | 'vertical') => void;
  onExportAllPages: () => void;
  onOpenProjectLibrary: () => void;
  onOpenHistory: () => void;
  onShare: () => void;
  readOnly?: boolean;
}

export default function Header({ pages, activePageId, onSwitchPage, onAddPage, onDuplicatePage, onDeletePage, onRenamePage, onMovePage, presentationMode, onTogglePresentation, fabricCanvas, onDeleteSelected, hasSelection, onUndo, onRedo, canUndo, canRedo, projectTitle, onProjectTitleChange, saveStatus, onSaveDraft, onLoadDraft, onDuplicate, onGroup, onUngroup, hasMultipleSelection, onDistribute, onAlignMultiple, onDistributeMultiple, onExportAllPages, onOpenProjectLibrary, onOpenHistory, onShare, readOnly = false }: HeaderProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportPNG = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'infographic.png';
    link.href = dataURL;
    link.click();
  };

  const exportTransparentPNG = () => {
    if (!fabricCanvas) return;
    const link = document.createElement('a');
    link.download = 'infographic-transparent.png';
    link.href = fabricCanvas.toDataURL({ format: 'png', multiplier: 2, withoutBackground: true } as any);
    link.click();
  };

  const exportJSON = () => {
    if (!fabricCanvas) return;
    const blob = new Blob([JSON.stringify(fabricCanvas.toJSON(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'infographic-project.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;
    try {
      await fabricCanvas.loadFromJSON(JSON.parse(await file.text()));
      fabricCanvas.renderAll();
    } catch {
      window.alert('That project file could not be loaded.');
    }
    event.target.value = '';
  };

  const exportJPG = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'infographic.jpg';
    link.href = dataURL;
    link.click();
  };

  const exportSVG = () => {
    if (!fabricCanvas) return;
    const svgData = fabricCanvas.toSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'infographic.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const exportPDF = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [fabricCanvas.width || 600, fabricCanvas.height || 800],
    });
    pdf.addImage(dataURL, 'PNG', 0, 0, fabricCanvas.width || 600, fabricCanvas.height || 800);
    pdf.save('infographic.pdf');
  };

  if (readOnly) {
    return <header className="flex items-center justify-between bg-slate-900 px-6 py-3 text-white shadow-md"><h1 className="text-lg font-bold tracking-wide text-blue-400">Infographic<span className="text-white">Studio</span><span className="ml-3 text-xs font-normal text-slate-400">Read-only shared view</span></h1><span className="max-w-[320px] truncate text-xs text-slate-300">{projectTitle}</span></header>;
  }

  return (
    <header className="flex flex-col gap-2 overflow-hidden bg-slate-900 px-4 py-2 text-white shadow-md sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-3">
      <div className="flex min-w-0 w-full items-center gap-3 overflow-x-auto pb-1 lg:w-auto lg:overflow-visible lg:pb-0">
        <h1 className="text-lg font-bold tracking-wide text-blue-400">
          Infographic<span className="text-white">Studio</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex max-w-[260px] items-center gap-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-800 p-1">
          {pages.map((page) => (
            <button key={page.id} onClick={() => onSwitchPage(page.id)} onDoubleClick={() => onRenamePage(page.id)} title="Double-click to rename" className={`flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[10px] ${page.id === activePageId ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              {page.thumbnail && <img src={page.thumbnail} alt="" className="h-4 w-3 rounded-sm object-cover" />}
              {page.name}
            </button>
          ))}
          <button onClick={() => onMovePage(activePageId, 'left')} title="Move page left" className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-700">‹</button>
          <button onClick={() => onMovePage(activePageId, 'right')} title="Move page right" className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-700">›</button>
          <button onClick={onAddPage} title="Add page" className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-700"><Plus className="h-3 w-3" /></button>
          <button onClick={onDuplicatePage} title="Duplicate page" className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-700"><Copy className="h-3 w-3" /></button>
          <button onClick={onDeletePage} disabled={pages.length === 1} title="Delete page" className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30"><Trash2 className="h-3 w-3" /></button>
        </div>
        <button onClick={onUndo} disabled={!canUndo} title="Undo" className="p-2 rounded hover:bg-slate-800 disabled:opacity-30">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={onTogglePresentation} title="Presentation mode" className={`p-2 rounded hover:bg-slate-800 ${presentationMode ? 'bg-blue-600' : ''}`}><Presentation className="w-4 h-4" /></button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo" className="p-2 rounded hover:bg-slate-800 disabled:opacity-30">
          <Redo2 className="w-4 h-4" />
        </button>
        {hasSelection && (
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
        {hasSelection && <button onClick={onDuplicate} title="Duplicate selected" className="p-2 rounded hover:bg-slate-800"><Copy className="w-4 h-4" /></button>}
        {hasMultipleSelection && <button onClick={onGroup} title="Group selection" className="p-2 rounded hover:bg-slate-800"><Group className="w-4 h-4" /></button>}
        {hasMultipleSelection && <button onClick={onDistribute} title="Distribute horizontally" className="p-2 rounded hover:bg-slate-800"><span className="text-xs">≡</span></button>}
        {hasMultipleSelection && <div className="flex items-center gap-1 rounded border border-slate-700 px-1">
          {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map((axis) => <button key={axis} onClick={() => onAlignMultiple(axis)} title={`Align ${axis}`} className="px-1.5 py-1 text-[10px] text-slate-300 hover:bg-slate-700">{axis === 'left' ? 'L' : axis === 'center' ? 'C' : axis === 'right' ? 'R' : axis === 'top' ? 'T' : axis === 'middle' ? 'M' : 'B'}</button>)}
          <button onClick={() => onDistributeMultiple('vertical')} title="Distribute vertically" className="px-1.5 py-1 text-[10px] text-slate-300 hover:bg-slate-700">V</button>
        </div>}
        {hasSelection && <button onClick={onUngroup} title="Ungroup selected" className="p-2 rounded hover:bg-slate-800"><Ungroup className="w-4 h-4" /></button>}

        <input
          value={projectTitle}
          onChange={(event) => onProjectTitleChange(event.target.value)}
          aria-label="Project title"
          className="w-40 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-400"
        />
        <span className="text-[10px] text-slate-400 hidden lg:inline">{saveStatus}</span>
        <button onClick={onSaveDraft} title="Save draft" className="p-2 rounded hover:bg-slate-800">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={onLoadDraft} title="Load draft" className="p-2 rounded hover:bg-slate-800">
          <FolderOpen className="w-4 h-4" />
        </button>
        <button onClick={onOpenProjectLibrary} title="Project library" className="p-2 rounded hover:bg-slate-800">
          <Library className="w-4 h-4" />
        </button>
        <button onClick={onOpenHistory} title="Version history" className="p-2 rounded hover:bg-slate-800"><History className="w-4 h-4" /></button>
        <button onClick={onShare} title="Copy read-only share link" className="p-2 rounded hover:bg-slate-800"><Share2 className="w-4 h-4" /></button>
        <button onClick={exportJSON} title="Export editable project" className="p-2 rounded hover:bg-slate-800"><FileJson className="w-4 h-4" /></button>
        <button onClick={() => importInputRef.current?.click()} title="Import editable project" className="p-2 rounded hover:bg-slate-800"><Upload className="w-4 h-4" /></button>
        <input ref={importInputRef} type="file" accept="application/json" onChange={importJSON} className="hidden" />

        <div className="h-4 w-px bg-slate-700" />

        <AuthPanel />

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={exportPNG}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" /> PNG
        </button>

        <button onClick={exportJPG} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition">
          <Download className="w-3.5 h-3.5" /> JPG
        </button>
        <button onClick={exportTransparentPNG} title="Transparent PNG" className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition">
          <Download className="w-3.5 h-3.5" /> PNG clear
        </button>

        <button
          onClick={exportSVG}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" /> SVG
        </button>

        <button
          onClick={exportPDF}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition shadow"
        >
          <Download className="w-3.5 h-3.5" /> Export PDF
        </button>
        <button
          onClick={onExportAllPages}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" /> All pages
        </button>
      </div>
    </header>
  );
}