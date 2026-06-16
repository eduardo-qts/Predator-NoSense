# Predator NoSense — Build & Install

A modern, dark-themed desktop app (Tauri + React + TypeScript) for controlling
the 4-zone RGB keyboard backlight of Acer Predator / Helios / Nitro laptops on
Linux. It is a GUI client for the **`facer` kernel module** and the bundled
**`facer_rgb.py`** backend (see [CREDITS.md](CREDITS.md)).

> Scope: **RGB keyboard only**. See `docs/ARCHITECTURE.md` for why fan/thermal
> features are out of scope and for all architectural decisions.

## Prerequisites

1. **The `facer` kernel module must be installed and loaded.** The driver is
   vendored in [`backend/`](backend/) — install your kernel headers, then:
   ```bash
   cd backend && chmod +x ./*.sh
   sudo ./install.sh            # load once, or ./install_service.sh to persist
   ls -l /dev/acer-gkbbl-0 /dev/acer-gkbbl-static-0   # verify
   ```
   See [`backend/README.md`](backend/README.md) for details.

2. **Toolchains**
   - Rust (stable): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Node.js 18+ and npm
   - System libs (Tauri v1):
     - **Arch**: `sudo pacman -S --needed webkit2gtk base-devel curl wget openssl appmenu-gtk-module libappindicator-gtk3 librsvg`
     - **Debian/Ubuntu**: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
   - `python3` at runtime (used by the bundled `facer_rgb.py`).

## Develop

```bash
npm install
npm run tauri:dev        # hot-reload dev window
```

## Build distributable packages

```bash
npm install
npm run tauri:build
```

Artifacts land in `src-tauri/target/release/`:

| Format   | Path |
|----------|------|
| Binary   | `src-tauri/target/release/predator-no-sense` (~3.4 MB) |
| Debian   | `bundle/deb/predator-no-sense_1.0.0_amd64.deb` |
| RPM      | `bundle/rpm/predator-no-sense-1.0.0-1.x86_64.rpm` |

Each package installs the binary to `/usr/bin/predator-no-sense`, a `.desktop`
entry (so it appears in your application menu), hicolor icons, and `facer_rgb.py`
as a bundled resource at `/usr/lib/predator-no-sense/resources/` — no terminal
needed to run it afterwards.

### Install a package

```bash
# Debian/Ubuntu
sudo apt install ./bundle/deb/predator-no-sense_1.0.0_amd64.deb
# Fedora/openSUSE
sudo rpm -i ./bundle/rpm/predator-no-sense-1.0.0-1.x86_64.rpm
```

Then launch **Predator NoSense** from your application menu.

### AppImage (optional)

AppImage is **not** built by default because its bundler downloads the
`linuxdeploy` tooling at build time, which fails on offline/restricted machines.
To produce one where network access is available, add `"appimage"` back to
`tauri > bundle > targets` in `src-tauri/tauri.conf.json` and rebuild; the result
lands in `bundle/appimage/`.

## Permissions

On most supported hardware the kernel module exposes the devices as `0666`, so
the app writes directly with no elevation. If your devices come up root-only,
either:

- install the provided udev rule (recommended, permanent):
  ```bash
  sudo cp packaging/99-acer-gkbbl.rules /etc/udev/rules.d/
  sudo udevadm control --reload-rules && sudo udevadm trigger
  sudo usermod -aG input "$USER"   # then re-login
  ```
- or do nothing — the app automatically retries via `pkexec` (polkit prompt).

## Troubleshooting

### Blank/gray window

If the window opens but stays blank/gray, this is almost always a WebKitGTK
rendering issue in your compositor/driver stack, not the app (the same engine
also backs other GTK apps). On Wayland compositors keeping them up to date helps;
you can also try launching under XWayland: `GDK_BACKEND=x11 predator-no-sense`.

## How it talks to the hardware

```
React UI ──IPC──▶ Rust (backend.rs) ──spawns──▶ facer_rgb.py ──write()──▶ /dev/acer-gkbbl-*
```

Overrides (useful for packaging/testing):

- `PREDATOR_FACER_RGB` — absolute path to `facer_rgb.py`
- `PREDATOR_PYTHON` — python interpreter to use (default `python3`)
