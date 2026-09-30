/**
 * Starter layouts.
 *
 * These are declarative specs rather than raw fabric JSON: hand-writing a
 * serialized scene graph is brittle (every fabric property has to be spelled
 * exactly right), whereas a spec is readable, diffable, and built into real
 * objects by `buildTemplate` at insert time using the same code paths the
 * editor's own "add element" buttons use.
 *
 * Coordinates are fractions of the artboard (0–1), so one template fits any
 * canvas size — a square product thumbnail and a tall story both work.
 */

export type TemplateLayer =
  | {
      type: 'rect';
      x: number; y: number; w: number; h: number;
      fill?: string;
      gradient?: { from: string; to: string; angle: number };
      radius?: number;
      opacity?: number;
      stroke?: string;
      strokeWidth?: number;
      angle?: number;
    }
  | {
      type: 'circle';
      x: number; y: number; r: number;
      fill?: string;
      opacity?: number;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: 'path';
      d: string;
      x: number; y: number; w: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      angle?: number;
    }
  | {
      type: 'text';
      text: string;
      x: number; y: number; w: number;
      /** Font size as a fraction of the artboard's shorter side. */
      size: number;
      font: string;
      weight?: number | 'bold' | 'normal';
      italic?: boolean;
      fill?: string;
      align?: 'left' | 'center' | 'right';
      letterSpacing?: number;
      lineHeight?: number;
      uppercase?: boolean;
    }
  | {
      type: 'imageSlot';
      x: number; y: number; w: number; h: number;
      radius?: number;
      label?: string;
    };

export interface TemplateSpec {
  id: string;
  name: string;
  category: 'Product' | 'Social' | 'Promo' | 'Editorial' | 'Cinematic' | 'Blank';
  /** The preset this layout was drawn for; used to pick a default size. */
  presetKey: string;
  background: string | { from: string; to: string; angle: number };
  /** Two-tone swatch for the template card in the picker. */
  swatch: [string, string];
  layers: TemplateLayer[];
}

export const TEMPLATES: TemplateSpec[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'Blank',
    presetKey: 'product-square',
    background: '#FFFCF5',
    swatch: ['#FFFCF5', '#EADFC8'],
    layers: [],
  },


  // -------------------------------------------------- Vintage Cinematica
  // Wide web-hero layouts in the "vintage cinematica" idiom: a full-bleed
  // photograph knocked back under a dark scrim, an oversized display
  // headline mixing roman and italic, a quiet caption, and a single pale
  // pill button. The scrim is what makes the type readable over any photo,
  // so it is part of the layout rather than something to add afterwards.
  {
    id: 'cinematic-blog-hero',
    name: 'Cinematic Blog Hero',
    category: 'Cinematic',
    presetKey: 'hero-banner',
    background: '#14170F',
    swatch: ['#1C2416', '#E9F08A'],
    layers: [
      { type: 'imageSlot', x: 0.5, y: 0.46, w: 1, h: 0.92, label: 'Hero photograph' },
      { type: 'rect', x: 0.5, y: 0.46, w: 1, h: 0.92, gradient: { from: 'rgba(14,18,11,0.35)', to: 'rgba(14,18,11,0.88)', angle: 200 } },
      { type: 'text', text: 'Notes from a', x: 0.5, y: 0.34, w: 0.8, size: 0.135, font: 'Playfair Display', weight: 400, fill: '#F6F4E8', align: 'center' },
      { type: 'text', text: 'Life in Progress', x: 0.5, y: 0.5, w: 0.8, size: 0.135, font: 'Playfair Display', weight: 400, italic: true, fill: '#F6F4E8', align: 'center' },
      { type: 'text', text: 'Thoughts, discoveries, and tiny joys collected along the way', x: 0.5, y: 0.62, w: 0.66, size: 0.028, font: 'Instrument Sans', weight: 400, fill: '#DCE0CD', align: 'center' },
      { type: 'rect', x: 0.5, y: 0.735, w: 0.15, h: 0.085, fill: '#F2F5C8', radius: 999 },
      { type: 'text', text: 'Read the latest', x: 0.5, y: 0.735, w: 0.14, size: 0.026, font: 'Instrument Sans', weight: 600, fill: '#1C2416', align: 'center' },
      { type: 'rect', x: 0.23, y: 0.955, w: 0.46, h: 0.09, fill: '#14170F' },
      { type: 'rect', x: 0.73, y: 0.955, w: 0.54, h: 0.09, fill: '#F2F5C8' },
    ],
  },
  {
    id: 'cinematic-about-hero',
    name: 'Cinematic About Hero',
    category: 'Cinematic',
    presetKey: 'hero-banner',
    background: '#2A1F17',
    swatch: ['#4A3524', '#F2F0B8'],
    layers: [
      { type: 'imageSlot', x: 0.5, y: 0.5, w: 1, h: 1, label: 'Portrait photograph' },
      { type: 'rect', x: 0.5, y: 0.5, w: 1, h: 1, gradient: { from: 'rgba(36,26,18,0.92)', to: 'rgba(36,26,18,0.15)', angle: 90 } },
      { type: 'text', text: 'Hi,', x: 0.205, y: 0.245, w: 0.34, size: 0.085, font: 'Instrument Sans', weight: 400, fill: '#F4EFE4', align: 'left' },
      { type: 'text', text: 'I\u2019m the maker.', x: 0.315, y: 0.375, w: 0.56, size: 0.105, font: 'Instrument Sans', weight: 700, fill: '#F4EFE4', align: 'left' },
      { type: 'text', text: 'Hand-crocheted pieces, made slowly\nand sent out with care.', x: 0.295, y: 0.53, w: 0.52, size: 0.026, font: 'Instrument Sans', weight: 400, fill: '#D9CEBE', align: 'left', lineHeight: 1.55 },
      { type: 'rect', x: 0.175, y: 0.745, w: 0.18, h: 0.085, fill: '#F2F0B8', radius: 999 },
      { type: 'text', text: 'Explore my work', x: 0.175, y: 0.745, w: 0.17, size: 0.026, font: 'Instrument Sans', weight: 600, fill: '#2A1F17', align: 'center' },
    ],
  },

  // ------------------------------------------------------------ Product
  {
    id: 'product-classic',
    name: 'Classic Product',
    category: 'Product',
    presetKey: 'product-square',
    background: { from: '#FFFCF5', to: '#EADFC8', angle: 135 },
    swatch: ['#FFFCF5', '#1F4E4A'],
    layers: [
      { type: 'circle', x: 0.5, y: 0.44, r: 0.33, fill: '#F4EADA' },
      { type: 'imageSlot', x: 0.5, y: 0.44, w: 0.56, h: 0.56, radius: 999, label: 'Product photo' },
      { type: 'text', text: 'Handmade', x: 0.5, y: 0.79, w: 0.8, size: 0.032, font: 'Instrument Sans', weight: 600, fill: '#C0663A', align: 'center', letterSpacing: 420, uppercase: true },
      { type: 'text', text: 'Cotton Flower Pot', x: 0.5, y: 0.855, w: 0.84, size: 0.075, font: 'Playfair Display', weight: 600, fill: '#1F4E4A', align: 'center' },
      { type: 'text', text: '₹499', x: 0.5, y: 0.935, w: 0.5, size: 0.048, font: 'Instrument Sans', weight: 700, fill: '#23423C', align: 'center' },
    ],
  },
  {
    id: 'product-editorial',
    name: 'Editorial Split',
    category: 'Product',
    presetKey: 'product-portrait',
    background: '#FFFCF5',
    swatch: ['#1F4E4A', '#F4EADA'],
    layers: [
      { type: 'rect', x: 0.5, y: 0.31, w: 1, h: 0.62, fill: '#1F4E4A' },
      { type: 'imageSlot', x: 0.5, y: 0.31, w: 0.78, h: 0.5, radius: 12, label: 'Product photo' },
      { type: 'text', text: 'New This Week', x: 0.5, y: 0.685, w: 0.8, size: 0.026, font: 'Instrument Sans', weight: 600, fill: '#C79A4B', align: 'center', letterSpacing: 460, uppercase: true },
      { type: 'text', text: 'The Winter\nCollection', x: 0.5, y: 0.79, w: 0.86, size: 0.088, font: 'Cormorant Garamond', weight: 600, fill: '#23423C', align: 'center', lineHeight: 1.05 },
      { type: 'path', d: 'M4 50 C20 30 32 70 50 50 C68 30 80 70 96 50', x: 0.5, y: 0.885, w: 0.22, stroke: '#C0663A', strokeWidth: 4 },
      { type: 'text', text: 'Crafted by hand in Kolkata', x: 0.5, y: 0.94, w: 0.8, size: 0.026, font: 'Instrument Sans', fill: '#4A5A52', align: 'center' },
    ],
  },
  {
    id: 'product-badge',
    name: 'Sale Badge',
    category: 'Product',
    presetKey: 'product-square',
    background: '#F4EADA',
    swatch: ['#C0663A', '#F4EADA'],
    layers: [
      { type: 'imageSlot', x: 0.5, y: 0.46, w: 0.92, h: 0.72, radius: 18, label: 'Product photo' },
      { type: 'path', d: 'M50 2 L57 22 L74 9 L72 30 L93 26 L81 43 L98 50 L81 57 L93 74 L72 70 L74 91 L57 78 L50 98 L43 78 L26 91 L28 70 L7 74 L19 57 L2 50 L19 43 L7 26 L28 30 L26 9 L43 22 Z', x: 0.79, y: 0.19, w: 0.3, fill: '#C0663A' },
      { type: 'text', text: '30%\nOFF', x: 0.79, y: 0.19, w: 0.2, size: 0.055, font: 'Archivo Black', fill: '#FFFCF5', align: 'center', lineHeight: 1 },
      { type: 'text', text: 'Festive Offer', x: 0.5, y: 0.88, w: 0.86, size: 0.062, font: 'DM Serif Display', fill: '#1F4E4A', align: 'center' },
      { type: 'text', text: 'Limited pieces · Free delivery', x: 0.5, y: 0.945, w: 0.86, size: 0.028, font: 'Instrument Sans', weight: 500, fill: '#4A5A52', align: 'center' },
    ],
  },

  // ------------------------------------------------------------- Social
  {
    id: 'social-quote',
    name: 'Quote Card',
    category: 'Social',
    presetKey: 'ig-post',
    background: { from: '#2C6560', to: '#16403C', angle: 135 },
    swatch: ['#2C6560', '#C79A4B'],
    layers: [
      { type: 'path', d: 'M8 8 H92 V92 H8 Z', x: 0.5, y: 0.5, w: 0.86, stroke: '#C79A4B', strokeWidth: 2 },
      { type: 'path', d: 'M14 62 C14 38 26 22 44 18 L48 30 C38 34 32 42 32 50 H44 V78 H14 Z M56 62 C56 38 68 22 86 18 L90 30 C80 34 74 42 74 50 H86 V78 H56 Z', x: 0.5, y: 0.26, w: 0.11, fill: '#C79A4B' },
      { type: 'text', text: 'Every stitch carries\na little bit of\nsomeone’s time.', x: 0.5, y: 0.5, w: 0.74, size: 0.072, font: 'Cormorant Garamond', weight: 500, italic: true, fill: '#F6EEDF', align: 'center', lineHeight: 1.3 },
      { type: 'text', text: 'Crochet Creation', x: 0.5, y: 0.76, w: 0.7, size: 0.028, font: 'Instrument Sans', weight: 600, fill: '#C79A4B', align: 'center', letterSpacing: 500, uppercase: true },
    ],
  },
  {
    id: 'social-story',
    name: 'Story Announcement',
    category: 'Social',
    presetKey: 'ig-story',
    background: { from: '#FBF4E6', to: '#EADFC8', angle: 180 },
    swatch: ['#FBF4E6', '#C0663A'],
    layers: [
      { type: 'circle', x: 0.82, y: 0.12, r: 0.22, fill: '#D98A5E', opacity: 0.25 },
      { type: 'circle', x: 0.16, y: 0.9, r: 0.26, fill: '#2C6560', opacity: 0.18 },
      { type: 'text', text: 'Just Dropped', x: 0.5, y: 0.26, w: 0.8, size: 0.03, font: 'Instrument Sans', weight: 600, fill: '#C0663A', align: 'center', letterSpacing: 500, uppercase: true },
      { type: 'text', text: 'Cosy\nSeason', x: 0.5, y: 0.37, w: 0.86, size: 0.105, font: 'Playfair Display', weight: 700, fill: '#1F4E4A', align: 'center', lineHeight: 1.02 },
      { type: 'imageSlot', x: 0.5, y: 0.59, w: 0.72, h: 0.26, radius: 20, label: 'Product photo' },
      { type: 'rect', x: 0.5, y: 0.78, w: 0.52, h: 0.055, fill: '#1F4E4A', radius: 999 },
      { type: 'text', text: 'Shop Now', x: 0.5, y: 0.78, w: 0.5, size: 0.028, font: 'Instrument Sans', weight: 700, fill: '#F6EEDF', align: 'center', letterSpacing: 300, uppercase: true },
    ],
  },
  {
    id: 'social-grid',
    name: 'Three-up Grid',
    category: 'Social',
    presetKey: 'ig-post',
    background: '#FFFCF5',
    swatch: ['#FFFCF5', '#585C36'],
    layers: [
      { type: 'text', text: 'Best Sellers', x: 0.5, y: 0.1, w: 0.86, size: 0.065, font: 'DM Serif Display', fill: '#1F4E4A', align: 'center' },
      { type: 'imageSlot', x: 0.2, y: 0.46, w: 0.28, h: 0.36, radius: 14, label: 'Photo 1' },
      { type: 'imageSlot', x: 0.5, y: 0.46, w: 0.28, h: 0.36, radius: 14, label: 'Photo 2' },
      { type: 'imageSlot', x: 0.8, y: 0.46, w: 0.28, h: 0.36, radius: 14, label: 'Photo 3' },
      { type: 'text', text: 'Plushies', x: 0.2, y: 0.69, w: 0.28, size: 0.03, font: 'Instrument Sans', weight: 600, fill: '#4A5A52', align: 'center' },
      { type: 'text', text: 'Home', x: 0.5, y: 0.69, w: 0.28, size: 0.03, font: 'Instrument Sans', weight: 600, fill: '#4A5A52', align: 'center' },
      { type: 'text', text: 'Wearables', x: 0.8, y: 0.69, w: 0.28, size: 0.03, font: 'Instrument Sans', weight: 600, fill: '#4A5A52', align: 'center' },
      { type: 'path', d: 'M4 50 H96', x: 0.5, y: 0.79, w: 0.7, stroke: '#DDCFB4', strokeWidth: 2 },
      { type: 'text', text: 'crochetcreation.in', x: 0.5, y: 0.87, w: 0.8, size: 0.032, font: 'Instrument Sans', weight: 500, fill: '#C0663A', align: 'center', letterSpacing: 200 },
    ],
  },

  // -------------------------------------------------------------- Promo
  {
    id: 'promo-banner',
    name: 'Wide Hero Banner',
    category: 'Promo',
    presetKey: 'hero-banner',
    background: { from: '#1F4E4A', to: '#16403C', angle: 110 },
    swatch: ['#1F4E4A', '#C79A4B'],
    layers: [
      { type: 'circle', x: 0.86, y: 0.5, r: 0.42, fill: '#2C6560', opacity: 0.55 },
      { type: 'imageSlot', x: 0.78, y: 0.5, w: 0.3, h: 0.76, radius: 16, label: 'Hero photo' },
      { type: 'text', text: 'Handcrafted with love', x: 0.09, y: 0.27, w: 0.42, size: 0.028, font: 'Instrument Sans', weight: 600, fill: '#C79A4B', align: 'left', letterSpacing: 420, uppercase: true },
      { type: 'text', text: 'Warmth you\ncan hold', x: 0.09, y: 0.49, w: 0.46, size: 0.115, font: 'Playfair Display', weight: 600, fill: '#F6EEDF', align: 'left', lineHeight: 1.04 },
      { type: 'text', text: 'Small-batch crochet pieces, made to order.', x: 0.09, y: 0.7, w: 0.44, size: 0.034, font: 'Instrument Sans', fill: '#C4D3C9', align: 'left' },
      { type: 'rect', x: 0.155, y: 0.84, w: 0.15, h: 0.11, fill: '#C0663A', radius: 999 },
      { type: 'text', text: 'Shop the range', x: 0.155, y: 0.84, w: 0.14, size: 0.028, font: 'Instrument Sans', weight: 700, fill: '#FFFCF5', align: 'center' },
    ],
  },
  {
    id: 'promo-coupon',
    name: 'Coupon Card',
    category: 'Promo',
    presetKey: 'care-card',
    background: '#FFFCF5',
    swatch: ['#C0663A', '#FFFCF5'],
    layers: [
      { type: 'rect', x: 0.5, y: 0.5, w: 0.92, h: 0.86, fill: '#FFFCF5', radius: 10, stroke: '#C0663A', strokeWidth: 3 },
      { type: 'text', text: 'Thank You', x: 0.5, y: 0.26, w: 0.8, size: 0.13, font: 'Great Vibes', fill: '#C0663A', align: 'center' },
      { type: 'path', d: 'M6 50 H22 M34 50 H50 M62 50 H78 M88 50 H96', x: 0.5, y: 0.43, w: 0.4, stroke: '#DDCFB4', strokeWidth: 3 },
      { type: 'text', text: 'CROCHET10', x: 0.5, y: 0.6, w: 0.8, size: 0.095, font: 'JetBrains Mono', weight: 700, fill: '#1F4E4A', align: 'center', letterSpacing: 250 },
      { type: 'text', text: '10% off your next order', x: 0.5, y: 0.78, w: 0.8, size: 0.045, font: 'Instrument Sans', weight: 500, fill: '#4A5A52', align: 'center' },
    ],
  },

  // ---------------------------------------------------------- Editorial
  {
    id: 'editorial-care',
    name: 'Care Instructions',
    category: 'Editorial',
    presetKey: 'product-portrait',
    background: '#F4EADA',
    swatch: ['#F4EADA', '#585C36'],
    layers: [
      { type: 'text', text: 'Care Guide', x: 0.5, y: 0.11, w: 0.8, size: 0.075, font: 'Cormorant Garamond', weight: 600, fill: '#474A2B', align: 'center' },
      { type: 'path', d: 'M4 50 H96', x: 0.5, y: 0.17, w: 0.28, stroke: '#585C36', strokeWidth: 3 },
      { type: 'path', d: 'M22 14 L66 66 M78 14 L34 66 M22 78 A12 12 0 1 1 21.9 78 Z M78 78 A12 12 0 1 1 77.9 78 Z', x: 0.22, y: 0.32, w: 0.11, stroke: '#585C36', strokeWidth: 5 },
      { type: 'text', text: 'Hand wash only\nUse a mild liquid detergent in cool water.', x: 0.62, y: 0.32, w: 0.52, size: 0.031, font: 'Instrument Sans', fill: '#4A5A52', align: 'left', lineHeight: 1.5 },
      { type: 'path', d: 'M32 12 L50 22 L68 12 L92 30 L80 48 L72 42 V90 H28 V42 L20 48 L8 30 Z', x: 0.22, y: 0.5, w: 0.11, stroke: '#585C36', strokeWidth: 5 },
      { type: 'text', text: 'Dry flat in shade\nNever wring or tumble dry the fibres.', x: 0.62, y: 0.5, w: 0.52, size: 0.031, font: 'Instrument Sans', fill: '#4A5A52', align: 'left', lineHeight: 1.5 },
      { type: 'path', d: 'M28 12 H72 V88 H28 Z M18 12 H82 M18 88 H82 M36 28 H64 M36 42 H64 M36 56 H64 M36 70 H64', x: 0.22, y: 0.68, w: 0.11, stroke: '#585C36', strokeWidth: 5 },
      { type: 'text', text: 'Store loosely folded\nKeep away from direct sunlight.', x: 0.62, y: 0.68, w: 0.52, size: 0.031, font: 'Instrument Sans', fill: '#4A5A52', align: 'left', lineHeight: 1.5 },
      { type: 'text', text: 'Crochet Creation', x: 0.5, y: 0.9, w: 0.8, size: 0.028, font: 'Instrument Sans', weight: 600, fill: '#585C36', align: 'center', letterSpacing: 500, uppercase: true },
    ],
  },
  {
    id: 'editorial-testimonial',
    name: 'Customer Love',
    category: 'Editorial',
    presetKey: 'ig-post',
    background: '#FFFCF5',
    swatch: ['#FFFCF5', '#D99A86'],
    layers: [
      { type: 'rect', x: 0.5, y: 0.5, w: 0.86, h: 0.78, fill: '#FBF4E6', radius: 24 },
      { type: 'imageSlot', x: 0.5, y: 0.26, w: 0.2, h: 0.2, radius: 999, label: 'Customer photo' },
      { type: 'text', text: '★ ★ ★ ★ ★', x: 0.5, y: 0.4, w: 0.6, size: 0.038, font: 'Instrument Sans', fill: '#C79A4B', align: 'center', letterSpacing: 200 },
      { type: 'text', text: '“The softest thing I own.\nIt arrived wrapped like a gift.”', x: 0.5, y: 0.53, w: 0.7, size: 0.046, font: 'Lora', italic: true, fill: '#23423C', align: 'center', lineHeight: 1.45 },
      { type: 'text', text: 'Ananya R.', x: 0.5, y: 0.67, w: 0.6, size: 0.032, font: 'Instrument Sans', weight: 700, fill: '#C0663A', align: 'center' },
      { type: 'text', text: 'Verified buyer', x: 0.5, y: 0.715, w: 0.6, size: 0.024, font: 'Instrument Sans', fill: '#596661', align: 'center' },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  'All',
  'Cinematic',
  'Product',
  'Social',
  'Promo',
  'Editorial',
] as const;

export const getTemplate = (id: string): TemplateSpec | undefined =>
  TEMPLATES.find((t) => t.id === id);
