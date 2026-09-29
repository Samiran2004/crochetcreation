import type * as FabricNS from 'fabric';
import type { SelectionKind } from './types';
import type { TemplateLayer, TemplateSpec } from './templates';
import { loadFont } from './fonts';

export type FabricModule = typeof FabricNS;
export type FabricCanvas = FabricNS.Canvas;
export type FabricObj = FabricNS.FabricObject;

/**
 * Editor-owned metadata that has to survive a save/load round trip.
 *
 * Fabric only serializes properties it knows about, so anything the Studio
 * adds must be registered on `FabricObject.customProperties` — otherwise a
 * reopened design loses every layer name and lock.
 */
export const CUSTOM_PROPS = ['dsId', 'dsName', 'dsLocked', 'dsSlot'] as const;

let customPropsRegistered = false;

export const registerCustomProps = (fabric: FabricModule): void => {
  if (customPropsRegistered) return;
  fabric.FabricObject.customProperties = [...CUSTOM_PROPS];
  customPropsRegistered = true;
};

/** Loose accessor for the editor's own properties on a fabric object. */
type Meta = {
  dsId?: string;
  dsName?: string;
  dsLocked?: boolean;
  dsSlot?: boolean;
};

export const meta = (obj: FabricObj): Meta => obj as unknown as Meta;

let idCounter = 0;
export const nextId = (): string => {
  idCounter += 1;
  return `ds_${Date.now().toString(36)}_${idCounter.toString(36)}`;
};

export const ensureId = (obj: FabricObj): string => {
  const m = meta(obj);
  if (!m.dsId) m.dsId = nextId();
  return m.dsId;
};

// --------------------------------------------------------------- helpers

export const kindOf = (obj: FabricObj | null | undefined): SelectionKind => {
  if (!obj) return 'none';
  const type = obj.type;
  if (type === 'activeselection') return 'multiple';
  if (type === 'group') return 'group';
  if (type === 'textbox' || type === 'i-text' || type === 'text') return 'text';
  if (type === 'image') return 'image';
  if (type === 'path' || type === 'polyline' || type === 'polygon') return 'path';
  return 'shape';
};

export const defaultNameFor = (obj: FabricObj): string => {
  const kind = kindOf(obj);
  if (kind === 'text') {
    const raw = ((obj as unknown as { text?: string }).text ?? '').trim();
    const firstLine = raw.split('\n')[0];
    return firstLine ? firstLine.slice(0, 28) : 'Text';
  }
  if (kind === 'image') return 'Image';
  if (kind === 'group') return 'Group';
  if (kind === 'path') return 'Shape';
  const map: Record<string, string> = {
    rect: 'Rectangle',
    circle: 'Circle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    line: 'Line',
  };
  return map[obj.type] ?? 'Element';
};

export const layerName = (obj: FabricObj): string => meta(obj).dsName || defaultNameFor(obj);

/**
 * Turn a CSS-style angle into fabric gradient coordinates on the unit square.
 * 0deg points up and angles run clockwise, matching `linear-gradient`.
 */
export const gradientCoords = (angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  return {
    x1: 0.5 - dx,
    y1: 0.5 - dy,
    x2: 0.5 + dx,
    y2: 0.5 + dy,
  };
};

export const makeLinearGradient = (
  fabric: FabricModule,
  from: string,
  to: string,
  angle: number,
): FabricNS.Gradient<'linear'> =>
  new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'percentage',
    coords: gradientCoords(angle),
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  });

export const makeRadialGradient = (
  fabric: FabricModule,
  from: string,
  to: string,
): FabricNS.Gradient<'radial'> =>
  new fabric.Gradient({
    type: 'radial',
    gradientUnits: 'percentage',
    coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5 },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  });

/**
 * The canvas background is painted in device pixels rather than percentages:
 * fabric resolves a percentage filler against the object it fills, and the
 * background has no object, so a percentage gradient collapses to a stripe.
 */
export const makeBackgroundGradient = (
  fabric: FabricModule,
  from: string,
  to: string,
  angle: number,
  width: number,
  height: number,
): FabricNS.Gradient<'linear'> => {
  const c = gradientCoords(angle);
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords: {
      x1: c.x1 * width,
      y1: c.y1 * height,
      x2: c.x2 * width,
      y2: c.y2 * height,
    },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  });
};

export const isGradientFill = (value: unknown): value is FabricNS.Gradient<'linear' | 'radial'> =>
  !!value && typeof value === 'object' && 'colorStops' in (value as Record<string, unknown>);

/** Best-effort solid colour for a fill that may be a gradient or a pattern. */
export const fillToColor = (value: unknown, fallback = '#000000'): string => {
  if (typeof value === 'string') return value;
  if (isGradientFill(value)) {
    const stops = value.colorStops;
    if (stops && stops.length) return stops[0].color;
  }
  return fallback;
};

// --------------------------------------------------------------- factory

export interface TextOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fill?: string;
  width?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontStyle?: 'normal' | 'italic';
  charSpacing?: number;
  lineHeight?: number;
}

export const createText = (
  fabric: FabricModule,
  canvas: FabricCanvas,
  options: TextOptions = {},
): FabricNS.Textbox => {
  const boardWidth = canvas.getWidth();
  const width = options.width ?? Math.round(boardWidth * 0.6);

  const textbox = new fabric.Textbox(options.text ?? 'Your text here', {
    width,
    fontSize: options.fontSize ?? Math.round(boardWidth * 0.06),
    fontFamily: options.fontFamily ?? 'Playfair Display',
    fontWeight: options.fontWeight ?? 400,
    fontStyle: options.fontStyle ?? 'normal',
    fill: options.fill ?? '#23423C',
    textAlign: options.textAlign ?? 'center',
    charSpacing: options.charSpacing ?? 0,
    lineHeight: options.lineHeight ?? 1.16,
    // Corner handles would scale the glyphs unevenly; side handles reflow the
    // box instead, which is what people expect from a text frame.
    lockScalingFlip: true,
    splitByGrapheme: false,
    objectCaching: false,
  });
  meta(textbox).dsId = nextId();
  return textbox;
};

export interface ShapeOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number;
}

export const createPrimitive = (
  fabric: FabricModule,
  canvas: FabricCanvas,
  kind: string,
  options: ShapeOptions = {},
): FabricObj => {
  const board = Math.min(canvas.getWidth(), canvas.getHeight());
  const size = options.size ?? Math.round(board * 0.3);
  const shared = {
    fill: options.fill ?? '#1F4E4A',
    stroke: options.stroke,
    strokeWidth: options.strokeWidth ?? 0,
    strokeUniform: true,
  };

  let shape: FabricObj;
  switch (kind) {
    case 'rounded':
      shape = new fabric.Rect({ ...shared, width: size * 1.4, height: size, rx: size * 0.16, ry: size * 0.16 });
      break;
    case 'circle':
      shape = new fabric.Circle({ ...shared, radius: size / 2 });
      break;
    case 'ellipse':
      shape = new fabric.Ellipse({ ...shared, rx: size * 0.7, ry: size * 0.45 });
      break;
    case 'triangle':
      shape = new fabric.Triangle({ ...shared, width: size, height: size });
      break;
    case 'line':
      shape = new fabric.Line([0, 0, size * 1.6, 0], {
        stroke: options.stroke ?? options.fill ?? '#1F4E4A',
        strokeWidth: options.strokeWidth ?? Math.max(2, Math.round(board * 0.008)),
        strokeUniform: true,
        strokeLineCap: 'round',
      });
      break;
    case 'rect':
    default:
      shape = new fabric.Rect({ ...shared, width: size * 1.4, height: size });
      break;
  }

  meta(shape).dsId = nextId();
  return shape;
};

export const createPathShape = (
  fabric: FabricModule,
  canvas: FabricCanvas,
  pathData: string,
  options: { strokeOnly?: boolean; color?: string; targetWidth?: number } = {},
): FabricNS.Path => {
  const board = Math.min(canvas.getWidth(), canvas.getHeight());
  const color = options.color ?? '#1F4E4A';
  const strokeWidth = options.strokeOnly ? 6 : 0;

  const path = new fabric.Path(pathData, {
    fill: options.strokeOnly ? 'transparent' : color,
    stroke: options.strokeOnly ? color : undefined,
    strokeWidth,
    strokeUniform: true,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
  });

  // Path data is authored on a 100x100 box; scale it to a sensible share of
  // the artboard so a dropped icon is never a 100px speck on an A4 poster.
  const target = options.targetWidth ?? board * 0.25;
  const natural = path.width || 100;
  const scale = target / natural;
  path.set({ scaleX: scale, scaleY: scale });

  meta(path).dsId = nextId();
  return path;
};

export const loadImage = async (
  fabric: FabricModule,
  url: string,
): Promise<FabricNS.FabricImage> => {
  // Cloudinary sends `Access-Control-Allow-Origin: *`; requesting the image
  // anonymously keeps the canvas untainted so exports still work.
  const image = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
  meta(image).dsId = nextId();
  return image;
};

/** Scale an image so it fits inside a box without distorting it. */
export const fitInto = (obj: FabricObj, boxWidth: number, boxHeight: number): void => {
  const w = obj.width || 1;
  const h = obj.height || 1;
  const scale = Math.min(boxWidth / w, boxHeight / h);
  obj.set({ scaleX: scale, scaleY: scale });
};

/** Scale an image so it covers a box, cropping the overflow. */
export const coverBox = (obj: FabricObj, boxWidth: number, boxHeight: number): void => {
  const w = obj.width || 1;
  const h = obj.height || 1;
  const scale = Math.max(boxWidth / w, boxHeight / h);
  obj.set({ scaleX: scale, scaleY: scale });
};

export const centerOn = (obj: FabricObj, cx: number, cy: number): void => {
  obj.set({
    left: cx - obj.getScaledWidth() / 2,
    top: cy - obj.getScaledHeight() / 2,
  });
  obj.setCoords();
};

export const addToCanvas = (
  canvas: FabricCanvas,
  obj: FabricObj,
  opts: { center?: boolean; select?: boolean } = {},
): void => {
  if (opts.center !== false) {
    centerOn(obj, canvas.getWidth() / 2, canvas.getHeight() / 2);
  }
  canvas.add(obj);
  if (opts.select !== false) {
    canvas.setActiveObject(obj);
  }
  canvas.requestRenderAll();
};

// -------------------------------------------------------------- templates

const buildLayer = (
  fabric: FabricModule,
  layer: TemplateLayer,
  W: number,
  H: number,
): FabricObj | null => {
  const short = Math.min(W, H);

  if (layer.type === 'rect') {
    const w = layer.w * W;
    const h = layer.h * H;
    const rect = new fabric.Rect({
      width: w,
      height: h,
      rx: layer.radius === 999 ? Math.min(w, h) / 2 : (layer.radius ?? 0),
      ry: layer.radius === 999 ? Math.min(w, h) / 2 : (layer.radius ?? 0),
      fill: layer.gradient
        ? makeLinearGradient(fabric, layer.gradient.from, layer.gradient.to, layer.gradient.angle)
        : (layer.fill ?? '#1F4E4A'),
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      strokeUniform: true,
      opacity: layer.opacity ?? 1,
      angle: layer.angle ?? 0,
    });
    centerOn(rect, layer.x * W, layer.y * H);
    return rect;
  }

  if (layer.type === 'circle') {
    const circle = new fabric.Circle({
      radius: layer.r * short,
      fill: layer.fill ?? '#F4EADA',
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      strokeUniform: true,
      opacity: layer.opacity ?? 1,
    });
    centerOn(circle, layer.x * W, layer.y * H);
    return circle;
  }

  if (layer.type === 'path') {
    const path = new fabric.Path(layer.d, {
      fill: layer.fill ?? (layer.stroke ? 'transparent' : '#1F4E4A'),
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth ?? 0,
      strokeUniform: true,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: layer.opacity ?? 1,
      angle: layer.angle ?? 0,
    });
    const scale = (layer.w * W) / (path.width || 100);
    path.set({ scaleX: scale, scaleY: scale });
    centerOn(path, layer.x * W, layer.y * H);
    return path;
  }

  if (layer.type === 'text') {
    const content = layer.uppercase ? layer.text.toUpperCase() : layer.text;
    const textbox = new fabric.Textbox(content, {
      width: layer.w * W,
      fontSize: layer.size * short,
      fontFamily: layer.font,
      fontWeight: layer.weight ?? 400,
      fontStyle: layer.italic ? 'italic' : 'normal',
      fill: layer.fill ?? '#23423C',
      textAlign: layer.align ?? 'center',
      charSpacing: layer.letterSpacing ?? 0,
      lineHeight: layer.lineHeight ?? 1.16,
      objectCaching: false,
    });
    centerOn(textbox, layer.x * W, layer.y * H);
    return textbox;
  }

  if (layer.type === 'imageSlot') {
    const w = layer.w * W;
    const h = layer.h * H;
    const slot = new fabric.Rect({
      width: w,
      height: h,
      rx: layer.radius === 999 ? Math.min(w, h) / 2 : (layer.radius ?? 0),
      ry: layer.radius === 999 ? Math.min(w, h) / 2 : (layer.radius ?? 0),
      fill: '#E7DCC6',
      stroke: '#C0663A',
      strokeWidth: 2,
      strokeDashArray: [10, 8],
      strokeUniform: true,
    });
    meta(slot).dsSlot = true;
    meta(slot).dsName = layer.label ?? 'Image slot';
    centerOn(slot, layer.x * W, layer.y * H);
    return slot;
  }

  return null;
};

/**
 * Replace the canvas contents with a template.
 *
 * Fonts are loaded first: fabric measures text at construction time, so a
 * family that arrives late produces a box sized for the fallback face and the
 * layout silently drifts.
 */
export const applyTemplate = async (
  fabric: FabricModule,
  canvas: FabricCanvas,
  spec: TemplateSpec,
): Promise<void> => {
  const W = canvas.getWidth();
  const H = canvas.getHeight();

  const families = Array.from(
    new Set(spec.layers.filter((l) => l.type === 'text').map((l) => (l as { font: string }).font)),
  );
  await Promise.all(families.map((f) => loadFont(f)));

  canvas.remove(...canvas.getObjects());

  canvas.backgroundColor =
    typeof spec.background === 'string'
      ? spec.background
      : makeBackgroundGradient(
          fabric,
          spec.background.from,
          spec.background.to,
          spec.background.angle,
          W,
          H,
        );

  for (const layer of spec.layers) {
    const obj = buildLayer(fabric, layer, W, H);
    if (!obj) continue;
    ensureId(obj);
    canvas.add(obj);
  }

  canvas.discardActiveObject();
  canvas.requestRenderAll();
};
