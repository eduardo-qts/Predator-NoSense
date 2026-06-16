# Predator NoSense — Architecture & Decision Record

> Status: accepted · Scope: **RGB keyboard control only** (decision by maintainer)

This document is the analysis done **before** any code was written: inventory of the
existing backend, mapping of hardware communication, the alternatives considered for
each major decision, and the justification for what was chosen.

> Note: Predator NoSense is a standalone repository. The backend it drives —
> the `facer` kernel module, its install scripts and `facer_rgb.py` — is **vendored
> unmodified** under [`backend/`](../backend/) from the upstream project by Jafar
> Akhondali (GPL-3.0), so a clean checkout works on its own. Predator NoSense
> only invokes `facer_rgb.py`; it does not modify the driver. See `CREDITS.md`.

---

## 1. Backend inventory — what already exists

The upstream project is an unofficial Acer kernel module (`facer.ko`, built from
`facer.c`) plus Python/Bash userspace helpers. Predator NoSense is a **new client** of
the interfaces that module exposes — it does not modify the driver.

### 1.1 RGB keyboard (fully supported, used by this GUI)

The kernel module registers two character devices:

| Device | Payload | Purpose |
|--------|---------|---------|
| `/dev/acer-gkbbl-0` | 16 bytes | Dynamic effects: mode, speed, brightness, direction, RGB |
| `/dev/acer-gkbbl-static-0` | 4 bytes | Per-zone static color (zone bitmask + RGB) |

On the maintainer's hardware these are mode `0666` (**world-writable → no root needed**).

The canonical userspace client is **`facer_rgb.py`** (repo root). It is the single source
of truth for:

- The exact byte layout written to each device (see `facer_rgb.py:170-206`).
- The 6 effect modes: `0 Static · 1 Breath · 2 Neon · 3 Wave · 4 Shifting · 5 Zoom`.
- Parameters: `-m` mode, `-z` zone(1-4), `-s` speed(0-9), `-b` brightness(0-100),
  `-d` direction(1=R→L, 2=L→R), `-cR/-cG/-cB` color.
- **Profiles**: `-save NAME`, `-load NAME`, `-list`, stored as JSON in
  `~/.config/predator/saved profiles/`.

`keyboard.py` is an interactive TUI wrapper around the same logic — not used by the GUI.

### 1.2 Other capabilities found in `facer.c` (NOT used — see §4)

`src/facer.c` contains WMI plumbing for fan-speed reading (`hwmon`), CPU/GPU temperature
sensors, `platform_profile` (quiet/balanced/performance), and internal fan-mode calls.
These are **out of scope** for this GUI per the maintainer's decision, and several are not
even advertised on the maintainer's PHN16-71 (empty `platform_profile`, no `acer` hwmon —
see §4). They are documented here only so future contributors know they exist.

---

## 2. Hardware communication map (what the GUI drives)

```
┌────────────────────┐   Tauri IPC    ┌─────────────────────┐   process spawn   ┌──────────────┐   write()    ┌────────────────────┐
│  React UI (webview)│ ─────────────▶ │ Rust commands       │ ────────────────▶ │ facer_rgb.py │ ───────────▶ │ /dev/acer-gkbbl-*  │
│  Mantine + Zustand │ ◀───────────── │ (backend.rs)        │ ◀──────────────── │  (existing)  │   (kernel)   │  char devices       │
└────────────────────┘   results      └─────────────────────┘   stdout/stderr   └──────────────┘              └────────────────────┘
```

The **abstraction layer** is `src-tauri/src/backend.rs`: it builds `facer_rgb.py` argument
vectors, locates the interpreter + script, runs them, and surfaces structured errors to the
UI. Profile list/save/load are delegated straight to `facer_rgb.py`.

---

## 3. Decisions

### D1 — Reuse `facer_rgb.py` instead of re-implementing the protocol in Rust

**Alternatives**

- **(A) Shell out to `facer_rgb.py`** ✅ chosen. The Rust layer constructs CLI args and runs
  the existing script.
- **(B) Re-implement the 16-/4-byte payload writer in Rust.** Self-contained binary, no
  Python at runtime, but duplicates protocol logic that already exists.

**Justification.** The maintainer explicitly required *"create an abstraction layer to
communicate with the existing backend"* and *"avoid rewriting already-implemented
functionality."* `facer_rgb.py` already owns the byte layout **and** the profile format;
re-implementing risks silent divergence if the protocol ever changes. `python3` is
universally present on Linux desktops (3.14 here). The script is bundled as a Tauri
resource so the app stays installable as one package. The Rust boundary is thin enough that
switching to option (B) later is localized to `backend.rs`.

### D2 — Stack: Tauri v1 + React + TS + Mantine + Zustand

- **Tauri v1** (not v2): only `webkit2gtk-4.0` is present; Tauri v2 needs `webkit2gtk-4.1`.
  v1 avoids requiring a `sudo` system-package install. (Upgrade path documented in BUILD.md.)
- **Mantine** for the component library + native dark theme; **Zustand** for state.
- **Recharts dropped**: it was requested for monitoring graphs; the RGB-only scope has no
  time-series to chart, so adding it would be dead weight.

### D3 — Privilege model

Char devices are `0666` here → the GUI writes with no elevation. For hardware where the
devices are root-only, `backend.rs` supports a `pkexec` fallback (a udev rule is the
recommended permanent fix, documented in BUILD.md). No setuid binaries are introduced.

### D4 — Scope: RGB only

Per maintainer decision, fan RPM, performance profiles, manual fan control, fan curves, and
per-key RGB are **excluded** (not implemented in the backend and/or absent on this hardware).
Nothing in the existing project is removed or disabled.

---

## 4. Live capability probe (maintainer's machine, for the record)

Model **Acer Predator PHN16-71**, module `facer` loaded:

| Capability | Status | Source |
|------------|--------|--------|
| RGB char devices | ✅ present, `0666` | `/dev/acer-gkbbl-0`, `-static-0` |
| `platform_profile` | ❌ empty | `/sys/firmware/acpi/platform_profile` |
| `acer` hwmon / fan RPM | ❌ absent | no `fan*_input` |
| CPU temp | ✅ | `coretemp` hwmon |
| GPU temp | ✅ | `nvidia-smi` (RTX 4060 Mobile) |

These confirm the RGB-only scope is the honest, fully-functional subset on this laptop.
