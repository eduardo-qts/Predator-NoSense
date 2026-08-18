import { useRef } from "react";
import type { RGB } from "../types";
import { rgba, toHex } from "../lib/color";

/** A coloured status dot with a matching halo. */
export function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
}

/** A round colour swatch that glows in its own colour. */
export function Swatch({ color, size }: { color: RGB; size: number }) {
  return (
    <span
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: toHex(color),
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: `0 0 ${size * 0.7}px ${rgba(color, 0.45)}`,
      }}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
}

/** Pointer-drag slider with full keyboard support. */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  disabled,
}: SliderProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const quantize = (raw: number) =>
    Math.max(min, Math.min(max, Math.round(raw / step) * step));

  const drag = (e: React.PointerEvent) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const run = (clientX: number) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(quantize(min + x * (max - min)));
    };
    run(e.clientX);
    const move = (ev: PointerEvent) => run(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -step
        : e.key === "ArrowRight" || e.key === "ArrowUp"
        ? step
        : e.key === "Home"
        ? min - value
        : e.key === "End"
        ? max - value
        : 0;
    if (!delta) return;
    e.preventDefault();
    onChange(quantize(value + delta));
  };

  return (
    <button
      ref={ref}
      type="button"
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      disabled={disabled}
      className="slider"
      onPointerDown={drag}
      onKeyDown={onKeyDown}
    >
      <span className="slider__track" />
      <span className="slider__fill" style={{ width: `${pct}%` }} />
      <span className="slider__thumb" style={{ left: `${pct}%` }} />
    </button>
  );
}
