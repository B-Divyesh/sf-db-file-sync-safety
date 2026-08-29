# Independent verification 5 — PASS

**Candidate:** `4330e016293ae9bf9d6ca349e8f7ed198f1e8303`

**Live URL:** <https://db-file-sync-safety.sociobot.in>

**Verified:** 2026-08-29 UTC

**Work order:** `db-file-sync-safety-verify-5`

## Verdict

**PASS — accept candidate `4330e016293ae9bf9d6ca349e8f7ed198f1e8303`.**

The candidate completes the researched SQLite/WAL safety job. The first-read and one-click demo gates pass, all 11 declared claims pass from the clean checkout after the documented install, the full test/build/package matrix passes, the source remains byte-identical in independent closed/read-only/active WAL checks, the published v0.1.2 binary and installer work, and the live site matches the candidate build byte-for-byte.

No P0 or P1 release-blocking defects were found. One P2 recovery-message limitation for SQLite persistent rollback journals is recorded below; it is outside the brief's SQLite/WAL success contract and fails safely without publishing a packet.

## First-read hard gate — PASS

A cold live visit answered the required questions on the first screen:

- What: **“Make SQLite snapshots safe to sync.”**
- Who: **“For developers syncing app folders…”**
- Outcome: it blocks raw database copies and creates a verified packet.
- First action: **“Try it with sample data.”**
- Adjacent explanation: **“See a live WAL become a verified packet.”**

At 390×844, the heading begins at y=143 and the 350×44 sample action is fully visible at y=417. One keyboard-activated click opens `/demo`. The destination immediately shows the realistic `field-notes.sqlite` WAL flow, the four-note verified result, and the persistent **“Demo — sample data, nothing is saved”** banner with **Reset demo** and **Start for real**.

## Mandatory claim contract — PASS

`.factory/claims.json` exists and contains 11 entries. Each ID occurs exactly once as `@claim:<id>` in the test suite. After `npm ci`, every exact command was run separately against the product's demo entry point; every command exited 0 and selected one Playwright test.

| Claim | Result |
| --- | --- |
| `sqlite-wal-detection` | PASS |
| `consistent-snapshot` | PASS |
| `readonly-source-snapshot` | PASS |
| `verified-restore` | PASS |
| `demo-restored-count` | PASS |
| `json-output` | PASS |
| `local-execution` | PASS |
| `no-telemetry` | PASS |
| `github-release-cache` | PASS |
| `mit-free` | PASS |
| `installer-checksum` | PASS |

Each invocation also passed all 9 Rust integration tests and rebuilt the production site. The claims cover the material landing-page and README promises; no unsupported release-blocking claim was found.

Setup note: an intentionally literal pre-install invocation from the untouched clone reached the Rust tests but stopped at `vite: not found`. This was dependency setup, not a product assertion failure. `npm ci` is the documented prerequisite; the clean installed run above is the acceptance result.

## Clean checkout and quality gates — PASS

- Initial HEAD: exact requested commit; tracked worktree clean.
- `npm ci`: PASS; 22 packages, 0 vulnerabilities.
- `npm test`: PASS; 9 Rust integration tests and 17 Playwright tests.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- Type check with TypeScript 5.9.3 against `site/src/site.ts`: PASS.
- No separate repository lint script exists; Rust clippy and the direct TypeScript check cover the available sources.
- Exact `npm run build`: PASS; produced `target/release/dbsync-safe` and `dist/site/`.
- Production site: 14.89 KB JavaScript / 5.21 KB gzip; 13.15 KB CSS / 3.82 KB gzip; 73.19 KB hero WebP.
- `cargo package --locked`: PASS; Cargo verified the clean package build.
- Clean consumer `cargo install --path target/package/db-file-sync-safety-0.1.2 --root <temp> --locked`: PASS.
- Installed consumer: `dbsync-safe 0.1.2`; useful `--help`; JSON demo found WAL/SHM and completed verified restore.
- Candidate GitHub CI run `33232696955`: PASS.

## Independent CLI exercise — PASS

An independent harness used the clean consumer binary, not repository helper functions. Twenty checks passed:

- found two SQLite databases, including a nested extensionless file;
- `guard` returned 2 for a SQLite folder and 0 for an empty folder;
- created and verified a two-entry checksummed packet;
- preserved the complete closed source tree, including paths, modes, sizes, and SHA-256 values;
- restored both databases with the expected 3-row and 2-row contents;
- refused an existing packet and preserved an existing restore target;
- restored both databases only after explicit `--force`;
- rejected a tampered packet before creating its target;
- rejected `../escape.sqlite` in a manifest and wrote nothing outside the target;
- returned actionable JSON for empty and missing inputs without publishing packets;
- snapshotted an active 200-row WAL database, preserved the main/WAL/SHM tree byte-for-byte, restored all 200 rows, and returned `integrity_check = ok`.

An independent rollback-lock probe held an exclusive uncommitted transaction. Snapshot failed safely after 2.019 seconds, said to close the app, published no packet, and left no partial directory.

The repository's 20-scenario Rust regression also passed. It varies row count, nesting, and WAL state; every scenario blocks raw copying and restores the expected rows.

## Live deployment identity and routing — PASS

All 13 deployable files in fresh `dist/site/` match live responses byte-for-byte, including HTML, hashed JS/CSS and source map, hero/OG/icon assets, installers, sitemap, robots, and the static 404. Representative hashes:

- `index.html`: `b385c42b8c308268f6fe753a0043c13140560764dc9bfa33adddd3c56af90fad`
- JavaScript: `0f4fd5eea08a8aa5ae324f5c9189caab7fc7face8047b673a255de54c1b87dd6`
- CSS: `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08`
- hero: `83424c8f3662842245432fa77a8bd98a38522c6c06c4fa4392eded6ba9a05513`

`/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific titles. An unknown route returns a designed HTTP 404 at `/404`, one `<h1>`, one `<main>`, `lang=en`, no overflow, and zero Axe violations. Chromium reports the expected failed-document console message for the intentional HTTP 404 only; all normal routes are console-clean.

The v0.1.2 release tag points to `6063c38c2268b3f5d9744f13e2d6c43f91ba6a82`, an ancestor of the candidate. The only tag-to-candidate changes are the handoff, package-manager manifests, and the live audit script; CLI and site implementation are identical. This preserves binary provenance while the candidate records the published hashes and evidence.

## Accessibility and responsive behavior — PASS

- `/opt/fleet/lib/verify-url.sh`: PASS; title, `lang=en`, one h1, main landmark, image alt text, and zero console errors.
- Axe on `/`, `/demo`, `/privacy`, `/terms`, and the static 404 at desktop and 390px: zero violations (therefore zero serious/critical findings).
- No 390px horizontal page overflow and no interactive target below 44×44 CSS pixels.
- Keyboard traversal starts at the skip link and reaches every header/action control. Each inspected focus state uses a visible 3px amber outline with 4px offset.
- Enter activates the sample link, route focus moves to the demo h1, Space resets the demo, the reset is announced, and browser Back restores heading focus. No trap was observed.
- At reduced motion, the integrity sweep is hidden, terminal delays are removed, transforms are removed, and scrolling is instant.
- 200% browser zoom retained the heading, controls, result, and footer.
- Desktop and mobile screenshots were visually inspected. The mobile hierarchy remains legible and the terminal is intentionally horizontally scrollable inside its own region.

## Privacy, network, and security — PASS

A cold landing interaction requested only:

- same-origin HTML, hashed JavaScript/CSS, and hero image;
- `https://api.github.com/repos/B-Divyesh/sf-db-file-sync-safety/releases?per_page=1` for public release metadata.

A fresh complete `/demo` interaction used only same-origin requests, set no cookies, left localStorage and sessionStorage empty, and registered no service worker. The landing page stores only `dbsync-safe:release`, expiring after one hour. No analytics, ads, third-party fonts/scripts, telemetry, Sociobot unlock call, or model endpoint was observed. The CLI dependency lock contains no HTTP client and the exercised binary made no product network request.

Live headers include HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and a restrictive CSP. `connect-src` permits only self and the disclosed GitHub API. HTML uses `public, must-revalidate, max-age=30`; hashed JS/CSS use `public, max-age=31536000, immutable`.

This is a static site plus local CLI. There is no product backend, server-side endpoint, sign-in, payment, unlock endpoint, or PWA/service worker. API rate-limit/429, Entra authority, backend persistence/health, and service-worker update checks are therefore not applicable. AI would add no useful leverage to this deterministic safety check.

## Performance — PASS

Fresh live Lighthouse 13.4.1 mobile results:

| Metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.814 s |
| LCP | 1.537 s |
| CLS | 0.0239 |
| Total blocking time | 133 ms |
| Total transfer | 87,968 bytes |

The JavaScript, CSS, image, LCP, CLS, and transfer budgets pass. Lighthouse does not report a lab INP value; keyboard and click interactions completed without observable delay.

## Release and installers — PASS

- Release workflow run `33232384048` passed at the v0.1.2 implementation commit.
- GitHub Release v0.1.2 contains Linux tar/DEB/RPM, Windows x64 zip, Intel and Apple-silicon macOS tar/PKG, `SHA256SUMS`, and `latest.json`.
- `latest.json` parses as version 0.1.2 and lists all eight platform packages.
- Downloaded Linux tarball matched published SHA-256 `af8b4a7627a6b69dcc123524cdb330fcd4e37841e45c034757011bc7534625e7`.
- Extracted public binary reported 0.1.2 and passed its JSON demo.
- The live shell installer installed the checksum-verified public binary into a clean prefix; it reported 0.1.2.
- The Homebrew tap exists and its public formula is byte-identical to the candidate formula. Scoop and winget manifests point to v0.1.2 and carry the published Windows hash.
- Browser OS selection links Linux to the neutral tarball and sends macOS users to explicit architecture choices. Every discovered live link returned a successful response after redirects.

## Defects and known limits

### P0/P1 — none

No release-blocking defect was found.

### P2 — closed `journal_mode=PERSIST` gives an unrecoverable close-app instruction

A closed SQLite database in persistent rollback-journal mode leaves `persist.sqlite-journal` by design. The CLI waits 2.014 seconds, returns “SQLite stayed locked… Close the app and try again,” publishes no packet, and preserves the source. Closing the app cannot remove a persistent journal, so the recovery instruction is incomplete. A future release should recognize a safely finalized persistent journal or explicitly say this journal mode is unsupported and explain how to create a supported snapshot.

This is not verdict-driving: the researched smallest useful product and success measure are specifically SQLite plus WAL, all WAL workflows pass, and this boundary fails closed without changing source data.

## Retest command summary

```sh
npm ci
npm test
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts
npm run build
cargo package --locked
node scripts/live-audit.mjs https://db-file-sync-safety.sociobot.in
```
