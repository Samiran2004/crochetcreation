'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AlertTriangle, Users } from 'lucide-react';
import { getSharedDesign, type SharedDesign } from '../../admin/design-studio/lib/api';

/**
 * The page a share link opens.
 *
 * Deliberately outside `/admin`: the whole point is that a collaborator has
 * no account here. The token in the URL is the only credential, and it
 * admits the holder to exactly one design.
 */
const DesignEditor = dynamic(() => import('../../admin/design-studio/components/DesignEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
    </div>
  ),
});

const NAME_KEY = 'ds_collab_name';

export default function SharedDesignPage() {
  const params = useParams();
  const token = useMemo(() => {
    const raw = params?.token;
    return Array.isArray(raw) ? raw[0] : (raw ?? '');
  }, [params]);

  const [design, setDesign] = useState<SharedDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NAME_KEY);
      if (saved) {
        setName(saved);
        setIntroDone(true);
      }
    } catch {
      /* private mode: they will just be asked for a name */
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getSharedDesign(token)
      .then((d) => {
        if (!cancelled) setDesign(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'This link is not working.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="max-w-sm rounded-2xl border border-line bg-white p-6 text-center shadow-soft">
          <AlertTriangle className="mx-auto h-8 w-8 text-terracotta" />
          <p className="mt-3 text-sm font-black text-ink">This design is not available</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-bodytext">{error}</p>
          <p className="mt-3 text-[11px] text-muted">
            Ask whoever sent you the link to share it again.
          </p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  // Asking for a name once is what makes the cursors and the presence row
  // mean anything — "Guest" four times over tells nobody who is who.
  if (!introDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              window.localStorage.setItem(NAME_KEY, name.trim());
            } catch {
              /* not fatal */
            }
            setIntroDone(true);
          }}
          className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-soft"
        >
          <Users className="h-7 w-7 text-terracotta" />
          <h1 className="mt-3 font-display text-xl text-ink">{design.name}</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-bodytext">
            {design.role === 'editor'
              ? 'You have been invited to edit this design together with others.'
              : 'You have been invited to view this design.'}
          </p>
          <label className="mt-4 block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              What should people call you?
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your name"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-4 w-full rounded-lg bg-teal px-4 py-2.5 text-xs font-black tracking-wide text-parchment transition-colors hover:bg-teal-deep disabled:opacity-40"
          >
            Join the design
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] overflow-hidden bg-gray-55">
      <DesignEditor
        design={{
          id: design.id,
          name: design.name,
          width: design.width,
          height: design.height,
          canvas_json: design.canvas_json,
          created_at: design.updated_at,
          updated_at: design.updated_at,
        }}
        shareToken={token}
        canEdit={design.role === 'editor'}
        collaboratorName={name.trim() || 'Guest'}
      />
    </div>
  );
}
