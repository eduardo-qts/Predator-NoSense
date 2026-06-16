#!/usr/bin/env bash
# Predator NoSense - Quick Installer Script
# Usage: curl -sSL https://raw.githubusercontent.com/eduardo-qts/Predator-NoSense/main/setup.sh | bash

set -euo pipefail

# ---------------------------------------------------------------------------
#  Configuration
# ---------------------------------------------------------------------------
REPO_URL="https://github.com/eduardo-qts/Predator-NoSense.git"
RELEASES_API="https://api.github.com/repos/eduardo-qts/Predator-NoSense/releases/latest"
TOTAL_STEPS=6

# ---------------------------------------------------------------------------
#  Colors & styling (gracefully degrade when not a TTY or NO_COLOR is set)
# ---------------------------------------------------------------------------
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
    BOLD=$'\e[1m';   DIM=$'\e[2m';    RESET=$'\e[0m'
    RED=$'\e[38;5;196m';   GREEN=$'\e[38;5;82m';  YELLOW=$'\e[38;5;220m'
    CYAN=$'\e[38;5;51m';   BLUE=$'\e[38;5;39m';   MAGENTA=$'\e[38;5;201m'
    ORANGE=$'\e[38;5;208m'; GREY=$'\e[38;5;245m'
    HIDE_CURSOR=$'\e[?25l'; SHOW_CURSOR=$'\e[?25h'
else
    BOLD=''; DIM=''; RESET=''
    RED=''; GREEN=''; YELLOW=''; CYAN=''; BLUE=''; MAGENTA=''; ORANGE=''; GREY=''
    HIDE_CURSOR=''; SHOW_CURSOR=''
fi

CURRENT_STEP=0
LOG_FILE="$(mktemp)"

# ---------------------------------------------------------------------------
#  Cleanup & error handling
# ---------------------------------------------------------------------------
cleanup() {
    printf '%s' "$SHOW_CURSOR"
    [[ -n "${LOG_FILE:-}" && -f "$LOG_FILE" ]] && rm -f "$LOG_FILE"
    [[ -n "${TMP_DIR:-}" && -d "$TMP_DIR" ]] && rm -rf "$TMP_DIR"
}

fail() {
    printf '%s\n' "$SHOW_CURSOR"
    printf '%s\n' "  ${RED}${BOLD}✗ FATAL:${RESET} ${RED}$1${RESET}"
    if [[ -s "$LOG_FILE" ]]; then
        printf '%s\n' "  ${GREY}── last output ────────────────────────────────${RESET}"
        sed 's/^/  /' "$LOG_FILE" | tail -n 12
        printf '%s\n' "  ${GREY}───────────────────────────────────────────────${RESET}"
    fi
    exit 1
}

trap cleanup EXIT
trap 'fail "Installation interrupted."' INT TERM

# ---------------------------------------------------------------------------
#  ASCII art banner
# ---------------------------------------------------------------------------
banner() {
    clear 2>/dev/null || true
    printf '\n'
    # Predator logo
    cat <<'ART' | while IFS= read -r line; do printf '%s%s%s\n' "$RED" "$line" "$RESET"; done
                                   @@@@@@@@@@@@@@@
                               @@@@@   @@*  @@@  @@@@@
                            @  @@   @@@@@@@@@@@@@@   @@ @@
                            @@@  @@@@@@@@@@@@@@@@@@@   @@@
                       +@#@+@     @@@@@@@@@@@@@@@@@     @@@@ @
                      @   @@@   @@@@@@@@@@@@@@@@@@@@@@   @@@  @
                     @    @@    @@@@@@@@@@@@@@@@@@@@@@   @@    @@
                    @    @@@    @@@@@@@@@@@@@@@@@@@@@@    @@@   @
                   @  @@  @@    @@@@@@@@@@@@@@@@@@@@@@   @@   @  @
                   @ @@  @@@      @@@@@@@@@@@@@@@@@@     @@@@ @@ @@
                  @  @    @@@    @@@@@@@@@@@@@@@@@@@    @@@    @  @
                  @ @@  @  @@@    @@@@@@@@@@@@@@@@@    @@@  @= @@ @@
                 @@ @@ @@  @@@@@@   @@@@@@@@@@@@@@   @@@@@  @@  @ @@
                 @ %   @        @@@@ +@@@@@@@@@@ +@@@@       @  @+ @
                 @ @@  @ @@   @   @@@@@%@@@@@@@@@@@    @  @@ @  @@ %
                @@ @@ @@ @@   @@     @@@@@@@@@@@     #@   @@ @@ @@ @@
                @  @@ @@ @@  @@@@   @@  @@@@@@ @@   @@@@  @@ @@ @@ =@
                @  @@ @@ @+    @@@@ @@@@@   @@@@@ @@@@    #@ @@ @@  @
               @@ @@     @      @ @@ @@       @@ @@ @     #@    @@  @@
               @  @@  @@ @         @@  @     @  @@        @@ @@  @  @@
              @@  @@  @@ @-     @@@                @@     @@ @@  @@  @@
              @*  @+  @         @@                 @@        @@  @@  @@
             @@  @@  .@        @@@  @           @ -@@@     @ @@   @   @@
             @   @@  @@   @     @@ @@-@ @@@@@ @@@@ @@     @  @@   @@   @
            @   @@        @     @ @@   @@@@@@@@  @@ @     @  @@   @@   @@
           @    @@   @@   @      @@@             @@@     @@  @@    @.   @:
               @@    @@    @     @@               @@     @   @     @@    @
ART
    printf '\n'
    printf '%s%s' "$ORANGE" "$BOLD"
    cat <<'WORDMARK'
        ██████╗ ██████╗ ███████╗██████╗  █████╗ ████████╗ ██████╗ ██████╗
        ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
        ██████╔╝██████╔╝█████╗  ██║  ██║███████║   ██║   ██║   ██║██████╔╝
        ██╔═══╝ ██╔══██╗██╔══╝  ██║  ██║██╔══██║   ██║   ██║   ██║██╔══██╗
        ██║     ██║  ██║███████╗██████╔╝██║  ██║   ██║   ╚██████╔╝██║  ██║
        ╚═╝     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
WORDMARK
    printf '%s' "$RESET"
    printf '%s%s              N O   S E N S E   ·   RGB Keyboard Control%s\n' "$CYAN" "$BOLD" "$RESET"
    printf '%s        ────────────────────────────────────────────────────────%s\n\n' "$GREY" "$RESET"
}

# ---------------------------------------------------------------------------
#  Output helpers
# ---------------------------------------------------------------------------
step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    printf '\n%s%s[%d/%d]%s %s%s%s\n' \
        "$BOLD" "$CYAN" "$CURRENT_STEP" "$TOTAL_STEPS" "$RESET" "$BOLD" "$1" "$RESET"
}

info()  { printf '   %s•%s %s\n' "$BLUE"   "$RESET" "$1"; }
ok()    { printf '   %s✓%s %s\n' "$GREEN"  "$RESET" "$1"; }
warn()  { printf '   %s!%s %s%s%s\n' "$YELLOW" "$RESET" "$YELLOW" "$1" "$RESET"; }

# Run a command silently with an animated spinner. On failure, abort with log.
#   run_spin "Message" cmd arg1 arg2 ...
run_spin() {
    local msg="$1"; shift
    local frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local pid i=0 char

    : > "$LOG_FILE"
    ( "$@" >"$LOG_FILE" 2>&1 ) &
    pid=$!

    printf '%s' "$HIDE_CURSOR"
    while kill -0 "$pid" 2>/dev/null; do
        char="${frames:i++%${#frames}:1}"
        printf '\r   %s%s%s %s' "$MAGENTA" "$char" "$RESET" "$msg"
        sleep 0.08
    done
    printf '%s' "$SHOW_CURSOR"

    if wait "$pid"; then
        printf '\r   %s✓%s %s\033[K\n' "$GREEN" "$RESET" "$msg"
    else
        printf '\r   %s✗%s %s\033[K\n' "$RED" "$RESET" "$msg"
        fail "$msg"
    fi
}

# ---------------------------------------------------------------------------
#  Pre-flight checks
# ---------------------------------------------------------------------------
banner

step "Running pre-flight checks"

# Architecture
ARCH="$(uname -m)"
if [[ "$ARCH" != "x86_64" ]]; then
    fail "Predator NoSense requires an x86_64 system (detected: $ARCH)."
fi
ok "Architecture: ${BOLD}$ARCH${RESET}"

# OS detection
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS="${ID:-unknown}"
    LIKE="${ID_LIKE:-}"
else
    fail "Cannot read /etc/os-release — unsupported OS."
fi
ok "Distribution: ${BOLD}${PRETTY_NAME:-$OS}${RESET}"

# Resolve the package manager. We prefer matching the distro family, but fall
# back to whichever supported package manager is actually on PATH so that
# derivatives (Mint, Pop!_OS, EndeavourOS, Nobara, etc.) work transparently.
KVER="$(uname -r)"
PM=""
if   [[ "$OS" == "arch" || "$LIKE" == *"arch"* ]] || command -v pacman >/dev/null 2>&1; then
    PM="pacman"; PKG_TYPE="pkg.tar.zst"
elif [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$LIKE" == *"debian"* || "$LIKE" == *"ubuntu"* ]] || command -v apt-get >/dev/null 2>&1; then
    PM="apt"; PKG_TYPE="deb"
elif [[ "$OS" == "fedora" || "$LIKE" == *"fedora"* || "$LIKE" == *"rhel"* ]] || command -v dnf >/dev/null 2>&1; then
    PM="dnf"; PKG_TYPE="rpm"
elif [[ "$LIKE" == *"suse"* ]] || command -v zypper >/dev/null 2>&1; then
    PM="zypper"; PKG_TYPE="rpm"
fi

# The case/command-v order above can mis-rank on multi-PM systems; pin it to the
# distro family when we recognise one, regardless of what else is on PATH.
case "$OS" in
    arch|manjaro|endeavouros|cachyos|garuda)  PM="pacman"; PKG_TYPE="pkg.tar.zst" ;;
    ubuntu|debian|linuxmint|pop|elementary|zorin|kali|raspbian) PM="apt"; PKG_TYPE="deb" ;;
    fedora|rhel|centos|rocky|almalinux|nobara) PM="dnf"; PKG_TYPE="rpm" ;;
    opensuse*|sles|suse) PM="zypper"; PKG_TYPE="rpm" ;;
esac

if [[ -z "$PM" ]]; then
    fail "No supported package manager found (need apt, dnf, pacman or zypper). See BUILD.md for a manual install."
fi
ok "Package manager: ${BOLD}$PM${RESET} (app packages: .$PKG_TYPE)"

# Cache sudo credentials up front so spinners don't hide the password prompt.
if [[ $EUID -ne 0 ]]; then
    info "Administrator privileges are required."
    if [[ -r /dev/tty ]]; then
        sudo -v < /dev/tty || fail "Could not obtain sudo privileges."
    else
        sudo -v || fail "Could not obtain sudo privileges."
    fi
    # Keep the sudo timestamp alive during the long build steps.
    ( while kill -0 "$$" 2>/dev/null; do sudo -n true 2>/dev/null; sleep 50; done ) &
    SUDO_KEEPALIVE=$!
fi
ok "Privileges confirmed."

# ---------------------------------------------------------------------------
#  Install dependencies (rsync is required by install_service.sh)
# ---------------------------------------------------------------------------
step "Installing build dependencies"
case "$PM" in
    apt)
        run_spin "Updating package index" sudo apt-get update -qq
        run_spin "Installing curl git make gcc rsync jq + kernel headers" \
            sudo apt-get install -y curl git make gcc rsync jq "linux-headers-$KVER"
        INSTALL_CMD=(sudo apt-get install -y)
        ;;
    dnf)
        run_spin "Installing curl git make gcc rsync jq + kernel headers" \
            sudo dnf install -y curl git make gcc rsync jq "kernel-devel-$KVER"
        INSTALL_CMD=(sudo dnf install -y)
        ;;
    zypper)
        run_spin "Installing curl git make gcc rsync jq + kernel sources" \
            sudo zypper --non-interactive install curl git make gcc rsync jq kernel-default-devel
        INSTALL_CMD=(sudo zypper --non-interactive install)
        ;;
    pacman)
        # Arch's headers package depends on the running kernel flavour.
        case "$KVER" in
            *-lts)       HDR_PKG="linux-lts-headers" ;;
            *-zen)       HDR_PKG="linux-zen-headers" ;;
            *-hardened)  HDR_PKG="linux-hardened-headers" ;;
            *-cachyos*)  HDR_PKG="linux-cachyos-headers" ;;
            *)           HDR_PKG="linux-headers" ;;
        esac
        info "Detected kernel flavour → ${BOLD}$HDR_PKG${RESET}"
        run_spin "Installing base-devel git curl rsync jq + $HDR_PKG" \
            sudo pacman -S --needed --noconfirm base-devel git curl rsync jq "$HDR_PKG"
        INSTALL_CMD=(sudo pacman -U --noconfirm)
        ;;
esac

# Verify the kernel build tree exists — the #1 cause of module build failures
# (e.g. headers installed for a different kernel than the one you booted).
if [[ ! -d "/lib/modules/$KVER/build" ]]; then
    warn "Kernel build tree for '$KVER' not found at /lib/modules/$KVER/build."
    warn "You likely need to reboot into the kernel matching the headers just installed."
fi
ok "All dependencies present."

# ---------------------------------------------------------------------------
#  Clone repository
# ---------------------------------------------------------------------------
step "Fetching source code"
TMP_DIR="$(mktemp -d)"
run_spin "Cloning $REPO_URL" \
    git clone --depth 1 "$REPO_URL" "$TMP_DIR/Predator-NoSense"
cd "$TMP_DIR/Predator-NoSense/backend"
ok "Repository ready."

# ---------------------------------------------------------------------------
#  Build & install the kernel module service (init-system aware)
# ---------------------------------------------------------------------------
step "Building & installing the kernel module"
sudo chmod +x ./*.sh

# Detect the init system so the module survives reboots on the right manager.
if [[ -d /run/systemd/system ]]; then
    INIT="systemd"
elif command -v rc-service >/dev/null 2>&1 && { [[ -d /run/openrc ]] || command -v openrc >/dev/null 2>&1; }; then
    INIT="openrc"
else
    INIT="none"
fi
ok "Init system: ${BOLD}$INIT${RESET}"

info "Compiling the facer kernel module (this can take a moment)..."
case "$INIT" in
    systemd)
        run_spin "Installing turbo-fan systemd service & module" sudo ./install_service.sh
        SERVICE_HINT="systemctl start/stop turbo-fan"
        ;;
    openrc)
        run_spin "Installing turbo-fan OpenRC service & module" sudo ./install_openrc.sh
        SERVICE_HINT="rc-service turbo-fan start/stop"
        ;;
    none)
        warn "No systemd or OpenRC detected — installing the module for this boot only."
        info "It will NOT survive a reboot; load it again with backend/install.sh."
        run_spin "Building & loading the facer module" sudo ./install.sh
        SERVICE_HINT="re-run backend/install.sh after each reboot"
        ;;
esac
ok "Kernel module installed."

# ---------------------------------------------------------------------------
#  Download & install the desktop application
# ---------------------------------------------------------------------------
step "Installing the desktop application"
info "Querying GitHub for the latest release..."
LATEST_RELEASE_JSON="$(curl -fsSL "$RELEASES_API" || true)"
DOWNLOAD_URL="$(printf '%s' "$LATEST_RELEASE_JSON" \
    | jq -r ".assets[] | select(.name | endswith(\".$PKG_TYPE\")) | .browser_download_url" \
    | head -n 1)"

if [[ -z "$DOWNLOAD_URL" || "$DOWNLOAD_URL" == "null" ]]; then
    warn "No .$PKG_TYPE release asset was found on GitHub."
    info "The kernel module is installed, but the GUI app was skipped."
    info "Publish a release with built packages, or build it manually (see BUILD.md)."
    APP_INSTALLED=false
else
    run_spin "Downloading application package" \
        curl -fL "$DOWNLOAD_URL" -o "$TMP_DIR/app.$PKG_TYPE"
    run_spin "Installing Predator NoSense" "${INSTALL_CMD[@]}" "$TMP_DIR/app.$PKG_TYPE"
    ok "Application installed."
    APP_INSTALLED=true
fi

# ---------------------------------------------------------------------------
#  Done
# ---------------------------------------------------------------------------
step "Finishing up"
ok "Cleanup complete."

printf '\n%s%s  ╔════════════════════════════════════════════════════════╗%s\n' "$GREEN" "$BOLD" "$RESET"
printf '%s%s  ║              INSTALLATION COMPLETE!  🎉                 ║%s\n'  "$GREEN" "$BOLD" "$RESET"
printf '%s%s  ╚════════════════════════════════════════════════════════╝%s\n\n' "$GREEN" "$BOLD" "$RESET"

if [[ "${APP_INSTALLED:-false}" == "true" ]]; then
    printf '   %s➜%s Launch %s%sPredator NoSense%s from your application menu.\n' \
        "$CYAN" "$RESET" "$BOLD" "$ORANGE" "$RESET"
else
    printf '   %s➜%s The kernel module is active. Build the GUI per %sBUILD.md%s.\n' \
        "$CYAN" "$RESET" "$BOLD" "$RESET"
fi
printf '   %s➜%s Manage the service: %s%s%s.\n' \
    "$CYAN" "$RESET" "$DIM" "${SERVICE_HINT:-systemctl start/stop turbo-fan}" "$RESET"
printf '\n   %sEnjoy the glow. %s⚡%s\n\n' "$MAGENTA" "$YELLOW" "$RESET"
