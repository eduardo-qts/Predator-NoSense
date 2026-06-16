import { create } from "zustand";
import { api } from "./api";
import {
  Capabilities,
  EffectConfig,
  Mode,
  ProfileConfig,
  RGB,
  ZONE_COUNT,
} from "./types";

const WHITE: RGB = { r: 255, g: 255, b: 255 };

const DEFAULT_ZONE_COLORS: RGB[] = [
  { r: 255, g: 0, b: 80 },
  { r: 180, g: 0, b: 255 },
  { r: 0, g: 120, b: 255 },
  { r: 0, g: 255, b: 200 },
];

export interface KbState {
  // configuration
  mode: Mode;
  color: RGB; // used by color-based dynamic modes
  zoneColors: RGB[]; // 4 entries, used by Static mode
  selectedZones: number[]; // 1..4, which zones the picker edits in Static
  speed: number; // 1..10 (UI/preview; sent to firmware as speed-1)
  brightness: number; // 0..100
  direction: number; // 1|2 (preview labels; sent to firmware swapped)

  // runtime
  capabilities: Capabilities | null;
  profiles: string[];
  applying: boolean;
  autoApply: boolean;
  lastError: string | null;

  // actions
  init: () => Promise<void>;
  setMode: (m: Mode) => void;
  setColor: (c: RGB) => void;
  setZoneColor: (zone: number, c: RGB) => void;
  setSelectedZones: (zones: number[]) => void;
  setSpeed: (s: number) => void;
  setBrightness: (b: number) => void;
  setDirection: (d: number) => void;
  setAutoApply: (v: boolean) => void;

  apply: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  saveProfile: (name: string) => Promise<void>;
  loadProfile: (name: string) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;

  /** internal: debounced auto-apply trigger */
  scheduleAutoApply: () => void;
}

/** Build the dynamic-effect payload from current state.
 *
 * The UI keeps speed 1-based (1..10, so a "0 speed" never confuses the user)
 * but the firmware expects it 0-based, so we send speed-1. Direction is sent
 * swapped because the firmware travels the opposite way from our labels. */
export function toEffectConfig(s: KbState): EffectConfig {
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

let applyTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<KbState>((set, get) => ({
  mode: Mode.Static,
  color: { ...WHITE },
  zoneColors: DEFAULT_ZONE_COLORS.map((c) => ({ ...c })),
  selectedZones: [1, 2, 3, 4],
  speed: 5,
  brightness: 100,
  direction: 1,

  capabilities: null,
  profiles: [],
  applying: false,
  autoApply: true,
  lastError: null,

  init: async () => {
    try {
      const caps = await api.getCapabilities();
      set({ capabilities: caps });
    } catch (e) {
      set({ lastError: String(e) });
    }
    await get().refreshProfiles();
  },

  setMode: (mode) => {
    set({ mode });
    get().scheduleAutoApply();
  },
  setColor: (color) => {
    set({ color });
    get().scheduleAutoApply();
  },
  setZoneColor: (zone, c) => {
    const zoneColors = get().zoneColors.slice();
    zoneColors[zone - 1] = c;
    set({ zoneColors });
    get().scheduleAutoApply();
  },
  setSelectedZones: (selectedZones) => set({ selectedZones }),
  setSpeed: (speed) => {
    set({ speed });
    get().scheduleAutoApply();
  },
  setBrightness: (brightness) => {
    set({ brightness });
    get().scheduleAutoApply();
  },
  setDirection: (direction) => {
    set({ direction });
    get().scheduleAutoApply();
  },
  setAutoApply: (autoApply) => set({ autoApply }),

  apply: async () => {
    const s = get();
    set({ applying: true, lastError: null });
    try {
      if (s.mode === Mode.Static) {
        const zones = s.zoneColors.map((c, i) => ({
          zone: i + 1,
          red: c.r,
          green: c.g,
          blue: c.b,
        }));
        await api.applyStaticZones(zones, s.brightness);
      } else {
        await api.applyEffect(toEffectConfig(s));
      }
    } catch (e) {
      set({ lastError: String(e) });
      throw e;
    } finally {
      set({ applying: false });
    }
  },

  refreshProfiles: async () => {
    try {
      const profiles = await api.listProfiles();
      set({ profiles });
    } catch (e) {
      set({ lastError: String(e) });
    }
  },

  saveProfile: async (name) => {
    await api.saveProfile(name, toEffectConfig(get()));
    await get().refreshProfiles();
  },

  loadProfile: async (name) => {
    const p: ProfileConfig = await api.loadProfile(name);
    set({
      mode: p.mode,
      // invert the firmware-facing transforms applied in toEffectConfig
      speed: p.speed + 1,
      brightness: p.brightness,
      direction: p.direction === 1 ? 2 : 1,
      color: { r: p.red, g: p.green, b: p.blue },
    });
  },

  deleteProfile: async (name) => {
    await api.deleteProfile(name);
    await get().refreshProfiles();
  },

  // internal: debounced auto-apply
  scheduleAutoApply: () => {
    if (!get().autoApply) return;
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      get()
        .apply()
        .catch(() => {});
    }, 180);
  },
}));

export const ZONE_INDICES = Array.from({ length: ZONE_COUNT }, (_, i) => i + 1);
