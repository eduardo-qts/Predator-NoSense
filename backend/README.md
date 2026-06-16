# backend/ — Acer RGB kernel driver (vendored)

Everything in this folder is **vendored unmodified** from the upstream project:

- **acer-predator-turbo-and-rgb-keyboard-linux-module**
- by Jafar Akhondali and contributors — <https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module>
- licensed under **GPL-3.0**

It is included so Predator NoSense works from a clean checkout. All credit for the
driver and the reverse-engineering belongs to the upstream authors — see
`../CREDITS.md`.

## What's here

| File | Purpose |
|------|---------|
| `src/facer.c`, `Makefile`, `dkms.conf` | the **`facer` kernel module** — creates `/dev/acer-gkbbl-0` and `/dev/acer-gkbbl-static-0` |
| `install.sh` | build + load the module once (does not survive reboot) |
| `install_service.sh` | install as a **systemd** service (survives reboot) |
| `install_openrc.sh` | install as an **OpenRC** service |
| `uninstall.sh` / `uninstall_service.sh` | remove them |
| `refresh.sh` | rebuild/reload after a kernel update |
| `facer_rgb.py` | the CLI that writes RGB payloads to the device (**invoked by the GUI**) |
| `keyboard.py` | optional interactive CLI menu (the GUI does not use it) |

## Install the kernel module (required once, from a clean machine)

Install your distro's kernel headers + build tools first:

- **Debian/Ubuntu:** `sudo apt-get install linux-headers-$(uname -r) gcc make`
- **Arch:** `sudo pacman -S linux-headers`

Then, from this folder:

```bash
cd backend
chmod +x ./*.sh

# Option A — load once (gone after reboot):
sudo ./install.sh

# Option B — persist across reboots (systemd):
sudo ./install_service.sh
# (OpenRC systems: sudo ./install_openrc.sh)
```

Verify the devices appeared:

```bash
ls -l /dev/acer-gkbbl-0 /dev/acer-gkbbl-static-0
```

Now launch **Predator NoSense** — it talks to these devices through `facer_rgb.py`.

> Compatibility, secure-boot signing and troubleshooting for the driver itself are
> documented in the upstream README (link above). To update the vendored driver,
> copy newer files over the ones here.
