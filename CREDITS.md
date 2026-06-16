# Credits & Attribution

**Predator NoSense** is a graphical front end. It does **not** talk to the
hardware itself — all low-level communication is done by the existing
**acer-predator-turbo-and-rgb-keyboard-linux-module** project.

## Upstream backend (the part that does the real work)

- **Project:** acer-predator-turbo-and-rgb-keyboard-linux-module
- **Author:** Jafar Akhondali ([@JafarAkhondali](https://github.com/JafarAkhondali)) and contributors
- **Repository:** https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module
- **License:** GNU General Public License v3.0

The entire [`backend/`](backend/) folder of this repository is **vendored
unmodified** from that project so Predator NoSense works from a clean checkout:

- the `facer` **kernel module** (`backend/src/facer.c`, `Makefile`, `dkms.conf`),
  which exposes the keyboard character devices `/dev/acer-gkbbl-0` and
  `/dev/acer-gkbbl-static-0`;
- its **install/uninstall scripts** (`install.sh`, `install_service.sh`,
  `install_openrc.sh`, `uninstall*.sh`, `refresh.sh`);
- the **`facer_rgb.py`** CLI, which writes the effect payloads to the device and is
  the only component Predator NoSense invokes;
- the optional `keyboard.py` interactive menu.

Predator NoSense itself only builds the correct `facer_rgb.py` command line and runs
it (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), decision D1). All credit for
the reverse-engineering, the kernel driver and the CLI belongs to the upstream
authors.

The upstream README explicitly asks downstream projects to credit it — this file,
the README, the GPL-3.0 `LICENSE`, and the in-app "Connected" status that relies on
the upstream kernel module are that acknowledgement. 🙏

## This GUI

- **Predator NoSense** GUI — Eduardo Quirino ([@eduardo-qts](https://github.com/eduardo-qts))
- Built with Tauri, React, TypeScript, Mantine and Zustand.

## License

Because it bundles and depends on GPL-3.0 code, **Predator NoSense is released
under the GNU General Public License v3.0** as well. See [`LICENSE`](LICENSE).
