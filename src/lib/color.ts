import type { RGB } from "../types";

export type HSV = { h: number; s: number; v: number };

const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export function hsv2rgb(h: number, s: number, v: number): RGB {
  h = wrapHue(h);
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r: number, g: number, b: number;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgb2hsv({ r, g, b }: RGB): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: wrapHue(h), s: mx ? d / mx : 0, v: mx };
}

/** h in degrees, s/l in 0-100. Used by the rainbow effects. */
export function hsl2rgb(h: number, s: number, l: number): RGB {
  h = wrapHue(h);
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  };
}

export function toHex({ r, g, b }: RGB): string {
  const t = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${t(r)}${t(g)}${t(b)}`.toUpperCase();
}

/** Null for anything that isn't six hex digits — the HEX field is typed into
 * character by character, so a half-finished value must not become a color. */
export function fromHex(hex: string): RGB | null {
  const m = String(hex).replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

export const rgba = ({ r, g, b }: RGB, a: number) =>
  `rgba(${r},${g},${b},${a})`;
