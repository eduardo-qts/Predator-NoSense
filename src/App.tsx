import { useEffect } from "react";
import {
  Alert,
  AppShell,
  Box,
  Grid,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { KeyboardPreview } from "./components/KeyboardPreview";
import { ModeSelector } from "./components/ModeSelector";
import { ColorControls } from "./components/ColorControls";
import { EffectControls } from "./components/EffectControls";
import { ProfilesPanel } from "./components/ProfilesPanel";

export default function App() {
  const { init, capabilities } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const noDevice =
    capabilities && !(capabilities.dynamic_device && capabilities.static_device);

  return (
    <AppShell header={{ height: 76 }} padding={0}>
      <AppShell.Header
        style={{
          background: "rgba(10,9,11,0.78)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(240,18,18,0.18)",
        }}
      >
        <Header />
        <div className="rgb-strip" />
      </AppShell.Header>

      <AppShell.Main>
        <ScrollArea h="calc(100vh - 76px)" type="auto">
          <Box
            p="xl"
            style={{ position: "relative", zIndex: 1, minHeight: "100%" }}
          >
            <div aria-live="polite" role="status">
              {noDevice && (
                <Alert
                  mb="lg"
                  color="red"
                  variant="light"
                  icon={<IconAlertTriangle size={18} />}
                  title="Keyboard device not found"
                >
                  The character devices <code>/dev/acer-gkbbl-0</code> /{" "}
                  <code>/dev/acer-gkbbl-static-0</code> are missing. Load the{" "}
                  <code>facer</code> kernel module (see the project README) and
                  reopen the app.
                </Alert>
              )}
            </div>

            <Stack gap="lg" style={{ position: "relative", zIndex: 1 }}>
              <KeyboardPreview />

              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack gap="lg">
                    <ModeSelector />
                    <ColorControls />
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Stack gap="lg">
                    <EffectControls />
                    <ProfilesPanel />
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Box>
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}
