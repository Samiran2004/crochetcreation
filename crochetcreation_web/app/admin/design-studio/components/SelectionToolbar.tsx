'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  ChevronRight,
  Clipboard,
  Copy,
  Group as GroupIcon,
  Layers as LayersIcon,
  Lock,
  MoreHorizontal,
  Paintbrush,
  Trash2,
  Unlock,
  Ungroup,
} from 'lucide-react';
import type { AlignMode, DesignEditorApi } from './useDesignEditor';

const BAR_HEIGHT = 40;
const GAP = 12;
const MARGIN = 10;

const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

const Divider = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200 dark:bg-slate-700" />;

const QuickButton: React.FC<{
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, active, danger, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
      danger
        ? 'text-slate-600 hover:bg-terracotta/10 hover:text-terracotta dark:text-slate-300'
        : active
          ? 'bg-teal text-parchment dark:bg-parchment dark:text-teal'
          : 'text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);

const MenuRow: React.FC<{
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  indent?: boolean;
  onClick: () => void;
}> = ({ icon, label, shortcut, danger, disabled, indent, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-lg py-1.5 pr-2.5 text-left text-[11.5px] font-semibold transition-colors disabled:opacity-35 ${
      indent ? 'pl-8' : 'pl-2.5'
    } ${
      danger
        ? 'text-terracotta hover:bg-terracotta/10'
        : 'text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
    <span className="flex-1 truncate">{label}</span>
    {shortcut && (
      <span className="shrink-0 font-mono text-[9px] text-gray-350 dark:text-slate-500">
        {shortcut}
      </span>
    )}
  </button>
);

/**
 * A collapsing group inside the overflow menu.
 *
 * Canva uses fly-out submenus; these expand in place instead. In a 230px
 * menu that can open anywhere on screen, a fly-out has to solve edge
 * collision all over again, and inline expansion gives the same reach
 * without ever landing off-screen.
 */
const MenuGroup: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-2.5 pr-2.5 text-left text-[11.5px] font-semibold text-slate-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <span className="shrink-0 text-gray-400">{icon}</span>
        <span className="flex-1">{label}</span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-150 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>
      {open && <div className="space-y-0.5 pb-1">{children}</div>}
    </>
  );
};

export const SelectionToolbar: React.FC<{
  editor: DesignEditorApi;
  onShowLayers: () => void;
}> = ({ editor, onShowLayers }) => {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [menu, setMenu] = useState<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const box = editor.selectionBox;
  const hidden =
    !box || editor.selectionKind === 'none' || editor.isTransforming || editor.isEditingText();

  // Any change of selection makes the open menu's contents wrong.
  useEffect(() => {
    setMenuOpen(false);
  }, [editor.selectionKind, editor.selectionCount]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchor?.contains(target) || menu?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor, menu, menuOpen]);

  const selectedLayer = useMemo(
    () => editor.layers.find((l) => l.selected),
    [editor.layers],
  );

  const close = useCallback(() => setMenuOpen(false), []);
  const run = useCallback(
    (fn: () => void | Promise<void>) => () => {
      void fn();
      setMenuOpen(false);
    },
    [],
  );

  if (!mounted || hidden || !box) return null;

  // Sit above the selection, flipping below when the object is near the top
  // of the viewport, and never leaving the screen horizontally.
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const above = box.top - GAP - BAR_HEIGHT;
  const below = box.top + box.height + GAP;
  const top = above >= MARGIN ? above : Math.min(below, viewportHeight - BAR_HEIGHT - MARGIN);
  const centre = Math.min(
    Math.max(box.left + box.width / 2, MARGIN + 120),
    viewportWidth - MARGIN - 120,
  );

  const alignments: { mode: AlignMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'left', label: 'Left', icon: <AlignStartVertical className="h-3.5 w-3.5" /> },
    { mode: 'center-h', label: 'Centre', icon: <AlignCenterVertical className="h-3.5 w-3.5" /> },
    { mode: 'right', label: 'Right', icon: <AlignEndVertical className="h-3.5 w-3.5" /> },
    { mode: 'top', label: 'Top', icon: <AlignStartHorizontal className="h-3.5 w-3.5" /> },
    { mode: 'center-v', label: 'Middle', icon: <AlignCenterHorizontal className="h-3.5 w-3.5" /> },
    { mode: 'bottom', label: 'Bottom', icon: <AlignEndHorizontal className="h-3.5 w-3.5" /> },
  ];

  const locked = !!selectedLayer?.locked;

  return createPortal(
    <>
      <div
        style={{ left: centre, top, transform: 'translateX(-50%)' }}
        className="fixed z-[70] flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white/97 px-1 py-1 shadow-lift backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/97"
      >
        <QuickButton
          title={locked ? 'Unlock' : 'Lock'}
          active={locked}
          onClick={() => selectedLayer && editor.toggleLayerLock(selectedLayer.id)}
        >
          {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </QuickButton>

        <QuickButton title={`Duplicate (${mod}D)`} onClick={() => void editor.duplicateSelection()}>
          <Copy className="h-4 w-4" />
        </QuickButton>

        <QuickButton title="Delete (Del)" danger onClick={editor.removeSelected}>
          <Trash2 className="h-4 w-4" />
        </QuickButton>

        {editor.selectionKind === 'multiple' && (
          <>
            <Divider />
            <QuickButton title={`Group (${mod}G)`} onClick={editor.groupSelection}>
              <GroupIcon className="h-4 w-4" />
            </QuickButton>
          </>
        )}
        {editor.selectionKind === 'group' && (
          <>
            <Divider />
            <QuickButton title={`Ungroup (${mod}⇧G)`} onClick={editor.ungroupSelection}>
              <Ungroup className="h-4 w-4" />
            </QuickButton>
          </>
        )}

        <Divider />

        <button
          ref={setAnchor}
          type="button"
          title="More options"
          aria-label="More options"
          onClick={() => setMenuOpen((v) => !v)}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            menuOpen
              ? 'bg-gray-100 text-ink dark:bg-slate-800 dark:text-parchment'
              : 'text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && anchor && (
        <div
          ref={setMenu}
          style={{
            left: Math.min(
              Math.max(anchor.getBoundingClientRect().right - 230, MARGIN),
              viewportWidth - 230 - MARGIN,
            ),
            top: Math.min(top + BAR_HEIGHT + 6, viewportHeight - 320),
          }}
          className="fixed z-[80] max-h-[60vh] w-[230px] space-y-0.5 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <MenuRow
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Copy"
            shortcut={`${mod}C`}
            onClick={run(editor.copySelection)}
          />
          <MenuRow
            icon={<Paintbrush className="h-3.5 w-3.5" />}
            label="Copy style"
            shortcut={`⌥${mod}C`}
            onClick={run(editor.copyStyle)}
          />
          <MenuRow
            icon={<Clipboard className="h-3.5 w-3.5" />}
            label="Paste style"
            shortcut={`⌥${mod}V`}
            disabled={!editor.hasCopiedStyle}
            onClick={run(editor.pasteStyle)}
          />
          <MenuRow
            icon={<Clipboard className="h-3.5 w-3.5" />}
            label="Paste"
            shortcut={`${mod}V`}
            onClick={run(editor.pasteClipboard)}
          />
          <MenuRow
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Duplicate"
            shortcut={`${mod}D`}
            onClick={run(editor.duplicateSelection)}
          />
          <MenuRow
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            shortcut="Del"
            danger
            onClick={run(editor.removeSelected)}
          />

          <div className="my-1 h-px bg-gray-150 dark:bg-slate-800" />

          <MenuGroup icon={<LayersIcon className="h-3.5 w-3.5" />} label="Layer">
            <MenuRow
              indent
              label="Bring to front"
              shortcut={`⌥${mod}]`}
              onClick={run(() => editor.reorder('front'))}
            />
            <MenuRow
              indent
              label="Bring forward"
              shortcut={`${mod}]`}
              onClick={run(() => editor.reorder('forward'))}
            />
            <MenuRow
              indent
              label="Send backward"
              shortcut={`${mod}[`}
              onClick={run(() => editor.reorder('backward'))}
            />
            <MenuRow
              indent
              label="Send to back"
              shortcut={`⌥${mod}[`}
              onClick={run(() => editor.reorder('back'))}
            />
            <MenuRow indent label="Show layers" shortcut="⌥1" onClick={run(onShowLayers)} />
          </MenuGroup>

          <MenuGroup
            icon={<AlignCenterVertical className="h-3.5 w-3.5" />}
            label={editor.selectionCount > 1 ? 'Align selection' : 'Align to page'}
          >
            {alignments.map((a) => (
              <MenuRow
                key={a.mode}
                indent
                icon={a.icon}
                label={a.label}
                onClick={run(() => editor.align(a.mode))}
              />
            ))}
            {editor.selectionCount > 2 && (
              <>
                <MenuRow
                  indent
                  icon={<ArrowUp className="h-3.5 w-3.5" />}
                  label="Distribute across"
                  onClick={run(() => editor.distribute('h'))}
                />
                <MenuRow
                  indent
                  icon={<ArrowDown className="h-3.5 w-3.5" />}
                  label="Distribute down"
                  onClick={run(() => editor.distribute('v'))}
                />
              </>
            )}
          </MenuGroup>

          <div className="my-1 h-px bg-gray-150 dark:bg-slate-800" />

          <MenuRow
            icon={locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            label={locked ? 'Unlock' : 'Lock'}
            shortcut="⌥⇧L"
            onClick={run(() => selectedLayer && editor.toggleLayerLock(selectedLayer.id))}
          />
          {editor.selectionKind === 'multiple' && (
            <MenuRow
              icon={<GroupIcon className="h-3.5 w-3.5" />}
              label="Group"
              shortcut={`${mod}G`}
              onClick={run(editor.groupSelection)}
            />
          )}
          {editor.selectionKind === 'group' && (
            <MenuRow
              icon={<Ungroup className="h-3.5 w-3.5" />}
              label="Ungroup"
              shortcut={`${mod}⇧G`}
              onClick={run(editor.ungroupSelection)}
            />
          )}
          <MenuRow
            icon={<ArrowUpToLine className="h-3.5 w-3.5" />}
            label="Bring to front"
            onClick={run(() => editor.reorder('front'))}
          />
          <MenuRow
            icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            label="Send to back"
            onClick={run(() => editor.reorder('back'))}
          />
        </div>
      )}
    </>,
    document.body,
  );
};
