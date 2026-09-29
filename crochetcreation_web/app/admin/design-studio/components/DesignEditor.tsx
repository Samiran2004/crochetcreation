'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Image as ImageIcon,
  Layers as LayersIcon,
  LayoutTemplate,
  Maximize,
  PaintBucket,
  Shapes,
  Sliders,
  Type as TypeIcon,
  X,
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

const AUTOSAVE_DELAY = 20000;

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

  const save = useCallback(
    async (silent = false) => {
      if (!editor.ready) return;
      const scene = editor.serialize();
      if (!scene) return;

      setSaving(true);
      if (!silent) setError(null);
      try {
        // A small preview is enough for the gallery card and keeps the
        // request well inside the API's payload ceiling.
        const previewScale = Math.min(1, 480 / Math.max(editor.artboard.width, editor.artboard.height));
        const thumbnail = editor.exportDataURL('jpeg', previewScale, 0.72);

        await updateDesign(design.id, {
          name: name.trim() || 'Untitled design',
          width: editor.artboard.width,
          height: editor.artboard.height,
          canvas_json: scene,
          thumbnail_data_url: thumbnail || undefined,
        });
        editor.markClean();
        setLastSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save the design.');
      } finally {
        setSaving(false);
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
            {tab === 'elements' && <ElementsPanel editor={editor} />}
            {tab === 'text' && <TextPanel editor={editor} />}
            {tab === 'uploads' && <UploadsPanel editor={editor} onError={showError} />}
            {tab === 'background' && <BackgroundPanel editor={editor} />}
            {tab === 'resize' && <ResizePanel editor={editor} />}
            {tab === 'layers' && <LayersPanel editor={editor} />}
          </aside>
        )}

        {/* Stage */}
        <div
          ref={editor.hostRef}
          className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-9 dark:bg-slate-950"
        >
          <div className="relative shrink-0 shadow-panel" style={stageStyle}>
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
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 xl:block">
          <div className="mb-3 flex items-center gap-2 border-b border-gray-150 dark:border-slate-800 pb-3">
            <Sliders className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Properties
            </p>
          </div>
          <Inspector editor={editor} />
        </aside>
      </div>

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
