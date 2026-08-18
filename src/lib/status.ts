import type { Capabilities } from "../types";

export type DeviceState = "checking" | "connected" | "elevated" | "driver" | "python";

export interface DeviceStatus {
  state: DeviceState;
  /** The keyboard can actually be written to. */
  ready: boolean;
  label: string;
  detail: string;
  color: string;
}

const GREEN = "#3ecf8e";
const AMBER = "#f0a020";
const GREY = "#6c7482";

/** One reading of the device situation, shared by the sidebar, the keyboard
 * page pill and the settings page so they can never disagree. */
export function deviceStatus(caps: Capabilities | null): DeviceStatus {
  if (!caps)
    return {
      state: "checking",
      ready: false,
      label: "Checking keyboard…",
      detail: "detecting devices",
      color: GREY,
    };

  if (!caps.python_ok)
    return {
      state: "python",
      ready: false,
      label: "Python unavailable",
      detail: "facer_rgb.py cannot run",
      color: AMBER,
    };

  if (!caps.dynamic_device || !caps.static_device)
    return {
      state: "driver",
      ready: false,
      label: "Keyboard unavailable",
      detail: "facer module not loaded",
      color: AMBER,
    };

  // The devices exist but are root-owned; writes still go through via pkexec.
  if (!caps.writable)
    return {
      state: "elevated",
      ready: true,
      label: "Keyboard connected",
      detail: "writes need elevation",
      color: AMBER,
    };

  return {
    state: "connected",
    ready: true,
    label: "Keyboard connected",
    detail: "/dev/acer-gkbbl-0",
    color: GREEN,
  };
}
