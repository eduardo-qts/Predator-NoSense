import { expect, test } from "vitest";
import { toggleZoneSelection } from "./zones";

const sel = (zones: number[], picker: number, click: number) =>
  toggleZoneSelection(zones, picker as never, click);

test("zones accumulate so several can be painted at once", () => {
  let s = { selectedZones: [1], picker: 1 };
  s = sel(s.selectedZones, s.picker, 3);
  s = sel(s.selectedZones, s.picker, 4);

  expect(s.selectedZones).toEqual([1, 3, 4]);
});

test("clicking a selected zone drops it from the selection", () => {
  const s = sel([1, 2, 3], 1, 2);

  expect(s.selectedZones).toEqual([1, 3]);
});

test("the picker follows the zone just added", () => {
  expect(sel([1], 1, 4).picker).toBe(4);
});

test("dropping a zone the picker is not on leaves the picker alone", () => {
  expect(sel([1, 2, 3], 3, 1).picker).toBe(3);
});

test("dropping the zone the picker is on moves it to one still selected", () => {
  const s = sel([1, 2, 3], 2, 2);

  expect(s.selectedZones).toEqual([1, 3]);
  expect(s.selectedZones).toContain(s.picker);
});

test("emptying the selection closes the picker", () => {
  expect(sel([2], 2, 2)).toEqual({ selectedZones: [], picker: 0 });
});
