# Independent verification — FAIL

**Candidate:** `a0a646b5f2e6e73c0ad458f09cbfa078160f1bbd`  
**Live URL:** <https://db-file-sync-safety.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Verifier scope:** clean checkout, live deployment, published Linux release asset, and a clean temporary consumer directory.

## Verdict

**FAIL — do not accept this candidate until the production cache policy is corrected.**

The product and its demo work, all declared claims pass, and the live static content is byte-identical to a fresh build of the candidate. The deployed host nevertheless serves every static asset, including content-hashed JavaScript and CSS, with a 30-second revalidation lifetime. This fails the performance contract's required long-lived immutable caching for hashed assets.

## Release-blocking defect

### P1 — hashed static assets are not immutably cached

- Evidence, live `HEAD` responses:
  - `/assets/index-0dmFgyad.js`: `cache-control: public, must-revalidate, max-age=30`
  - `/assets/index-kHrlmiOK.css`: `cache-control: public, must-revalidate, max-age=30`
  - `/hero-database.webp`: the same policy
- `site/public/staticwebapp.config.json` contains no asset-specific `Cache-Control` route/header policy.
- Required outcome: cache content-hashed assets for a long lifetime (for example, `public, max-age=31536000, immutable`) while keeping HTML short-lived, then redeploy and verify the actual response headers.

### P2 — release provenance is not the candidate commit

- The published `v0.1.0` tag resolves to `feb4bf046d2fd6f3d82729c67538d97c131517d5`, while this verification target is `a0a646b5f2e6e73c0ad458f09cbfa078160f1bbd`.
- This is traceability debt rather than a demonstrated binary defect: `src/`, `Cargo.toml`, `Cargo.lock`, and the release workflow are unchanged between those commits. The live site assets are byte-identical to this candidate, and the release archive passed its checksum and functional demo tests.
- Future releases should tag the exact verified commit (or record the explicit source-equivalence decision).

## First-read test — PASS

Cold live landing screen says: **“Make SQLite snapshots safe to sync.”** It identifies the audience and change in plain words: “For developers syncing app folders, it blocks raw database copies and creates a verified packet.” The above-the-fold primary link is **“Try it with sample data”**, leading in one click to `/demo`. The demo banner says “Demo — sample data, nothing is saved” and includes Reset demo and Start for real.

## Claim contract — PASS

`npm ci` was run from the clean checkout. Every exact command in `.factory/claims.json` was run against the shipped demo entry point and passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| SQLite WAL detection / raw-copy block | `npm test -- --grep @claim:sqlite-wal-detection` | PASS |
| Consistent, checksummed snapshot | `npm test -- --grep @claim:consistent-snapshot` | PASS |
| Verified restore | `npm test -- --grep @claim:verified-restore` | PASS |
| JSON output | `npm test -- --grep @claim:json-output` | PASS |
| No telemetry / no saved browser demo state | `npm test -- --grep @claim:no-telemetry` | PASS |
| MIT free | `npm test -- --grep @claim:mit-free` | PASS |
| Installer checksum verification | `npm test -- --grep @claim:installer-checksum` | PASS |

The complete `npm test` run also passed: 5 Rust integration tests (including the 20 SQLite/WAL scenario test), all 7 claims, route/console/Axe checks, and the 390-pixel viewport/keyboard test — **9 Playwright tests passed**.

## Local build and CLI exercise — PASS

- `npm ci`: passed.
- `npm test`: passed.
- `npm run build`: passed; built `target/release/dbsync-safe` and `dist/site/`.
- No separate type-check or lint script is defined in `package.json`.
- `cargo package --locked`: passed, including package verification.
- A clean consumer downloaded `dbsync-safe-linux-x86_64.tar.gz` from the public v0.1.0 release. `sha256sum -c SHA256SUMS` passed; the unpacked binary reported `dbsync-safe 0.1.0`, displayed useful `--help`, and `--json --demo` reported a live WAL/SHM bundle, `raw_copy_safe: false`, and a verified restore.

Manual end-to-end and recovery paths with the candidate binary passed:

- demo scan found `field-notes.sqlite-wal` and `field-notes.sqlite-shm`; `guard` blocks raw copying;
- snapshot produced a verified packet and restore completed successfully;
- missing source path, empty non-SQLite source, and existing output each failed clearly without writing an output packet;
- a tampered snapshot failed checksum verification; restore was refused and created no target.

## Live deployment, privacy, accessibility, and performance

- Deployment identity: live `index.html`, the hashed JS/CSS, hero, OG image, favicon, installers, robots, sitemap, and 404 asset matched the fresh candidate build byte-for-byte. `/`, `/demo`, `/privacy`, `/terms`, and the 404 route returned 200 and rendered their intended SPA state.
- Browser checks at desktop and 390px: no console or page errors; no horizontal overflow at 390px; the first Tab reaches the skip link; the sample-data action is 350×44 CSS px at 390px. Reduced-motion CSS resolves animation/transition durations to `0.00001s`.
- Axe on each live route (`/`, `/demo`, `/privacy`, `/terms`, 404): zero serious or critical violations. Each has one `<h1>`, one `<main>`, and a route-specific title.
- Demo privacy: fresh `/demo` made only same-origin requests; localStorage and sessionStorage remained empty after reset. The landing page's only third-party request is the disclosed GitHub release metadata request to `api.github.com`; no analytics or telemetry was observed.
- Security policy: live responses include HSTS, CSP restricting scripts/styles/images to self (and `api.github.com` only for `connect-src`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive Permissions-Policy. There are no product server-side API endpoints, sign-in, or PWA/service-worker behavior, so rate-limit, identity-provider, and offline-update tests are not applicable.
- Every discovered live link resolved successfully, including the selected release download.
- Live mobile Lighthouse: Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.279 s**, CLS **0.024**, TBT **198 ms**, total transfer **87.7 KB**. The fresh production build reports JS **5.19 KB gzip**, CSS **3.80 KB gzip**, and hero WebP **73.2 KB**; all bundle budgets pass.

## Retest

After adding an immutable asset-cache policy and deploying it, rerun the header check above plus `npm test`, `npm run build`, and the live browser smoke. The existing application behavior does not require a code-level functional repair.
