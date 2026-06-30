//! Abstraction layer over the existing `facer_rgb.py` backend.
//!
//! This module is the *only* place that knows how the GUI talks to the hardware.
//! It does NOT re-implement the device protocol — it builds argument vectors for
//! the canonical `facer_rgb.py` client (which owns the byte layout and the profile
//! format) and runs it, surfacing structured errors back to the UI.
//!
//! See gui/docs/ARCHITECTURE.md (decision D1) for the rationale.

use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

const DYNAMIC_DEVICE: &str = "/dev/acer-gkbbl-0";
const STATIC_DEVICE: &str = "/dev/acer-gkbbl-static-0";

// Boot-persistence: a user-owned script re-applies the last choice, and a tiny
// systemd unit runs it once per boot (after the kernel module is loaded).
const SERVICE_NAME: &str = "predator-nosense-rgb.service";
const SERVICE_DEST: &str = "/etc/systemd/system/predator-nosense-rgb.service";

// Self-update against GitHub releases.
const RELEASES_API: &str =
    "https://api.github.com/repos/eduardo-qts/Predator-NoSense/releases/latest";
const INSTALL_CMD: &str =
    "curl -sSL https://raw.githubusercontent.com/eduardo-qts/Predator-NoSense/main/setup.sh | bash";

/// A keyboard effect configuration, mirroring `facer_rgb.py` CLI parameters.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectConfig {
    /// 0 Static · 1 Breath · 2 Neon · 3 Wave · 4 Shifting · 5 Zoom
    pub mode: u8,
    /// Animation speed 0..9
    pub speed: u8,
    /// Backlight brightness 0..100
    pub brightness: u8,
    /// Animation direction: 1 = Right→Left, 2 = Left→Right
    pub direction: u8,
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}

/// One zone of the 4-zone static layout.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneColor {
    /// 1..4, left to right
    pub zone: u8,
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}

/// Profile JSON written by `facer_rgb.py -save` (kept byte-compatible).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileConfig {
    pub mode: u8,
    #[serde(default = "default_zone")]
    pub zone: u8,
    pub speed: u8,
    pub brightness: u8,
    pub direction: u8,
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}

fn default_zone() -> u8 {
    1
}

/// Runtime capability report, so the UI can degrade gracefully.
#[derive(Debug, Clone, Serialize)]
pub struct Capabilities {
    pub dynamic_device: bool,
    pub static_device: bool,
    pub writable: bool,
    pub python_ok: bool,
    pub script_path: String,
    pub profiles_dir: String,
}

// ---------------------------------------------------------------------------
// Locating the interpreter, the script and the profiles directory
// ---------------------------------------------------------------------------

fn python_bin() -> String {
    std::env::var("PREDATOR_PYTHON").unwrap_or_else(|_| "python3".to_string())
}

/// Find `facer_rgb.py`, in priority order:
/// 1. `$PREDATOR_FACER_RGB` override
/// 2. bundled Tauri resource
/// 3. dev/source fallbacks relative to the executable and cwd
fn resolve_script(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("PREDATOR_FACER_RGB") {
        let pb = PathBuf::from(p);
        if pb.is_file() {
            return Ok(pb);
        }
    }

    if let Ok(res) = app
        .path()
        .resolve("resources/facer_rgb.py", BaseDirectory::Resource)
    {
        if res.is_file() {
            return Ok(res);
        }
    }

    // Dev fallbacks: the canonical script lives in the repo's backend/ folder.
    // In `tauri dev` the binary runs from src-tauri/target/<profile>/ and the cwd
    // is the project root, so check both repo-root- and exe-relative locations.
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join("facer_rgb.py"));
            candidates.push(dir.join("../../../backend/facer_rgb.py"));
            // Production install fallback. Tauri's runtime resolves resources to
            // `/usr/lib/{productName}` (e.g. `/usr/lib/Predator NoSense`), but the
            // deb/rpm/pacman bundlers install them under the sanitized package name
            // (`/usr/lib/predator-no-sense`). When that mismatch hides the bundled
            // resource, look it up directly relative to the executable's `bin` dir.
            candidates.push(dir.join("../lib/predator-no-sense/resources/facer_rgb.py"));
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("backend/facer_rgb.py"));
        candidates.push(cwd.join("../backend/facer_rgb.py"));
        candidates.push(cwd.join("facer_rgb.py"));
    }
    for c in candidates {
        if c.is_file() {
            return Ok(c);
        }
    }

    Err("Could not locate facer_rgb.py (set $PREDATOR_FACER_RGB to its path).".into())
}

fn config_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
    Path::new(&home).join(".config/predator")
}

fn profiles_dir() -> PathBuf {
    config_dir().join("saved profiles")
}

fn autostart_script_path() -> PathBuf {
    config_dir().join("autostart.sh")
}

/// Absolute python path so the systemd unit (minimal PATH) can find it.
fn python_abs() -> String {
    let bin = python_bin();
    if bin.starts_with('/') {
        return bin;
    }
    which(&bin).map(|p| p.to_string_lossy().into()).unwrap_or(bin)
}

// ---------------------------------------------------------------------------
// Running facer_rgb.py
// ---------------------------------------------------------------------------

/// Run `facer_rgb.py` with the given args. On a permission error writing to the
/// char device, retry once via `pkexec` (for hardware where the devices are
/// root-only). Returns stdout on success.
fn run_facer(script: &Path, args: &[String]) -> Result<String, String> {
    let out = Command::new(python_bin())
        .arg(script)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to launch python3: {e}"))?;

    if out.status.success() {
        return Ok(String::from_utf8_lossy(&out.stdout).to_string());
    }

    let stderr = String::from_utf8_lossy(&out.stderr).to_string();

    // Permission denied on the device -> retry elevated via pkexec.
    if stderr.contains("Permission denied") || stderr.contains("PermissionError") {
        if let Ok(pk) = which("pkexec") {
            let elevated = Command::new(pk)
                .arg(python_bin())
                .arg(script)
                .args(args)
                .output()
                .map_err(|e| format!("pkexec failed to launch: {e}"))?;
            if elevated.status.success() {
                return Ok(String::from_utf8_lossy(&elevated.stdout).to_string());
            }
            return Err(format!(
                "Elevated apply failed: {}",
                String::from_utf8_lossy(&elevated.stderr)
            ));
        }
        return Err(format!(
            "Permission denied writing to the keyboard device. \
             Install the udev rule (see BUILD.md) or install pkexec. ({stderr})"
        ));
    }

    Err(format!("facer_rgb.py failed: {stderr}"))
}

fn which(bin: &str) -> Result<PathBuf, String> {
    let path = std::env::var("PATH").unwrap_or_default();
    for dir in path.split(':') {
        let p = Path::new(dir).join(bin);
        if p.is_file() {
            return Ok(p);
        }
    }
    Err(format!("{bin} not found in PATH"))
}

fn color_args(cfg_red: u8, cfg_green: u8, cfg_blue: u8) -> Vec<String> {
    vec![
        "-cR".into(),
        cfg_red.to_string(),
        "-cG".into(),
        cfg_green.to_string(),
        "-cB".into(),
        cfg_blue.to_string(),
    ]
}

/// facer_rgb.py argv for a dynamic effect / uniform static color.
fn effect_args(c: &EffectConfig) -> Vec<String> {
    let mut a = vec![
        "-m".into(),
        c.mode.to_string(),
        "-s".into(),
        c.speed.to_string(),
        "-b".into(),
        c.brightness.to_string(),
        "-d".into(),
        c.direction.to_string(),
    ];
    a.extend(color_args(c.red, c.green, c.blue));
    a
}

/// facer_rgb.py argv for one static zone.
fn static_zone_args(z: &ZoneColor, brightness: u8) -> Vec<String> {
    let mut a = vec![
        "-m".into(),
        "0".into(),
        "-z".into(),
        z.zone.to_string(),
        "-b".into(),
        brightness.to_string(),
    ];
    a.extend(color_args(z.red, z.green, z.blue));
    a
}

/// Write `autostart.sh` so each boot re-runs exactly what the app just applied.
/// `arg_sets` is one facer_rgb.py invocation per line (static mode needs 4).
// ponytail: paths assumed quote-free; a HOME with a literal `'` would break this.
fn write_autostart_script(script: &Path, arg_sets: &[Vec<String>]) -> Result<(), String> {
    let path = autostart_script_path();
    std::fs::create_dir_all(config_dir())
        .map_err(|e| format!("Cannot create config dir: {e}"))?;
    let py = python_abs();
    let mut body =
        String::from("#!/bin/bash\n# Generated by Predator NoSense - restores keyboard RGB on boot.\n");
    for args in arg_sets {
        body.push_str(&format!("'{}' '{}' {}\n", py, script.display(), args.join(" ")));
    }
    std::fs::write(&path, body).map_err(|e| format!("Cannot write boot script: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Tauri commands (the UI-facing API)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_capabilities(app: AppHandle) -> Capabilities {
    let dynamic = Path::new(DYNAMIC_DEVICE).exists();
    let static_dev = Path::new(STATIC_DEVICE).exists();

    // Probe writability without actually changing anything.
    let writable = std::fs::OpenOptions::new()
        .write(true)
        .open(DYNAMIC_DEVICE)
        .is_ok();

    let python_ok = Command::new(python_bin())
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    let script_path = resolve_script(&app)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    Capabilities {
        dynamic_device: dynamic,
        static_device: static_dev,
        writable,
        python_ok,
        script_path,
        profiles_dir: profiles_dir().to_string_lossy().to_string(),
    }
}

/// Apply a dynamic effect (modes 1..5) or a uniform static color (mode 0 + zone).
#[tauri::command]
pub fn apply_effect(app: AppHandle, config: EffectConfig) -> Result<(), String> {
    let script = resolve_script(&app)?;
    run_facer(&script, &effect_args(&config)).map(|_| ())
}

/// Apply per-zone static colors. Writes each zone in turn (mode 0), then sets the
/// shared brightness. Mirrors how `facer_rgb.py -m 0` works per call.
#[tauri::command]
pub fn apply_static_zones(
    app: AppHandle,
    zones: Vec<ZoneColor>,
    brightness: u8,
) -> Result<(), String> {
    let script = resolve_script(&app)?;
    for z in &zones {
        run_facer(&script, &static_zone_args(z, brightness))?;
    }
    Ok(())
}

/// List saved profile names (delegates to `facer_rgb.py -list`).
#[tauri::command]
pub fn list_profiles(app: AppHandle) -> Result<Vec<String>, String> {
    let script = resolve_script(&app)?;
    let out = run_facer(&script, &["-list".to_string()])?;
    let names = out
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && *l != "Saved profiles:")
        .map(|l| l.to_string())
        .collect();
    Ok(names)
}

/// Apply an effect AND save it under `name` (single `facer_rgb.py` call with -save).
#[tauri::command]
pub fn save_profile(app: AppHandle, name: String, config: EffectConfig) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Profile name cannot be empty.".into());
    }
    let script = resolve_script(&app)?;
    let mut args = effect_args(&config);
    args.push("-save".into());
    args.push(name);
    run_facer(&script, &args).map(|_| ())
}

/// Apply a saved profile (`facer_rgb.py -load`) and return its config for the UI.
#[tauri::command]
pub fn load_profile(app: AppHandle, name: String) -> Result<ProfileConfig, String> {
    let script = resolve_script(&app)?;
    run_facer(&script, &["-load".to_string(), name.clone()])?;
    read_profile(app, name)
}

/// Read a profile's JSON (for previewing in the UI) without applying it.
#[tauri::command]
pub fn read_profile(_app: AppHandle, name: String) -> Result<ProfileConfig, String> {
    let path = profiles_dir().join(format!("{name}.json"));
    let data = std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read profile '{name}': {e}"))?;
    serde_json::from_str(&data).map_err(|e| format!("Invalid profile '{name}': {e}"))
}

/// Delete a saved profile file.
#[tauri::command]
pub fn delete_profile(_app: AppHandle, name: String) -> Result<(), String> {
    let path = profiles_dir().join(format!("{name}.json"));
    std::fs::remove_file(&path).map_err(|e| format!("Cannot delete '{name}': {e}"))
}

/// Import a profile JSON from an arbitrary path into the profiles directory.
#[tauri::command]
pub fn import_profile(_app: AppHandle, source: String) -> Result<String, String> {
    let src = PathBuf::from(&source);
    let stem = src
        .file_stem()
        .ok_or("Invalid file name")?
        .to_string_lossy()
        .to_string();
    // Validate it parses as a profile before importing.
    let data = std::fs::read_to_string(&src).map_err(|e| format!("Cannot read file: {e}"))?;
    let _: ProfileConfig =
        serde_json::from_str(&data).map_err(|e| format!("Not a valid profile JSON: {e}"))?;
    let dir = profiles_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("Cannot create profiles dir: {e}"))?;
    let dest = dir.join(format!("{stem}.json"));
    std::fs::write(&dest, &data).map_err(|e| format!("Cannot write profile: {e}"))?;
    Ok(stem)
}

/// Export a saved profile to an arbitrary destination path.
#[tauri::command]
pub fn export_profile(_app: AppHandle, name: String, dest: String) -> Result<(), String> {
    let src = profiles_dir().join(format!("{name}.json"));
    std::fs::copy(&src, &dest).map_err(|e| format!("Export failed: {e}"))?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Boot persistence (restore last choice on reboot)
// ---------------------------------------------------------------------------

/// Is the boot-restore systemd service installed?
#[tauri::command]
pub fn get_autostart() -> bool {
    Path::new(SERVICE_DEST).exists()
}

/// Record a dynamic effect as the thing to restore on boot (no elevation).
#[tauri::command]
pub fn write_boot_effect(app: AppHandle, config: EffectConfig) -> Result<(), String> {
    let script = resolve_script(&app)?;
    write_autostart_script(&script, &[effect_args(&config)])
}

/// Record the per-zone static layout as the thing to restore on boot (no elevation).
#[tauri::command]
pub fn write_boot_zones(
    app: AppHandle,
    zones: Vec<ZoneColor>,
    brightness: u8,
) -> Result<(), String> {
    let script = resolve_script(&app)?;
    let sets: Vec<Vec<String>> = zones.iter().map(|z| static_zone_args(z, brightness)).collect();
    write_autostart_script(&script, &sets)
}

/// Install + enable the systemd unit that runs autostart.sh each boot.
/// Requires one elevation (pkexec) to write into /etc/systemd/system.
#[tauri::command]
pub fn enable_autostart(_app: AppHandle) -> Result<(), String> {
    let user = std::env::var("USER")
        .or_else(|_| std::env::var("LOGNAME"))
        .map_err(|_| "Cannot determine the current user.".to_string())?;
    let script_path = autostart_script_path();
    let unit = format!(
        "[Unit]\n\
         Description=Predator NoSense - restore keyboard RGB on boot\n\
         After=turbo-fan.service\n\
         Wants=turbo-fan.service\n\
         \n\
         [Service]\n\
         Type=oneshot\n\
         User={user}\n\
         ExecStartPre=/bin/sleep 5\n\
         ExecStart=/bin/bash '{}'\n\
         \n\
         [Install]\n\
         WantedBy=multi-user.target\n",
        script_path.display()
    );

    // Stage the unit in the user's config dir, then install it with one prompt.
    let staging = config_dir().join(SERVICE_NAME);
    std::fs::create_dir_all(config_dir()).map_err(|e| format!("Cannot create config dir: {e}"))?;
    std::fs::write(&staging, unit).map_err(|e| format!("Cannot write unit file: {e}"))?;

    let pk = which("pkexec")
        .map_err(|_| "pkexec not found — cannot install the boot service.".to_string())?;
    let cmd = format!(
        "cp '{}' '{SERVICE_DEST}' && systemctl daemon-reload && systemctl enable {SERVICE_NAME}",
        staging.display()
    );
    let out = Command::new(pk)
        .arg("sh")
        .arg("-c")
        .arg(&cmd)
        .output()
        .map_err(|e| format!("pkexec failed to launch: {e}"))?;
    if out.status.success() {
        Ok(())
    } else {
        Err(format!(
            "Failed to install boot service: {}",
            String::from_utf8_lossy(&out.stderr)
        ))
    }
}

// ---------------------------------------------------------------------------
// Self-update (check GitHub releases, launch the installer)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
pub struct UpdateInfo {
    pub current: String,
    pub latest: String,
    pub url: String,
    pub notes: String,
}

/// Query the latest GitHub release. Uses the bundled `python3` (a hard runtime
/// dependency) so we add no HTTP crate and dodge the webview CSP. The frontend
/// decides whether `latest` is newer than `current`.
#[tauri::command]
pub fn check_update(app: AppHandle) -> Result<UpdateInfo, String> {
    let code = format!(
        "import json,urllib.request\n\
         req=urllib.request.Request('{RELEASES_API}',headers={{'User-Agent':'Predator-NoSense'}})\n\
         d=json.load(urllib.request.urlopen(req,timeout=8))\n\
         print(json.dumps({{'tag':d.get('tag_name') or '','url':d.get('html_url') or '','notes':d.get('body') or ''}}))"
    );
    let out = Command::new(python_bin())
        .arg("-c")
        .arg(&code)
        .output()
        .map_err(|e| format!("Failed to launch python3: {e}"))?;
    if !out.status.success() {
        return Err(format!(
            "Update check failed: {}",
            String::from_utf8_lossy(&out.stderr)
        ));
    }
    let v: serde_json::Value = serde_json::from_slice(&out.stdout)
        .map_err(|e| format!("Bad release response: {e}"))?;
    Ok(UpdateInfo {
        current: app.package_info().version.to_string(),
        latest: v["tag"].as_str().unwrap_or("").to_string(),
        url: v["url"].as_str().unwrap_or("").to_string(),
        notes: v["notes"].as_str().unwrap_or("").to_string(),
    })
}

/// Launch the installer one-liner in a terminal emulator (it needs a TTY for the
/// sudo prompt and progress UI). Tries common terminals; errors if none exist.
#[tauri::command]
pub fn run_update() -> Result<(), String> {
    let run = format!("{INSTALL_CMD}; echo; read -n1 -r -p 'Done. Press any key to close...'");
    // (binary, separator args before `bash -c <cmd>`)
    let terminals: &[(&str, &[&str])] = &[
        ("gnome-terminal", &["--"]),
        ("konsole", &["-e"]),
        ("xfce4-terminal", &["-x"]),
        ("alacritty", &["-e"]),
        ("kitty", &[]),
        ("xterm", &["-e"]),
        ("x-terminal-emulator", &["-e"]),
    ];
    for (term, sep) in terminals {
        if which(term).is_ok() {
            return Command::new(term)
                .args(*sep)
                .arg("bash")
                .arg("-c")
                .arg(&run)
                .spawn()
                .map(|_| ())
                .map_err(|e| format!("Failed to launch {term}: {e}"));
        }
    }
    Err(format!(
        "No terminal emulator found. Run the installer manually:\n{INSTALL_CMD}"
    ))
}

/// Disable + remove the systemd unit. Requires one elevation (pkexec).
#[tauri::command]
pub fn disable_autostart(_app: AppHandle) -> Result<(), String> {
    let pk = which("pkexec")
        .map_err(|_| "pkexec not found — cannot remove the boot service.".to_string())?;
    let cmd = format!(
        "systemctl disable --now {SERVICE_NAME} 2>/dev/null; rm -f '{SERVICE_DEST}'; systemctl daemon-reload"
    );
    let out = Command::new(pk)
        .arg("sh")
        .arg("-c")
        .arg(&cmd)
        .output()
        .map_err(|e| format!("pkexec failed to launch: {e}"))?;
    if out.status.success() {
        Ok(())
    } else {
        Err(format!(
            "Failed to remove boot service: {}",
            String::from_utf8_lossy(&out.stderr)
        ))
    }
}
