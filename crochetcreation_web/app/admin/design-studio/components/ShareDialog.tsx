'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Link2, Loader2, RefreshCw, Users } from 'lucide-react';
import { Segmented, Spinner, TextButton, Toggle } from './ui';
import { disableSharing, enableSharing, getShareSettings, type ShareSettings } from '../lib/api';

export const ShareDialog: React.FC<{
  designId: string;
  onError: (message: string) => void;
  close: () => void;
}> = ({ designId, onError, close }) => {
  const [settings, setSettings] = useState<ShareSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getShareSettings(designId)
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((error) => {
        if (!cancelled) onError(error instanceof Error ? error.message : 'Could not read sharing.');
      });
    return () => {
      cancelled = true;
    };
  }, [designId, onError]);

  const run = useCallback(
    async (task: () => Promise<ShareSettings>) => {
      setBusy(true);
      try {
        setSettings(await task());
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not change sharing.');
      } finally {
        setBusy(false);
      }
    },
    [onError],
  );

  const copy = async () => {
    if (!settings?.url) return;
    try {
      await navigator.clipboard.writeText(settings.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the field below is selectable when the clipboard is blocked */
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-gray-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Share &amp; collaborate
        </p>
      </div>

      <Toggle
        checked={settings.enabled}
        label="Anyone with the link can open this"
        onChange={(on) =>
          void run(() => (on ? enableSharing(designId, settings.role) : disableSharing(designId)))
        }
      />

      {settings.enabled && (
        <>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-slate-500">
              They can
            </p>
            <Segmented
              value={settings.role}
              onChange={(role) => void run(() => enableSharing(designId, role))}
              options={[
                { value: 'editor', label: 'Edit together' },
                { value: 'viewer', label: 'View only' },
              ]}
            />
            <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
              {settings.role === 'editor'
                ? 'Everyone with the link edits the same artboard at the same time — you will see their cursors and changes as they happen.'
                : 'They can watch the design, including live changes, but cannot alter it.'}
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 shrink-0 text-teal dark:text-parchment" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal dark:text-parchment">
                Share link
              </p>
            </div>
            <input
              readOnly
              value={settings.url ?? ''}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded border border-gray-250 bg-white px-2 py-1 font-mono text-[10px] text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
            <TextButton variant="outline" size="sm" full onClick={() => void copy()}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy link'}
            </TextButton>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => disableSharing(designId, true))}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold text-terracotta transition-colors hover:bg-terracotta/10 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Revoke &amp; make a new link
          </button>
          <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
            Revoking disconnects anyone currently in the design and stops the old link working
            immediately.
          </p>
        </>
      )}

      {!settings.enabled && (
        <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
          Turn this on to get a link. People you send it to work on this artboard with you in real
          time — no account needed.
        </p>
      )}
    </div>
  );
};
