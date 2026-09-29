/**
 * Artboard sizes and the brand's colour system.
 *
 * Sizes are in pixels at 1x. Export can multiply up to 4x, so a 1080px
 * Instagram post still prints usefully at 4320px without re-authoring.
 */

export interface SizePreset {
  key: string;
  label: string;
  group: string;
  width: number;
  height: number;
  hint?: string;
}

export const SIZE_PRESETS: SizePreset[] = [
  // Storefront
  { key: 'product-square', label: 'Product Thumbnail', group: 'Storefront', width: 1200, height: 1200, hint: '1:1 — shop grid & product page' },
  { key: 'product-portrait', label: 'Product Portrait', group: 'Storefront', width: 1200, height: 1500, hint: '4:5 — taller listing card' },
  { key: 'hero-banner', label: 'Homepage Hero', group: 'Storefront', width: 1920, height: 960, hint: '2:1 — wide banner' },
  { key: 'category-card', label: 'Category Card', group: 'Storefront', width: 800, height: 1000 },
  { key: 'og-image', label: 'Link Preview (OG)', group: 'Storefront', width: 1200, height: 630, hint: 'WhatsApp & social unfurls' },

  // Social
  { key: 'ig-post', label: 'Instagram Post', group: 'Social', width: 1080, height: 1080 },
  { key: 'ig-portrait', label: 'Instagram Portrait', group: 'Social', width: 1080, height: 1350 },
  { key: 'ig-story', label: 'Instagram Story', group: 'Social', width: 1080, height: 1920 },
  { key: 'reel-cover', label: 'Reel Cover', group: 'Social', width: 1080, height: 1920 },
  { key: 'fb-post', label: 'Facebook Post', group: 'Social', width: 1200, height: 630 },
  { key: 'fb-cover', label: 'Facebook Cover', group: 'Social', width: 1640, height: 624 },
  { key: 'yt-thumb', label: 'YouTube Thumbnail', group: 'Social', width: 1280, height: 720 },
  { key: 'pinterest', label: 'Pinterest Pin', group: 'Social', width: 1000, height: 1500 },
  { key: 'wa-status', label: 'WhatsApp Status', group: 'Social', width: 1080, height: 1920 },

  // Print
  { key: 'a4-portrait', label: 'A4 Poster', group: 'Print', width: 2480, height: 3508, hint: '300 DPI' },
  { key: 'a5-flyer', label: 'A5 Flyer', group: 'Print', width: 1748, height: 2480, hint: '300 DPI' },
  { key: 'care-card', label: 'Care Card', group: 'Print', width: 1050, height: 600, hint: 'Packed with the order' },
  { key: 'label-square', label: 'Product Label', group: 'Print', width: 900, height: 900 },
  { key: 'business-card', label: 'Business Card', group: 'Print', width: 1050, height: 600 },
];

export const PRESET_GROUPS = ['Storefront', 'Social', 'Print'];

export const DEFAULT_PRESET = SIZE_PRESETS[0];

export const getPreset = (key?: string | null): SizePreset | undefined =>
  SIZE_PRESETS.find((p) => p.key === key);

/** The storefront palette, so designs look like they belong to the brand. */
export const BRAND_COLORS: { name: string; value: string }[] = [
  { name: 'Parchment', value: '#F4EADA' },
  { name: 'Parchment Deep', value: '#EADFC8' },
  { name: 'Parchment Card', value: '#FFFCF5' },
  { name: 'Parchment Warm', value: '#FBF4E6' },
  { name: 'Teal', value: '#1F4E4A' },
  { name: 'Teal Deep', value: '#16403C' },
  { name: 'Teal Soft', value: '#2C6560' },
  { name: 'Ink', value: '#23423C' },
  { name: 'Olive', value: '#585C36' },
  { name: 'Olive Deep', value: '#474A2B' },
  { name: 'Terracotta', value: '#C0663A' },
  { name: 'Terracotta Deep', value: '#A5522C' },
  { name: 'Terracotta Soft', value: '#D98A5E' },
  { name: 'Gold', value: '#C79A4B' },
  { name: 'Blush', value: '#D99A86' },
  { name: 'Body Text', value: '#4A5A52' },
  { name: 'Line', value: '#DDCFB4' },
  { name: 'On Dark', value: '#F6EEDF' },
];

export const NEUTRAL_COLORS: string[] = [
  '#FFFFFF', '#F8F8F8', '#E9E9E9', '#D4D4D4', '#A3A3A3',
  '#737373', '#525252', '#333333', '#1A1A1A', '#000000',
];

export const ACCENT_COLORS: string[] = [
  '#E4572E', '#F4A259', '#F5D547', '#8CB369', '#4A8A6F',
  '#3E7CB1', '#5B5F97', '#8E7DBE', '#C06C84', '#D45D79',
];

export interface GradientPreset {
  name: string;
  from: string;
  to: string;
  angle: number;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Parchment Glow', from: '#FFFCF5', to: '#EADFC8', angle: 135 },
  { name: 'Deep Forest', from: '#2C6560', to: '#16403C', angle: 135 },
  { name: 'Terracotta Dusk', from: '#D98A5E', to: '#A5522C', angle: 135 },
  { name: 'Gilded', from: '#F0DFAF', to: '#C79A4B', angle: 135 },
  { name: 'Blush Linen', from: '#FBF4E6', to: '#D99A86', angle: 160 },
  { name: 'Olive Field', from: '#8CB369', to: '#474A2B', angle: 135 },
  { name: 'Midnight', from: '#3A4A5C', to: '#16181D', angle: 135 },
  { name: 'Sunrise', from: '#F5D547', to: '#E4572E', angle: 120 },
  { name: 'Sea Glass', from: '#BFE3DD', to: '#4A8A6F', angle: 135 },
  { name: 'Orchid', from: '#C9A7D6', to: '#5B5F97', angle: 135 },
  { name: 'Paper Fold', from: '#FFFFFF', to: '#D4D4D4', angle: 180 },
  { name: 'Ink Wash', from: '#4A5A52', to: '#1A1A1A', angle: 135 },
];

export const FONT_SIZE_STEPS = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144, 180, 240,
];
