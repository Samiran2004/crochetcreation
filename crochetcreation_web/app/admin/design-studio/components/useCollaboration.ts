'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as FabricNS from 'fabric';
import { getApiUrl } from '../../../utils/apiFetch';
import { ensureId, meta, type FabricObj } from '../lib/engine';
import type { DesignEditorApi } from './useDesignEditor';

export interface CollabMember {
  id: string;
  name: string;
  colour: string;
  canEdit: boolean;
}

export interface RemoteCursor {
  id: string;
  name: string;
  colour: string;
  x: number;
  y: number;
  at: number;
}

export interface RemoteSelection {
  id: string;
  colour: string;
  name: string;
  objectIds: string[];
}

/** Live transforms are sent at this rate; anything faster is wasted frames. */
const TRANSFORM_INTERVAL_MS = 50;
const CURSOR_INTERVAL_MS = 60;
/** A cursor that has not moved for this long is treated as gone. */
const CURSOR_TTL_MS = 8000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

type Outgoing = Record<string, unknown>;

interface Options {
  designId: string;
  /** Present when this session got in through a share link. */
  shareToken?: string | null;
  enabled: boolean;
  displayName?: string;
}

/**
 * Live, multi-person editing for one design.
 *
 * Participants exchange object-level operations rather than whole scenes: a
 * design is a flat list of independent objects and two people rarely touch
 * the same one at once, so "this object changed" converges without the
 * machinery of a full CRDT, and a drag costs a few hundred bytes a frame
 * instead of the entire artboard.
 *
 * Transforms in progress are sent as a handful of numbers and applied
 * directly, which is what makes a drag look live on the other screen.
 * Anything committed is sent as the object's full serialization and rebuilt
 * through fabric's own enlivening, so gradients, clip paths, filters and
 * images survive the trip intact.
 */
export const useCollaboration = (editor: DesignEditorApi, options: Options) => {
  const { designId, shareToken, enabled, displayName } = options;
  const ready = editor.ready;

  const editorRef = useRef(editor);
  editorRef.current = editor;

  const socketRef = useRef<WebSocket | null>(null);
  const applyingRef = useRef(0);
  const lastTransformSentRef = useRef(0);
  const lastCursorSentRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedByUsRef = useRef(false);
  /** Last serialization broadcast per object, so changes can be diffed. */
  const baselineRef = useRef<Map<string, string>>(new Map());

  const [connected, setConnected] = useState(false);
  const [self, setSelf] = useState<CollabMember | null>(null);
  const [members, setMembers] = useState<CollabMember[]>([]);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const [selections, setSelections] = useState<RemoteSelection[]>([]);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const send = useCallback((payload: Outgoing) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      /* a socket that died mid-send is handled by the close handler */
    }
  }, []);

  const serializeObject = useCallback((object: FabricObj) => {
    const json = object.toObject() as Record<string, unknown>;
    json.dsId = meta(object).dsId;
    return json;
  }, []);

  /**
   * Record the canvas as it stands without sending anything.
   *
   * Called after every remote change, so the diff below does not see
   * somebody else's edit as one of ours and bounce it straight back —
   * which is how two clients end up echoing a change at each other
   * indefinitely.
   */
  const refreshBaseline = useCallback(
    (onlyIds?: string[]) => {
      const canvas = editorRef.current?.canvasRef.current;
      if (!canvas) return;
      canvas.getObjects().forEach((object) => {
        const id = meta(object).dsId;
        if (!id) return;
        if (onlyIds && !onlyIds.includes(id)) return;
        baselineRef.current.set(id, JSON.stringify(serializeObject(object)));
      });
      if (!onlyIds) {
        const live = new Set(
          canvas.getObjects().map((o) => meta(o).dsId).filter(Boolean) as string[],
        );
        Array.from(baselineRef.current.keys()).forEach((id) => {
          if (!live.has(id)) baselineRef.current.delete(id);
        });
      }
    },
    [serializeObject],
  );

  /** Run a canvas mutation without echoing it back out to the room. */
  const applyingRemote = useCallback(
    async (task: () => void | Promise<void>, onlyIds?: string[]) => {
      applyingRef.current += 1;
      try {
        await task();
      } finally {
        refreshBaseline(onlyIds);
        applyingRef.current -= 1;
      }
    },
    [refreshBaseline],
  );

  const findById = useCallback(
    (id: string): FabricObj | undefined =>
      editor.canvasRef.current?.getObjects().find((o) => meta(o).dsId === id),
    [editor],
  );

  /* ------------------------------------------------------ apply remote */

  const applyMessage = useCallback(
    async (message: Record<string, unknown>) => {
      const canvas = editor.canvasRef.current;
      const fabric = editor.fabricRef.current;
      if (!canvas || !fabric) return;

      const kind = message.type;

      if (kind === 'transform') {
        const id = String(message.id ?? '');
        const target = findById(id);
        if (!target) return;
        await applyingRemote(
          () => {
            target.set(message.props as Record<string, unknown>);
            target.setCoords();
            canvas.requestRenderAll();
          },
          [id],
        );
        return;
      }

      if (kind === 'op') {
        const action = message.action;

        if (action === 'remove') {
          const ids = (message.ids as string[]) ?? [];
          await applyingRemote(() => {
            ids.forEach((id) => {
              const target = findById(id);
              if (target) canvas.remove(target);
            });
            canvas.requestRenderAll();
          });
          return;
        }

        const payloads = (message.objects as Record<string, unknown>[]) ?? [];
        if (!payloads.length) return;

        // Rebuilt through fabric's own enlivening rather than by copying
        // properties across: that is what keeps gradients, clip paths,
        // filters and images intact over the wire.
        const revived = (await fabric.util.enlivenObjects(payloads)) as FabricObj[];

        await applyingRemote(() => {
          revived.forEach((object, index) => {
            const id = String(payloads[index]?.dsId ?? '');
            if (!id) return;
            const existing = findById(id);
            if (existing) {
              // Replace in place so z-order is preserved.
              const at = canvas.getObjects().indexOf(existing);
              const wasActive = canvas.getActiveObject() === existing;
              canvas.remove(existing);
              canvas.insertAt(at, object);
              if (wasActive) canvas.discardActiveObject();
            } else {
              canvas.add(object);
            }
          });
          canvas.requestRenderAll();
        });
        return;
      }

      if (kind === 'scene') {
        const scene = message.canvas as Record<string, unknown> | undefined;
        if (!scene) return;
        await applyingRemote(async () => {
          await canvas.loadFromJSON(scene);
          canvas.getObjects().forEach(ensureId);
          canvas.requestRenderAll();
        });
        return;
      }

      if (kind === 'cursor') {
        const id = String(message.from ?? '');
        setCursors((prev) => {
          const next = prev.filter((c) => c.id !== id);
          next.push({
            id,
            name: String(message.name ?? 'Guest'),
            colour: String(message.colour ?? '#C0663A'),
            x: Number(message.x) || 0,
            y: Number(message.y) || 0,
            at: Date.now(),
          });
          return next;
        });
        return;
      }

      if (kind === 'selection') {
        const id = String(message.from ?? '');
        const objectIds = (message.ids as string[]) ?? [];
        setSelections((prev) => {
          const next = prev.filter((s) => s.id !== id);
          if (objectIds.length) {
            next.push({
              id,
              colour: String(message.colour ?? '#C0663A'),
              name: String(message.name ?? 'Guest'),
              objectIds,
            });
          }
          return next;
        });
      }
    },
    [applyingRemote, editor, findById],
  );

  /* ----------------------------------------------------------- connect */

  // The handler closes over the editor, which is rebuilt on every canvas
  // tick. Held in a ref so the socket is opened once per design rather than
  // torn down and reconnected on every keystroke — which otherwise piles up
  // a new room member each time.
  const applyMessageRef = useRef(applyMessage);
  applyMessageRef.current = applyMessage;

  useEffect(() => {
    if (!enabled || !editor.ready || !designId) return;

    closedByUsRef.current = false;

    const open = () => {
      const base = getApiUrl().replace(/^http/, 'ws');
      const params = new URLSearchParams();
      if (shareToken) params.set('share', shareToken);
      else {
        const jwt = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!jwt) return;
        params.set('token', jwt);
      }
      if (displayName) params.set('name', displayName);

      const socket = new WebSocket(`${base}/api/ws/design/${designId}?${params.toString()}`);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        let message: Record<string, unknown>;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message.type === 'welcome') {
          setSelf(message.you as CollabMember);
          setMembers((message.members as CollabMember[]) ?? []);
          return;
        }
        if (message.type === 'presence') {
          setMembers((message.members as CollabMember[]) ?? []);
          return;
        }
        if (message.type === 'role') {
          setRevokedMessage(
            message.canEdit === false
              ? 'The owner changed this link to view-only.'
              : null,
          );
          return;
        }
        void applyMessageRef.current(message);
      };

      socket.onclose = (event) => {
        setConnected(false);
        setMembers([]);
        setCursors([]);
        setSelections([]);
        if (closedByUsRef.current) return;

        // 4003 is the server refusing us — the link was revoked or made
        // view-only. Retrying would just hammer a door that is now shut.
        if (event.code === 4003) {
          setRevokedMessage(event.reason || 'Sharing was turned off for this design.');
          return;
        }

        const attempt = (reconnectAttemptsRef.current += 1);
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** (attempt - 1), RECONNECT_MAX_MS);
        reconnectTimerRef.current = window.setTimeout(open, delay);
      };
    };

    open();

    return () => {
      closedByUsRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [designId, displayName, enabled, ready, shareToken]);

  /* --------------------------------------------------- broadcast local */

  useEffect(() => {
    const canvas = editorRef.current.canvasRef.current;
    if (!enabled || !ready || !canvas) return;

    const isEcho = () => applyingRef.current > 0;

    // A drag sends only the handful of numbers that changed, often enough to
    // look continuous on the other screen. The diff below carries the
    // committed state once the gesture ends.
    const onTransforming = (event: { target?: FabricObj }) => {
      if (isEcho() || !event.target) return;
      const now = Date.now();
      if (now - lastTransformSentRef.current < TRANSFORM_INTERVAL_MS) return;
      lastTransformSentRef.current = now;

      const target = event.target;
      const id = meta(target).dsId;
      if (!id) return;
      send({
        type: 'transform',
        id,
        props: {
          left: target.left,
          top: target.top,
          scaleX: target.scaleX,
          scaleY: target.scaleY,
          angle: target.angle,
          flipX: target.flipX,
          flipY: target.flipY,
        },
      });
    };

    const onSelection = () => {
      if (isEcho()) return;
      send({
        type: 'selection',
        ids: canvas.getActiveObjects().map((o) => meta(o).dsId).filter(Boolean),
      });
    };

    const onMouseMove = (event: { scenePoint?: { x: number; y: number } }) => {
      const point = event.scenePoint;
      if (!point) return;
      const now = Date.now();
      if (now - lastCursorSentRef.current < CURSOR_INTERVAL_MS) return;
      lastCursorSentRef.current = now;
      send({ type: 'cursor', x: Math.round(point.x), y: Math.round(point.y) });
    };

    canvas.on('object:moving', onTransforming);
    canvas.on('object:scaling', onTransforming);
    canvas.on('object:rotating', onTransforming);
    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', onSelection);
    canvas.on('mouse:move', onMouseMove);

    return () => {
      canvas.off('object:moving', onTransforming);
      canvas.off('object:scaling', onTransforming);
      canvas.off('object:rotating', onTransforming);
      canvas.off('selection:created', onSelection);
      canvas.off('selection:updated', onSelection);
      canvas.off('selection:cleared', onSelection);
      canvas.off('mouse:move', onMouseMove);
    };
  }, [enabled, ready, send]);

  /* ------------------------------------------------------- diff & send */

  /**
   * Work out what actually changed, and send only that.
   *
   * Hooking fabric's mouse events is not enough: nudging with the arrow
   * keys, typing a coordinate into the inspector, aligning, reordering and
   * undo all change the canvas without firing `object:modified`, so half of
   * every session would silently fail to reach the other people in it.
   * Comparing each object against the last thing broadcast catches every
   * one of those, whatever caused it — and stays object-level, so nobody's
   * in-flight work is overwritten by somebody else's whole scene.
   */
  useEffect(() => {
    if (!enabled || !ready || !connected) return;

    const timer = window.setTimeout(() => {
      if (applyingRef.current > 0) return;
      const canvas = editorRef.current.canvasRef.current;
      if (!canvas) return;

      const changed: Record<string, unknown>[] = [];
      const seen = new Set<string>();

      canvas.getObjects().forEach((object) => {
        const id = ensureId(object);
        seen.add(id);
        const json = serializeObject(object);
        const encoded = JSON.stringify(json);
        if (baselineRef.current.get(id) !== encoded) {
          baselineRef.current.set(id, encoded);
          changed.push(json);
        }
      });

      const removed = Array.from(baselineRef.current.keys()).filter((id) => !seen.has(id));
      removed.forEach((id) => baselineRef.current.delete(id));

      if (changed.length) send({ type: 'op', action: 'modify', objects: changed });
      if (removed.length) send({ type: 'op', action: 'remove', ids: removed });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [connected, editor.tick, enabled, ready, send, serializeObject]);

  /* ------------------------------------------------- catch new joiners */

  const knownMembersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!enabled || !self || !members.length) return;

    const ids = new Set(members.map((m) => m.id));
    const arrivals = members.filter((m) => !knownMembersRef.current.has(m.id));
    knownMembersRef.current = ids;

    // Someone new has only the last *saved* scene. Exactly one person sends
    // them the live one — the first in the roster — so a new joiner is not
    // buried under a copy from everybody at once.
    const isFirst = members[0]?.id === self.id;
    const someoneElseArrived = arrivals.some((m) => m.id !== self.id);
    if (!isFirst || !someoneElseArrived) return;

    const scene = editorRef.current.serialize();
    if (scene) send({ type: 'scene', canvas: scene });
  }, [enabled, members, self, send]);

  /* ------------------------------------------- forget stale cursors */

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - CURSOR_TTL_MS;
      setCursors((prev) => prev.filter((c) => c.at > cutoff));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return useMemo(
    () => ({
      connected,
      self,
      members,
      cursors,
      selections,
      revokedMessage,
      dismissRevoked: () => setRevokedMessage(null),
    }),
    [connected, cursors, members, revokedMessage, selections, self],
  );
};

export type CollaborationApi = ReturnType<typeof useCollaboration>;
