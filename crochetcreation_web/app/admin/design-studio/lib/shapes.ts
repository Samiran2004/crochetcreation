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

export const BADGE_SHAPES: PathShape[] = [
  { id: 'badge-scallop', label: 'Scalloped Badge', path: 'M50 3 L59 11 L70 6 L76 16 L88 15 L90 27 L99 33 L95 45 L100 55 L92 63 L94 75 L82 78 L78 90 L66 88 L57 97 L47 90 L35 95 L28 85 L16 85 L14 73 L4 66 L10 55 L5 44 L14 36 L13 24 L25 22 L31 11 L42 14 Z' },
  { id: 'badge-round', label: 'Round Seal', path: 'M50 4 A46 46 0 1 1 49.9 4 Z M50 14 A36 36 0 1 0 50.1 14 Z' },
  { id: 'badge-shield', label: 'Shield Badge', path: 'M50 3 L92 16 V48 C92 74 74 90 50 98 C26 90 8 74 8 48 V16 Z M50 13 L82 23 V48 C82 68 68 81 50 88 C32 81 18 68 18 48 V23 Z' },
  { id: 'badge-ribbon', label: 'Ribbon Banner', path: 'M6 26 H94 V62 H6 Z M6 26 L16 44 L6 62 M94 26 L84 44 L94 62' },
  { id: 'badge-tape', label: 'Tape Banner', path: 'M2 32 H98 L86 50 L98 68 H2 L14 50 Z' },
  { id: 'badge-pennant', label: 'Pennant', path: 'M10 8 H90 V60 L50 92 L10 60 Z' },
  { id: 'badge-starburst', label: 'Starburst', path: 'M50 0 L58 16 L74 8 L74 26 L92 24 L84 40 L100 50 L84 60 L92 76 L74 74 L74 92 L58 84 L50 100 L42 84 L26 92 L26 74 L8 76 L16 60 L0 50 L16 40 L8 24 L26 26 L26 8 L42 16 Z' },
  { id: 'badge-hexseal', label: 'Hex Seal', path: 'M50 2 L92 26 V74 L50 98 L8 74 V26 Z M50 14 L82 32 V68 L50 86 L18 68 V32 Z' },
  { id: 'badge-price', label: 'Price Bubble', path: 'M50 6 A44 34 0 1 1 49.9 6 Z M36 70 L30 92 L52 74 Z' },
  { id: 'badge-arch', label: 'Arch Plate', path: 'M14 96 V38 A36 36 0 0 1 86 38 V96 Z M24 86 V38 A26 26 0 0 1 76 38 V86 Z' },
];

export const BUBBLE_SHAPES: PathShape[] = [
  { id: 'bubble-round', label: 'Speech Bubble', path: 'M14 10 H86 A10 10 0 0 1 96 20 V62 A10 10 0 0 1 86 72 H44 L24 92 V72 H14 A10 10 0 0 1 4 62 V20 A10 10 0 0 1 14 10 Z' },
  { id: 'bubble-oval', label: 'Oval Bubble', path: 'M50 8 A46 34 0 1 1 49.9 8 Z M30 70 L22 94 L50 76 Z' },
  { id: 'bubble-think', label: 'Thought Bubble', path: 'M50 6 A40 28 0 1 1 49.9 6 Z M28 64 A9 9 0 1 1 27.9 64 Z M16 82 A6 6 0 1 1 15.9 82 Z' },
  { id: 'bubble-shout', label: 'Shout Bubble', path: 'M50 4 L62 18 L80 12 L78 30 L96 34 L84 48 L96 62 L78 66 L80 84 L62 78 L50 94 L38 78 L20 84 L22 66 L4 62 L16 48 L4 34 L22 30 L20 12 L38 18 Z' },
  { id: 'bubble-square', label: 'Square Bubble', path: 'M6 10 H94 V70 H56 L36 92 V70 H6 Z' },
  { id: 'bubble-double', label: 'Reply Bubble', path: 'M4 8 H72 V50 H32 L18 64 V50 H4 Z M40 56 H96 V90 H62 L50 100 V90 H40 Z' },
];

export const FRAME_SHAPES: PathShape[] = [
  { id: 'frame-thin', label: 'Thin Frame', path: 'M6 6 H94 V94 H6 Z', strokeOnly: true },
  { id: 'frame-double', label: 'Double Frame', path: 'M4 4 H96 V96 H4 Z M12 12 H88 V88 H12 Z', strokeOnly: true },
  { id: 'frame-corners', label: 'Corner Marks', path: 'M6 26 V6 H26 M74 6 H94 V26 M94 74 V94 H74 M26 94 H6 V74', strokeOnly: true },
  { id: 'frame-arch', label: 'Arch Frame', path: 'M10 94 V40 A40 40 0 0 1 90 40 V94 Z', strokeOnly: true },
  { id: 'frame-circle', label: 'Circle Frame', path: 'M50 6 A44 44 0 1 1 49.9 6 Z', strokeOnly: true },
  { id: 'frame-oval', label: 'Oval Frame', path: 'M50 6 A32 44 0 1 1 49.9 6 Z', strokeOnly: true },
  { id: 'frame-deco', label: 'Deco Frame', path: 'M22 6 H78 L94 22 V78 L78 94 H22 L6 78 V22 Z', strokeOnly: true },
  { id: 'frame-notch', label: 'Notched Frame', path: 'M6 6 H70 L94 30 V94 H30 L6 70 Z', strokeOnly: true },
  { id: 'frame-dashed', label: 'Dashed Frame', path: 'M6 6 H32 M44 6 H68 M80 6 H94 V30 M94 42 H94 M94 56 V94 H70 M58 94 H32 M20 94 H6 V70 M6 58 V32', strokeOnly: true },
];

export const BOTANICAL_SHAPES: PathShape[] = [
  { id: 'bot-sprig', label: 'Sprig', path: 'M50 98 C50 60 50 28 50 4 M50 76 C34 76 22 66 20 50 C38 48 50 58 50 76 Z M50 58 C66 58 78 48 80 32 C62 30 50 40 50 58 Z M50 40 C38 40 30 32 28 20 C42 19 50 27 50 40 Z', strokeOnly: true },
  { id: 'bot-eucalyptus', label: 'Eucalyptus', path: 'M8 94 C30 70 56 44 92 10 M34 62 A11 11 0 1 1 33.9 62 Z M52 44 A11 11 0 1 1 51.9 44 Z M70 26 A11 11 0 1 1 69.9 26 Z M22 74 A9 9 0 1 1 21.9 74 Z', strokeOnly: true },
  { id: 'bot-fern', label: 'Fern', path: 'M50 96 V8 M50 82 L26 70 M50 82 L74 70 M50 66 L28 54 M50 66 L72 54 M50 50 L32 40 M50 50 L68 40 M50 34 L36 26 M50 34 L64 26', strokeOnly: true },
  { id: 'bot-wreath', label: 'Wreath', path: 'M50 8 C74 8 92 26 92 50 C92 74 74 92 50 92 C26 92 8 74 8 50 C8 26 26 8 50 8 Z M50 8 L44 2 M50 92 L56 98', strokeOnly: true },
  { id: 'bot-rose', label: 'Rose', path: 'M50 50 A6 6 0 1 1 49.9 50 Z M50 38 C62 38 68 46 66 56 C78 54 84 64 78 72 C86 78 84 90 74 92 M50 38 C38 38 32 46 34 56 C22 54 16 64 22 72 C14 78 16 90 26 92', strokeOnly: true },
  { id: 'bot-tulip', label: 'Tulip', path: 'M50 96 V44 M32 30 C32 18 40 8 50 8 C60 8 68 18 68 30 C68 40 60 46 50 46 C40 46 32 40 32 30 Z M50 70 C36 70 26 60 26 48 C40 48 50 58 50 70 Z', strokeOnly: true },
  { id: 'bot-daisy', label: 'Daisy', path: 'M50 42 A8 8 0 1 1 49.9 42 Z M50 8 C58 18 58 30 50 42 C42 30 42 18 50 8 Z M92 50 C82 58 70 58 58 50 C70 42 82 42 92 50 Z M50 92 C42 82 42 70 50 58 C58 70 58 82 50 92 Z M8 50 C18 42 30 42 42 50 C30 58 18 58 8 50 Z', strokeOnly: true },
  { id: 'bot-lavender', label: 'Lavender', path: 'M50 96 V40 M50 40 C42 34 40 22 46 10 C56 18 58 30 50 40 Z M38 52 C30 48 26 38 30 28 M62 52 C70 48 74 38 70 28', strokeOnly: true },
  { id: 'bot-vine', label: 'Vine', path: 'M4 50 C20 20 36 80 52 50 C68 20 84 80 96 50 M26 36 A7 7 0 1 1 25.9 36 Z M62 64 A7 7 0 1 1 61.9 64 Z', strokeOnly: true },
  { id: 'bot-palm', label: 'Palm Leaf', path: 'M50 96 C50 60 56 26 78 6 M50 78 C40 66 40 52 48 42 M56 62 C50 48 52 34 62 26 M62 44 C60 32 64 22 72 16', strokeOnly: true },
];

export const ABSTRACT_SHAPES: PathShape[] = [
  { id: 'abs-blob1', label: 'Blob A', path: 'M70 6 C88 14 100 36 94 56 C88 76 66 94 46 92 C26 90 8 72 6 52 C4 32 18 12 36 6 C48 2 58 1 70 6 Z' },
  { id: 'abs-blob2', label: 'Blob B', path: 'M30 8 C56 2 86 12 92 34 C98 56 82 74 62 86 C42 98 18 94 8 76 C-2 58 6 34 18 20 Z' },
  { id: 'abs-blob3', label: 'Blob C', path: 'M50 2 C74 2 96 20 96 46 C96 72 78 98 52 98 C26 98 4 78 4 52 C4 26 26 2 50 2 Z M50 2 C60 20 40 24 50 2 Z' },
  { id: 'abs-pill-stack', label: 'Pill Stack', path: 'M14 14 H86 A10 10 0 0 1 86 34 H14 A10 10 0 0 1 14 14 Z M14 40 H60 A10 10 0 0 1 60 60 H14 A10 10 0 0 1 14 40 Z M14 66 H86 A10 10 0 0 1 86 86 H14 A10 10 0 0 1 14 66 Z' },
  { id: 'abs-dots', label: 'Dot Grid', path: 'M18 18 A6 6 0 1 1 17.9 18 Z M50 18 A6 6 0 1 1 49.9 18 Z M82 18 A6 6 0 1 1 81.9 18 Z M18 50 A6 6 0 1 1 17.9 50 Z M50 50 A6 6 0 1 1 49.9 50 Z M82 50 A6 6 0 1 1 81.9 50 Z M18 82 A6 6 0 1 1 17.9 82 Z M50 82 A6 6 0 1 1 49.9 82 Z M82 82 A6 6 0 1 1 81.9 82 Z' },
  { id: 'abs-rings', label: 'Rings', path: 'M34 50 A28 28 0 1 1 33.9 50 Z M34 62 A16 16 0 1 0 34.1 62 Z M66 50 A28 28 0 1 1 65.9 50 Z M66 62 A16 16 0 1 0 66.1 62 Z' },
  { id: 'abs-wave-lines', label: 'Wave Lines', path: 'M4 30 C20 12 34 48 50 30 C66 12 80 48 96 30 M4 54 C20 36 34 72 50 54 C66 36 80 72 96 54 M4 78 C20 60 34 96 50 78 C66 60 80 96 96 78', strokeOnly: true },
  { id: 'abs-zigzag', label: 'Zigzag', path: 'M4 66 L20 34 L36 66 L52 34 L68 66 L84 34 L96 58', strokeOnly: true },
  { id: 'abs-grain', label: 'Grain Stack', path: 'M8 22 H92 M8 36 H92 M8 50 H92 M8 64 H92 M8 78 H92', strokeOnly: true },
  { id: 'abs-arc-set', label: 'Arc Set', path: 'M8 88 A42 42 0 0 1 92 88 M22 88 A28 28 0 0 1 78 88 M36 88 A14 14 0 0 1 64 88', strokeOnly: true },
  { id: 'abs-confetti', label: 'Confetti', path: 'M16 12 L26 22 M74 10 L84 20 M40 26 L48 34 M12 48 L22 58 M62 44 L72 54 M30 66 L40 76 M78 68 L88 78 M50 84 L58 92', strokeOnly: true },
  { id: 'abs-sunburst', label: 'Sunburst', path: 'M50 4 V22 M50 78 V96 M4 50 H22 M78 50 H96 M17 17 L30 30 M70 70 L83 83 M83 17 L70 30 M30 70 L17 83 M50 32 A18 18 0 1 1 49.9 32 Z', strokeOnly: true },
];

export const SOCIAL_SHAPES: PathShape[] = [
  { id: 'soc-instagram', label: 'Instagram', path: 'M28 8 H72 A20 20 0 0 1 92 28 V72 A20 20 0 0 1 72 92 H28 A20 20 0 0 1 8 72 V28 A20 20 0 0 1 28 8 Z M50 32 A18 18 0 1 1 49.9 32 Z M74 22 A5 5 0 1 1 73.9 22 Z', strokeOnly: true },
  { id: 'soc-whatsapp', label: 'WhatsApp', path: 'M50 6 A44 44 0 0 0 12 72 L6 94 L29 88 A44 44 0 1 0 50 6 Z M36 34 C34 40 38 52 48 60 C58 68 68 68 72 64 L66 56 L58 60 C52 56 46 50 42 44 L48 38 Z', strokeOnly: true },
  { id: 'soc-facebook', label: 'Facebook', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M58 34 H68 V20 H56 C46 20 42 28 42 36 V44 H32 V58 H42 V92 H56 V58 H68 L70 44 H56 V36 C56 34 57 34 58 34 Z', strokeOnly: true },
  { id: 'soc-youtube', label: 'YouTube', path: 'M8 28 H92 V72 H8 Z M42 40 L64 50 L42 60 Z', strokeOnly: true },
  { id: 'soc-pinterest', label: 'Pinterest', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M44 92 C44 78 52 56 52 56 C50 52 50 46 52 42 C56 32 70 36 68 48 C66 58 60 66 54 64 C50 62 50 56 50 56', strokeOnly: true },
  { id: 'soc-x', label: 'X', path: 'M12 10 L88 90 M88 10 L12 90', strokeOnly: true },
  { id: 'soc-web', label: 'Website', path: 'M50 6 A44 44 0 1 1 49.9 6 Z M6 50 H94 M50 6 C66 24 66 76 50 94 C34 76 34 24 50 6 Z', strokeOnly: true },
  { id: 'soc-share', label: 'Share', path: 'M74 18 A12 12 0 1 1 73.9 18 Z M26 50 A12 12 0 1 1 25.9 50 Z M74 82 A12 12 0 1 1 73.9 82 Z M36 44 L64 26 M36 58 L64 76', strokeOnly: true },
];

export const COMMERCE_SHAPES: PathShape[] = [
  { id: 'com-cart', label: 'Cart', path: 'M4 10 H20 L32 62 H80 L92 26 H26 M38 82 A8 8 0 1 1 37.9 82 Z M74 82 A8 8 0 1 1 73.9 82 Z', strokeOnly: true },
  { id: 'com-rupee', label: 'Rupee', path: 'M26 14 H74 M26 34 H74 M26 14 C54 14 60 22 60 32 C60 44 50 52 30 52 L70 90 M26 52 H38', strokeOnly: true },
  { id: 'com-discount', label: 'Discount', path: 'M50 4 L62 12 L76 10 L80 24 L92 32 L86 46 L92 60 L80 68 L76 82 L62 80 L50 90 L38 80 L24 82 L20 68 L8 60 L14 46 L8 32 L20 24 L24 10 L38 12 Z M36 36 A6 6 0 1 1 35.9 36 Z M64 58 A6 6 0 1 1 63.9 58 Z M66 32 L34 64', strokeOnly: true },
  { id: 'com-delivery', label: 'Free Delivery', path: 'M4 26 H56 V66 H4 Z M56 38 H74 L94 58 V66 H56 Z M24 70 A9 9 0 1 1 23.9 70 Z M74 70 A9 9 0 1 1 73.9 70 Z', strokeOnly: true },
  { id: 'com-secure', label: 'Secure', path: 'M26 44 V30 A24 24 0 0 1 74 30 V44 M14 44 H86 V90 H14 Z M50 60 V74', strokeOnly: true },
  { id: 'com-return', label: 'Easy Returns', path: 'M50 8 A42 42 0 1 0 92 50 M50 8 L34 22 M50 8 L34 -4 M36 44 H64 M36 58 H56', strokeOnly: true },
  { id: 'com-support', label: 'Support', path: 'M20 54 V44 A30 30 0 0 1 80 44 V54 M8 52 H24 V78 H14 A6 6 0 0 1 8 72 Z M92 52 H76 V78 H86 A6 6 0 0 0 92 72 Z M76 78 C76 88 66 92 56 92', strokeOnly: true },
  { id: 'com-review', label: 'Five Stars', path: 'M18 34 L22 44 L33 45 L25 52 L27 63 L18 57 L9 63 L11 52 L3 45 L14 44 Z M50 34 L54 44 L65 45 L57 52 L59 63 L50 57 L41 63 L43 52 L35 45 L46 44 Z M82 34 L86 44 L97 45 L89 52 L91 63 L82 57 L73 63 L75 52 L67 45 L78 44 Z' },
];

export const SHAPE_GROUPS: ShapeGroup[] = [
  { id: 'geometric', label: 'Shapes', items: GEOMETRIC_SHAPES },
  { id: 'abstract', label: 'Abstract & Patterns', items: ABSTRACT_SHAPES },
  { id: 'lines', label: 'Lines & Arrows', items: LINE_SHAPES },
  { id: 'badges', label: 'Badges & Banners', items: BADGE_SHAPES },
  { id: 'frames', label: 'Frames', items: FRAME_SHAPES },
  { id: 'bubbles', label: 'Speech Bubbles', items: BUBBLE_SHAPES },
  { id: 'botanical', label: 'Botanical', items: BOTANICAL_SHAPES },
  { id: 'craft', label: 'Craft & Store', items: CRAFT_ICONS },
  { id: 'commerce', label: 'Commerce', items: COMMERCE_SHAPES },
  { id: 'social', label: 'Social', items: SOCIAL_SHAPES },
];

