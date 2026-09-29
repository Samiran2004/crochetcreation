'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Copy,
  LayoutTemplate,
  Palette,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  createDesign,
  deleteDesign,
  duplicateDesign,
  listDesigns,
} from './lib/api';
import { PRESET_GROUPS, SIZE_PRESETS, type SizePreset } from './lib/presets';
import { TEMPLATES } from './lib/templates';
import type { DesignSummary } from './lib/types';

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DesignStudioGallery() {
  const router = useRouter();

  const [designs, setDesigns] = useState<DesignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DesignSummary | null>(null);
  const [customSize, setCustomSize] = useState({ width: 1200, height: 1200 });

  const refresh = useCallback(async () => {
    try {
      setDesigns(await listDesigns());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your designs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return designs;
    return designs.filter((d) => d.name.toLowerCase().includes(q));
  }, [designs, query]);

  const start = useCallback(
    async (payload: { name: string; width: number; height: number; presetKey?: string }) => {
      setBusy(true);
      setError(null);
      try {
        const created = await createDesign({
          name: payload.name,
          width: payload.width,
          height: payload.height,
          preset_key: payload.presetKey ?? null,
        });
        router.push(`/admin/design-studio/${created.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create the design.');
        setBusy(false);
      }
    },
    [router],
  );

  const startFromPreset = (preset: SizePreset) =>
    void start({
      name: preset.label,
      width: preset.width,
      height: preset.height,
      presetKey: preset.key,
    });

  const duplicate = async (design: DesignSummary) => {
    setBusy(true);
    try {
      await duplicateDesign(design.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate the design.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteDesign(pendingDelete.id);
      setDesigns((prev) => prev.filter((d) => d.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the design.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-ink dark:text-parchment">
            <Palette className="h-5 w-5 text-terracotta" />
            Design Studio
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Build thumbnails, cards, banners and social posts — over a hundred fonts, full
            typographic control, and one-click publishing straight into your media library.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-black tracking-wide text-parchment shadow-sm transition-colors hover:bg-teal-deep disabled:opacity-50 dark:bg-parchment dark:text-teal dark:hover:bg-parchment-deep"
        >
          <Plus className="h-4 w-4" />
          New design
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          <p className="flex-1 text-[11px] font-semibold text-terracotta-deep">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5 text-terracotta" />
          </button>
        </div>
      )}

      {/* Quick starts */}
      <section className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
          Start from a size
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {SIZE_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={busy}
              onClick={() => startFromPreset(preset)}
              className="group flex w-32 shrink-0 flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-3 transition-all hover:border-teal dark:hover:border-parchment hover:shadow-soft disabled:opacity-50"
            >
              <span
                className="rounded border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-950 transition-colors group-hover:border-teal dark:group-hover:border-parchment"
                style={{
                  width: 44,
                  height: Math.max(22, Math.min(56, (44 * preset.height) / preset.width)),
                }}
              />
              <span className="text-center text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-300">
                {preset.label}
              </span>
              <span className="font-mono text-[8.5px] text-gray-400">
                {preset.width}×{preset.height}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Saved designs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Your designs {designs.length > 0 && `(${designs.length})`}
          </p>
          {designs.length > 0 && (
            <div className="flex w-52 items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search designs..."
                className="w-full bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-14 text-center">
            <Sparkles className="h-9 w-9 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-black text-ink dark:text-parchment">
              {query ? 'No design matches that search' : 'No designs yet'}
            </p>
            <p className="max-w-sm text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
              {query
                ? 'Try a different name.'
                : 'Pick a size above or start from a ready-made template — product thumbnails, story posts, care cards and more.'}
            </p>
            {!query && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-bold text-parchment hover:bg-teal-deep"
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first design
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((design) => (
              <div
                key={design.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-teal dark:hover:border-parchment hover:shadow-lift"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/admin/design-studio/${design.id}`)}
                  className="block w-full"
                >
                  <span className="flex h-36 items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-950">
                    {design.thumbnail_url ? (
                      <Image
                        src={design.thumbnail_url}
                        alt={design.name}
                        width={design.width}
                        height={design.height}
                        className="max-h-full max-w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <LayoutTemplate className="h-8 w-8 text-gray-300 dark:text-slate-700" />
                    )}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black text-ink dark:text-parchment">
                      {design.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-gray-400">
                      {design.width}×{design.height} · {formatDate(design.updated_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    title="Edit"
                    onClick={() => router.push(`/admin/design-studio/${design.id}`)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-gray-100 hover:text-teal dark:hover:bg-slate-800 dark:hover:text-parchment"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Duplicate"
                    disabled={busy}
                    onClick={() => void duplicate(design)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-gray-100 hover:text-teal disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-parchment"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => setPendingDelete(design)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-terracotta/10 hover:text-terracotta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New-design picker */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 px-5 py-4">
              <h2 className="text-sm font-black text-ink dark:text-parchment">
                Create a new design
              </h2>
              <button type="button" onClick={() => setPickerOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-gray-400 hover:text-ink dark:hover:text-parchment" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
              {PRESET_GROUPS.map((group) => (
                <div key={group} className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SIZE_PRESETS.filter((p) => p.group === group).map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        disabled={busy}
                        onClick={() => startFromPreset(preset)}
                        className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2.5 text-left transition-all hover:border-teal dark:hover:border-parchment disabled:opacity-50"
                      >
                        <span className="block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {preset.label}
                        </span>
                        <span className="block font-mono text-[9px] text-gray-400">
                          {preset.width}×{preset.height}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Custom size
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex-1 min-w-24 space-y-1">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-450">
                      Width
                    </span>
                    <input
                      type="number"
                      min={16}
                      max={8000}
                      value={customSize.width}
                      onChange={(e) =>
                        setCustomSize((s) => ({ ...s, width: Number(e.target.value) }))
                      }
                      className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold focus:border-teal focus:outline-none"
                    />
                  </label>
                  <label className="flex-1 min-w-24 space-y-1">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-450">
                      Height
                    </span>
                    <input
                      type="number"
                      min={16}
                      max={8000}
                      value={customSize.height}
                      onChange={(e) =>
                        setCustomSize((s) => ({ ...s, height: Number(e.target.value) }))
                      }
                      className="w-full rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold focus:border-teal focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      customSize.width < 16 ||
                      customSize.height < 16 ||
                      customSize.width > 8000 ||
                      customSize.height > 8000
                    }
                    onClick={() =>
                      void start({
                        name: `Custom ${customSize.width}×${customSize.height}`,
                        width: customSize.width,
                        height: customSize.height,
                      })
                    }
                    className="rounded-lg bg-teal px-4 py-2 text-xs font-bold text-parchment hover:bg-teal-deep disabled:opacity-40 dark:bg-parchment dark:text-teal"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Or start from a template
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Create a design at any size, then open the Templates panel inside the editor —
                  every layout adapts to the artboard you chose.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TEMPLATES.filter((t) => t.id !== 'blank').map((template) => (
                    <div
                      key={template.id}
                      className="w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <div
                        className="h-14"
                        style={{
                          background: `linear-gradient(135deg, ${template.swatch[0]}, ${template.swatch[1]})`,
                        }}
                      />
                      <p className="truncate px-1.5 py-1 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                        {template.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-black text-ink dark:text-parchment">
              Delete “{pendingDelete.name}”?
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
              The design and its preview are removed permanently. Images you uploaded stay in your
              media library.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-lg border border-gray-250 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-lg bg-terracotta px-3 py-2 text-xs font-bold text-white hover:bg-terracotta-deep disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
