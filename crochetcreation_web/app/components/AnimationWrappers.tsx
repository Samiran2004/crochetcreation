"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

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

  if (inView) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
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

  if (inView) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
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
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
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
