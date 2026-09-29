'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as FabricNS from 'fabric';
import {
  CUSTOM_PROPS,
  addToCanvas,
  centerOn,
  coverBox,
  createPathShape,
  createPrimitive,
  createText,
  ensureId,
  fitInto,
  kindOf,
  layerName,
  loadImage,
  makeBackgroundGradient,
  meta,
  nextId,
  registerCustomProps,
  type FabricCanvas,
  type FabricModule,
  type FabricObj,
  type ShapeOptions,
  type TextOptions,
} from '../lib/engine';
import { History, snapshot } from '../lib/history';
import { loadFontsForScene } from '../lib/fonts';
import type { LayerNode, SelectionKind } from '../lib/types';
import { applyTemplate } from '../lib/engine';
import type { TemplateSpec } from '../lib/templates';

export type BackgroundSpec =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number };

export interface Guide {
  orientation: 'v' | 'h';
  /** Position in artboard coordinates. */
  at: number;
}

export type AlignMode = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';

interface Options {
  width: number;
  height: number;
  initialScene?: Record<string, unknown> | null;
  onDirtyChange?: (dirty: boolean) => void;
}

const SNAP_THRESHOLD = 6;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 5;

export const useDesignEditor = ({ width, height, initialScene, onDirtyChange }: Options) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const fabricRef = useRef<FabricModule | null>(null);
  const historyRef = useRef(new History());
  const clipboardRef = useRef<FabricObj | null>(null);
  const suppressRef = useRef(0);
  const backgroundRef = useRef<BackgroundSpec>({ type: 'solid', color: '#FFFCF5' });

  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [zoom, setZoomState] = useState(1);
  const [artboard, setArtboard] = useState({ width, height });
  const [selectionKind, setSelectionKind] = useState<SelectionKind>('none');
  const [selectionCount, setSelectionCount] = useState(0);
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [dirty, setDirty] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const markDirty = useCallback(
    (value: boolean) => {
      setDirty((prev) => {
        if (prev === value) return prev;
        onDirtyChange?.(value);
        return value;
      });
    },
    [onDirtyChange],
  );

  /** Run a mutation without its fabric events reaching the history stack. */
  const silently = useCallback(async (task: () => void | Promise<void>) => {
    suppressRef.current += 1;
    try {
      await task();
    } finally {
      suppressRef.current -= 1;
    }
  }, []);

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = new Set(canvas.getActiveObjects());
    // Top of the panel should be the top of the stack, so the list is the
    // reverse of fabric's back-to-front object order.
    const nodes: LayerNode[] = canvas
      .getObjects()
      .map((obj) => {
        const id = ensureId(obj);
        return {
          id,
          name: layerName(obj),
          kind: kindOf(obj),
          locked: !!meta(obj).dsLocked,
          visible: obj.visible !== false,
          selected: active.has(obj),
        };
      })
      .reverse();
    setLayers(nodes);
  }, []);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  const commit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || suppressRef.current > 0) return;
    historyRef.current.record(snapshot(canvas));
    syncHistoryFlags();
    markDirty(true);
    refreshLayers();
    bump();
  }, [bump, markDirty, refreshLayers, syncHistoryFlags]);

  // ------------------------------------------------------------- viewport

  const applyViewport = useCallback((nextZoom: number, size: { width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: size.width * nextZoom, height: size.height * nextZoom });
    canvas.setZoom(nextZoom);
    canvas.requestRenderAll();
  }, []);

  const setZoom = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      setZoomState(clamped);
      applyViewport(clamped, artboard);
    },
    [applyViewport, artboard],
  );

  const zoomToFit = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    // The padding keeps the artboard clear of the scroll gutters.
    const available = {
      w: host.clientWidth - 72,
      h: host.clientHeight - 72,
    };
    if (available.w <= 0 || available.h <= 0) return;
    const next = Math.min(available.w / artboard.width, available.h / artboard.height, 1.5);
    setZoom(Math.max(MIN_ZOOM, next));
  }, [artboard.height, artboard.width, setZoom]);

  const zoomIn = useCallback(() => setZoom(zoom * 1.2), [setZoom, zoom]);
  const zoomOut = useCallback(() => setZoom(zoom / 1.2), [setZoom, zoom]);

  // ----------------------------------------------------------- background

  const applyBackground = useCallback((spec: BackgroundSpec, size = artboard) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    backgroundRef.current = spec;
    canvas.backgroundColor =
      spec.type === 'solid'
        ? spec.color
        : makeBackgroundGradient(fabric, spec.from, spec.to, spec.angle, size.width, size.height);
    canvas.requestRenderAll();
  }, [artboard]);

  const setBackground = useCallback(
    (spec: BackgroundSpec) => {
      applyBackground(spec);
      commit();
    },
    [applyBackground, commit],
  );

  const setArtboardSize = useCallback(
    (nextWidth: number, nextHeight: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const size = {
        width: Math.max(16, Math.round(nextWidth)),
        height: Math.max(16, Math.round(nextHeight)),
      };
      setArtboard(size);
      applyViewport(zoom, size);
      // A pixel-space background gradient has to be re-projected onto the new
      // artboard or it keeps the old canvas's corner-to-corner geometry.
      if (backgroundRef.current.type === 'gradient') {
        applyBackground(backgroundRef.current, size);
      }
      commit();
    },
    [applyBackground, applyViewport, commit, zoom],
  );

  // ------------------------------------------------------------ selection

  const activeObject = useCallback((): FabricObj | null => {
    return canvasRef.current?.getActiveObject() ?? null;
  }, []);

  const activeObjects = useCallback((): FabricObj[] => {
    return canvasRef.current?.getActiveObjects() ?? [];
  }, []);

  const syncSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    setSelectionCount(objs.length);
    setSelectionKind(objs.length > 1 ? 'multiple' : kindOf(objs[0] ?? null));
    refreshLayers();
    bump();
  }, [bump, refreshLayers]);

  /** Apply a patch to every selected object; caller decides when to commit. */
  const update = useCallback(
    (patch: Record<string, unknown>, opts: { commit?: boolean } = {}) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objs = canvas.getActiveObjects();
      if (!objs.length) return;
      objs.forEach((obj) => {
        obj.set(patch);
        obj.setCoords();
      });
      canvas.requestRenderAll();
      if (opts.commit) commit();
      else bump();
    },
    [bump, commit],
  );

  // -------------------------------------------------------------- objects

  const addText = useCallback(
    (options: TextOptions = {}) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      const textbox = createText(fabric, canvas, options);
      addToCanvas(canvas, textbox);
      commit();
    },
    [commit],
  );

  const addPrimitive = useCallback(
    (kind: string, options: ShapeOptions = {}) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      addToCanvas(canvas, createPrimitive(fabric, canvas, kind, options));
      commit();
    },
    [commit],
  );

  const addPath = useCallback(
    (pathData: string, options: { strokeOnly?: boolean; color?: string } = {}) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      addToCanvas(canvas, createPathShape(fabric, canvas, pathData, options));
      commit();
    },
    [commit],
  );

  /**
   * Drop an image onto the board — or, when a template's image slot is
   * selected, fill that slot: the image is scaled to cover the slot, clipped
   * to its rounded rect, and takes its place in the stack.
   */
  const addImage = useCallback(
    async (url: string) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;

      const image = await loadImage(fabric, url);
      const active = canvas.getActiveObject();
      const slot = active && meta(active).dsSlot ? active : null;

      if (slot) {
        const boxW = slot.getScaledWidth();
        const boxH = slot.getScaledHeight();
        const cx = (slot.left ?? 0) + boxW / 2;
        const cy = (slot.top ?? 0) + boxH / 2;

        coverBox(image, boxW, boxH);
        centerOn(image, cx, cy);

        const rx = (slot as FabricNS.Rect).rx ?? 0;
        const clip = new fabric.Rect({
          width: boxW / (image.scaleX || 1),
          height: boxH / (image.scaleY || 1),
          rx: rx / (image.scaleX || 1),
          ry: rx / (image.scaleY || 1),
          originX: 'center',
          originY: 'center',
        });
        image.set({ clipPath: clip });
        meta(image).dsName = meta(slot).dsName || 'Image';

        const index = canvas.getObjects().indexOf(slot);
        canvas.remove(slot);
        canvas.insertAt(index, image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
      } else {
        const boxW = canvas.getWidth() * 0.6;
        const boxH = canvas.getHeight() * 0.6;
        fitInto(image, boxW, boxH);
        addToCanvas(canvas, image);
      }
      commit();
    },
    [commit],
  );

  const setBackgroundImage = useCallback(
    async (url: string) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      const image = await loadImage(fabric, url);
      coverBox(image, canvas.getWidth() / zoom, canvas.getHeight() / zoom);
      image.set({
        left: artboard.width / 2 - image.getScaledWidth() / 2,
        top: artboard.height / 2 - image.getScaledHeight() / 2,
        selectable: false,
        evented: false,
      });
      canvas.backgroundImage = image;
      canvas.requestRenderAll();
      commit();
    },
    [artboard.height, artboard.width, commit, zoom],
  );

  const clearBackgroundImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundImage = undefined;
    canvas.requestRenderAll();
    commit();
  }, [commit]);

  const removeSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (!objs.length) return;
    canvas.discardActiveObject();
    canvas.remove(...objs);
    canvas.requestRenderAll();
    commit();
  }, [commit]);

  const copySelection = useCallback(async () => {
    const canvas = canvasRef.current;
    const source = canvas?.getActiveObject();
    if (!source) return;
    clipboardRef.current = await source.clone([...CUSTOM_PROPS]);
  }, []);

  const pasteClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    const stored = clipboardRef.current;
    if (!canvas || !fabric || !stored) return;

    const cloned = await stored.clone([...CUSTOM_PROPS]);
    cloned.set({ left: (cloned.left ?? 0) + 24, top: (cloned.top ?? 0) + 24 });

    if (cloned.type === 'activeselection') {
      const selection = cloned as FabricNS.ActiveSelection;
      selection.canvas = canvas;
      selection.forEachObject((obj) => {
        meta(obj).dsId = nextId();
        canvas.add(obj);
      });
      selection.setCoords();
      canvas.setActiveObject(selection);
    } else {
      meta(cloned).dsId = nextId();
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
    }
    canvas.requestRenderAll();
    commit();
  }, [commit]);

  const duplicateSelection = useCallback(async () => {
    await copySelection();
    await pasteClipboard();
  }, [copySelection, pasteClipboard]);

  const reorder = useCallback(
    (action: 'front' | 'back' | 'forward' | 'backward') => {
      const canvas = canvasRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return;
      if (action === 'front') canvas.bringObjectToFront(obj);
      if (action === 'back') canvas.sendObjectToBack(obj);
      if (action === 'forward') canvas.bringObjectForward(obj);
      if (action === 'backward') canvas.sendObjectBackwards(obj);
      canvas.requestRenderAll();
      commit();
    },
    [commit],
  );

  const align = useCallback(
    (mode: AlignMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objs = canvas.getActiveObjects();
      if (!objs.length) return;

      // One object aligns to the artboard; several align to each other, which
      // is what every design tool does and what people expect.
      let bounds = { left: 0, top: 0, right: artboard.width, bottom: artboard.height };
      if (objs.length > 1) {
        const rects = objs.map((o) => o.getBoundingRect());
        bounds = {
          left: Math.min(...rects.map((r) => r.left)),
          top: Math.min(...rects.map((r) => r.top)),
          right: Math.max(...rects.map((r) => r.left + r.width)),
          bottom: Math.max(...rects.map((r) => r.top + r.height)),
        };
      }

      objs.forEach((obj) => {
        const rect = obj.getBoundingRect();
        let dx = 0;
        let dy = 0;
        if (mode === 'left') dx = bounds.left - rect.left;
        if (mode === 'right') dx = bounds.right - (rect.left + rect.width);
        if (mode === 'center-h') dx = (bounds.left + bounds.right) / 2 - (rect.left + rect.width / 2);
        if (mode === 'top') dy = bounds.top - rect.top;
        if (mode === 'bottom') dy = bounds.bottom - (rect.top + rect.height);
        if (mode === 'center-v') dy = (bounds.top + bounds.bottom) / 2 - (rect.top + rect.height / 2);
        obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
        obj.setCoords();
      });

      canvas.requestRenderAll();
      commit();
    },
    [artboard.height, artboard.width, commit],
  );

  const distribute = useCallback(
    (axis: 'h' | 'v') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objs = canvas.getActiveObjects();
      if (objs.length < 3) return;

      const measured = objs
        .map((obj) => ({ obj, rect: obj.getBoundingRect() }))
        .sort((a, b) => (axis === 'h' ? a.rect.left - b.rect.left : a.rect.top - b.rect.top));

      const first = measured[0].rect;
      const last = measured[measured.length - 1].rect;
      const span =
        axis === 'h'
          ? last.left + last.width - first.left
          : last.top + last.height - first.top;
      const used = measured.reduce(
        (sum, m) => sum + (axis === 'h' ? m.rect.width : m.rect.height),
        0,
      );
      const gap = (span - used) / (measured.length - 1);

      let cursor = axis === 'h' ? first.left : first.top;
      measured.forEach(({ obj, rect }) => {
        if (axis === 'h') {
          obj.set({ left: (obj.left ?? 0) + (cursor - rect.left) });
          cursor += rect.width + gap;
        } else {
          obj.set({ top: (obj.top ?? 0) + (cursor - rect.top) });
          cursor += rect.height + gap;
        }
        obj.setCoords();
      });

      canvas.requestRenderAll();
      commit();
    },
    [commit],
  );

  const groupSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'activeselection') return;

    const objects = (active as FabricNS.ActiveSelection).getObjects();
    canvas.discardActiveObject();
    const group = new fabric.Group(objects);
    meta(group).dsId = nextId();
    canvas.remove(...objects);
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    commit();
  }, [commit]);

  const ungroupSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'group') return;

    const group = active as FabricNS.Group;
    const released = group.removeAll();
    canvas.remove(group);
    released.forEach((obj) => {
      ensureId(obj);
      canvas.add(obj);
    });
    const selection = new fabric.ActiveSelection(released, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
    commit();
  }, [commit]);

  // --------------------------------------------------------------- layers

  const findById = useCallback((id: string): FabricObj | undefined => {
    return canvasRef.current?.getObjects().find((obj) => meta(obj).dsId === id);
  }, []);

  const selectLayer = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      const obj = findById(id);
      if (!canvas || !obj || meta(obj).dsLocked) return;
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelection();
    },
    [findById, syncSelection],
  );

  const toggleLayerLock = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      const locked = !meta(obj).dsLocked;
      meta(obj).dsLocked = locked;
      obj.set({
        selectable: !locked,
        evented: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        hasControls: !locked,
      });
      if (locked && canvas.getActiveObjects().includes(obj)) canvas.discardActiveObject();
      canvas.requestRenderAll();
      commit();
    },
    [commit, findById],
  );

  const toggleLayerVisible = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      const visible = obj.visible === false;
      obj.set({ visible });
      if (!visible && canvas.getActiveObjects().includes(obj)) canvas.discardActiveObject();
      canvas.requestRenderAll();
      commit();
    },
    [commit, findById],
  );

  const renameLayer = useCallback(
    (id: string, name: string) => {
      const obj = findById(id);
      if (!obj) return;
      meta(obj).dsName = name.trim() || undefined;
      commit();
    },
    [commit, findById],
  );

  const moveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const canvas = canvasRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      // "Up" in the panel means towards the front of the fabric stack.
      if (direction === 'up') canvas.bringObjectForward(obj);
      else canvas.sendObjectBackwards(obj);
      canvas.requestRenderAll();
      commit();
    },
    [commit, findById],
  );

  const deleteLayer = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      canvas.discardActiveObject();
      canvas.remove(obj);
      canvas.requestRenderAll();
      commit();
    },
    [commit, findById],
  );

  // -------------------------------------------------------------- history

  const restore = useCallback(
    async (json: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !json) return;
      const scene = JSON.parse(json);
      await historyRef.current.duringRestore(async () => {
        await silently(async () => {
          await loadFontsForScene(scene);
          await canvas.loadFromJSON(scene);
          canvas.getObjects().forEach(ensureId);
          canvas.requestRenderAll();
        });
      });
      syncHistoryFlags();
      markDirty(true);
      refreshLayers();
      syncSelection();
    },
    [markDirty, refreshLayers, silently, syncHistoryFlags, syncSelection],
  );

  const undo = useCallback(async () => {
    await restore(historyRef.current.undo());
  }, [restore]);

  const redo = useCallback(async () => {
    await restore(historyRef.current.redo());
  }, [restore]);

  // --------------------------------------------------------------- export

  /**
   * Render the artboard at an exact pixel scale.
   *
   * `toDataURL`'s multiplier is relative to the current on-screen zoom, so it
   * has to be divided out — otherwise every export inherits whatever zoom the
   * admin happened to be working at.
   */
  const exportDataURL = useCallback(
    (format: 'png' | 'jpeg', scale = 1, quality = 0.92): string => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      const previous = canvas.getActiveObject();
      canvas.discardActiveObject();
      canvas.renderAll();
      const url = canvas.toDataURL({
        format,
        quality,
        multiplier: scale / canvas.getZoom(),
        enableRetinaScaling: false,
      });
      if (previous) canvas.setActiveObject(previous);
      canvas.requestRenderAll();
      return url;
    },
    [],
  );

  const exportSVG = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toSVG({
      width: `${artboard.width}`,
      height: `${artboard.height}`,
      viewBox: { x: 0, y: 0, width: artboard.width, height: artboard.height },
    });
  }, [artboard.height, artboard.width]);

  const serialize = useCallback((): Record<string, unknown> | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toObject() as Record<string, unknown>;
  }, []);

  const loadTemplate = useCallback(
    async (spec: TemplateSpec) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      await silently(async () => {
        await applyTemplate(fabric, canvas, spec);
      });
      backgroundRef.current =
        typeof spec.background === 'string'
          ? { type: 'solid', color: spec.background }
          : { type: 'gradient', ...spec.background };
      commit();
    },
    [commit, silently],
  );

  // ----------------------------------------------------------------- init

  useEffect(() => {
    let disposed = false;
    let instance: FabricCanvas | null = null;

    const boot = async () => {
      // fabric touches `window` at module scope, so it can only be imported
      // once we know we are in the browser.
      const fabric = (await import('fabric')) as unknown as FabricModule;
      if (disposed || !elementRef.current) return;

      registerCustomProps(fabric);
      fabricRef.current = fabric;

      instance = new fabric.Canvas(elementRef.current, {
        width,
        height,
        backgroundColor: '#FFFCF5',
        preserveObjectStacking: true,
        selection: true,
        selectionColor: 'rgba(31, 78, 74, 0.08)',
        selectionBorderColor: '#1F4E4A',
        selectionLineWidth: 1,
        controlsAboveOverlay: true,
        enableRetinaScaling: true,
      });
      canvasRef.current = instance;

      const objectDefaults = fabric.InteractiveFabricObject.ownDefaults;
      fabric.InteractiveFabricObject.ownDefaults = {
        ...objectDefaults,
        cornerStyle: 'circle',
        cornerColor: '#FFFFFF',
        cornerStrokeColor: '#1F4E4A',
        borderColor: '#1F4E4A',
        cornerSize: 11,
        transparentCorners: false,
        borderScaleFactor: 1.5,
        padding: 0,
      };

      if (initialScene) {
        await loadFontsForScene(initialScene);
        await instance.loadFromJSON(initialScene);
        instance.getObjects().forEach(ensureId);
        const bg = instance.backgroundColor;
        if (typeof bg === 'string') backgroundRef.current = { type: 'solid', color: bg };
        instance.requestRenderAll();
      }

      if (disposed) return;
      setReady(true);
      historyRef.current.reset(snapshot(instance));
      syncHistoryFlags();
      refreshLayers();
    };

    void boot();

    return () => {
      disposed = true;
      const current = instance ?? canvasRef.current;
      canvasRef.current = null;
      // `dispose` is async in v6+; the promise is not awaited because the
      // component is already gone by the time it settles.
      void current?.dispose();
    };
    // Booting is a one-shot: size and scene changes are handled by their own
    // effects rather than by tearing the canvas down and rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit the board once, as soon as the canvas exists and the host is measured.
  const didFitRef = useRef(false);
  useEffect(() => {
    if (!ready || didFitRef.current) return;
    didFitRef.current = true;
    const id = window.requestAnimationFrame(() => zoomToFit());
    return () => window.cancelAnimationFrame(id);
  }, [ready, zoomToFit]);

  // ------------------------------------------------------------ listeners

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ready || !canvas) return;

    const onSelection = () => syncSelection();
    const onModified = () => commit();
    const onAddedOrRemoved = () => {
      if (suppressRef.current > 0) return;
      commit();
    };
    const onTextChanged = () => {
      refreshLayers();
      bump();
    };

    /**
     * Smart guides.
     *
     * Each drag compares the moving object's edges and centre against the
     * artboard's and against every other object's, snapping to whichever is
     * within a few screen pixels. The threshold is divided by the zoom so it
     * stays a constant on-screen distance rather than a constant artboard one.
     */
    const onMoving = (event: { target?: FabricObj }) => {
      const target = event.target;
      if (!target) return;

      const threshold = SNAP_THRESHOLD / canvas.getZoom();
      const rect = target.getBoundingRect();
      const found: Guide[] = [];

      const verticals: number[] = [0, artboard.width / 2, artboard.width];
      const horizontals: number[] = [0, artboard.height / 2, artboard.height];

      canvas.getObjects().forEach((other) => {
        if (other === target || other.visible === false) return;
        const r = other.getBoundingRect();
        verticals.push(r.left, r.left + r.width / 2, r.left + r.width);
        horizontals.push(r.top, r.top + r.height / 2, r.top + r.height);
      });

      const candidatesX = [rect.left, rect.left + rect.width / 2, rect.left + rect.width];
      const candidatesY = [rect.top, rect.top + rect.height / 2, rect.top + rect.height];

      let bestX: { delta: number; at: number } | null = null;
      candidatesX.forEach((c) => {
        verticals.forEach((v) => {
          const delta = v - c;
          if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
            bestX = { delta, at: v };
          }
        });
      });

      let bestY: { delta: number; at: number } | null = null;
      candidatesY.forEach((c) => {
        horizontals.forEach((h) => {
          const delta = h - c;
          if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
            bestY = { delta, at: h };
          }
        });
      });

      if (bestX) {
        const snap = bestX as { delta: number; at: number };
        target.set({ left: (target.left ?? 0) + snap.delta });
        found.push({ orientation: 'v', at: snap.at });
      }
      if (bestY) {
        const snap = bestY as { delta: number; at: number };
        target.set({ top: (target.top ?? 0) + snap.delta });
        found.push({ orientation: 'h', at: snap.at });
      }

      target.setCoords();
      setGuides(found);
    };

    const clearGuides = () => setGuides([]);

    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', onSelection);
    canvas.on('object:modified', onModified);
    canvas.on('object:added', onAddedOrRemoved);
    canvas.on('object:removed', onAddedOrRemoved);
    canvas.on('object:moving', onMoving);
    canvas.on('mouse:up', clearGuides);
    canvas.on('text:changed', onTextChanged);
    canvas.on('text:editing:exited', onModified);

    return () => {
      canvas.off('selection:created', onSelection);
      canvas.off('selection:updated', onSelection);
      canvas.off('selection:cleared', onSelection);
      canvas.off('object:modified', onModified);
      canvas.off('object:added', onAddedOrRemoved);
      canvas.off('object:removed', onAddedOrRemoved);
      canvas.off('object:moving', onMoving);
      canvas.off('mouse:up', clearGuides);
      canvas.off('text:changed', onTextChanged);
      canvas.off('text:editing:exited', onModified);
    };
  }, [artboard.height, artboard.width, bump, commit, ready, refreshLayers, syncSelection]);

  const isEditingText = useCallback((): boolean => {
    const obj = canvasRef.current?.getActiveObject();
    return !!obj && (obj as unknown as { isEditing?: boolean }).isEditing === true;
  }, []);

  return useMemo(
    () => ({
      hostRef,
      elementRef,
      canvasRef,
      fabricRef,
      ready,
      tick,
      zoom,
      setZoom,
      zoomIn,
      zoomOut,
      zoomToFit,
      artboard,
      setArtboardSize,
      selectionKind,
      selectionCount,
      activeObject,
      activeObjects,
      isEditingText,
      update,
      commit,
      markClean: () => markDirty(false),
      dirty,
      layers,
      guides,
      canUndo,
      canRedo,
      undo,
      redo,
      addText,
      addPrimitive,
      addPath,
      addImage,
      setBackground,
      background: backgroundRef.current,
      setBackgroundImage,
      clearBackgroundImage,
      removeSelected,
      copySelection,
      pasteClipboard,
      duplicateSelection,
      reorder,
      align,
      distribute,
      groupSelection,
      ungroupSelection,
      selectLayer,
      toggleLayerLock,
      toggleLayerVisible,
      renameLayer,
      moveLayer,
      deleteLayer,
      exportDataURL,
      exportSVG,
      serialize,
      loadTemplate,
    }),
    [
      activeObject,
      activeObjects,
      addImage,
      addPath,
      addPrimitive,
      addText,
      align,
      artboard,
      canRedo,
      canUndo,
      clearBackgroundImage,
      commit,
      copySelection,
      deleteLayer,
      dirty,
      distribute,
      duplicateSelection,
      exportDataURL,
      exportSVG,
      groupSelection,
      guides,
      isEditingText,
      layers,
      loadTemplate,
      markDirty,
      moveLayer,
      pasteClipboard,
      redo,
      removeSelected,
      renameLayer,
      reorder,
      ready,
      selectLayer,
      selectionCount,
      selectionKind,
      serialize,
      setArtboardSize,
      setBackground,
      setBackgroundImage,
      setZoom,
      tick,
      toggleLayerLock,
      toggleLayerVisible,
      undo,
      ungroupSelection,
      update,
      zoom,
      zoomIn,
      zoomOut,
      zoomToFit,
    ],
  );
};

export type DesignEditorApi = ReturnType<typeof useDesignEditor>;
