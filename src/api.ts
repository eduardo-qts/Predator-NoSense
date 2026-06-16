// Thin typed wrapper around the Tauri command layer (src-tauri/src/backend.rs).
import { invoke } from "@tauri-apps/api/core";
import type {
  Capabilities,
  EffectConfig,
  ProfileConfig,
  ZoneColor,
} from "./types";

export const api = {
  getCapabilities: () => invoke<Capabilities>("get_capabilities"),

  applyEffect: (config: EffectConfig) =>
    invoke<void>("apply_effect", { config }),

  applyStaticZones: (zones: ZoneColor[], brightness: number) =>
    invoke<void>("apply_static_zones", { zones, brightness }),

  listProfiles: () => invoke<string[]>("list_profiles"),

  saveProfile: (name: string, config: EffectConfig) =>
    invoke<void>("save_profile", { name, config }),

  loadProfile: (name: string) =>
    invoke<ProfileConfig>("load_profile", { name }),

  readProfile: (name: string) =>
    invoke<ProfileConfig>("read_profile", { name }),

  deleteProfile: (name: string) =>
    invoke<void>("delete_profile", { name }),

  importProfile: (source: string) =>
    invoke<string>("import_profile", { source }),

  exportProfile: (name: string, dest: string) =>
    invoke<void>("export_profile", { name, dest }),
};
