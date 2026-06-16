import { Box, Group, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { Mode, RGB, ZONE_COUNT } from "../types";
import { useStore, ZONE_INDICES } from "../store";

function rgbStr({ r, g, b }: RGB, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexToRgb(hex: string): RGB {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

const SPECTRUM = ["#ff004d", "#ff8a00", "#ffe600", "#00e676", "#00b0ff", "#7c4dff"];

/** Compute the display color (as RGB) of a zone given the active mode. */
function zoneRGB(mode: Mode, index: number, color: RGB, zoneColors: RGB[]): RGB {
  switch (mode) {
    case Mode.Static:
      return zoneColors[index];
    case Mode.Neon:
    case Mode.Wave:
      // multi-color spectrum across zones
      return hexToRgb(SPECTRUM[(index * 2) % SPECTRUM.length]);
    default:
      return color;
  }
}

type Key = { label: string; w?: number };

// A laptop-style layout so the preview actually reads as a keyboard. Widths are
// in key-units; zones are vertical bands, so a key's zone is decided by the
// horizontal position of its center within the row.
const KB_LAYOUT: Key[][] = [
  [
    { label: "esc" }, { label: "F1" }, { label: "F2" }, { label: "F3" },
    { label: "F4" }, { label: "F5" }, { label: "F6" }, { label: "F7" },
    { label: "F8" }, { label: "F9" }, { label: "F10" }, { label: "F11" },
    { label: "F12" }, { label: "del" },
  ],
  [
    { label: "~" }, { label: "1" }, { label: "2" }, { label: "3" },
    { label: "4" }, { label: "5" }, { label: "6" }, { label: "7" },
    { label: "8" }, { label: "9" }, { label: "0" }, { label: "-" },
    { label: "=" }, { label: "⌫", w: 2 },
  ],
  [
    { label: "tab", w: 1.5 }, { label: "Q" }, { label: "W" }, { label: "E" },
    { label: "R" }, { label: "T" }, { label: "Y" }, { label: "U" },
    { label: "I" }, { label: "O" }, { label: "P" }, { label: "[" },
    { label: "]" }, { label: "\\", w: 1.5 },
  ],
  [
    { label: "caps", w: 1.75 }, { label: "A" }, { label: "S" }, { label: "D" },
    { label: "F" }, { label: "G" }, { label: "H" }, { label: "J" },
    { label: "K" }, { label: "L" }, { label: ";" }, { label: "'" },
    { label: "enter", w: 2.25 },
  ],
  [
    { label: "shift", w: 2.25 }, { label: "Z" }, { label: "X" }, { label: "C" },
    { label: "V" }, { label: "B" }, { label: "N" }, { label: "M" },
    { label: "," }, { label: "." }, { label: "/" }, { label: "shift", w: 2.75 },
  ],
  [
    { label: "ctrl", w: 1.3 }, { label: "fn" }, { label: "⊞" },
    { label: "alt", w: 1.3 }, { label: "", w: 6 }, { label: "alt", w: 1.3 },
    { label: "ctrl", w: 1.3 }, { label: "◄" }, { label: "▲" },
    { label: "▼" }, { label: "►" },
  ],
];

/** Map each key in a row to a 0-based zone by its horizontal center. */
function rowZones(row: Key[]): number[] {
  const total = row.reduce((s, k) => s + (k.w ?? 1), 0);
  let cum = 0;
  return row.map((k) => {
    const w = k.w ?? 1;
    const center = (cum + w / 2) / total;
    cum += w;
    return Math.min(ZONE_COUNT - 1, Math.floor(center * ZONE_COUNT));
  });
}

export function KeyboardPreview() {
  const { mode, color, zoneColors, brightness, selectedZones, setSelectedZones } =
    useStore();

  const isStatic = mode === Mode.Static;
  const glow = 0.25 + (brightness / 100) * 0.75;

  const toggleZone = (z: number) => {
    if (!isStatic) return;
    setSelectedZones(
      selectedZones.includes(z)
        ? selectedZones.filter((x) => x !== z)
        : [...selectedZones, z]
    );
  };

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent">
      <Group justify="space-between" mb="sm">
        <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1}>
          Live preview · {ZONE_COUNT} zones
        </Text>
        {isStatic && (
          <Text size="xs" c="dimmed">
            Select a zone to edit its color
          </Text>
        )}
      </Group>

      {/* zone labels sit ABOVE the keyboard as column headers (Static only) */}
      {isStatic && (
        <div className="kb-zone-headers">
          {ZONE_INDICES.map((z) => {
            const selected = selectedZones.includes(z);
            const c = zoneColors[z - 1];
            return (
              <UnstyledButton
                key={z}
                className="kb-zone-header"
                data-selected={selected}
                aria-pressed={selected}
                aria-label={`Zone ${z}${selected ? ", selected" : ""}`}
                onClick={() => toggleZone(z)}
              >
                <span
                  className="kb-zone-swatch"
                  style={{ background: rgbStr(c) }}
                />
                Zone {z}
              </UnstyledButton>
            );
          })}
        </div>
      )}

      <Box
        className="kb-board"
        style={{
          position: "relative",
          borderRadius: 18,
          padding: 16,
          background:
            "linear-gradient(180deg, rgba(30,16,16,0.5), rgba(0,0,0,0.55))",
          border: "1px solid rgba(240,18,18,0.12)",
          overflow: "hidden",
        }}
      >
        {/* the keys — decorative; selection is handled by the zone overlay */}
        <Stack
          gap={5}
          aria-hidden
          style={{ pointerEvents: isStatic ? "none" : undefined }}
        >
          {KB_LAYOUT.map((row, ri) => {
            const zones = rowZones(row);
            return (
              <Group key={ri} gap={5} grow wrap="nowrap" align="stretch">
                {row.map((k, ki) => {
                  const c = zoneRGB(mode, zones[ki], color, zoneColors);
                  return (
                    <Box
                      key={ki}
                      className="kb-key"
                      style={{
                        flexGrow: k.w ?? 1,
                        flexBasis: 0,
                        background: `linear-gradient(180deg, rgba(255,255,255,0.06), ${rgbStr(
                          c,
                          0.18
                        )})`,
                        border: `1px solid ${rgbStr(c, 0.25)}`,
                        boxShadow: `0 1px 2px rgba(0,0,0,0.5), 0 0 ${Math.round(
                          8 * glow
                        )}px ${rgbStr(c, 0.5 * glow)}, inset 0 0 ${Math.round(
                          10 * glow
                        )}px ${rgbStr(c, 0.3 * glow)}`,
                      }}
                    >
                      {k.label}
                    </Box>
                  );
                })}
              </Group>
            );
          })}
        </Stack>

        {/* zone highlight overlay — visual feedback for the selection above */}
        {isStatic && (
          <div className="kb-bands" aria-hidden>
            {ZONE_INDICES.map((z) => (
              <div
                key={z}
                className="kb-zone-band"
                data-selected={selectedZones.includes(z)}
              />
            ))}
          </div>
        )}

        {/* animated sheen hints that an effect is "moving" */}
        {!isStatic && <div className="kb-sheen" aria-hidden />}
      </Box>
    </Paper>
  );
}
