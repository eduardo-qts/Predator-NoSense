import { useEffect, useState } from "react";
import { Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { Mode, RGB, ZONE_COUNT } from "../types";
import { useStore, ZONE_INDICES } from "../store";
import logoIcon from "../assets/logo-icon.png";

function rgbStr({ r, g, b }: RGB, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Convert an HSL color (h in degrees, s/l in 0-100) to RGB. */
function hslToRgb(h: number, s: number, l: number): RGB {
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

function hexToRgb(hex: string): RGB {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

const SPECTRUM = ["#ff004d", "#ff8a00", "#ffe600", "#00e676", "#00b0ff", "#7c4dff"];
const PRED_RED: RGB = { r: 240, g: 18, b: 18 };

/** Compute the display color (as RGB) of a zone given the active mode. */
function zoneRGB(mode: Mode, index: number, color: RGB, zoneColors: RGB[]): RGB {
  switch (mode) {
    case Mode.Static:
      return zoneColors[index];
    case Mode.Neon:
    case Mode.Wave:
      // multi-color spectrum across zones
      return hexToRgb(SPECTRUM[(index * 2) % SPECTRUM.length]);
    default:
      return color;
  }
}

type Flags = { wasd?: boolean; accent?: boolean; predator?: boolean };

type Key = {
  label?: string;
  /** small secondary legend shown in the top-left corner */
  sub?: string;
  /** column span on the 0.25-unit grid (4 cols = 1 key-unit) */
  c: number;
  /** number of rows this key spans (the tall ISO Enter) */
  rowSpan?: number;
  /** a blank cap (spacebar) */
  blank?: boolean;
} & Flags;

type FuncKey = { label?: string; w?: number; spacer?: boolean } & Flags;

// The whole keyboard is laid out on a fine column grid so every cap aligns and
// the tall ISO Enter / numpad Enter can span two rows. 4 cols = 1 key-unit.
// Main alpha block = cols 1-60, a small gutter = 61-62, numpad = cols 63-78.
const TOTAL_COLS = 78;

// ---- function row (its own flex strip, sits above the main block) ----
const FUNC_ROW: FuncKey[] = [
  { label: "Esc", w: 1.2 },
  { label: "F1" }, { label: "F2" }, { label: "F3" }, { label: "F4" },
  { label: "F5" }, { label: "F6" }, { label: "F7" }, { label: "F8" },
  { label: "F9" }, { label: "F10" }, { label: "F11" }, { label: "F12" },
  { label: "PrtSc" }, { label: "Ins" }, { label: "Del" },
  { spacer: true, w: 0.7 },
  { label: "⏮" }, { label: "⏯" }, { label: "⏭" }, { label: "⏻" },
];

// ---- the five grid rows: numbers, QWERTY, ASDF, ZXCV, bottom (ABNT2) ----
const MAIN_ROWS: Key[][] = [
  // numbers
  [
    { label: "'", sub: '"', c: 4 }, { label: "1", sub: "!", c: 4 },
    { label: "2", sub: "@", c: 4 }, { label: "3", sub: "#", c: 4 },
    { label: "4", sub: "$", c: 4 }, { label: "5", sub: "%", c: 4 },
    { label: "6", sub: "¨", c: 4 }, { label: "7", sub: "&", c: 4 },
    { label: "8", sub: "*", c: 4 }, { label: "9", sub: "(", c: 4 },
    { label: "0", sub: ")", c: 4 }, { label: "-", sub: "_", c: 4 },
    { label: "=", sub: "+", c: 4 }, { label: "←", c: 8 },
  ],
  // QWERTY (ends with the tall ISO Enter)
  [
    { label: "Tab", c: 6 }, { label: "Q", c: 4 }, { label: "W", c: 4, wasd: true },
    { label: "E", c: 4 }, { label: "R", c: 4 }, { label: "T", c: 4 },
    { label: "Y", c: 4 }, { label: "U", c: 4 }, { label: "I", c: 4 },
    { label: "O", c: 4 }, { label: "P", c: 4 }, { label: "´", sub: "`", c: 4 },
    { label: "[", sub: "{", c: 4 }, { label: "↵", c: 6, rowSpan: 2 },
  ],
  // ASDF
  [
    { label: "Fixa", c: 6 }, { label: "A", c: 4, wasd: true },
    { label: "S", c: 4, wasd: true }, { label: "D", c: 4, wasd: true },
    { label: "F", c: 4 }, { label: "G", c: 4 }, { label: "H", c: 4 },
    { label: "J", c: 4 }, { label: "K", c: 4 }, { label: "L", c: 4 },
    { label: "Ç", c: 4 }, { label: "~", sub: "^", c: 4 },
    { label: "]", sub: "}", c: 4 },
  ],
  // ZXCV
  [
    { label: "⇧", c: 4 }, { label: "\\", sub: "|", c: 4 }, { label: "Z", c: 4 },
    { label: "X", c: 4 }, { label: "C", c: 4 }, { label: "V", c: 4 },
    { label: "B", c: 4 }, { label: "N", c: 4 }, { label: "M", c: 4 },
    { label: ",", sub: "<", c: 4 }, { label: ".", sub: ">", c: 4 },
    { label: ";", sub: ":", c: 4 }, { label: "⇧", c: 4 }, { label: "▲", c: 4, wasd: true },
  ],
  // bottom
  [
    { label: "Ctrl", c: 6 }, { label: "Fn", c: 4 }, { label: "⊞", c: 4 },
    { label: "Alt", c: 4 }, { blank: true, c: 16 }, { label: "Alt Gr", c: 6 },
    { label: "☰", c: 4 }, { label: "/", sub: "?", c: 4 }, { label: "◄", c: 4, wasd: true },
    { label: "▼", c: 4, wasd: true }, { label: "►", c: 4, wasd: true },
  ],
];

// ---- the numeric keypad (explicit grid placement; cols 63-78, rows 1-5) ----
type NumKey = { label?: string; sub?: string; col: string; row: string } & Flags;

const NUMPAD: NumKey[] = [
  { predator: true, col: "63 / span 4", row: "1" },
  { label: "NumLk", col: "67 / span 4", row: "1" },
  { label: "/", col: "71 / span 4", row: "1" },
  { label: "*", col: "75 / span 4", row: "1" },
  { label: "7", sub: "Home", col: "63 / span 4", row: "2" },
  { label: "8", sub: "▲", col: "67 / span 4", row: "2" },
  { label: "9", sub: "PgUp", col: "71 / span 4", row: "2" },
  { label: "-", col: "75 / span 4", row: "2" },
  { label: "4", sub: "◄", col: "63 / span 4", row: "3" },
  { label: "5", col: "67 / span 4", row: "3" },
  { label: "6", sub: "►", col: "71 / span 4", row: "3" },
  { label: "+", col: "75 / span 4", row: "3" },
  { label: "1", sub: "End", col: "63 / span 4", row: "4" },
  { label: "2", sub: "▼", col: "67 / span 4", row: "4" },
  { label: "3", sub: "PgDn", col: "71 / span 4", row: "4" },
  { label: "Enter", col: "75 / span 4", row: "4 / span 2" },
  { label: "0", sub: "Ins", col: "63 / span 8", row: "5" },
  { label: ".", sub: "Del", col: "71 / span 4", row: "5" },
];

/** Lay out a grid row: assign each key its start column, zone + x-fraction. */
function layoutRow(row: Key[]) {
  let col = 1;
  return row.map((k) => {
    const start = col;
    col += k.c;
    const xFrac = (start - 1 + k.c / 2) / TOTAL_COLS;
    const zone = Math.min(ZONE_COUNT - 1, Math.floor(xFrac * ZONE_COUNT));
    return { k, start, zone, xFrac };
  });
}

/** Horizontal center (0..1) of a numpad key from its grid-column string. */
function colFrac(col: string): number {
  const m = col.match(/(\d+)\s*\/\s*span\s*(\d+)/);
  const start = m ? +m[1] : parseInt(col, 10);
  const span = m ? +m[2] : 1;
  return (start - 1 + span / 2) / TOTAL_COLS;
}

/** Dynamic glow/border styling for a single keycap. `bright` (0..1) scales the
 * whole cap so the preview tracks the brightness slider — 0 reads as "off". */
function keyStyle(c0: RGB, glow: number, flags: Flags = {}, bright = 1) {
  const c: RGB = {
    r: Math.round(c0.r * bright),
    g: Math.round(c0.g * bright),
    b: Math.round(c0.b * bright),
  };
  // wasd + predator keys keep the cap's own (zone) color but get a thicker
  // border; the predator/logo key also gets a solid black background.
  const thick = flags.wasd || flags.predator;
  const borderW = thick ? 2 : 1;
  const borderA = thick ? 0.75 : 0.28;
  return {
    background: flags.predator
      ? "#000"
      : `linear-gradient(180deg, rgba(255,255,255,${0.05 * bright}), ${rgbStr(c, 0.16)})`,
    border: `${borderW}px solid ${rgbStr(c, borderA)}`,
    boxShadow:
      `0 1px 2px rgba(0,0,0,0.55), 0 0 ${Math.round(8 * glow)}px ${rgbStr(
        c,
        0.5 * glow
      )}, inset 0 0 ${Math.round(10 * glow)}px ${rgbStr(c, 0.3 * glow)}`,
  } as const;
}

/** Pick the cap color for a key given its flags + zone. */
function capColor(
  flags: Flags,
  zone: number,
  mode: Mode,
  color: RGB,
  zoneColors: RGB[],
  override: RGB | null
): RGB {
  if (flags.accent) return PRED_RED;
  // animated modes (Neon/Wave) supply a per-frame color for the whole keyboard
  if (override) return override;
  // wasd + predator keys follow the normal zone/mode color (only border thicker)
  return zoneRGB(mode, zone, color, zoneColors);
}

function KeyCap({ k }: { k: { label?: string; sub?: string; predator?: boolean } }) {
  if (k.predator) return <img className="kb-logo" src={logoIcon} alt="" />;
  const label = k.label ?? "";
  const word = label.length > 1;
  return (
    <>
      {k.sub && <span className="kb-key-sub">{k.sub}</span>}
      <span className={`kb-key-main${word ? " kb-key-main--word" : ""}`}>
        {label}
      </span>
    </>
  );
}

export function KeyboardPreview() {
  const {
    mode,
    color,
    zoneColors,
    brightness,
    speed,
    direction,
    selectedZones,
    setSelectedZones,
  } = useStore();

  const isStatic = mode === Mode.Static;
  const bright = brightness / 100; // 0 = backlight off
  const glow = 0.25 + bright * 0.75;

  // Neon mode: cycle a hue over time so the whole keyboard slides through the
  // RGB spectrum (one color at a time), like dragging across the color picker.
  const [hue, setHue] = useState(0);
  useEffect(() => {
    if (mode !== Mode.Neon) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const loop = (t: number) => {
      setHue((t / 24) % 360); // full spectrum every ~8.6s
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);
  const neonColor = hslToRgb(hue, 100, 55);

  // Wave, Shifting & Zoom animate from a normalized 0..1 phase that advances
  // over time, driven by the selected speed (speed 0 = held still).
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const animated =
      mode === Mode.Wave || mode === Mode.Shifting || mode === Mode.Zoom;
    if (!animated || speed <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const loop = (t: number) => {
      setPhase(((t * speed) / 12000) % 1); // speed 4 ≈ one pass every 3s
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, speed]);

  // Wave: a full rainbow across the width, scrolling in the chosen direction.
  // direction 2 = Left→Right, 1 = Right→Left
  const waveSign = direction === 2 ? -1 : 1;
  const waveColor = (xFrac: number) =>
    hslToRgb(((xFrac * 360 + waveSign * phase * 360) % 360 + 360) % 360, 100, 55);

  // Shifting: a single bright band of the chosen color sweeps across, leaving a
  // fading trail behind it; everything it hasn't reached stays dark.
  const travelDir = direction === 2 ? 1 : -1;
  const head = travelDir > 0 ? phase : 1 - phase;
  const TAIL = 0.3; // trail length as a fraction of the board width
  const shiftColor = (xFrac: number): RGB => {
    const behind = (((travelDir * (head - xFrac)) % 1) + 1) % 1;
    const k = Math.exp(-behind / TAIL);
    return {
      r: Math.round(color.r * k),
      g: Math.round(color.g * k),
      b: Math.round(color.b * k),
    };
  };

  // Zoom: a single-color region grows out of the center and shrinks back, in a
  // continuous pulse. Lit inside the current radius, dark outside.
  const zoomRadius = 0.58 * Math.sin(phase * Math.PI); // 0 → max → 0 per cycle
  const ZOOM_EDGE = 0.1; // soft boundary width
  const zoomColor = (xFrac: number): RGB => {
    const d = Math.abs(xFrac - 0.5);
    let s = (d - (zoomRadius - ZOOM_EDGE)) / (2 * ZOOM_EDGE);
    s = Math.max(0, Math.min(1, s));
    const k = 1 - s * s * (3 - 2 * s); // smoothstep: 1 inside, 0 outside
    return {
      r: Math.round(color.r * k),
      g: Math.round(color.g * k),
      b: Math.round(color.b * k),
    };
  };

  // resolve the animated override color for a key at horizontal position xFrac
  const overrideFor = (xFrac: number): RGB | null =>
    mode === Mode.Neon
      ? neonColor
      : mode === Mode.Wave
      ? waveColor(xFrac)
      : mode === Mode.Shifting
      ? shiftColor(xFrac)
      : mode === Mode.Zoom
      ? zoomColor(xFrac)
      : null;

  const toggleZone = (z: number) => {
    if (!isStatic) return;
    setSelectedZones(
      selectedZones.includes(z)
        ? selectedZones.filter((x) => x !== z)
        : [...selectedZones, z]
    );
  };

  // function-row zones (by horizontal weight across the full width)
  const funcTotal = FUNC_ROW.reduce((s, k) => s + (k.w ?? 1), 0);

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent">
      <Group justify="space-between" mb="sm">
        <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1}>
          Live preview · {ZONE_COUNT} zones
        </Text>
        {isStatic && (
          <Text size="xs" c="dimmed">
            Select a zone to edit its color
          </Text>
        )}
      </Group>

      {/* zone labels sit ABOVE the keyboard as column headers (Static only) */}
      {isStatic && (
        <div className="kb-zone-headers">
          {ZONE_INDICES.map((z) => {
            const selected = selectedZones.includes(z);
            const c = zoneColors[z - 1];
            return (
              <UnstyledButton
                key={z}
                className="kb-zone-header"
                data-selected={selected}
                aria-pressed={selected}
                aria-label={`Zone ${z}${selected ? ", selected" : ""}`}
                onClick={() => toggleZone(z)}
              >
                <span
                  className="kb-zone-swatch"
                  style={{ background: rgbStr(c) }}
                />
                Zone {z}
              </UnstyledButton>
            );
          })}
        </div>
      )}

      <div className="kb-board">
        <div
          className={`kb-keys${mode === Mode.Breath ? " kb-breathing" : ""}`}
          aria-hidden
          style={{ pointerEvents: isStatic ? "none" : undefined }}
        >
          {/* function row */}
          <div className="kb-funcrow">
            {(() => {
              let cum = 0;
              return FUNC_ROW.map((k, i) => {
                const w = k.w ?? 1;
                const frac = (cum + w / 2) / funcTotal;
                cum += w;
                if (k.spacer) {
                  return (
                    <div
                      key={i}
                      className="kb-spacer"
                      style={{ flexGrow: w, flexBasis: 0 }}
                    />
                  );
                }
                const zone = Math.min(ZONE_COUNT - 1, Math.floor(frac * ZONE_COUNT));
                const c = capColor(k, zone, mode, color, zoneColors, overrideFor(frac));
                return (
                  <div
                    key={i}
                    className="kb-key"
                    style={{ flexGrow: w, flexBasis: 0, ...keyStyle(c, glow, k, bright) }}
                  >
                    <KeyCap k={k} />
                  </div>
                );
              });
            })()}
          </div>

          {/* main block + numpad share one grid so the rows line up */}
          <div className="kb-grid">
            {MAIN_ROWS.map((row, ri) =>
              layoutRow(row).map(({ k, start, zone, xFrac }, ki) => {
                const c = capColor(k, zone, mode, color, zoneColors, overrideFor(xFrac));
                return (
                  <div
                    key={`${ri}-${ki}`}
                    className="kb-key"
                    style={{
                      gridColumn: `${start} / span ${k.c}`,
                      gridRow: k.rowSpan ? `${ri + 1} / span ${k.rowSpan}` : `${ri + 1}`,
                      ...keyStyle(c, glow, k, bright),
                    }}
                  >
                    {!k.blank && <KeyCap k={k} />}
                  </div>
                );
              })
            )}

            {NUMPAD.map((k, i) => {
              const c = capColor(
                k,
                ZONE_COUNT - 1,
                mode,
                color,
                zoneColors,
                overrideFor(colFrac(k.col))
              );
              return (
                <div
                  key={`np-${i}`}
                  className="kb-key"
                  style={{ gridColumn: k.col, gridRow: k.row, ...keyStyle(c, glow, k, bright) }}
                >
                  <KeyCap k={k} />
                </div>
              );
            })}
          </div>
        </div>

        {/* zone highlight overlay — visual feedback for the selection above */}
        {isStatic && (
          <div className="kb-bands" aria-hidden>
            {ZONE_INDICES.map((z) => (
              <div
                key={z}
                className="kb-zone-band"
                data-selected={selectedZones.includes(z)}
              />
            ))}
          </div>
        )}
      </div>
    </Paper>
  );
}