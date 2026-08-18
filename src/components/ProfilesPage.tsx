import { useEffect, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { MODES, ProfileMeta } from "../types";
import { useStore } from "../store";
import { api } from "../api";
import { modeGradient } from "../lib/modeGradient";
import {
  IconExport,
  IconFile,
  IconImport,
  IconPlus,
  IconProfiles,
  IconTrash,
} from "./Icons";

/** "2 days ago" for anything recent, an absolute date beyond a week. */
function whenLabel(epochSeconds: number): string {
  if (!epochSeconds) return "unknown";
  const days = Math.floor((Date.now() / 1000 - epochSeconds) / 86400);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(epochSeconds * 1000).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The card's colour strip: whatever the mode tile shows for that mode, so a
 * saved Wave reads as a Wave instead of a stored RGB it never used. */
function strip(p: ProfileMeta): string {
  return modeGradient(p.mode, { r: p.red, g: p.green, b: p.blue });
}

export function ProfilesPage() {
  const s = useStore();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [overwriting, setOverwriting] = useState<string | null>(null);

  const fail = (e: unknown) => s.say(String(e), "bad");

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete]);

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (s.profiles.some((p) => p.name === trimmed) && overwriting !== trimmed) {
      setOverwriting(trimmed);
      s.say(`“${trimmed}” already exists — save again to replace it`, "bad");
      return;
    }
    try {
      await s.saveProfile(trimmed);
      s.say(`Profile “${trimmed}” saved from the current lighting`);
      setName("");
      setCreating(false);
      setOverwriting(null);
    } catch (e) {
      fail(e);
    }
  };

  const onImport = async () => {
    try {
      const picked = await open({
        multiple: false,
        filters: [{ name: "Profile", extensions: ["json"] }],
      });
      if (typeof picked !== "string") return;
      const imported = await api.importProfile(picked);
      await s.refreshProfiles();
      s.say(`Imported “${imported}”`);
    } catch (e) {
      fail(e);
    }
  };

  const onExport = async (p: string) => {
    try {
      const dest = await save({
        defaultPath: `${p}.json`,
        filters: [{ name: "Profile", extensions: ["json"] }],
      });
      if (!dest) return;
      await api.exportProfile(p, dest);
      s.say(`Exported “${p}”`);
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="page">
      <div className="page__head">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1>Profiles</h1>
          <p>Save and manage your keyboard lighting configurations.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none", paddingTop: 2 }}>
          <button type="button" className="btn btn--sm" onClick={onImport}>
            <IconImport size={13} />
            Import
          </button>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => setCreating((v) => !v)}
          >
            <IconPlus size={13} />
            Create Profile
          </button>
        </div>
      </div>

      {creating && (
        <div className="banner banner--info">
          <input
            autoFocus
            value={name}
            placeholder="Profile name"
            aria-label="New profile name"
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            style={{
              flex: 1,
              background: "var(--bg-field)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              padding: "8px 11px",
              color: "var(--fg)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button type="button" className="btn btn--sm btn--primary" disabled={!name.trim()} onClick={onCreate}>
            Save current lighting
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      )}

      <div className="page__body">
        {s.profiles.length === 0 ? (
          <div style={{ height: "100%", minHeight: 380, display: "flex" }}>
            <div className="empty" style={{ maxWidth: 360 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--fg-4)",
                }}
              >
                <IconProfiles size={23} />
              </div>
              <h2 style={{ fontSize: 17 }}>No profiles yet</h2>
              <p>Create your first keyboard lighting profile.</p>
              <div style={{ display: "flex", gap: 9, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCreating(true)}
                >
                  <IconPlus size={13} />
                  Create Profile
                </button>
                <button type="button" className="btn" onClick={onImport}>
                  Import Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(268px,1fr))",
                gap: 14,
              }}
            >
              {s.profiles.map((p) => {
                const modeName =
                  MODES.find((m) => m.id === p.mode)?.name ?? `Mode ${p.mode}`;
                return (
                  <div key={p.name} className="profile-card">
                    <div
                      aria-hidden
                      style={{ height: 5, background: strip(p) }}
                    />
                    <div
                      style={{
                        padding: "15px 16px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 13,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          wordBreak: "break-word",
                        }}
                      >
                        {p.name}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {[
                          ["Mode", modeName],
                          ["Brightness", `${p.brightness}%`],
                          ["Last modified", whenLabel(p.modified)],
                        ].map(([k, v]) => (
                          <div
                            key={k}
                            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
                          >
                            <span style={{ fontSize: 11.5, color: "var(--fg-5)" }}>{k}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--fg-2)" }}>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          paddingTop: 11,
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{
                            flex: 1,
                            padding: 7,
                            background: "rgba(240,18,18,0.12)",
                            borderColor: "rgba(240,18,18,0.28)",
                            color: "#ff6b6b",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                          title="Apply this profile to the keyboard"
                          onClick={() =>
                            s
                              .loadProfile(p.name)
                              .then(() => s.say(`Profile “${p.name}” loaded`))
                              .catch(fail)
                          }
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{ flex: 1, padding: 7, fontSize: 12 }}
                          title="Open in the editor without applying"
                          onClick={() =>
                            s
                              .editProfile(p.name)
                              .then(() => s.say(`Editing “${p.name}”`))
                              .catch(fail)
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{ width: 32, height: 31, padding: 0 }}
                          aria-label={`Export ${p.name}`}
                          title="Export"
                          onClick={() => onExport(p.name)}
                        >
                          <IconExport size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          style={{ width: 32, height: 31, padding: 0, color: "var(--fg-4)" }}
                          aria-label={`Delete ${p.name}`}
                          title="Delete"
                          onClick={() => setPendingDelete(p.name)}
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginTop: 18,
                padding: "11px 14px",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10,
                background: "var(--bg-sunken)",
                color: "var(--fg-6)",
              }}
            >
              <IconFile size={14} />
              <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                Profiles are stored as <code>facer_rgb.py</code>-compatible files in{" "}
                <code>{s.capabilities?.profiles_dir ?? "~/.config/predator"}</code> — import
                or export them freely.
              </span>
            </div>
          </>
        )}
      </div>

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete profile"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="card"
            style={{ width: 340, animation: "pop 160ms ease both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="card__title">Delete profile</span>
            <p style={{ margin: "10px 0 16px", fontSize: 13, color: "var(--fg-3)" }}>
              Delete “{pendingDelete}”? This can't be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className="btn btn--sm"
                autoFocus
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => {
                  const target = pendingDelete;
                  setPendingDelete(null);
                  s.deleteProfile(target)
                    .then(() => s.say(`Profile “${target}” deleted`, "bad"))
                    .catch(fail);
                }}
              >
                <IconTrash size={13} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
