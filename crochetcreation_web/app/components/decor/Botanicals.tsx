'use client';

import React from 'react';

/**
 * Hand-drawn decorative marks for the storybook layout.
 *
 * These are deliberately crochet-native rather than generic botanicals: yarn
 * balls, hooks, wooden spools, chain stitches and knitted motifs, drawn in the
 * same loose single-weight line as the leaves and sprigs so the whole set reads
 * as one illustrator's hand.
 *
 * Every mark is `aria-hidden` — they carry no information, only atmosphere.
 */

type MarkProps = {
  className?: string;
  /** Stroke colour; defaults to `currentColor` so marks inherit their band. */
  color?: string;
  strokeWidth?: number;
};

const base = (className?: string) =>
  `pointer-events-none select-none ${className ?? ''}`;

/* ───────────────────────── Yarn & tools ───────────────────────── */

export const YarnBall: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={base(className)}>
    <circle cx="30" cy="32" r="19" stroke={color} strokeWidth={strokeWidth} />
    <path d="M14 25c9 4 20 5 31 2M12 34c11 5 24 5 35 0M17 43c9 3 19 3 28-1"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M22 14c6 10 8 24 4 35M38 14c-5 10-6 25-2 35"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M49 32c5 1 9 5 10 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const CrochetHook: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={base(className)}>
    <path d="M20 56 44 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M44 16c2-4 7-5 9-1s-1 8-5 8c-2 0-3-1-3-3"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M27 45l6-10" stroke={color} strokeWidth={strokeWidth * 1.7} strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const Spool: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={base(className)}>
    <rect x="20" y="14" width="24" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <rect x="20" y="44" width="24" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <path d="M24 20v24M40 20v24" stroke={color} strokeWidth={strokeWidth} />
    <path d="M24 26h16M24 32h16M24 38h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.7" />
    <path d="M40 30c6 2 9 7 8 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const KnitHeart: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={base(className)}>
    <path d="M32 52S10 38 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 14-22 28-22 28Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M20 24c3 3 3 6 0 9M32 22c3 3 3 7 0 10M44 24c-3 3-3 6 0 9"
      stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" opacity="0.6" />
  </svg>
);

/* ───────────────────────── Botanicals ───────────────────────── */

export const Sprig: React.FC<MarkProps & { flip?: boolean }> = ({
  className, color = 'currentColor', strokeWidth = 1.5, flip,
}) => (
  <svg viewBox="0 0 80 40" fill="none" aria-hidden="true"
    className={base(className)} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M4 20c18 0 40-4 72-14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M20 17c-2-5 0-9 4-11 1 5-1 9-4 11ZM34 13c-1-5 1-9 6-10 0 5-2 8-6 10ZM48 9c0-5 3-8 8-8-1 5-3 7-8 8Z"
      fill={color} opacity="0.75" />
    <path d="M22 22c-1 5 1 8 5 10 0-5-2-8-5-10ZM37 18c-1 5 1 8 5 9 0-4-1-7-5-9Z"
      fill={color} opacity="0.55" />
  </svg>
);

export const LeafPair: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={base(className)}>
    <path d="M24 44V14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M24 22c-8-1-12-6-12-13 8 0 12 5 12 13ZM24 30c8-1 12-6 12-13-8 0-12 5-12 13Z"
      fill={color} opacity="0.7" />
  </svg>
);

export const Flower: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={base(className)}>
    <g stroke={color} strokeWidth={strokeWidth}>
      <circle cx="24" cy="16" r="5" />
      <circle cx="33" cy="23" r="5" />
      <circle cx="29" cy="33" r="5" />
      <circle cx="19" cy="33" r="5" />
      <circle cx="15" cy="23" r="5" />
      <circle cx="24" cy="25" r="3.2" fill={color} opacity="0.35" />
    </g>
  </svg>
);

export const Bird: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 64 48" fill="none" aria-hidden="true" className={base(className)}>
    <path d="M14 30c0-8 6-14 14-14 8 0 13 5 15 11l9 3-9 3c-2 6-7 10-14 10-8 0-15-5-15-13Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M24 26c4-4 10-4 14 0" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" opacity="0.7" />
    <circle cx="24" cy="24" r="1.6" fill={color} />
    <path d="M14 30c-4-2-7-6-8-11 6 1 9 4 11 8" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </svg>
);

export const Mushroom: React.FC<MarkProps> = ({ className, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 40 48" fill="none" aria-hidden="true" className={base(className)}>
    <path d="M4 22c0-9 7-16 16-16s16 7 16 16H4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M14 22v14a6 6 0 0 0 12 0V22" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <circle cx="14" cy="14" r="2.4" fill={color} opacity="0.5" />
    <circle cx="25" cy="12" r="1.8" fill={color} opacity="0.5" />
  </svg>
);

/* ───────────────────────── Rules & dividers ───────────────────────── */

/** A crochet chain-stitch rule — the site's recurring horizontal accent. */
export const ChainRule: React.FC<MarkProps & { width?: number }> = ({
  className, color = 'currentColor', strokeWidth = 1.4, width = 120,
}) => (
  <svg viewBox={`0 0 ${width} 12`} fill="none" aria-hidden="true"
    preserveAspectRatio="none" className={base(className)}>
    {Array.from({ length: Math.floor(width / 12) }).map((_, i) => (
      <ellipse key={i} cx={6 + i * 12} cy="6" rx="5" ry="4"
        stroke={color} strokeWidth={strokeWidth} opacity="0.65" />
    ))}
  </svg>
);

/**
 * Small paired flourish that flanks a centred section heading, matching the
 * reference's leaf marks either side of its titles.
 */
export const HeadingFlourish: React.FC<{ className?: string; color?: string; flip?: boolean }> = ({
  className, color = 'currentColor', flip,
}) => (
  <svg viewBox="0 0 56 24" fill="none" aria-hidden="true"
    className={base(className)} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M2 12c14 0 28-2 42-8" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    <path d="M2 12c14 1 28 3 42 8" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    <path d="M44 4c4-2 8-2 10 1-3 3-7 3-10-1ZM44 20c4 2 8 2 10-1-3-3-7-3-10 1Z" fill={color} opacity="0.7" />
    <circle cx="30" cy="8" r="1.8" fill={color} opacity="0.55" />
    <circle cx="30" cy="16" r="1.8" fill={color} opacity="0.4" />
  </svg>
);

/* ───────────────────────── Corner clusters ───────────────────────── */

/**
 * Layered corner decoration for the hero — a loose bouquet of yarn, hook and
 * foliage. Kept as one component so hero markup stays readable.
 */
export const CornerCluster: React.FC<{ className?: string; side?: 'left' | 'right' }> = ({
  className, side = 'left',
}) => (
  <div
    className={base(`absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} ${className ?? ''}`)}
    style={side === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    aria-hidden="true"
  >
    <svg viewBox="0 0 260 220" fill="none" className="w-full h-auto">
      <g stroke="#6E7444" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
        <path d="M-6 26C40 30 92 20 132 -6" />
        <path d="M-6 62C52 70 108 56 150 24" />
        <path d="M14 -6C30 34 34 78 22 116" />
      </g>
      <g fill="#6E7444" opacity="0.42">
        <path d="M36 22c-6-8-5-17 2-24 6 8 5 17-2 24ZM70 14c-5-9-3-18 5-23 4 9 2 17-5 23ZM104 4c-4-9-1-18 7-22 3 9 0 17-7 22Z" />
        <path d="M30 56c-8-4-12-12-10-21 8 4 12 12 10 21ZM64 48c-8-4-11-12-9-21 8 5 11 13 9 21Z" />
      </g>
      <g fill="#C0663A" opacity="0.5">
        <circle cx="118" cy="40" r="4.5" />
        <circle cx="150" cy="66" r="3.5" />
        <circle cx="86" cy="72" r="3" />
      </g>
      <g stroke="#1F4E4A" strokeWidth="1.5" opacity="0.4">
        <circle cx="44" cy="104" r="17" />
        <path d="M28 98c11 4 23 4 33 0M27 110c12 4 24 3 34-2" strokeLinecap="round" />
        <path d="M37 88c5 9 6 21 3 31M53 88c-4 9-5 21-2 31" strokeLinecap="round" />
      </g>
      <g stroke="#C0663A" strokeWidth="1.5" strokeLinecap="round" opacity="0.45">
        <path d="M100 130 128 96" />
        <path d="M128 96c2-4 7-4 9 0s-2 7-6 6" />
      </g>
    </svg>
  </div>
);
