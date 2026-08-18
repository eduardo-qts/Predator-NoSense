import type { EffectConfig, Mode, ProfileConfig, RGB } from "../types";

/** The subset of the UI state that survives a save/load round-trip. */
export interface LightingChoice {
  mode: Mode;
  speed: number; // 1..10 as the user sees it
  brightness: number; // 0..100
  direction: number; // 1 = left, 2 = right
  color: RGB;
}

/** The UI keeps speed 1-based so a "0 speed" never confuses the user, but the
 * firmware expects it 0-based. Direction is sent swapped because the firmware
 * travels the opposite way from our labels. `fromProfileConfig` is the inverse
 * — change one and you must change the other. */
export function toEffectConfig(s: LightingChoice): EffectConfig {
  return {
    mode: s.mode,
    speed: s.speed - 1,
    brightness: s.brightness,
    direction: s.direction === 1 ? 2 : 1,
    red: s.color.r,
    green: s.color.g,
    blue: s.color.b,
  };
}

export function fromProfileConfig(p: ProfileConfig | EffectConfig): LightingChoice {
  return {
    mode: p.mode,
    speed: p.speed + 1,
    brightness: p.brightness,
    direction: p.direction === 1 ? 2 : 1,
    color: { r: p.red, g: p.green, b: p.blue },
  };
}
