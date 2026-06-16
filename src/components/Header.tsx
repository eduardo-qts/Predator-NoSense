import { ActionIcon, Badge, Button, Group, Switch, Text, Tooltip } from "@mantine/core";
import { IconBolt, IconMinus, IconSquare, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "../store";
import logoIcon from "../assets/logo-icon.png";

const appWindow = getCurrentWindow();

export function Header() {
  const { capabilities, autoApply, setAutoApply, apply, applying } = useStore();

  const ready =
    capabilities?.dynamic_device && capabilities?.static_device && capabilities?.python_ok;

  const onApply = async () => {
    try {
      await apply();
      notifications.show({ color: "predator", message: "Applied to keyboard" });
    } catch (e) {
      notifications.show({ color: "red", title: "Apply failed", message: String(e) });
    }
  };

  return (
    <Group
      data-tauri-drag-region
      justify="space-between"
      px="xl"
      py="md"
      wrap="nowrap"
      h="100%"
    >
      <Group data-tauri-drag-region gap="sm" wrap="nowrap">
        <img
          src={logoIcon}
          alt="Predator NoSense"
          width={44}
          height={44}
          style={{
            borderRadius: 10,
            objectFit: "cover",
            boxShadow: "0 0 18px rgba(240,18,18,0.4)",
          }}
        />
        <div>
          <Text className="brand-mark" size="lg" lh={1} translate="no">
            <span className="brand-pred">PREDATOR</span>{" "}
            <span className="brand-nosense">NOSENSE</span>
          </Text>
          <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: 1.5 }}>
            Acer Keyboard RGB Control
          </Text>
        </div>
      </Group>

      <Group gap="md" wrap="nowrap">
        <Tooltip
          multiline
          w={280}
          label={
            ready
              ? `Connected · ${capabilities?.writable ? "writable" : "needs elevation"}`
              : "Keyboard device not detected. Is the facer kernel module loaded?"
          }
        >
          <Badge
            size="lg"
            variant="dot"
            color={ready ? (capabilities?.writable ? "predator" : "yellow") : "red"}
          >
            {ready ? (capabilities?.writable ? "Connected" : "Read-only") : "No device"}
          </Badge>
        </Tooltip>

        <Switch
          checked={autoApply}
          onChange={(e) => setAutoApply(e.currentTarget.checked)}
          label="Auto-apply"
          size="sm"
          color="predator"
        />

        <Button
          leftSection={<IconBolt size={18} />}
          onClick={onApply}
          loading={applying}
          disabled={!ready}
          variant="gradient"
          gradient={{ from: "#f01212", to: "#ff4d2d", deg: 135 }}
        >
          Apply
        </Button>

        <Group gap={4} wrap="nowrap" ml="xs">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Minimize"
            onClick={() => appWindow.minimize()}
          >
            <IconMinus size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Maximize"
            onClick={() => appWindow.toggleMaximize()}
          >
            <IconSquare size={15} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            aria-label="Close"
            onClick={() => appWindow.close()}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Group>
  );
}
