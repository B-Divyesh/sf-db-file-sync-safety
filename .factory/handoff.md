# Handoff — DB File Sync Safety v0.1.0

## Independent verification 3 — 2026-08-29 UTC

**Status: FAIL — candidate `0e69eef3d1a42782dea2e22d01bb3eda25a89e81` is not accepted.**

All nine declared claim commands, the full clean test/build/package matrix, core SQLite safety paths, live deployment identity, installer/release checks, privacy, accessibility, caching, and performance passed. The first-read and one-click demo gates also passed.

The live demo nevertheless says **“Three notes reached a new folder”**, while both the candidate binary and published v0.1.0 binary deterministically restore **four** notes: three seeded rows plus the live-WAL “Train changes” row. This public quantitative statement is false and absent from `.factory/claims.json`, which is release-blocking under the claims contract. A secondary lock-recovery issue was also reproduced: an exclusive lock causes a silent unbounded wait, and external termination leaves a `.partial-*` staging directory. The public release tag still points to the older, source-equivalent CLI commit `feb4bf046d2fd6f3d82729c67538d97c131517d5`.

Full evidence and retest instructions are in `.factory/verification-3.md`.

## Repair work order `db-file-sync-safety-repair-2` — PASS

**Repaired and deployed:** 2026-08-28 UTC

**Verifier report:** `27c984051c1f3132e3d282464f6b922aed3468af`

**Rejected candidate:** `308e0c483b17b12cefaab876484d780c733577fe`

**Repair implementation:** `3cb325f9a74aa49b51ddb2942c7e632c6b1b1a4d` and `32ba1f30cf51ad042c570cb5fa9b9590c2912759`

All release-blocking findings in `.factory/verification-2.md` are repaired.

### Repairs

- Footer links, Demo's **Start for real**, and the Privacy repository link now expose at least 44×44 CSS-pixel targets. The regression checks every link, button, and summary on `/`, `/demo`, `/privacy`, `/terms`, and the not-found UI at 390×844.
- `.factory/claims.json` now registers the local-execution statement and the landing page's GitHub release request plus one-hour cache. Each claim has one exact tagged test.
- The GitHub cache claim test records the exact outbound origin and endpoint, checks the one-hour expiry, proves a reload uses the cache, and proves an expired record triggers a refresh.
- The installer checksum claim now supplies a deliberately wrong digest, requires a nonzero exit, checks the clear error, and proves the install folder remains empty. A separate success-path test remains.
- Known SPA routes now have explicit Static Web Apps rewrites. The broad navigation fallback was removed, so arbitrary document paths return HTTP 404 while `/404` keeps the designed route.
- A live mobile audit exposed the horizontally scrollable terminal as an unlabelled keyboard scroll region. It now has an explicit tab stop, and the 390px regression runs Axe on every route.

No Rust source, CLI behavior, package manifest, installer implementation, researched brief, public copy, or visual system changed.

### Verification evidence

- Clean `npm ci`: passed; 0 vulnerabilities.
- `npm test`: passed; 5 Rust integration tests and 14 Playwright tests.
- Every one of the 9 exact commands in `.factory/claims.json`: passed individually.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- TypeScript check for `site/src/site.ts`: passed. The repository has no separate lint script.
- `npm run build`: passed; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: passed from the final clean tree, including Cargo's package verification build.
- Clean consumer `cargo install` from `target/package/db-file-sync-safety-0.1.0`: passed. The installed binary reported 0.1.0 and its JSON demo reported raw copy blocked, SQLite integrity `ok`, and restore verified.
- Azure Static Web Apps emulator: `/`, `/demo`, `/privacy`, `/terms`, and `/404` returned 200; an arbitrary missing document and missing asset returned 404.
- Final live browser audit: 10 combinations across desktop 1440×900 and mobile 390×844. All had one `main`, one `h1`, `lang=en`, no horizontal overflow, no console/page errors, no sub-44px interactive targets, and zero serious/critical Axe findings.
- Keyboard: first Tab focused the skip link with a visible 3px amber outline. Demo controls, header links, terminal scroll region, copy action, and footer links were reachable without a trap.
- Reduced motion: terminal animations resolved to 0.00001 seconds and the landing integrity sweep was hidden.
- Privacy: a fresh Demo run made only same-origin requests and left cookies, localStorage, and sessionStorage empty. A fresh landing run contacted only `api.github.com` outside the site and wrote only `dbsync-safe:release`. No service worker is registered, so offline/update testing is not applicable and no offline claim is made.
- Response policy: HTML retains `public, must-revalidate, max-age=30`; hashed JS/CSS retain `public, max-age=31536000, immutable`; CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present. An arbitrary live path returns HTTP 404.
- Live identity: 13 deployed files matched `dist/site` byte-for-byte. Final SHA-256 values are `42bebde274a486f3e0495659963725f3df76f879b2de6a4182beaa6bcbb13b6b` for `index.html`, `45beac43f1223c90c85f2c215e904cc7f714714dc7fce4c5a413a4f544b08912` for `index-DMs0W6ts.js`, and `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08` for `index-DGiDdORx.css`.
- Live mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 seconds, CLS 0.023, TBT 30 ms, total transfer 86 KiB.
- Public release: `latest.json` is valid with all 8 package files. The Linux archive matches `SHA256SUMS`; its binary reports 0.1.0 and passes the JSON demo. The live shell installer installs that verified release into a clean prefix.
- GitHub CI run `33196414344` passed for final implementation commit `32ba1f30cf51ad042c570cb5fa9b9590c2912759`.

### Deployment

`dist/site/` from commit `32ba1f30cf51ad042c570cb5fa9b9590c2912759` was deployed to the Azure Static Web Apps production resource `sf-db-file-sync-safety` in resource group `sociobot`. Both the Azure hostname and <https://db-file-sync-safety.sociobot.in> serve the repair.

### Remaining operator notes

- The existing `v0.1.0` tag still points to `feb4bf046d2fd6f3d82729c67538d97c131517d5`. This repair does not change any CLI source or published package content, so the existing release was verified rather than destructively retagged. Tag the exact accepted source commit for the next binary release.
- Submit `winget/ParamFactory.DBSyncSafe.yaml` upstream when desired. macOS packages and the Windows binary remain unsigned as documented.

## Independent verification 2 — 2026-08-28 UTC

**Status: FAIL — candidate `308e0c483b17b12cefaab876484d780c733577fe` is not accepted.**

Fresh verification confirms that the earlier immutable-cache blocker is repaired on <https://db-file-sync-safety.sociobot.in>: live hashed JS/CSS now use one-year immutable caching and all compared deployment assets are byte-identical to the candidate build. Core CLI behavior, all seven declared claim commands, the complete test/build/package matrix, release artifacts, security/privacy checks, Axe, keyboard flow, and performance budgets pass.

Two release blockers remain:

1. At 390px, footer links are about 20px high on every route, Demo's **Start for real** is 21.7px high, and the Privacy repository link is 21px high. This violates the non-negotiable 44×44 CSS-pixel touch-target requirement.
2. `.factory/claims.json` does not list/test the landing page's “Runs on your device,” GitHub request, or one-hour release-cache statements. The listed installer-checksum test uses only a correct digest, so it does not prove rejection happens before installation. The live installer itself did reject a deliberately bad checksum and installed nothing; the defect is the mandatory claim contract.

Non-blocking/high-priority debt remains: `v0.1.0` points to older commit `feb4bf046d2fd6f3d82729c67538d97c131517d5` (the CLI source is unchanged), and arbitrary missing document routes render the not-found UI with HTTP 200.

Full independent evidence and exact retest requirements are in `.factory/verification-2.md`.

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
