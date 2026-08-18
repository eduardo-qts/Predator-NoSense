import { describe, expect, test } from "vitest";
import { fromHex, hsl2rgb, hsv2rgb, rgb2hsv, toHex } from "./color";

describe("hue round-trip", () => {
  const samples = [
    { name: "saturated red", c: { r: 240, g: 18, b: 18 } },
    { name: "saturated cyan", c: { r: 0, g: 255, b: 200 } },
    { name: "saturated violet", c: { r: 124, g: 77, b: 255 } },
    { name: "white", c: { r: 255, g: 255, b: 255 } },
    { name: "mid grey", c: { r: 128, g: 128, b: 128 } },
    { name: "black", c: { r: 0, g: 0, b: 0 } },
  ];

  test.each(samples)("$name survives rgb -> hsv -> rgb", ({ c }) => {
    const { h, s, v } = rgb2hsv(c);
    expect(hsv2rgb(h, s, v)).toEqual(c);
  });
});

describe("fromHex", () => {
  test.each(["#12", "zzzzzz", "", "#1234567", "#12345g"])(
    "rejects %j",
    (bad) => {
      expect(fromHex(bad)).toBeNull();
    }
  );

  test("accepts a value with or without the leading hash", () => {
    expect(fromHex("#00B0FF")).toEqual(fromHex("00B0FF"));
  });

  test("parses each channel independently", () => {
    expect(fromHex("#0A141E")).toEqual({ r: 10, g: 20, b: 30 });
  });
});

test("a color survives rgb -> hex -> rgb", () => {
  const c = { r: 255, g: 138, b: 0 };
  expect(fromHex(toHex(c))).toEqual(c);
});

describe("hsl2rgb", () => {
  test.each([
    [-90, 270],
    [-200, 160],
    [420, 60],
    [720, 0],
  ])("hue %i is the same colour as %i", (a, b) => {
    expect(hsl2rgb(a, 100, 55)).toEqual(hsl2rgb(b, 100, 55));
  });

  test("zero saturation is grey whatever the hue", () => {
    expect(hsl2rgb(200, 0, 50)).toEqual(hsl2rgb(20, 0, 50));
  });
});
