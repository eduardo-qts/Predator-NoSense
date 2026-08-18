import { useEffect, useState } from "react";
import { Mode, RGB } from "../types";
import { useStore, ZONE_INDICES } from "../store";
import { rgba } from "../lib/color";
import { overrideColor, scaleBrightness } from "../lib/effects";
import {
  colFrac,
  FUNC_ROW,
  Flags,
  MAIN_ROWS,
  NUMPAD,
  layoutRow,
  zoneOf,
} from "../lib/keyboard";
import mark from "../assets/predator-mark.png";

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ANIMATED = [Mode.Neon, Mode.Wave, Mode.Shifting, Mode.Zoom];

/** Cap styling. `bright` (0..1) scales the whole cap, so 0 reads as "off". */
function capStyle(
  color: RGB,
  glow: number,
  bright: number,
  flags: Flags,
  label: string,
  animated: boolean
): React.CSSProperties {
  const c = scaleBrightness(color, bright);
  // wasd + logo caps keep their zone colour but get a thicker border.
  const thick = !!(flags.wasd || flags.logo);
  return {
    background: flags.logo
      ? "#06070a"
      : `linear-gradient(180deg, rgba(255,255,255,${(0.05 * bright).toFixed(
          3
        )}), ${rgba(c, 0.14)})`,
    border: `${thick ? 2 : 1}px solid ${rgba(c, thick ? 0.66 : 0.24)}`,
    boxShadow: `0 1px 2px rgba(0,0,0,0.5), 0 0 ${Math.round(7 * glow)}px ${rgba(
      c,
      0.3 * glow
    )}, inset 0 0 ${Math.round(9 * glow)}px ${rgba(c, 0.18 * glow)}`,
    fontSize: label.length > 1 ? "6.8px" : "9px",
    transition: animated
      ? "none"
      : "background 180ms linear, border-color 180ms linear, box-shadow 180ms linear",
  };
}

function Cap({
  label,
  sub,
  logo,
}: {
  label: string;
  sub?: string;
  logo?: boolean;
}) {
  if (logo) return <img src={mark} alt="" style={{ width: "68%", opacity: 0.85 }} />;
  return (
    <>
      {sub && <span className="kb-key__sub">{sub}</span>}
      <span>{label}</span>
    </>
  );
}

export function KeyboardPreview() {
  const { mode, color, zoneColors, brightness, speed, direction, selectedZones } =
    useStore();

  const isStatic = mode === Mode.Static;
  const animated = ANIMATED.includes(mode);
  const bright = brightness / 100;
  const glow = 0.2 + bright * 0.6;

  // One phase drives every animated mode. It stops advancing when the mode is
  // not animated (and for reduced-motion users), freezing on the last frame.
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!animated || reduceMotion()) return;
    let raf = 0;
    const loop = (t: number) => {
      setPhase(((t * speed) / 12000) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animated, speed]);

  const colorAt = (xFrac: number): RGB =>
    overrideColor({ mode, xFrac, phase, color, direction }) ??
    (isStatic ? zoneColors[zoneOf(xFrac)] : color);

  const breathSeconds = (7.5 / speed).toFixed(2);

  let funcCum = 0;
  const funcTotal = FUNC_ROW.reduce((s, k) => s + (k.w ?? 1), 0);

  return (
    <div className="kb-shell">
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="kb-funcrow" aria-hidden>
          {FUNC_ROW.map((k, i) => {
            const w = k.w ?? 1;
            const xFrac = (funcCum + w / 2) / funcTotal;
            funcCum += w;
            if (k.spacer)
              return <div key={i} style={{ flexGrow: w, flexBasis: 0 }} />;
            const label = k.label ?? "";
            return (
              <div
                key={i}
                className="kb-key"
                style={{
                  flexGrow: w,
                  flexBasis: 0,
                  ...capStyle(colorAt(xFrac), glow, bright, k, label, animated),
                  fontSize: label.length > 2 ? "6.4px" : "7.6px",
                }}
              >
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="kb-grid" aria-hidden>
          {MAIN_ROWS.map((row, ri) =>
            layoutRow(row).map(({ k, start, xFrac }, ki) => {
              const label = k.blank ? "" : k.label ?? "";
              return (
                <div
                  key={`${ri}-${ki}`}
                  className="kb-key"
                  style={{
                    gridColumn: `${start} / span ${k.c}`,
                    gridRow: k.rowSpan ? `${ri + 1} / span ${k.rowSpan}` : `${ri + 1}`,
                    ...capStyle(colorAt(xFrac), glow, bright, k, label, animated),
                  }}
                >
                  <Cap label={label} sub={k.sub} />
                </div>
              );
            })
          )}

          {NUMPAD.map((k, i) => {
            const label = k.logo ? "" : k.label ?? "";
            return (
              <div
                key={`np-${i}`}
                className="kb-key"
                style={{
                  gridColumn: k.col,
                  gridRow: k.row,
                  ...capStyle(
                    colorAt(colFrac(k.col)),
                    glow,
                    bright,
                    k,
                    label,
                    animated
                  ),
                }}
              >
                <Cap label={label} sub={k.sub} logo={k.logo} />
              </div>
            );
          })}
        </div>
      </div>

      {mode === Mode.Breath && !reduceMotion() && (
        <div
          className="kb-breath"
          style={{ animation: `kbBreath ${breathSeconds}s ease-in-out infinite` }}
        />
      )}

      {isStatic && (
        <div className="kb-bands" aria-hidden>
          {ZONE_INDICES.map((z) => (
            <div key={z} data-selected={selectedZones.includes(z)} />
          ))}
        </div>
      )}
    </div>
  );
}
