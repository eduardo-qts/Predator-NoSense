import { getCurrentWindow } from "@tauri-apps/api/window";
import { IconClose, IconMaximize, IconMinimize } from "./Icons";
import mark from "../assets/predator-mark.png";

export function TitleBar({ version }: { version: string }) {
  const appWindow = getCurrentWindow();

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div
        data-tauri-drag-region
        style={{ display: "flex", alignItems: "center", gap: 9 }}
      >
        <img src={mark} alt="" style={{ width: 17, height: 17, opacity: 0.85 }} />
        <span
          data-tauri-drag-region
          style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.005em" }}
        >
          Predator NoSense
        </span>
        {version && (
          <span className="mono" style={{ fontSize: 10, color: "var(--fg-6)" }}>
            {version}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          className="win-btn"
          aria-label="Minimize"
          onClick={() => appWindow.minimize()}
        >
          <IconMinimize />
        </button>
        <button
          type="button"
          className="win-btn"
          aria-label="Maximize"
          onClick={() => appWindow.toggleMaximize()}
        >
          <IconMaximize />
        </button>
        <button
          type="button"
          className="win-btn win-btn--close"
          aria-label="Close"
          onClick={() => appWindow.close()}
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
