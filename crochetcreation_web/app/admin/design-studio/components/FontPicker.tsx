'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import {
  FONT_CATEGORIES,
  loadFont,
  searchFonts,
  type FontCategory,
  type FontDefinition,
} from '../lib/fonts';

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

export const FontPicker: React.FC<{
  value: string;
  onChange: (family: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FontCategory | 'All'>('All');
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchFonts(query, category), [category, query]);

  useEffect(() => {
    // Keep the trigger itself set in the chosen face, even before the list
    // has ever been opened (e.g. right after loading a saved design).
    void loadFont(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = useCallback(
    (family: string) => {
      onChange(family);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-left transition-colors hover:border-teal dark:hover:border-parchment"
      >
        <span
          className="min-w-0 flex-1 truncate text-sm text-ink dark:text-parchment"
          style={{ fontFamily: `"${value}", serif` }}
        >
          {value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[min(22rem,80vw)] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="border-b border-gray-150 dark:border-slate-800 p-3 space-y-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 100+ fonts..."
                className="w-full bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none"
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
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-ink dark:hover:text-parchment'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-gray-400">
                No font matches “{query}”.
              </p>
            ) : (
              results.map((font) => (
                <FontRow
                  key={font.family}
                  font={font}
                  selected={font.family === value}
                  onPick={pick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
