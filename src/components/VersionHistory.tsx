import { History, RotateCcw, X } from 'lucide-react';
import type { LocalRevision } from '../services/projectService';

interface VersionHistoryProps {
  open: boolean;
  revisions: LocalRevision[];
  onClose: () => void;
  onRestore: (revision: LocalRevision) => void;
}

export default function VersionHistory({ open, revisions, onClose, onRestore }: VersionHistoryProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-20" role="dialog" aria-modal="true" aria-label="Version history">
      <div className="w-full max-w-lg rounded-xl border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-semibold text-slate-800">Version history</h2></div>
          <button onClick={onClose} title="Close version history" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-4">
          {revisions.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No saved revisions yet. Use Save draft to create one.</p>}
          {revisions.map((revision) => (
            <div key={revision.id} className="mb-2 flex items-center gap-3 rounded border border-slate-200 p-3 last:mb-0">
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{revision.title}</p><p className="text-[10px] text-slate-400">{new Date(revision.saved_at).toLocaleString()}</p></div>
              <button onClick={() => onRestore(revision)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3 w-3" /> Restore</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}