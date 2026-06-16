# Predator NoSense

A modern Linux desktop application for controlling the **4-zone RGB keyboard backlight** found in supported Acer Predator, Helios, and Nitro laptops.

Predator NoSense provides a user-friendly graphical interface for the **facer** kernel module from the *acer-predator-turbo-and-rgb-keyboard-linux-module* project by Jafar Akhondali. See [CREDITS.md](CREDITS.md) for attribution details.

![Predator NoSense](assets/Predator_NoSense.png)

## Quick Installation

Install Predator NoSense and the required keyboard driver automatically:

```bash
curl -sSL https://raw.githubusercontent.com/eduardo-qts/Predator-NoSense/main/setup.sh | bash
```

The installer will:

* Install required dependencies
* Build and install the `facer` kernel module
* Configure automatic loading on boot
* Install Predator NoSense

After installation, launch the application from your desktop environment's application menu.

---

## Features

* Support for 4-zone RGB keyboards
* Six lighting modes:

  * Static
  * Breathing
  * Neon
  * Wave
  * Shifting
  * Zoom
* Per-zone color customization
* Interactive keyboard preview
* Advanced color picker (RGB and HEX)
* Brightness control
* Animation speed control
* Animation direction control
* Automatic live preview with debounce
* Manual apply button
* Profile management:

  * Save
  * Load
  * Delete
  * Import
  * Export
* Compatible with `facer_rgb.py` profile files
* Native Linux packaging (`.deb` and `.rpm`)
* Desktop integration with application menu entry and icon

---

## How It Works

Predator NoSense is a graphical frontend for the **facer** kernel module.

The application communicates with the keyboard through the devices exposed by the driver:

```text
/dev/acer-gkbbl-0
/dev/acer-gkbbl-static-0
```

The underlying driver is included in the `backend/` directory and originates from the upstream project:

https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module

For a detailed explanation of the architecture and driver limitations, see:

* [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
* [backend/README.md](backend/README.md)

---

## Requirements

Predator NoSense requires:

* Linux
* Python 3
* Kernel headers
* The `facer` kernel module

If you prefer a manual installation, see the documentation in:

```text
backend/README.md
```

---

## Development

### Running Locally

Clone the repository:

```bash
git clone https://github.com/eduardo-qts/Predator-NoSense.git

cd Predator-NoSense
```

Install dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm run tauri:dev
```

### Building

Create installable packages:

```bash
npm run tauri:build
```

Generated packages will be available under:

```text
src-tauri/target/release/bundle/
```

Including:

* `.deb`
* `.rpm`

---

## Technology Stack

* Tauri v1
* React
* TypeScript
* Mantine v7
* Zustand
* Rust

---

## Scope

Predator NoSense focuses exclusively on RGB keyboard control.

The following features are intentionally out of scope:

* Fan speed control
* Performance profiles
* Manual fan control
* Overclocking
* Per-key RGB control

These capabilities are not exposed by the supported hardware or the underlying driver.

---

## Credits

Full credit for the `facer` kernel module and `facer_rgb.py` belongs to Jafar Akhondali and contributors of the original project.

See:

* [CREDITS.md](CREDITS.md)
* [LICENSE](LICENSE)

---

## License

GPL-3.0
