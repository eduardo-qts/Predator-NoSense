import {
  Group,
  Paper,
  SegmentedControl,
  Slider,
  Stack,
  Text,
} from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconBulb, IconGauge } from "@tabler/icons-react";
import { MODES } from "../types";
import { useStore } from "../store";

export function EffectControls() {
  const {
    mode,
    speed,
    setSpeed,
    brightness,
    setBrightness,
    direction,
    setDirection,
  } = useStore();
  const meta = MODES.find((m) => m.id === mode)!;

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent">
      <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1} mb="lg">
        Adjustments
      </Text>

      <Stack gap="xl">
        <Stack gap={6}>
          <Group gap={6}>
            <IconBulb size={16} />
            <Text size="sm" fw={600}>
              Brightness
            </Text>
            <Text size="sm" c="predator" ml="auto" fw={700}>
              {brightness}%
            </Text>
          </Group>
          <Slider
            value={brightness}
            onChange={setBrightness}
            aria-label="Brightness"
            min={0}
            max={100}
            step={1}
            color="predator"
            marks={[
              { value: 0, label: "0" },
              { value: 50, label: "50" },
              { value: 100, label: "100" },
            ]}
          />
        </Stack>

        <Stack gap={6} opacity={meta.usesSpeed ? 1 : 0.4}>
          <Group gap={6}>
            <IconGauge size={16} />
            <Text size="sm" fw={600}>
              Animation speed
            </Text>
            <Text size="sm" c="predator" ml="auto" fw={700}>
              {speed === 0 ? "Static" : speed}
            </Text>
          </Group>
          <Slider
            value={speed}
            onChange={setSpeed}
            aria-label="Animation speed"
            disabled={!meta.usesSpeed}
            min={0}
            max={9}
            step={1}
            color="predator"
            marks={[
              { value: 0, label: "0" },
              { value: 5, label: "5" },
              { value: 9, label: "9" },
            ]}
          />
        </Stack>

        <Stack gap={8} opacity={meta.usesDirection ? 1 : 0.4}>
          <Text size="sm" fw={600}>
            Direction
          </Text>
          <SegmentedControl
            value={String(direction)}
            onChange={(v) => setDirection(Number(v))}
            aria-label="Direction"
            disabled={!meta.usesDirection}
            fullWidth
            color="predator"
            data={[
              {
                value: "1",
                label: (
                  <Group gap={6} justify="center">
                    <IconArrowLeft size={16} /> Right → Left
                  </Group>
                ),
              },
              {
                value: "2",
                label: (
                  <Group gap={6} justify="center">
                    Left → Right <IconArrowRight size={16} />
                  </Group>
                ),
              },
            ]}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
