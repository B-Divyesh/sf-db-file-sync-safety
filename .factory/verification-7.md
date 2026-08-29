# Independent verification 7 — PASS

**Verified commit:** `2f7bff8d9600ddcb3279537a3798c03b3897604d`  
**Live URL:** <https://db-file-sync-safety.sociobot.in>  
**Date:** 29 August 2026 UTC  
**Scope:** clean-checkout QA of the SQLite-only CLI, static site, demo sandbox, published Linux artifact, and live deployment.

## Result

**PASS.** The candidate meets the researched brief's smallest useful product: it detects SQLite/WAL bundles, blocks the raw-copy path, creates a checksummed SQLite backup packet without modifying the source, and verifies a restore into a separate folder. No release-blocking defect was found.

## First read and demo

Cold production `/` at 1440px answered all required questions in plain words on the first screen:

- **What it does:** “Make SQLite snapshots safe to sync.”
- **For whom:** “For developers syncing app folders.”
- **What to do first:** the visible “Try it with sample data” link.

That link reaches `/?demo=1` in one click. The demo immediately shows the bundled `field-notes.sqlite` WAL workflow, a verified restore of four notes, and its persistent “Demo — sample data, nothing is saved” banner with Reset demo and a clearly labelled route to install the real CLI. A fresh direct demo visit made only same-origin requests and created no cookies, local/session storage, or service worker.

## Claims contract

`.factory/claims.json` exists with 21 entries. After `npm ci`, every listed exact command was executed separately from this checkout as `npm test -- --grep @claim:<id>`; every command completed successfully and selected one matching Playwright claim test.

| Claim ID | Result |
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

The isolated complete `npm test` run then passed: **10 Rust integration tests and 28/28 Playwright tests**. This includes the 20-scenario safety regression, invalid/missing path handling, locked and read-only sources, persistent journals, source-open isolation, tampered packets, overwrite refusal, JSON errors, sandbox isolation, privacy, cache behaviour, and accessibility checks.

## Local build and consumer exercise

- `npm ci`: PASS; audit reported 0 vulnerabilities.
- `npm run build`: PASS; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo package --locked --allow-dirty`: PASS.
- There is no repository `tsconfig.json` or dedicated TypeScript check/lint script. Vite's production build passed; invoking bare `tsc --noEmit` only reports its help because no project is configured.
- Downloaded public `v0.1.3` Linux x64 tarball, checked it against the published `SHA256SUMS`, extracted it into a fresh temporary consumer directory, and exercised `--version`, `--help`, `--json --demo`, `guard`, and a missing-path JSON error. The installer at `/install.sh` also installed the verified public binary into a fresh temporary directory. The demo restored its SQLite database successfully and guard returned exit code 2 for a source database, as documented.

## Live deployment, privacy, accessibility, and performance

- The local built HTML, hashed JavaScript/CSS, hero art, Open Graph art, and `install.sh` match production byte-for-byte. This identifies the live site as the candidate's static build. Production reports build `004` / v0.1.3.
- Cold landing-page requests were same-origin assets plus the documented GitHub Releases API request. A fresh direct demo made only same-origin requests. No console errors or page errors occurred.
- Response headers include a restrictive CSP (`connect-src 'self' https://api.github.com`), HSTS, `nosniff`, strict referrer policy, and permissions policy. HTML uses short revalidation caching; fingerprinted JS/CSS use `public, max-age=31536000, immutable`.
- Live Axe scans at desktop and 390px/reduced-motion for `/`, `/?demo=1`, `/privacy`, `/terms`, and a true HTTP-404 route found **0 serious or critical violations**. Each page had one h1 and main landmark; keyboard Tab reached a visible skip link/focus treatment; the mobile layouts had no horizontal overflow.
- Production initial JavaScript is 16,101 bytes raw / 5.51 kB gzip and CSS is 13,181 bytes raw / 3.83 kB gzip. The hero image is 73,194 bytes. All are within the static budget.
- This is a static product: it exposes no product server-side API or sign-in flow, so no product rate-limit or identity-provider check applies.

## Defects by severity

No critical, high, or medium defects found.

**Low — tooling coverage:** the repository has no configured standalone TypeScript type-check or lint command (`tsconfig.json` is absent). The Vite production build succeeds. Adding an explicit TypeScript configuration/check in a future change would make that quality gate more transparent; it is not a runtime or release defect for this candidate.

