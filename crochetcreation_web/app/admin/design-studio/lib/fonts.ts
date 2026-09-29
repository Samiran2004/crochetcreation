/**
 * The Design Studio type library.
 *
 * Canvas text is painted by the browser's own text engine, which means a font
 * has to be *loaded and ready* before fabric renders it — otherwise the glyphs
 * fall back to the default serif and the admin sees the wrong design. So every
 * family here is fetched through the Google Fonts CSS API on demand, and no
 * caller draws with a family until `loadFont` has resolved.
 *
 * Families are curated rather than exhaustive: a long alphabetical dump of
 * every Google font is unusable in a dropdown. These are grouped by the job
 * they do, and the list leads with the ones that suit a handmade-crochet brand.
 */

export type FontCategory =
  | 'Brand'
  | 'Display'
  | 'Serif'
  | 'Sans Serif'
  | 'Script'
  | 'Handwritten'
  | 'Monospace'
  | 'Decorative';

export interface FontDefinition {
  /** Exact Google Fonts family name — also the CSS font-family value. */
  family: string;
  category: FontCategory;
  /** Weights to request. Kept tight so each stylesheet stays small. */
  weights: number[];
  /** Whether the family ships a true italic. */
  italic: boolean;
  /** Flagged in the UI as an editorial / premium-feeling face. */
  premium?: boolean;
}

export const FONT_LIBRARY: FontDefinition[] = [
  // ---- Brand: the two faces the storefront itself is set in -------------
  { family: 'Instrument Serif', category: 'Brand', weights: [400], italic: true, premium: true },
  { family: 'Instrument Sans', category: 'Brand', weights: [400, 500, 600, 700], italic: true },

  // ---- Display: headline faces with real personality --------------------
  { family: 'Playfair Display', category: 'Display', weights: [400, 500, 600, 700, 800, 900], italic: true, premium: true },
  { family: 'Bodoni Moda', category: 'Display', weights: [400, 500, 600, 700, 800, 900], italic: true, premium: true },
  { family: 'DM Serif Display', category: 'Display', weights: [400], italic: true, premium: true },
  { family: 'Abril Fatface', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Cormorant Garamond', category: 'Display', weights: [300, 400, 500, 600, 700], italic: true, premium: true },
  { family: 'Marcellus', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Prata', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Italiana', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Gilda Display', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Yeseva One', category: 'Display', weights: [400], italic: false },
  { family: 'Cinzel', category: 'Display', weights: [400, 500, 600, 700, 800, 900], italic: false, premium: true },
  { family: 'Cinzel Decorative', category: 'Display', weights: [400, 700, 900], italic: false, premium: true },
  { family: 'Anton', category: 'Display', weights: [400], italic: false },
  { family: 'Oswald', category: 'Display', weights: [300, 400, 500, 600, 700], italic: false },
  { family: 'Bebas Neue', category: 'Display', weights: [400], italic: false },
  { family: 'Archivo Black', category: 'Display', weights: [400], italic: false },
  { family: 'Alfa Slab One', category: 'Display', weights: [400], italic: false },
  { family: 'Fraunces', category: 'Display', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, premium: true },
  { family: 'Unbounded', category: 'Display', weights: [300, 400, 500, 600, 700, 800], italic: false },
  { family: 'Bricolage Grotesque', category: 'Display', weights: [300, 400, 500, 600, 700, 800], italic: false },
  { family: 'Syne', category: 'Display', weights: [400, 500, 600, 700, 800], italic: false },
  { family: 'Righteous', category: 'Display', weights: [400], italic: false },
  { family: 'Lobster', category: 'Display', weights: [400], italic: false },

  // ---- Serif: long-form and editorial body ------------------------------
  { family: 'Cormorant', category: 'Serif', weights: [300, 400, 500, 600, 700], italic: true, premium: true },
  { family: 'EB Garamond', category: 'Serif', weights: [400, 500, 600, 700, 800], italic: true, premium: true },
  { family: 'Libre Baskerville', category: 'Serif', weights: [400, 700], italic: true },
  { family: 'Lora', category: 'Serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Crimson Pro', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Source Serif 4', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Spectral', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Merriweather', category: 'Serif', weights: [300, 400, 700, 900], italic: true },
  { family: 'PT Serif', category: 'Serif', weights: [400, 700], italic: true },
  { family: 'Noto Serif', category: 'Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Zilla Slab', category: 'Serif', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Bitter', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Newsreader', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true, premium: true },
  { family: 'Literata', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Petrona', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },

  // ---- Sans Serif: UI, labels, captions ---------------------------------
  { family: 'Inter', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Poppins', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Montserrat', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Raleway', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Work Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'DM Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Manrope', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800], italic: false },
  { family: 'Outfit', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Plus Jakarta Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800], italic: true, premium: true },
  { family: 'Figtree', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Sora', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800], italic: false },
  { family: 'Space Grotesk', category: 'Sans Serif', weights: [300, 400, 500, 600, 700], italic: false },
  { family: 'Lexend', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Nunito', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Nunito Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Quicksand', category: 'Sans Serif', weights: [300, 400, 500, 600, 700], italic: false },
  { family: 'Rubik', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Karla', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Mulish', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Urbanist', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Onest', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Archivo', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Barlow', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Cabin', category: 'Sans Serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Josefin Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Jost', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },

  // ---- Script: signatures, ribbons, flourishes ---------------------------
  { family: 'Great Vibes', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Parisienne', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Dancing Script', category: 'Script', weights: [400, 500, 600, 700], italic: false, premium: true },
  { family: 'Sacramento', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Pinyon Script', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Tangerine', category: 'Script', weights: [400, 700], italic: false, premium: true },
  { family: 'Allura', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Alex Brush', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Italianno', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Mrs Saint Delafield', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Petit Formal Script', category: 'Script', weights: [400], italic: false },
  { family: 'Yellowtail', category: 'Script', weights: [400], italic: false },
  { family: 'Pacifico', category: 'Script', weights: [400], italic: false },
  { family: 'Satisfy', category: 'Script', weights: [400], italic: false },
  { family: 'Cookie', category: 'Script', weights: [400], italic: false },
  { family: 'Marck Script', category: 'Script', weights: [400], italic: false },

  // ---- Handwritten: casual, crafty, note-like ---------------------------
  { family: 'Caveat', category: 'Handwritten', weights: [400, 500, 600, 700], italic: false },
  { family: 'Shadows Into Light', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Indie Flower', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Kalam', category: 'Handwritten', weights: [300, 400, 700], italic: false },
  { family: 'Patrick Hand', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Architects Daughter', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Gloria Hallelujah', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Amatic SC', category: 'Handwritten', weights: [400, 700], italic: false },
  { family: 'Permanent Marker', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Homemade Apple', category: 'Handwritten', weights: [400], italic: false },

  // ---- Monospace: codes, SKUs, tickets ----------------------------------
  { family: 'JetBrains Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'IBM Plex Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Space Mono', category: 'Monospace', weights: [400, 700], italic: true },
  { family: 'Roboto Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'DM Mono', category: 'Monospace', weights: [300, 400, 500], italic: true },

  // ---- Decorative: stickers, badges, novelty ----------------------------
  { family: 'Monoton', category: 'Decorative', weights: [400], italic: false },
  { family: 'Bungee', category: 'Decorative', weights: [400], italic: false },
  { family: 'Bungee Shade', category: 'Decorative', weights: [400], italic: false },
  { family: 'Rubik Mono One', category: 'Decorative', weights: [400], italic: false },
  { family: 'Silkscreen', category: 'Decorative', weights: [400, 700], italic: false },
  { family: 'Press Start 2P', category: 'Decorative', weights: [400], italic: false },
  { family: 'Creepster', category: 'Decorative', weights: [400], italic: false },
  { family: 'Fredoka', category: 'Decorative', weights: [300, 400, 500, 600, 700], italic: false },
  { family: 'Titan One', category: 'Decorative', weights: [400], italic: false },
  { family: 'Shrikhand', category: 'Decorative', weights: [400], italic: false },
];

export const FONT_CATEGORIES: FontCategory[] = [
  'Brand',
  'Display',
  'Serif',
  'Sans Serif',
  'Script',
  'Handwritten',
  'Monospace',
  'Decorative',
];

export const DEFAULT_FONT = 'Playfair Display';

const BY_FAMILY = new Map(FONT_LIBRARY.map((f) => [f.family, f]));

export const getFontDefinition = (family: string): FontDefinition | undefined =>
  BY_FAMILY.get(family);

/** The weights a family actually ships, so the weight picker never lies. */
export const getFontWeights = (family: string): number[] =>
  BY_FAMILY.get(family)?.weights ?? [400, 700];

export const fontSupportsItalic = (family: string): boolean =>
  BY_FAMILY.get(family)?.italic ?? false;

const buildHref = (def: FontDefinition): string => {
  const family = def.family.replace(/ /g, '+');
  const weights = Array.from(new Set(def.weights)).sort((a, b) => a - b);

  if (def.italic) {
    // css2 requires the ital axis listed first and the tuples sorted.
    const tuples = [
      ...weights.map((w) => `0,${w}`),
      ...weights.map((w) => `1,${w}`),
    ];
    return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${tuples.join(';')}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(';')}&display=swap`;
};

// One promise per family, shared by every caller. Without this, a font grid
// that renders 40 previews at once would fire 40 identical stylesheet requests.
const inFlight = new Map<string, Promise<void>>();
const injected = new Set<string>();

const injectStylesheet = (def: FontDefinition): void => {
  if (injected.has(def.family)) return;
  injected.add(def.family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = buildHref(def);
  link.dataset.designStudioFont = def.family;
  document.head.appendChild(link);
};

/**
 * Make `family` safe to paint with.
 *
 * Resolves once the browser reports the face is usable, so the caller can
 * re-render the canvas and be sure the glyphs are the real ones. Unknown
 * families and font-loading failures resolve rather than reject: a missing
 * webfont should degrade to a fallback, never break the editor.
 */
export const loadFont = (family: string, weight: number | string = 400): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  const def = BY_FAMILY.get(family);
  if (!def) return Promise.resolve();

  const key = `${family}:${weight}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    injectStylesheet(def);
    if (!('fonts' in document)) return;
    try {
      // Both weights the editor can ask for, so toggling bold never flashes.
      await Promise.all([
        document.fonts.load(`${weight} 24px "${family}"`),
        document.fonts.load(`700 24px "${family}"`),
        def.italic ? document.fonts.load(`italic ${weight} 24px "${family}"`) : Promise.resolve(),
      ]);
    } catch {
      // A blocked or offline Google Fonts request is not fatal.
    }
  })();

  inFlight.set(key, task);
  return task;
};

/** Preload every family a saved scene refers to, before the first render. */
export const loadFontsForScene = async (scene: unknown): Promise<void> => {
  const families = new Set<string>();

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (typeof record.fontFamily === 'string') families.add(record.fontFamily);
    Object.values(record).forEach(walk);
  };

  walk(scene);
  await Promise.all(Array.from(families).map((f) => loadFont(f)));
};

export const searchFonts = (query: string, category: FontCategory | 'All'): FontDefinition[] => {
  const q = query.trim().toLowerCase();
  return FONT_LIBRARY.filter((f) => {
    if (category !== 'All' && f.category !== category) return false;
    if (!q) return true;
    return f.family.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });
};
