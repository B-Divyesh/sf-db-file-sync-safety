# Verification 8 status — FAIL (29 August 2026 UTC)

Independent QA of commit `72ae6a740ab389e90b5ab5491e8983579bb4303f` at <https://db-file-sync-safety.sociobot.in> is **FAIL**. This overrides any earlier PASS handoff for release acceptance.

- All 21 `.factory/claims.json` commands passed separately after `npm ci`; the full `npm test` passed (10 Rust tests, 29 Playwright tests).
- `npm run build`, `cargo fmt --check`, strict `cargo clippy`, and `cargo package --locked --allow-dirty` passed. A clean extracted Linux artifact and the live `install.sh` installer both ran the JSON demo successfully after checksum verification.
- The local candidate's static HTML, JS, CSS, and hero image matched the live deployment byte-for-byte. The cold first screen is plain, includes one-click sample data, and the demo, privacy, headers, 390px layout, keyboard focus, and axe checks passed.
- **Release blocker:** valid production mobile Lighthouse scored **82 performance** (required ≥90), with **700 ms TBT**. Accessibility/best-practices/SEO were all 100; FCP 0.9 s, LCP 1.9 s, CLS 0.027. Reduce blocking work and rerun until performance is ≥90.
- Low follow-up: no explicit TypeScript lint/type-check command is configured.

Full evidence and exact claim table: `.factory/verification-8.md`.

# Polish round 3 handoff — DB File Sync Safety

**Completed:** 29 August 2026 UTC
**Work order:** `db-file-sync-safety-polish-3`
**Base candidate:** `2f7bff8d9600ddcb3279537a3798c03b3897604d`
**Repair commits:** `c11ca460b885ff5094fc49548318bd089280caa4`, `eae5c7db853f6d3d4b9e61a3d4df24c38549fd91`
**Live URL:** <https://db-file-sync-safety.sociobot.in>
**Result:** PASS — no outstanding review findings.

## What changed

- Closed F-3-1 by compacting the desktop hero only: a bounded 64px headline, shorter vertical spacing, and the same asymmetric database landscape. “Runs on your device,” “No telemetry,” and “Free under MIT” now fit before the fold at 1440×900, 1440×768, and 390×844.
- Added the regression `the complete first-screen fact list is visible before scrolling at required viewports` and added 1440×768 to the production audit.
- Revalidated the cumulative F-1 and F-2 repairs: actual CLI safety behavior, one-click isolated `?demo=1`, claim coverage, direct routing/focus, legal links, standalone 404 metadata/shell/targets, plain-language copy, and mobile layout all remain intact.
- Updated the catalog description to: “Create verified SQLite snapshots before syncing a live database.” It is verb-first and 64 characters.

## How to run and verify

```sh
npm ci
npm test
npm run build
node scripts/live-audit.mjs https://db-file-sync-safety.sociobot.in
```

The live build was deployed with the work-order static target:

```sh
npm ci && npm run build:site
swa deploy dist/site --swa-config-location site/public --resource-group sociobot --app-name sf-db-file-sync-safety --env production
```

## Exact evidence

- Fresh shallow clone after `npm ci`: all 21 individual `claims.json` commands pass. Full transcript: `.factory/evidence/polish-3/clean-clone-claims.log`.
- Local: `npm test` passes 10 Rust integration tests and 29 Playwright tests (`.factory/evidence/polish-3/npm-test.log`). `npm run build` writes `dist/site/`; formatting, strict Clippy, `cargo package --locked --allow-dirty`, and diff checks pass.
- Live: `live-audit.json` records five normal routes plus production HTTP 404 at 1440×900, 1440×768, and 390×844. It reports zero Axe violations, console errors, overflow, undersized targets, dead links, or demo privacy/storage leaks.
- First-screen cold measurements: the fact bottoms are 706.5px at 1440×900, 640.5px at 1440×768, and 676.6px at 390×844. Screenshots: `.factory/evidence/polish-3/live-home-1440x768.png` and `live-home-390x844.png`.
- Factory verifier reports are in `.factory/evidence/polish-3/verify-home/verify.json` and `verify-demo/verify.json`.
- Lighthouse mobile report: `.factory/evidence/polish-3/lighthouse-mobile.json` — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8s, LCP 1.7s, CLS 0.026, TBT 20ms, transfer 86KiB.
- Full finding-by-finding closure: `.factory/polish-3.md`.

## Known gaps and next steps

None. The CLI continues to state its real limits: SQLite only, no sync engine or conflict resolver, close source apps when possible, and keep an independent backup before `--force`.
