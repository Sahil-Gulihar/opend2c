import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withUTM(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "opend2c");
    u.searchParams.set("utm_medium", "marketplace");
    u.searchParams.set("utm_campaign", "product_click");
    return u.toString();
  } catch {
    return url;
  }
}
