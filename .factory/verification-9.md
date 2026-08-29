# Verification 9 — PASS

**Candidate:** `e4ad51972499c0ce76d7fd703a696ae81424b467`
**Live URL:** <https://db-file-sync-safety.sociobot.in>
**Verified:** 29 August 2026 UTC
**Verdict:** **PASS**

## First-read result

Cold-opening the live landing page at 1440×900 gave this plain answer:

- It does: “Make SQLite snapshots safe to sync”; it blocks raw database copies and creates a verified packet.
- It is for: developers syncing app folders between devices.
- First action: the visible one-click **Try it with sample data** link.

The link opened `/?demo=1`. The isolated demo showed the bundled four-note WAL example, the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Install the CLI** to leave demo mode. Cold-page screenshot and captured DOM/network record: `verification-evidence/first-read-live-desktop-9.png` and `verification-evidence/first-read-live-9.json`.

## Required claim checks

`.factory/claims.json` exists and declares 21 checks. From a clean `npm ci` install, I ran every exact declared `npm test -- --grep @claim:<id>` command separately. All 21 passed:

`sqlite-wal-detection`, `consistent-snapshot`, `persistent-journal-snapshot`, `readonly-source-snapshot`, `source-open-isolation`, `verified-restore`, `restore-overwrite-refusal`, `demo-restored-count`, `json-output`, `local-execution`, `no-account`, `no-network`, `no-telemetry`, `github-release-cache`, `sqlite-only-scope`, `mit-free`, `installer-checksum`, `release-assets`, `package-manifests`, `build-contract`, and `release-workflow`.

One log per claim is retained in `verification-evidence/claims-9/`.

## Local candidate checks

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 0 reported vulnerabilities |
| `npm test` | PASS; 10 Rust integration tests and 30 Playwright tests (`verification-evidence/npm-test-9.log`) |
| `npm run typecheck` | PASS |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; creates `target/release/dbsync-safe` and `dist/site/` |
| `cargo package --locked --allow-dirty` | PASS |
| Clean consumer install | PASS; installed packaged crate into a new temporary Cargo root; its `dbsync-safe --json demo` returned `verified: true` and `raw_copy_safe: false` (`verification-evidence/consumer-cli-demo-9.json`) |
| `npm run test:performance` | PASS; local mobile Lighthouse 100 performance / 100 accessibility / 100 best practices / 100 SEO; FCP 1.5 s, LCP 1.5 s, TBT 10 ms, CLS 0.026, 87 KiB transfer (`verification-evidence/lighthouse-local-9.json`) |

Independent release-binary exercises used the actual release binary and the local candidate binary. Both completed the bundled demo with a verified restore and raw copy marked unsafe. Normal, boundary, and recovery CLI checks also covered a detected WAL bundle (`guard` exits 2), a non-SQLite folder (zero databases), and missing snapshot/packet paths (exit 1 with parseable JSON errors): `verification-evidence/cli-e2e-9.json`.

## Live deployment checks

The live `index.html`, hashed JS, hashed CSS, `404.html`, and hero image byte-match the candidate build. SHA-256 and response-header evidence is in `verification-evidence/deployment-identity-9.json`. The live site sends CSP with only `self` plus the documented `https://api.github.com` release lookup, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, permissions policy, and HSTS. Hashed JS/CSS are immutable for one year; HTML is revalidated every 30 seconds.

The page request log on a cold landing load contained only same-origin assets plus the declared GitHub Releases API request. In a fresh `/?demo=1` browser context, the demo made only same-origin requests, retained no local/session storage, cookies, or service workers, and reset successfully. Evidence: `verification-evidence/browser-qa-9.json`.

At both desktop and 390×844 mobile, `/`, `/demo`, `/privacy`, and `/terms` returned 200 with exactly one `main` and one `h1`, no horizontal overflow, no console/page errors, no Axe violations (including serious/critical), and no undersized interactive target. Keyboard testing confirmed the skip link is first and demo navigation moves focus to the new heading; reduced-motion testing hid the hero sweep and reduced terminal animation duration to `0.00001s`. Browser evidence and screenshots: `verification-evidence/browser-qa-9.json`, `live-demo-mobile-9.png`, and `live-skip-focus-9.png`.

The genuine missing route returns a 404 page with correct noindex metadata. Every discovered first-party, release-download, repository, and factory link returned below 400: `verification-evidence/routes-links-9.json`.

Fresh live mobile Lighthouse passed: 99 performance / 100 accessibility / 100 best practices / 100 SEO; FCP 1.6 s, LCP 1.6 s, TBT 0 ms, CLS 0.027, 86 KiB transfer (`verification-evidence/lighthouse-live-9.json`). Initial JS is 5.57 KiB gzip; CSS is 3.87 KiB gzip; the hero image is 73,194 bytes.

The public v0.1.3 Linux archive matched its published `SHA256SUMS`, and its extracted binary ran the verified demo. Candidate and release binary bytes differ because they were built in separate Rust build environments; the CLI source, Cargo manifest/lockfile, and examples are unchanged between the v0.1.3 source tag and this candidate, and both binaries passed the same direct demo exercise. Evidence: `verification-evidence/release-binary-identity-9.json` and `release-latest-9.json`.

This is a static site plus local CLI: it exposes no product server endpoint, sign-in flow, or product-unlock endpoint. The 429/`Retry-After` allowance check and Entra tenant check are therefore not applicable.

## Defects

No release-blocking, high, medium, or low-severity defects found.
