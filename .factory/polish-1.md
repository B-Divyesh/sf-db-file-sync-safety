# Polish round 1 — finding closure

Completed 29 August 2026 for work order `db-file-sync-safety-polish-1`.

All findings in `.factory/review-1.md` are closed. No earlier `.factory/polish-*.md` existed. Earlier verification findings were rechecked through the cumulative handoff history.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Distinguish hot rollback journals from finalized `journal_mode=PERSIST` journals, copy finalized journals into private staging, and snapshot/restore without changing the source. Active writers still stop within two seconds. | `closed_persistent_journal_snapshot_preserves_source_and_restores`; `@claim:persistent-journal-snapshot`; published 0.1.3 probe in `.factory/evidence/polish-1/published-persistent-journal.txt`. |
| F-1-2 | Replaced the unprovable “does not read your files” wording with the precise temporary-folder behavior. | `@claim:local-execution`; live `/?demo=1`; `.factory/evidence/polish-1/live-mobile-demo.png`. |
| F-1-3 | Split account, network, telemetry, and browser-storage statements into registered claims. The network test denies and records IPv4/IPv6 sockets for every CLI operation. | `@claim:no-account`, `@claim:no-network`, `@claim:no-telemetry`; live audit reports privacy pass and zero service workers. |
| F-1-4 | Expanded the JSON test across scan, guard, snapshot, verify, restore, `demo`, and `--demo`, including every applicable error path. | `@claim:json-output`. |
| F-1-5 | Registered overwrite refusal and assert that the rejected restore leaves sentinel bytes unchanged. | `@claim:restore-overwrite-refusal`. |
| F-1-6 | Added a syscall interposer that records file-open flags for closed WAL, active WAL, and persistent-journal snapshots. Source paths must be read-only; SQLite's read-write open must target private staging. | `@claim:source-open-isolation`. |
| F-1-7 | Registered release-asset and package-manifest claims. Tests inspect the live latest GitHub release, `latest.json`, and local Homebrew, Scoop, and winget metadata. | `@claim:release-assets`, `@claim:package-manifests`; release run `33236118857`; all eight payload checksums passed. |
| F-1-8 | Registered build and release workflow claims. The build test runs the 20-scenario regression and the production build; the workflow test checks every platform/package and manifest step. | `@claim:build-contract`, `@claim:release-workflow`; clean `npm run build`; clean `cargo package --locked`. |
| F-1-9 | Replaced “preflight” with “sync check” and expanded write-ahead log (WAL) and shared-memory (SHM) on first use in the site and README. | `.factory/copy-audit.md`; live `/`; `.factory/evidence/polish-1/live-mobile-home.png`. |
| F-1-10 | Rewrote both transformation claims to say the CLI includes a live log in a separate packet and blocks raw copying before creating that packet. | Live `/`; `.factory/copy-audit.md`. |
| F-1-11 | The visible terminal button now says “Copy demo command” and changes to “Demo command copied.” | Browser integration suite; live `/`. |
| F-1-12 | Renamed the demo exit to “Install the CLI”; it routes to `/#install`. | Route/demo integration test; live `/?demo=1`. |
| F-1-13 | Added per-route descriptions, OG title/description/URL, Twitter title/description, canonicals, and robots policy. Unknown paths now return a standalone styled HTTP 404 with `noindex`. | `route metadata, demo query entry, reset, focus, and not-found indexing are real`; `.factory/evidence/polish-1/live-routes.json`; live unknown path returned 404. |

## Additional acceptance checks

- One click from the first screen opens `/?demo=1`; the banner, reset action, isolated no-storage behavior, and install exit pass locally and live.
- Every route carries Privacy and Terms links. History navigation restores heading focus; the skip link is first; reduced motion, 200% zoom, 390 px and 320 px layouts pass.
- Clean clone: all 21 exact commands in `.factory/claims.json` passed individually. The complete suite passed with 10 Rust and 28 Playwright tests.
- Live: `.factory/evidence/polish-1/verify.json` reports the demo title, `lang=en`, one h1/main, labeled controls, alt coverage, and zero console errors.
- Live browser audit: five routes at desktop and mobile, zero Axe violations, zero console errors, no overflow, no small touch targets, privacy pass, keyboard/focus pass.
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.2 s, CLS 0.019, TBT 10 ms, 86 KiB transfer. Report: `.factory/evidence/polish-1/lighthouse.json`.
- All 14 deployable files match production byte-for-byte; hashes are in `.factory/evidence/polish-1/deployment-hashes.txt`.

## Live URLs checked

- <https://db-file-sync-safety.sociobot.in/>
- <https://db-file-sync-safety.sociobot.in/?demo=1>
- <https://db-file-sync-safety.sociobot.in/demo>
- <https://db-file-sync-safety.sociobot.in/privacy>
- <https://db-file-sync-safety.sociobot.in/terms>
- <https://db-file-sync-safety.sociobot.in/definitely-not-a-route> — HTTP 404 with the designed not-found page
- <https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/tag/v0.1.3>
