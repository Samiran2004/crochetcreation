'use client';

import React, { useEffect, useState } from 'react';
import { MousePointer2, Users, WifiOff } from 'lucide-react';
import { meta } from '../lib/engine';
import type { CollaborationApi } from './useCollaboration';
import type { DesignEditorApi } from './useDesignEditor';

/** The people in the room, shown as overlapping initials in the top bar. */
export const PresenceBar: React.FC<{ collab: CollaborationApi }> = ({ collab }) => {
  if (!collab.self) return null;

  const others = collab.members.filter((m) => m.id !== collab.self?.id);

  return (
    <div className="flex items-center gap-1.5" title={collab.members.map((m) => m.name).join(', ')}>
      {!collab.connected && (
        <WifiOff className="h-3.5 w-3.5 text-terracotta" aria-label="Reconnecting" />
      )}
      <div className="flex -space-x-1.5">
        {collab.members.slice(0, 5).map((member) => (
          <span
            key={member.id}
            style={{ backgroundColor: member.colour }}
            title={member.id === collab.self?.id ? `${member.name} (you)` : member.name}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-black uppercase text-white dark:border-slate-900"
          >
            {member.name.charAt(0)}
          </span>
        ))}
        {collab.members.length > 5 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-500 text-[8px] font-black text-white dark:border-slate-900">
            +{collab.members.length - 5}
          </span>
        )}
      </div>
      {others.length > 0 && (
        <span className="hidden items-center gap-1 text-[10px] font-bold text-teal dark:text-parchment xl:flex">
          <Users className="h-3 w-3" />
          {others.length} here
        </span>
      )}
    </div>
  );
};

/**
 * Other people's cursors and selections, drawn over the artboard.
 *
 * Everything arrives in artboard coordinates, so it is scaled by the zoom
 * here — that way a cursor sits on the same point of the design for everyone
 * regardless of how far each person happens to be zoomed in.
 */
export const CollabCursors: React.FC<{
  collab: CollaborationApi;
  editor: DesignEditorApi;
  width: number;
  height: number;
}> = ({ collab, editor, width, height }) => {
  // Remote selections are resolved against the live canvas, so they follow
  // the object as whoever owns it drags it around.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(timer);
  }, []);

  const zoom = editor.zoom;
  const canvas = editor.canvasRef.current;

  const boxes = canvas
    ? collab.selections.flatMap((selection) =>
        selection.objectIds
          .map((id) => canvas.getObjects().find((o) => meta(o).dsId === id))
          .filter((o): o is NonNullable<typeof o> => !!o)
          .map((object) => {
            const rect = object.getBoundingRect();
            return {
              key: `${selection.id}:${meta(object).dsId}`,
              name: selection.name,
              colour: selection.colour,
              left: rect.left * zoom,
              top: rect.top * zoom,
              width: rect.width * zoom,
              height: rect.height * zoom,
            };
          }),
      )
    : [];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ width, height }}
    >
      {boxes.map((box) => (
        <div
          key={box.key}
          className="absolute rounded-[2px] border-2"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderColor: box.colour,
          }}
        >
          <span
            className="absolute -top-4 left-0 whitespace-nowrap rounded px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: box.colour }}
          >
            {box.name}
          </span>
        </div>
      ))}

      {collab.cursors.map((cursor) => (
        <div
          key={cursor.id}
          className="absolute transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${cursor.x * zoom}px, ${cursor.y * zoom}px)` }}
        >
          <MousePointer2
            className="h-4 w-4 drop-shadow"
            style={{ color: cursor.colour, fill: cursor.colour }}
          />
          <span
            className="ml-3 -mt-1 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow"
            style={{ backgroundColor: cursor.colour }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
};
