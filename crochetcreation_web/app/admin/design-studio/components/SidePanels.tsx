'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Images,
  Layers as LayersIcon,
  Lock,
  Trash2,
  Type as TypeIcon,
  Unlock,
  UploadCloud,
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
  Spinner,
  TextButton,
} from './ui';
import { BRAND_COLORS, GRADIENT_PRESETS, SIZE_PRESETS, PRESET_GROUPS } from '../lib/presets';
import { PRIMITIVES, SHAPE_GROUPS } from '../lib/shapes';
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateSpec } from '../lib/templates';
import { deleteAsset, listAssets, uploadAsset } from '../lib/api';
import type { DesignAsset } from '../lib/types';
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
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
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
            className="group overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 text-left transition-all hover:border-teal dark:hover:border-parchment hover:shadow-lift"
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
    className="flex aspect-square items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 transition-all hover:border-teal dark:hover:border-parchment hover:shadow-soft"
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

export const ElementsPanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const [color, setColor] = useState('#1F4E4A');

  return (
    <div className="space-y-5">
      <PanelSection title="Element colour">
        <Popover
          width="w-72"
          trigger={() => (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
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

      <PanelSection title="Basic shapes">
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
      </PanelSection>

      {SHAPE_GROUPS.map((group) => (
        <PanelSection key={group.id} title={group.label}>
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
        </PanelSection>
      ))}
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
  { name: 'Elegant Signature', font: 'Great Vibes', weight: 400, fill: '#C0663A', size: 0.1, text: 'Handmade' },
  { name: 'Editorial Serif', font: 'Bodoni Moda', weight: 700, fill: '#1F4E4A', size: 0.085, text: 'New Arrival' },
  { name: 'Bold Statement', font: 'Archivo Black', weight: 400, fill: '#23423C', size: 0.08, text: 'SALE' },
  { name: 'Quiet Label', font: 'Instrument Sans', weight: 600, fill: '#596661', size: 0.024, text: 'LIMITED EDITION', spacing: 500 },
  { name: 'Soft Script', font: 'Parisienne', weight: 400, fill: '#D99A86', size: 0.09, text: 'with love' },
  { name: 'Ticket Mono', font: 'JetBrains Mono', weight: 700, fill: '#1F4E4A', size: 0.05, text: 'CODE10', spacing: 200 },
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
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-left transition-all hover:border-teal dark:hover:border-parchment hover:shadow-soft"
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
              className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 transition-all hover:border-teal dark:hover:border-parchment"
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const asset = await uploadAsset(file);
        setAssets((prev) => [asset, ...prev]);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not upload that image.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

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

      <TextButton variant="primary" full onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Spinner /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? 'Uploading…' : 'Upload images'}
      </TextButton>

      <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
        Select an image slot on the artboard first and a click here will fill it, cropped to the
        slot. Otherwise the image is placed in the centre.
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
                className="block aspect-square w-full overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-950 transition-all hover:border-teal dark:hover:border-parchment"
              >
                {/* Cloudinary hosts these; next/image is unoptimized project-wide. */}
                <Image
                  src={asset.url}
                  alt={asset.filename ?? 'Upload'}
                  width={asset.width ?? 200}
                  height={asset.height ?? 200}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Use as background"
                  onClick={() => void editor.setBackgroundImage(asset.url)}
                  className="rounded-md bg-black/60 p-1 text-white backdrop-blur-sm hover:bg-black/80"
                >
                  <ImagePlus className="h-3 w-3" />
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

export const BackgroundPanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const [mode, setMode] = useState<'solid' | 'gradient'>('solid');
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
        ]}
      />

      {mode === 'solid' ? (
        <PanelSection title="Background colour">
          <ColorPicker
            value={solid}
            onChange={(c) => {
              setSolid(c);
              editor.setBackground({ type: 'solid', color: c });
            }}
          />
        </PanelSection>
      ) : (
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
                  className="h-14 rounded-lg border border-black/10 dark:border-white/15 transition-transform hover:scale-105"
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
              <Field label="Angle">
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
              className="h-8 rounded-md border border-black/10 dark:border-white/15 transition-transform hover:scale-110"
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Background image">
        <TextButton variant="outline" full onClick={() => editor.clearBackgroundImage()}>
          Remove background image
        </TextButton>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
          Set one from the Uploads panel — hover an image and pick the frame icon.
        </p>
      </PanelSection>
    </div>
  );
};

/* -------------------------------------------------------------- Layers */

export const LayersPanel: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

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
    <div className="space-y-1.5">
      {editor.layers.map((layer, index) => (
        <div
          key={layer.id}
          className={`group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors ${
            layer.selected
              ? 'border-teal/40 bg-teal/8 dark:border-parchment/40 dark:bg-parchment/10'
              : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => editor.selectLayer(layer.id)}
            onDoubleClick={() => {
              setEditingId(layer.id);
              setDraft(layer.name);
            }}
            disabled={layer.locked}
            className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
          >
            {editingId === layer.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  editor.renameLayer(layer.id, draft);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editor.renameLayer(layer.id, draft);
                    setEditingId(null);
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-full rounded border border-teal bg-white dark:bg-slate-950 px-1.5 py-0.5 text-[11px] font-semibold focus:outline-none"
              />
            ) : (
              <>
                <span className="block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {layer.name}
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-600">
                  {layer.kind}
                </span>
              </>
            )}
          </button>

          <div className="flex shrink-0 items-center">
            <IconButton
              title="Move up"
              onClick={() => editor.moveLayer(layer.id, 'up')}
              disabled={index === 0}
              className="h-6 w-6"
            >
              <ArrowUp className="h-3 w-3" />
            </IconButton>
            <IconButton
              title="Move down"
              onClick={() => editor.moveLayer(layer.id, 'down')}
              disabled={index === editor.layers.length - 1}
              className="h-6 w-6"
            >
              <ArrowDown className="h-3 w-3" />
            </IconButton>
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
              title="Delete layer"
              tone="danger"
              onClick={() => editor.deleteLayer(layer.id)}
              className="h-6 w-6"
            >
              <Trash2 className="h-3 w-3" />
            </IconButton>
          </div>
        </div>
      ))}
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
                    <span className="block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {preset.label}
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
