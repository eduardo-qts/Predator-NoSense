import { IconGitHub } from "./Icons";
import mark from "../assets/predator-mark.png";

const REPO = "https://github.com/eduardo-qts/Predator-NoSense";

export function AboutPage({ version }: { version: string }) {
  return (
    <div
      className="page"
      style={{ overflow: "auto", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <img src={mark} alt="Predator NoSense" style={{ width: 74, height: 74 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Predator NoSense
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--fg-3)",
              textWrap: "pretty",
            }}
          >
            RGB keyboard control for supported Acer Predator, Helios and Nitro laptops.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          {[version ? `Version ${version}` : "Version —", "GPL-3.0"].map((t) => (
            <span
              key={t}
              className="mono"
              style={{
                fontSize: 10.5,
                color: "var(--fg-3)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "4px 11px",
                background: "#13161a",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className="card"
          style={{
            width: "100%",
            marginTop: 12,
            padding: 17,
            display: "flex",
            flexDirection: "column",
            gap: 11,
            textAlign: "left",
          }}
        >
          <span className="eyebrow">Credits</span>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "var(--fg-3)",
              textWrap: "pretty",
            }}
          >
            The <code>facer</code> kernel module and <code>facer_rgb.py</code> are the
            work of{" "}
            <strong style={{ fontWeight: 600, color: "var(--fg-2)" }}>Jafar Akhondali</strong>{" "}
            and the contributors of the{" "}
            <em style={{ fontStyle: "normal", color: "var(--fg-2)" }}>
              acer-predator-turbo-and-rgb-keyboard-linux-module
            </em>{" "}
            project. Predator NoSense is a graphical front end for that work, and is
            released under the same GPL-3.0 license.
          </p>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: "var(--fg-5)" }}>
            GUI by Eduardo Quirino.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 9,
            marginTop: 4,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a className="btn" href={REPO} target="_blank" rel="noreferrer">
            <IconGitHub size={14} />
            GitHub
          </a>
          <a
            className="btn"
            href={`${REPO}/blob/main/docs/ARCHITECTURE.md`}
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
          <a className="btn" href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            License
          </a>
        </div>
      </div>
    </div>
  );
}
