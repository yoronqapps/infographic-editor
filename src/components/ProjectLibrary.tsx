import { useState } from 'react';
import { FolderOpen, LoaderCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import type { ProjectSummary } from '../services/projectService';

interface ProjectLibraryProps {
  open: boolean;
  projects: ProjectSummary[];
  loading: boolean;
  activeProjectId?: string;
  onClose: () => void;
  onRefresh: () => void;
  onSaveNew: (title: string) => void;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectLibrary({ open, projects, loading, activeProjectId, onClose, onRefresh, onSaveNew, onLoad, onDelete }: ProjectLibraryProps) {
  const [newTitle, setNewTitle] = useState('');

  if (!open) return null;

  const createProject = () => {
    const title = newTitle.trim();
    if (!title) return;
    onSaveNew(title);
    setNewTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 pt-20" role="dialog" aria-modal="true" aria-label="Project library">
      <div className="w-full max-w-lg rounded-xl border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Project library</h2>
            <p className="mt-1 text-[11px] text-slate-500">Cloud projects saved to your account</p>
          </div>
          <button onClick={onClose} title="Close project library" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-2 border-b border-slate-200 p-4">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && createProject()}
            placeholder="New project name"
            aria-label="New project name"
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
          />
          <button onClick={createProject} disabled={!newTitle.trim()} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Save new</button>
          <button onClick={onRefresh} title="Refresh projects" className="rounded border border-slate-300 px-2 text-slate-600 hover:bg-slate-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>

        <div className="max-h-80 overflow-y-auto p-4">
          {loading && <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading projects...</div>}
          {!loading && projects.length === 0 && <div className="py-8 text-center text-xs text-slate-500">No cloud projects yet.</div>}
          {!loading && projects.map((project) => (
            <div key={project.id} className="mb-2 flex items-center gap-3 rounded border border-slate-200 p-3 last:mb-0">
              <FolderOpen className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-700">{project.title}</p>
                <p className="text-[10px] text-slate-400">{project.updated_at ? new Date(project.updated_at).toLocaleString() : 'No date'}</p>
              </div>
              {project.id === activeProjectId && <span className="text-[10px] text-emerald-600">Active</span>}
              <button onClick={() => onLoad(project.id)} className="rounded border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50">Open</button>
              <button onClick={() => onDelete(project.id)} title={`Delete ${project.title}`} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
