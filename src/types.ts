// Mirrors the Rust backend structs (src-tauri/src/backend.rs) and the
// facer_rgb.py parameter space.

export type RGB = { r: number; g: number; b: number };

/** Effect mode indices exactly as facer_rgb.py expects them. */
export enum Mode {
  Static = 0,
  Breath = 1,
  Neon = 2,
  Wave = 3,
  Shifting = 4,
  Zoom = 5,
}

export interface ModeMeta {
  id: Mode;
  name: string;
  description: string;
  /** Does the mode use a single chosen color? */
  usesColor: boolean;
  usesSpeed: boolean;
  usesDirection: boolean;
  /** Static mode is the only per-zone one. */
  perZone: boolean;
}

export const MODES: ModeMeta[] = [
  {
    id: Mode.Static,
    name: "Static",
    description: "Solid color, set independently per zone.",
    usesColor: true,
    usesSpeed: false,
    usesDirection: false,
    perZone: true,
  },
  {
    id: Mode.Breath,
    name: "Breathing",
    description: "Fades a single color in and out.",
    usesColor: true,
    usesSpeed: true,
    usesDirection: false,
    perZone: false,
  },
  {
    id: Mode.Neon,
    name: "Neon",
    description: "Cycles through the full color spectrum.",
    usesColor: false,
    usesSpeed: true,
    usesDirection: false,
    perZone: false,
  },
  {
    id: Mode.Wave,
    name: "Wave",
    description: "A rainbow wave travels across the zones.",
    usesColor: false,
    usesSpeed: true,
    usesDirection: true,
    perZone: false,
  },
  {
    id: Mode.Shifting,
    name: "Shifting",
    description: "A single color shifts across the keyboard.",
    usesColor: true,
    usesSpeed: true,
    usesDirection: true,
    perZone: false,
  },
  {
    id: Mode.Zoom,
    name: "Zoom",
    description: "A single color zooms in from the zones.",
    usesColor: true,
    usesSpeed: true,
    usesDirection: false,
    perZone: false,
  },
];

export interface EffectConfig {
  mode: number;
  speed: number;
  brightness: number;
  direction: number;
  red: number;
  green: number;
  blue: number;
}

export interface ZoneColor {
  zone: number; // 1..4
  red: number;
  green: number;
  blue: number;
}

export interface ProfileConfig {
  mode: number;
  zone: number;
  speed: number;
  brightness: number;
  direction: number;
  red: number;
  green: number;
  blue: number;
}

export interface Capabilities {
  dynamic_device: boolean;
  static_device: boolean;
  writable: boolean;
  python_ok: boolean;
  script_path: string;
  profiles_dir: string;
}

export const ZONE_COUNT = 4;
