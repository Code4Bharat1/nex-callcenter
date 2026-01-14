/**
 * Utility function to merge class names
 * Similar to clsx but simplified
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}

