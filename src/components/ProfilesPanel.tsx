import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDeviceFloppy,
  IconDownload,
  IconFileImport,
  IconTrash,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { open, save } from "@tauri-apps/api/dialog";
import { useStore } from "../store";
import { api } from "../api";

export function ProfilesPanel() {
  const { profiles, saveProfile, loadProfile, deleteProfile, refreshProfiles } =
    useStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const notifyErr = (e: unknown) =>
    notifications.show({ color: "red", title: "Error", message: String(e) });

  const onSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await saveProfile(name.trim());
      notifications.show({ color: "predator", message: `Saved & applied “${name}”` });
      setName("");
    } catch (e) {
      notifyErr(e);
    } finally {
      setBusy(false);
    }
  };

  const onLoad = async (p: string) => {
    try {
      await loadProfile(p);
      notifications.show({ color: "predator", message: `Applied “${p}”` });
    } catch (e) {
      notifyErr(e);
    }
  };

  const onDelete = async (p: string) => {
    try {
      await deleteProfile(p);
      notifications.show({ color: "predator", message: `Deleted “${p}”` });
    } catch (e) {
      notifyErr(e);
    } finally {
      setPendingDelete(null);
    }
  };

  const onImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Profile", extensions: ["json"] }],
      });
      if (typeof selected === "string") {
        const imported = await api.importProfile(selected);
        await refreshProfiles();
        notifications.show({ color: "predator", message: `Imported “${imported}”` });
      }
    } catch (e) {
      notifyErr(e);
    }
  };

  const onExport = async (p: string) => {
    try {
      const dest = await save({
        defaultPath: `${p}.json`,
        filters: [{ name: "Profile", extensions: ["json"] }],
      });
      if (dest) {
        await api.exportProfile(p, dest);
        notifications.show({ color: "predator", message: `Exported “${p}”` });
      }
    } catch (e) {
      notifyErr(e);
    }
  };

  return (
    <Paper p="lg" radius="lg" className="fade-in clip-accent" h="100%">
      <Group justify="space-between" mb="md">
        <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1}>
          Profiles
        </Text>
        <Tooltip label="Import profile (.json)">
          <ActionIcon variant="subtle" onClick={onImport} aria-label="Import">
            <IconFileImport size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="xs" mb="md" wrap="nowrap">
        <TextInput
          placeholder="New profile name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          style={{ flex: 1 }}
          size="sm"
        />
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={onSave}
          loading={busy}
          disabled={!name.trim()}
          size="sm"
        >
          Save
        </Button>
      </Group>

      <ScrollArea h={220} type="auto">
        <Stack gap={6}>
          {profiles.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="lg">
              No saved profiles yet.
            </Text>
          )}
          {profiles.map((p) => (
            <Group
              key={p}
              justify="space-between"
              wrap="nowrap"
              px="sm"
              py={6}
              style={{
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Text size="sm" truncate>
                {p}
              </Text>
              <Group gap={2} wrap="nowrap">
                <Tooltip label="Apply">
                  <ActionIcon
                    variant="subtle"
                    color="predator"
                    aria-label={`Apply profile ${p}`}
                    onClick={() => onLoad(p)}
                  >
                    <IconPlayerPlay size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Export">
                  <ActionIcon
                    variant="subtle"
                    aria-label={`Export profile ${p}`}
                    onClick={() => onExport(p)}
                  >
                    <IconDownload size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Delete profile ${p}`}
                    onClick={() => setPendingDelete(p)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      <Modal
        opened={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete profile"
        centered
        radius="lg"
      >
        <Text size="sm" mb="lg">
          Delete the profile “{pendingDelete}”? This can’t be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => pendingDelete && onDelete(pendingDelete)}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
}
