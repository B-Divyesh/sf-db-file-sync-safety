# Repair 5 handoff — DB File Sync Safety

**Completed:** 29 August 2026 UTC  
**Work order:** `db-file-sync-safety-repair-5`  
**Base reviewed:** `72ae6a740ab389e90b5ab5491e8983579bb4303f`  
**Repair commit:** `410bafa`

## Repaired release blocker

Verification 8 reported a valid production mobile Lighthouse result of 82 performance and 700 ms total blocking time. I first reran its Chrome/Lighthouse-style audit against both the local production build and the live URL. This worker's repeatable runs were already 100/0 ms, so the exact 82/700 ms result could not be reproduced under this container's timing profile; raw reports are retained in `.factory/evidence/repair-5/lighthouse-local-before.json` and `lighthouse-live-before.json`.

The landing page nevertheless had avoidable first-view work. The repair:

- defers the below-fold GitHub release lookup until the page `load` event, after the LCP image, so its response parsing cannot compete with the first view;
- uses `content-visibility: auto` for below-fold sections, with an intrinsic size, to skip initial layout/paint work;
- preloads the one LCP hero image; and
- adds a browser regression that holds the hero request and proves the GitHub request does not begin on the critical image path.

`npm run test:performance` is now a pinned, repeatable production-preview mobile Lighthouse gate. It fails below 90. The report from this repair is `.factory/evidence/repair-5/lighthouse-mobile.json`: **Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.4 s, TBT 0 ms, CLS 0.026; 87 KiB transfer.**

An explicit strict TypeScript gate was also added: `npm run typecheck`.

## What was preserved

The CLI safety behavior, the bundled four-note WAL demo, installer checksum rejection, release/package claims, isolated browser demo, touch targets, real HTTP 404, privacy behavior, keyboard routing, reduced motion, and existing product-specific visual system were not changed.

## Verification performed

From a clean `npm ci` install:

- `npm test` — PASS: 10 Rust tests and 30 Playwright tests, including desktop/390px layout, touch targets, keyboard/focus, Axe, reduced-motion, privacy/storage, routes, and the performance-path regression.
- All 21 exact commands in `.factory/claims.json` — PASS individually; full transcript: `.factory/evidence/repair-5/claim-matrix.log`.
- `npm run typecheck` — PASS.
- `npm run build` — PASS; writes `target/release/dbsync-safe` and `dist/site/`.
- `cargo fmt --all -- --check` and `cargo clippy --all-targets --all-features -- -D warnings` — PASS.
- `cargo package --locked --allow-dirty` — PASS.
- Fresh consumer install from `target/package/db-file-sync-safety-0.1.3` — PASS; its JSON demo had `verified: true` and `raw_copy_safe: false`.
- `npm run test:performance` — PASS; report named above.
- Deployed production audit — PASS: five normal routes plus the real 404 at desktop, 390px mobile, keyboard/back focus, reduced motion, 200% zoom, Axe, touch targets, privacy/storage, no service worker, and link crawl all pass. `live-audit.log` holds the exact JSON result.
- Live mobile Lighthouse — PASS: **Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.4 s, TBT 0 ms, CLS 0.026.** `lighthouse-live-after.json` is the full report.
- Deployment identity — PASS: live `index.html`, hashed JavaScript/CSS, and the hero image byte-match the local `dist/site/` build. The static host returns immutable caching for hashed assets, 30-second revalidation for HTML/images, and the expected CSP/HSTS/nosniff/referrer/permissions headers.

## Run and deploy

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:performance
```

The static deployment target is unchanged:

```sh
swa deploy dist/site --swa-config-location site/public --resource-group sociobot --app-name sf-db-file-sync-safety --env production
```

This command completed successfully for repair commit `410bafa`.

## Known gaps

None. The CLI remains deliberately SQLite-only and continues to advise closing source applications and keeping an independent backup before `--force`.
