# Polish round 2 — finding closure

Completed 29 August 2026 for work order `db-file-sync-safety-polish-2`.

All findings from `.factory/review-1.md` and `.factory/review-2.md` are closed. Review 1 fixes remain covered; review 2's production-only 404 gaps are repaired in the actual standalone document and in the SPA fallback.

## Cumulative finding map

| Finding | Change made | Test evidence | Screenshot and live check |
| --- | --- | --- | --- |
| F-1-1 | Finalized persistent rollback journals are copied into private staging and snapshot without changing the source; hot journals still stop safely. | `@claim:persistent-journal-snapshot`; Rust `closed_persistent_journal_snapshot_preserves_source_and_restores`. | `.factory/evidence/polish-2/demo/screenshot-desktop.png`; live `/?demo=1`. |
| F-1-2 | Removed the broad file-read promise and state only the demonstrated temporary-folder behavior. | `@claim:local-execution`. | `.factory/evidence/polish-2/demo/screenshot-mobile.png`; live `/?demo=1`. |
| F-1-3 | Account, network, and telemetry statements have separate behavioral tests; browser demo storage and requests are observed. | `@claim:no-account`, `@claim:no-network`, `@claim:no-telemetry`. | `.factory/evidence/polish-2/demo/screenshot-mobile.png`; live audit reports privacy pass and zero service workers. |
| F-1-4 | JSON coverage includes scan, guard, snapshot, verify, restore, `demo`, `--demo`, and error paths. | `@claim:json-output`. | `.factory/evidence/polish-2/demo/screenshot-desktop.png`; live demo and published binary checks passed. |
| F-1-5 | Overwrite refusal is registered and preserves the existing target bytes. | `@claim:restore-overwrite-refusal`; Rust `refuses_to_replace_a_target_by_default`. | `.factory/evidence/polish-2/home/screenshot-desktop.png`; live `/` documents the safe procedure. |
| F-1-6 | A syscall interposer verifies source opens stay read-only and SQLite's read-write open targets private staging. | `@claim:source-open-isolation`. | `.factory/evidence/polish-2/home/screenshot-desktop.png`; live `/` workflow copy matches the tested behavior. |
| F-1-7 | Release assets and Homebrew, Scoop, and winget manifests are registered and checked. | `@claim:release-assets`, `@claim:package-manifests`. | `.factory/evidence/polish-2/home/screenshot-desktop.png`; live `/` detects the v0.1.3 Linux archive. |
| F-1-8 | Documented build and release workflow statements are registered and verified. | `@claim:build-contract`, `@claim:release-workflow`; CI run `33239744097`. | `.factory/evidence/polish-2/home/screenshot-desktop.png`; live assets match the build. |
| F-1-9 | “Sync check” replaces “preflight”; write-ahead log (WAL) and shared-memory (SHM) are expanded on first use. | `route metadata, demo query entry, reset, focus, and not-found indexing are real`; `.factory/copy-audit.md`. | `.factory/evidence/polish-2/home/screenshot-mobile.png`; live `/`. |
| F-1-10 | Copy says the CLI includes a live log in a separate packet and blocks raw copying before creating one. | `@claim:sqlite-wal-detection`, `@claim:demo-restored-count`; copy audit. | `.factory/evidence/polish-2/home/screenshot-mobile.png`; live `/` and `/?demo=1`. |
| F-1-11 | The terminal action visibly says “Copy demo command” and confirms “Demo command copied.” | `route metadata, demo query entry, reset, focus, and not-found indexing are real`; full browser suite. | `.factory/evidence/polish-2/home/screenshot-desktop.png`; live `/`. |
| F-1-12 | Demo exit says “Install the CLI” and links to `/#install`. | `route metadata, demo query entry, reset, focus, and not-found indexing are real`. | `.factory/evidence/polish-2/demo/screenshot-mobile.png`; live `/?demo=1`. |
| F-1-13 | Every SPA route and the standalone HTTP 404 now have route-specific description, canonical, robots, Open Graph, and Twitter fields. | `route metadata, demo query entry, reset, focus, and not-found indexing are real`; deployed unknown-route audit. | `.factory/evidence/polish-2/live-desktop-404.png`; live `/definitely-not-a-route` returns 404. |
| F-2-1 | `404.html` now uses the complete header/footer shell, apple-touch icon, OG/Twitter image metadata, factory link, version, and build ID. The regression opens built `/404.html` directly. | `route metadata, demo query entry, reset, focus, and not-found indexing are real`; `all routes have one h1, useful titles, and no serious accessibility errors`; live audit. | `.factory/evidence/polish-2/live-desktop-404.png`; live unknown route has full metadata and shell. |
| F-2-2 | Standalone skip link is an inline-flex target with `min-height: 44px`; built 404 is included in the mobile target loop. | `all interactive targets are at least 44 by 44 pixels at the 390-pixel viewport`; live measured height 44 CSS px. | `.factory/evidence/polish-2/live-mobile-404.png`; live unknown route has no small target or overflow. |
| F-2-3 | Both not-found implementations now use “404 error,” “Page not found,” and direct recovery copy. | Metadata regression asserts the exact h1; `.factory/copy-audit.md`. | `.factory/evidence/polish-2/live-mobile-404.png`; live unknown route shows the plain wording. |

## Final acceptance evidence

- Clean no-hardlinks clone: all 21 exact commands in `.factory/claims.json` passed individually; every tag occurs exactly once.
- Full suite: 10 Rust integration tests and 28 Playwright tests passed. The browser suite covers demo/reset/focus, 404 metadata, mobile targets, Axe, privacy requests/storage, release caching, and installers.
- `cargo fmt --all -- --check`, strict Clippy, TypeScript checking, `npm run build`, `cargo package --locked`, and `git diff --check` passed.
- Published v0.1.3 Linux archive matched `SHA256SUMS`; its binary reported 0.1.3 and completed the JSON demo with raw copy blocked, integrity `ok`, and restore verified. `latest.json` contains eight package URLs. The live shell installer installed the checksum-verified binary to a clean temporary prefix.
- Production deployment `47bcda0f-5b69-45a8-ab8f-4abfc8eecf37` succeeded. Core build files match production byte-for-byte; see `.factory/evidence/polish-2/deployment-hashes.txt`.
- Cold live audit passed five normal routes plus the actual HTTP 404 at 1440×900 and 390×844: zero Axe violations, console errors, overflow, dead links, or small targets. Keyboard, Back/focus, reduced motion, privacy, 200% zoom, and download detection pass.
- `/opt/fleet/lib/verify-url.sh` passed on `/` and `/?demo=1`; reports and screenshots are under `.factory/evidence/polish-2/home/` and `demo/`.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.3 s, CLS 0.019, TBT 90 ms, 86 KiB transfer. Report: `.factory/evidence/polish-2/lighthouse.json`.
- Offline is not claimed and no service worker is registered. The isolated demo works without external requests; offline-reload testing is therefore not applicable.

No finding of any severity remains unresolved. The CLI installer and static deployment classes, v0.1.3 release, and luminous-glass visual system are unchanged.
