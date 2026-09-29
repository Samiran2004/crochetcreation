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
  | 'Decorative'
  | 'Custom';

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

  // ---- Display (extended) -----------------------------------------------
  { family: 'Playfair Display SC', category: 'Display', weights: [400, 700, 900], italic: true, premium: true },
  { family: 'Libre Bodoni', category: 'Display', weights: [400, 500, 600, 700], italic: true, premium: true },
  { family: 'Bodoni Moda SC', category: 'Display', weights: [400, 600, 700, 900], italic: true, premium: true },
  { family: 'DM Serif Text', category: 'Display', weights: [400], italic: true, premium: true },
  { family: 'Rozha One', category: 'Display', weights: [400], italic: false },
  { family: 'Bevan', category: 'Display', weights: [400], italic: true },
  { family: 'Ultra', category: 'Display', weights: [400], italic: false },
  { family: 'Bungee Inline', category: 'Display', weights: [400], italic: false },
  { family: 'Sedgwick Ave Display', category: 'Display', weights: [400], italic: false },
  { family: 'Nanum Myeongjo', category: 'Display', weights: [400, 700, 800], italic: false, premium: true },
  { family: 'Trirong', category: 'Display', weights: [300, 400, 600, 700, 900], italic: true },
  { family: 'Vollkorn', category: 'Display', weights: [400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Zen Antique', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Shippori Mincho', category: 'Display', weights: [400, 500, 600, 700, 800], italic: false, premium: true },
  { family: 'Kaisei Decol', category: 'Display', weights: [400, 500, 700], italic: false },
  { family: 'Goldman', category: 'Display', weights: [400, 700], italic: false },
  { family: 'Poiret One', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Julius Sans One', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Tenor Sans', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Forum', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Cormorant SC', category: 'Display', weights: [300, 400, 500, 600, 700], italic: false, premium: true },
  { family: 'Cormorant Infant', category: 'Display', weights: [300, 400, 500, 600, 700], italic: true, premium: true },
  { family: 'Cormorant Unicase', category: 'Display', weights: [300, 400, 500, 600, 700], italic: false, premium: true },
  { family: 'Antic Didone', category: 'Display', weights: [400], italic: false, premium: true },
  { family: 'Orbitron', category: 'Display', weights: [400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Michroma', category: 'Display', weights: [400], italic: false },
  { family: 'Chakra Petch', category: 'Display', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Big Shoulders Display', category: 'Display', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Bakbak One', category: 'Display', weights: [400], italic: false },
  { family: 'Climate Crisis', category: 'Display', weights: [400], italic: false },

  // ---- Serif (extended) --------------------------------------------------
  { family: 'Gelasio', category: 'Serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Frank Ruhl Libre', category: 'Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Alegreya', category: 'Serif', weights: [400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Domine', category: 'Serif', weights: [400, 500, 600, 700], italic: false },
  { family: 'Rosarivo', category: 'Serif', weights: [400], italic: true, premium: true },
  { family: 'Eczar', category: 'Serif', weights: [400, 500, 600, 700, 800], italic: false },
  { family: 'Faustina', category: 'Serif', weights: [300, 400, 500, 600, 700, 800], italic: true },
  { family: 'Brygada 1918', category: 'Serif', weights: [400, 500, 600, 700], italic: true, premium: true },
  { family: 'Neuton', category: 'Serif', weights: [300, 400, 700, 800], italic: true },
  { family: 'Old Standard TT', category: 'Serif', weights: [400, 700], italic: true, premium: true },
  { family: 'Sorts Mill Goudy', category: 'Serif', weights: [400], italic: true, premium: true },
  { family: 'Gentium Book Plus', category: 'Serif', weights: [400, 700], italic: true },
  { family: 'Crimson Text', category: 'Serif', weights: [400, 600, 700], italic: true, premium: true },
  { family: 'Playfair', category: 'Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, premium: true },

  // ---- Sans (extended) ---------------------------------------------------
  { family: 'Geist', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Wix Madefor Display', category: 'Sans Serif', weights: [400, 500, 600, 700, 800], italic: false },
  { family: 'Schibsted Grotesk', category: 'Sans Serif', weights: [400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Albert Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Be Vietnam Pro', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Red Hat Display', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Hanken Grotesk', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Public Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Epilogue', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'General Sans', category: 'Sans Serif', weights: [400, 500, 600, 700], italic: false },
  { family: 'Overpass', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Assistant', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800], italic: false },
  { family: 'Heebo', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Exo 2', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Kanit', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Prompt', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Titillium Web', category: 'Sans Serif', weights: [300, 400, 600, 700, 900], italic: true },
  { family: 'Asap', category: 'Sans Serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Commissioner', category: 'Sans Serif', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Red Hat Text', category: 'Sans Serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Spline Sans', category: 'Sans Serif', weights: [300, 400, 500, 600, 700], italic: false },

  // ---- Script (extended) -------------------------------------------------
  { family: 'Monsieur La Doulaise', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Mr De Haviland', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Mrs Sheppards', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Herr Von Muellerhoff', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Rouge Script', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Meddon', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Bilbo Swash Caps', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Ephesis', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Lovers Quarrel', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Imperial Script', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Bonheur Royale', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Updock', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Sail', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Grey Qo', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Estonia', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Qwigley', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Yesteryear', category: 'Script', weights: [400], italic: false },
  { family: 'Norican', category: 'Script', weights: [400], italic: false },
  { family: 'League Script', category: 'Script', weights: [400], italic: false },
  { family: 'Kaushan Script', category: 'Script', weights: [400], italic: false },
  { family: 'Courgette', category: 'Script', weights: [400], italic: false },
  { family: 'Lobster Two', category: 'Script', weights: [400, 700], italic: true },
  { family: 'Berkshire Swash', category: 'Script', weights: [400], italic: false },
  { family: 'Sofia', category: 'Script', weights: [400], italic: false },
  { family: 'Clicker Script', category: 'Script', weights: [400], italic: false },
  { family: 'Arizonia', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Euphoria Script', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Playball', category: 'Script', weights: [400], italic: false },
  { family: 'Niconne', category: 'Script', weights: [400], italic: false },
  { family: 'Montez', category: 'Script', weights: [400], italic: false },
  { family: 'Rochester', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Engagement', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Redressed', category: 'Script', weights: [400], italic: false },
  { family: 'Stalemate', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Meow Script', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Whisper', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Bad Script', category: 'Script', weights: [400], italic: false },
  { family: 'Mea Culpa', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Moon Dance', category: 'Script', weights: [400], italic: false, premium: true },
  { family: 'Water Brush', category: 'Script', weights: [400], italic: false },
  { family: 'Splash', category: 'Script', weights: [400], italic: false },

  // ---- Handwritten (extended) --------------------------------------------
  { family: 'Nothing You Could Do', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Reenie Beanie', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Just Another Hand', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Rock Salt', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Covered By Your Grace', category: 'Handwritten', weights: [400], italic: false },
  { family: 'La Belle Aurore', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Zeyada', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Delius', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Neucha', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Gochi Hand', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Nanum Pen Script', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Waiting for the Sunrise', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Grape Nuts', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Edu NSW ACT Foundation', category: 'Handwritten', weights: [400, 500, 600, 700], italic: false },
  { family: 'Sue Ellen Francisco', category: 'Handwritten', weights: [400], italic: false },
  { family: 'Swanky and Moo Moo', category: 'Handwritten', weights: [400], italic: false },

  // ---- Monospace (extended) ----------------------------------------------
  { family: 'Fira Code', category: 'Monospace', weights: [300, 400, 500, 600, 700], italic: false },
  { family: 'Source Code Pro', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Inconsolata', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800, 900], italic: false },
  { family: 'Courier Prime', category: 'Monospace', weights: [400, 700], italic: true },
  { family: 'Azeret Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Martian Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800], italic: false },

  // ---- Decorative (extended) ---------------------------------------------
  { family: 'Bungee Outline', category: 'Decorative', weights: [400], italic: false },
  { family: 'Faster One', category: 'Decorative', weights: [400], italic: false },
  { family: 'Nabla', category: 'Decorative', weights: [400], italic: false },
  { family: 'Rubik Puddles', category: 'Decorative', weights: [400], italic: false },
  { family: 'Rubik Bubbles', category: 'Decorative', weights: [400], italic: false },
  { family: 'Rubik Glitch', category: 'Decorative', weights: [400], italic: false },
  { family: 'Rubik Wet Paint', category: 'Decorative', weights: [400], italic: false },
  { family: 'Bowlby One SC', category: 'Decorative', weights: [400], italic: false },
  { family: 'Sigmar One', category: 'Decorative', weights: [400], italic: false },
  { family: 'Bungee Spice', category: 'Decorative', weights: [400], italic: false },
  { family: 'Kablammo', category: 'Decorative', weights: [400], italic: false },
  { family: 'Tourney', category: 'Decorative', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Bruno Ace SC', category: 'Decorative', weights: [400], italic: false },
  { family: 'Lacquer', category: 'Decorative', weights: [400], italic: false },
  { family: 'Eater', category: 'Decorative', weights: [400], italic: false },
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
  'Custom',
];

export const DEFAULT_FONT = 'Playfair Display';

const CUSTOM_STORAGE_KEY = 'ds_custom_fonts_v1';

/**
 * Fonts the admin imported themselves.
 *
 * Held in a module-level map so the catalog, the picker and the canvas all
 * agree, and mirrored into localStorage so an import survives a reload. They
 * are also re-probed on demand when a saved design references a family this
 * browser has never seen — that is what makes a design portable between
 * machines.
 */
const customFonts = new Map<string, FontDefinition>();
let customFontsHydrated = false;

const persistCustomFonts = (): void => {
  try {
    window.localStorage.setItem(
      CUSTOM_STORAGE_KEY,
      JSON.stringify(Array.from(customFonts.values())),
    );
  } catch {
    // Private mode or a full quota: the fonts still work this session.
  }
};

export const hydrateCustomFonts = (): FontDefinition[] => {
  if (typeof window === 'undefined') return [];
  if (customFontsHydrated) return Array.from(customFonts.values());
  customFontsHydrated = true;
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FontDefinition[];
      if (Array.isArray(parsed)) {
        parsed.forEach((def) => {
          if (def && typeof def.family === 'string') {
            customFonts.set(def.family, { ...def, category: 'Custom' });
          }
        });
      }
    }
  } catch {
    // A corrupt cache should never keep the editor from opening.
  }
  return Array.from(customFonts.values());
};

export const getCustomFonts = (): FontDefinition[] => {
  hydrateCustomFonts();
  return Array.from(customFonts.values());
};

export const removeCustomFont = (family: string): void => {
  customFonts.delete(family);
  persistCustomFonts();
};

const BUILT_IN = new Map(FONT_LIBRARY.map((f) => [f.family, f]));

export const getFontDefinition = (family: string): FontDefinition | undefined => {
  hydrateCustomFonts();
  return BUILT_IN.get(family) ?? customFonts.get(family);
};

/** Every family the picker should offer, built-ins plus imports. */
export const allFonts = (): FontDefinition[] => {
  hydrateCustomFonts();
  return [...FONT_LIBRARY, ...Array.from(customFonts.values())];
};

/** The weights a family actually ships, so the weight picker never lies. */
export const getFontWeights = (family: string): number[] =>
  getFontDefinition(family)?.weights ?? [400, 700];

export const fontSupportsItalic = (family: string): boolean =>
  getFontDefinition(family)?.italic ?? false;

const familyParam = (family: string) => family.trim().replace(/\s+/g, '+');

const buildHref = (def: FontDefinition): string => {
  const family = familyParam(def.family);
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

const injectStylesheetHref = (family: string, href: string): void => {
  if (injected.has(family)) return;
  injected.add(family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.designStudioFont = family;
  document.head.appendChild(link);
};

const ALL_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Ask Google Fonts what a family actually offers.
 *
 * The css2 endpoint rejects a request for an axis or weight a family does not
 * have, so the only reliable way to discover a font's real shape is to try
 * progressively narrower requests and read the stylesheet that comes back.
 * Returns `null` when no request succeeds, which is how "no such font" is
 * reported to the caller.
 */
export const probeGoogleFont = async (
  rawFamily: string,
): Promise<{ definition: FontDefinition; href: string } | null> => {
  const family = rawFamily.trim().replace(/\s+/g, ' ');
  if (!family || !/^[\w\s'\-.+&]{1,60}$/.test(family)) return null;

  const param = familyParam(family);
  const candidates = [
    `https://fonts.googleapis.com/css2?family=${param}:ital,wght@${[
      ...ALL_WEIGHTS.map((w) => `0,${w}`),
      ...ALL_WEIGHTS.map((w) => `1,${w}`),
    ].join(';')}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${param}:wght@${ALL_WEIGHTS.join(';')}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${param}:ital@0;1&display=swap`,
    `https://fonts.googleapis.com/css2?family=${param}&display=swap`,
  ];

  for (const href of candidates) {
    let css = '';
    try {
      const response = await fetch(href);
      if (!response.ok) continue;
      css = await response.text();
    } catch {
      continue;
    }
    if (!css.includes('@font-face')) continue;

    // An exec loop rather than `matchAll` spread: the project compiles to ES5,
    // where iterating an iterator needs downlevelIteration.
    const found: number[] = [];
    const weightPattern = /font-weight:\s*(\d{3})/g;
    let match = weightPattern.exec(css);
    while (match !== null) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && found.indexOf(parsed) === -1) found.push(parsed);
      match = weightPattern.exec(css);
    }
    const weights = found.sort((a, b) => a - b);

    return {
      href,
      definition: {
        family,
        category: 'Custom',
        weights: weights.length ? weights : [400],
        italic: /font-style:\s*italic/.test(css),
      },
    };
  }

  return null;
};

const waitForFaces = async (family: string, weights: number[], italic: boolean) => {
  if (!('fonts' in document)) return;
  const probes = weights.slice(0, 6).map((w) => document.fonts.load(`${w} 24px "${family}"`));
  if (italic) probes.push(document.fonts.load(`italic 400 24px "${family}"`));
  try {
    await Promise.all(probes);
  } catch {
    // A blocked or offline Google Fonts request is not fatal.
  }
};

/**
 * Import any family from Google Fonts by name.
 *
 * Resolves with the discovered definition, or `null` if Google has no such
 * family — the caller turns that into a "font not found" message rather than
 * silently registering a name that will never render.
 */
export const importGoogleFont = async (
  rawFamily: string,
): Promise<FontDefinition | null> => {
  if (typeof window === 'undefined') return null;
  hydrateCustomFonts();

  const family = rawFamily.trim().replace(/\s+/g, ' ');
  const existing = getFontDefinition(family);
  if (existing) {
    await loadFont(family);
    return existing;
  }

  const probed = await probeGoogleFont(family);
  if (!probed) return null;

  customFonts.set(probed.definition.family, probed.definition);
  persistCustomFonts();

  injectStylesheetHref(probed.definition.family, probed.href);
  await waitForFaces(
    probed.definition.family,
    probed.definition.weights,
    probed.definition.italic,
  );

  return probed.definition;
};

/**
 * Make `family` safe to paint with.
 *
 * Resolves once the browser reports the face is usable, so the caller can
 * re-render the canvas and be sure the glyphs are the real ones. A family the
 * catalog has never heard of is probed against Google Fonts, which is what
 * lets a design made on one machine reopen correctly on another. Failures
 * resolve rather than reject: a missing webfont should degrade to a fallback,
 * never break the editor.
 */
export const loadFont = (family: string, weight: number | string = 400): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  hydrateCustomFonts();

  const key = `${family}:${weight}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    let def = getFontDefinition(family);

    if (!def) {
      const probed = await probeGoogleFont(family);
      if (!probed) return;
      def = probed.definition;
      customFonts.set(def.family, def);
      persistCustomFonts();
      injectStylesheetHref(def.family, probed.href);
    } else {
      injectStylesheetHref(def.family, buildHref(def));
    }

    await waitForFaces(def.family, [Number(weight) || 400, 700], def.italic);
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
  return allFonts().filter((f) => {
    if (category !== 'All' && f.category !== category) return false;
    if (!q) return true;
    return f.family.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });
};
