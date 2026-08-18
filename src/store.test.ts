import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Mode } from "./types";

/** Everything the driver actually received, in the order it arrived. */
const driver = {
  effects: [] as number[], // brightness of each dynamic write
  zones: [] as number[], // brightness of each static write
  boot: 0,
  saved: [] as { name: string; red: number; green: number; blue: number }[],
};

/** When closed, driver writes block until the test opens it — that is how a
 * slow pkexec prompt is reproduced. Open by default. */
let gate: Promise<void> | null = null;
let openGate: () => void = () => {};
let started = 0;

const closeGate = () => {
  gate = new Promise<void>((r) => {
    openGate = () => {
      r();
      gate = null;
    };
  });
};

const enterDriver = async () => {
  started++;
  if (gate) await gate;
};

vi.mock("./api", () => ({
  api: {
    applyEffect: vi.fn(async (config: { brightness: number }) => {
      await enterDriver();
      driver.effects.push(config.brightness);
    }),
    applyStaticZones: vi.fn(async (_z: unknown, brightness: number) => {
      await enterDriver();
      driver.zones.push(brightness);
    }),
    writeBootZones: vi.fn(async () => {
      driver.boot++;
    }),
    writeBootEffect: vi.fn(async () => {
      driver.boot++;
    }),
    saveProfile: vi.fn(
      async (
        name: string,
        c: { red: number; green: number; blue: number }
      ) => {
        driver.saved.push({ name, ...c });
      }
    ),
    listProfilesMeta: vi.fn(async () => []),
    getCapabilities: vi.fn(async () => null),
    getAutostart: vi.fn(async () => false),
    checkUpdate: vi.fn(async () => ({})),
  },
}));

const { useStore } = await import("./store");

/** Let every queued write through and wait for the store to settle. */
const settle = async () => {
  openGate();
  await vi.waitFor(() => {
    if (useStore.getState().applyState === "busy") throw new Error("busy");
  });
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  driver.effects = [];
  driver.zones = [];
  driver.boot = 0;
  driver.saved = [];
  gate = null;
  openGate = () => {};
  started = 0;
  useStore.setState({
    mode: Mode.Breath,
    color: { r: 255, g: 255, b: 255 },
    zoneColors: [
      { r: 255, g: 0, b: 80 },
      { r: 180, g: 0, b: 255 },
      { r: 0, g: 120, b: 255 },
      { r: 0, g: 255, b: 200 },
    ],
    selectedZones: [1],
    brightness: 100,
    speed: 5,
    direction: 1,
    autoApply: false,
    autostart: false,
    debounceMs: 180,
    dirty: false,
    applyState: "idle",
    picker: 0,
    profiles: [],
    lastError: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("applying while the driver is still working", () => {
  test("an edit made during an apply is not reported as written", async () => {
    const s = useStore.getState();
    closeGate();
    s.apply();
    s.setBrightness(40); // user drags the slider while pkexec prompts
    await settle();

    expect(useStore.getState().dirty).toBe(true);
  });

  test("two applies never talk to the driver at the same time", async () => {
    const s = useStore.getState();
    closeGate();
    const first = s.apply();
    s.setBrightness(40);
    const second = s.apply();

    // Only the first write may have reached the driver so far.
    await Promise.resolve();
    expect(started).toBe(1);

    await settle();
    await Promise.all([first, second]);
    expect(driver.effects).toEqual([100, 40]);
  });
});

describe("live preview", () => {
  test("turning it off cancels a write that was already pending", async () => {
    useStore.setState({ autoApply: true });
    const s = useStore.getState();

    s.setBrightness(33);
    s.setAutoApply(false);
    await vi.advanceTimersByTimeAsync(500);
    await settle();

    expect(driver.effects).toEqual([]);
  });

  test("a drag writes once when it settles, not once per step", async () => {
    useStore.setState({ autoApply: true });
    const s = useStore.getState();

    for (const b of [90, 80, 70, 60, 50]) s.setBrightness(b);
    await vi.advanceTimersByTimeAsync(500);
    await settle();

    expect(driver.effects).toEqual([50]);
  });
});

test("the boot script is not rewritten on every step of a drag", async () => {
  useStore.setState({ autostart: true, autoApply: false });
  const s = useStore.getState();

  for (const b of [90, 80, 70, 60, 50]) s.setBrightness(b);
  await vi.advanceTimersByTimeAsync(500);

  expect(driver.boot).toBeLessThanOrEqual(1);
});

test("saving a Static profile does not claim the editor is in sync with it", async () => {
  useStore.setState({ mode: Mode.Static, dirty: true });

  await useStore.getState().saveProfile("Crimson");

  const saved = driver.saved[0];
  const zone1 = useStore.getState().zoneColors[0];
  const matchesEditor =
    saved.red === zone1.r && saved.green === zone1.g && saved.blue === zone1.b;

  // Either the profile carries what the user sees, or the editor stays dirty —
  // never "saved" while holding something else.
  expect(matchesEditor || useStore.getState().dirty).toBe(true);
});
