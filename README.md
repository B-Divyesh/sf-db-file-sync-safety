# DB File Sync Safety

Make verified SQLite snapshots before a file-sync tool copies them.

DB File Sync Safety is for developers and power users who sync app folders between devices. It detects SQLite files and their WAL, SHM, or journal sidecars. It blocks the raw-copy path and creates a checksummed packet instead.

The tool supports SQLite only. It is not a sync engine, conflict resolver, replication system, or universal browser-profile fix.

## Try the isolated demo

```sh
dbsync-safe --demo
```

The command creates bundled sample data in a temporary folder. It scans, snapshots, restores, verifies, and prints that folder. It does not read your files.

The browser recording is available at <https://db-file-sync-safety.sociobot.in/demo>.

## Install

macOS or Linux:

```sh
curl -fsSL https://db-file-sync-safety.sociobot.in/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://db-file-sync-safety.sociobot.in/install.ps1 | iex
```

The shell installer checks the published SHA-256 before installation. Release packages also include tarballs, a portable Windows zip, `.deb`, `.rpm`, and unsigned macOS `.pkg` files.

Homebrew and Scoop manifests are under `packaging/homebrew/` and `scoop-bucket/`. The winget submission file is under `winget/`.

## Safe procedure

First, scan the folder. This command always treats raw SQLite copying as blocked:

```sh
dbsync-safe scan ~/Sync/MyApp
dbsync-safe guard ~/Sync/MyApp
```

`guard` exits with code 2 when it finds a SQLite database. Use that exit code in a sync hook.

Next, create a packet. The CLI copies the database bundle into private staging. It opens only that copy with SQLite's backup API:

```sh
dbsync-safe snapshot ~/Sync/MyApp --output ~/Packets/myapp-2026-08-28
```

Sync only that packet. On the other device, restore it into a separate folder:

```sh
dbsync-safe verify ~/Packets/myapp-2026-08-28
dbsync-safe restore ~/Packets/myapp-2026-08-28 --target ~/Restored/MyApp
```

The restore checks every SHA-256 and runs SQLite's integrity check. It refuses to replace an existing database unless you pass `--force`.

Snapshot acquisition does not open the source through SQLite. Closed WAL-mode databases work from read-only folders, and every source path and file byte stays unchanged.

Every command accepts `--json` for scripts:

```sh
dbsync-safe --json scan ~/Sync/MyApp
```

## Safety limits

- Close the source application when possible. Lock behavior differs by application and operating system.
- Keep a separate backup before using `--force`.
- A verified packet does not make simultaneous application use safe.
- The CLI has no account, telemetry, or network client.

## Develop and verify

Requirements: stable Rust, Node.js 22, and npm.

```sh
npm ci
npm test
npm run build
```

`npm test` runs Rust integration tests, builds the site, and runs browser claim and accessibility tests. The 20-scenario Rust suite covers SQLite databases with and without live WAL files.

`npm run build` creates the release binary and writes the static site to `dist/site/`. The site can also be built alone with `npm run build:site`.

## Release and deploy

Tag a tested commit with the next `v*` version. The release workflow builds macOS Intel and Apple silicon archives, Windows, Linux, `.deb`, `.rpm`, and `.pkg` assets. It publishes `SHA256SUMS` and `latest.json` with the GitHub Release.

Deploy `dist/site/` to the static host. Infrastructure, DNS, and billing stay outside this repository.

## License

MIT. See [LICENSE](LICENSE).
