import { useStore } from "../store";
import { deviceStatus } from "../lib/status";
import { Dot, Slider, Toggle } from "./primitives";
import { IconGitHub, IconRefresh } from "./Icons";

const REPO = "https://github.com/eduardo-qts/Predator-NoSense";
const DRIVER_REPO =
  "https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module";

export function SettingsPage() {
  const s = useStore();
  const status = deviceStatus(s.capabilities);

  const onToggleBoot = (v: boolean) => {
    s.setAutostart(v)
      .then(() =>
        s.say(v ? "Will restore your lighting on every boot" : "Boot restore disabled")
      )
      .catch((e) => s.say(String(e), "bad"));
  };

  const devices: [string, boolean][] = [
    ["/dev/acer-gkbbl-0", !!s.capabilities?.dynamic_device],
    ["/dev/acer-gkbbl-static-0", !!s.capabilities?.static_device],
  ];

  return (
    <div className="page">
      <div className="page__head" style={{ flexDirection: "column", gap: 6 }}>
        <h1>Settings</h1>
        <p>Application behaviour, keyboard driver status and credits.</p>
      </div>

      <div className="page__body" style={{ paddingBottom: 28 }}>
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 26 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span className="eyebrow">Application</span>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="setting-row">
                <div className="setting-row__label">
                  <span>Launch on system startup</span>
                  <span>Restore the current lighting on every boot.</span>
                </div>
                <Toggle
                  checked={s.autostart}
                  onChange={onToggleBoot}
                  label="Launch on system startup"
                />
              </div>

              <div className="setting-row">
                <div className="setting-row__label">
                  <span>Enable live preview</span>
                  <span>
                    Write changes to the keyboard as you edit, without pressing Apply.
                  </span>
                </div>
                <Toggle
                  checked={s.autoApply}
                  label="Enable live preview"
                  onChange={(v) => {
                    s.setAutoApply(v);
                    s.say(v ? "Live preview enabled" : "Live preview disabled");
                  }}
                />
              </div>

              <div className="setting-row" style={{ gap: 24 }}>
                <div className="setting-row__label">
                  <span style={{ color: s.autoApply ? "var(--fg)" : "var(--fg-5)" }}>
                    Preview debounce
                  </span>
                  <span>
                    How long to wait after the last change before writing to the driver.
                  </span>
                </div>
                <div
                  style={{
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: 230,
                  }}
                >
                  <Slider
                    label="Preview debounce"
                    value={s.debounceMs}
                    min={60}
                    max={500}
                    step={10}
                    disabled={!s.autoApply}
                    onChange={s.setDebounceMs}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      color: "var(--fg-2)",
                      width: 62,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.debounceMs} ms
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span className="eyebrow">Keyboard</span>
            <div
              className="card"
              style={{ padding: 17, display: "flex", flexDirection: "column", gap: 13 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                {[
                  { title: "Keyboard status", label: status.label, color: status.color },
                  {
                    title: "Driver status",
                    label: status.ready ? "facer module loaded" : "facer module not loaded",
                    color: status.ready ? "var(--green)" : "var(--amber)",
                  },
                ].map((box) => (
                  <div
                    key={box.title}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      padding: "12px 13px",
                      borderRadius: 9,
                      background: "var(--bg-inset)",
                      border: "1px solid rgba(255,255,255,0.045)",
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: "var(--fg-5)" }}>{box.title}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Dot color={box.color} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{box.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  border: "1px solid rgba(255,255,255,0.045)",
                  borderRadius: 9,
                  overflow: "hidden",
                }}
              >
                {devices.map(([path, ok], i) => (
                  <div
                    key={path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "11px 13px",
                      background: "var(--bg-sunken)",
                      borderTop: i ? "1px solid rgba(255,255,255,0.045)" : undefined,
                    }}
                  >
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                      {path}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, color: ok ? "var(--green)" : "var(--amber)" }}
                    >
                      {ok ? (s.capabilities?.writable ? "present · writable" : "present · root-only") : "not found"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button type="button" className="btn btn--sm" onClick={s.checkDriver}>
                  <IconRefresh size={13} />
                  Check Driver
                </button>
                <span style={{ fontSize: 11.5, color: "var(--fg-6)" }}>
                  Re-runs detection without restarting the app.
                </span>
              </div>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span className="eyebrow">About Driver</span>
            <div
              className="card"
              style={{ padding: 17, display: "flex", flexDirection: "column", gap: 13 }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "var(--fg-3)",
                  textWrap: "pretty",
                }}
              >
                Predator NoSense does not talk to the hardware itself. All low-level
                communication is done by the <code>facer</code> kernel module and its{" "}
                <code>facer_rgb.py</code> CLI, from the{" "}
                <em style={{ fontStyle: "normal", color: "var(--fg-2)" }}>
                  acer-predator-turbo-and-rgb-keyboard-linux-module
                </em>{" "}
                project by Jafar Akhondali and contributors. The app only builds the
                correct command line and runs it.
              </p>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <a className="btn btn--sm" href={DRIVER_REPO} target="_blank" rel="noreferrer">
                  <IconGitHub size={13} />
                  Driver repository
                </a>
                <a
                  className="btn btn--sm"
                  href={`${REPO}/blob/main/docs/ARCHITECTURE.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Architecture notes
                </a>
                <a
                  className="btn btn--sm"
                  href={`${REPO}/blob/main/CREDITS.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Credits
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
