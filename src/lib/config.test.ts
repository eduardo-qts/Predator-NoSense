import { expect, test } from "vitest";
import { Mode } from "../types";
import { fromProfileConfig, toEffectConfig } from "./config";

// The firmware counts speed from zero and travels the opposite way from our
// labels, so saving and re-loading is where a sign flip would hide.
test("saving the current lighting and loading it back gives the user the same settings", () => {
  for (const speed of [1, 5, 10]) {
    for (const direction of [1, 2]) {
      const chosen = {
        mode: Mode.Wave,
        speed,
        direction,
        brightness: 63,
        color: { r: 0, g: 176, b: 255 },
      };

      const reloaded = fromProfileConfig({
        ...toEffectConfig(chosen),
        zone: 1,
      });

      expect(reloaded).toEqual(chosen);
    }
  }
});
