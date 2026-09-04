"use client";

import React, { useRef } from "react";
import { motion, useInView, HTMLMotionProps } from "framer-motion";

// Global spring transition settings for elite un-intrusive physics
const defaultSpring = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
};

// Global ease bezier transition settings for scale and smooth fades
const defaultEase = {
  ease: [0.25, 0.1, 0.25, 1] as const,
};

interface FadeUpWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  once?: boolean;
  margin?: string;
  inView?: boolean;
}

/**
 * Reusable animation wrapper to fade and slide up components.
 * Best used for headings, sections, or individual blocks.
 */
export const FadeUpWrapper: React.FC<FadeUpWrapperProps> = ({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 30,
  once = true,
  margin = "-100px",
  inView = true,
  className,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: margin as any });

  const variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...defaultSpring,
        delay,
        duration,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={!inView || isInView ? "visible" : "hidden"}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface ScaleInWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  scaleOffset?: number;
  once?: boolean;
  margin?: string;
  inView?: boolean;
}

/**
 * Reusable animation wrapper for image scale-up + fade-in (e.g. hero blobs).
 */
export const ScaleInWrapper: React.FC<ScaleInWrapperProps> = ({
  children,
  delay = 0,
  duration = 1.2,
  scaleOffset = 0.95,
  once = true,
  margin = "-100px",
  inView = false,
  className,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: margin as any });

  const variants = {
    hidden: { opacity: 0, scale: scaleOffset },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...defaultEase,
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={!inView || isInView ? "visible" : "hidden"}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  once?: boolean;
  margin?: string;
}

/**
 * Reusable container wrapper to orchestrate children stagger transitions.
 * Use on grids or list containers.
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerChildren = 0.1,
  delayChildren = 0,
  once = true,
  margin = "-100px",
  className,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: margin as any });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };

  /**
   * NOTE: this deliberately uses `animate` driven by `useInView` rather than
   * `whileInView`. Framer Motion only propagates `initial`/`animate` variant
   * labels down through MotionContext — `whileInView` is not propagated. With
   * `whileInView`, any child that mounts *after* the container has already
   * scrolled into view (e.g. product cards arriving from a slow API call)
   * inherits `initial="hidden"` and never receives the "visible" variant, so it
   * stays at opacity 0 forever. Driving `animate` explicitly means late-mounting
   * children inherit "visible" from context and animate in correctly.
   */
  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  yOffset?: number;
}

/**
 * Reusable item wrapper placed on children elements of a StaggerContainer.
 */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  yOffset = 20,
  className,
  ...props
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...defaultSpring,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
};
