# Independent verification 8 — FAIL

**Tested commit:** `72ae6a740ab389e90b5ab5491e8983579bb4303f`  
**Live URL:** <https://db-file-sync-safety.sociobot.in>  
**Date:** 29 August 2026 UTC  
**Scope:** clean-checkout verification of the CLI, installer, claim contract, static production build, and the live deployment.

## Decision

**FAIL.** The CLI and site otherwise meet the core SQLite safety job and every declared claim passed, but the required mobile Lighthouse performance gate does not pass. A successful, repeatable mobile Lighthouse run scored **82 performance**, below the factory performance requirement of **≥90**. The measured total blocking time was **700 ms**.

This is a release-blocking quality-gate failure. It is not evidence of the earlier reported deployment-only failure: the freshly built candidate's HTML, JS, CSS, and hero image match production byte-for-byte.

## First read and demo

A cold production visit at 1440×900 plainly answered the required first-screen questions:

- **What:** “Make SQLite snapshots safe to sync.”
- **For whom:** “For developers syncing app folders.”
- **First action:** visible one-click **Try it with sample data**.

That action opened `/?demo=1` and immediately showed the realistic `field-notes.sqlite` WAL workflow, raw-copy refusal, snapshot, verified restore of four notes, the persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Install the CLI. Direct `/demo` made no external request and wrote no browser storage; the landing route separately makes the documented GitHub Releases API request and caches its public result for one hour.

## Required claims contract

`.factory/claims.json` exists with 21 entries. After `npm ci`, each exact listed command was run separately from this checkout. All passed (full command log: `/tmp/dbsync-claim-matrix.log` in this verification container).

| Claim | Result |
| --- | --- |
| sqlite-wal-detection | PASS |
| consistent-snapshot | PASS |
| persistent-journal-snapshot | PASS |
| readonly-source-snapshot | PASS |
| source-open-isolation | PASS |
| verified-restore | PASS |
| restore-overwrite-refusal | PASS |
| demo-restored-count | PASS |
| json-output | PASS |
| local-execution | PASS |
| no-account | PASS |
| no-network | PASS |
| no-telemetry | PASS |
| github-release-cache | PASS |
| sqlite-only-scope | PASS |
| mit-free | PASS |
| installer-checksum | PASS |
| release-assets | PASS |
| package-manifests | PASS |
| build-contract | PASS |
| release-workflow | PASS |

The complete `npm test` run also passed: 10 Rust safety/integration tests and 29 Playwright tests (`test-results/.last-run.json` reports `passed`). This covers normal SQLite/WAL flow, finalized persistent journals, read-only/locked sources, invalid and tampered inputs, overwrite refusal and recovery, JSON output, private source opens, restore integrity, demo isolation, and browser accessibility.

## Build, package, and installer

- `npm ci`: PASS; 0 npm audit vulnerabilities.
- `npm test`: PASS.
- `npm run build`: PASS; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo package --locked --allow-dirty`: PASS.
- The repository has no `tsconfig.json` or standalone TypeScript lint/type-check script. The Vite production build passed.
- Fresh consumer check: downloaded the public Linux x64 v0.1.3 tarball, verified it with its published `SHA256SUMS`, extracted it in `/tmp`, and ran `--help` and `--json --demo` successfully.
- Fresh installer check: `install.sh`, with a temporary install directory, installed v0.1.3 successfully; its installed binary ran `--json demo` with `ok: true`, `verified: true`, and `raw_copy_safe: false`.

## Live deployment, privacy, accessibility, and performance

- Candidate/live identity: local `dist/site/index.html`, `index-DWR8wfFk.js`, `index-DT_BkMiD.css`, and `hero-database.webp` exactly matched downloads from production by SHA-256 and `cmp`. This establishes that the live static deployment is this candidate.
- Cold landing requests were same-origin assets plus only the documented `https://api.github.com/repos/B-Divyesh/sf-db-file-sync-safety/releases?per_page=1`; no page or console errors occurred. Direct demo used only same-origin resources and no browser storage.
- Production headers include CSP with `connect-src 'self' https://api.github.com`, HSTS, `nosniff`, strict-origin referrer policy, permissions policy, and `frame-ancestors 'none'`. Hashed JS/CSS are immutable for one year. HTML/images use 30-second revalidation.
- Live Axe scans at desktop and 390×844/reduced-motion for `/`, `/?demo=1`, `/privacy`, and `/terms` found **0 serious or critical** issues. Keyboard Tab first reaches the visible skip link; all audited pages have one h1/main and no horizontal mobile overflow. Production 404 intentionally returns HTTP 404; Chrome reports its expected failed-resource console message when that route is requested.
- Bundle sizes are within budget: JS **16.10 kB raw / 5.51 kB gzip**, CSS **13.24 kB raw / 3.84 kB gzip**, hero WebP **73,194 bytes**.
- Mobile Lighthouse, using the installed Chromium with `--no-sandbox --disable-dev-shm-usage --disable-gpu`, completed without runtime error: **performance 82, accessibility 100, best practices 100, SEO 100; FCP 0.9 s, LCP 1.9 s, CLS 0.027, TBT 700 ms**. The first run crashed only during Lighthouse's screenshot gatherer; the second result is the valid one. Performance 82/TBT 700 ms fails the ≥90 mobile-performance gate.

This static product has no product server-side API or sign-in flow, so rate-limit and Entra identity checks do not apply.

## Defects by severity

### Medium — mobile performance quality gate fails

**Evidence:** valid mobile Lighthouse run against production: performance **82** (required ≥90) and total blocking time **700 ms**. Initial bundles are small, but the observed blocked main-thread time remains too high for the factory static-product performance contract.

**Required follow-up:** profile and reduce the blocking work, then rerun mobile Lighthouse until performance is at least 90. Do not mark this release accepted solely because the functional claim suite passes.

### Low — no dedicated TypeScript quality command

There is no `tsconfig.json` or lint/type-check script. Vite's build succeeds, but an explicit TypeScript check would make this gate auditable.
