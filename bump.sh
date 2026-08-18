#!/usr/bin/env bash
# bump.sh — Bump the version across all config files, commit, and tag.
#
# Usage:
#   ./bump.sh patch          # 1.2.0 → 1.2.1
#   ./bump.sh minor          # 1.2.0 → 1.3.0
#   ./bump.sh major          # 1.2.0 → 2.0.0
#   ./bump.sh 1.5.0          # set an explicit version
#
# After bumping it will:
#   1. Update tauri.conf.json, Cargo.toml, and package.json
#   2. Commit the changes
#   3. Create a git tag  (v1.5.0)
#   4. Ask whether to push (triggers the release CI)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
TAURI_CONF="$ROOT/src-tauri/tauri.conf.json"
CARGO_TOML="$ROOT/src-tauri/Cargo.toml"
PACKAGE_JSON="$ROOT/package.json"

# ── helpers ──────────────────────────────────────────────────────────────

die()  { echo -e "${RED}Error:${RESET} $*" >&2; exit 1; }
info() { echo -e "${CYAN}▸${RESET} $*"; }
ok()   { echo -e "${GREEN}✔${RESET} $*"; }

# Read the current version from tauri.conf.json (source of truth).
current_version() {
  grep -oP '"version"\s*:\s*"\K[0-9]+\.[0-9]+\.[0-9]+' "$TAURI_CONF" | head -1
}

# Given current version + bump type, compute the next version.
compute_next() {
  local cur="$1" bump="$2"
  IFS='.' read -r major minor patch <<< "$cur"
  case "$bump" in
    patch) echo "$major.$minor.$((patch + 1))" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    major) echo "$((major + 1)).0.0" ;;
    *)     die "Unknown bump type: $bump (expected patch|minor|major)" ;;
  esac
}

# ── argument parsing ─────────────────────────────────────────────────────

[[ $# -lt 1 ]] && die "Usage: $0 <patch|minor|major|X.Y.Z>"

ARG="$1"
CURRENT="$(current_version)"
[[ -z "$CURRENT" ]] && die "Could not read current version from $TAURI_CONF"

if [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEXT="$ARG"
else
  NEXT="$(compute_next "$CURRENT" "$ARG")"
fi

echo ""
echo -e "${BOLD}Predator NoSense — version bump${RESET}"
echo -e "  current : ${RED}$CURRENT${RESET}"
echo -e "  next    : ${GREEN}$NEXT${RESET}"
echo ""

# ── update files ─────────────────────────────────────────────────────────

# tauri.conf.json  — "version": "X.Y.Z"
sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEXT\"/" "$TAURI_CONF"
ok "Updated tauri.conf.json"

# Cargo.toml — version = "X.Y.Z"  (only the first occurrence, the package one)
sed -i "0,/^version = \"$CURRENT\"/s//version = \"$NEXT\"/" "$CARGO_TOML"
# Cargo.lock records the package version too, and the PKGBUILD builds with --locked.
cargo update -w --offline --manifest-path "$CARGO_TOML" >/dev/null
ok "Updated Cargo.toml + Cargo.lock"

# package.json + package-lock.json — npm keeps both in sync, which `npm ci` requires.
npm --prefix "$ROOT" version "$NEXT" --no-git-tag-version --allow-same-version >/dev/null
ok "Updated package.json + package-lock.json"

# ── verify ───────────────────────────────────────────────────────────────

echo ""
info "Verification:"
echo "  tauri.conf.json : $(grep -oP '"version"\s*:\s*"\K[^"]+' "$TAURI_CONF" | head -1)"
echo "  Cargo.toml      : $(grep -m1 '^version' "$CARGO_TOML" | grep -oP '"[^"]+"')"
echo "  package.json    : $(grep -oP '"version"\s*:\s*"\K[^"]+' "$PACKAGE_JSON" | head -1)"
echo "  Cargo.lock      : $(grep -A1 '^name = "predator-nosense"' "$ROOT/src-tauri/Cargo.lock" | grep -oP 'version = "\K[^"]+')"
echo ""

# ── git commit + tag ─────────────────────────────────────────────────────

TAG="v$NEXT"

info "Staging changed files…"
git -C "$ROOT" add "$TAURI_CONF" "$CARGO_TOML" "$PACKAGE_JSON" "$ROOT/package-lock.json"

git -C "$ROOT" add "$ROOT/src-tauri/Cargo.lock"

git -C "$ROOT" commit -m "chore: bump version to $TAG"
ok "Committed"

git -C "$ROOT" tag -a "$TAG" -m "Release $TAG"
ok "Created tag ${BOLD}$TAG${RESET}"

echo ""

# ── optional push ────────────────────────────────────────────────────────

read -rp "$(echo -e "${CYAN}Push commit + tag now?${RESET} This will trigger the release CI. [y/N] ")" yn
case "$yn" in
  [Yy]*)
    git -C "$ROOT" push
    git -C "$ROOT" push origin "$TAG"
    ok "Pushed! The release workflow should start shortly."
    echo -e "  ${CYAN}→${RESET} https://github.com/$(git -C "$ROOT" remote get-url origin | sed 's|.*github.com[:/]||;s|\.git$||')/actions"
    ;;
  *)
    info "Skipped. When you're ready:"
    echo "    git push && git push origin $TAG"
    ;;
esac

echo ""
