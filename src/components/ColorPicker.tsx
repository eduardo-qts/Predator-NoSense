import { useRef, useState } from "react";
import type { RGB } from "../types";
import { fromHex, hsv2rgb, rgb2hsv, toHex } from "../lib/color";
import { IconClose } from "./Icons";

const PRESETS = [
  "#F01212", "#FF0050", "#FF8A00", "#00E676", "#00B0FF", "#7C4DFF", "#FFFFFF",
];

interface Props {
  title: string;
  color: RGB;
  onChange: (c: RGB) => void;
  onClose: () => void;
  /** 0..1 across the card, where the panel should sit. */
  anchor: number;
}

export function ColorPicker({ title, color, onChange, onClose, anchor }: Props) {
  const [hsv, setHsv] = useState(() => rgb2hsv(color));
  // Held while the user types, so a half-finished value doesn't remount the
  // field and steal focus on the sixth character.
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Typing into the RGB/HEX fields must move the SV cursor too.
  const setFromRgb = (c: RGB) => {
    setHsv(rgb2hsv(c));
    onChange(c);
  };
  const setFromHsv = (h: number, s: number, v: number) => {
    setHsv({ h, s, v });
    onChange(hsv2rgb(h, s, v));
  };

  const drag = (
    ref: React.RefObject<HTMLDivElement>,
    cb: (x: number, y: number) => void
  ) => (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const run = (clientX: number, clientY: number) =>
      cb(
        Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (clientY - r.top) / r.height))
      );
    run(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => run(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const channel = (key: keyof RGB) => (raw: string) => {
    const n = Math.max(0, Math.min(255, Number(raw) || 0));
    setFromRgb({ ...color, [key]: n });
  };

  // Keep the 258px panel inside the card whatever it is anchored to.
  const left = `clamp(6px, calc(${anchor * 100}% - 40px), calc(100% - 264px))`;

  return (
    <div className="picker" style={{ left }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 11,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</span>
        <button
          type="button"
          className="win-btn"
          style={{ width: 22, height: 22 }}
          aria-label="Close color picker"
          onClick={onClose}
        >
          <IconClose size={10} />
        </button>
      </div>

      <div
        ref={svRef}
        role="application"
        tabIndex={0}
        aria-label={`Saturation and brightness, ${Math.round(
          hsv.s * 100
        )}% and ${Math.round(hsv.v * 100)}%`}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.02;
          const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
          const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
          if (!dx && !dy) return;
          e.preventDefault();
          setFromHsv(
            hsv.h,
            Math.max(0, Math.min(1, hsv.s + dx)),
            Math.max(0, Math.min(1, hsv.v + dy))
          );
        }}
        onPointerDown={drag(svRef, (x, y) => setFromHsv(hsv.h, x, 1 - y))}
        style={{
          position: "relative",
          height: 122,
          borderRadius: 8,
          cursor: "crosshair",
          border: "1px solid rgba(255,255,255,0.08)",
          background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${hsv.h.toFixed(
            0
          )},100%,50%))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            width: 13,
            height: 13,
            margin: "-6.5px 0 0 -6.5px",
            borderRadius: "50%",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.6)",
          }}
        />
      </div>

      <div
        ref={hueRef}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hsv.h)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 15 : 3;
          const d = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
          if (!d) return;
          e.preventDefault();
          setFromHsv(hsv.h + d, hsv.s, hsv.v);
        }}
        onPointerDown={drag(hueRef, (x) => setFromHsv(x * 360, hsv.s, hsv.v))}
        style={{
          position: "relative",
          height: 11,
          borderRadius: 6,
          marginTop: 12,
          cursor: "pointer",
          background:
            "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${(hsv.h / 360) * 100}%`,
            top: -2,
            width: 15,
            height: 15,
            marginLeft: -7.5,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.65)",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 7,
          marginTop: 13,
        }}
      >
        {(["r", "g", "b"] as const).map((ch) => (
          <label key={ch} className="field">
            <span>{ch.toUpperCase()}</span>
            <input
              type="number"
              min={0}
              max={255}
              value={color[ch]}
              aria-label={`${ch.toUpperCase()} channel`}
              onChange={(e) => channel(ch)(e.currentTarget.value)}
            />
          </label>
        ))}
      </div>

      <label className="field" style={{ marginTop: 9 }}>
        <span>HEX</span>
        <input
          value={hexDraft ?? toHex(color)}
          aria-label="Hex color"
          onChange={(e) => {
            setHexDraft(e.currentTarget.value);
            const c = fromHex(e.currentTarget.value);
            if (c) setFromRgb(c);
          }}
          onBlur={() => setHexDraft(null)}
        />
      </label>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 13,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={`Preset ${hex}`}
            onClick={() => {
              const c = fromHex(hex);
              if (c) setFromRgb(c);
            }}
            style={{
              flex: 1,
              height: 18,
              borderRadius: 5,
              background: hex,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
