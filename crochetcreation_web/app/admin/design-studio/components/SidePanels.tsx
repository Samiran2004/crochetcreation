'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIconLucide,
  Images,
  Layers as LayersIcon,
  Link2,
  Lock,
  Search,
  Sparkles,
  Trash2,
  Type as TypeIcon,
  Unlock,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import {
  ColorPicker,
  EmptyHint,
  Field,
  IconButton,
  NumberInput,
  PanelSection,
  Popover,
  Segmented,
  Slider,
  Spinner,
  TextButton,
  Toggle,
} from './ui';
import { BRAND_COLORS, GRADIENT_PRESETS, SIZE_PRESETS, PRESET_GROUPS } from '../lib/presets';
import { PRIMITIVES, SHAPE_GROUPS } from '../lib/shapes';
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateSpec } from '../lib/templates';
import { deleteAsset, importFromUrl, listAssets, uploadAsset } from '../lib/api';
import type { DesignAsset, LayerNode } from '../lib/types';
import type { BackgroundFit } from '../lib/engine';
import type { DesignEditorApi } from './useDesignEditor';

/* ------------------------------------------------------------ Templates */

export const TemplatesPanel: React.FC<{
  editor: DesignEditorApi;
  onApply: (spec: TemplateSpec) => void;
}> = ({ onApply }) => {
  const [category, setCategory] = useState<(typeof TEMPLATE_CATEGORIES)[number]>('All');
  const visible = TEMPLATES.filter((t) => category === 'All' || t.category === category);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors ${
              category === c
                ? 'bg-teal text-parchment dark:bg-parchment dark:text-teal'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-ink dark:hover:text-parchment'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
        Applying a template replaces everything on the artboard. Your current work is still
        recoverable with undo.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {visible.map((spec) => (
          <button
            key={spec.id}
            type="button"
            onClick={() => onApply(spec)}
            className="group overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-teal dark:hover:border-parchment hover:shadow-lift"
          >
            <span
              className="flex h-24 items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${spec.swatch[0]}, ${spec.swatch[1]})`,
              }}
            >
              <span className="rounded-md bg-black/25 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                {spec.category}
              </span>
            </span>
            <span className="block px-2.5 py-2">
              <span className="block truncate text-[11px] font-bold text-ink dark:text-parchment">
                {spec.name}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- Elements */

const ShapeSwatch: React.FC<{
  path: string;
  strokeOnly?: boolean;
  label: string;
  onClick: () => void;
}> = ({ path, strokeOnly, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="flex aspect-square items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-teal dark:hover:border-parchment hover:shadow-soft active:translate-y-0"
  >
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path
        d={path}
        fill={strokeOnly ? 'none' : 'currentColor'}
        stroke={strokeOnly ? 'currentColor' : 'none'}
        strokeWidth={strokeOnly ? 6 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-teal dark:text-parchment"
      />
    </svg>
  </button>
);

const CollapsibleSection: React.FC<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-150 dark:border-slate-800 pb-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1.5"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-mono text-[9px] text-gray-350">{count}</span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

/** Paste SVG markup or a link, and get editable vectors on the artboard. */
const ImportElement: React.FC<{
  editor: DesignEditorApi;
  color: string;
  onError: (message: string) => void;
}> = ({ editor, color, onError }) => {
  const [mode, setMode] = useState<'url' | 'code'>('url');
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [recolor, setRecolor] = useState(true);

  const run = async () => {
    setBusy(true);
    try {
      if (mode === 'code') {
        const ok = await editor.addSvgMarkup(code, recolor ? color : undefined);
        if (!ok) onError('That SVG could not be read. Paste the full <svg>…</svg> markup.');
        else setCode('');
        return;
      }

      const result = await importFromUrl(url.trim());
      if (result.kind === 'svg' && result.svg) {
        const ok = await editor.addSvgMarkup(result.svg, recolor ? color : undefined);
        if (!ok) onError('That link returned an SVG the editor could not read.');
        else setUrl('');
      } else if (result.asset) {
        await editor.addImage(result.asset.url);
        setUrl('');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not import from that link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'url', label: 'From link' },
          { value: 'code', label: 'Paste SVG' },
        ]}
      />

      {mode === 'url' ? (
        <>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim()) void run();
            }}
            placeholder="https://img.icons8.com/…/icon.svg"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-[11px] text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:border-teal dark:focus:border-parchment focus:outline-none"
          />
          <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
            Works with Icons8, Flaticon, SVG Repo, Iconify and any direct image link. SVGs come in
            as editable vectors; photos go to your uploads.
          </p>
        </>
      ) : (
        <>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={5}
            placeholder={'<svg viewBox="0 0 24 24">…</svg>'}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 font-mono text-[10px] text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:border-teal dark:focus:border-parchment focus:outline-none"
          />
          <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
            Copy an icon&apos;s SVG code from any site and paste it here.
          </p>
        </>
      )}

      <Toggle checked={recolor} onChange={setRecolor} label="Recolour to element colour" />

      <TextButton
        variant="primary"
        full
        disabled={busy || (mode === 'url' ? !url.trim() : !code.trim())}
        onClick={() => void run()}
      >
        {busy ? <Spinner /> : <Link2 className="h-3.5 w-3.5" />}
        {busy ? 'Importing…' : 'Import element'}
      </TextButton>

      <a
        href="https://icons8.com/icons"
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-teal hover:underline dark:text-parchment"
      >
        Browse Icons8 <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
};

export const ElementsPanel: React.FC<{
  editor: DesignEditorApi;
  onError: (message: string) => void;
}> = ({ editor, onError }) => {
  const [color, setColor] = useState('#1F4E4A');
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHAPE_GROUPS;
    return SHAPE_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const totalShapes = SHAPE_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${totalShapes} elements...`}
          className="w-full bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none"
        />
      </div>

      <PanelSection title="Element colour">
        <Popover
          width="w-72"
          trigger={() => (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 transition-colors hover:border-teal dark:hover:border-parchment"
            >
              <span
                style={{ backgroundColor: color }}
                className="h-5 w-5 rounded border border-black/15 dark:border-white/20"
              />
              <span className="flex-1 text-left font-mono text-[11px] uppercase text-slate-600 dark:text-slate-300">
                {color}
              </span>
            </button>
          )}
        >
          {() => <ColorPicker value={color} onChange={setColor} />}
        </Popover>
      </PanelSection>

      {!query && (
        <CollapsibleSection title="Basic shapes" defaultOpen>
          <div className="grid grid-cols-4 gap-2">
            {PRIMITIVES.map((p) => (
              <ShapeSwatch
                key={p.id}
                path={p.preview}
                strokeOnly={p.kind === 'line'}
                label={p.label}
                onClick={() => editor.addPrimitive(p.kind, { fill: color, stroke: color })}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {groups.map((group, index) => (
        <CollapsibleSection
          key={group.id}
          title={group.label}
          count={group.items.length}
          defaultOpen={!!query || index === 0}
        >
          <div className="grid grid-cols-4 gap-2">
            {group.items.map((shape) => (
              <ShapeSwatch
                key={shape.id}
                path={shape.path}
                strokeOnly={shape.strokeOnly}
                label={shape.label}
                onClick={() => editor.addPath(shape.path, { strokeOnly: shape.strokeOnly, color })}
              />
            ))}
          </div>
        </CollapsibleSection>
      ))}

      {!query && (
        <CollapsibleSection title="Import from anywhere">
          <ImportElement editor={editor} color={color} onError={onError} />
        </CollapsibleSection>
      )}
    </div>
  );
};

/* ----------------------------------------------------------------- Text */

const TEXT_STYLES = [
  { label: 'Add a heading', font: 'Playfair Display', size: 0.09, weight: 700, sample: 'Heading' },
  { label: 'Add a subheading', font: 'Cormorant Garamond', size: 0.055, weight: 500, sample: 'Subheading' },
  { label: 'Add body text', font: 'Instrument Sans', size: 0.032, weight: 400, sample: 'Body text' },
  { label: 'Add a caption', font: 'Instrument Sans', size: 0.022, weight: 600, sample: 'CAPTION', upper: true },
];

const TEXT_PRESETS = [
  { name: 'Signature', font: 'Great Vibes', weight: 400, fill: '#C0663A', size: 0.1, text: 'Handmade' },
  { name: 'Calligraphy', font: 'Alex Brush', weight: 400, fill: '#1F4E4A', size: 0.1, text: 'Crochet' },
  { name: 'Wedding', font: 'Allura', weight: 400, fill: '#C79A4B', size: 0.1, text: 'Thank you' },
  { name: 'Romantic', font: 'Parisienne', weight: 400, fill: '#D99A86', size: 0.095, text: 'with love' },
  { name: 'Elegant', font: 'Pinyon Script', weight: 400, fill: '#585C36', size: 0.095, text: 'Bespoke' },
  { name: 'Editorial', font: 'Bodoni Moda', weight: 700, fill: '#1F4E4A', size: 0.085, text: 'New Arrival' },
  { name: 'Statement', font: 'Archivo Black', weight: 400, fill: '#23423C', size: 0.08, text: 'SALE' },
  { name: 'Quiet Label', font: 'Instrument Sans', weight: 600, fill: '#596661', size: 0.024, text: 'LIMITED EDITION', spacing: 500 },
  { name: 'Luxe Caps', font: 'Cinzel', weight: 600, fill: '#C79A4B', size: 0.045, text: 'ARTISAN', spacing: 350 },
  { name: 'Ticket', font: 'JetBrains Mono', weight: 700, fill: '#1F4E4A', size: 0.05, text: 'CODE10', spacing: 200 },
  { name: 'Retro', font: 'Lobster', weight: 400, fill: '#C0663A', size: 0.075, text: 'Fresh Drop' },
  { name: 'Soft Note', font: 'Caveat', weight: 600, fill: '#4A5A52', size: 0.06, text: 'made for you' },
];

export const TextPanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const short = Math.min(editor.artboard.width, editor.artboard.height);

  return (
    <div className="space-y-5">
      <PanelSection title="Add text">
        <div className="space-y-2">
          {TEXT_STYLES.map((style) => (
            <button
              key={style.label}
              type="button"
              onClick={() =>
                editor.addText({
                  text: style.sample,
                  fontFamily: style.font,
                  fontSize: Math.round(style.size * short),
                  fontWeight: style.weight,
                  width: Math.round(editor.artboard.width * 0.7),
                })
              }
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-teal dark:hover:border-parchment hover:shadow-soft"
            >
              <span
                className="truncate text-ink dark:text-parchment"
                style={{
                  fontFamily: `"${style.font}", serif`,
                  fontWeight: style.weight,
                  fontSize: style.upper ? 12 : Math.min(22, 10 + style.size * 160),
                  letterSpacing: style.upper ? '0.2em' : undefined,
                }}
              >
                {style.sample}
              </span>
              <TypeIcon className="h-3.5 w-3.5 shrink-0 text-gray-350 dark:text-slate-600" />
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Ready-made styles">
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() =>
                editor.addText({
                  text: preset.text,
                  fontFamily: preset.font,
                  fontWeight: preset.weight,
                  fill: preset.fill,
                  fontSize: Math.round(preset.size * short),
                  charSpacing: preset.spacing ?? 0,
                  width: Math.round(editor.artboard.width * 0.7),
                })
              }
              className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-teal dark:hover:border-parchment hover:shadow-soft"
            >
              <span
                className="max-w-full truncate text-base"
                style={{
                  fontFamily: `"${preset.font}", serif`,
                  fontWeight: preset.weight,
                  color: preset.fill,
                  letterSpacing: preset.spacing ? '0.18em' : undefined,
                }}
              >
                {preset.text}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </PanelSection>
    </div>
  );
};

/* -------------------------------------------------------------- Uploads */

export const UploadsPanel: React.FC<{
  editor: DesignEditorApi;
  onError: (message: string) => void;
}> = ({ editor, onError }) => {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setAssets(await listAssets());
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not load your uploads.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!list.length) return;

      setUploading(true);
      try {
        for (const file of list) {
          const asset = await uploadAsset(file);
          setAssets((prev) => [asset, ...prev]);
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not upload that image.');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onError],
  );

  const remove = async (asset: DesignAsset) => {
    try {
      await deleteAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not delete that upload.');
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed px-3 py-4 text-center transition-colors ${
          dragOver
            ? 'border-teal bg-teal/5 dark:border-parchment dark:bg-parchment/5'
            : 'border-gray-250 dark:border-slate-700'
        }`}
      >
        <TextButton variant="primary" full onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Spinner /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload images'}
        </TextButton>
        <p className="mt-2 text-[10px] text-gray-450 dark:text-slate-500">or drop files here</p>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
        Select an image slot on the artboard first and a click here fills it, cropped to the slot.
        Otherwise the image lands in the centre — then use Properties to mask it into any shape.
      </p>

      {loading ? (
        <div className="flex justify-center py-8 text-gray-400">
          <Spinner className="h-5 w-5" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyHint
          icon={<Images className="h-8 w-8" />}
          title="No uploads yet"
          body="Anything you upload is kept here so you can reuse it across every design."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative">
              <button
                type="button"
                onClick={() => void editor.addImage(asset.url)}
                title={asset.filename ?? 'Add to canvas'}
                className="block aspect-square w-full overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-950 transition-all duration-150 hover:border-teal dark:hover:border-parchment hover:shadow-soft"
              >
                {/* Cloudinary hosts these; next/image is unoptimized project-wide. */}
                <Image
                  src={asset.url}
                  alt={asset.filename ?? 'Upload'}
                  width={asset.width ?? 200}
                  height={asset.height ?? 200}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  unoptimized
                />
              </button>
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Use as background"
                  onClick={() => void editor.setBackgroundImage(asset.url, 'cover')}
                  className="rounded-md bg-black/60 p-1 text-white backdrop-blur-sm hover:bg-black/85"
                >
                  <ImageIconLucide className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="Delete upload"
                  onClick={() => void remove(asset)}
                  className="rounded-md bg-black/60 p-1 text-white backdrop-blur-sm hover:bg-terracotta"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------------- Background */

const BackgroundImagePicker: React.FC<{
  editor: DesignEditorApi;
  onError: (message: string) => void;
}> = ({ editor, onError }) => {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listAssets()
      .then(setAssets)
      .catch(() => {
        /* the panel still works without the library */
      });
  }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const asset = await uploadAsset(files[0]);
      setAssets((prev) => [asset, ...prev]);
      await editor.setBackgroundImage(asset.url, editor.backgroundFit);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not upload that image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const fromUrl = async () => {
    setBusy(true);
    try {
      const result = await importFromUrl(url.trim());
      if (result.asset) {
        setAssets((prev) => [result.asset as DesignAsset, ...prev]);
        await editor.setBackgroundImage(result.asset.url, editor.backgroundFit);
        setUrl('');
      } else {
        onError('That link is an SVG — add it from the Elements panel instead.');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not import from that link.');
    } finally {
      setBusy(false);
    }
  };

  const fits: { value: BackgroundFit; label: string }[] = [
    { value: 'cover', label: 'Fill' },
    { value: 'contain', label: 'Fit' },
    { value: 'stretch', label: 'Stretch' },
  ];

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => void upload(e.target.files)}
        className="hidden"
      />

      <TextButton variant="outline" full onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Spinner /> : <UploadCloud className="h-3.5 w-3.5" />}
        Upload a background
      </TextButton>

      <div className="flex gap-1.5">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim()) void fromUrl();
          }}
          placeholder="Paste an image link"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:border-teal focus:outline-none"
        />
        <TextButton variant="outline" size="sm" disabled={busy || !url.trim()} onClick={() => void fromUrl()}>
          Use
        </TextButton>
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {assets.slice(0, 12).map((asset) => (
            <button
              key={asset.id}
              type="button"
              title={asset.filename ?? 'Use as background'}
              onClick={() => void editor.setBackgroundImage(asset.url, editor.backgroundFit)}
              className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-all hover:border-teal dark:hover:border-parchment"
            >
              <Image
                src={asset.url}
                alt={asset.filename ?? 'Upload'}
                width={120}
                height={120}
                className="h-full w-full object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {editor.hasBackgroundImage && (
        <div className="space-y-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">
          <Field label="Fit">
            <Segmented
              value={editor.backgroundFit}
              onChange={(v) => editor.setBackgroundFit(v)}
              options={fits.map((f) => ({ value: f.value, label: f.label }))}
            />
          </Field>
          <Field label="Blur">
            <Slider
              value={editor.backgroundAdjust.blur}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => editor.setBackgroundAdjustments({ blur: v })}
              onCommit={editor.commit}
            />
          </Field>
          <Field label="Brightness">
            <Slider
              value={editor.backgroundAdjust.brightness}
              min={-1}
              max={1}
              step={0.02}
              onChange={(v) => editor.setBackgroundAdjustments({ brightness: v })}
              onCommit={editor.commit}
            />
          </Field>
          <Field label="Opacity" hint="Lower values let the background colour show through.">
            <Slider
              value={editor.backgroundAdjust.opacity}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => editor.setBackgroundAdjustments({ opacity: v })}
              onCommit={editor.commit}
            />
          </Field>
          <TextButton variant="danger" size="sm" full onClick={editor.clearBackgroundImage}>
            <Trash2 className="h-3 w-3" />
            Remove background image
          </TextButton>
        </div>
      )}
    </div>
  );
};

export const BackgroundPanel: React.FC<{
  editor: DesignEditorApi;
  onError: (message: string) => void;
}> = ({ editor, onError }) => {
  const [mode, setMode] = useState<'solid' | 'gradient' | 'image'>('solid');
  const [solid, setSolid] = useState('#FFFCF5');
  const [from, setFrom] = useState('#FFFCF5');
  const [to, setTo] = useState('#EADFC8');
  const [angle, setAngle] = useState(135);

  const applyGradient = (nextFrom: string, nextTo: string, nextAngle: number) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setAngle(nextAngle);
    editor.setBackground({ type: 'gradient', from: nextFrom, to: nextTo, angle: nextAngle });
  };

  return (
    <div className="space-y-5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
          { value: 'image', label: 'Image' },
        ]}
      />

      {mode === 'solid' && (
        <PanelSection title="Background colour">
          <ColorPicker
            value={solid}
            onChange={(c) => {
              setSolid(c);
              editor.setBackground({ type: 'solid', color: c });
            }}
          />
        </PanelSection>
      )}

      {mode === 'gradient' && (
        <>
          <PanelSection title="Presets">
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  onClick={() => applyGradient(preset.from, preset.to, preset.angle)}
                  style={{
                    backgroundImage: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
                  }}
                  className="h-14 rounded-lg border border-black/10 dark:border-white/15 transition-transform duration-150 hover:scale-105"
                />
              ))}
            </div>
          </PanelSection>

          <PanelSection title="Custom gradient">
            <div className="space-y-3">
              <Field label="From">
                <ColorPicker value={from} onChange={(c) => applyGradient(c, to, angle)} />
              </Field>
              <Field label="To">
                <ColorPicker value={to} onChange={(c) => applyGradient(from, c, angle)} />
              </Field>
              <Field label={`Angle · ${angle}°`}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => applyGradient(from, to, Number(e.target.value))}
                  className="w-full accent-teal dark:accent-parchment"
                />
              </Field>
            </div>
          </PanelSection>
        </>
      )}

      {mode === 'image' && (
        <PanelSection title="Background image">
          <BackgroundImagePicker editor={editor} onError={onError} />
        </PanelSection>
      )}

      <PanelSection title="Brand palette">
        <div className="grid grid-cols-6 gap-1.5">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => {
                setMode('solid');
                setSolid(c.value);
                editor.setBackground({ type: 'solid', color: c.value });
              }}
              style={{ backgroundColor: c.value }}
              className="h-8 rounded-md border border-black/10 dark:border-white/15 transition-transform duration-150 hover:scale-110"
            />
          ))}
        </div>
      </PanelSection>
    </div>
  );
};

/* -------------------------------------------------------------- Layers */

const LayerRow: React.FC<{
  layer: LayerNode;
  index: number;
  total: number;
  editor: DesignEditorApi;
  dragging: string | null;
  setDragging: (id: string | null) => void;
  dropTarget: number | null;
  setDropTarget: (index: number | null) => void;
}> = ({ layer, index, total, editor, dragging, setDragging, dropTarget, setDropTarget }) => {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(layer.name);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable={!layer.locked}
      onDragStart={() => setDragging(layer.id)}
      onDragEnd={() => {
        setDragging(null);
        setDropTarget(null);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragging && dragging !== layer.id) setDropTarget(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragging && dragging !== layer.id) editor.reorderLayerTo(dragging, index);
        setDragging(null);
        setDropTarget(null);
      }}
      className={`rounded-lg border transition-all duration-150 ${
        dropTarget === index
          ? 'border-terracotta bg-terracotta/5'
          : layer.selected
            ? 'border-teal/40 bg-teal/8 dark:border-parchment/40 dark:bg-parchment/10'
            : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'
      } ${dragging === layer.id ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-1.5 px-1.5 py-1.5">
        <GripVertical
          className={`h-3.5 w-3.5 shrink-0 ${
            layer.locked ? 'text-gray-250 dark:text-slate-800' : 'cursor-grab text-gray-350 dark:text-slate-600'
          }`}
        />

        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          {layer.thumbnail ? (
            // A data URL rendered from the canvas — next/image would add
            // nothing here and cannot optimise it anyway.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={layer.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <LayersIcon className="h-3 w-3 text-gray-300 dark:text-slate-700" />
          )}
        </span>

        <button
          type="button"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) editor.toggleLayerInSelection(layer.id);
            else editor.selectLayer(layer.id);
          }}
          onDoubleClick={() => {
            setRenaming(true);
            setDraft(layer.name);
          }}
          disabled={layer.locked}
          className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
        >
          {renaming ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                editor.renameLayer(layer.id, draft);
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editor.renameLayer(layer.id, draft);
                  setRenaming(false);
                }
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="w-full rounded border border-teal bg-white px-1.5 py-0.5 text-[11px] font-semibold focus:outline-none dark:bg-slate-950"
            />
          ) : (
            <>
              <span className="block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                {layer.name}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-600">
                {layer.kind}
                {layer.opacity < 1 && ` · ${Math.round(layer.opacity * 100)}%`}
              </span>
            </>
          )}
        </button>

        <IconButton
          title={layer.visible ? 'Hide' : 'Show'}
          onClick={() => editor.toggleLayerVisible(layer.id)}
          className="h-6 w-6"
        >
          {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </IconButton>
        <IconButton
          title={layer.locked ? 'Unlock' : 'Lock'}
          onClick={() => editor.toggleLayerLock(layer.id)}
          className="h-6 w-6"
        >
          {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </IconButton>
        <IconButton
          title="More"
          active={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="h-6 w-6"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </IconButton>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-gray-150 px-2.5 pb-2.5 pt-2 dark:border-slate-800">
          <Field label="Opacity">
            <Slider
              value={Math.round(layer.opacity * 100)}
              min={0}
              max={100}
              onChange={(v) => editor.setLayerOpacity(layer.id, v / 100)}
              onCommit={() => editor.setLayerOpacity(layer.id, layer.opacity, true)}
              suffix="%"
            />
          </Field>
          <div className="flex gap-1">
            <IconButton
              title="Move up"
              onClick={() => editor.moveLayer(layer.id, 'up')}
              disabled={index === 0}
              className="h-7 flex-1 border-gray-200 dark:border-slate-700"
            >
              <ArrowUp className="h-3 w-3" />
            </IconButton>
            <IconButton
              title="Move down"
              onClick={() => editor.moveLayer(layer.id, 'down')}
              disabled={index === total - 1}
              className="h-7 flex-1 border-gray-200 dark:border-slate-700"
            >
              <ArrowDown className="h-3 w-3" />
            </IconButton>
            <IconButton
              title="Duplicate layer"
              onClick={() => void editor.duplicateLayer(layer.id)}
              className="h-7 flex-1 border-gray-200 dark:border-slate-700"
            >
              <Copy className="h-3 w-3" />
            </IconButton>
            <IconButton
              title="Delete layer"
              tone="danger"
              onClick={() => editor.deleteLayer(layer.id)}
              className="h-7 flex-1"
            >
              <Trash2 className="h-3 w-3" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
};

export const LayersPanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const allVisible = editor.layers.every((l) => l.visible);
  const allLocked = editor.layers.length > 0 && editor.layers.every((l) => l.locked);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return editor.layers;
    return editor.layers.filter(
      (l) => l.name.toLowerCase().includes(q) || l.kind.toLowerCase().includes(q),
    );
  }, [editor.layers, query]);

  if (!editor.layers.length) {
    return (
      <EmptyHint
        icon={<LayersIcon className="h-8 w-8" />}
        title="Nothing on the artboard"
        body="Add text, a shape or an image and every element shows up here, front to back."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search layers..."
          className="w-full bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
          {editor.layers.length} layer{editor.layers.length === 1 ? '' : 's'}
        </span>
        <div className="flex gap-1">
          <IconButton
            title={allVisible ? 'Hide all' : 'Show all'}
            onClick={() => editor.setAllLayersVisible(!allVisible)}
            className="h-6 w-6"
          >
            {allVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </IconButton>
          <IconButton
            title={allLocked ? 'Unlock all' : 'Lock all'}
            onClick={() => editor.setAllLayersLocked(!allLocked)}
            className="h-6 w-6"
          >
            {allLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </IconButton>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
        Drag to reorder · double-click to rename · ⌘/Ctrl-click to select several.
      </p>

      <div className="space-y-1">
        {visible.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            index={editor.layers.indexOf(layer)}
            total={editor.layers.length}
            editor={editor}
            dragging={dragging}
            setDragging={setDragging}
            dropTarget={dropTarget}
            setDropTarget={setDropTarget}
          />
        ))}
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center text-[11px] text-gray-400">
            No layer matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- Resize */

export const ResizePanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const [w, setW] = useState(editor.artboard.width);
  const [h, setH] = useState(editor.artboard.height);

  useEffect(() => {
    setW(editor.artboard.width);
    setH(editor.artboard.height);
  }, [editor.artboard.height, editor.artboard.width]);

  return (
    <div className="space-y-5">
      <PanelSection title="Custom size">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width (px)">
            <NumberInput value={w} onChange={setW} min={16} max={8000} />
          </Field>
          <Field label="Height (px)">
            <NumberInput value={h} onChange={setH} min={16} max={8000} />
          </Field>
        </div>
        <TextButton
          variant="primary"
          full
          onClick={() => editor.setArtboardSize(w, h)}
          disabled={w === editor.artboard.width && h === editor.artboard.height}
        >
          Resize artboard
        </TextButton>
        <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
          Resizing changes the canvas only — elements keep their position and size, so you may
          want to reposition them afterwards.
        </p>
      </PanelSection>

      {PRESET_GROUPS.map((group) => (
        <PanelSection key={group} title={group}>
          <div className="space-y-1.5">
            {SIZE_PRESETS.filter((p) => p.group === group).map((preset) => {
              const active =
                preset.width === editor.artboard.width && preset.height === editor.artboard.height;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => editor.setArtboardSize(preset.width, preset.height)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                    active
                      ? 'border-teal bg-teal/8 dark:border-parchment dark:bg-parchment/10'
                      : 'border-gray-200 dark:border-slate-700 hover:border-teal dark:hover:border-parchment'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {preset.label}
                      {active && <Check className="h-3 w-3 shrink-0 text-teal dark:text-parchment" />}
                    </span>
                    {preset.hint && (
                      <span className="block truncate text-[9px] text-gray-400">{preset.hint}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-gray-400">
                    {preset.width}×{preset.height}
                  </span>
                </button>
              );
            })}
          </div>
        </PanelSection>
      ))}
    </div>
  );
};

export const PanelIcons = { Sparkles, Wand2 };
