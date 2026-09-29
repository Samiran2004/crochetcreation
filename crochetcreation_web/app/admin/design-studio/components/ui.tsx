'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { ACCENT_COLORS, BRAND_COLORS, NEUTRAL_COLORS } from '../lib/presets';

/* Shared controls for the Studio's panels. They exist so every slider, swatch
   and popover behaves identically no matter which inspector renders it. */

export const PanelSection: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = '' }) => (
  <div className={`space-y-2.5 ${className}`}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
        {title}
      </p>
      {action}
    </div>
    {children}
  </div>
);

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-slate-500">
      {label}
    </span>
    {children}
    {hint && <span className="block text-[10px] text-gray-400 dark:text-slate-600">{hint}</span>}
  </label>
);

export const IconButton: React.FC<{
  onClick?: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
  className?: string;
}> = ({ onClick, title, active, disabled, children, tone = 'default', className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-lg border transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
      active
        ? 'bg-teal text-parchment border-teal dark:bg-parchment dark:text-teal dark:border-parchment'
        : tone === 'danger'
          ? 'border-transparent text-terracotta hover:bg-terracotta/10 hover:border-terracotta/25'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-parchment'
    } ${className}`}
  >
    {children}
  </button>
);

export const TextButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  disabled?: boolean;
  full?: boolean;
  size?: 'sm' | 'md';
  title?: string;
}> = ({ onClick, children, variant = 'ghost', disabled, full, size = 'md', title }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-bold tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizing = size === 'sm' ? 'px-2.5 py-1.5 text-[10px]' : 'px-3.5 py-2 text-xs';
  const tones = {
    primary: 'bg-teal text-parchment hover:bg-teal-deep shadow-sm dark:bg-parchment dark:text-teal dark:hover:bg-parchment-deep',
    outline:
      'border border-gray-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal hover:text-teal dark:hover:border-parchment dark:hover:text-parchment',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800',
    danger: 'bg-terracotta text-white hover:bg-terracotta-deep shadow-sm',
  } as const;
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizing} ${tones[variant]} ${full ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  suffix?: string;
}> = ({ value, min, max, step = 1, onChange, onCommit, suffix }) => (
  <div className="flex items-center gap-2.5">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onMouseUp={onCommit}
      onTouchEnd={onCommit}
      onKeyUp={onCommit}
      className="flex-1 h-1.5 accent-teal dark:accent-parchment cursor-pointer"
    />
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      onBlur={onCommit}
      className="w-16 shrink-0 rounded-md border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:border-teal dark:focus:border-parchment focus:outline-none"
    />
    {suffix && <span className="text-[10px] text-gray-400 shrink-0">{suffix}</span>}
  </div>
);

export const NumberInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, onCommit, min, max, step = 1 }) => (
  <input
    type="number"
    value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
    onBlur={onCommit}
    className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-teal dark:focus:border-parchment focus:outline-none"
  />
);

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-slate-950 p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        title={o.title}
        onClick={() => onChange(o.value)}
        className={`flex-1 inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-bold transition-all ${
          value === o.value
            ? 'bg-white dark:bg-slate-800 text-ink dark:text-parchment shadow-xs'
            : 'text-slate-500 dark:text-slate-500 hover:text-ink dark:hover:text-parchment'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/**
 * Place a floating panel against an anchor, in viewport coordinates.
 *
 * The Studio's panels scroll, and a scrolling box clips its own overflow on
 * *both* axes — so a dropdown rendered inside one gets sliced off at the
 * panel edge no matter how high its z-index is. Floating panels therefore
 * render into `document.body` and are positioned here: measured from the
 * anchor, clamped inside the viewport, and flipped above when there is more
 * room up than down.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const useAnchoredPosition = (
  open: boolean,
  anchor: HTMLElement | null,
  desiredWidth: number,
  align: 'left' | 'right',
  onOutOfView: () => void,
): React.CSSProperties => {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const escape = useRef(onOutOfView);
  escape.current = onOutOfView;

  useLayoutEffect(() => {
    if (!open || !anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const gap = 8;
      const margin = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // The anchor can be scrolled out of its own panel while the dropdown is
      // open. Following it off-screen would leave a menu floating with
      // nothing to point at, so the panel closes instead.
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
        escape.current();
        return;
      }

      const width = Math.min(desiredWidth, vw - margin * 2);
      const left = clamp(
        align === 'right' ? rect.right - width : rect.left,
        margin,
        vw - width - margin,
      );

      const spaceBelow = vh - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const flip = spaceBelow < 240 && spaceAbove > spaceBelow;

      const maxHeight = clamp(flip ? spaceAbove : spaceBelow, 180, vh - margin * 2);

      // Flipped panels hang from the trigger's top edge; the rest sit below
      // it, clamped so a trigger near the bottom cannot push the panel off.
      const placement = flip
        ? { bottom: clamp(vh - rect.top + gap, margin, vh - margin) }
        : { top: clamp(rect.bottom + gap, margin, vh - maxHeight - margin) };

      setStyle({ position: 'fixed', left, width, maxHeight, ...placement, visibility: 'visible' });
    };

    place();
    window.addEventListener('resize', place);
    // Capture phase, so a scroll inside any ancestor panel is seen too.
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [align, anchor, desiredWidth, open]);

  return style;
};

/**
 * Dismiss-on-outside-click for a portalled panel.
 *
 * The panel is no longer a DOM descendant of its trigger, so "outside" has to
 * be judged against both elements or the very click that opened the panel
 * would close it again.
 */
const useDismiss = (
  open: boolean,
  onClose: () => void,
  ...nodes: (HTMLElement | null)[]
) => {
  const refs = useRef(nodes);
  refs.current = nodes;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refs.current.some((n) => n && n.contains(target))) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, open]);
};

/**
 * A floating surface anchored to an element, rendered in a portal.
 *
 * Shared by every dropdown in the Studio so they all escape panel clipping,
 * stay on screen, and dismiss identically.
 */
export const FloatingPanel: React.FC<{
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  width?: number;
  align?: 'left' | 'right';
  padded?: boolean;
  children: React.ReactNode;
}> = ({ open, anchor, onClose, width = 288, align = 'left', padded = true, children }) => {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const style = useAnchoredPosition(open, anchor, width, align, onClose);

  useEffect(() => setMounted(true), []);
  useDismiss(open, onClose, anchor, panel);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={setPanel}
      style={style}
      className={`z-[90] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${
        padded ? 'p-3' : ''
      }`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </div>,
    document.body,
  );
};

/** A popover anchored under its trigger that closes on outside click or Esc. */
export const Popover: React.FC<{
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
}> = ({ trigger, children, align = 'left', width = 288 }) => {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <div ref={setAnchor} className="relative" onClick={() => setOpen((v) => !v)}>
        {trigger(open)}
      </div>
      <FloatingPanel open={open} anchor={anchor} onClose={close} width={width} align={align}>
        {children(close)}
      </FloatingPanel>
    </>
  );
};

const isValidHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);

/** Swatch grid + native picker + hex entry, used everywhere a colour is set. */
export const ColorPicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onCommit?: () => void;
  allowTransparent?: boolean;
}> = ({ value, onChange, onCommit, allowTransparent }) => {
  const [hex, setHex] = useState(value);
  const inputId = useId();

  useEffect(() => setHex(value), [value]);

  const commitHex = (raw: string) => {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    setHex(next);
    if (isValidHex(next)) {
      onChange(next);
      onCommit?.();
    }
  };

  const pick = (c: string) => {
    onChange(c);
    onCommit?.();
  };

  const Swatches = ({ colors }: { colors: string[] }) => (
    <div className="grid grid-cols-9 gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => pick(c)}
          style={{ backgroundColor: c }}
          className={`h-6 w-full rounded-md border transition-transform hover:scale-110 ${
            value.toLowerCase() === c.toLowerCase()
              ? 'border-teal ring-2 ring-teal/30 dark:border-parchment'
              : 'border-black/10 dark:border-white/15'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          style={{ backgroundColor: isValidHex(value) ? value : '#ffffff' }}
          className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-black/15 dark:border-white/20 shadow-inner"
        />
        <input
          id={inputId}
          type="color"
          value={isValidHex(value) && value.length <= 7 ? value : '#000000'}
          onChange={(e) => pick(e.target.value)}
          className="sr-only"
        />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitHex((e.target as HTMLInputElement).value);
          }}
          spellCheck={false}
          className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 font-mono text-[11px] uppercase text-slate-700 dark:text-slate-200 focus:border-teal dark:focus:border-parchment focus:outline-none"
        />
        {allowTransparent && (
          <button
            type="button"
            title="No fill"
            onClick={() => pick('transparent')}
            className="shrink-0 rounded-lg border border-gray-250 dark:border-slate-700 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:border-terracotta hover:text-terracotta"
          >
            None
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Brand</p>
        <Swatches colors={BRAND_COLORS.map((c) => c.value)} />
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 pt-1">Neutral</p>
        <Swatches colors={NEUTRAL_COLORS} />
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 pt-1">Accent</p>
        <Swatches colors={ACCENT_COLORS} />
      </div>
    </div>
  );
};

/** A colour button that opens the full picker in a popover. */
export const ColorButton: React.FC<{
  value: string;
  label?: string;
  onChange: (v: string) => void;
  onCommit?: () => void;
  allowTransparent?: boolean;
}> = ({ value, label, onChange, onCommit, allowTransparent }) => (
  <Popover
    width={300}
    trigger={() => (
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-left transition-colors hover:border-teal dark:hover:border-parchment"
      >
        <span
          style={{
            backgroundColor: value === 'transparent' ? undefined : value,
            backgroundImage:
              value === 'transparent'
                ? 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)'
                : undefined,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 4px 4px',
          }}
          className="h-5 w-5 shrink-0 rounded border border-black/15 dark:border-white/20"
        />
        <span className="flex-1 truncate font-mono text-[11px] uppercase text-slate-600 dark:text-slate-300">
          {label ?? value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>
    )}
  >
    {() => (
      <ColorPicker
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        allowTransparent={allowTransparent}
      />
    )}
  </Popover>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left"
  >
    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
    <span
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-teal dark:bg-parchment' : 'bg-gray-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-slate-900 shadow transition-transform ${
          checked ? 'translate-x-4.5 left-0.5' : 'translate-x-0 left-0.5'
        }`}
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </span>
  </button>
);

export const EmptyHint: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-250 dark:border-slate-700 px-4 py-8 text-center">
    <div className="text-gray-300 dark:text-slate-600">{icon}</div>
    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{title}</p>
    <p className="text-[11px] leading-relaxed text-gray-450 dark:text-slate-500">{body}</p>
  </div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
  />
);

export const CheckRow: React.FC<{
  checked: boolean;
  label: React.ReactNode;
  onClick: () => void;
}> = ({ checked, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
  >
    <span className="truncate">{label}</span>
    {checked && <Check className="h-3.5 w-3.5 shrink-0 text-teal dark:text-parchment" />}
  </button>
);
