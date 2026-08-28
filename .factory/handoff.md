# Handoff — DB File Sync Safety v0.1.0

## Independent verification update — 2026-08-28 UTC

**Status: FAIL — release acceptance is blocked.** Independent verification of candidate `a0a646b5f2e6e73c0ad458f09cbfa078160f1bbd` at <https://db-file-sync-safety.sociobot.in> found one release-blocking deployment defect: content-hashed JS/CSS and static image assets are served with `Cache-Control: public, must-revalidate, max-age=30`, rather than long-lived immutable caching required by the performance contract. Fix the static-host asset cache policy, deploy, and recheck the response headers before accepting.

All product checks otherwise passed: every `.factory/claims.json` command, complete `npm test` (9 Playwright tests / 5 Rust integration tests), `npm run build`, `cargo package --locked`, live Axe/browser/mobile/reduced-motion/privacy checks, a clean consumer installation of the public Linux archive with checksum verification, and an end-to-end CLI demo/recovery exercise. Live application assets matched a fresh candidate build byte-for-byte. Full evidence and the non-blocking release-tag provenance note are in `.factory/verification.md`.

## What shipped

- A Rust `dbsync-safe` binary with `scan`, `guard`, `snapshot`, `verify`, `restore`, and `demo` commands.
- SQLite detection by file header, including extensionless databases and WAL, SHM, and rollback-journal sidecars.
- Read-only source connections and consistent copies through SQLite's online backup API.
- Atomic packet creation with SHA-256 hashes, an explicit procedure, scope limits, and `PRAGMA integrity_check` results.
- Pre-restore checksum and integrity checks, safe default overwrite refusal, and `--force` for an explicit replacement.
- Helpful exit codes and `--json` output for sync hooks and scripts.
- A bundled `field-notes.sqlite` demo created in a process-specific temporary folder.
- A responsive static product site with landing, demo, privacy, terms, and designed 404 routes.
- Original luminous-glass database art, an Open Graph image, favicon, copy audit, and documented design system.
- Shell and PowerShell installers. The shell installer is exercised against a local release fixture in tests.
- GitHub Actions for CI and releases across Linux x64, Windows x64, macOS Intel, and macOS Apple silicon.
- Linux `.deb` and `.rpm`, unsigned macOS `.pkg`, Windows portable zip, tarballs, `SHA256SUMS`, and `latest.json`.
- Homebrew, Scoop, and winget manifests with the published v0.1.0 checksums.

## Published release

- Release: <https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/tag/v0.1.0>
- Release workflow run `33184792494`: passed.
- Public CI run `33184913336` on the final accessibility fix: passed.
- The downloaded Linux archive matched `dbc74bedea6eed268092dc707bc306519b45300166af1091c3632c90e4bda5a2` from `SHA256SUMS`.
- `latest.json` was downloaded and parsed successfully. It lists all eight platform/package files.
- Homebrew tap: <https://github.com/B-Divyesh/homebrew-db-file-sync-safety>

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package --locked
```

`npm test` passed locally:

- 5 Rust integration tests, including the required 20 SQLite scenarios.
- 7 claim tests against fresh demo state.
- Route, console, Axe, keyboard, and 390-pixel viewport checks.
- 9 Playwright tests total.

`npm run build` passed and wrote `dist/site/index.html`. Production transfer sizes were 5.19 KB gzip JavaScript and 3.80 KB gzip CSS. The hero WebP is 73 KB.

Lighthouse 13 on the local production preview, mobile defaults:

| Category | Score |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

- LCP: 2.0 seconds
- CLS: 0.025
- Total blocking time: 0 ms
- INP: not produced by the lab run; Playwright keyboard interactions completed without delay.

`cargo package --allow-dirty --locked` also built and verified the package.

## Safety decisions

- A scan never calls a live SQLite file safe for raw copying. It directs the user to create a packet.
- Source databases are opened with `SQLITE_OPEN_READ_ONLY` during snapshot creation.
- Symlinks are skipped during recursive scans.
- Packet paths reject absolute paths and parent traversal.
- A failed snapshot removes only its process-specific partial output.
- Restore verifies the packet before creating or replacing target files.
- The copy and documentation state that application locking varies and that SQLite is the only supported database format.

## Known gaps and operator actions

- Deploy `dist/site/` through the factory. This repository does not change DNS or infrastructure.
- Submit `winget/ParamFactory.DBSyncSafe.yaml` to `microsoft/winget-pkgs`.
- The v0.1.0 macOS packages and Windows executable are unsigned. macOS users may need right-click → Open. Future signing needs operator certificates.
- The release supports Linux x64, Windows x64, and both current macOS architectures. Linux ARM and Windows ARM are not included.
- There is no promise that a specific application can remain open during a snapshot. Closing it remains the safest procedure.

## Source references

- Product scope: `.factory/brief.json`
- Visual system and asset provenance: `.factory/design.md`
- Claim contract: `.factory/claims.json`
- Demo isolation: `.factory/demo.md`
- Copy review: `.factory/copy-audit.md`
