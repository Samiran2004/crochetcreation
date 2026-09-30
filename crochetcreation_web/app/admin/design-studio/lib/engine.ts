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
export const CUSTOM_PROPS = [
  'dsId',
  'dsName',
  'dsLocked',
  'dsSlot',
  'dsMask',
  'dsBackground',
] as const;

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
  /** Which entry of MASK_OPTIONS produced this object's clip path. */
  dsMask?: string;
  /** Marks the artboard's backdrop, which is pinned to the back of the stack. */
  dsBackground?: boolean;
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

/**
 * The artboard's size in design units.
 *
 * `canvas.getWidth()` is the *element* width, which the editor scales by the
 * zoom level — so reading it directly makes every new element's size and
 * position depend on how far the admin happened to be zoomed in. Dividing the
 * zoom back out gives the stable artboard coordinates everything should be
 * laid out in.
 */
export const boardSize = (canvas: FabricCanvas): { width: number; height: number } => {
  const zoom = canvas.getZoom() || 1;
  return { width: canvas.getWidth() / zoom, height: canvas.getHeight() / zoom };
};

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
  const boardWidth = boardSize(canvas).width;
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
  const { width: bw, height: bh } = boardSize(canvas);
  const board = Math.min(bw, bh);
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
  const { width: bw, height: bh } = boardSize(canvas);
  const board = Math.min(bw, bh);
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

/**
 * Put an object's centre at a point.
 *
 * Done as a delta from wherever the object's centre currently is, rather than
 * by computing a corner: fabric v7 defaults objects to a *centre* origin, so
 * `left`/`top` mean different things on different objects, and subtracting
 * half the width lands everything half its own size off-target. Measuring the
 * real centre and shifting by the difference is correct for any origin.
 */
export const centerOn = (obj: FabricObj, cx: number, cy: number): void => {
  obj.setCoords();
  const current = obj.getCenterPoint();
  obj.set({
    left: (obj.left ?? 0) + (cx - current.x),
    top: (obj.top ?? 0) + (cy - current.y),
  });
  obj.setCoords();
};

export const addToCanvas = (
  canvas: FabricCanvas,
  obj: FabricObj,
  opts: { center?: boolean; select?: boolean } = {},
): void => {
  if (opts.center !== false) {
    const board = boardSize(canvas);
    centerOn(obj, board.width / 2, board.height / 2);
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
  const { width: W, height: H } = boardSize(canvas);

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

// ------------------------------------------------------------ SVG import

/**
 * Turn SVG markup into real, editable fabric objects.
 *
 * Icons imported this way stay vector: every path can be recoloured, scaled
 * and restyled like anything else the Studio drew. Rasterising them into an
 * image would be simpler and would lose exactly the thing that makes an icon
 * library worth having.
 */
export const buildFromSvg = async (
  fabric: FabricModule,
  canvas: FabricCanvas,
  markup: string,
  options: { targetWidth?: number; recolor?: string } = {},
): Promise<FabricObj | null> => {
  const parsed = await fabric.loadSVGFromString(markup);
  const objects = (parsed.objects ?? []).filter((o): o is FabricObj => !!o);
  if (!objects.length) return null;

  const grouped = fabric.util.groupSVGElements(objects, parsed.options);

  // Many icon sets ship `fill="currentColor"` or no fill at all, which paints
  // black or nothing on the artboard. Recolouring on import means an imported
  // icon lands looking like it belongs to the design.
  if (options.recolor) {
    const paint = (obj: FabricObj) => {
      const group = obj as unknown as { _objects?: FabricObj[] };
      if (Array.isArray(group._objects)) {
        group._objects.forEach(paint);
        return;
      }
      const current = obj.fill;
      const hasFill = typeof current === 'string' && current !== 'none' && current !== '';
      if (hasFill || !obj.stroke) obj.set({ fill: options.recolor });
      if (obj.stroke) obj.set({ stroke: options.recolor });
    };
    paint(grouped);
  }

  const { width: bw, height: bh } = boardSize(canvas);
  const board = Math.min(bw, bh);
  const target = options.targetWidth ?? board * 0.28;
  const natural = grouped.width || 100;
  const scale = target / natural;
  grouped.set({ scaleX: scale, scaleY: scale });

  ensureId(grouped);
  meta(grouped).dsName = 'Imported graphic';
  return grouped;
};

// ------------------------------------------------------------ image masks

export interface MaskOption {
  id: string;
  label: string;
  /** `null` clears the mask. Otherwise SVG path data on a 100x100 box. */
  path: string | null;
  /** Circles and squares look wrong stretched, so they mask a centred square. */
  keepAspect?: boolean;
}

export const MASK_OPTIONS: MaskOption[] = [
  { id: 'none', label: 'None', path: null },
  { id: 'circle', label: 'Circle', path: 'M50 0 A50 50 0 1 1 49.99 0 Z', keepAspect: true },
  { id: 'ellipse', label: 'Ellipse', path: 'M50 0 A50 50 0 1 1 49.99 0 Z' },
  { id: 'square', label: 'Square', path: 'M0 0 H100 V100 H0 Z', keepAspect: true },
  { id: 'rounded', label: 'Rounded', path: 'M18 0 H82 A18 18 0 0 1 100 18 V82 A18 18 0 0 1 82 100 H18 A18 18 0 0 1 0 82 V18 A18 18 0 0 1 18 0 Z' },
  { id: 'squircle', label: 'Squircle', path: 'M50 0 C90 0 100 10 100 50 C100 90 90 100 50 100 C10 100 0 90 0 50 C0 10 10 0 50 0 Z', keepAspect: true },
  { id: 'arch', label: 'Arch', path: 'M0 100 V44 A50 44 0 0 1 100 44 V100 Z' },
  { id: 'arch-full', label: 'Dome', path: 'M0 100 V50 A50 50 0 0 1 100 50 V100 Z' },
  { id: 'triangle', label: 'Triangle', path: 'M50 0 L100 100 H0 Z' },
  { id: 'diamond', label: 'Diamond', path: 'M50 0 L100 50 L50 100 L0 50 Z', keepAspect: true },
  { id: 'hexagon', label: 'Hexagon', path: 'M25 2 H75 L100 50 L75 98 H25 L0 50 Z' },
  { id: 'pentagon', label: 'Pentagon', path: 'M50 0 L100 36 L81 100 H19 L0 36 Z' },
  { id: 'octagon', label: 'Octagon', path: 'M29 0 H71 L100 29 V71 L71 100 H29 L0 71 V29 Z', keepAspect: true },
  { id: 'star', label: 'Star', path: 'M50 0 L62 35 L100 36 L70 58 L80 96 L50 74 L20 96 L30 58 L0 36 L38 35 Z', keepAspect: true },
  { id: 'heart', label: 'Heart', path: 'M50 98 C50 98 2 66 2 34 C2 16 16 2 32 2 C42 2 48 8 50 16 C52 8 58 2 68 2 C84 2 98 16 98 34 C98 66 50 98 50 98 Z' },
  { id: 'blob', label: 'Blob', path: 'M76 8 C94 20 102 44 94 64 C86 84 62 100 42 97 C22 94 4 74 2 52 C0 30 12 10 30 4 C46 -1 60 -2 76 8 Z' },
  { id: 'teardrop', label: 'Teardrop', path: 'M50 0 C50 0 96 46 96 64 C96 84 75 100 50 100 C25 100 4 84 4 64 C4 46 50 0 50 0 Z' },
  { id: 'leaf', label: 'Leaf', path: 'M100 0 C100 0 92 60 58 88 C34 108 4 92 6 68 C8 44 38 40 58 34 C78 28 100 0 100 0 Z' },
  { id: 'shield', label: 'Shield', path: 'M50 0 L98 16 V52 C98 78 78 96 50 100 C22 96 2 78 2 52 V16 Z' },
  { id: 'flower', label: 'Flower', path: 'M50 2 C62 2 70 14 64 28 C80 20 94 30 92 44 C90 56 78 62 64 56 C74 68 68 86 54 88 C42 90 34 80 36 66 C26 78 10 74 6 62 C2 51 10 40 24 40 C10 32 12 14 24 10 C35 6 46 14 48 28 C46 14 42 2 50 2 Z' },
];

/**
 * Clip an image to a shape.
 *
 * The clip path lives in the image's own unscaled coordinate space and is
 * positioned from its centre, so the mask follows the image through any
 * later move, scale or rotation without needing to be rebuilt.
 */
export const applyMask = (
  fabric: FabricModule,
  image: FabricObj,
  mask: MaskOption,
): void => {
  if (!mask.path) {
    image.set({ clipPath: undefined });
    return;
  }

  const width = image.width || 1;
  const height = image.height || 1;
  const box = mask.keepAspect ? Math.min(width, height) : 0;

  const path = new fabric.Path(mask.path, {
    originX: 'center',
    originY: 'center',
  });
  meta(path).dsMask = mask.id;

  const naturalW = path.width || 100;
  const naturalH = path.height || 100;
  path.set({
    scaleX: (box || width) / naturalW,
    scaleY: (box || height) / naturalH,
    // A clip path is drawn in its owner's coordinate space, where the origin
    // is the owner's centre — so it has to sit at 0,0 rather than wherever
    // its own path data happens to place it.
    left: 0,
    top: 0,
  });

  image.set({ clipPath: path, dirty: true });
};

export const currentMaskId = (image: FabricObj): string => {
  const clip = image.clipPath as FabricObj | undefined;
  if (!clip) return 'none';
  return meta(clip).dsMask ?? 'custom';
};

// ------------------------------------------------------------ image crop

export interface CropRatio {
  id: string;
  label: string;
  /** width / height, or `null` for the image's own ratio. */
  ratio: number | null;
}

export const CROP_RATIOS: CropRatio[] = [
  { id: 'original', label: 'Original', ratio: null },
  { id: '1-1', label: '1:1', ratio: 1 },
  { id: '4-5', label: '4:5', ratio: 4 / 5 },
  { id: '3-4', label: '3:4', ratio: 3 / 4 },
  { id: '2-3', label: '2:3', ratio: 2 / 3 },
  { id: '4-3', label: '4:3', ratio: 4 / 3 },
  { id: '3-2', label: '3:2', ratio: 3 / 2 },
  { id: '16-9', label: '16:9', ratio: 16 / 9 },
  { id: '9-16', label: '9:16', ratio: 9 / 16 },
];

/**
 * Crop to an aspect ratio, centred on what is currently visible.
 *
 * fabric crops by narrowing `width`/`height` and offsetting `cropX`/`cropY`
 * into the source bitmap, so the crop is lossless — switching back to
 * "Original" restores the full frame.
 */
export const applyCrop = (image: FabricNS.FabricImage, ratio: number | null): void => {
  const element = image.getElement() as HTMLImageElement | HTMLCanvasElement;
  const naturalW =
    (element as HTMLImageElement).naturalWidth || element.width || image.width || 1;
  const naturalH =
    (element as HTMLImageElement).naturalHeight || element.height || image.height || 1;

  if (ratio === null) {
    image.set({ cropX: 0, cropY: 0, width: naturalW, height: naturalH });
    image.setCoords();
    return;
  }

  let cropW = naturalW;
  let cropH = Math.round(naturalW / ratio);
  if (cropH > naturalH) {
    cropH = naturalH;
    cropW = Math.round(naturalH * ratio);
  }

  image.set({
    cropX: Math.round((naturalW - cropW) / 2),
    cropY: Math.round((naturalH - cropH) / 2),
    width: cropW,
    height: cropH,
  });
  image.setCoords();
};

// ------------------------------------------------------- background image

export type BackgroundFit = 'cover' | 'contain' | 'stretch' | 'tile';

/**
 * Size and place the backdrop against the artboard.
 *
 * The backdrop is an ordinary object rather than `canvas.backgroundImage`,
 * so it can be dragged, rotated and scaled like anything else — fabric's
 * built-in background is non-interactive by design and offers no way in.
 * What keeps it *behaving* like a background is that it is pinned to the
 * back of the stack, not that it is a different kind of thing.
 */
export const fitBackground = (
  image: FabricObj,
  fit: BackgroundFit,
  boardWidth: number,
  boardHeight: number,
): void => {
  const w = image.width || 1;
  const h = image.height || 1;

  // Fitting is measured against the unrotated bitmap; rotation is preserved
  // so changing the fit never silently straightens an angled backdrop.
  if (fit === 'stretch') {
    image.set({ scaleX: boardWidth / w, scaleY: boardHeight / h });
  } else if (fit === 'contain') {
    const scale = Math.min(boardWidth / w, boardHeight / h);
    image.set({ scaleX: scale, scaleY: scale });
  } else {
    const scale = Math.max(boardWidth / w, boardHeight / h);
    image.set({ scaleX: scale, scaleY: scale });
  }

  centerOn(image, boardWidth / 2, boardHeight / 2);
};

export const markAsBackground = (image: FabricObj, locked: boolean): void => {
  meta(image).dsBackground = true;
  meta(image).dsName = 'Background';
  meta(image).dsLocked = locked;
  image.set({
    selectable: !locked,
    evented: !locked,
    hasControls: !locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingX: locked,
    lockScalingY: locked,
  });
};

export const findBackground = (canvas: FabricCanvas): FabricObj | undefined =>
  canvas.getObjects().find((obj) => meta(obj).dsBackground === true);

/**
 * Keep the backdrop behind everything else.
 *
 * Anything added later lands on top of it naturally, but undo, paste and
 * "bring to front" can all shuffle it forward — so the invariant is
 * re-asserted after every change rather than assumed.
 */
export const pinBackgroundToBack = (canvas: FabricCanvas): void => {
  const background = findBackground(canvas);
  if (!background) return;
  if (canvas.getObjects().indexOf(background) !== 0) {
    canvas.sendObjectToBack(background);
  }
};
