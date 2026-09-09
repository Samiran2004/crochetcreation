'use client';

import React from 'react';
import { HeadingFlourish } from '../decor/Botanicals';

/**
 * Centred section title flanked by the paired leaf flourish, as in the
 * reference layout. `tone` picks the palette for the band it sits on.
 */

interface SectionHeadingProps {
  children: React.ReactNode;
  eyebrow?: string;
  /** Sub-line under the title. */
  lede?: string;
  tone?: 'ink' | 'ondark';
  align?: 'center' | 'left';
  flourish?: boolean;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  /**
   * 'page' is the full-bleed section title. 'panel' is for headings set inside
   * a card or coloured panel, where the page scale would overwhelm the box.
   */
  size?: 'page' | 'panel';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  eyebrow,
  lede,
  tone = 'ink',
  align = 'center',
  flourish = true,
  className = '',
  as: Tag = 'h2',
  size = 'page',
}) => {
  const onDark = tone === 'ondark';
  const flourishColor = onDark ? 'rgba(196,211,201,0.8)' : 'rgba(110,116,68,0.85)';

  return (
    <div
      className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} gap-3 md:gap-4 ${className}`}
    >
      {eyebrow && (
        <span className={onDark ? 'eyebrow eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</span>
      )}

      <div className={`flex items-center gap-4 md:gap-7 ${align === 'center' ? 'justify-center' : ''}`}>
        {flourish && align === 'center' && (
          <HeadingFlourish className={`hidden sm:block h-auto shrink-0 opacity-90 ${size === 'panel' ? 'w-10 md:w-14' : 'w-12 md:w-20'}`} color={flourishColor} flip />
        )}
        <Tag
          className={`font-display tracking-[-0.022em] leading-[1.06] ${
            size === 'panel'
              ? 'text-[24px] sm:text-[30px] md:text-[36px]'
              : 'text-[30px] sm:text-[40px] md:text-[52px] lg:text-[58px]'
          } ${onDark ? 'text-ondark' : 'text-ink'}`}
        >
          {children}
        </Tag>
        {flourish && align === 'center' && (
          <HeadingFlourish className={`hidden sm:block h-auto shrink-0 opacity-90 ${size === 'panel' ? 'w-10 md:w-14' : 'w-12 md:w-20'}`} color={flourishColor} />
        )}
      </div>

      {lede && (
        <p
          className={`max-w-[46ch] text-[15px] md:text-[17px] leading-[1.7] mt-1 ${
            onDark ? 'text-ondark-muted' : 'text-bodytext'
          }`}
        >
          {lede}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
