import type { Page } from "../types";
import { useStore } from "../store";
import { deviceStatus } from "../lib/status";
import { Dot } from "./primitives";
import { IconInfo, IconKeyboard, IconProfiles, IconSettings } from "./Icons";
import mark from "../assets/predator-mark.png";

const NAV: { id: Page; label: string; icon: JSX.Element }[] = [
  { id: "keyboard", label: "Keyboard", icon: <IconKeyboard /> },
  { id: "profiles", label: "Profiles", icon: <IconProfiles /> },
  { id: "settings", label: "Settings", icon: <IconSettings /> },
  { id: "about", label: "About", icon: <IconInfo /> },
];

export function Sidebar({ version }: { version: string }) {
  const { page, setPage, capabilities } = useStore();
  const status = deviceStatus(capabilities);

  return (
    <nav className="sidebar" aria-label="Sections">
      <div className="sidebar__brand">
        <img src={mark} alt="" style={{ width: 30, height: 30 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Predator NoSense
          </span>
          <span
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--fg-6)",
            }}
          >
            RGB Control
          </span>
        </div>
      </div>

      <div className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className="nav__item"
            aria-current={page === n.id ? "page" : undefined}
            onClick={() => setPage(n.id)}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: "0 12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div className="status-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dot color={status.color} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-2)" }}>
              {status.label}
            </span>
          </div>
          <span
            className="mono"
            style={{ fontSize: 9.5, color: "var(--fg-6)", paddingLeft: 16 }}
          >
            {status.detail}
          </span>
        </div>
        <div
          className="mono"
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 3px",
            fontSize: 9.5,
            color: "var(--fg-7)",
          }}
        >
          <span>{version || "—"}</span>
          <span>GPL-3.0</span>
        </div>
      </div>
    </nav>
  );
}
