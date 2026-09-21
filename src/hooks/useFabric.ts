import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { recognizeTextLines } from '../services/ocrService';
import type { ChartDatum, ChartKind } from '../types/editor';

export const useFabric = (width: number, height: number) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [, refreshSelection] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [zoom, setZoom] = useState(1);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const history = useRef<any[]>([]);
  const historyIndex = useRef(-1);
  const restoringHistory = useRef(false);
  const snapEnabledRef = useRef(true);
  const updateArrowPointRef = useRef<((point: 'start' | 'end' | 'control', x: number, y: number) => void) | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricObject = fabric.FabricObject as typeof fabric.FabricObject & { customProperties?: string[] };
    fabricObject.customProperties = Array.from(new Set([
      ...(fabricObject.customProperties ?? []),
      'name',
      'arrowKind',
      'arrowHead',
      'startX',
      'startY',
      'endX',
      'endY',
      'controlX',
      'controlY',
      'chartKind',
      'chartData',
    ]));

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    const updateHistoryState = () => {
      setHistoryState({
        canUndo: historyIndex.current > 0,
        canRedo: historyIndex.current < history.current.length - 1,
      });
    };

    const recordHistory = () => {
      if (restoringHistory.current) return;
      const snapshot = canvas.toJSON();
      history.current = history.current.slice(0, historyIndex.current + 1);
      history.current.push(snapshot);
      historyIndex.current = history.current.length - 1;
      updateHistoryState();
    };

    const handleSelection = (e: fabric.TPointerEventInfo) => {
      const selectionEvent = e as fabric.TPointerEventInfo & { selected?: fabric.FabricObject[] };
      const target = selectionEvent.selected?.[0] ?? e.target;
      if (target) {
        if (target.type === 'group' && (target as any).arrowKind) attachArrowControls(target as fabric.Group);
        setSelectedObject(target);
      }
    };

    const handleClear = () => {
      setSelectedObject(null);
    };

    const handleMoving = (event: fabric.TEvent & { target?: fabric.Object }) => {
      if (!snapEnabledRef.current || !event.target) return;
      const target = event.target;
      const grid = 10;
      const threshold = 7;
      let nextLeft = Math.round((target.left ?? 0) / grid) * grid;
      let nextTop = Math.round((target.top ?? 0) / grid) * grid;
      const targetWidth = target.getScaledWidth();
      const targetHeight = target.getScaledHeight();
      const targetCenterX = (target.left ?? 0) + targetWidth / 2;
      const targetCenterY = (target.top ?? 0) + targetHeight / 2;
      const guideX: number[] = [canvas.getWidth() / 2];
      const guideY: number[] = [canvas.getHeight() / 2];

      canvas.getObjects().forEach((object) => {
        if (object === target) return;
        guideX.push(object.left ?? 0, (object.left ?? 0) + object.getScaledWidth() / 2, (object.left ?? 0) + object.getScaledWidth());
        guideY.push(object.top ?? 0, (object.top ?? 0) + object.getScaledHeight() / 2, (object.top ?? 0) + object.getScaledHeight());
      });

      const nearestX = guideX.find((value) => Math.abs(value - targetCenterX) <= threshold);
      const nearestY = guideY.find((value) => Math.abs(value - targetCenterY) <= threshold);
      if (nearestX !== undefined) nextLeft = nearestX - targetWidth / 2;
      if (nearestY !== undefined) nextTop = nearestY - targetHeight / 2;
      target.set({ left: nextLeft, top: nextTop });
      target.setCoords();

      const context = (canvas as any).contextTop as CanvasRenderingContext2D;
      context.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
      context.save();
      context.strokeStyle = '#2563eb';
      context.lineWidth = 1;
      context.setLineDash([5, 4]);
      if (nearestX !== undefined) {
        context.beginPath();
        context.moveTo(nearestX, 0);
        context.lineTo(nearestX, canvas.getHeight());
        context.stroke();
      }
      if (nearestY !== undefined) {
        context.beginPath();
        context.moveTo(0, nearestY);
        context.lineTo(canvas.getWidth(), nearestY);
        context.stroke();
      }
      context.restore();
    };

    const clearGuides = () => {
      const context = (canvas as any).contextTop as CanvasRenderingContext2D;
      context.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
    };

    canvas.on('selection:created', handleSelection as any);
    canvas.on('selection:updated', handleSelection as any);
    canvas.on('selection:cleared', handleClear);
    canvas.on('object:added', recordHistory);
    canvas.on('object:modified', recordHistory);
    canvas.on('object:removed', recordHistory);
    canvas.on('object:moving', handleMoving);
    canvas.on('mouse:up', clearGuides);

    history.current = [canvas.toJSON()];
    historyIndex.current = 0;
    updateHistoryState();
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
      history.current = [];
      historyIndex.current = -1;
    };
  }, [width, height]);

  const restoreHistory = useCallback(async (index: number) => {
    if (!fabricCanvas || !history.current[index]) return;
    restoringHistory.current = true;
    historyIndex.current = index;
    await fabricCanvas.loadFromJSON(history.current[index]);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setSelectedObject(null);
    setHistoryState({
      canUndo: historyIndex.current > 0,
      canRedo: historyIndex.current < history.current.length - 1,
    });
    restoringHistory.current = false;
  }, [fabricCanvas]);

  const undo = useCallback(() => restoreHistory(historyIndex.current - 1), [restoreHistory]);
  const redo = useCallback(() => restoreHistory(historyIndex.current + 1), [restoreHistory]);

  const toggleSnap = useCallback(() => {
    snapEnabledRef.current = !snapEnabledRef.current;
    setSnapEnabled(snapEnabledRef.current);
  }, []);

  const nudgeSelected = useCallback((deltaX: number, deltaY: number) => {
    if (!fabricCanvas || !selectedObject || selectedObject.selectable === false) return;
    selectedObject.set({ left: (selectedObject.left ?? 0) + deltaX, top: (selectedObject.top ?? 0) + deltaY });
    selectedObject.setCoords();
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const groupSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getActiveObjects();
    if (objects.length < 2) return;
    const group = new fabric.Group(objects);
    objects.forEach((object) => fabricCanvas.remove(object));
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const ungroupSelected = useCallback(() => {
    if (!fabricCanvas || selectedObject?.type !== 'group') return;
    const group = selectedObject as fabric.Group;
    const objects = group.getObjects();
    (group as fabric.Group & { toActiveSelection: () => void }).toActiveSelection();
    fabricCanvas.renderAll();
    setSelectedObject(fabricCanvas.getActiveObject() ?? null);
    void objects;
  }, [fabricCanvas, selectedObject]);

  const attachArrowControls = (arrow: fabric.Group) => {
    const target = arrow as fabric.Group & { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number; arrowKind: 'straight' | 'curved' };
    const pointPosition = (point: 'start' | 'end' | 'control') => (_dimensions: unknown, finalMatrix: number[], object: fabric.Object) => {
      const x = point === 'start' ? target.startX : point === 'end' ? target.endX : target.controlX ?? target.startX;
      const y = point === 'start' ? target.startY : point === 'end' ? target.endY : target.controlY ?? target.startY;
      const localPoint = (object as any).toLocalPoint(new fabric.Point(x, y), 'center', 'center');
      return fabric.util.transformPoint(localPoint, finalMatrix as fabric.TMat2D);
    };
    const pointAction = (point: 'start' | 'end' | 'control') => (...args: any[]) => {
      const eventData = args[2];
      const scenePoint = eventData.scenePoint ?? fabricCanvas?.getScenePoint(eventData.e);
      if (!scenePoint || !updateArrowPointRef.current) return false;
      updateArrowPointRef.current(point, scenePoint.x, scenePoint.y);
      return true;
    };
    target.controls.startPoint = new fabric.Control({ positionHandler: pointPosition('start'), actionHandler: pointAction('start'), cursorStyle: 'crosshair' });
    target.controls.endPoint = new fabric.Control({ positionHandler: pointPosition('end'), actionHandler: pointAction('end'), cursorStyle: 'crosshair' });
    if (target.arrowKind === 'curved') target.controls.controlPoint = new fabric.Control({ positionHandler: pointPosition('control'), actionHandler: pointAction('control'), cursorStyle: 'crosshair' });
  };

  const toggleFreehand = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !fabricCanvas.isDrawingMode;
    fabricCanvas.isDrawingMode = next;
    if (next) {
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = 4;
      fabricCanvas.freeDrawingBrush.color = '#235347';
    }
    setIsDrawingFreehand(next);
  }, [fabricCanvas]);

  const distributeSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = [...fabricCanvas.getActiveObjects()].sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
    if (objects.length < 3) return;
    const first = objects[0];
    const last = objects[objects.length - 1];
    const start = first.left ?? 0;
    const finish = last.left ?? 0;
    const gap = (finish - start) / (objects.length - 1);
    objects.forEach((object, index) => object.set({ left: start + gap * index }));
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: objects[0] });
  }, [fabricCanvas]);

  const alignMultiple = useCallback((axis: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getActiveObjects();
    if (objects.length < 2) return;
    const bounds = objects.reduce((current, object) => ({
      left: Math.min(current.left, object.left ?? 0),
      top: Math.min(current.top, object.top ?? 0),
      right: Math.max(current.right, (object.left ?? 0) + object.getScaledWidth()),
      bottom: Math.max(current.bottom, (object.top ?? 0) + object.getScaledHeight()),
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    objects.forEach((object) => {
      const objectWidth = object.getScaledWidth();
      const objectHeight = object.getScaledHeight();
      const left = axis === 'left' ? bounds.left : axis === 'right' ? bounds.right - objectWidth : axis === 'center' ? (bounds.left + bounds.right - objectWidth) / 2 : object.left ?? 0;
      const top = axis === 'top' ? bounds.top : axis === 'bottom' ? bounds.bottom - objectHeight : axis === 'middle' ? (bounds.top + bounds.bottom - objectHeight) / 2 : object.top ?? 0;
      object.set({ left, top });
      object.setCoords();
    });
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: objects[0] });
  }, [fabricCanvas]);

  const distributeMultiple = useCallback((axis: 'horizontal' | 'vertical') => {
    if (!fabricCanvas) return;
    const objects = [...fabricCanvas.getActiveObjects()].sort((a, b) => axis === 'horizontal' ? (a.left ?? 0) - (b.left ?? 0) : (a.top ?? 0) - (b.top ?? 0));
    if (objects.length < 3) return;
    const first = objects[0];
    const last = objects[objects.length - 1];
    const firstPosition = axis === 'horizontal' ? first.left ?? 0 : first.top ?? 0;
    const lastPosition = axis === 'horizontal' ? last.left ?? 0 : last.top ?? 0;
    const gap = (lastPosition - firstPosition) / (objects.length - 1);
    objects.forEach((object, index) => object.set(axis === 'horizontal' ? { left: firstPosition + gap * index } : { top: firstPosition + gap * index }));
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: objects[0] });
  }, [fabricCanvas]);

  const addFrame = useCallback((preset: 'mobile' | 'desktop' | 'card' | 'section') => {
    if (!fabricCanvas) return;
    const presets = {
      mobile: { width: 360, height: 640, fill: '#f8fafc', stroke: '#94a3b8' },
      desktop: { width: 760, height: 440, fill: '#f8fafc', stroke: '#64748b' },
      card: { width: 320, height: 220, fill: '#ffffff', stroke: '#cbd5e1' },
      section: { width: 480, height: 300, fill: '#eff6ff', stroke: '#60a5fa' },
    }[preset];
    const frame = new fabric.Rect({ left: width / 2 - presets.width / 2, top: height / 2 - presets.height / 2, ...presets, rx: 12, ry: 12, strokeWidth: 2, fill: presets.fill, stroke: presets.stroke });
    frame.set({ name: `${preset} frame`, framePreset: preset, excludeFromExport: false });
    fabricCanvas.add(frame);
    fabricCanvas.setActiveObject(frame);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const saveComponent = useCallback((name: string) => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getActiveObjects();
    if (!objects.length || !name.trim()) return;
    const component = {
      id: `${Date.now()}`,
      name: name.trim(),
      state: objects.map((object) => object.toObject()),
    };
    const current = JSON.parse(localStorage.getItem('infographic-editor:components') || '[]') as any[];
    localStorage.setItem('infographic-editor:components', JSON.stringify([component, ...current].slice(0, 24)));
  }, [fabricCanvas]);

  const insertComponent = useCallback(async (component: { state: any[] }) => {
    if (!fabricCanvas) return;
    const loaded = await Promise.all(component.state.map((state) => fabric.util.enlivenObjects([state])));
    const objects = loaded.flat() as fabric.Object[];
    objects.forEach((object) => object.set({ left: (object.left ?? 0) + 40, top: (object.top ?? 0) + 40 }));
    fabricCanvas.add(...objects);
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const applySelectedGradient = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: selectedObject.width ?? 100, y2: 0 },
      colorStops: [{ offset: 0, color: '#2563eb' }, { offset: 1, color: '#22c55e' }],
    });
    selectedObject.set({ fill: gradient });
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const togglePointEditing = useCallback(() => {
    if (!fabricCanvas || !selectedObject || !['polygon', 'polyline'].includes(selectedObject.type)) return;
    const target = selectedObject as fabric.Polygon;
    if (!isEditingPoints) {
      target.set({ selectable: true, hasControls: false });
      const points = target.points ?? [];
      points.forEach((point, index) => {
        target.controls[`point${index}`] = new fabric.Control({
          positionHandler: (_dimensions, finalMatrix) => fabric.util.transformPoint(new fabric.Point(point.x - (target.pathOffset?.x ?? 0), point.y - (target.pathOffset?.y ?? 0)), finalMatrix as fabric.TMat2D),
          actionHandler: (...args: any[]) => {
            const eventData = args[2];
            const scenePoint = eventData?.scenePoint ?? fabricCanvas.getScenePoint(eventData?.e);
            if (!scenePoint) return false;
            const localPoint = (target as fabric.Polygon & { toLocalPoint: (point: fabric.Point, originX?: string, originY?: string) => fabric.Point }).toLocalPoint(scenePoint, 'center', 'center');
            point.x = localPoint.x + (target.pathOffset?.x ?? 0);
            point.y = localPoint.y + (target.pathOffset?.y ?? 0);
            target.set({ dirty: true });
            target.setCoords();
            fabricCanvas.renderAll();
            return true;
          },
          cursorStyle: 'crosshair',
        });
      });
      setIsEditingPoints(true);
    } else {
      target.controls = fabric.Object.prototype.controls;
      target.set({ hasControls: true });
      setIsEditingPoints(false);
    }
    fabricCanvas.renderAll();
  }, [fabricCanvas, isEditingPoints, selectedObject]);

  const clipSelectedImageToShape = useCallback(async () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getActiveObjects();
    const image = objects.find((object) => object.type === 'image') as fabric.FabricImage | undefined;
    const shape = objects.find((object) => ['rect', 'circle', 'polygon', 'path'].includes(object.type) && object !== image);
    if (!image || !shape) return;
    const clipPath = shape.clone ? await shape.clone() : null;
    if (!clipPath) return;
    clipPath.set({ absolutePositioned: true, left: shape.left, top: shape.top, angle: shape.angle, scaleX: shape.scaleX, scaleY: shape.scaleY });
    image.set({ clipPath });
    fabricCanvas.remove(shape);
    fabricCanvas.setActiveObject(image);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: image });
  }, [fabricCanvas]);

  const animateSelectedEntrance = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    const targetTop = selectedObject.top ?? 0;
    selectedObject.set({ opacity: 0, top: targetTop + 24 });
    selectedObject.animate({ opacity: 1, top: targetTop }, {
      duration: 550,
      easing: fabric.util.ease.easeOutCubic,
      onChange: () => fabricCanvas.renderAll(),
    });
  }, [fabricCanvas, selectedObject]);

  // Helper functions to add elements
  const addText = useCallback(
    (textString: string, options: Partial<fabric.ITextProps> = {}) => {
      if (!fabricCanvas) return;
      const text = new fabric.IText(textString, {
        left: width / 2 - 50,
        top: height / 2 - 20,
        fontSize: 24,
        fill: '#051f20',
        ...options,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();
    },
    [fabricCanvas, width, height]
  );

  const addRectangle = useCallback(() => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: width / 2 - 50,
      top: height / 2 - 50,
      width: 100,
      height: 100,
      fill: '#235347',
      stroke: '#163832',
      strokeWidth: 2,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addRoundedRectangle = useCallback(() => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({ left: width / 2 - 65, top: height / 2 - 45, width: 130, height: 90, rx: 18, ry: 18, fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2 });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addPill = useCallback(() => {
    if (!fabricCanvas) return;
    const pill = new fabric.Rect({ left: width / 2 - 90, top: height / 2 - 26, width: 180, height: 52, rx: 26, ry: 26, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2 });
    fabricCanvas.add(pill);
    fabricCanvas.setActiveObject(pill);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addLine = useCallback(() => {
    if (!fabricCanvas) return;
    const line = new fabric.Line([width / 2 - 110, height / 2, width / 2 + 110, height / 2], { stroke: '#235347', strokeWidth: 6, strokeLineCap: 'round' });
    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addDonut = useCallback(() => {
    if (!fabricCanvas) return;
    const donut = new fabric.Circle({ left: width / 2 - 55, top: height / 2 - 55, radius: 55, fill: '', stroke: '#2563eb', strokeWidth: 24 });
    fabricCanvas.add(donut);
    fabricCanvas.setActiveObject(donut);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addCloud = useCallback(() => {
    if (!fabricCanvas) return;
    const cloud = new fabric.Path('M 24 74 C 4 74 0 48 18 40 C 14 16 48 4 65 22 C 82 0 120 12 118 40 C 142 38 150 72 126 80 L 24 80 Z', { left: width / 2 - 75, top: height / 2 - 45, fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 3 });
    fabricCanvas.add(cloud);
    fabricCanvas.setActiveObject(cloud);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addLightning = useCallback(() => {
    if (!fabricCanvas) return;
    const lightning = new fabric.Polygon([{ x: 64, y: 0 }, { x: 18, y: 58 }, { x: 52, y: 58 }, { x: 34, y: 112 }, { x: 100, y: 42 }, { x: 66, y: 42 }], { left: width / 2 - 50, top: height / 2 - 56, fill: '#fbbf24', stroke: '#d97706', strokeWidth: 3 });
    fabricCanvas.add(lightning);
    fabricCanvas.setActiveObject(lightning);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addSpeechBubble = useCallback(() => {
    if (!fabricCanvas) return;
    const bubble = new fabric.Path('M 16 12 Q 16 0 30 0 L 150 0 Q 164 0 164 14 L 164 82 Q 164 96 150 96 L 62 96 L 34 120 L 38 96 L 30 96 Q 16 96 16 82 Z', { left: width / 2 - 82, top: height / 2 - 60, fill: '#dcfce7', stroke: '#16a34a', strokeWidth: 3 });
    fabricCanvas.add(bubble);
    fabricCanvas.setActiveObject(bubble);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addImageFrame = useCallback((kind: 'rect' | 'rounded' | 'circle') => {
    if (!fabricCanvas) return;
    const frame = new fabric.Rect({ left: width / 2 - 100, top: height / 2 - 100, width: 200, height: 200, rx: kind === 'circle' ? 100 : kind === 'rounded' ? 24 : 0, ry: kind === 'circle' ? 100 : kind === 'rounded' ? 24 : 0, fill: '#e2e8f0', stroke: '#2563eb', strokeWidth: 3, strokeDashArray: [8, 6] });
    frame.set({ frameKind: kind, name: `${kind} image frame` });
    fabricCanvas.add(frame);
    fabricCanvas.setActiveObject(frame);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const createChart = useCallback((kind: ChartKind, data: ChartDatum[]) => {
    if (!fabricCanvas) return;
    const chart = new fabric.Group([], {
      left: width / 2 - 150,
      top: height / 2 - 100,
      name: `${kind} chart`,
      chartKind: kind,
      chartData: data,
    } as any);
    const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    if (kind === 'bar') {
      chart.add(new fabric.Line([0, 190, 300, 190], { stroke: '#64748b', strokeWidth: 2 }));
      data.forEach((item, index) => {
        const barHeight = Math.max(4, Math.min(170, item.value * 1.6));
        const x = 22 + index * 70;
        chart.add(new fabric.Rect({ left: x, top: 190 - barHeight, width: 40, height: barHeight, fill: colors[index % colors.length], rx: 6, ry: 6 }), new fabric.IText(item.label, { left: x, top: 198, fontSize: 12, fill: '#475569' }));
      });
    } else if (kind === 'line') {
      const points = data.map((item, index) => ({ x: index * 70, y: 170 - Math.min(130, Math.max(0, item.value * 1.3)) }));
      chart.add(new fabric.Polyline(points, { left: 0, top: 0, fill: '', stroke: '#2563eb', strokeWidth: 5, strokeLineJoin: 'round', strokeLineCap: 'round' }));
      points.forEach((point, index) => chart.add(new fabric.Circle({ left: point.x - 6, top: point.y - 6, radius: 6, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 3 }), new fabric.IText(data[index].label, { left: point.x - 10, top: point.y + 12, fontSize: 12, fill: '#475569' })));
    } else if (kind === 'pie') {
      const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1;
      let startAngle = 0;
      data.forEach((item, index) => {
        const endAngle = startAngle + (Math.max(0, item.value) / total) * Math.PI * 2;
        chart.add(new fabric.Circle({ left: 0, top: 0, radius: 90, startAngle, endAngle, fill: colors[index % colors.length], stroke: '#ffffff', strokeWidth: 3 }));
        startAngle = endAngle;
      });
    } else {
      const value = Math.max(0, Math.min(100, data[0]?.value ?? 0));
      chart.add(new fabric.Rect({ left: 0, top: 0, width: 260, height: 24, rx: 12, ry: 12, fill: '#e2e8f0' }), new fabric.Rect({ left: 0, top: 0, width: value * 2.6, height: 24, rx: 12, ry: 12, fill: '#2563eb' }), new fabric.IText(`${value}% complete`, { left: 90, top: 38, fontSize: 18, fill: '#334155' }));
    }
    fabricCanvas.add(chart);
    fabricCanvas.setActiveObject(chart);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addBarChart = useCallback(() => createChart('bar', [{ label: 'Q1', value: 42 }, { label: 'Q2', value: 76 }, { label: 'Q3', value: 58 }, { label: 'Q4', value: 92 }]), [createChart]);
  const addLineChart = useCallback(() => createChart('line', [{ label: 'Jan', value: 30 }, { label: 'Feb', value: 62 }, { label: 'Mar', value: 45 }, { label: 'Apr', value: 88 }, { label: 'May', value: 70 }]), [createChart]);
  const addPieChart = useCallback(() => createChart('pie', [{ label: 'A', value: 40 }, { label: 'B', value: 30 }, { label: 'C', value: 20 }, { label: 'D', value: 10 }]), [createChart]);
  const addProgressChart = useCallback(() => createChart('progress', [{ label: 'Progress', value: 73 }]), [createChart]);

  const updateSelectedChart = useCallback((data: ChartDatum[]) => {
    if (!fabricCanvas || !selectedObject || !(selectedObject as any).chartKind) return;
    const kind = (selectedObject as any).chartKind as ChartKind;
    const left = selectedObject.left ?? 0;
    const top = selectedObject.top ?? 0;
    const angle = selectedObject.angle ?? 0;
    const scaleX = selectedObject.scaleX ?? 1;
    const scaleY = selectedObject.scaleY ?? 1;
    fabricCanvas.remove(selectedObject);
    const replacementCanvas = fabricCanvas;
    const chart = new fabric.Group([], { left, top, angle, scaleX, scaleY, name: `${kind} chart`, chartKind: kind, chartData: data } as any);
    const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    if (kind === 'bar') {
      chart.add(new fabric.Line([0, 190, 300, 190], { stroke: '#64748b', strokeWidth: 2 }));
      data.forEach((item, index) => { const barHeight = Math.max(4, Math.min(170, item.value * 1.6)); const x = 22 + index * 70; chart.add(new fabric.Rect({ left: x, top: 190 - barHeight, width: 40, height: barHeight, fill: colors[index % colors.length], rx: 6, ry: 6 }), new fabric.IText(item.label, { left: x, top: 198, fontSize: 12, fill: '#475569' })); });
    } else if (kind === 'line') {
      const points = data.map((item, index) => ({ x: index * 70, y: 170 - Math.min(130, Math.max(0, item.value * 1.3)) }));
      chart.add(new fabric.Polyline(points, { left: 0, top: 0, fill: '', stroke: '#2563eb', strokeWidth: 5, strokeLineJoin: 'round', strokeLineCap: 'round' }));
      points.forEach((point, index) => chart.add(new fabric.Circle({ left: point.x - 6, top: point.y - 6, radius: 6, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 3 }), new fabric.IText(data[index].label, { left: point.x - 10, top: point.y + 12, fontSize: 12, fill: '#475569' })));
    } else if (kind === 'pie') {
      const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1; let startAngle = 0;
      data.forEach((item, index) => { const endAngle = startAngle + (Math.max(0, item.value) / total) * Math.PI * 2; chart.add(new fabric.Circle({ left: 0, top: 0, radius: 90, startAngle, endAngle, fill: colors[index % colors.length], stroke: '#ffffff', strokeWidth: 3 })); startAngle = endAngle; });
    } else { const value = Math.max(0, Math.min(100, data[0]?.value ?? 0)); chart.add(new fabric.Rect({ left: 0, top: 0, width: 260, height: 24, rx: 12, ry: 12, fill: '#e2e8f0' }), new fabric.Rect({ left: 0, top: 0, width: value * 2.6, height: 24, rx: 12, ry: 12, fill: '#2563eb' }), new fabric.IText(`${value}% complete`, { left: 90, top: 38, fontSize: 18, fill: '#334155' })); }
    replacementCanvas.add(chart);
    replacementCanvas.setActiveObject(chart);
    replacementCanvas.renderAll();
    replacementCanvas.fire('object:modified', { target: chart });
  }, [fabricCanvas, selectedObject]);

  const addCircle = useCallback(() => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      left: width / 2 - 50,
      top: height / 2 - 50,
      radius: 50,
      fill: '#8eb69b',
      stroke: '#235347',
      strokeWidth: 2,
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addTriangle = useCallback(() => {
    if (!fabricCanvas) return;
    const triangle = new fabric.Triangle({
      left: width / 2 - 50,
      top: height / 2 - 50,
      width: 100,
      height: 100,
      fill: '#daf1de',
      stroke: '#235347',
      strokeWidth: 2,
    });
    fabricCanvas.add(triangle);
    fabricCanvas.setActiveObject(triangle);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const addPolygonShape = useCallback(
    (points: Array<{ x: number; y: number }>, fill: string) => {
      if (!fabricCanvas) return;
      const shape = new fabric.Polygon(points, {
        left: width / 2 - 50,
        top: height / 2 - 50,
        fill,
        stroke: '#235347',
        strokeWidth: 2,
      });
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
    },
    [fabricCanvas, width, height]
  );

  const addDiamond = useCallback(() => addPolygonShape([
    { x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 },
  ], '#8eb69b'), [addPolygonShape]);

  const addHexagon = useCallback(() => addPolygonShape([
    { x: 25, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 },
  ], '#235347'), [addPolygonShape]);

  const addStar = useCallback(() => {
    const points = Array.from({ length: 10 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const radius = index % 2 === 0 ? 52 : 24;
      return { x: 52 + Math.cos(angle) * radius, y: 52 + Math.sin(angle) * radius };
    });
    addPolygonShape(points, '#daf1de');
  }, [addPolygonShape]);

  const addBurst = useCallback(() => {
    const points = Array.from({ length: 16 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 8;
      const radius = index % 2 === 0 ? 54 : 38;
      return { x: 54 + Math.cos(angle) * radius, y: 54 + Math.sin(angle) * radius };
    });
    addPolygonShape(points, '#163832');
  }, [addPolygonShape]);

  const addHeart = useCallback(() => {
    if (!fabricCanvas) return;
    const heart = new fabric.Path('M 50 90 C 12 62 4 38 20 22 C 32 10 47 17 50 30 C 53 17 68 10 80 22 C 96 38 88 62 50 90 Z', {
      left: width / 2 - 50,
      top: height / 2 - 50,
      fill: '#235347',
      stroke: '#163832',
      strokeWidth: 2,
    });
    fabricCanvas.add(heart);
    fabricCanvas.setActiveObject(heart);
    fabricCanvas.renderAll();
  }, [fabricCanvas, width, height]);

  const createArrow = useCallback((kind: 'straight' | 'curved', points: { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number }, headType: 'classic' | 'chevron' | 'double' = 'classic') => {
    if (!fabricCanvas) return null;
    const stroke = '#235347';
    const tangentX = points.endX - (kind === 'curved' ? points.controlX ?? points.startX : points.startX);
    const tangentY = points.endY - (kind === 'curved' ? points.controlY ?? points.startY : points.startY);
    const path = kind === 'curved'
      ? new fabric.Path(`M ${points.startX} ${points.startY} Q ${points.controlX} ${points.controlY} ${points.endX} ${points.endY}`, { fill: '', stroke, strokeWidth: 6 })
      : new fabric.Line([points.startX, points.startY, points.endX, points.endY], { stroke, strokeWidth: 6 });
    const head = headType === 'chevron'
      ? new fabric.Polyline([{ x: points.endX - 20, y: points.endY - 16 }, { x: points.endX, y: points.endY }, { x: points.endX - 20, y: points.endY + 16 }], { fill: '', stroke, strokeWidth: 6, strokeLineCap: 'round', strokeLineJoin: 'round' })
      : new fabric.Triangle({
      left: points.endX - 18,
      top: points.endY - 18,
      width: 36,
      height: 36,
      fill: stroke,
      angle: Math.atan2(tangentY, tangentX) * 180 / Math.PI + 90,
    });
    const objects: fabric.Object[] = [path, head];
    if (headType === 'double') {
      objects.push(new fabric.Triangle({ left: points.startX - 18, top: points.startY - 18, width: 36, height: 36, fill: stroke, angle: Math.atan2(tangentY, tangentX) * 180 / Math.PI - 90 }));
    }
    const arrow = new fabric.Group(objects, { left: 0, top: 0 });
    arrow.set({ arrowKind: kind, arrowHead: headType, ...points });
    attachArrowControls(arrow);
    return arrow;
  }, [fabricCanvas]);

  const addArrow = useCallback((headType: 'classic' | 'chevron' | 'double' = 'classic') => {
    if (!fabricCanvas) return;
    const arrow = createArrow('straight', { startX: 80, startY: height / 2, endX: width - 80, endY: height / 2 }, headType);
    if (!arrow) return;
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.renderAll();
  }, [createArrow, fabricCanvas, width, height]);

  const addCurvedArrow = useCallback(() => {
    if (!fabricCanvas) return;
    const arrow = createArrow('curved', { startX: 70, startY: height - 180, controlX: width / 2, controlY: 80, endX: width - 80, endY: height / 2 });
    if (!arrow) return;
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.renderAll();
  }, [createArrow, fabricCanvas, width, height]);

  const updateSelectedArrowPoint = useCallback((point: 'start' | 'end' | 'control', axis: 'x' | 'y' | 'both', value: number | { x: number; y: number }) => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== 'group' || !(selectedObject as any).arrowKind) return;
    const current = selectedObject as fabric.Group & { arrowKind: 'straight' | 'curved'; arrowHead?: 'classic' | 'chevron' | 'double'; startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number };
    const points = { startX: current.startX, startY: current.startY, endX: current.endX, endY: current.endY, controlX: current.controlX, controlY: current.controlY };
    if (axis === 'both' && typeof value !== 'number') {
      points[`${point}X` as keyof typeof points] = value.x;
      points[`${point}Y` as keyof typeof points] = value.y;
    } else {
      const property = `${point}${axis.toUpperCase()}` as keyof typeof points;
      points[property] = value as number;
    }
    const replacement = createArrow(current.arrowKind, points, current.arrowHead);
    if (!replacement) return;
    const index = fabricCanvas.getObjects().indexOf(selectedObject);
    fabricCanvas.remove(selectedObject);
    fabricCanvas.insertAt(index, replacement);
    fabricCanvas.setActiveObject(replacement);
    setSelectedObject(replacement);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: replacement });
  }, [createArrow, fabricCanvas, selectedObject]);

  updateArrowPointRef.current = (point, x, y) => updateSelectedArrowPoint(point, 'both', { x, y });

  const startConnector = useCallback(
    (mode: 'straight' | 'curved') => {
      if (!fabricCanvas) return;
      const points: Array<{ x: number; y: number }> = [];
      const canvas = fabricCanvas;
      const drawGuide = () => {
        const context = (canvas as any).contextTop as CanvasRenderingContext2D;
        context.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
        if (!points.length) return;
        context.save();
        context.setLineDash([6, 5]);
        context.strokeStyle = '#235347';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.stroke();
        context.setLineDash([]);
        points.forEach((point) => {
          context.beginPath();
          context.fillStyle = '#ffffff';
          context.strokeStyle = '#235347';
          context.arc(point.x, point.y, 5, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        });
        context.restore();
      };
      const cleanup = () => {
        canvas.off('mouse:down', handleClick as any);
        canvas.off('mouse:dblclick', finish as any);
        canvas.off('after:render', drawGuide as any);
        (canvas as any).contextTop?.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
        canvas.selection = true;
        setIsDrawingConnector(false);
        canvas.requestRenderAll();
      };
      const getPoint = (event: any) => canvas.getScenePoint(event.e);
      const handleClick = (event: any) => {
        if (event.e.detail > 1) return;
        points.push(getPoint(event));
        drawGuide();
      };
      const finish = (event: any) => {
        const lastPoint = getPoint(event);
        if (!points.length || Math.hypot(lastPoint.x - points[points.length - 1].x, lastPoint.y - points[points.length - 1].y) > 4) {
          points.push(lastPoint);
        }
        if (points.length < 2) return;
        const first = points[0];
        const last = points[points.length - 1];
        const previous = points[points.length - 2];
        const pathData = mode === 'curved'
          ? points.length === 2
            ? `M ${first.x} ${first.y} L ${last.x} ${last.y}`
            : `M ${first.x} ${first.y} ${points.slice(1, -1).map((point, index) => `Q ${point.x} ${point.y} ${points[index + 2].x} ${points[index + 2].y}`).join(' ')}`
          : undefined;
        const connector = pathData
          ? new fabric.Path(pathData, { fill: '', stroke: '#235347', strokeWidth: 5 })
          : new fabric.Polyline(points, { fill: '', stroke: '#235347', strokeWidth: 5 });
        const arrowHead = new fabric.Triangle({
          left: last.x - 14,
          top: last.y - 14,
          width: 28,
          height: 28,
          fill: '#235347',
          angle: Math.atan2(last.y - previous.y, last.x - previous.x) * 180 / Math.PI + 90,
        });
        const group = new fabric.Group([connector, arrowHead], { left: 0, top: 0 });
        cleanup();
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
      };
      canvas.selection = false;
      setIsDrawingConnector(true);
      canvas.on('mouse:down', handleClick as any);
      canvas.on('mouse:dblclick', finish as any);
      canvas.on('after:render', drawGuide as any);
      canvas.requestRenderAll();
    },
    [fabricCanvas]
  );

  const updateSelected = useCallback(
    (properties: Partial<fabric.Object>) => {
      if (!fabricCanvas || !selectedObject) return;
      selectedObject.set(properties);
      fabricCanvas.renderAll();
      fabricCanvas.fire('object:modified', { target: selectedObject });
    },
    [fabricCanvas, selectedObject]
  );

  const updateBackgroundColor = useCallback(
    (color: string) => {
      if (!fabricCanvas) return;
      fabricCanvas.backgroundColor = color;
      setBackgroundColor(color);
      fabricCanvas.renderAll();
      fabricCanvas.fire('object:modified');
    },
    [fabricCanvas]
  );

  const resizeCanvas = useCallback(
    (nextWidth: number, nextHeight: number, mode: 'scale' | 'recenter' | 'keep') => {
      if (!fabricCanvas || nextWidth < 160 || nextHeight < 160) return;
      const oldWidth = fabricCanvas.getWidth();
      const oldHeight = fabricCanvas.getHeight();
      if (mode === 'scale') {
        const scale = Math.min(nextWidth / oldWidth, nextHeight / oldHeight);
        fabricCanvas.getObjects().forEach((object) => {
          object.scale(object.scaleX * scale);
          object.set({ left: (object.left ?? 0) * scale, top: (object.top ?? 0) * scale });
          object.setCoords();
        });
      } else if (mode === 'recenter') {
        const offsetX = (nextWidth - oldWidth) / 2;
        const offsetY = (nextHeight - oldHeight) / 2;
        fabricCanvas.getObjects().forEach((object) => {
          object.set({ left: (object.left ?? 0) + offsetX, top: (object.top ?? 0) + offsetY });
          object.setCoords();
        });
      }
      fabricCanvas.setDimensions({ width: nextWidth, height: nextHeight });
      fabricCanvas.renderAll();
      setCanvasSize({ width: nextWidth, height: nextHeight });
      fabricCanvas.fire('object:modified');
    },
    [fabricCanvas]
  );

  const setCanvasZoom = useCallback((nextZoom: number) => {
    if (!fabricCanvas) return;
    const safeZoom = Math.min(2, Math.max(0.25, nextZoom));
    fabricCanvas.setZoom(safeZoom);
    setZoom(safeZoom);
  }, [fabricCanvas]);

  const fitCanvasToViewport = useCallback((viewportWidth: number, viewportHeight: number) => {
    if (!fabricCanvas) return;
    const nextZoom = Math.min((viewportWidth - 80) / fabricCanvas.getWidth(), (viewportHeight - 80) / fabricCanvas.getHeight(), 1);
    setCanvasZoom(nextZoom);
  }, [fabricCanvas, setCanvasZoom]);

  const toggleSelectedVisibility = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.set({ visible: selectedObject.visible === false });
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
    refreshSelection((value) => value + 1);
  }, [fabricCanvas, selectedObject]);

  const moveSelectedLayer = useCallback((direction: 'forward' | 'back') => {
    if (!fabricCanvas || !selectedObject) return;
    if (direction === 'forward') fabricCanvas.bringObjectForward(selectedObject);
    else fabricCanvas.sendObjectBackwards(selectedObject);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const setSelectedLayerOrder = useCallback((direction: 'front' | 'back') => {
    if (!fabricCanvas || !selectedObject) return;
    if (direction === 'front') fabricCanvas.bringObjectToFront(selectedObject);
    else fabricCanvas.sendObjectToBack(selectedObject);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const renameSelected = useCallback((name: string) => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.set('name', name.trim() || selectedObject.type);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
    refreshSelection((value) => value + 1);
  }, [fabricCanvas, selectedObject]);

  const applyTemplate = useCallback((template: 'process' | 'comparison' | 'quote' | 'timeline' | 'funnel' | 'cycle' | 'stats' | 'org') => {
    if (!fabricCanvas) return;
    const centerX = fabricCanvas.getWidth() / 2;
    const centerY = fabricCanvas.getHeight() / 2;
    if (template === 'process') {
      ['Discover', 'Design', 'Deliver'].forEach((label, index) => {
        fabricCanvas.add(
          new fabric.Circle({ left: 90 + index * 180, top: centerY - 45, radius: 45, fill: '#8eb69b', stroke: '#235347', strokeWidth: 2 }),
          new fabric.IText(label, { left: 65 + index * 180, top: centerY + 65, fontSize: 20, fontFamily: 'DM Sans', fill: '#051f20' })
        );
      });
    } else if (template === 'comparison') {
      fabricCanvas.add(
        new fabric.Rect({ left: centerX - 230, top: centerY - 130, width: 190, height: 260, rx: 18, ry: 18, fill: '#daf1de', stroke: '#235347', strokeWidth: 2 }),
        new fabric.Rect({ left: centerX + 40, top: centerY - 130, width: 190, height: 260, rx: 18, ry: 18, fill: '#235347', stroke: '#051f20', strokeWidth: 2 }),
        new fabric.IText('Before', { left: centerX - 180, top: centerY - 30, fontSize: 28, fill: '#051f20' }),
        new fabric.IText('After', { left: centerX + 90, top: centerY - 30, fontSize: 28, fill: '#daf1de' })
      );
    } else if (template === 'quote') {
      fabricCanvas.add(new fabric.IText('Your message here', { left: centerX - 150, top: centerY - 35, fontSize: 38, fontFamily: 'Playfair Display', fill: '#051f20' }));
    } else if (template === 'timeline') {
      fabricCanvas.add(new fabric.Line([70, centerY, fabricCanvas.getWidth() - 70, centerY], { stroke: '#2563eb', strokeWidth: 5 }));
      ['Launch', 'Growth', 'Today'].forEach((label, index) => {
        const x = 90 + index * 210;
        fabricCanvas.add(new fabric.Circle({ left: x - 13, top: centerY - 13, radius: 13, fill: '#2563eb' }), new fabric.IText(label, { left: x - 32, top: centerY + 28, fontSize: 18, fill: '#172554' }));
      });
    } else if (template === 'funnel') {
      [230, 180, 130, 80].forEach((funnelWidth, index) => {
        fabricCanvas.add(new fabric.Polygon([{ x: 0, y: 0 }, { x: funnelWidth, y: 0 }, { x: funnelWidth - 22, y: 90 }, { x: 22, y: 90 }], { left: centerX - funnelWidth / 2, top: 110 + index * 105, fill: ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb'][index], stroke: '#1d4ed8', strokeWidth: 2 }));
      });
    } else if (template === 'cycle') {
      ['Plan', 'Build', 'Measure', 'Improve'].forEach((label, index) => {
        const angle = index * Math.PI / 2 - Math.PI / 4;
        const x = centerX + Math.cos(angle) * 150 - 45;
        const y = centerY + Math.sin(angle) * 150 - 45;
        fabricCanvas.add(new fabric.Circle({ left: x, top: y, radius: 45, fill: '#dcfce7', stroke: '#16a34a', strokeWidth: 2 }), new fabric.IText(label, { left: x + 8, top: y + 38, fontSize: 16, fill: '#14532d' }));
      });
    } else if (template === 'stats') {
      fabricCanvas.add(new fabric.IText('68%', { left: centerX - 70, top: centerY - 60, fontSize: 76, fontWeight: 'bold', fill: '#1d4ed8' }), new fabric.IText('users reached this month', { left: centerX - 110, top: centerY + 30, fontSize: 20, fill: '#475569' }));
    } else {
      fabricCanvas.add(new fabric.Rect({ left: centerX - 60, top: 120, width: 120, height: 70, rx: 16, ry: 16, fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2 }), new fabric.IText('Leader', { left: centerX - 30, top: 145, fontSize: 18, fill: '#1e3a8a' }), new fabric.Line([centerX, 190, centerX, 280], { stroke: '#2563eb', strokeWidth: 3 }), new fabric.Rect({ left: centerX - 190, top: 280, width: 120, height: 70, rx: 16, ry: 16, fill: '#dcfce7', stroke: '#16a34a', strokeWidth: 2 }), new fabric.IText('Team A', { left: centerX - 165, top: 305, fontSize: 18, fill: '#14532d' }), new fabric.Rect({ left: centerX + 70, top: 280, width: 120, height: 70, rx: 16, ry: 16, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2 }), new fabric.IText('Team B', { left: centerX + 95, top: 305, fontSize: 18, fill: '#78350f' }));
    }
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const updateSelectedStroke = useCallback((stroke: string, strokeWidth: number, dash: number[]) => {
    if (!fabricCanvas || !selectedObject) return;
    const target = selectedObject as fabric.Group;
    if (target.type === 'group') {
      target.getObjects().forEach((child) => child.set({ stroke, strokeWidth, strokeDashArray: dash, fill: child.type === 'triangle' ? stroke : child.fill }));
    } else {
      target.set({ stroke, strokeWidth, strokeDashArray: dash });
    }
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const editSelectedText = useCallback(() => {
    if (!fabricCanvas || !selectedObject || !('enterEditing' in selectedObject)) return;
    const textObject = selectedObject as fabric.IText;
    fabricCanvas.setActiveObject(textObject);
    textObject.enterEditing();
    textObject.selectAll();
    fabricCanvas.renderAll();
  }, [fabricCanvas, selectedObject]);

  const duplicateSelected = useCallback(async () => {
    if (!fabricCanvas || !selectedObject) return;
    const clone = await selectedObject.clone();
    clone.set({ left: (selectedObject.left ?? 0) + 24, top: (selectedObject.top ?? 0) + 24 });
    fabricCanvas.add(clone);
    fabricCanvas.setActiveObject(clone);
    fabricCanvas.renderAll();
  }, [fabricCanvas, selectedObject]);

  const alignSelected = useCallback((axis: 'horizontal' | 'vertical') => {
    if (!fabricCanvas || !selectedObject) return;
    if (axis === 'horizontal') {
      selectedObject.set({ left: (fabricCanvas.getWidth() - selectedObject.getScaledWidth()) / 2 });
    } else {
      selectedObject.set({ top: (fabricCanvas.getHeight() - selectedObject.getScaledHeight()) / 2 });
    }
    selectedObject.setCoords();
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
  }, [fabricCanvas, selectedObject]);

  const toggleSelectedLock = useCallback(() => {
    if (!fabricCanvas || !selectedObject) return;
    const locked = selectedObject.selectable === false;
    selectedObject.set({ selectable: locked, evented: locked });
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
    refreshSelection((value) => value + 1);
  }, [fabricCanvas, selectedObject]);

  const makeSelectedReference = useCallback(() => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;
    selectedObject.set({ opacity: 0.35, selectable: false, evented: false });
    fabricCanvas.sendObjectToBack(selectedObject);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: selectedObject });
    setSelectedObject(null);
  }, [fabricCanvas, selectedObject]);

  const analyzeSelectedImage = useCallback(async () => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;
    const image = selectedObject as fabric.FabricImage;
    setOcrStatus('Preparing OCR...');
    try {
      fabricCanvas.getObjects().filter((object) => (object as any).ocrGenerated).forEach((object) => fabricCanvas.remove(object));
      const element = image.getElement() as HTMLImageElement;
      const lines = await recognizeTextLines(element, setOcrStatus);
      const sourceWidth = element.naturalWidth || image.width || 1;
      const sourceHeight = element.naturalHeight || image.height || 1;
      const scaleX = image.getScaledWidth() / sourceWidth;
      const scaleY = image.getScaledHeight() / sourceHeight;
      const leftOffset = image.left ?? 0;
      const topOffset = image.top ?? 0;

      lines.forEach((line) => {
        const text = new fabric.IText(line.text, {
          left: leftOffset + line.x * scaleX,
          top: topOffset + line.y * scaleY,
          fontSize: Math.max(10, line.height * scaleY),
          fill: line.confidence < 60 ? '#92400e' : '#111827',
          backgroundColor: line.confidence < 60 ? 'rgba(254, 243, 199, 0.9)' : 'rgba(255, 255, 255, 0.72)',
          padding: 2,
        });
        text.set('ocrGenerated', true);
        fabricCanvas.add(text);
      });
      fabricCanvas.renderAll();
      setOcrStatus(lines.length ? `${lines.length} editable text lines added; yellow lines need review` : 'No readable text found');
    } catch (error) {
      console.error('OCR failed', error);
      setOcrStatus('OCR failed. Try a larger, clearer image.');
    }
  }, [fabricCanvas, selectedObject]);

  const applyImageFilter = useCallback(
    (filterName: string) => {
      if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;
      const image = selectedObject as fabric.FabricImage;
      const filters: Record<string, any[]> = {
        none: [],
        grayscale: [new fabric.filters.Grayscale()],
        sepia: [new fabric.filters.Sepia()],
        vintage: [new fabric.filters.Sepia(), new fabric.filters.Contrast({ contrast: 0.15 })],
        bright: [new fabric.filters.Brightness({ brightness: 0.15 })],
        contrast: [new fabric.filters.Contrast({ contrast: 0.25 })],
      };
      image.filters = filters[filterName] ?? [];
      image.applyFilters();
      fabricCanvas.renderAll();
      fabricCanvas.fire('object:modified', { target: image });
    },
    [fabricCanvas, selectedObject]
  );

  const setImageMask = useCallback(
    (mask: 'none' | 'circle' | 'rounded') => {
      if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;
      const image = selectedObject as fabric.FabricImage;
      if (mask === 'none') {
        image.set({ clipPath: undefined });
      } else {
        const radius = Math.min(image.getScaledWidth(), image.getScaledHeight()) / 2;
        const clipPath = mask === 'circle'
          ? new fabric.Circle({ radius, originX: 'center', originY: 'center' })
          : new fabric.Rect({
              width: image.getScaledWidth(),
              height: image.getScaledHeight(),
              rx: 28,
              ry: 28,
              originX: 'center',
              originY: 'center',
            });
        image.set({ clipPath });
      }
      fabricCanvas.renderAll();
      fabricCanvas.fire('object:modified', { target: image });
    },
    [fabricCanvas, selectedObject]
  );

  const cropImage = useCallback(
    (mode: 'square' | 'portrait' | 'landscape' | 'reset') => {
      if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;
      const image = selectedObject as fabric.FabricImage;
      const element = image.getElement() as HTMLImageElement;
      const sourceWidth = element.naturalWidth || image.width || 1;
      const sourceHeight = element.naturalHeight || image.height || 1;

      if (mode === 'reset') {
        image.set({ cropX: 0, cropY: 0, width: sourceWidth, height: sourceHeight });
      } else {
        const ratio = mode === 'square' ? 1 : mode === 'portrait' ? 4 / 5 : 16 / 9;
        let cropWidth = sourceWidth;
        let cropHeight = cropWidth / ratio;
        if (cropHeight > sourceHeight) {
          cropHeight = sourceHeight;
          cropWidth = cropHeight * ratio;
        }
        image.set({
          cropX: (sourceWidth - cropWidth) / 2,
          cropY: (sourceHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        });
      }
      image.setCoords();
      fabricCanvas.renderAll();
      fabricCanvas.fire('object:modified', { target: image });
    },
    [fabricCanvas, selectedObject]
  );

  const addImageFromUrl = useCallback(
    (url: string) => {
      if (!fabricCanvas) return;
      fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        const frame = selectedObject as (fabric.Rect & { frameKind?: 'rect' | 'rounded' | 'circle' }) | null;
        if (frame?.frameKind) {
          const frameWidth = frame.getScaledWidth();
          const frameHeight = frame.getScaledHeight();
          const scale = Math.max(frameWidth / (img.width || 1), frameHeight / (img.height || 1));
          img.scale(scale);
          img.set({ left: (frame.left ?? 0) + frameWidth / 2, top: (frame.top ?? 0) + frameHeight / 2, originX: 'center', originY: 'center' });
          const clipPath = frame.frameKind === 'circle'
            ? new fabric.Circle({ radius: Math.min(frameWidth, frameHeight) / (2 * scale), originX: 'center', originY: 'center' })
            : new fabric.Rect({ width: frameWidth / scale, height: frameHeight / scale, rx: frame.frameKind === 'rounded' ? 24 / scale : 0, ry: frame.frameKind === 'rounded' ? 24 / scale : 0, originX: 'center', originY: 'center' });
          img.set({ clipPath });
          fabricCanvas.remove(frame);
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
          return;
        }
        img.scaleToWidth(200);
        img.set({
          left: width / 2 - 100,
          top: height / 2 - 100,
        });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
      }).catch((error) => console.error('Unable to load image', error));
    },
    [fabricCanvas, selectedObject, width, height]
  );

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach((obj) => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setSelectedObject(null);
    }
  }, [fabricCanvas]);

  return {
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
    setSelectedLayerOrder,
    renameSelected,
    applyTemplate,
    updateSelectedStroke,
    updateSelectedArrowPoint,
    editSelectedText,
    duplicateSelected,
    alignSelected,
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
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
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
  };
};