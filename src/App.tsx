import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useStore } from "./store";
import { api } from "./api";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { KeyboardPage } from "./components/KeyboardPage";
import { ProfilesPage } from "./components/ProfilesPage";
import { SettingsPage } from "./components/SettingsPage";
import { AboutPage } from "./components/AboutPage";
import { Dot } from "./components/primitives";
import { IconClose, IconExport } from "./components/Icons";

export default function App() {
  const { init, page, toast, clearToast, update, dismissUpdate, say } = useStore();
  const [version, setVersion] = useState("");

  useEffect(() => {
    init();
    getVersion()
      .then((v) => setVersion(`v${v}`))
      .catch(() => {});
  }, [init]);

  const onUpdate = async () => {
    try {
      await api.runUpdate();
      say("Installer launched in a terminal — follow the prompts.");
      dismissUpdate();
    } catch (e) {
      say(String(e), "bad");
    }
  };

  return (
    <div className="shell">
      <TitleBar version={version} />

      <div className="body">
        <Sidebar version={version} />

        <div className="page">
          {update && (
            <div className="banner banner--info" style={{ margin: "16px 28px 0" }}>
              <span style={{ color: "var(--red)", flex: "none", display: "flex" }}>
                <IconExport size={16} />
              </span>
              <div
                style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                  Update available — {update.latest}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                  You're on {update.current}. A newer version is available.
                </span>
              </div>
              <button type="button" className="btn btn--sm btn--primary" onClick={onUpdate}>
                Update now
              </button>
              <button
                type="button"
                className="win-btn"
                aria-label="Dismiss update notice"
                onClick={dismissUpdate}
              >
                <IconClose size={11} />
              </button>
            </div>
          )}

          {page === "keyboard" && <KeyboardPage />}
          {page === "profiles" && <ProfilesPage />}
          {page === "settings" && <SettingsPage />}
          {page === "about" && <AboutPage version={version} />}
        </div>
      </div>

      {toast && (
        <div className="toast" role="status" onClick={clearToast}>
          <Dot color={toast.kind === "bad" ? "var(--red)" : "var(--green)"} />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
