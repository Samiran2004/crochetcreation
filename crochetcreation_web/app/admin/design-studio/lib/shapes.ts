/**
 * The elements palette.
 *
 * Everything here is expressed as SVG path data on a 100x100 box (or as a
 * primitive fabric builds natively). Paths keep the library dependency-free
 * and let every item scale, recolour and stroke like any other object.
 */

export type PrimitiveKind =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'line';

export interface PrimitiveShape {
  id: string;
  label: string;
  kind: PrimitiveKind;
  /** Preview path, used only for the swatch in the panel. */
  preview: string;
}

export interface PathShape {
  id: string;
  label: string;
  path: string;
  /** Outline-only items (arrows, ticks, dividers) read better as strokes. */
  strokeOnly?: boolean;
}

export const PRIMITIVES: PrimitiveShape[] = [
  { id: 'rect', label: 'Rectangle', kind: 'rect', preview: 'M10 22 H90 V78 H10 Z' },
  { id: 'rounded', label: 'Rounded', kind: 'rounded', preview: 'M25 22 H75 A18 18 0 0 1 93 40 V60 A18 18 0 0 1 75 78 H25 A18 18 0 0 1 7 60 V40 A18 18 0 0 1 25 22 Z' },
  { id: 'circle', label: 'Circle', kind: 'circle', preview: 'M50 8 A42 42 0 1 1 49.9 8 Z' },
  { id: 'ellipse', label: 'Ellipse', kind: 'ellipse', preview: 'M50 22 A44 28 0 1 1 49.9 22 Z' },
  { id: 'triangle', label: 'Triangle', kind: 'triangle', preview: 'M50 12 L92 84 H8 Z' },
  { id: 'line', label: 'Line', kind: 'line', preview: 'M8 50 H92' },
];

export const GEOMETRIC_SHAPES: PathShape[] = [
  { id: 'star5', label: 'Star', path: 'M50 4 L61.8 35.5 L95 37.3 L69.2 58.4 L77.6 90.5 L50 72.4 L22.4 90.5 L30.8 58.4 L5 37.3 L38.2 35.5 Z' },
  { id: 'star6', label: 'Six Star', path: 'M50 3 L63.5 26.5 L90.6 26.5 L77.1 50 L90.6 73.5 L63.5 73.5 L50 97 L36.5 73.5 L9.4 73.5 L22.9 50 L9.4 26.5 L36.5 26.5 Z' },
  { id: 'burst', label: 'Burst', path: 'M50 2 L57 22 L74 9 L72 30 L93 26 L81 43 L98 50 L81 57 L93 74 L72 70 L74 91 L57 78 L50 98 L43 78 L26 91 L28 70 L7 74 L19 57 L2 50 L19 43 L7 26 L28 30 L26 9 L43 22 Z' },
  { id: 'diamond', label: 'Diamond', path: 'M50 5 L95 50 L50 95 L5 50 Z' },
  { id: 'pentagon', label: 'Pentagon', path: 'M50 4 L95 37 L78 90 H22 L5 37 Z' },
  { id: 'hexagon', label: 'Hexagon', path: 'M27 8 H73 L96 50 L73 92 H27 L4 50 Z' },
  { id: 'octagon', label: 'Octagon', path: 'M32 5 H68 L95 32 V68 L68 95 H32 L5 68 V32 Z' },
  { id: 'heart', label: 'Heart', path: 'M50 88 C50 88 6 61 6 33 C6 17 18 6 32 6 C41 6 47 11 50 17 C53 11 59 6 68 6 C82 6 94 17 94 33 C94 61 50 88 50 88 Z' },
  { id: 'blob', label: 'Blob', path: 'M74 12 C88 22 96 42 90 60 C84 78 64 94 46 92 C28 90 12 72 8 54 C4 36 12 18 27 10 C42 2 60 2 74 12 Z' },
  { id: 'squircle', label: 'Squircle', path: 'M50 3 C84 3 97 16 97 50 C97 84 84 97 50 97 C16 97 3 84 3 50 C3 16 16 3 50 3 Z' },
  { id: 'teardrop', label: 'Teardrop', path: 'M50 4 C50 4 88 44 88 62 C88 82 71 96 50 96 C29 96 12 82 12 62 C12 44 50 4 50 4 Z' },
  { id: 'shield', label: 'Shield', path: 'M50 4 L90 18 V50 C90 74 72 90 50 97 C28 90 10 74 10 50 V18 Z' },
  { id: 'cross', label: 'Cross', path: 'M38 5 H62 V38 H95 V62 H62 V95 H38 V62 H5 V38 H38 Z' },
  { id: 'chevron', label: 'Chevron', path: 'M12 8 L58 8 L88 50 L58 92 H12 L42 50 Z' },
  { id: 'parallelogram', label: 'Slant', path: 'M26 20 H96 L74 80 H4 Z' },
  { id: 'trapezoid', label: 'Trapezoid', path: 'M26 20 H74 L94 80 H6 Z' },
  { id: 'arch', label: 'Arch', path: 'M12 95 V40 A38 38 0 0 1 88 40 V95 Z' },
  { id: 'capsule', label: 'Capsule', path: 'M30 28 H70 A22 22 0 0 1 70 72 H30 A22 22 0 0 1 30 28 Z' },
  { id: 'quarter', label: 'Quarter', path: 'M8 92 V8 A84 84 0 0 1 92 92 Z' },
  { id: 'halfcircle', label: 'Half Circle', path: 'M6 72 A44 44 0 0 1 94 72 Z' },
  { id: 'ring', label: 'Ring', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M50 26 A24 24 0 1 0 50.1 26 Z' },
  { id: 'flower', label: 'Flower', path: 'M50 6 C60 6 66 16 62 28 C74 22 86 28 86 40 C86 50 76 56 64 52 C72 62 68 76 56 80 C46 84 38 76 38 64 C30 74 16 72 10 62 C5 53 11 43 23 42 C12 36 12 22 22 16 C31 11 41 16 44 28 C42 16 42 6 50 6 Z' },
  { id: 'leaf', label: 'Leaf', path: 'M92 8 C92 8 84 62 52 86 C30 102 6 88 10 66 C14 44 40 40 58 36 C76 32 92 8 92 8 Z' },
  { id: 'wave', label: 'Wave', path: 'M4 56 C20 30 34 30 50 56 C66 82 80 82 96 56 L96 92 H4 Z' },
];

export const LINE_SHAPES: PathShape[] = [
  { id: 'arrow-right', label: 'Arrow', path: 'M6 50 H86 M66 30 L88 50 L66 70', strokeOnly: true },
  { id: 'arrow-both', label: 'Double Arrow', path: 'M8 50 H92 M28 32 L8 50 L28 68 M72 32 L92 50 L72 68', strokeOnly: true },
  { id: 'arrow-curve', label: 'Curved Arrow', path: 'M8 78 C8 32 46 14 86 22 M68 8 L90 22 L72 40', strokeOnly: true },
  { id: 'divider', label: 'Divider', path: 'M4 50 H96', strokeOnly: true },
  { id: 'divider-dot', label: 'Dotted Rule', path: 'M6 50 H22 M34 50 H50 M62 50 H78 M88 50 H96', strokeOnly: true },
  { id: 'flourish', label: 'Flourish', path: 'M4 50 C20 30 32 70 50 50 C68 30 80 70 96 50', strokeOnly: true },
  { id: 'bracket', label: 'Bracket', path: 'M34 8 C18 8 18 42 8 50 C18 58 18 92 34 92', strokeOnly: true },
  { id: 'check', label: 'Check', path: 'M12 54 L38 80 L88 22', strokeOnly: true },
  { id: 'close', label: 'Cross Mark', path: 'M18 18 L82 82 M82 18 L18 82', strokeOnly: true },
  { id: 'plus', label: 'Plus', path: 'M50 12 V88 M12 50 H88', strokeOnly: true },
  { id: 'corner', label: 'Corner Rule', path: 'M6 6 V40 M6 6 H40', strokeOnly: true },
  { id: 'frame-line', label: 'Frame', path: 'M8 8 H92 V92 H8 Z', strokeOnly: true },
];

/** Craft-shop iconography — the things this brand actually sells and says. */
export const CRAFT_ICONS: PathShape[] = [
  { id: 'yarn-ball', label: 'Yarn Ball', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M14 38 C34 34 62 46 84 34 M8 56 C30 52 58 66 90 52 M22 20 C34 40 40 70 34 90 M56 9 C64 32 66 62 58 88' , strokeOnly: true },
  { id: 'hook', label: 'Crochet Hook', path: 'M70 10 C82 10 88 18 88 26 C88 36 80 40 72 38 M72 38 L26 88 C22 92 14 92 10 88 C6 84 6 78 10 74 L58 26', strokeOnly: true },
  { id: 'needles', label: 'Knitting Needles', path: 'M12 88 L78 18 M22 92 L88 22 M74 14 A7 7 0 1 1 73.9 14 Z M84 18 A7 7 0 1 1 83.9 18 Z', strokeOnly: true },
  { id: 'spool', label: 'Thread Spool', path: 'M28 12 H72 V88 H28 Z M18 12 H82 M18 88 H82 M36 28 H64 M36 42 H64 M36 56 H64 M36 70 H64', strokeOnly: true },
  { id: 'scissors', label: 'Scissors', path: 'M22 14 L66 66 M78 14 L34 66 M22 78 A12 12 0 1 1 21.9 78 Z M78 78 A12 12 0 1 1 77.9 78 Z', strokeOnly: true },
  { id: 'button', label: 'Button', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M38 40 A5 5 0 1 1 37.9 40 Z M62 40 A5 5 0 1 1 61.9 40 Z M38 60 A5 5 0 1 1 37.9 60 Z M62 60 A5 5 0 1 1 61.9 60 Z', strokeOnly: true },
  { id: 'thimble', label: 'Thimble', path: 'M26 44 C26 22 40 8 50 8 C60 8 74 22 74 44 V84 H26 Z M26 62 H74', strokeOnly: true },
  { id: 'sweater', label: 'Sweater', path: 'M32 12 L50 22 L68 12 L92 30 L80 48 L72 42 V90 H28 V42 L20 48 L8 30 Z', strokeOnly: true },
  { id: 'sock', label: 'Sock', path: 'M32 8 H60 V52 L84 72 C92 78 90 90 80 92 C72 94 30 94 22 88 C14 82 14 68 22 60 L32 52 Z', strokeOnly: true },
  { id: 'gift', label: 'Gift', path: 'M8 36 H92 V54 H8 Z M14 54 H86 V92 H14 Z M50 36 V92 M50 36 C50 36 32 36 26 28 C20 20 28 8 38 12 C46 16 50 36 50 36 Z M50 36 C50 36 68 36 74 28 C80 20 72 8 62 12 C54 16 50 36 50 36 Z', strokeOnly: true },
  { id: 'tag', label: 'Price Tag', path: 'M8 8 H48 L92 52 L52 92 L8 48 Z M26 26 A7 7 0 1 1 25.9 26 Z', strokeOnly: true },
  { id: 'bag', label: 'Shopping Bag', path: 'M18 30 H82 L88 92 H12 Z M34 40 V22 A16 16 0 0 1 66 22 V40', strokeOnly: true },
  { id: 'star-badge', label: 'Star Badge', path: 'M50 8 L62 34 L90 38 L70 58 L75 88 L50 74 L25 88 L30 58 L10 38 L38 34 Z', strokeOnly: true },
  { id: 'sparkle', label: 'Sparkle', path: 'M50 6 C54 32 68 46 94 50 C68 54 54 68 50 94 C46 68 32 54 6 50 C32 46 46 32 50 6 Z' },
  { id: 'sparkle-trio', label: 'Sparkle Trio', path: 'M36 8 C39 26 48 34 66 37 C48 40 39 49 36 66 C33 49 24 40 6 37 C24 34 33 26 36 8 Z M76 54 C78 64 82 68 92 70 C82 72 78 77 76 86 C74 77 70 72 60 70 C70 68 74 64 76 54 Z' },
  { id: 'heart-line', label: 'Heart Outline', path: 'M50 86 C50 86 8 60 8 34 C8 18 20 8 33 8 C41 8 47 13 50 19 C53 13 59 8 67 8 C80 8 92 18 92 34 C92 60 50 86 50 86 Z', strokeOnly: true },
  { id: 'flower-line', label: 'Bloom', path: 'M50 44 A10 10 0 1 1 49.9 44 Z M50 34 C50 14 66 8 72 18 C78 28 66 36 50 34 M50 34 C50 14 34 8 28 18 C22 28 34 36 50 34 M56 56 C72 66 76 84 64 88 C54 92 50 74 56 56 M44 56 C28 66 24 84 36 88 C46 92 50 74 44 56', strokeOnly: true },
  { id: 'branch', label: 'Branch', path: 'M50 96 V14 M50 70 C34 70 22 60 20 44 C38 42 50 52 50 70 Z M50 52 C66 52 78 42 80 26 C62 24 50 34 50 52 Z M50 34 C38 34 30 26 28 14 C42 13 50 21 50 34 Z', strokeOnly: true },
  { id: 'crown', label: 'Crown', path: 'M10 80 L18 28 L36 48 L50 18 L64 48 L82 28 L90 80 Z M10 90 H90', strokeOnly: true },
  { id: 'ribbon', label: 'Ribbon', path: 'M30 8 H70 V72 L50 58 L30 72 Z', strokeOnly: true },
  { id: 'quote', label: 'Quote Mark', path: 'M14 62 C14 38 26 22 44 18 L48 30 C38 34 32 42 32 50 H44 V78 H14 Z M56 62 C56 38 68 22 86 18 L90 30 C80 34 74 42 74 50 H86 V78 H56 Z' },
  { id: 'location', label: 'Location Pin', path: 'M50 94 C50 94 82 60 82 38 A32 32 0 1 0 18 38 C18 60 50 94 50 94 Z M50 38 A12 12 0 1 1 49.9 38 Z', strokeOnly: true },
  { id: 'phone', label: 'Phone', path: 'M28 8 H72 V92 H28 Z M42 78 H58', strokeOnly: true },
  { id: 'mail', label: 'Mail', path: 'M8 22 H92 V78 H8 Z M8 22 L50 56 L92 22', strokeOnly: true },
  { id: 'globe', label: 'Globe', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M6 50 H94 M50 6 C66 24 66 76 50 94 C34 76 34 24 50 6 Z', strokeOnly: true },
  { id: 'truck', label: 'Delivery', path: 'M6 22 H60 V70 H6 Z M60 36 H78 L94 52 V70 H60 Z M26 70 A10 10 0 1 1 25.9 70 Z M76 70 A10 10 0 1 1 75.9 70 Z', strokeOnly: true },
  { id: 'verified', label: 'Verified', path: 'M50 4 L62 14 L78 12 L82 28 L96 36 L88 50 L96 64 L82 72 L78 88 L62 86 L50 96 L38 86 L22 88 L18 72 L4 64 L12 50 L4 36 L18 28 L22 12 L38 14 Z M32 50 L44 62 L70 36', strokeOnly: true },
];

export interface ShapeGroup {
  id: string;
  label: string;
  items: PathShape[];
}

export const SHAPE_GROUPS: ShapeGroup[] = [
  { id: 'geometric', label: 'Shapes', items: GEOMETRIC_SHAPES },
  { id: 'lines', label: 'Lines & Arrows', items: LINE_SHAPES },
  { id: 'craft', label: 'Craft & Store Icons', items: CRAFT_ICONS },
];
