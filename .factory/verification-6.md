# Independent verification 6 — PASS

**Candidate:** `e9b38592d646b6053dd08bcc181b8a6172740800`
**Live URL:** <https://db-file-sync-safety.sociobot.in>
**Verified:** 2026-08-29 UTC
**Work order:** `db-file-sync-safety-verify-6`

## Verdict

**PASS — accept candidate `e9b38592d646b6053dd08bcc181b8a6172740800`.** Fresh evidence disproves a deployment-only failure: the candidate build and live assets are byte-identical. No P0, P1, or P2 defects were found.

## Required first read and demo

A cold live visit plainly answers the required questions: **“Make SQLite snapshots safe to sync”**; **“For developers syncing app folders…”**; and the visible first action **“Try it with sample data.”** Enter opens `/?demo=1`, which immediately shows the realistic `field-notes.sqlite` live-WAL flow, raw-copy refusal, verified restore, and four restored notes. At 390×844 it has the persistent **“Demo — sample data, nothing is saved”** banner, Reset demo, Install the CLI, 44px targets, and no horizontal page overflow.

## Claims and local quality gates

`.factory/claims.json` exists with 21 entries, each with exactly one `@claim:<id>` test. From the clean checkout after `npm ci`, the listed demo-backed tests were exercised by:

```sh
npm test -- --grep @claim:
```

Result: **21/21 passed**. This includes SQLite/WAL and persistent-journal snapshots, unchanged read-only source, source-open isolation, restore/overwrite refusal, JSON commands, local/no-network/no-telemetry behavior, release/cache/install/package/build/release-workflow contracts. The same run passed all 10 Rust integration tests.

The complete `npm test` result is **10 Rust integration tests and 28/28 Playwright tests passed** (`test-results/.last-run.json` is `passed`). `npm run build` emitted `target/release/dbsync-safe` and `dist/site/`. `cargo fmt --all -- --check`, strict clippy, TypeScript no-emit checking, `git diff --check`, and `cargo package --locked` passed.

Production sizes are 16.12 KB JS (5.53 KB gzip), 13.15 KB CSS (3.82 KB gzip), and 73.2 KB hero WebP, all within budget.

## Independent CLI and release exercise

The local release binary’s useful `--help` documents scan, guard, snapshot, verify, restore, and demo. `--json --demo` found WAL/SHM, blocked raw copying, created and verified a packet, and restored it.

The published `v0.1.3` Linux x64 tarball matched the released `SHA256SUMS` value exactly:

```text
f341ae5da98999cd41618d572b4c17042149df90dbc20a168e89865c8727fb91
```

It extracted into a clean consumer directory, reported `dbsync-safe 0.1.3`, and completed `--json --demo` successfully. Empty folders return a safe next step; missing paths and empty snapshots return actionable `ok:false` JSON/exit 1; a restore refuses an existing sentinel target and leaves its bytes unchanged.

## Live deployment, privacy, security, and performance

Fresh local/live SHA-256 comparisons are exact for:

| Asset | SHA-256 |
| --- | --- |
| `index-Dh1SB1zh.js` | `52e1a96574cac209e41060782aa7961e3740ca3b784d356c913bbf2e8fa5e519` |
| `index-DGiDdORx.css` | `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08` |
| `hero-database.webp` | `83424c8f3662842245432fa77a8bd98a38522c6c06c4fa4392eded6ba9a05513` |
| `og-image.webp` | `c467fb205444748f1672c31fb13d3739b2922fa90864c0928dcaca2d093e82a5` |

Cold-home browser logging found only same-origin files plus the disclosed GitHub public-release request (`https://api.github.com/repos/B-Divyesh/sf-db-file-sync-safety/releases?per_page=1`). Fresh demo logging is same-origin only with no cookies, localStorage, or sessionStorage. No console/page errors occurred on `/`, `/?demo=1`, `/privacy`, `/terms`, or `/404.html`.

All routes have `lang=en`, exactly one h1 and main landmark, route-specific titles, and zero serious/critical Axe violations. Keyboard traversal has a visible 3px focus ring and no trap; reduced-motion mode removes animation. Unknown paths return a designed HTTP 404. All discovered links resolved successfully.

Live headers provide restrictive CSP (`connect-src 'self' https://api.github.com`), HSTS, nosniff, strict referrer policy, and disabled camera/microphone/geolocation. HTML is short-revalidated; fingerprinted JS/CSS are `public, max-age=31536000, immutable`.

This is static site plus local CLI: it has no backend/server-side product endpoint, sign-in, payment/unlock endpoint, service worker, PWA/offline promise, or persistence API. Rate-limit, Entra, backend, and service-worker-update checks are therefore not applicable.

## Defects and known gaps

### P0/P1/P2

None.

### QA environment note

The Lighthouse CLI could not attach to Chromium in this root container. This is not a product defect: fresh browser/axe/keyboard/error/header tests and bundle/transfer budgets pass. Existing factory evidence contains a successful live Lighthouse run; this report does not rely on it for the verdict.

## Retest

```sh
npm ci
npm test -- --grep @claim:
npm test
npm run build
cargo package --locked
./target/release/dbsync-safe --json --demo
```
