import { supabase } from '../lib/supabase';
import * as fabric from 'fabric';

export interface Project {
  id?: string;
  title: string;
  canvas_state: any;
  user_id?: string;
}

export interface LocalProjectPage {
  id: number;
  name: string;
  state: any;
  thumbnail?: string;
}

export interface LocalProjectDocument {
  title: string;
  pages: LocalProjectPage[];
  activePageId: number;
  saved_at: string;
}

export interface CloudProjectDocument extends Omit<LocalProjectDocument, 'saved_at'> {
  saved_at?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updated_at?: string;
}

export interface LocalRevision {
  id: string;
  title: string;
  document: CloudProjectDocument;
  saved_at: string;
}

const LOCAL_DRAFT_KEY = 'infographic-editor:draft';
const LOCAL_PROJECT_KEY = 'infographic-editor:project';
const LOCAL_REVISIONS_KEY = 'infographic-editor:revisions';

export const saveLocalDraft = (title: string, fabricCanvas: fabric.Canvas) => {
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
    title,
    canvas_state: fabricCanvas.toJSON(),
    saved_at: new Date().toISOString(),
  }));
};

export const saveLocalProject = (document: Omit<LocalProjectDocument, 'saved_at'>) => {
  localStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify({
    ...document,
    saved_at: new Date().toISOString(),
  } satisfies LocalProjectDocument));
};

export const loadLocalProject = (): LocalProjectDocument | null => {
  const rawProject = localStorage.getItem(LOCAL_PROJECT_KEY);
  if (!rawProject) return null;

  try {
    const project = JSON.parse(rawProject) as LocalProjectDocument;
    if (!project.title || !Array.isArray(project.pages) || project.pages.length === 0) return null;
    return project;
  } catch {
    return null;
  }
};

export const saveLocalRevision = (document: CloudProjectDocument) => {
  const revisions = loadLocalRevisions();
  const revision: LocalRevision = {
    id: `${Date.now()}`,
    title: document.title,
    document,
    saved_at: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_REVISIONS_KEY, JSON.stringify([revision, ...revisions].slice(0, 20)));
};

export const loadLocalRevisions = (): LocalRevision[] => {
  try {
    const revisions = JSON.parse(localStorage.getItem(LOCAL_REVISIONS_KEY) || '[]') as LocalRevision[];
    return Array.isArray(revisions) ? revisions : [];
  } catch {
    return [];
  }
};

export const encodeSharedDocument = (document: CloudProjectDocument) => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(document))));
  return encoded.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

export const decodeSharedDocument = (encoded: string): CloudProjectDocument | null => {
  try {
    const padded = encoded.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as CloudProjectDocument;
  } catch {
    return null;
  }
};

export const loadLocalDraft = async (fabricCanvas: fabric.Canvas) => {
  const rawDraft = localStorage.getItem(LOCAL_DRAFT_KEY);
  if (!rawDraft) return null;
  const draft = JSON.parse(rawDraft) as { title?: string; canvas_state?: object; saved_at?: string };
  if (draft.canvas_state) {
    await fabricCanvas.loadFromJSON(draft.canvas_state);
    fabricCanvas.renderAll();
  }
  return draft;
};

export const saveProject = async (
  title: string,
  fabricCanvas: fabric.Canvas,
  projectId?: string
) => {
  const canvasState = fabricCanvas.toJSON();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be logged in to save projects');

  if (projectId) {
    const { data, error } = await supabase
      .from('projects')
      .update({ title, canvas_state: canvasState, updated_at: new Date() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert({ title, canvas_state: canvasState, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const loadProject = async (projectId: string, fabricCanvas: fabric.Canvas) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;

  if (data?.canvas_state) {
    await fabricCanvas.loadFromJSON(data.canvas_state);
    fabricCanvas.renderAll();
  }
  return data;
};

export const listProjects = async (): Promise<ProjectSummary[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectSummary[];
};

export const saveCloudProject = async (document: CloudProjectDocument, projectId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to save cloud projects');

  const payload = {
    title: document.title,
    canvas_state: document,
    updated_at: new Date().toISOString(),
  };

  if (projectId) {
    const { data, error } = await supabase.from('projects').update(payload).eq('id', projectId).select('id, title, updated_at').single();
    if (error) throw error;
    return data as ProjectSummary;
  }

  const { data, error } = await supabase.from('projects').insert({ ...payload, user_id: user.id }).select('id, title, updated_at').single();
  if (error) throw error;
  return data as ProjectSummary;
};

export const loadCloudProject = async (projectId: string): Promise<CloudProjectDocument> => {
  const { data, error } = await supabase.from('projects').select('canvas_state').eq('id', projectId).single();
  if (error) throw error;
  const document = data?.canvas_state as CloudProjectDocument | undefined;
  if (!document?.title || !Array.isArray(document.pages)) throw new Error('This project has an invalid document');
  return document;
};

export const deleteCloudProject = async (projectId: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
};