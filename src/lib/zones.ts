import type { PickerTarget } from "../store";

/** Toggling a zone in the Static editor. Zones are multi-select — pick several
 * and one colour paints them all — while the picker panel can only point at
 * one of them, so it follows the zone you just touched. */
export function toggleZoneSelection(
  selectedZones: number[],
  picker: PickerTarget,
  zone: number
): { selectedZones: number[]; picker: PickerTarget } {
  const wasSelected = selectedZones.includes(zone);
  const next = wasSelected
    ? selectedZones.filter((z) => z !== zone)
    : [...selectedZones, zone];

  if (!next.length) return { selectedZones: next, picker: 0 };
  if (!wasSelected) return { selectedZones: next, picker: zone as PickerTarget };
  // Removed a zone: only re-anchor if the picker was pointing at it.
  const picked =
    picker === zone ? (next[next.length - 1] as PickerTarget) : picker;
  return { selectedZones: next, picker: picked };
}
