'use client';

import React from 'react';

/**
 * Torn-paper transitions between colour bands — the layout's signature move.
 *
 * Each edge is a single filled path stretched with `preserveAspectRatio="none"`.
 * The paths deliberately fill almost the whole 120-unit viewBox: an earlier
 * version drew only in the lower third, so the top of every edge rendered as a
 * flat empty strip and each transition cost ~40px of dead space.
 *
 * Usage: place between two sections and set `fill` to the colour of the band
 * the edge flows *into*.
 */

export type EdgeVariant = 'torn' | 'wave' | 'scallop' | 'hill';

interface OrganicEdgeProps {
  /** Colour of the section this edge flows into. */
  fill: string;
  /**
   * Colour of the section the edge is leaving. The area above the path is
   * transparent, so without this the page background shows through and each
   * transition gets a stray parchment stripe.
   */
  from?: string;
  variant?: EdgeVariant;
  /** Flip vertically for a bottom-of-section edge. */
  flip?: boolean;
  className?: string;
  /** Height in px at desktop; scales down on small screens. */
  height?: number;
}

const PATHS: Record<EdgeVariant, string> = {
  // Irregular torn edge — lobes of differing size, crests near the top.
  torn:
    'M0,44 C48,10 96,4 148,20 C200,36 228,80 286,86 C344,92 376,44 432,30 ' +
    'C488,16 526,44 584,56 C642,68 680,32 738,18 C796,4 836,36 894,52 ' +
    'C952,68 990,36 1046,20 C1102,4 1142,32 1198,50 C1254,68 1296,50 1348,26 ' +
    'C1386,8 1414,10 1440,30 L1440,120 L0,120 Z',
  // Single sweeping crest that reaches the top of the box.
  wave:
    'M0,52 C200,-6 400,-6 600,34 C800,74 1000,78 1200,44 C1300,27 1372,20 1440,34 ' +
    'L1440,120 L0,120 Z',
  // Crochet shell edging — deep, rounded scallops.
  scallop:
    'M0,96 C40,96 40,16 80,16 C120,16 120,96 160,96 C200,96 200,16 240,16 ' +
    'C280,16 280,96 320,96 C360,96 360,16 400,16 C440,16 440,96 480,96 ' +
    'C520,96 520,16 560,16 C600,16 600,96 640,96 C680,96 680,16 720,16 ' +
    'C760,16 760,96 800,96 C840,96 840,16 880,16 C920,16 920,96 960,96 ' +
    'C1000,96 1000,16 1040,16 C1080,16 1080,96 1120,96 C1160,96 1160,16 1200,16 ' +
    'C1240,16 1240,96 1280,96 C1320,96 1320,16 1360,16 C1400,16 1400,96 1440,96 ' +
    'L1440,120 L0,120 Z',
  // Rolling hills, for the quietest transitions.
  hill:
    'M0,80 C240,18 480,6 720,30 C960,54 1200,72 1440,42 L1440,120 L0,120 Z',
};

export const OrganicEdge: React.FC<OrganicEdgeProps> = ({
  fill,
  from,
  variant = 'torn',
  flip = false,
  className = '',
  height = 84,
}) => (
  <div
    className={`edge-wrap w-full overflow-hidden -mt-px ${className}`}
    style={{
      height: `clamp(${Math.round(height * 0.55)}px, ${height / 14}vw, ${height}px)`,
      backgroundColor: from,
    }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="w-full h-full"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path d={PATHS[variant]} fill={fill} />
    </svg>
  </div>
);

export default OrganicEdge;
