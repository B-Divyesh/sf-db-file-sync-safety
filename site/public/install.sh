#!/bin/sh
set -eu

REPO="B-Divyesh/sf-db-file-sync-safety"
BASE="https://github.com/$REPO/releases/latest/download"
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) ASSET="dbsync-safe-macos-aarch64.tar.gz" ;;
  Darwin-x86_64) ASSET="dbsync-safe-macos-x86_64.tar.gz" ;;
  Linux-x86_64|Linux-amd64) ASSET="dbsync-safe-linux-x86_64.tar.gz" ;;
  *) echo "dbsync-safe: this system does not have a prebuilt binary." >&2; echo "See https://github.com/$REPO/releases" >&2; exit 1 ;;
esac

WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/dbsync-safe.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT INT TERM
curl -fsSL "$BASE/$ASSET" -o "$WORK_DIR/$ASSET"
curl -fsSL "$BASE/SHA256SUMS" -o "$WORK_DIR/SHA256SUMS"
EXPECTED=$(awk -v name="$ASSET" '$2 == name {print $1}' "$WORK_DIR/SHA256SUMS")
[ -n "$EXPECTED" ] || { echo "dbsync-safe: checksum was not published." >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL=$(sha256sum "$WORK_DIR/$ASSET" | awk '{print $1}')
else
  ACTUAL=$(shasum -a 256 "$WORK_DIR/$ASSET" | awk '{print $1}')
fi
[ "$ACTUAL" = "$EXPECTED" ] || { echo "dbsync-safe: checksum failed. Nothing was installed." >&2; exit 1; }
tar -xzf "$WORK_DIR/$ASSET" -C "$WORK_DIR"
INSTALL_DIR=${DBSYNC_SAFE_INSTALL_DIR:-/usr/local/bin}
if [ -w "$INSTALL_DIR" ]; then
  install -m 755 "$WORK_DIR/dbsync-safe" "$INSTALL_DIR/dbsync-safe"
else
  sudo install -m 755 "$WORK_DIR/dbsync-safe" "$INSTALL_DIR/dbsync-safe"
fi
echo "Installed dbsync-safe to $INSTALL_DIR/dbsync-safe"
echo "Run: dbsync-safe --demo"

