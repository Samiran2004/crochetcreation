'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Image as ImageIcon,
  Layers as LayersIcon,
  LayoutTemplate,
  Lock,
  Maximize,
  Maximize2,
  PaintBucket,
  Shapes,
  Sliders,
  Trash2,
  Type as TypeIcon,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Spinner, TextButton } from './ui';
import { TopBar, type ExportFormat } from './TopBar';
import { Inspector } from './Inspector';
import {
  BackgroundPanel,
  ElementsPanel,
  LayersPanel,
  ResizePanel,
  TemplatesPanel,
  TextPanel,
  UploadsPanel,
} from './SidePanels';
import { useDesignEditor } from './useDesignEditor';
import { publishRender, updateDesign } from '../lib/api';
import type { DesignRecord } from '../lib/types';
import type { TemplateSpec } from '../lib/templates';

type RailTab = 'templates' | 'elements' | 'text' | 'uploads' | 'background' | 'resize' | 'layers';

const RAIL: { id: RailTab; label: string; icon: React.ReactNode }[] = [
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="h-4.5 w-4.5" /> },
  { id: 'elements', label: 'Elements', icon: <Shapes className="h-4.5 w-4.5" /> },
  { id: 'text', label: 'Text', icon: <TypeIcon className="h-4.5 w-4.5" /> },
  { id: 'uploads', label: 'Uploads', icon: <ImageIcon className="h-4.5 w-4.5" /> },
  { id: 'background', label: 'Background', icon: <PaintBucket className="h-4.5 w-4.5" /> },
  { id: 'resize', label: 'Resize', icon: <Maximize className="h-4.5 w-4.5" /> },
  { id: 'layers', label: 'Layers', icon: <LayersIcon className="h-4.5 w-4.5" /> },
];

/**
 * How long the editor waits after the last change before writing.
 *
 * Short enough that work is never more than a couple of seconds from being
 * safe, and debounced so a burst of edits (dragging a slider, typing into a
 * text box) still produces a single write when the burst ends.
 */
const AUTOSAVE_DELAY = 2000;

/**
 * Re-rendering and uploading the gallery preview is by far the most expensive
 * part of a save, and nobody is looking at the gallery mid-edit — so it rides
 * along at most this often, and always on an explicit save.
 */
const THUMBNAIL_INTERVAL = 25000;

const download = (href: string, filename: string) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'design';

const ContextItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, shortcut, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[11px] font-semibold transition-colors ${
      danger
        ? 'text-terracotta hover:bg-terracotta/10'
        : 'text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    <span className="shrink-0 text-gray-400">{icon}</span>
    <span className="flex-1">{label}</span>
    {shortcut && <span className="shrink-0 font-mono text-[9px] text-gray-350">{shortcut}</span>}
  </button>
);

const DesignEditor: React.FC<{ design: DesignRecord }> = ({ design }) => {
  const [name, setName] = useState(design.name);
  const [tab, setTab] = useState<RailTab>(design.canvas_json ? 'elements' : 'templates');
  const [panelOpen, setPanelOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmTemplate, setConfirmTemplate] = useState<TemplateSpec | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const editor = useDesignEditor({
    width: design.width,
    height: design.height,
    initialScene: design.canvas_json ?? null,
  });

  const showError = useCallback((message: string) => setError(message), []);

  /* ------------------------------------------------------------- saving */

  // Kept in a ref so the autosave timer and the ⌘S handler always call the
  // newest closure without either of them re-subscribing on every keystroke.
  const saveRef = useRef<(silent?: boolean) => Promise<void>>();

  const inFlightRef = useRef(false);
  const rerunRef = useRef(false);
  const lastThumbnailAtRef = useRef(0);

  const save = useCallback(
    async (silent = false) => {
      if (!editor.ready) return;

      // Two-second autosave means a slow write can still be running when the
      // next one is due. Rather than stacking requests, remember that another
      // is wanted and run it once this one lands.
      if (inFlightRef.current) {
        rerunRef.current = true;
        return;
      }

      const scene = editor.serialize();
      if (!scene) return;

      inFlightRef.current = true;
      setSaving(true);
      if (!silent) setError(null);

      try {
        const now = Date.now();
        const wantsThumbnail = !silent || now - lastThumbnailAtRef.current > THUMBNAIL_INTERVAL;

        let thumbnail: string | undefined;
        if (wantsThumbnail) {
          // A small preview is enough for the gallery card and keeps the
          // request well inside the API's payload ceiling.
          const previewScale = Math.min(
            1,
            480 / Math.max(editor.artboard.width, editor.artboard.height),
          );
          thumbnail = editor.exportDataURL('jpeg', previewScale, 0.72) || undefined;
          lastThumbnailAtRef.current = now;
        }

        await updateDesign(design.id, {
          name: name.trim() || 'Untitled design',
          width: editor.artboard.width,
          height: editor.artboard.height,
          canvas_json: scene,
          thumbnail_data_url: thumbnail,
        });
        editor.markClean();
        setLastSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save the design.');
      } finally {
        inFlightRef.current = false;
        setSaving(false);
        if (rerunRef.current) {
          rerunRef.current = false;
          void saveRef.current?.(true);
        }
      }
    },
    [design.id, editor, name],
  );

  saveRef.current = save;

  // Autosave: only while there is something to save, and reset on every edit
  // so a burst of changes produces one write instead of a dozen.
  useEffect(() => {
    if (!editor.dirty || !editor.ready) return;
    const timer = window.setTimeout(() => {
      void saveRef.current?.(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [editor.dirty, editor.ready, editor.tick]);

  // Renaming never touches the canvas, so it would otherwise never be
  // picked up by the dirty-flag autosave above.
  const nameSettledRef = useRef(design.name);
  useEffect(() => {
    if (!editor.ready || name === nameSettledRef.current) return;
    const timer = window.setTimeout(() => {
      nameSettledRef.current = name;
      void saveRef.current?.(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [editor.ready, name]);

  // Last line of defence against closing the tab on unsaved work.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!editor.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [editor.dirty]);

  /* ---------------------------------------------------------- export */

  const handleExport = useCallback(
    (format: ExportFormat, scale: number) => {
      const base = slugify(name);
      try {
        if (format === 'json') {
          const scene = editor.serialize();
          const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          download(url, `${base}.json`);
          URL.revokeObjectURL(url);
          return;
        }
        if (format === 'svg') {
          const blob = new Blob([editor.exportSVG()], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          download(url, `${base}.svg`);
          URL.revokeObjectURL(url);
          return;
        }
        const dataUrl = editor.exportDataURL(format, scale);
        download(dataUrl, `${base}@${scale}x.${format === 'jpeg' ? 'jpg' : 'png'}`);
      } catch {
        setError('Could not build that file. If the design uses an external image, re-upload it through the Uploads panel.');
      }
    },
    [editor, name],
  );

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setError(null);
    try {
      const dataUrl = editor.exportDataURL('png', 1);
      const asset = await publishRender(dataUrl, `${slugify(name)}.png`);
      setPublishedUrl(asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish that image.');
    } finally {
      setPublishing(false);
    }
  }, [editor, name]);

  /* ------------------------------------------------------- shortcuts */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // While a text object is being edited on the canvas, every key belongs
      // to that text — including Delete and the arrows.
      if (typing || editor.isEditingText()) {
        if (e.key === 'Escape') editor.canvasRef.current?.discardActiveObject();
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) void editor.redo();
        else void editor.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        void editor.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void editor.copySelection();
        return;
      }
      if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        void editor.pasteClipboard();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        void editor.duplicateSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) editor.ungroupSelection();
        else editor.groupSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const canvas = editor.canvasRef.current;
        const fabric = editor.fabricRef.current;
        if (!canvas || !fabric) return;
        const selectable = canvas.getObjects().filter((o) => o.selectable !== false);
        if (!selectable.length) return;
        canvas.discardActiveObject();
        canvas.setActiveObject(new fabric.ActiveSelection(selectable, { canvas }));
        canvas.requestRenderAll();
        return;
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        editor.zoomIn();
        return;
      }
      if (mod && e.key === '-') {
        e.preventDefault();
        editor.zoomOut();
        return;
      }
      if (mod && e.key === '0') {
        e.preventDefault();
        editor.zoomToFit();
        return;
      }
      if (mod) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        editor.removeSelected();
        return;
      }
      if (e.key === 'Escape') {
        editor.canvasRef.current?.discardActiveObject();
        editor.canvasRef.current?.requestRenderAll();
        return;
      }
      if (e.key === ']') {
        editor.reorder('forward');
        return;
      }
      if (e.key === '[') {
        editor.reorder('backward');
        return;
      }

      const nudges: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const nudge = nudges[e.key];
      if (nudge) {
        const objects = editor.activeObjects();
        if (!objects.length) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        objects.forEach((obj) => {
          obj.set({
            left: (obj.left ?? 0) + nudge[0] * step,
            top: (obj.top ?? 0) + nudge[1] * step,
          });
          obj.setCoords();
        });
        editor.canvasRef.current?.requestRenderAll();
        editor.commit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor]);

  /* ------------------------------------------------------------ render */

  const stageStyle = useMemo(
    () => ({
      width: editor.artboard.width * editor.zoom,
      height: editor.artboard.height * editor.zoom,
    }),
    [editor.artboard.height, editor.artboard.width, editor.zoom],
  );

  /**
   * Right-click menu.
   *
   * Fabric does not manage selection on a secondary click, so the object
   * under the pointer is resolved and selected first — otherwise the menu
   * would act on whatever happened to be selected before.
   */
  const openContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const canvas = editor.canvasRef.current;
      if (canvas) {
        try {
          const target = (
            canvas as unknown as {
              findTarget?: (e: Event) => unknown;
            }
          ).findTarget?.(event.nativeEvent);
          if (target) canvas.setActiveObject(target as never);
          else canvas.discardActiveObject();
          canvas.requestRenderAll();
        } catch {
          // A fabric internal that moved is not worth failing the menu over.
        }
      }
      setMenu({ x: event.clientX, y: event.clientY });
    },
    [editor],
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const applyTemplateNow = useCallback(
    (spec: TemplateSpec) => {
      void editor.loadTemplate(spec);
      setConfirmTemplate(null);
    },
    [editor],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-55 dark:bg-slate-950">
      <TopBar
        editor={editor}
        name={name}
        onNameChange={setName}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={() => void save()}
        onExport={handleExport}
        onPublish={() => void handlePublish()}
        publishing={publishing}
        publishedUrl={publishedUrl}
      />

      {error && (
        <div className="flex shrink-0 items-start gap-2 border-b border-terracotta/30 bg-terracotta/10 px-4 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
          <p className="flex-1 text-[11px] font-semibold text-terracotta-deep">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-terracotta hover:text-terracotta-deep"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Icon rail */}
        <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3">
          {RAIL.map((item) => {
            const active = tab === item.id && panelOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (tab === item.id) setPanelOpen((v) => !v);
                  else {
                    setTab(item.id);
                    setPanelOpen(true);
                  }
                }}
                title={item.label}
                className={`flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  active
                    ? 'bg-teal text-parchment dark:bg-parchment dark:text-teal'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-parchment'
                }`}
              >
                {item.icon}
                <span className="text-[8.5px] font-black uppercase tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Contextual panel */}
        {panelOpen && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            {tab === 'templates' && (
              <TemplatesPanel editor={editor} onApply={setConfirmTemplate} />
            )}
            {tab === 'elements' && <ElementsPanel editor={editor} onError={showError} />}
            {tab === 'text' && <TextPanel editor={editor} />}
            {tab === 'uploads' && <UploadsPanel editor={editor} onError={showError} />}
            {tab === 'background' && <BackgroundPanel editor={editor} onError={showError} />}
            {tab === 'resize' && <ResizePanel editor={editor} />}
            {tab === 'layers' && <LayersPanel editor={editor} />}
          </aside>
        )}

        {/* Stage */}
        <div
          ref={editor.hostRef}
          onContextMenu={openContextMenu}
          className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-9"
          style={{
            // A faint dot grid reads as "canvas surface" and makes a white
            // artboard's edges obvious without a hard border.
            backgroundColor: 'var(--ds-stage-bg, #EFEFEC)',
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(35,66,60,0.10) 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        >
          <div
            className="relative shrink-0 rounded-[2px] shadow-panel ring-1 ring-black/5"
            style={stageStyle}
          >
            <canvas ref={editor.elementRef} />

            {/* Smart guides live in their own overlay rather than being drawn
                into fabric's context, so they can never end up in an export. */}
            {editor.guides.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0"
                width={stageStyle.width}
                height={stageStyle.height}
              >
                {editor.guides.map((guide, index) =>
                  guide.orientation === 'v' ? (
                    <line
                      key={`v-${index}`}
                      x1={guide.at * editor.zoom}
                      y1={0}
                      x2={guide.at * editor.zoom}
                      y2={stageStyle.height}
                      stroke="#C0663A"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  ) : (
                    <line
                      key={`h-${index}`}
                      x1={0}
                      y1={guide.at * editor.zoom}
                      x2={stageStyle.width}
                      y2={guide.at * editor.zoom}
                      stroke="#C0663A"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  ),
                )}
              </svg>
            )}
          </div>

          {/* Floating zoom bar — always reachable, never in the way. */}
          <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white/95 px-1 py-1 shadow-lift backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            <button
              type="button"
              title="Zoom out"
              onClick={editor.zoomOut}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Fit to screen"
              onClick={editor.zoomToFit}
              className="min-w-12 rounded-lg px-1.5 py-1 font-mono text-[11px] font-bold text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {Math.round(editor.zoom * 100)}%
            </button>
            <button
              type="button"
              title="Zoom in"
              onClick={editor.zoomIn}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-slate-700" />
            <button
              type="button"
              title="Fit to screen (⌘0)"
              onClick={editor.zoomToFit}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {!editor.ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-slate-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Spinner className="h-6 w-6" />
                <p className="text-xs font-bold">Preparing your artboard…</p>
              </div>
            </div>
          )}
        </div>

        {/* Inspector */}
        <aside
          className={`relative hidden shrink-0 border-l border-gray-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 lg:block ${
            inspectorOpen ? 'w-72' : 'w-0'
          }`}
        >
          <button
            type="button"
            onClick={() => setInspectorOpen((v) => !v)}
            title={inspectorOpen ? 'Hide properties' : 'Show properties'}
            className="absolute -left-3 top-4 z-10 flex h-7 w-6 items-center justify-center rounded-l-lg border border-r-0 border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-teal dark:border-slate-700 dark:bg-slate-900 dark:hover:text-parchment"
          >
            {inspectorOpen ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>

          {inspectorOpen && (
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-gray-150 pb-3 dark:border-slate-800">
                <Sliders className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Properties
                </p>
              </div>
              <Inspector editor={editor} />
            </div>
          )}
        </aside>
      </div>

      {/* Right-click menu. Positioned in viewport space because the stage
          scrolls independently of the page. */}
      {menu && (
        <div
          className="fixed z-[60] w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          style={{
            left: Math.min(menu.x, (typeof window !== 'undefined' ? window.innerWidth : 0) - 220),
            top: Math.min(menu.y, (typeof window !== 'undefined' ? window.innerHeight : 0) - 300),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {editor.selectionKind === 'none' ? (
            <>
              <ContextItem
                icon={<Clipboard className="h-3.5 w-3.5" />}
                label="Paste"
                shortcut="⌘V"
                onClick={() => {
                  void editor.pasteClipboard();
                  setMenu(null);
                }}
              />
              <ContextItem
                icon={<Maximize2 className="h-3.5 w-3.5" />}
                label="Fit to screen"
                shortcut="⌘0"
                onClick={() => {
                  editor.zoomToFit();
                  setMenu(null);
                }}
              />
              <ContextItem
                icon={<PaintBucket className="h-3.5 w-3.5" />}
                label="Change background"
                onClick={() => {
                  setTab('background');
                  setPanelOpen(true);
                  setMenu(null);
                }}
              />
            </>
          ) : (
            <>
              <ContextItem
                icon={<Copy className="h-3.5 w-3.5" />}
                label="Duplicate"
                shortcut="⌘D"
                onClick={() => {
                  void editor.duplicateSelection();
                  setMenu(null);
                }}
              />
              <ContextItem
                icon={<Clipboard className="h-3.5 w-3.5" />}
                label="Copy"
                shortcut="⌘C"
                onClick={() => {
                  void editor.copySelection();
                  setMenu(null);
                }}
              />
              <div className="my-1 h-px bg-gray-150 dark:bg-slate-800" />
              <ContextItem
                icon={<ArrowUpToLine className="h-3.5 w-3.5" />}
                label="Bring to front"
                onClick={() => {
                  editor.reorder('front');
                  setMenu(null);
                }}
              />
              <ContextItem
                icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
                label="Send to back"
                onClick={() => {
                  editor.reorder('back');
                  setMenu(null);
                }}
              />
              <div className="my-1 h-px bg-gray-150 dark:bg-slate-800" />
              {editor.selectionKind === 'multiple' && (
                <ContextItem
                  icon={<LayersIcon className="h-3.5 w-3.5" />}
                  label="Group"
                  shortcut="⌘G"
                  onClick={() => {
                    editor.groupSelection();
                    setMenu(null);
                  }}
                />
              )}
              {editor.selectionKind === 'group' && (
                <ContextItem
                  icon={<LayersIcon className="h-3.5 w-3.5" />}
                  label="Ungroup"
                  shortcut="⌘⇧G"
                  onClick={() => {
                    editor.ungroupSelection();
                    setMenu(null);
                  }}
                />
              )}
              <ContextItem
                icon={<Lock className="h-3.5 w-3.5" />}
                label="Lock"
                onClick={() => {
                  const id = editor.layers.find((l) => l.selected)?.id;
                  if (id) editor.toggleLayerLock(id);
                  setMenu(null);
                }}
              />
              <ContextItem
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Delete"
                shortcut="Del"
                danger
                onClick={() => {
                  editor.removeSelected();
                  setMenu(null);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Applying a template throws the artboard away, so it asks first. */}
      {confirmTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-black text-ink dark:text-parchment">
              Use “{confirmTemplate.name}”?
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
              This replaces everything currently on the artboard. You can bring it back with undo.
            </p>
            <div className="mt-4 flex gap-2">
              <TextButton variant="outline" full onClick={() => setConfirmTemplate(null)}>
                Cancel
              </TextButton>
              <TextButton variant="primary" full onClick={() => applyTemplateNow(confirmTemplate)}>
                Apply template
              </TextButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignEditor;
