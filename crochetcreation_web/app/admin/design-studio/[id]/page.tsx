'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { getDesign } from '../lib/api';
import type { DesignRecord } from '../lib/types';

/**
 * fabric.js reads `window` and `document` while its module body evaluates, so
 * the editor can never be part of the server bundle — Next's prerender pass
 * would crash at build time. Everything below the shell is client-only.
 */
const DesignEditor = dynamic(() => import('../components/DesignEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent dark:border-parchment dark:border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading the editor…</p>
      </div>
    </div>
  ),
});

export default function DesignEditorPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : (raw ?? '');
  }, [params]);

  const [design, setDesign] = useState<DesignRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    void (async () => {
      try {
        const record = await getDesign(id);
        if (!cancelled) setDesign(record);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not open that design.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center shadow-soft">
          <AlertTriangle className="mx-auto h-8 w-8 text-terracotta" />
          <p className="mt-3 text-sm font-black text-ink dark:text-parchment">
            This design could not be opened
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin/design-studio')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-bold text-parchment hover:bg-teal-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Design Studio
          </button>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent dark:border-parchment dark:border-t-transparent" />
      </div>
    );
  }

  return <DesignEditor design={design} />;
}
