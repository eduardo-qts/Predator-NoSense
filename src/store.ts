import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import {
  Capabilities,
  Mode,
  Page,
  ProfileMeta,
  RGB,
  UpdateInfo,
  ZONE_COUNT,
} from "./types";
import { fromProfileConfig, toEffectConfig } from "./lib/config";
import { toggleZoneSelection } from "./lib/zones";
import { isNewer } from "./version";

export { toEffectConfig };

const WHITE: RGB = { r: 255, g: 255, b: 255 };

const DEFAULT_ZONE_COLORS: RGB[] = [
  { r: 255, g: 0, b: 80 },
  { r: 180, g: 0, b: 255 },
  { r: 0, g: 120, b: 255 },
  { r: 0, g: 255, b: 200 },
];

export type ApplyState = "idle" | "busy" | "done";
export type ToastKind = "ok" | "bad";
export interface Toast {
  msg: string;
  kind: ToastKind;
}

/** Which colour the picker is editing: 0 = closed, 1-4 = a zone, 5 = effect. */
export type PickerTarget = 0 | 1 | 2 | 3 | 4 | 5;

export interface KbState {
  // configuration
  mode: Mode;
  color: RGB; // used by color-based dynamic modes
  zoneColors: RGB[]; // 4 entries, used by Static mode
  selectedZones: number[]; // 1..4, which zones the picker edits in Static
  speed: number; // 1..10 (UI/preview; sent to firmware as speed-1)
  brightness: number; // 0..100
  direction: number; // 1|2 (preview labels; sent to firmware swapped)

  // ui
  page: Page;
  picker: PickerTarget;
  dirty: boolean;
  applyState: ApplyState;
  toast: Toast | null;

  // runtime
  capabilities: Capabilities | null;
  profiles: ProfileMeta[];
  autoApply: boolean;
  debounceMs: number;
  autostart: boolean; // restore current choice on every reboot
  update: UpdateInfo | null; // set only when a newer release exists
  lastError: string | null;

  // actions
  init: () => Promise<void>;
  setPage: (p: Page) => void;
  setMode: (m: Mode) => void;
  /** Paints every currently selected zone (Static) or the effect colour. */
  setActiveColor: (c: RGB) => void;
  toggleZone: (zone: number) => void;
  openPicker: (target: PickerTarget) => void;
  setSpeed: (s: number) => void;
  setBrightness: (b: number) => void;
  setDirection: (d: number) => void;
  setAutoApply: (v: boolean) => void;
  setDebounceMs: (ms: number) => void;
  setAutostart: (v: boolean) => Promise<void>;

  say: (msg: string, kind?: ToastKind) => void;
  clearToast: () => void;
  dismissUpdate: () => void;
  reset: () => void;

  apply: () => Promise<void>;
  checkDriver: () => Promise<void>;
  writeBootScript: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  saveProfile: (name: string) => Promise<void>;
  loadProfile: (name: string) => Promise<void>;
  editProfile: (name: string) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;

  /** internal: debounced auto-apply trigger */
  scheduleAutoApply: () => void;
}

let applyTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let doneTimer: ReturnType<typeof setTimeout> | null = null;

const defaults = () => ({
  mode: Mode.Static,
  color: { ...WHITE },
  zoneColors: DEFAULT_ZONE_COLORS.map((c) => ({ ...c })),
  selectedZones: [1],
  speed: 5,
  brightness: 100,
  direction: 1,
});

/** Bumped by every edit, so an apply can tell whether the state it wrote is
 * still the state on screen when the driver finally answers. */
let editSeq = 0;
/** The write currently talking to the driver, so two can never overlap. */
let inFlight: Promise<void> | null = null;

export const useStore = create<KbState>()(
  persist(
    (set, get) => ({
      ...defaults(),

      page: "keyboard" as Page,
      picker: 0 as PickerTarget,
      dirty: false,
      applyState: "idle" as ApplyState,
      toast: null,

      capabilities: null,
      profiles: [],
      autoApply: true,
      debounceMs: 180,
      autostart: false,
      update: null,
      lastError: null,

      init: async () => {
        try {
          const caps = await api.getCapabilities();
          set({ capabilities: caps });
        } catch (e) {
          set({ lastError: String(e) });
        }
        try {
          set({ autostart: await api.getAutostart() });
        } catch {
          /* non-fatal */
        }
        // Best-effort update check; silent when offline or up to date.
        api
          .checkUpdate()
          .then((u) => {
            if (isNewer(u.latest, u.current)) set({ update: u });
          })
          .catch(() => {});
        await get().refreshProfiles();
      },

      setPage: (page) => set({ page, picker: 0 }),

      setMode: (mode) => {
        set({ mode, picker: 0 });
        get().scheduleAutoApply();
      },
      setActiveColor: (c) => {
        const s = get();
        if (s.mode !== Mode.Static) {
          set({ color: c });
        } else {
          const targets = s.selectedZones.length ? s.selectedZones : ZONE_INDICES;
          const zoneColors = s.zoneColors.slice();
          targets.forEach((z) => (zoneColors[z - 1] = c));
          set({ zoneColors });
        }
        get().scheduleAutoApply();
      },

      // Zones stay multi-select: pick several, paint them in one go.
      toggleZone: (zone) => {
        const s = get();
        set(toggleZoneSelection(s.selectedZones, s.picker, zone));
      },

      openPicker: (target) =>
        set({ picker: get().picker === target ? 0 : target }),

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
      setAutoApply: (autoApply) => {
        if (!autoApply && applyTimer) {
          clearTimeout(applyTimer);
          applyTimer = null;
        }
        set({ autoApply });
      },
      setDebounceMs: (debounceMs) => set({ debounceMs }),
      dismissUpdate: () => set({ update: null }),

      say: (msg, kind = "ok") => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: { msg, kind } });
        toastTimer = setTimeout(() => set({ toast: null }), 2600);
      },
      clearToast: () => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: null });
      },

      reset: () => {
        set({ ...defaults(), picker: 0 });
        get().say("Reset to the default lighting");
        get().scheduleAutoApply();
      },

      setAutostart: async (v) => {
        if (v) {
          await get().writeBootScript(); // seed the script before installing the unit
          await api.enableAutostart();
        } else {
          await api.disableAutostart();
        }
        set({ autostart: v });
      },

      // Mirror the current selection into ~/.config/predator/autostart.sh (no root).
      writeBootScript: async () => {
        const s = get();
        if (s.mode === Mode.Static) {
          await api.writeBootZones(zonePayload(s.zoneColors), s.brightness);
        } else {
          await api.writeBootEffect(toEffectConfig(s));
        }
      },

      apply: async () => {
        // Serialise on the promise, not on applyState: an edit arriving
        // mid-flight resets applyState, so it can never be the lock.
        while (inFlight) await inFlight.catch(() => {});

        const s = get();
        const stamp = editSeq;
        if (doneTimer) clearTimeout(doneTimer);
        set({ applyState: "busy", lastError: null });

        inFlight = (async () => {
          if (s.mode === Mode.Static) {
            await api.applyStaticZones(zonePayload(s.zoneColors), s.brightness);
          } else {
            await api.applyEffect(toEffectConfig(s));
          }
        })();

        try {
          await inFlight;
        } catch (e) {
          set({ applyState: "idle", lastError: String(e) });
          throw e;
        } finally {
          inFlight = null;
        }

        // Keep the boot-restore script in sync with the last applied choice.
        if (get().autostart) {
          get()
            .writeBootScript()
            .catch(() => {});
        }

        if (editSeq !== stamp) {
          // The user edited while the driver was busy — what is on the keyboard
          // is already out of date, so don't claim otherwise.
          set({ applyState: "idle" });
          return;
        }
        set({ applyState: "done", dirty: false });
        doneTimer = setTimeout(() => set({ applyState: "idle" }), 2400);
      },

      checkDriver: async () => {
        get().say("Re-running driver detection…");
        try {
          set({ capabilities: await api.getCapabilities(), lastError: null });
        } catch (e) {
          set({ lastError: String(e) });
        }
      },

      refreshProfiles: async () => {
        try {
          set({ profiles: await api.listProfilesMeta() });
        } catch (e) {
          set({ lastError: String(e) });
        }
      },

      saveProfile: async (name) => {
        const s = get();
        if (s.mode === Mode.Static) {
          // A facer_rgb.py profile holds a single colour, and -save applies it
          // as it writes. Save the first zone's colour (one the user actually
          // picked, not a stale effect colour) and put the four zones back so
          // the keyboard is not left flattened to that one colour.
          const c = s.zoneColors[0];
          await api.saveProfile(name, {
            ...toEffectConfig(s),
            red: c.r,
            green: c.g,
            blue: c.b,
          });
          await api.applyStaticZones(zonePayload(s.zoneColors), s.brightness);
        } else {
          await api.saveProfile(name, toEffectConfig(s));
        }
        set({ dirty: false });
        await get().refreshProfiles();
      },

      // Load = apply on the keyboard, which is what facer_rgb.py -load does.
      loadProfile: async (name) => {
        const p = await api.loadProfile(name);
        set({ ...fromProfileConfig(p), picker: 0, dirty: false, applyState: "idle" });
        if (get().autostart) get().writeBootScript().catch(() => {});
      },

      // Edit = pull the profile into the editor without touching the keyboard.
      editProfile: async (name) => {
        const p = await api.readProfile(name);
        set({ ...fromProfileConfig(p), page: "keyboard", picker: 0, dirty: true });
      },

      deleteProfile: async (name) => {
        await api.deleteProfile(name);
        await get().refreshProfiles();
      },

      scheduleAutoApply: () => {
        editSeq++;
        set({ dirty: true });
        if (applyTimer) clearTimeout(applyTimer);
        // Always debounce, even with auto-apply off: the boot-restore script
        // still has to mirror the current selection, and writing it on every
        // pointermove would be ~60 IPC round-trips a second.
        applyTimer = setTimeout(() => {
          applyTimer = null;
          const s = get();
          if (s.autostart) s.writeBootScript().catch(() => {});
          if (s.autoApply) s.apply().catch(() => {});
        }, get().debounceMs);
      },
    }),
    {
      name: "predator-ui",
      // Only persist the user's choices, not runtime/device state.
      partialize: (s) => ({
        mode: s.mode,
        color: s.color,
        zoneColors: s.zoneColors,
        selectedZones: s.selectedZones,
        speed: s.speed,
        brightness: s.brightness,
        direction: s.direction,
        autoApply: s.autoApply,
        debounceMs: s.debounceMs,
      }),
    }
  )
);

const zonePayload = (zoneColors: RGB[]) =>
  zoneColors.map((c, i) => ({ zone: i + 1, red: c.r, green: c.g, blue: c.b }));

export const ZONE_INDICES = Array.from({ length: ZONE_COUNT }, (_, i) => i + 1);
