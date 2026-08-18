import { describe, expect, test } from "vitest";
import type { Capabilities } from "../types";
import { deviceStatus } from "./status";

const caps = (over: Partial<Capabilities> = {}): Capabilities => ({
  dynamic_device: true,
  static_device: true,
  writable: true,
  python_ok: true,
  script_path: "/usr/lib/facer_rgb.py",
  profiles_dir: "/home/u/.config/predator/saved profiles",
  ...over,
});

test("before detection finishes the keyboard is not treated as usable", () => {
  expect(deviceStatus(null).ready).toBe(false);
});

test("a fully working keyboard is usable", () => {
  expect(deviceStatus(caps()).ready).toBe(true);
});

describe("what blocks the editor", () => {
  test.each([
    ["python is missing", { python_ok: false }],
    ["the dynamic device is absent", { dynamic_device: false }],
    ["the static device is absent", { static_device: false }],
    ["both devices are absent", { dynamic_device: false, static_device: false }],
  ])("%s", (_name, over) => {
    expect(deviceStatus(caps(over)).ready).toBe(false);
  });
});

test("root-owned devices still let the user apply, because writes go via pkexec", () => {
  const s = deviceStatus(caps({ writable: false }));

  expect(s.ready).toBe(true);
  expect(s.detail).toMatch(/elevation/i);
});

test("a missing interpreter is reported ahead of a missing device", () => {
  // Both are wrong; the interpreter is the one the user has to fix first.
  const s = deviceStatus(caps({ python_ok: false, dynamic_device: false }));

  expect(s.label).toMatch(/python/i);
});

test("every state carries a label and a colour to render", () => {
  const states = [
    deviceStatus(null),
    deviceStatus(caps()),
    deviceStatus(caps({ writable: false })),
    deviceStatus(caps({ python_ok: false })),
    deviceStatus(caps({ static_device: false })),
  ];

  for (const s of states) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(s.detail.length).toBeGreaterThan(0);
    expect(s.color).toMatch(/^#[0-9a-f]{6}$/i);
  }
});
