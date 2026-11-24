import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais com resolução de conflitos Tailwind CSS.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
