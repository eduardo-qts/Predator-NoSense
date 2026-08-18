import { describe, expect, test } from "vitest";
import { Mode, MODES } from "../types";
import { modeGradient } from "./modeGradient";

const LEFTOVER = { r: 255, g: 255, b: 255 }; // the stale white a Wave profile carries
const CHOSEN = { r: 0, g: 176, b: 255 };

const colourless = MODES.filter((m) => !m.usesColor).map((m) => m.id);
const coloured = MODES.filter((m) => m.usesColor).map((m) => m.id);

describe("modes that drive their own spectrum", () => {
  test.each(colourless)("mode %i ignores the stored colour", (mode) => {
    expect(modeGradient(mode, LEFTOVER)).toEqual(modeGradient(mode, CHOSEN));
  });

  test.each(colourless)("mode %i still paints a spectrum", (mode) => {
    // More than two stops is what makes it read as a rainbow rather than a fade.
    expect(modeGradient(mode).match(/#[0-9a-f]{6}/gi)!.length).toBeGreaterThan(2);
  });
});

describe("modes the user picks a colour for", () => {
  test.each(coloured)("mode %i reflects the chosen colour", (mode) => {
    expect(modeGradient(mode, LEFTOVER)).not.toEqual(modeGradient(mode, CHOSEN));
  });

  test.each(coloured)("mode %i uses that colour, not the theme accent", (mode) => {
    expect(modeGradient(mode, CHOSEN).toLowerCase()).toContain("00b0ff");
  });
});

test("every mode yields a usable CSS background", () => {
  for (const m of MODES) {
    const g = modeGradient(m.id);
    expect(g).toMatch(/gradient\(/);
    expect(modeGradient(m.id, CHOSEN)).toMatch(/gradient\(/);
  }
});

test("Static shows four bands so it reads as the per-zone mode", () => {
  const g = modeGradient(Mode.Static);

  expect(g.match(/#[0-9A-F]{6}/gi)!.length).toBe(8); // 4 colours, 2 stops each
});
