# Independent verification 2 — FAIL

**Candidate:** `308e0c483b17b12cefaab876484d780c733577fe`  
**Live URL:** <https://db-file-sync-safety.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Work order:** `db-file-sync-safety-verify-2`

## Verdict

**FAIL — do not accept this candidate.**

The earlier immutable-cache blocker is repaired and deployed. Core SQLite behavior, every declared claim command, the clean build, release artifacts, live deployment identity, automated accessibility checks, security headers, privacy behavior, and performance budgets all pass. The candidate still violates two explicit acceptance contracts: several mobile controls are below the required 44-pixel touch target, and `.factory/claims.json` does not list every public claim or adequately prove the installer-checksum claim.

## Release-blocking defects

### P1 — mobile links do not meet the 44-pixel touch-target baseline

At a 390×844 touch viewport, computed bounding boxes on the live deployment were:

| Route/control | Width | Height |
| --- | ---: | ---: |
| Footer Privacy | 47.1 px | 20.1 px |
| Footer Terms | 38.3 px | 20.1 px |
| Footer Built by Param Factory | 146.5 px | 20.1 px |
| Demo banner Start for real | 102.8 px | 21.7 px |
| Privacy page public repository | 150.9 px | 21.0 px |

The footer defect occurs on `/`, `/demo`, `/privacy`, `/terms`, and the designed not-found page. The attached accessibility and design contracts require every touch target to be at least 44×44 CSS pixels. Axe does not detect target sizing, so its otherwise clean result does not clear this defect.

### P1 — public claims are missing from the claim registry, and one listed test does not prove its claim

The live first screen says **“Runs on your device.”** The privacy route says **“The site may cache public GitHub release details for one hour”** and **“The landing page asks GitHub for the latest public release.”** These are observable product/privacy claims, but `.factory/claims.json` has no claim entry that names and tests the landing page's outbound request and one-hour local-storage behavior. The existing `no-telemetry` test visits only `/demo`, where it correctly observes same-origin requests and empty storage; it cannot prove the landing-page statements. A fresh landing visit actually made the disclosed `api.github.com` request and stored one `dbsync-safe:release` record with a one-hour expiry.

The listed `installer-checksum` test supplies a correct checksum and asserts that installation succeeds. It never supplies a mismatch and never asserts that a bad archive leaves the install directory unchanged. The test would therefore still pass if checksum rejection were removed, contrary to the claims contract's requirement to prove the promised outcome. An independent negative test confirmed that the current installer implementation is correct (`exit 1`, “checksum failed,” zero installed files), but the required automated claim test does not establish that guarantee.

The claims contract explicitly makes an unlisted claim a failing review condition. This finding is independent of the fact that all seven declared commands pass.

## Other defects

### P2 — the binary release tag is not the verified candidate

Annotated tag `v0.1.0` dereferences to `feb4bf046d2fd6f3d82729c67538d97c131517d5`, not candidate `308e0c483b17b12cefaab876484d780c733577fe`. There is no diff in `src/`, `Cargo.toml`, `Cargo.lock`, `examples/`, or `tests/safety.rs` between them, so this is traceability debt rather than evidence of a different CLI binary. Future releases should tag the exact accepted commit.

### P2 — unknown application routes are soft 404s

`/definitely-missing-verifier-path` renders the designed not-found UI but returns HTTP 200. Missing excluded assets do correctly return HTTP 404 through `404.html`. The site-structure contract calls for a real 404 route; arbitrary document paths should not be indexed as successful pages.

## First-read hard gate — PASS

The live page was opened cold in a fresh 1440×900 browser context before implementation copy was reviewed.

- What it does: **“Make SQLite snapshots safe to sync.”**
- For whom: **“For developers syncing app folders…”**
- First click: **“Try it with sample data.”**
- Adjacent outcome: **“See a live WAL become a verified packet.”**

The action opens `/demo` in one click. The demo immediately shows the sample workflow and a persistent **“Demo — sample data, nothing is saved”** banner with **Reset demo** and **Start for real**. The hard first-read gate passes.

## Declared claim commands — PASS

After `npm ci` in the clean candidate checkout, every exact `.factory/claims.json` command passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| SQLite/WAL detection and raw-copy block | `npm test -- --grep @claim:sqlite-wal-detection` | PASS, 1/1 |
| Consistent checksummed snapshot | `npm test -- --grep @claim:consistent-snapshot` | PASS, 1/1 |
| Verified restore | `npm test -- --grep @claim:verified-restore` | PASS, 1/1 |
| JSON output | `npm test -- --grep @claim:json-output` | PASS, 1/1 |
| No telemetry / unsaved demo | `npm test -- --grep @claim:no-telemetry` | PASS, 1/1 |
| MIT/free | `npm test -- --grep @claim:mit-free` | PASS, 1/1 |
| Shell-installer checksum | `npm test -- --grep @claim:installer-checksum` | PASS, 1/1; coverage defect above |

Each invocation also passed the 5-test Rust integration suite and rebuilt the production site before running its selected browser test.

## Clean checkout, test, build, and package evidence

- `npm ci`: PASS; 22 packages installed, 0 vulnerabilities.
- `npm test`: PASS; 5 Rust integration tests and 10 Playwright tests.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts`: PASS.
- There is no repository lint script.
- Exact `npm run build`: PASS; optimized `target/release/dbsync-safe` plus `dist/site/`.
- `cargo package --locked`: PASS from the clean candidate tree, including Cargo's package verification build.
- `cargo install --path target/package/db-file-sync-safety-0.1.0 --root <clean-temp> --locked`: PASS; the installed binary reported 0.1.0 and completed `--json --demo`.

## CLI end-to-end and recovery evidence — PASS

The optimized candidate binary was exercised independently of the repository tests.

- `--help` documents all commands, `--version` reports `dbsync-safe 0.1.0`, and commands are non-interactive.
- `--json --demo` found `field-notes.sqlite-wal` and `field-notes.sqlite-shm`, reported `raw_copy_safe: false`, created an integrity-checked packet, and verified the restore.
- `guard` returned exit 2 for the live SQLite bundle and exit 0 for an empty folder.
- Missing source, empty snapshot source, and pre-existing packet paths failed with actionable errors.
- A truncated packet database failed checksum verification before a target directory was created.
- An existing restore target was refused without `--force` and remained byte-identical; explicit `--force` restored a verified database.
- A nested Unicode path containing an extensionless SQLite database scanned, snapshotted, and restored successfully.
- During 500 committed writes to a 50,000-row WAL database, scan detected WAL/SHM, snapshot and restore completed, and the restored database contained 50,500 rows with `PRAGMA integrity_check = ok`.

The built-in 20-scenario integration test also passed all SQLite/WAL guard and restore cases.

## Published installer and release evidence — PASS with provenance note

- GitHub release `v0.1.0` exposes Linux `.deb`, `.rpm`, and tarball; Windows x64 zip; Intel and Apple-silicon macOS tarballs and unsigned `.pkg` files; `SHA256SUMS`; and `latest.json`.
- `latest.json` parsed and lists all eight platform/package files.
- Downloaded `dbsync-safe-linux-x86_64.tar.gz` matched published SHA-256 `dbc74bedea6eed268092dc707bc306519b45300166af1091c3632c90e4bda5a2`.
- The unpacked public binary reported 0.1.0 and completed the JSON demo.
- The live `install.sh`, run into a clean temporary prefix, installed that binary and printed its location.
- A deliberately incorrect checksum made the shell installer return 1 and install zero files.
- Local Homebrew, Scoop, and winget checksums match the release. The external Homebrew tap formula exists and matches the repository formula.

## Live deployment identity and caching — PASS

Fresh candidate build files were compared byte-for-byte to live responses. All matched: `index.html`, hashed JS and CSS, hero and Open Graph images, favicon, Apple icon, both installers, robots, sitemap, and `404.html`.

- Live JS SHA-256: `5e1493a44670cbfd423ec4c83af007c4608a4c03005b3f94c679c2b49c885db4`.
- Hashed JS and CSS: `Cache-Control: public, max-age=31536000, immutable`.
- HTML: `Cache-Control: public, must-revalidate, max-age=30`.

This independently confirms that the earlier cache-policy blocker is fixed on the deployed candidate.

## Browser, accessibility, privacy, and security evidence

- Desktop and 390×844 mobile: no horizontal overflow, no normal-load console errors, and no page errors.
- `/`, `/demo`, `/privacy`, `/terms`, and the not-found UI: one `<h1>`, one `<main>`, `lang=en`, route-specific titles and canonicals, and zero Axe violations of any impact.
- Keyboard: first Tab reaches the skip link; all tested controls receive a visible 3-pixel amber focus outline; no trap; SPA navigation and browser Back focus the new route heading.
- Reduced motion: landing terminal rows resolve to 0.00001-second animation with no delay or transform; the landing integrity sweep is hidden and scrolling is instant.
- Demo privacy: only three same-origin requests, no cookies, empty localStorage/sessionStorage after Reset demo.
- Landing privacy: only the documented GitHub API origin is contacted in addition to same-origin assets; one namespaced public-release cache record is stored.
- Security headers: HSTS, restrictive CSP, `nosniff`, strict-origin referrer policy, and disabled camera/microphone/geolocation.
- Every discovered live anchor resolved successfully, including the selected Linux package.
- GitHub API failure renders the calm release-page fallback. The intentionally aborted request is caught by the application.

No product server endpoint, sign-in, payment/unlock call, service worker, or offline/PWA claim exists. API rate-limit, Entra authority, backend persistence, and service-worker update tests are therefore not applicable. The only runtime third-party endpoint is GitHub's public release API. No `verify-url.sh` is shipped; its title/lang/main/alt/console checks were covered in the live browser audit.

## Performance — PASS

Live mobile Lighthouse 13 produced:

| Metric | Result |
| --- | ---: |
| Performance | 97 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| LCP | 1.380 s |
| CLS | 0.024 |
| Total blocking time | 181 ms |
| Total transfer | 87,780 bytes |

Fresh production output is 5.19 KB gzip JavaScript and 3.80 KB gzip CSS. The hero WebP is 73,194 bytes and no webfont is transferred. All stated bundle and image budgets pass.

## Required retest

1. Give every mobile link/button/summary a 44×44 CSS-pixel target without introducing overlap.
2. Add claim entries and observable sandbox tests for the landing page's local execution wording, outbound GitHub request, and one-hour release cache.
3. Change the installer checksum claim test to provide a mismatched digest and assert a nonzero exit plus no installed file; retain a success-path test outside the one claim tag if desired.
4. Return HTTP 404 for arbitrary missing document routes, then rerun route/crawl checks.
5. Run all exact claim commands, the complete test/build/package matrix, 390px touch-target measurements, and the live deployment identity/header checks again.
