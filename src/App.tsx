import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import type { ActiveTool } from './types/editor';
import { useFabric } from './hooks/useFabric';
import Header from './components/Header';
import Sidebar from './components/Sidebar/Sidebar';
import CanvasArea from './components/Canvas/CanvasArea';
import StyleEditor from './components/PropertiesPanel/StyleEditor';
import ProjectLibrary from './components/ProjectLibrary';
import VersionHistory from './components/VersionHistory';
import LandingPage from './components/LandingPage';
import { decodeSharedDocument, deleteCloudProject, encodeSharedDocument, listProjects, loadCloudProject, loadLocalProject, loadLocalRevisions, saveCloudProject, saveLocalProject, saveLocalRevision, type CloudProjectDocument, type LocalRevision, type ProjectSummary } from './services/projectService';
import { uploadAsset } from './services/storageService';
import { isSupabaseConfigured } from './lib/supabase';

interface EditorPage {
  id: number;
  name: string;
  state: any;
  thumbnail?: string;
}

export default function App() {
  const [showLanding, setShowLanding] = useState(() => !window.location.hash.startsWith('#share='));
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [projectTitle, setProjectTitle] = useState('Untitled infographic');
  const [saveStatus, setSaveStatus] = useState('Autosave ready');
  const [projectRestored, setProjectRestored] = useState(false);
  const [pages, setPages] = useState<EditorPage[]>(() => {
    try {
      return loadLocalProject()?.pages ?? [{ id: 1, name: 'Page 1', state: null }];
    } catch {
      return [{ id: 1, name: 'Page 1', state: null }];
    }
  });
  const [activePageId, setActivePageId] = useState(1);
  const [presentationMode, setPresentationMode] = useState(false);
  const [projectLibraryOpen, setProjectLibraryOpen] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<ProjectSummary[]>([]);
  const [cloudProjectsLoading, setCloudProjectsLoading] = useState(false);
  const [activeCloudProjectId, setActiveCloudProjectId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<LocalRevision[]>(() => loadLocalRevisions());
  const [sharedView, setSharedView] = useState(false);

  const {
    canvasRef,
    fabricCanvas,
    selectedObject,
    addText,
    addRectangle,
    addRoundedRectangle,
    addPill,
    addLine,
    addDonut,
    addCloud,
    addLightning,
    addSpeechBubble,
    addImageFrame,
    addBarChart,
    addLineChart,
    addPieChart,
    addProgressChart,
    updateSelectedChart,
    addCircle,
    addTriangle,
    addDiamond,
    addHexagon,
    addStar,
    addBurst,
    addHeart,
    addArrow,
    addCurvedArrow,
    startConnector,
    isDrawingConnector,
    addImageFromUrl,
    updateSelected,
    updateBackgroundColor,
    backgroundColor,
    canvasSize,
    resizeCanvas,
    zoom,
    setCanvasZoom,
    fitCanvasToViewport,
    toggleSelectedVisibility,
    moveSelectedLayer,
    updateSelectedStroke,
    updateSelectedArrowPoint,
    editSelectedText,
    duplicateSelected,
    alignSelected,
    setSelectedLayerOrder,
    renameSelected,
    applyTemplate,
    toggleSelectedLock,
    makeSelectedReference,
    analyzeSelectedImage,
    ocrStatus,
    applyImageFilter,
    setImageMask,
    cropImage,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    snapEnabled,
    toggleSnap,
    nudgeSelected,
    groupSelected,
    ungroupSelected,
    isDrawingFreehand,
    toggleFreehand,
    distributeSelected,
    alignMultiple,
    distributeMultiple,
    addFrame,
    saveComponent,
    insertComponent,
    applySelectedGradient,
    animateSelectedEntrance,
    isEditingPoints,
    togglePointEditing,
    clipSelectedImageToShape,
  } = useFabric(600, 800);

  if (showLanding && !sharedView) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  useEffect(() => {
    if (!fabricCanvas || !projectRestored) return;
    const currentPages = pages.map((page) => page.id === activePageId
      ? { ...page, state: fabricCanvas.toJSON(), thumbnail: fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 }) }
      : page);
    saveLocalProject({ title: projectTitle, pages: currentPages, activePageId });
  }, [activePageId, fabricCanvas, pages, projectRestored, projectTitle]);

  useEffect(() => {
    if (!fabricCanvas) return;
    let active = true;
    const restoreProject = async () => {
      const sharedData = window.location.hash.startsWith('#share=')
        ? decodeSharedDocument(window.location.hash.slice('#share='.length))
        : null;
      if (sharedData) {
        const sharedPage = sharedData.pages.find((item) => item.id === sharedData.activePageId) ?? sharedData.pages[0];
        setProjectTitle(sharedData.title);
        setPages(sharedData.pages);
        setActivePageId(sharedPage.id);
        await fabricCanvas.loadFromJSON(sharedPage.state ?? { objects: [] });
        fabricCanvas.renderAll();
        setSharedView(true);
        setPresentationMode(true);
        setSaveStatus('Read-only shared view');
        setProjectRestored(true);
        return;
      }
      const project = loadLocalProject();
      if (!project || !active) {
        if (active) setProjectRestored(true);
        return;
      }
      const page = project.pages.find((item) => item.id === project.activePageId) ?? project.pages[0];
      if (project.title) setProjectTitle(project.title);
      setPages(project.pages);
      setActivePageId(page.id);
      await fabricCanvas.loadFromJSON(page.state ?? { objects: [] });
      fabricCanvas.renderAll();
      setSaveStatus('Project restored');
      setProjectRestored(true);
    };
    restoreProject().catch(() => setSaveStatus('New project'));
    return () => { active = false; };
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    let saveTimer: number | undefined;
    const saveDraft = () => {
      window.clearTimeout(saveTimer);
      setSaveStatus('Saving...');
      saveTimer = window.setTimeout(() => {
        const currentPages = pages.map((page) => page.id === activePageId
          ? { ...page, state: fabricCanvas.toJSON(), thumbnail: fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 }) }
          : page);
        saveLocalProject({ title: projectTitle, pages: currentPages, activePageId });
        setSaveStatus(`Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      }, 350);
    };
    fabricCanvas.on('object:added', saveDraft);
    fabricCanvas.on('object:modified', saveDraft);
    fabricCanvas.on('object:removed', saveDraft);
    window.addEventListener('beforeunload', saveDraft);
    return () => {
      window.clearTimeout(saveTimer);
      fabricCanvas.off('object:added', saveDraft);
      fabricCanvas.off('object:modified', saveDraft);
      fabricCanvas.off('object:removed', saveDraft);
      window.removeEventListener('beforeunload', saveDraft);
    };
  }, [activePageId, fabricCanvas, pages, projectTitle]);

  const saveDraft = () => {
    if (!fabricCanvas) return;
    const currentPages = pages.map((page) => page.id === activePageId
      ? { ...page, state: fabricCanvas.toJSON(), thumbnail: fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 }) }
      : page);
    saveLocalProject({ title: projectTitle, pages: currentPages, activePageId });
    saveLocalRevision({ title: projectTitle, pages: currentPages, activePageId });
    setRevisions(loadLocalRevisions());
    setSaveStatus(`Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
  };

  const restoreDraft = async () => {
    if (!fabricCanvas) return;
    const project = loadLocalProject();
    if (!project) {
      setSaveStatus('No saved project');
      return;
    }
    const page = project.pages.find((item) => item.id === project.activePageId) ?? project.pages[0];
    setProjectTitle(project.title);
    setPages(project.pages);
    setActivePageId(page.id);
    await fabricCanvas.loadFromJSON(page.state ?? { objects: [] });
    fabricCanvas.renderAll();
    setSaveStatus('Project restored');
  };

  const getCurrentDocument = (): CloudProjectDocument | null => {
    if (!fabricCanvas) return null;
    return {
      title: projectTitle,
      pages: pages.map((page) => page.id === activePageId
        ? { ...page, state: fabricCanvas.toJSON(), thumbnail: fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 }) }
        : page),
      activePageId,
    };
  };

  const refreshCloudProjects = async () => {
    setCloudProjectsLoading(true);
    try {
      setCloudProjects(await listProjects());
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not load cloud projects');
    } finally {
      setCloudProjectsLoading(false);
    }
  };

  const saveCloudDocument = async (titleOverride?: string) => {
    const document = getCurrentDocument();
    if (!document) return;
    const cloudDocument = { ...document, title: titleOverride?.trim() || document.title };
    try {
      const saved = await saveCloudProject(cloudDocument, titleOverride ? undefined : activeCloudProjectId);
      if (titleOverride?.trim()) setProjectTitle(titleOverride.trim());
      setActiveCloudProjectId(saved.id);
      saveLocalRevision(cloudDocument);
      setRevisions(loadLocalRevisions());
      setSaveStatus('Cloud project saved');
      await refreshCloudProjects();
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not save cloud project');
    }
  };

  const loadCloudDocument = async (projectId: string) => {
    if (!fabricCanvas) return;
    try {
      const document = await loadCloudProject(projectId);
      const page = document.pages.find((item) => item.id === document.activePageId) ?? document.pages[0];
      setProjectTitle(document.title);
      setPages(document.pages);
      setActivePageId(page.id);
      await fabricCanvas.loadFromJSON(page.state ?? { objects: [] });
      fabricCanvas.renderAll();
      setActiveCloudProjectId(projectId);
      setProjectLibraryOpen(false);
      setSaveStatus('Cloud project loaded');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not load cloud project');
    }
  };

  const deleteCloudDocument = async (projectId: string) => {
    if (!window.confirm('Delete this cloud project?')) return;
    try {
      await deleteCloudProject(projectId);
      if (projectId === activeCloudProjectId) setActiveCloudProjectId(undefined);
      await refreshCloudProjects();
      setSaveStatus('Cloud project deleted');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not delete cloud project');
    }
  };

  const restoreRevision = async (revision: LocalRevision) => {
    if (!fabricCanvas) return;
    const document = revision.document;
    const page = document.pages.find((item) => item.id === document.activePageId) ?? document.pages[0];
    setProjectTitle(document.title);
    setPages(document.pages);
    setActivePageId(page.id);
    await fabricCanvas.loadFromJSON(page.state ?? { objects: [] });
    fabricCanvas.renderAll();
    setHistoryOpen(false);
    setSaveStatus('Revision restored');
  };

  const shareCurrentDocument = async () => {
    const document = getCurrentDocument();
    if (!document) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encodeSharedDocument(document)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSaveStatus('Read-only link copied');
    } catch {
      window.prompt('Copy this read-only link', shareUrl);
    }
  };

  const exportAllPages = async () => {
    if (!fabricCanvas || pages.length === 0) return;
    const currentPageState = fabricCanvas.toJSON();
    const exportPages = pages.map((page) => page.id === activePageId ? { ...page, state: currentPageState } : page);
    const firstPage = exportPages[0];
    const pdf = new jsPDF({
      orientation: (canvasSize.width >= canvasSize.height ? 'landscape' : 'portrait'),
      unit: 'px',
      format: [canvasSize.width, canvasSize.height],
    });

    for (const [index, page] of exportPages.entries()) {
      await fabricCanvas.loadFromJSON(page.state ?? { objects: [] });
      fabricCanvas.renderAll();
      if (index > 0) pdf.addPage([canvasSize.width, canvasSize.height], canvasSize.width >= canvasSize.height ? 'landscape' : 'portrait');
      pdf.addImage(fabricCanvas.toDataURL({ format: 'png', multiplier: 2 }), 'PNG', 0, 0, canvasSize.width, canvasSize.height);
    }

    await fabricCanvas.loadFromJSON(currentPageState);
    fabricCanvas.renderAll();
    void firstPage;
    pdf.save(`${projectTitle.trim() || 'infographic'}-all-pages.pdf`);
    setSaveStatus('All pages exported');
  };

  const uploadImageAsset = async (file: File) => {
    if (!isSupabaseConfigured) return null;
    try {
      return await uploadAsset(file);
    } catch {
      setSaveStatus('Cloud upload failed; using local image');
      return null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') deleteSelected();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        nudgeSelected(event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0, event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0);
      } else if (modifier && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        setCanvasZoom(zoom + 0.1);
      } else if (modifier && event.key === '-') {
        event.preventDefault();
        setCanvasZoom(zoom - 0.1);
      } else if (modifier && event.key === '0') {
        event.preventDefault();
        fitCanvasToViewport(window.innerWidth - 560, window.innerHeight - 120);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, nudgeSelected, redo, undo]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith('image/'));
      const file = imageItem?.getAsFile();
      if (!file) return;
      event.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          addImageFromUrl(reader.result);
          setSaveStatus('Pasted image added');
        }
      };
      reader.readAsDataURL(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImageFromUrl]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresentationMode(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const switchPage = async (pageId: number) => {
    if (!fabricCanvas || pageId === activePageId) return;
    const targetPage = pages.find((page) => page.id === pageId);
    if (!targetPage) return;
    const currentState = fabricCanvas.toJSON();
    const thumbnail = fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 });
    setPages((currentPages) => currentPages.map((page) => page.id === activePageId ? { ...page, state: currentState, thumbnail } : page));
    await fabricCanvas.loadFromJSON(targetPage.state ?? { objects: [] });
    fabricCanvas.renderAll();
    setActivePageId(pageId);
    setSaveStatus(`${targetPage.name} active`);
  };

  const addPage = async (duplicate = false) => {
    if (!fabricCanvas) return;
    const nextId = Math.max(...pages.map((page) => page.id), 0) + 1;
    const currentState = fabricCanvas.toJSON();
    const thumbnail = fabricCanvas.toDataURL({ format: 'png', multiplier: 0.15 });
    const newPage: EditorPage = { id: nextId, name: `Page ${nextId}`, state: duplicate ? currentState : null, thumbnail: duplicate ? thumbnail : undefined };
    setPages((currentPages) => currentPages.map((page) => page.id === activePageId ? { ...page, state: currentState, thumbnail } : page).concat(newPage));
    await fabricCanvas.loadFromJSON(newPage.state ?? { objects: [] });
    fabricCanvas.renderAll();
    setActivePageId(nextId);
    setSaveStatus(`${newPage.name} created`);
  };

  const deletePage = async () => {
    if (!fabricCanvas || pages.length === 1) return;
    const remainingPages = pages.filter((page) => page.id !== activePageId);
    const nextPage = remainingPages[remainingPages.length - 1];
    setPages(remainingPages);
    await fabricCanvas.loadFromJSON(nextPage.state ?? { objects: [] });
    fabricCanvas.renderAll();
    setActivePageId(nextPage.id);
    setSaveStatus(`${nextPage.name} active`);
  };

  const renamePage = (pageId: number) => {
    const page = pages.find((item) => item.id === pageId);
    const name = window.prompt('Page name', page?.name ?? 'Page');
    if (!page || !name?.trim()) return;
    setPages((currentPages) => currentPages.map((item) => item.id === pageId ? { ...item, name: name.trim() } : item));
  };

  const movePage = (pageId: number, direction: 'left' | 'right') => {
    const index = pages.findIndex((page) => page.id === pageId);
    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setPages(reordered);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Header
        fabricCanvas={fabricCanvas}
        onDeleteSelected={deleteSelected}
        hasSelection={!!selectedObject}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        projectTitle={projectTitle}
        onProjectTitleChange={setProjectTitle}
        saveStatus={saveStatus}
        onSaveDraft={saveDraft}
        onLoadDraft={restoreDraft}
        onDuplicate={duplicateSelected}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onDistribute={distributeSelected}
          onAlignMultiple={alignMultiple}
          onDistributeMultiple={distributeMultiple}
        hasMultipleSelection={Boolean(fabricCanvas && fabricCanvas.getActiveObjects().length > 1)}
        pages={pages}
        activePageId={activePageId}
        onSwitchPage={switchPage}
        onAddPage={() => addPage(false)}
        onDuplicatePage={() => addPage(true)}
        onDeletePage={deletePage}
        onRenamePage={renamePage}
        onMovePage={movePage}
        presentationMode={presentationMode}
        onTogglePresentation={() => setPresentationMode((value) => !value)}
        onExportAllPages={exportAllPages}
        onOpenProjectLibrary={() => { setProjectLibraryOpen(true); void refreshCloudProjects(); }}
        onOpenHistory={() => setHistoryOpen(true)}
        onShare={() => { void shareCurrentDocument(); }}
        readOnly={sharedView}
      />

      <div className="flex flex-1 overflow-hidden">
        {!presentationMode && !sharedView && <Sidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddText={addText}
          onAddRectangle={addRectangle}
          onAddRoundedRectangle={addRoundedRectangle}
          onAddPill={addPill}
          onAddLine={addLine}
          onAddDonut={addDonut}
          onAddCloud={addCloud}
          onAddLightning={addLightning}
          onAddSpeechBubble={addSpeechBubble}
          onAddBarChart={addBarChart}
          onAddLineChart={addLineChart}
          onAddPieChart={addPieChart}
          onAddProgressChart={addProgressChart}
          onAddCircle={addCircle}
          onAddTriangle={addTriangle}
          onAddDiamond={addDiamond}
          onAddHexagon={addHexagon}
          onAddStar={addStar}
          onAddBurst={addBurst}
          onAddHeart={addHeart}
          onAddArrow={addArrow}
          onAddCurvedArrow={addCurvedArrow}
          onStartConnector={startConnector}
          isDrawingConnector={isDrawingConnector}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={updateBackgroundColor}
          canvasSize={canvasSize}
          onResizeCanvas={resizeCanvas}
          onAddImageFromUrl={addImageFromUrl}
          onUploadAsset={uploadImageAsset}
          onAddImageFrame={addImageFrame}
          fabricCanvas={fabricCanvas}
          onApplyTemplate={applyTemplate}
          snapEnabled={snapEnabled}
          onToggleSnap={toggleSnap}
          onToggleFreehand={toggleFreehand}
          isDrawingFreehand={isDrawingFreehand}
          onAddFrame={addFrame}
          onSaveComponent={saveComponent}
          onInsertComponent={insertComponent}
        />}

        <CanvasArea canvasRef={canvasRef} zoom={zoom} onZoomChange={setCanvasZoom} onFitToViewport={() => fitCanvasToViewport(window.innerWidth - 560, window.innerHeight - 120)} />

        {!presentationMode && !sharedView && <StyleEditor
          selectedObject={selectedObject}
          onUpdateSelected={updateSelected}
          onApplyImageFilter={applyImageFilter}
          onSetImageMask={setImageMask}
          onCropImage={cropImage}
          onToggleLock={toggleSelectedLock}
          onMakeReference={makeSelectedReference}
          onAnalyzeImage={analyzeSelectedImage}
          ocrStatus={ocrStatus}
          onToggleVisibility={toggleSelectedVisibility}
          onMoveLayer={moveSelectedLayer}
          onUpdateStroke={updateSelectedStroke}
          onUpdateArrowPoint={updateSelectedArrowPoint}
          onApplyGradient={applySelectedGradient}
          onAnimateEntrance={animateSelectedEntrance}
          isEditingPoints={isEditingPoints}
          onTogglePointEditing={togglePointEditing}
          onClipImageToShape={clipSelectedImageToShape}
          onEditText={editSelectedText}
          onAlignSelected={alignSelected}
          onSetLayerOrder={setSelectedLayerOrder}
          onRenameSelected={renameSelected}
          onUpdateChartData={updateSelectedChart}
        />}
      </div>
      <ProjectLibrary
        open={projectLibraryOpen}
        projects={cloudProjects}
        loading={cloudProjectsLoading}
        activeProjectId={activeCloudProjectId}
        onClose={() => setProjectLibraryOpen(false)}
        onRefresh={() => { void refreshCloudProjects(); }}
        onSaveNew={(title) => { void saveCloudDocument(title); }}
        onLoad={(projectId) => { void loadCloudDocument(projectId); }}
        onDelete={(projectId) => { void deleteCloudDocument(projectId); }}
      />
      <VersionHistory open={historyOpen && !sharedView} revisions={revisions} onClose={() => setHistoryOpen(false)} onRestore={(revision) => { void restoreRevision(revision); }} />
    </div>
  );
}