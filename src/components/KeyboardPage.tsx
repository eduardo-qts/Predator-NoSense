import { MODES, Mode, RGB } from "../types";
import { useStore, ZONE_INDICES } from "../store";
import { deviceStatus } from "../lib/status";
import { toHex } from "../lib/color";
import { modeGradient } from "../lib/modeGradient";
import { KeyboardPreview } from "./KeyboardPreview";
import { ColorPicker } from "./ColorPicker";
import { Dot, Slider, Swatch } from "./primitives";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconInfo,
  IconKeyboard,
  IconRefresh,
  IconSpinner,
  IconWarning,
  IconBreath,
  IconNeon,
  IconShifting,
  IconStatic,
  IconWave,
  IconZoom,
} from "./Icons";

const MODE_ICON: Record<Mode, JSX.Element> = {
  [Mode.Static]: <IconStatic />,
  [Mode.Breath]: <IconBreath />,
  [Mode.Neon]: <IconNeon />,
  [Mode.Wave]: <IconWave />,
  [Mode.Shifting]: <IconShifting />,
  [Mode.Zoom]: <IconZoom />,
};

function DriverDown({ detail }: { detail: string }) {
  const { checkDriver, setPage, capabilities } = useStore();
  const rows: [string, boolean][] = [
    ["/dev/acer-gkbbl-0", !!capabilities?.dynamic_device],
    ["/dev/acer-gkbbl-static-0", !!capabilities?.static_device],
  ];
  return (
    <div style={{ flex: 1, display: "flex", padding: "0 28px 40px" }}>
      <div className="empty">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(240,160,32,0.1)",
            border: "1px solid rgba(240,160,32,0.25)",
            color: "var(--amber)",
          }}
        >
          <IconWarning size={24} />
        </div>
        <h2>Driver unavailable</h2>
        <p>
          Predator NoSense couldn't communicate with the keyboard driver — {detail}.
          The <code>facer</code> kernel module doesn't appear to be loaded.
        </p>
        <div
          style={{
            width: "100%",
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "12px 14px",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            background: "#13161a",
            textAlign: "left",
          }}
        >
          {rows.map(([path, ok]) => (
            <div
              key={path}
              className="mono"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 10.5,
              }}
            >
              <span style={{ color: "var(--fg-4)" }}>{path}</span>
              <span style={{ color: ok ? "var(--green)" : "var(--amber)" }}>
                {ok ? "present" : "not found"}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 6 }}>
          <button type="button" className="btn btn--primary" onClick={checkDriver}>
            <IconRefresh size={13} />
            Check Driver
          </button>
          <button type="button" className="btn" onClick={() => setPage("settings")}>
            Open Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export function KeyboardPage() {
  const s = useStore();
  const status = deviceStatus(s.capabilities);
  const meta = MODES.find((m) => m.id === s.mode)!;
  const isStatic = s.mode === Mode.Static;

  const activeColor: RGB =
    s.picker >= 1 && s.picker <= 4 ? s.zoneColors[s.picker - 1] : s.color;

  const onApply = () => {
    s.apply()
      .then(() => s.say("Lighting applied to the keyboard"))
      .catch((e) => s.say(String(e), "bad"));
  };

  const pillColor = status.ready ? "var(--green)" : "var(--amber)";

  // Editing paints every selected zone, so the picker must name all of them.
  const zonesEdited = [...s.selectedZones].sort((a, b) => a - b);
  const pickerTitle =
    s.picker === 5
      ? "Effect color"
      : zonesEdited.length > 1
      ? `Zones ${zonesEdited.join(", ")} color`
      : `Zone ${s.picker} color`;

  return (
    <div className="page">
      <div className="page__head">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <h1>Keyboard Lighting</h1>
          <p>Customize your keyboard lighting and create your own lighting profiles.</p>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flex: "none", paddingTop: 3 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 10px",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              background: "#13161a",
              color: "var(--fg-4)",
            }}
          >
            <IconKeyboard size={13} />
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
              Acer Predator Keyboard · 4-Zone RGB
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 11px",
              borderRadius: 20,
              border: `1px solid ${pillColor}47`,
              background: `${pillColor}14`,
              color: pillColor,
            }}
          >
            <Dot color={status.color} />
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>{status.label}</span>
          </div>
        </div>
      </div>

      {s.lastError && (
        <div className="banner banner--error">
          <span style={{ color: "#ff5a5a", flex: "none", display: "flex" }}>
            <IconWarning size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#ffd0d0" }}>
              Couldn't write the lighting change
            </span>
            <span style={{ fontSize: 11.5, color: "#c48b8b" }}>{s.lastError}</span>
          </div>
          <button type="button" className="btn btn--sm" onClick={onApply}>
            Try again
          </button>
        </div>
      )}

      {!status.ready ? (
        <DriverDown detail={status.detail} />
      ) : (
        <>
          <div className="page__body">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              {/* ---- left column ---- */}
              <div
                style={{
                  flex: "1 1 520px",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div className="card">
                  <div className="card__head">
                    <span className="eyebrow">Live preview · 4 zones</span>
                    <span style={{ fontSize: 11.5, color: "var(--fg-5)" }}>
                      {isStatic
                        ? "Select zones to change their color"
                        : `${meta.name} lights all four zones together`}
                    </span>
                  </div>

                  {isStatic && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4,1fr)",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      {ZONE_INDICES.map((z) => (
                        <button
                          key={z}
                          type="button"
                          className="tile"
                          aria-pressed={s.selectedZones.includes(z)}
                          aria-label={`Zone ${z}`}
                          onClick={() => s.toggleZone(z)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            padding: 6,
                            borderRadius: 7,
                          }}
                        >
                          <Swatch color={s.zoneColors[z - 1]} size={12} />
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--fg-2)" }}>
                            Zone {z}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <KeyboardPreview />
                </div>

                <div className="card" style={{ position: "relative" }}>
                  <div className="card__head">
                    <span className="card__title">
                      {isStatic || !meta.usesColor ? "Zone Colors" : "Effect Color"}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--fg-5)" }}>
                      {isStatic ? "Click a zone to open the picker" : ""}
                    </span>
                  </div>

                  {isStatic && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                      {ZONE_INDICES.map((z) => (
                        <button
                          key={z}
                          type="button"
                          className="tile"
                          aria-pressed={s.selectedZones.includes(z)}
                          aria-label={`Zone ${z} color`}
                          onClick={() => s.toggleZone(z)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                            padding: "11px 12px",
                          }}
                        >
                          <Swatch color={s.zoneColors[z - 1]} size={26} />
                          <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Zone {z}</span>
                            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)" }}>
                              {toHex(s.zoneColors[z - 1])}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isStatic && meta.usesColor && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        type="button"
                        className="tile"
                        aria-pressed={s.picker === 5}
                        onClick={() => s.openPicker(5)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          padding: "11px 14px",
                          width: 266,
                        }}
                      >
                        <Swatch color={s.color} size={26} />
                        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Effect color</span>
                          <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)" }}>
                            {toHex(s.color)}
                          </span>
                        </span>
                      </button>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--fg-5)", flex: 1 }}>
                        {meta.description}
                      </p>
                    </div>
                  )}

                  {!meta.usesColor && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 14px",
                        borderRadius: 9,
                        border: "1px dashed rgba(255,255,255,0.09)",
                        background: "#13161a",
                      }}
                    >
                      <div
                        style={{
                          width: 96,
                          height: 8,
                          borderRadius: 4,
                          flex: "none",
                          opacity: 0.8,
                          background:
                            "linear-gradient(90deg,#ff004d,#ff8a00,#ffe600,#00e676,#00b0ff,#7c4dff)",
                        }}
                      />
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-3)" }}>
                        {meta.description} Zone colors are driven by the effect, so there
                        is nothing to pick here.
                      </p>
                    </div>
                  )}

                  {s.picker > 0 && (
                    <ColorPicker
                      key={s.picker}
                      title={pickerTitle}
                      color={activeColor}
                      anchor={s.picker === 5 ? 0 : (s.picker - 1) / 4}
                      onChange={s.setActiveColor}
                      onClose={() => s.openPicker(0)}
                    />
                  )}
                </div>
              </div>

              {/* ---- right column ---- */}
              <div
                style={{
                  flex: "1 1 340px",
                  minWidth: 0,
                  maxWidth: 372,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div className="card">
                  <div className="card__head">
                    <span className="card__title">Lighting Mode</span>
                    <span
                      className="eyebrow"
                      style={{ letterSpacing: "0.1em", fontSize: 9.5 }}
                    >
                      {meta.name}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="tile"
                        aria-pressed={m.id === s.mode}
                        aria-label={`${m.name} mode`}
                        title={m.description}
                        onClick={() => s.setMode(m.id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 9,
                          padding: "11px 10px 10px",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "var(--fg-3)",
                          }}
                        >
                          {MODE_ICON[m.id]}
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}>
                            {m.name}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          style={{
                            height: 5,
                            borderRadius: 2,
                            background: modeGradient(m.id),
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card__head" style={{ marginBottom: 14 }}>
                    <span className="card__title">Brightness</span>
                    <span className="mono" style={{ fontSize: 11.5 }}>
                      {s.brightness}%
                    </span>
                  </div>
                  <Slider
                    label="Brightness"
                    value={s.brightness}
                    min={0}
                    max={100}
                    onChange={s.setBrightness}
                  />
                </div>

                {meta.usesSpeed && (
                  <div className="card" style={{ animation: "fadeUp 200ms ease both" }}>
                    <div className="card__head" style={{ marginBottom: 14 }}>
                      <span className="card__title">Animation Speed</span>
                      <span className="mono" style={{ fontSize: 11.5 }}>
                        {s.speed} / 10
                      </span>
                    </div>
                    <Slider
                      label="Animation speed"
                      value={s.speed}
                      min={1}
                      max={10}
                      onChange={s.setSpeed}
                    />

                    {meta.usesDirection && (
                      <div
                        style={{
                          marginTop: 18,
                          paddingTop: 15,
                          borderTop: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <span className="card__title">Direction</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[
                            { d: 1, label: "Left", icon: <IconArrowLeft size={13} /> },
                            { d: 2, label: "Right", icon: <IconArrowRight size={13} /> },
                          ].map(({ d, label, icon }) => (
                            <button
                              key={d}
                              type="button"
                              className="tile"
                              aria-pressed={s.direction === d}
                              onClick={() => s.setDirection(d)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 11px",
                                borderRadius: 7,
                                color: "var(--fg-3)",
                              }}
                            >
                              {d === 1 && icon}
                              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>
                                {label}
                              </span>
                              {d === 2 && icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "0 4px" }}>
                  <span style={{ color: "var(--fg-7)", flex: "none", marginTop: 1, display: "flex" }}>
                    <IconInfo size={13} />
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      lineHeight: 1.5,
                      color: "var(--fg-6)",
                      textWrap: "pretty",
                    }}
                  >
                    {s.autoApply
                      ? `Live preview is on — changes are written to the keyboard ${s.debounceMs} ms after you stop editing.`
                      : "Changes are previewed here only. Press Apply Changes to write them to the keyboard."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <Dot color={s.dirty ? "var(--amber)" : "var(--green)"} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-2)" }}>
                {s.dirty
                  ? "Changes pending"
                  : s.autoApply
                  ? "Live preview · synced"
                  : "All changes applied"}
              </span>
              {s.dirty && (
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-6)" }}>
                  {s.autoApply
                    ? `writing in ${s.debounceMs} ms`
                    : "not written to the keyboard yet"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
              <button type="button" className="btn" onClick={s.reset}>
                <IconRefresh size={13} />
                Reset
              </button>
              <button
                type="button"
                className={`btn ${s.applyState === "done" ? "btn--done" : "btn--primary"}`}
                disabled={s.applyState === "busy"}
                onClick={onApply}
              >
                {s.applyState === "busy" ? (
                  <IconSpinner size={13} />
                ) : s.applyState === "done" ? (
                  <IconCheck size={13} />
                ) : (
                  <IconBolt size={13} />
                )}
                <span>
                  {s.applyState === "busy"
                    ? "Applying…"
                    : s.applyState === "done"
                    ? "Applied"
                    : "Apply Changes"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
