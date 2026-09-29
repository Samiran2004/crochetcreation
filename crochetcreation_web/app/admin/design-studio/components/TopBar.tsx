'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Cloud,
  Copy,
  Download,
  Keyboard,
  Maximize2,
  Redo2,
  Save,
  Share2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { IconButton, Popover, Segmented, Spinner, TextButton } from './ui';
import type { DesignEditorApi } from './useDesignEditor';

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'json';

const SHORTCUTS: [string, string][] = [
  ['⌘ / Ctrl + Z', 'Undo'],
  ['⌘ / Ctrl + ⇧ + Z', 'Redo'],
  ['⌘ / Ctrl + C', 'Copy'],
  ['⌘ / Ctrl + V', 'Paste'],
  ['⌘ / Ctrl + D', 'Duplicate'],
  ['⌘ / Ctrl + G', 'Group'],
  ['⌘ / Ctrl + ⇧ + G', 'Ungroup'],
  ['⌘ / Ctrl + A', 'Select all'],
  ['⌘ / Ctrl + S', 'Save'],
  ['⌘ / Ctrl + + / −', 'Zoom in / out'],
  ['⌘ / Ctrl + 0', 'Fit to screen'],
  [']', 'Bring forward'],
  ['[', 'Send backward'],
  ['Delete / Backspace', 'Delete selection'],
  ['Arrow keys', 'Nudge 1px'],
  ['⇧ + Arrow keys', 'Nudge 10px'],
  ['Esc', 'Deselect'],
];

export const TopBar: React.FC<{
  editor: DesignEditorApi;
  name: string;
  onNameChange: (value: string) => void;
  saving: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  onExport: (format: ExportFormat, scale: number) => void;
  onPublish: () => void;
  publishing: boolean;
  publishedUrl: string | null;
}> = ({
  editor,
  name,
  onNameChange,
  saving,
  lastSavedAt,
  onSave,
  onExport,
  onPublish,
  publishing,
  publishedUrl,
}) => {
  const router = useRouter();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState(2);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the field below is selectable.
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3">
      <IconButton
        title="Back to Design Studio"
        onClick={() => router.push('/admin/design-studio')}
        className="h-9 w-9"
      >
        <ArrowLeft className="h-4 w-4" />
      </IconButton>

      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Untitled design"
        maxLength={140}
        className="w-36 shrink-0 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-xs font-bold text-ink dark:text-parchment hover:border-gray-250 dark:hover:border-slate-700 focus:border-teal dark:focus:border-parchment focus:outline-none sm:w-56"
      />

      <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-600 lg:flex">
        {saving ? (
          <>
            <Spinner className="h-3 w-3" /> Saving…
          </>
        ) : editor.dirty ? (
          'Unsaved changes'
        ) : lastSavedAt ? (
          <>
            <Cloud className="h-3 w-3" /> Saved{' '}
            {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </>
        ) : (
          'All changes saved'
        )}
      </span>

      <div className="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-slate-700 sm:block" />

      <IconButton
        title="Undo (⌘Z)"
        onClick={() => void editor.undo()}
        disabled={!editor.canUndo}
        className="h-9 w-9"
      >
        <Undo2 className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Redo (⌘⇧Z)"
        onClick={() => void editor.redo()}
        disabled={!editor.canRedo}
        className="h-9 w-9"
      >
        <Redo2 className="h-4 w-4" />
      </IconButton>

      <div className="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-slate-700 md:block" />

      <div className="hidden items-center gap-0.5 md:flex">
        <IconButton title="Zoom out (⌘−)" onClick={editor.zoomOut} className="h-9 w-9">
          <ZoomOut className="h-4 w-4" />
        </IconButton>
        <span className="w-12 text-center font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
          {Math.round(editor.zoom * 100)}%
        </span>
        <IconButton title="Zoom in (⌘+)" onClick={editor.zoomIn} className="h-9 w-9">
          <ZoomIn className="h-4 w-4" />
        </IconButton>
        <IconButton title="Fit to screen (⌘0)" onClick={editor.zoomToFit} className="h-9 w-9">
          <Maximize2 className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex-1" />

      <div className="hidden lg:block">
        <Popover
          align="right"
          width={300}
          trigger={() => (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
              <Keyboard className="h-4 w-4" />
            </span>
          )}
        >
          {() => (
            <div className="space-y-1">
              <p className="pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Keyboard shortcuts
              </p>
              {SHORTCUTS.map(([keys, label]) => (
                <div key={keys} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">{label}</span>
                  <kbd className="shrink-0 rounded border border-gray-250 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-1.5 py-0.5 font-mono text-[9px] text-gray-500 dark:text-slate-400">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </Popover>
      </div>

      <Popover
        align="right"
        width={340}
        trigger={() => (
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-teal dark:hover:border-parchment">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </span>
        )}
      >
        {() => (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Publish to media library
            </p>
            <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
              Uploads a PNG of this artboard and gives you a link you can paste straight into a
              product image or a homepage slot.
            </p>
            <TextButton variant="primary" full onClick={onPublish} disabled={publishing}>
              {publishing ? <Spinner /> : <Cloud className="h-4 w-4" />}
              {publishing ? 'Publishing…' : 'Publish as image'}
            </TextButton>

            {publishedUrl && (
              <div className="space-y-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal dark:text-parchment">
                  Live URL
                </p>
                <input
                  readOnly
                  value={publishedUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 focus:outline-none"
                />
                <TextButton variant="outline" size="sm" full onClick={() => void copyUrl()}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy link'}
                </TextButton>
              </div>
            )}
          </div>
        )}
      </Popover>

      <Popover
        align="right"
        width={300}
        trigger={() => (
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-250 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-teal dark:hover:border-parchment">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </span>
        )}
      >
        {(close) => (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              File type
            </p>
            <Segmented
              value={format}
              onChange={setFormat}
              options={[
                { value: 'png', label: 'PNG' },
                { value: 'jpeg', label: 'JPG' },
                { value: 'svg', label: 'SVG' },
                { value: 'json', label: 'JSON' },
              ]}
            />

            {(format === 'png' || format === 'jpeg') && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Size
                </p>
                <Segmented
                  value={String(scale)}
                  onChange={(v) => setScale(Number(v))}
                  options={[
                    { value: '1', label: '1×' },
                    { value: '2', label: '2×' },
                    { value: '3', label: '3×' },
                    { value: '4', label: '4×' },
                  ]}
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {Math.round(editor.artboard.width * scale)} ×{' '}
                  {Math.round(editor.artboard.height * scale)} px
                </p>
              </>
            )}

            {format === 'svg' && (
              <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
                Vector output stays sharp at any size. Text is exported as text, so the viewer needs
                the same fonts installed.
              </p>
            )}
            {format === 'json' && (
              <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
                A full backup of the editable scene. Keep it if you want this design recoverable
                outside the Studio.
              </p>
            )}

            <TextButton
              variant="primary"
              full
              onClick={() => {
                onExport(format, scale);
                close();
              }}
            >
              <Download className="h-4 w-4" />
              Download
            </TextButton>
          </div>
        )}
      </Popover>

      <TextButton variant="primary" onClick={onSave} disabled={saving}>
        {saving ? <Spinner /> : <Save className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Save</span>
      </TextButton>
    </header>
  );
};
