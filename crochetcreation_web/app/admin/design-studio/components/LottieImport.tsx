'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Film, Link2, Sparkles, UploadCloud } from 'lucide-react';
import { Field, Slider, Spinner, TextButton } from './ui';
import { importFromUrl, saveElement } from '../lib/api';
import type { DesignEditorApi } from './useDesignEditor';

/* The slice of lottie-web this uses, typed locally so the module can stay a
   lazy import — pulling the whole player into the editor chunk to satisfy
   the compiler would defeat the point of loading it on demand. */
interface LottieAnimation {
  totalFrames: number;
  goToAndStop: (value: number, isFrame?: boolean) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
}

interface LottiePlayer {
  loadAnimation: (config: {
    container: Element;
    renderer: 'svg';
    loop: boolean;
    autoplay: boolean;
    animationData: unknown;
  }) => LottieAnimation;
}

let playerPromise: Promise<LottiePlayer> | null = null;
const loadPlayer = (): Promise<LottiePlayer> => {
  if (!playerPromise) {
    // The SVG build only: the canvas and HTML renderers are dead weight here.
    playerPromise = import('lottie-web/build/player/lottie_svg').then(
      (m) => ((m as unknown as { default?: LottiePlayer }).default ??
        (m as unknown as LottiePlayer)),
    );
  }
  return playerPromise;
};

const isLottie = (value: unknown): boolean =>
  !!value &&
  typeof value === 'object' &&
  ['v', 'fr', 'op', 'layers'].every((k) => k in (value as Record<string, unknown>));

/**
 * Import a Lottie animation and place a frame of it on the artboard.
 *
 * A design here is a still — a poster, a thumbnail, a card — so an animation
 * has to become one moment of itself to be usable. The player runs hidden,
 * the admin scrubs to the frame they want, and that frame is taken from the
 * live SVG the player has already drawn, which means it lands as real shapes
 * rather than a screenshot of them.
 */
export const LottieImport: React.FC<{
  editor: DesignEditorApi;
  onError: (message: string) => void;
  onSaved: () => void;
  /** A saved animation picked from the library, reopened for scrubbing. */
  preload?: { name: string; content: string } | null;
}> = ({ editor, onError, onSaved, preload }) => {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [frame, setFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<LottieAnimation | null>(null);
  const dataRef = useRef<string | null>(null);
  const sourceRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      animationRef.current?.destroy();
      animationRef.current = null;
    },
    [],
  );

  const mount = useCallback(
    async (json: string, label: string, source?: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        onError('That file is not valid JSON.');
        return;
      }
      if (!isLottie(parsed)) {
        onError('That JSON is not a Lottie animation. Download the Lottie JSON from LottieFiles.');
        return;
      }

      const player = await loadPlayer();
      animationRef.current?.destroy();
      if (stageRef.current) stageRef.current.innerHTML = '';

      const animation = player.loadAnimation({
        container: stageRef.current as Element,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: parsed,
      });

      animationRef.current = animation;
      dataRef.current = json;
      sourceRef.current = source ?? null;
      setName(label);
      setTotalFrames(Math.max(0, Math.floor(animation.totalFrames) - 1));
      setFrame(0);
      setNote(null);
    },
    [onError],
  );

  const fromFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await mount(await file.text(), file.name.replace(/\.json$/i, ''));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not read that file.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const fromUrl = async () => {
    const link = url.trim();
    if (!link) return;
    setBusy(true);
    try {
      // Routed through the API: animation hosts rarely send CORS headers,
      // and the browser cannot read a cross-origin JSON body without them.
      const result = await importFromUrl(link);
      if (result.kind !== 'lottie' || !result.lottie) {
        onError('That link is not a Lottie animation. Use the .json link from LottieFiles.');
        return;
      }
      await mount(result.lottie, link.split('/').pop()?.replace(/\.json$/i, '') || 'Animation', link);
      setUrl('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not import from that link.');
    } finally {
      setBusy(false);
    }
  };

  // Choosing a saved animation in the library reopens it here, so a
  // different frame can be taken from it without importing it again.
  const preloadKey = preload ? `${preload.name}:${preload.content.length}` : null;
  useEffect(() => {
    if (!preload) return;
    void mount(preload.content, preload.name);
    // `mount` is stable for a given error handler; keying on the animation
    // itself avoids remounting on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadKey]);

  const scrub = (value: number) => {
    setFrame(value);
    animationRef.current?.goToAndStop(value, true);
  };

  const place = async (keepForLater: boolean) => {
    const markup = stageRef.current?.querySelector('svg')?.outerHTML;
    if (!markup) {
      onError('Nothing is loaded yet.');
      return;
    }

    setAdding(true);
    try {
      const ok = await editor.addSvgMarkup(markup);
      if (!ok) {
        onError('That frame could not be converted into shapes. Try a different frame.');
        return;
      }

      if (keepForLater && dataRef.current) {
        await saveElement({
          name: name || 'Animation',
          kind: 'lottie',
          content: dataRef.current,
          source_url: sourceRef.current,
        });
        onSaved();
        setNote('Placed, and saved to your library for any future design.');
      } else {
        setNote('Placed on the artboard as editable shapes.');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not add that frame.');
    } finally {
      setAdding(false);
    }
  };

  const loaded = totalFrames > 0 || !!animationRef.current;

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => void fromFile(e.target.files)}
        className="hidden"
      />

      <TextButton variant="primary" full disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? <Spinner /> : <UploadCloud className="h-4 w-4" />}
        Upload a Lottie .json
      </TextButton>

      <div className="flex gap-1.5">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void fromUrl();
          }}
          placeholder="…or paste a LottieFiles .json link"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-gray-250 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 placeholder-gray-400 focus:border-teal focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        />
        <TextButton variant="outline" size="sm" disabled={busy || !url.trim()} onClick={() => void fromUrl()}>
          <Link2 className="h-3 w-3" />
          Load
        </TextButton>
      </div>

      {/* The player needs to be in the document to render, but it is a
          workbench rather than part of the design — so it lives here, in the
          panel, next to the controls that drive it. */}
      <div
        className={`overflow-hidden rounded-xl border border-gray-200 bg-[repeating-conic-gradient(#f3f3f0_0_25%,#ffffff_0_50%)] bg-[length:16px_16px] dark:border-slate-700 ${
          loaded ? '' : 'hidden'
        }`}
      >
        <div ref={stageRef} className="mx-auto h-36 w-full [&_svg]:!h-full [&_svg]:!w-full" />
      </div>

      {!loaded && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-gray-250 px-3 py-6 text-center dark:border-slate-700">
          <Film className="h-7 w-7 text-gray-300 dark:text-slate-600" />
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            No animation loaded
          </p>
          <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
            Load one, scrub to the moment you like, and drop that frame onto the artboard as
            editable shapes.
          </p>
        </div>
      )}

      {loaded && (
        <>
          <Field label={`Frame · ${frame} of ${totalFrames}`}>
            <Slider value={frame} min={0} max={Math.max(1, totalFrames)} onChange={scrub} />
          </Field>

          <div className="flex gap-1.5">
            <TextButton
              variant="outline"
              size="sm"
              full
              onClick={() => animationRef.current?.play()}
            >
              Play
            </TextButton>
            <TextButton
              variant="outline"
              size="sm"
              full
              onClick={() => animationRef.current?.pause()}
            >
              Pause
            </TextButton>
          </div>

          <TextButton variant="primary" full disabled={adding} onClick={() => void place(true)}>
            {adding ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            Add frame &amp; save to library
          </TextButton>
          <TextButton variant="ghost" size="sm" full disabled={adding} onClick={() => void place(false)}>
            Add this frame only
          </TextButton>
        </>
      )}

      {note && (
        <p className="text-[10.5px] font-semibold leading-relaxed text-teal dark:text-parchment">
          {note}
        </p>
      )}

      <p className="text-[10px] leading-relaxed text-gray-450 dark:text-slate-500">
        A design here is a still image, so an animation comes in as one frame of itself. Save it to
        the library and you can come back for a different frame any time.
      </p>
    </div>
  );
};
