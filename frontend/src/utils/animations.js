/**
 * Reusable Framer Motion animation variants for AegisX SOC design system
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: 'easeInOut' },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
};

export const fadeDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
};

export const cardHover = {
  rest: { scale: 1, y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  hover: {
    scale: 1.015,
    y: -3,
    boxShadow: '0 0 25px rgba(59, 130, 246, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.15, ease: 'easeOut' } },
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const iconButtonHover = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 3, transition: { duration: 0.15 } },
  tap: { scale: 0.9, transition: { duration: 0.1 } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.995 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const sidebarAnimation = {
  expanded: { width: '280px', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  collapsed: { width: '80px', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(59, 130, 246, 0.2)',
      '0 0 25px rgba(59, 130, 246, 0.6)',
      '0 0 10px rgba(59, 130, 246, 0.2)',
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const cyberScanline = {
  animate: {
    y: ['0%', '100%'],
    transition: { duration: 3, repeat: Infinity, ease: 'linear' },
  },
};
