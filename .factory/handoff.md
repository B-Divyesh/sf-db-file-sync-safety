# Handoff — DB File Sync Safety v0.1.0

## Repair verification — 2026-08-28 UTC

**Status: PASS — the independent verification blocker is repaired and deployed.** Repair commit `84a73c4bc450c61b232056b6d5a4b4c307160693` (based on verifier-report commit `0da1a2b749844a23405837a4b983951bd1bc00d3`) adds an Azure Static Web Apps route policy for `/assets/*`:

```text
Cache-Control: public, max-age=31536000, immutable
```

This applies only to Vite's content-fingerprinted JavaScript and CSS. HTML and root-level mutable files retain the host's short revalidation lifetime. The policy is covered by the build-aware Playwright regression test `static hosting caches fingerprinted build assets immutably without caching HTML globally`; it asserts the exact header, the `/assets/*` route, generated JS/CSS references, and that no global cache header can accidentally cache HTML.

`dist/site` was deployed directly to the configured Azure Static Web Apps production resource `sf-db-file-sync-safety` in resource group `sociobot`. Live `HEAD` evidence after deployment:

| URL | Cache-Control | ETag / last modified |
| --- | --- | --- |
| `/assets/index-0dmFgyad.js` | `public, max-age=31536000, immutable` | `"98661495"` / 2026-08-28 16:38:51 UTC |
| `/assets/index-kHrlmiOK.css` | `public, max-age=31536000, immutable` | `"98661495"` / 2026-08-28 16:38:51 UTC |
| `/` | `public, must-revalidate, max-age=30` | `"98661495"` / 2026-08-28 16:38:51 UTC |

The live JavaScript SHA-256 is `5e1493a44670cbfd423ec4c83af007c4608a4c03005b3f94c679c2b49c885db4`, exactly matching `dist/site/assets/index-0dmFgyad.js`.

### Repair checks

- `npm ci`: passed (clean install; 0 vulnerabilities reported).
- `npm test`: passed — 5 Rust integration tests and 10 browser tests, including all seven exact `.factory/claims.json` commands, the immutable-cache regression, routes, console, Axe, keyboard, and 390px checks.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts`: passed. There is no repository lint script.
- `npm run build`: passed; writes `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: passed, including Cargo's clean package verification.
- `target/release/dbsync-safe --json --demo`: verified a blocked raw copy, `integrity_check: "ok"`, and a verified restore.
- Live Playwright smoke on `/`, `/demo`, `/privacy`, `/terms`, and the 404 route: 0 serious/critical Axe findings, 0 console errors, one `<main>` and one `<h1>` on each route. At 390px, the skip link receives first keyboard focus, the sample-data action is visible, and there is no horizontal overflow. A fresh `/demo` browser context made 3 same-origin requests and ended with empty localStorage/sessionStorage after reset.
- Live mobile Lighthouse 13: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.390 s and CLS 0.024.
- No `verify-url.sh` is shipped in this repository; its title/lang/main/alt/console coverage is exercised by the existing route test and the live browser smoke above. The product has no service worker or offline/update claim, so PWA update testing is not applicable.
- `git diff --check`: passed before committing the repair.

The verifier's P2 note remains non-blocking release provenance debt for the pre-existing `v0.1.0` binary tag. This repair changes only static-host cache behavior; it does not rebuild or retag the unchanged CLI release. Future binary releases must tag the exact verified source commit.

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
