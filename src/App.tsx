import { useEffect } from "react";
import {
  Alert,
  AppShell,
  Box,
  Button,
  Grid,
  Group,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { IconAlertTriangle, IconDownload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useStore } from "./store";
import { api } from "./api";
import { Header } from "./components/Header";
import { KeyboardPreview } from "./components/KeyboardPreview";
import { ModeSelector } from "./components/ModeSelector";
import { ColorControls } from "./components/ColorControls";
import { EffectControls } from "./components/EffectControls";
import { ProfilesPanel } from "./components/ProfilesPanel";

export default function App() {
  const { init, capabilities, update, dismissUpdate } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const noDevice =
    capabilities && !(capabilities.dynamic_device && capabilities.static_device);

  const onUpdate = async () => {
    try {
      await api.runUpdate();
      notifications.show({
        color: "predator",
        message: "Installer launched in a terminal — follow the prompts.",
      });
      dismissUpdate();
    } catch (e) {
      notifications.show({ color: "red", title: "Update failed", message: String(e) });
    }
  };

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
              {update && (
                <Alert
                  mb="lg"
                  color="predator"
                  variant="light"
                  icon={<IconDownload size={18} />}
                  title={`Update available — ${update.latest}`}
                  withCloseButton
                  onClose={dismissUpdate}
                >
                  <Stack gap="sm">
                    <span>
                      You're on {update.current}. A newer version is available.
                    </span>
                    <Group gap="sm">
                      <Button
                        size="xs"
                        leftSection={<IconDownload size={14} />}
                        onClick={onUpdate}
                      >
                        Update now
                      </Button>
                      <Button size="xs" variant="default" onClick={dismissUpdate}>
                        Later
                      </Button>
                    </Group>
                  </Stack>
                </Alert>
              )}
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
