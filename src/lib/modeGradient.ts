import { Mode, RGB } from "../types";
import { toHex } from "./color";

const ACCENT: RGB = { r: 240, g: 18, b: 18 };
/** The four demo hues the Static tile shows when no colour is supplied. */
const DEMO = ["#FF0050", "#B400FF", "#0078FF", "#00FFC8"];

const shade = (c: RGB, k: number) =>
  toHex({
    r: Math.round(c.r * k),
    g: Math.round(c.g * k),
    b: Math.round(c.b * k),
  });

const rgba = ({ r, g, b }: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

/** One CSS background per lighting mode, shared by the mode tiles and the
 * profile cards so a saved profile reads the same as the mode that made it.
 *
 * `color` is the colour that mode actually uses. Neon and Wave ignore it —
 * they drive their own spectrum, so showing a stored RGB there would be a
 * leftover value the user never picked. */
export function modeGradient(mode: Mode, color?: RGB): string {
  const c = color ?? ACCENT;

  switch (mode) {
    case Mode.Neon:
      return "linear-gradient(90deg,#ff004d,#ff8a00,#ffe600,#00e676,#00b0ff,#7c4dff)";

    case Mode.Wave:
      return "linear-gradient(90deg,#00b0ff,#7c4dff,#ff004d,#ff8a00,#ffe600,#00e676)";

    case Mode.Static: {
      // Four hard-stopped bands. With a colour it is four shades of it; the
      // profile format only stores one, so inventing four hues would lie.
      const bands = color ? [1, 0.72, 0.48, 0.26].map((k) => shade(c, k)) : DEMO;
      const stops = bands
        .map((b, i) => `${b} ${i * 25}%, ${b} ${(i + 1) * 25}%`)
        .join(", ");
      return `linear-gradient(90deg, ${stops})`;
    }

    case Mode.Breath:
      return `linear-gradient(90deg, ${rgba(c, 0.15)}, ${toHex(c)}, ${rgba(
        c,
        0.15
      )})`;

    case Mode.Shifting:
      return `linear-gradient(90deg, ${rgba(c, 0)}, ${toHex(c)} 68%, ${rgba(
        c,
        0.06
      )})`;

    case Mode.Zoom:
      return `radial-gradient(ellipse at 50% 50%, ${toHex(c)}, ${rgba(
        c,
        0.06
      )} 72%)`;
  }
}
