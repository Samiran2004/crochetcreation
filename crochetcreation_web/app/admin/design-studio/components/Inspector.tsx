'use client';

import React, { useCallback, useMemo } from 'react';
import type * as FabricNS from 'fabric';
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  Bold,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  ChevronsDown,
  ChevronsUp,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Group as GroupIcon,
  Italic,
  MousePointerClick,
  Strikethrough,
  Trash2,
  Underline,
  Ungroup,
} from 'lucide-react';
import {
  ColorButton,
  EmptyHint,
  Field,
  IconButton,
  NumberInput,
  PanelSection,
  Segmented,
  Slider,
  TextButton,
  Toggle,
} from './ui';
import { FontPicker } from './FontPicker';
import {
  CROP_RATIOS,
  MASK_OPTIONS,
  currentMaskId,
  fillToColor,
  isGradientFill,
  makeLinearGradient,
  meta,
} from '../lib/engine';
import { FONT_SIZE_STEPS, GRADIENT_PRESETS } from '../lib/presets';
import { fontSupportsItalic, getFontWeights, loadFont } from '../lib/fonts';
import type { DesignEditorApi } from './useDesignEditor';

type AnyObj = FabricNS.FabricObject & Record<string, unknown>;

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

/* ------------------------------------------------------- shared blocks */

const TransformBlock: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => (
  <PanelSection title="Position & size">
    <div className="grid grid-cols-2 gap-2">
      <Field label="X">
        <NumberInput
          value={Math.round(num(obj.left))}
          onChange={(v) => editor.update({ left: v })}
          onCommit={editor.commit}
        />
      </Field>
      <Field label="Y">
        <NumberInput
          value={Math.round(num(obj.top))}
          onChange={(v) => editor.update({ top: v })}
          onCommit={editor.commit}
        />
      </Field>
      <Field label="Width">
        <NumberInput
          value={Math.round(obj.getScaledWidth())}
          min={1}
          onChange={(v) => {
            // Text frames reflow rather than stretch, so width is set on the
            // box; everything else is scaled from its intrinsic size.
            if (obj.type === 'textbox') editor.update({ width: Math.max(10, v) });
            else editor.update({ scaleX: Math.max(0.01, v / Math.max(1, num(obj.width, 1))) });
          }}
          onCommit={editor.commit}
        />
      </Field>
      <Field label="Height">
        <NumberInput
          value={Math.round(obj.getScaledHeight())}
          min={1}
          onChange={(v) =>
            editor.update({ scaleY: Math.max(0.01, v / Math.max(1, num(obj.height, 1))) })
          }
          onCommit={editor.commit}
        />
      </Field>
    </div>

    <Field label="Rotation">
      <Slider
        value={Math.round(num(obj.angle))}
        min={-180}
        max={180}
        onChange={(v) => editor.update({ angle: v })}
        onCommit={editor.commit}
        suffix="°"
      />
    </Field>

    <div className="flex gap-1.5">
      <IconButton
        title="Flip horizontally"
        onClick={() => editor.update({ flipX: !obj.flipX }, { commit: true })}
        className="h-8 flex-1 border-gray-200 dark:border-slate-700"
      >
        <FlipHorizontal className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Flip vertically"
        onClick={() => editor.update({ flipY: !obj.flipY }, { commit: true })}
        className="h-8 flex-1 border-gray-200 dark:border-slate-700"
      >
        <FlipVertical className="h-4 w-4" />
      </IconButton>
    </div>
  </PanelSection>
);

const OpacityBlock: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => (
  <PanelSection title="Opacity">
    <Slider
      value={Math.round(num(obj.opacity, 1) * 100)}
      min={0}
      max={100}
      onChange={(v) => editor.update({ opacity: v / 100 })}
      onCommit={editor.commit}
      suffix="%"
    />
  </PanelSection>
);

const ShadowBlock: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => {
  const shadow = obj.shadow as FabricNS.Shadow | null | undefined;
  const enabled = !!shadow;

  const patch = useCallback(
    (next: Partial<{ color: string; blur: number; offsetX: number; offsetY: number }>) => {
      const fabric = editor.fabricRef.current;
      if (!fabric) return;
      const current = obj.shadow as FabricNS.Shadow | null | undefined;
      editor.update({
        shadow: new fabric.Shadow({
          color: next.color ?? current?.color ?? 'rgba(35, 66, 60, 0.35)',
          blur: next.blur ?? current?.blur ?? 18,
          offsetX: next.offsetX ?? current?.offsetX ?? 0,
          offsetY: next.offsetY ?? current?.offsetY ?? 10,
        }),
      });
    },
    [editor, obj],
  );

  return (
    <PanelSection title="Shadow">
      <Toggle
        checked={enabled}
        label="Drop shadow"
        onChange={(on) => {
          if (!on) editor.update({ shadow: null }, { commit: true });
          else patch({});
        }}
      />
      {enabled && shadow && (
        <div className="space-y-2.5 pt-1">
          <Field label="Colour">
            <ColorButton
              value={shadow.color}
              onChange={(c) => patch({ color: c })}
              onCommit={editor.commit}
            />
          </Field>
          <Field label="Blur">
            <Slider
              value={shadow.blur}
              min={0}
              max={120}
              onChange={(v) => patch({ blur: v })}
              onCommit={editor.commit}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Offset X">
              <NumberInput
                value={shadow.offsetX}
                onChange={(v) => patch({ offsetX: v })}
                onCommit={editor.commit}
              />
            </Field>
            <Field label="Offset Y">
              <NumberInput
                value={shadow.offsetY}
                onChange={(v) => patch({ offsetY: v })}
                onCommit={editor.commit}
              />
            </Field>
          </div>
        </div>
      )}
    </PanelSection>
  );
};

const FillBlock: React.FC<{
  editor: DesignEditorApi;
  obj: AnyObj;
  title?: string;
}> = ({ editor, obj, title = 'Fill' }) => {
  const gradient = isGradientFill(obj.fill);
  const solid = fillToColor(obj.fill, '#1F4E4A');

  return (
    <PanelSection title={title}>
      <Segmented
        value={gradient ? 'gradient' : 'solid'}
        onChange={(mode) => {
          const fabric = editor.fabricRef.current;
          if (!fabric) return;
          if (mode === 'solid') editor.update({ fill: solid }, { commit: true });
          else
            editor.update(
              { fill: makeLinearGradient(fabric, solid, '#C79A4B', 135) },
              { commit: true },
            );
        }}
        options={[
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
        ]}
      />

      {gradient ? (
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              onClick={() => {
                const fabric = editor.fabricRef.current;
                if (!fabric) return;
                editor.update(
                  { fill: makeLinearGradient(fabric, preset.from, preset.to, preset.angle) },
                  { commit: true },
                );
              }}
              style={{
                backgroundImage: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
              }}
              className="h-9 rounded-md border border-black/10 dark:border-white/15 transition-transform hover:scale-105"
            />
          ))}
        </div>
      ) : (
        <ColorButton
          value={solid}
          onChange={(c) => editor.update({ fill: c })}
          onCommit={editor.commit}
          allowTransparent
        />
      )}
    </PanelSection>
  );
};

const StrokeBlock: React.FC<{ editor: DesignEditorApi; obj: AnyObj; label?: string }> = ({
  editor,
  obj,
  label = 'Border',
}) => {
  const strokeWidth = num(obj.strokeWidth);
  const dashed = Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length > 0;

  return (
    <PanelSection title={label}>
      <Field label="Colour">
        <ColorButton
          value={str(obj.stroke, '#1F4E4A')}
          onChange={(c) => editor.update({ stroke: c })}
          onCommit={editor.commit}
        />
      </Field>
      <Field label="Thickness">
        <Slider
          value={strokeWidth}
          min={0}
          max={60}
          onChange={(v) => editor.update({ strokeWidth: v, strokeUniform: true })}
          onCommit={editor.commit}
        />
      </Field>
      <Toggle
        checked={dashed}
        label="Dashed"
        onChange={(on) =>
          editor.update(
            { strokeDashArray: on ? [Math.max(6, strokeWidth * 3), Math.max(5, strokeWidth * 2)] : null },
            { commit: true },
          )
        }
      />
    </PanelSection>
  );
};

/* ------------------------------------------------------------ text */

const TextInspector: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => {
  const family = str(obj.fontFamily, 'Playfair Display');
  const weights = useMemo(() => getFontWeights(family), [family]);
  const weight = num(obj.fontWeight, 400);
  const italic = str(obj.fontStyle) === 'italic';
  const align = str(obj.textAlign, 'left') as 'left' | 'center' | 'right' | 'justify';

  const transformCase = (mode: 'upper' | 'lower' | 'title') => {
    const text = str(obj.text);
    if (!text) return;
    const next =
      mode === 'upper'
        ? text.toUpperCase()
        : mode === 'lower'
          ? text.toLowerCase()
          : text
              .toLowerCase()
              .replace(/(^|\s|["'(‘“])([a-z])/g, (_m, p, c: string) => p + c.toUpperCase());
    editor.update({ text: next }, { commit: true });
  };

  return (
    <div className="space-y-5">
      <PanelSection title="Font">
        <FontPicker
          value={family}
          onChange={(next) => {
            // Paint only once the face is really available, otherwise fabric
            // measures the fallback and the frame jumps a moment later.
            void loadFont(next, weight).then(() => {
              editor.update({ fontFamily: next }, { commit: true });
            });
          }}
        />

        <div className="grid grid-cols-2 gap-2">
          <Field label="Weight">
            <select
              value={weights.includes(weight) ? weight : weights[0]}
              onChange={(e) => {
                const next = Number(e.target.value);
                void loadFont(family, next).then(() =>
                  editor.update({ fontWeight: next }, { commit: true }),
                );
              }}
              className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-teal focus:outline-none"
            >
              {weights.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <select
              value={
                FONT_SIZE_STEPS.includes(Math.round(num(obj.fontSize, 40)))
                  ? Math.round(num(obj.fontSize, 40))
                  : ''
              }
              onChange={(e) => editor.update({ fontSize: Number(e.target.value) }, { commit: true })}
              className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-teal focus:outline-none"
            >
              <option value="">{Math.round(num(obj.fontSize, 40))} px</option>
              {FONT_SIZE_STEPS.map((s) => (
                <option key={s} value={s}>
                  {s} px
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Exact size">
          <Slider
            value={Math.round(num(obj.fontSize, 40))}
            min={4}
            max={480}
            onChange={(v) => editor.update({ fontSize: v })}
            onCommit={editor.commit}
            suffix="px"
          />
        </Field>
      </PanelSection>

      <PanelSection title="Style">
        <div className="flex flex-wrap gap-1.5">
          <IconButton
            title="Bold"
            active={weight >= 600}
            onClick={() => {
              const next = weight >= 600 ? 400 : (weights.find((w) => w >= 700) ?? 700);
              void loadFont(family, next).then(() =>
                editor.update({ fontWeight: next }, { commit: true }),
              );
            }}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <Bold className="h-4 w-4" />
          </IconButton>
          <IconButton
            title={fontSupportsItalic(family) ? 'Italic' : 'This font has no italic'}
            active={italic}
            disabled={!fontSupportsItalic(family)}
            onClick={() =>
              editor.update({ fontStyle: italic ? 'normal' : 'italic' }, { commit: true })
            }
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <Italic className="h-4 w-4" />
          </IconButton>
          <IconButton
            title="Underline"
            active={obj.underline === true}
            onClick={() => editor.update({ underline: !obj.underline }, { commit: true })}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <Underline className="h-4 w-4" />
          </IconButton>
          <IconButton
            title="Strikethrough"
            active={obj.linethrough === true}
            onClick={() => editor.update({ linethrough: !obj.linethrough }, { commit: true })}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <Strikethrough className="h-4 w-4" />
          </IconButton>
          <span className="mx-1 w-px self-stretch bg-gray-200 dark:bg-slate-700" />
          <IconButton
            title="UPPERCASE"
            onClick={() => transformCase('upper')}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <CaseUpper className="h-4 w-4" />
          </IconButton>
          <IconButton
            title="lowercase"
            onClick={() => transformCase('lower')}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <CaseLower className="h-4 w-4" />
          </IconButton>
          <IconButton
            title="Title Case"
            onClick={() => transformCase('title')}
            className="h-8 w-8 border-gray-200 dark:border-slate-700"
          >
            <CaseSensitive className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex gap-1.5 pt-1">
          {([
            { v: 'left', icon: <AlignLeft className="h-4 w-4" />, t: 'Align left' },
            { v: 'center', icon: <AlignCenter className="h-4 w-4" />, t: 'Align centre' },
            { v: 'right', icon: <AlignRight className="h-4 w-4" />, t: 'Align right' },
            { v: 'justify', icon: <AlignJustify className="h-4 w-4" />, t: 'Justify' },
          ] as const).map((o) => (
            <IconButton
              key={o.v}
              title={o.t}
              active={align === o.v}
              onClick={() => editor.update({ textAlign: o.v }, { commit: true })}
              className="h-8 flex-1 border-gray-200 dark:border-slate-700"
            >
              {o.icon}
            </IconButton>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Spacing">
        <Field label="Letter spacing">
          <Slider
            value={Math.round(num(obj.charSpacing))}
            min={-200}
            max={1200}
            step={10}
            onChange={(v) => editor.update({ charSpacing: v })}
            onCommit={editor.commit}
          />
        </Field>
        <Field label="Line height">
          <Slider
            value={num(obj.lineHeight, 1.16)}
            min={0.6}
            max={3}
            step={0.02}
            onChange={(v) => editor.update({ lineHeight: v })}
            onCommit={editor.commit}
          />
        </Field>
      </PanelSection>

      <FillBlock editor={editor} obj={obj} title="Text colour" />

      <PanelSection title="Outline">
        <Field label="Colour">
          <ColorButton
            value={str(obj.stroke, '#FFFFFF')}
            onChange={(c) => editor.update({ stroke: c, paintFirst: 'stroke' })}
            onCommit={editor.commit}
          />
        </Field>
        <Field label="Thickness">
          <Slider
            value={num(obj.strokeWidth)}
            min={0}
            max={24}
            step={0.5}
            onChange={(v) =>
              editor.update({ strokeWidth: v, paintFirst: 'stroke', strokeUniform: true })
            }
            onCommit={editor.commit}
          />
        </Field>
      </PanelSection>

      <PanelSection title="Highlight">
        <ColorButton
          value={str(obj.textBackgroundColor, 'transparent')}
          onChange={(c) => editor.update({ textBackgroundColor: c })}
          onCommit={editor.commit}
          allowTransparent
        />
      </PanelSection>

      <ShadowBlock editor={editor} obj={obj} />
      <OpacityBlock editor={editor} obj={obj} />
      <TransformBlock editor={editor} obj={obj} />
    </div>
  );
};

/* ----------------------------------------------------------- image */

const FILTER_PRESETS = [
  { id: 'none', label: 'Original' },
  { id: 'Grayscale', label: 'Mono' },
  { id: 'Sepia', label: 'Sepia' },
  { id: 'Vintage', label: 'Vintage' },
  { id: 'Polaroid', label: 'Polaroid' },
  { id: 'Kodachrome', label: 'Kodak' },
  { id: 'Technicolor', label: 'Techni' },
  { id: 'Brownie', label: 'Brownie' },
  { id: 'BlackWhite', label: 'High contrast' },
  { id: 'Invert', label: 'Invert' },
] as const;

type PresetId = (typeof FILTER_PRESETS)[number]['id'];

const ADJUSTMENTS = [
  { key: 'Brightness', prop: 'brightness', label: 'Brightness', min: -1, max: 1 },
  { key: 'Contrast', prop: 'contrast', label: 'Contrast', min: -1, max: 1 },
  { key: 'Saturation', prop: 'saturation', label: 'Saturation', min: -1, max: 1 },
  { key: 'HueRotation', prop: 'rotation', label: 'Hue', min: -1, max: 1 },
  { key: 'Blur', prop: 'blur', label: 'Blur', min: 0, max: 1 },
] as const;

const ImageInspector: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => {
  const image = obj as unknown as FabricNS.FabricImage;
  const filters = (image.filters ?? []) as unknown as ({ type: string } & Record<string, unknown>)[];

  const findFilter = (type: string) => filters.find((f) => f.type === type);
  const activePreset: PresetId =
    (FILTER_PRESETS.map((p) => p.id).find((id) => id !== 'none' && !!findFilter(id)) as PresetId) ??
    'none';

  /**
   * Rebuild the whole filter chain rather than mutate it in place.
   *
   * Fabric caches the filtered bitmap, and a partially-updated chain leaves
   * the cache and the declared filters out of step — so a single source of
   * truth (preset + adjustments) is reassembled on every change.
   */
  const rebuild = useCallback(
    (preset: PresetId, adjustments: Record<string, number>) => {
      const fabric = editor.fabricRef.current;
      if (!fabric) return;
      const next: FabricNS.filters.BaseFilter<string>[] = [];

      if (preset !== 'none') {
        const Ctor = (fabric.filters as unknown as Record<string, new () => FabricNS.filters.BaseFilter<string>>)[preset];
        if (Ctor) next.push(new Ctor());
      }

      ADJUSTMENTS.forEach(({ key, prop }) => {
        const value = adjustments[key];
        if (value === undefined || value === 0) return;
        const Ctor = (fabric.filters as unknown as Record<string, new (o: Record<string, number>) => FabricNS.filters.BaseFilter<string>>)[key];
        if (Ctor) next.push(new Ctor({ [prop]: value }));
      });

      image.filters = next;
      image.applyFilters();
      editor.canvasRef.current?.requestRenderAll();
      editor.commit();
    },
    [editor, image],
  );

  const currentAdjustments = useMemo(() => {
    const out: Record<string, number> = {};
    ADJUSTMENTS.forEach(({ key, prop }) => {
      const found = findFilter(key);
      out[key] = found ? num(found[prop]) : 0;
    });
    return out;
    // `filters` is re-read from the live object on every editor tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.tick, filters.length]);

  const radius = (() => {
    const clip = obj.clipPath as FabricNS.Rect | undefined;
    return clip ? num(clip.rx) * num(obj.scaleX, 1) : 0;
  })();

  const setRadius = (value: number) => {
    const fabric = editor.fabricRef.current;
    if (!fabric) return;
    const scaleX = num(obj.scaleX, 1) || 1;
    const scaleY = num(obj.scaleY, 1) || 1;
    if (value <= 0) {
      editor.update({ clipPath: undefined }, { commit: true });
      return;
    }
    const clip = new fabric.Rect({
      width: num(obj.width, 1),
      height: num(obj.height, 1),
      rx: value / scaleX,
      ry: value / scaleY,
      originX: 'center',
      originY: 'center',
    });
    editor.update({ clipPath: clip }, { commit: true });
  };

  const activeMask = currentMaskId(obj);

  return (
    <div className="space-y-5">
      <PanelSection
        title="Shape"
        action={
          activeMask !== 'none' ? (
            <button
              type="button"
              onClick={() => editor.setMask(MASK_OPTIONS[0])}
              className="text-[10px] font-bold uppercase tracking-wider text-terracotta hover:underline"
            >
              Clear
            </button>
          ) : undefined
        }
      >
        <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
          Mask the photo into any silhouette — a square upload becomes a circle, an arch, a heart,
          anything. The original is never altered, so you can change or remove the shape later.
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {MASK_OPTIONS.map((mask) => (
            <button
              key={mask.id}
              type="button"
              title={mask.label}
              aria-label={mask.label}
              onClick={() => editor.setMask(mask)}
              className={`flex aspect-square items-center justify-center rounded-lg border p-1.5 transition-all duration-150 ${
                activeMask === mask.id
                  ? 'border-teal bg-teal/10 dark:border-parchment dark:bg-parchment/10'
                  : 'border-gray-200 hover:border-teal dark:border-slate-700 dark:hover:border-parchment'
              }`}
            >
              {mask.path ? (
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <path d={mask.path} className="fill-teal dark:fill-parchment" />
                </svg>
              ) : (
                <span className="text-[8px] font-black uppercase text-gray-400">None</span>
              )}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Crop">
        <div className="grid grid-cols-3 gap-1.5">
          {CROP_RATIOS.map((crop) => (
            <button
              key={crop.id}
              type="button"
              onClick={() => editor.setCropRatio(crop.ratio)}
              className="rounded-lg border border-gray-200 px-2 py-2 text-[10px] font-bold text-slate-500 transition-colors hover:border-teal hover:text-teal dark:border-slate-700 dark:text-slate-400 dark:hover:border-parchment dark:hover:text-parchment"
            >
              {crop.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
          Cropping is lossless — pick Original at any time to bring the full frame back.
        </p>
      </PanelSection>

      <PanelSection title="Filters">
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => rebuild(preset.id, currentAdjustments)}
              className={`rounded-lg border px-2 py-2 text-[10px] font-bold transition-colors ${
                activePreset === preset.id
                  ? 'border-teal bg-teal/10 text-teal dark:border-parchment dark:bg-parchment/10 dark:text-parchment'
                  : 'border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal dark:hover:border-parchment'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection
        title="Adjust"
        action={
          <button
            type="button"
            onClick={() => rebuild('none', {})}
            className="text-[10px] font-bold uppercase tracking-wider text-terracotta hover:underline"
          >
            Reset
          </button>
        }
      >
        {ADJUSTMENTS.map(({ key, label, min, max }) => (
          <Field key={key} label={label}>
            <Slider
              value={currentAdjustments[key] ?? 0}
              min={min}
              max={max}
              step={0.02}
              onChange={(v) => rebuild(activePreset, { ...currentAdjustments, [key]: v })}
            />
          </Field>
        ))}
      </PanelSection>

      <PanelSection title="Corner radius">
        <Slider
          value={Math.round(radius)}
          min={0}
          max={Math.round(Math.min(obj.getScaledWidth(), obj.getScaledHeight()) / 2)}
          onChange={setRadius}
        />
      </PanelSection>

      <StrokeBlock editor={editor} obj={obj} />
      <ShadowBlock editor={editor} obj={obj} />
      <OpacityBlock editor={editor} obj={obj} />
      <TransformBlock editor={editor} obj={obj} />
    </div>
  );
};

/* ----------------------------------------------------------- shape */

const ShapeInspector: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => {
  const isRect = obj.type === 'rect';
  const isSlot = !!meta(obj).dsSlot;

  return (
    <div className="space-y-5">
      {isSlot && (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-3 py-2.5">
          <p className="text-[11px] font-bold text-terracotta-deep">Image slot</p>
          <p className="mt-1 text-[10px] leading-relaxed text-terracotta-deep/80">
            Keep this selected and click an image in the Uploads panel — it will be cropped to fill
            exactly this frame.
          </p>
        </div>
      )}

      <FillBlock editor={editor} obj={obj} />

      {isRect && (
        <PanelSection title="Corner radius">
          <Slider
            value={Math.round(num(obj.rx))}
            min={0}
            max={Math.round(Math.min(num(obj.width, 2), num(obj.height, 2)) / 2)}
            onChange={(v) => editor.update({ rx: v, ry: v })}
            onCommit={editor.commit}
          />
        </PanelSection>
      )}

      <StrokeBlock editor={editor} obj={obj} label="Stroke" />
      <ShadowBlock editor={editor} obj={obj} />
      <OpacityBlock editor={editor} obj={obj} />
      <TransformBlock editor={editor} obj={obj} />
    </div>
  );
};

/* ------------------------------------------------------- multi / group */

const MultiInspector: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => (
  <div className="space-y-5">
    <PanelSection title={`${editor.selectionCount} objects selected`}>
      <div className="grid grid-cols-3 gap-1.5">
        {([
          { m: 'left', icon: <AlignLeft className="h-4 w-4" />, t: 'Align left' },
          { m: 'center-h', icon: <AlignHorizontalJustifyCenter className="h-4 w-4" />, t: 'Centre horizontally' },
          { m: 'right', icon: <AlignRight className="h-4 w-4" />, t: 'Align right' },
          { m: 'top', icon: <ChevronsUp className="h-4 w-4" />, t: 'Align top' },
          { m: 'center-v', icon: <AlignVerticalJustifyCenter className="h-4 w-4" />, t: 'Centre vertically' },
          { m: 'bottom', icon: <ChevronsDown className="h-4 w-4" />, t: 'Align bottom' },
        ] as const).map((o) => (
          <IconButton
            key={o.m}
            title={o.t}
            onClick={() => editor.align(o.m)}
            className="h-9 border-gray-200 dark:border-slate-700"
          >
            {o.icon}
          </IconButton>
        ))}
      </div>
    </PanelSection>

    <PanelSection title="Distribute">
      <div className="grid grid-cols-2 gap-1.5">
        <TextButton
          variant="outline"
          onClick={() => editor.distribute('h')}
          disabled={editor.selectionCount < 3}
        >
          Horizontally
        </TextButton>
        <TextButton
          variant="outline"
          onClick={() => editor.distribute('v')}
          disabled={editor.selectionCount < 3}
        >
          Vertically
        </TextButton>
      </div>
      {editor.selectionCount < 3 && (
        <p className="text-[10px] text-gray-400">Select three or more objects to distribute.</p>
      )}
    </PanelSection>

    <PanelSection title="Combine">
      <TextButton variant="primary" full onClick={editor.groupSelection}>
        <GroupIcon className="h-4 w-4" />
        Group selection
      </TextButton>
    </PanelSection>
  </div>
);

const GroupInspector: React.FC<{ editor: DesignEditorApi; obj: AnyObj }> = ({ editor, obj }) => (
  <div className="space-y-5">
    <PanelSection title="Group">
      <TextButton variant="outline" full onClick={editor.ungroupSelection}>
        <Ungroup className="h-4 w-4" />
        Ungroup
      </TextButton>
    </PanelSection>
    <ShadowBlock editor={editor} obj={obj} />
    <OpacityBlock editor={editor} obj={obj} />
    <TransformBlock editor={editor} obj={obj} />
  </div>
);

/* ---------------------------------------------------------------- root */

export const Inspector: React.FC<{ editor: DesignEditorApi }> = ({ editor }) => {
  const obj = editor.activeObject() as AnyObj | null;
  const kind = editor.selectionKind;

  if (!obj || kind === 'none') {
    return (
      <EmptyHint
        icon={<MousePointerClick className="h-8 w-8" />}
        title="Nothing selected"
        body="Click any element on the artboard to style it. Everything about it — type, colour, effects, position — shows up here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-800 pb-3">
        <IconButton
          title="Duplicate (⌘D)"
          onClick={() => void editor.duplicateSelection()}
          className="h-8 w-8 border-gray-200 dark:border-slate-700"
        >
          <Copy className="h-4 w-4" />
        </IconButton>
        <IconButton
          title="Bring forward"
          onClick={() => editor.reorder('forward')}
          className="h-8 w-8 border-gray-200 dark:border-slate-700"
        >
          <ChevronsUp className="h-4 w-4" />
        </IconButton>
        <IconButton
          title="Send backward"
          onClick={() => editor.reorder('backward')}
          className="h-8 w-8 border-gray-200 dark:border-slate-700"
        >
          <ChevronsDown className="h-4 w-4" />
        </IconButton>
        <div className="flex-1" />
        <IconButton
          title="Delete (Del)"
          tone="danger"
          onClick={editor.removeSelected}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>

      {kind === 'multiple' && <MultiInspector editor={editor} />}
      {kind === 'group' && <GroupInspector editor={editor} obj={obj} />}
      {kind === 'text' && <TextInspector editor={editor} obj={obj} />}
      {kind === 'image' && <ImageInspector editor={editor} obj={obj} />}
      {(kind === 'shape' || kind === 'path') && <ShapeInspector editor={editor} obj={obj} />}
    </div>
  );
};
