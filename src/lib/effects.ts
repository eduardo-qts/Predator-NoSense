import { Mode, RGB } from "../types";
import { hsl2rgb } from "./color";

export interface EffectFrame {
  mode: Mode;
  /** Horizontal position of the key across the board, 0 (left) to 1 (right). */
  xFrac: number;
  /** Animation position, 0 to 1, advancing over time. */
  phase: number;
  /** The user's chosen color, for the single-color effects. */
  color: RGB;
  /** 1 = left, 2 = right (UI labels, not the firmware's). */
  direction: number;
}

/** Trail length behind the Shifting head, as a fraction of the board width. */
const TAIL = 0.3;
/** Soft boundary of the Zoom region. */
const ZOOM_EDGE = 0.1;

const dim = (c: RGB, k: number): RGB => ({
  r: Math.round(c.r * k),
  g: Math.round(c.g * k),
  b: Math.round(c.b * k),
});

/** The color an effect forces onto a key, or null when the mode leaves the
 * key's own zone color in place (Static). */
export function overrideColor({
  mode,
  xFrac,
  phase,
  color,
  direction,
}: EffectFrame): RGB | null {
  switch (mode) {
    case Mode.Neon:
      return hsl2rgb(phase * 360, 100, 55);

    case Mode.Wave: {
      const sign = direction === 2 ? -1 : 1;
      return hsl2rgb(xFrac * 360 + sign * phase * 360, 100, 55);
    }

    case Mode.Shifting: {
      const travel = direction === 2 ? 1 : -1;
      const head = travel > 0 ? phase : 1 - phase;
      const behind = (((travel * (head - xFrac)) % 1) + 1) % 1;
      return dim(color, Math.exp(-behind / TAIL));
    }

    case Mode.Zoom: {
      const radius = 0.58 * Math.sin(phase * Math.PI);
      const d = Math.abs(xFrac - 0.5);
      const t = Math.max(
        0,
        Math.min(1, (d - (radius - ZOOM_EDGE)) / (2 * ZOOM_EDGE))
      );
      return dim(color, 1 - t * t * (3 - 2 * t)); // smoothstep
    }

    default:
      return null;
  }
}

/** Scale a key's color by the brightness slider, 0 (off) to 1 (full). */
export const scaleBrightness = (c: RGB, bright: number): RGB =>
  dim(c, bright);
