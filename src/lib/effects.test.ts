import { describe, expect, test } from "vitest";
import { Mode, RGB } from "../types";
import { overrideColor, scaleBrightness } from "./effects";

const COLOR: RGB = { r: 240, g: 18, b: 18 };
const at = (mode: Mode, xFrac: number, phase: number, direction = 1) =>
  overrideColor({ mode, xFrac, phase, color: COLOR, direction });

/** Perceptual-ish weight, enough to compare "which of these two is lit". */
const lum = (c: RGB | null) => (c ? c.r * 0.3 + c.g * 0.59 + c.b * 0.11 : 0);

test("Static leaves the zone color alone", () => {
  expect(at(Mode.Static, 0.5, 0.3)).toBeNull();
});

describe("Neon", () => {
  test("lights the whole keyboard in one color at a time", () => {
    expect(at(Mode.Neon, 0, 0.3)).toEqual(at(Mode.Neon, 0.9, 0.3));
  });

  test("moves through the spectrum over time", () => {
    expect(at(Mode.Neon, 0.5, 0)).not.toEqual(at(Mode.Neon, 0.5, 0.4));
  });
});

describe("Wave", () => {
  test("spreads different colors across the width at one instant", () => {
    expect(at(Mode.Wave, 0.1, 0.25)).not.toEqual(at(Mode.Wave, 0.6, 0.25));
  });

  test("reversing the direction runs the same rainbow backwards", () => {
    const phase = 0.3;
    for (const x of [0, 0.25, 0.5, 0.75]) {
      expect(at(Mode.Wave, x, phase, 1)).toEqual(
        at(Mode.Wave, x, 1 - phase, 2)
      );
    }
  });
});

describe("Shifting", () => {
  // direction 1 puts the head at 1 - phase.
  const head = (phase: number) => 1 - phase;

  test("the head of the sweep carries the full chosen color", () => {
    expect(at(Mode.Shifting, head(0.4), 0.4)).toEqual(COLOR);
  });

  test("the head travels as the phase advances", () => {
    const early = head(0.2);
    expect(lum(at(Mode.Shifting, early, 0.2))).toBeGreaterThan(
      lum(at(Mode.Shifting, early, 0.7))
    );
  });

  test("the trail fades the further behind the head you look", () => {
    const phase = 0.5;
    const h = head(phase);
    const trail = [0.02, 0.08, 0.16, 0.24].map((d) =>
      lum(at(Mode.Shifting, h + d, phase))
    );
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i]).toBeLessThan(trail[i - 1]);
    }
  });
});

describe("Zoom", () => {
  test("starts lit at the center with the edges dark", () => {
    expect(lum(at(Mode.Zoom, 0.5, 0))).toBeGreaterThan(
      lum(at(Mode.Zoom, 0, 0))
    );
  });

  test("the lit region grows outward through the cycle", () => {
    expect(lum(at(Mode.Zoom, 0, 0.5))).toBeGreaterThan(
      lum(at(Mode.Zoom, 0, 0))
    );
  });

  test("never lights an edge brighter than the center", () => {
    for (const phase of [0, 0.15, 0.35, 0.5, 0.8]) {
      expect(lum(at(Mode.Zoom, 0, phase))).toBeLessThanOrEqual(
        lum(at(Mode.Zoom, 0.5, phase))
      );
    }
  });
});

describe("brightness", () => {
  test("zero turns the key off whatever color it was", () => {
    expect(scaleBrightness({ r: 255, g: 0, b: 80 }, 0)).toEqual({
      r: 0,
      g: 0,
      b: 0,
    });
  });

  test("full leaves the color untouched", () => {
    const c = { r: 0, g: 176, b: 255 };
    expect(scaleBrightness(c, 1)).toEqual(c);
  });

  test("half dims without shifting the hue", () => {
    const dim = scaleBrightness({ r: 200, g: 100, b: 50 }, 0.5);
    expect(dim).toEqual({ r: 100, g: 50, b: 25 });
  });
});
