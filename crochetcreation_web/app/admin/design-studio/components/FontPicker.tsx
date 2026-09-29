'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import {
  FONT_CATEGORIES,
  getCustomFonts,
  importGoogleFont,
  loadFont,
  removeCustomFont,
  searchFonts,
  type FontCategory,
  type FontDefinition,
} from '../lib/fonts';
import { FloatingPanel, Spinner } from './ui';

/**
 * One row of the font list.
 *
 * The preview has to be set in the font it names, which means fetching that
 * webfont — so a row only requests its family once it has actually scrolled
 * into view. Rendering the whole library eagerly would fire a hundred
 * stylesheet requests the moment the dropdown opens.
 */
const FontRow: React.FC<{
  font: FontDefinition;
  selected: boolean;
  onPick: (family: string) => void;
}> = ({ font, selected, onPick }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    const request = () => {
      void loadFont(font.family).then(() => {
        if (!cancelled) setLoaded(true);
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      request();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          request();
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [font.family]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onPick(font.family)}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'bg-teal/10 dark:bg-parchment/10 ring-1 ring-teal/30 dark:ring-parchment/30'
          : 'hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[17px] leading-snug text-ink dark:text-parchment"
          style={{ fontFamily: loaded ? `"${font.family}", serif` : undefined }}
        >
          {font.family}
        </span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-600">
          {font.category}
        </span>
      </span>
      {font.premium && (
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" aria-label="Premium face" />
      )}
    </button>
  );
};


/**
 * Bring in any family from Google Fonts by name.
 *
 * The catalog is curated, not exhaustive — this is the escape hatch that
 * makes the type library effectively unlimited. Imports persist locally and
 * are re-fetched automatically when a saved design that uses one is reopened
 * somewhere else.
 */
const GoogleFontImporter: React.FC<{ onImported: (family: string) => void }> = ({ onImported }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'missing'>('idle');
  const [custom, setCustom] = useState<FontDefinition[]>([]);

  useEffect(() => setCustom(getCustomFonts()), []);

  const run = async () => {
    const family = name.trim();
    if (!family) return;
    setBusy(true);
    setStatus('idle');
    try {
      const imported = await importGoogleFont(family);
      if (!imported) {
        setStatus('missing');
        return;
      }
      setCustom(getCustomFonts());
      setStatus('ok');
      setName('');
      onImported(imported.family);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-gray-150 p-3 dark:border-slate-800">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
        Import from Google Fonts
      </p>
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus('idle');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void run();
            e.stopPropagation();
          }}
          placeholder="e.g. Brittany Signature"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-gray-250 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 placeholder-gray-400 focus:border-teal focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !name.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal px-2.5 py-1.5 text-[10px] font-bold text-parchment disabled:opacity-40 dark:bg-parchment dark:text-teal"
        >
          {busy ? <Spinner className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>

      {status === 'missing' && (
        <p className="flex items-start gap-1.5 text-[10px] font-semibold text-terracotta">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          Google Fonts has no family with that exact name. Check the spelling on fonts.google.com.
        </p>
      )}
      {status === 'ok' && (
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-teal dark:text-parchment">
          <Check className="h-3 w-3 shrink-0" />
          Added and selected.
        </p>
      )}

      {custom.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            Your imports
          </p>
          {custom.map((font) => (
            <div key={font.family} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onImported(font.family)}
                className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-[13px] text-ink hover:bg-gray-100 dark:text-parchment dark:hover:bg-slate-800"
                style={{ fontFamily: `"${font.family}", serif` }}
              >
                {font.family}
              </button>
              <button
                type="button"
                title="Remove import"
                onClick={() => {
                  removeCustomFont(font.family);
                  setCustom(getCustomFonts());
                }}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-terracotta"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FontPicker: React.FC<{
  value: string;
  onChange: (family: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FontCategory | 'All'>('All');
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const results = useMemo(() => searchFonts(query, category), [category, query]);

  useEffect(() => {
    // Keep the trigger itself set in the chosen face, even before the list
    // has ever been opened (e.g. right after loading a saved design).
    void loadFont(value);
  }, [value]);

  const pick = useCallback(
    (family: string) => {
      onChange(family);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-250 bg-white px-3 py-2 text-left transition-colors hover:border-teal dark:border-slate-700 dark:bg-slate-950 dark:hover:border-parchment"
      >
        <span
          className="min-w-0 flex-1 truncate text-sm text-ink dark:text-parchment"
          style={{ fontFamily: `"${value}", serif` }}
        >
          {value}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <FloatingPanel
        open={open}
        anchor={anchor}
        onClose={() => setOpen(false)}
        width={352}
        align="right"
        padded={false}
      >
        {/* The search and filters stay put while the list scrolls under them. */}
        <div className="sticky top-0 z-10 space-y-2.5 border-b border-gray-150 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 rounded-lg border border-gray-250 bg-gray-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 250+ fonts..."
              className="w-full bg-transparent text-xs font-medium text-slate-700 placeholder-gray-400 focus:outline-none dark:text-slate-200"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['All', ...FONT_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors ${
                  category === c
                    ? 'bg-teal text-parchment dark:bg-parchment dark:text-teal'
                    : 'bg-gray-100 text-gray-500 hover:text-ink dark:bg-slate-800 dark:text-slate-400 dark:hover:text-parchment'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-gray-400">
              No font matches “{query}”.
            </p>
          ) : (
            results.map((font) => (
              <FontRow key={font.family} font={font} selected={font.family === value} onPick={pick} />
            ))
          )}
        </div>

        <GoogleFontImporter onImported={pick} />
      </FloatingPanel>
    </>
  );
};
