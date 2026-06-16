import {
  Alert,
  Chip,
  ColorPicker,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { MODES, Mode, RGB } from "../types";
import { useStore, ZONE_INDICES } from "../store";

function toHex({ r, g, b }: RGB) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function fromHex(hex: string): RGB {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16) || 0,
    g: parseInt(m.slice(2, 4), 16) || 0,
    b: parseInt(m.slice(4, 6), 16) || 0,
  };
}

export function ColorControls() {
  const {
    mode,
    color,
    setColor,
    zoneColors,
    selectedZones,
    setSelectedZones,
    setZoneColor,
  } = useStore();

  const meta = MODES.find((m) => m.id === mode)!;
  const isStatic = mode === Mode.Static;

  if (!meta.usesColor) {
    return (
      <Paper p="lg" radius="lg" className="fade-in clip-accent">
        <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1} mb="sm">
          Color
        </Text>
        <Alert
          variant="light"
          color="gray"
          icon={<IconInfoCircle size={18} />}
        >
          <Text size="sm">
            {meta.name} cycles the full color spectrum automatically — no color
            selection needed.
          </Text>
        </Alert>
      </Paper>
    );
  }

  // The color currently being edited.
  const editing: RGB = isStatic
    ? zoneColors[(selectedZones[0] ?? 1) - 1]
    : color;

  const onChange = (hex: string) => {
    const rgb = fromHex(hex);
    if (isStatic) {
      const targets = selectedZones.length ? selectedZones : ZONE_INDICES;
      targets.forEach((z) => setZoneColor(z, rgb));
    } else {
      setColor(rgb);
    }
  };

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent">
      <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1} mb="md">
        Color
      </Text>

      {isStatic && (
        <Stack gap={6} mb="md">
          <Text size="xs" c="dimmed">
            Editing zone(s)
          </Text>
          <Chip.Group
            multiple
            value={selectedZones.map(String)}
            onChange={(v) => setSelectedZones(v.map(Number))}
          >
            <Group gap="xs">
              {ZONE_INDICES.map((z) => (
                <Chip key={z} value={String(z)} size="sm" variant="outline">
                  Zone {z}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>
      )}

      <Group align="flex-start" gap="lg" wrap="wrap">
        <ColorPicker
          format="hex"
          aria-label="Color picker"
          value={toHex(editing)}
          onChange={onChange}
          size="lg"
          swatchesPerRow={8}
          swatches={[
            "#ff0050", "#ff6a00", "#ffd400", "#37ff00", "#00ffd0",
            "#00a2ff", "#5b00ff", "#d000ff", "#ffffff", "#ff2d2d",
            "#1dd3b0", "#7c4dff", "#0a84ff", "#34c759", "#ff9f0a", "#000000",
          ]}
        />
        <Stack gap="xs">
          <TextInput
            label="Hex"
            size="sm"
            w={130}
            value={toHex(editing)}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (/^#?[0-9a-fA-F]{6}$/.test(v)) onChange(v);
            }}
          />
          <Group gap={6}>
            {(["r", "g", "b"] as const).map((ch) => (
              <Stack key={ch} gap={2} align="center">
                <Text size="10px" c="dimmed" tt="uppercase">
                  {ch}
                </Text>
                <TextInput
                  size="xs"
                  w={54}
                  type="number"
                  aria-label={`${ch.toUpperCase()} channel (0–255)`}
                  value={editing[ch]}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(255, Number(e.currentTarget.value) || 0));
                    onChange(toHex({ ...editing, [ch]: n }));
                  }}
                />
              </Stack>
            ))}
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
