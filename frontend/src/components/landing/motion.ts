/** Shared framer-motion easing and stagger presets for the landing. */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
};
