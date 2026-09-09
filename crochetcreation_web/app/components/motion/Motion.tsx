'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, useSpring, type MotionValue } from 'framer-motion';

/**
 * The site's motion vocabulary.
 *
 * Two rules hold everywhere:
 *  - Nothing that carries meaning is hidden behind a scroll trigger for long;
 *    reveals are short and start from a near-visible state.
 *  - Every effect collapses to "no movement" under `prefers-reduced-motion`,
 *    which Framer Motion honours for us via `useReducedMotion` semantics on
 *    transitions plus the CSS guard in globals.css.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────── Reveal ─────────────────────────── */

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Direction the content travels in from. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  /** Re-trigger each time it enters the viewport. */
  once?: boolean;
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  from = 'up',
  delay = 0,
  duration = 0.7,
  distance = 26,
  once = true,
  as = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // `-12%` fires a little before the block is fully on screen so the movement
  // has finished by the time the reader's eye arrives.
  const inView = useInView(ref, { once, margin: '-12% 0px -12% 0px' });

  const offset =
    from === 'up' ? { y: distance } :
    from === 'down' ? { y: -distance } :
    from === 'left' ? { x: -distance } :
    from === 'right' ? { x: distance } :
    {};

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
};

/* ──────────────────────── RevealGroup ───────────────────────── */

interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds between each child. */
  stagger?: number;
  delay?: number;
  once?: boolean;
}

/**
 * Staggers its direct children in.
 *
 * Unlike a variant-propagating container, each child is animated by its own
 * `Reveal`, so children that mount later (products arriving from a slow API)
 * still animate correctly instead of being stranded at opacity 0.
 */
export const RevealGroup: React.FC<RevealGroupProps> = ({
  children,
  className,
  stagger = 0.07,
  delay = 0,
  once = true,
}) => {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={(child as any)?.key ?? i} delay={delay + i * stagger} once={once}>
          {child}
        </Reveal>
      ))}
    </div>
  );
};

/* ─────────────────────────── Parallax ───────────────────────── */

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Pixels of travel across the element's full scroll pass. Negative = up. */
  speed?: number;
  /** Adds a gentle rotation alongside the drift. */
  rotate?: number;
}

export const Parallax: React.FC<ParallaxProps> = ({ children, className, speed = 60, rotate = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // A spring keeps the drift from tracking the wheel 1:1, which is what makes
  // parallax read as depth rather than as jitter.
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.35 });
  const y = useTransform(smooth, [0, 1], [speed, -speed]);
  const r = useTransform(smooth, [0, 1], [-rotate, rotate]);

  return (
    <motion.div ref={ref} style={{ y, rotate: rotate ? r : undefined }} className={className}>
      {children}
    </motion.div>
  );
};

/* ───────────────────── ParallaxImage (Ken Burns) ────────────── */

interface ParallaxImageProps {
  children: React.ReactNode;
  className?: string;
  /** How far the image drifts inside its frame, in percent. */
  amount?: number;
}

/**
 * Drifts an image *inside* a fixed frame. The child should be absolutely
 * positioned and slightly oversized so no edge is ever exposed.
 */
export const ParallaxImage: React.FC<ParallaxImageProps> = ({ children, className, amount = 8 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });
  const y = useTransform(smooth, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ''}`}>
      <motion.div style={{ y }} className="absolute inset-0 scale-[1.18]">
        {children}
      </motion.div>
    </div>
  );
};

/* ─────────────────────── ScrollProgress ─────────────────────── */

/** Hairline reading-progress bar pinned under the header. */
export const ScrollProgress: React.FC<{ className?: string }> = ({ className }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.25 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={`fixed top-0 left-0 right-0 h-[2px] origin-left bg-terracotta z-[55] ${className ?? ''}`}
    />
  );
};

/* ───────────────────────── Magnetic ─────────────────────────── */

/**
 * Nudges a control toward the cursor. Pointer-driven only, so touch devices
 * (which have no hover) are unaffected.
 */
export const Magnetic: React.FC<{ children: React.ReactNode; className?: string; strength?: number }> = ({
  children,
  className,
  strength = 0.28,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate3d(0,0,0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`transition-transform duration-300 ease-out will-change-transform ${className ?? ''}`}
    >
      {children}
    </div>
  );
};

export type { MotionValue };
