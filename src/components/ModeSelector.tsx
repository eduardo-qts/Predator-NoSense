import { Paper, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  IconSquareFilled,
  IconActivityHeartbeat,
  IconRainbow,
  IconWaveSine,
  IconArrowsShuffle,
  IconZoomScan,
} from "@tabler/icons-react";
import { MODES, Mode } from "../types";
import { useStore } from "../store";

const ICONS: Record<Mode, React.ReactNode> = {
  [Mode.Static]: <IconSquareFilled size={22} />,
  [Mode.Breath]: <IconActivityHeartbeat size={22} />,
  [Mode.Neon]: <IconRainbow size={22} />,
  [Mode.Wave]: <IconWaveSine size={22} />,
  [Mode.Shifting]: <IconArrowsShuffle size={22} />,
  [Mode.Zoom]: <IconZoomScan size={22} />,
};

export function ModeSelector() {
  const { mode, setMode } = useStore();

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent">
      <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1} mb="md">
        Lighting mode
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <UnstyledButton
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              aria-label={`${m.name} mode`}
              style={{
                borderRadius: 12,
                padding: "14px 12px",
                border: active
                  ? "1px solid var(--mantine-color-predator-6)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? "linear-gradient(180deg, rgba(240,18,18,0.18), rgba(240,18,18,0.04))"
                  : "rgba(255,255,255,0.02)",
                boxShadow: active ? "0 0 22px rgba(240,18,18,0.25)" : "none",
                transition:
                  "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
              }}
            >
              <Stack gap={6} align="center">
                <span
                  style={{
                    color: active
                      ? "var(--mantine-color-predator-5)"
                      : "var(--mantine-color-steel-4)",
                  }}
                >
                  {ICONS[m.id]}
                </span>
                <Text fw={600} size="sm" ta="center">
                  {m.name}
                </Text>
                <Text size="10px" c="dimmed" ta="center" lh={1.2}>
                  {m.description}
                </Text>
              </Stack>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}
