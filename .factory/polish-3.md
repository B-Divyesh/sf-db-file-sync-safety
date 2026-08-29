# Polish round 3 — zero-finding closure

Completed 29 August 2026 for work order `db-file-sync-safety-polish-3`.

This round starts at released candidate `2f7bff8d9600ddcb3279537a3798c03b3897604d` and rechecks every finding in reviews 1–3. Earlier functional, demo, claim, routing, metadata, 404, legal-link, mobile, and copy repairs remain in the product and are covered by the tests below. Round 3 closes the one remaining first-screen defect without changing the luminous-glass data landscape.

## Cumulative finding map

| Finding | Change made | Evidence and live check |
| --- | --- | --- |
| F-1-1 | Finalized persistent rollback journals are copied to private staging and snapshotted without changing their source; hot journals still stop safely. | `@claim:persistent-journal-snapshot`; Rust `closed_persistent_journal_snapshot_preserves_source_and_restores`; clean-clone transcript `evidence/polish-3/clean-clone-claims.log`; live demo screenshot `evidence/polish-3/live-demo-390x844.png`, <https://db-file-sync-safety.sociobot.in/?demo=1>. |
| F-1-2 | Replaced the broad file-read promise with the tested temporary-folder boundary. | `@claim:local-execution`; clean-clone transcript; `evidence/polish-3/live-demo-390x844.png`, <https://db-file-sync-safety.sociobot.in/?demo=1>. |
| F-1-3 | Separated account, network, telemetry, browser-request, and browser-storage behavior into registered tests. | `@claim:no-account`, `@claim:no-network`, `@claim:no-telemetry`; live audit `evidence/polish-3/live-audit.json`; <https://db-file-sync-safety.sociobot.in/privacy>. |
| F-1-4 | JSON coverage exercises scan, guard, snapshot, verify, restore, `demo`, `--demo`, and applicable errors. | `@claim:json-output`; clean-clone transcript; <https://db-file-sync-safety.sociobot.in/?demo=1>. |
| F-1-5 | Restore refusal preserves the pre-existing target byte-for-byte unless `--force` is supplied. | `@claim:restore-overwrite-refusal`; Rust `refuses_to_replace_a_target_by_default`; clean-clone transcript; <https://db-file-sync-safety.sociobot.in/>. |
| F-1-6 | A syscall interposer proves source paths are read only and SQLite opens only private acquisition/output copies. | `@claim:source-open-isolation`; clean-clone transcript; <https://db-file-sync-safety.sociobot.in/privacy>. |
| F-1-7 | Added and retained release-asset and Homebrew/Scoop/winget manifest claims. | `@claim:release-assets`, `@claim:package-manifests`; clean-clone transcript; <https://db-file-sync-safety.sociobot.in/#install>. |
| F-1-8 | Added build and release-workflow contract claims. | `@claim:build-contract`, `@claim:release-workflow`; clean-clone transcript; <https://db-file-sync-safety.sociobot.in/#install>. |
| F-1-9 | Uses “sync check” and expands write-ahead log (WAL) and shared-memory (SHM) on first explanatory use. | Copy audit `copy-audit.md`; `evidence/polish-3/live-home-390x844.png`, <https://db-file-sync-safety.sociobot.in/>. |
| F-1-10 | States that raw copying is blocked and that the CLI creates a separate packet. | `@claim:sqlite-wal-detection`, `@claim:demo-restored-count`; `evidence/polish-3/live-home-1440x768.png`, <https://db-file-sync-safety.sociobot.in/>. |
| F-1-11 | The visible terminal action says “Copy demo command” and confirms “Demo command copied.” | Browser suite `route metadata, demo query entry, reset, focus, and not-found indexing are real`; `evidence/polish-3/live-home-390x844.png`, <https://db-file-sync-safety.sociobot.in/>. |
| F-1-12 | The demo exit is named “Install the CLI” and routes to `/#install`. | Browser suite `route metadata, demo query entry, reset, focus, and not-found indexing are real`; `evidence/polish-3/live-demo-390x844.png`, <https://db-file-sync-safety.sociobot.in/?demo=1>. |
| F-1-13 | Every SPA route and the standalone production 404 use route-specific title, description, canonical, Open Graph, Twitter, and robots fields. | Browser suite `route metadata, demo query entry, reset, focus, and not-found indexing are real`; live audit; <https://db-file-sync-safety.sociobot.in/privacy>, <https://db-file-sync-safety.sociobot.in/terms>, and <https://db-file-sync-safety.sociobot.in/definitely-not-a-route>. |
| F-2-1 | The standalone HTTP 404 has the full site header/footer, icons, metadata, social image, factory link, and build label. | Browser metadata suite and live audit; `evidence/polish-3/live-404-390x844.png`, <https://db-file-sync-safety.sociobot.in/definitely-not-a-route>. |
| F-2-2 | Standalone 404 skip link is an inline-flex 44px target and is included in mobile target checks. | Browser suite `all interactive targets are at least 44 by 44 pixels at the 390-pixel viewport`; live audit; `evidence/polish-3/live-404-390x844.png`, <https://db-file-sync-safety.sociobot.in/definitely-not-a-route>. |
| F-2-3 | The standalone and SPA 404 now say “404 error” and “Page not found.” | Browser metadata suite; `copy-audit.md`; `evidence/polish-3/live-404-390x844.png`, <https://db-file-sync-safety.sociobot.in/definitely-not-a-route>. |
| F-3-1 | Reduced desktop hero padding, headline scale, and copy spacing so all three mandatory facts remain in the first viewport while retaining the asymmetric glass-art composition. Added an explicit viewport-bound browser regression and expanded the live audit to 1440×768. | Browser suite `the complete first-screen fact list is visible before scrolling at required viewports`; live measurements: fact bottoms 706.5/640.5/676.6 at 1440×900/1440×768/390×844; `evidence/polish-3/live-home-1440x768.png` and `live-home-390x844.png`; <https://db-file-sync-safety.sociobot.in/>. |

## Final evidence

- Fresh shallow clone + `npm ci`: all 21 exact commands in `claims.json` passed individually. Transcript: `evidence/polish-3/clean-clone-claims.log`.
- Local quality gates: `npm test` passed (10 Rust integration tests, 29 Playwright tests; `evidence/polish-3/npm-test.log`); `npm run build` produced `dist/site/`; `cargo fmt --all -- --check`, strict Clippy, `cargo package --locked --allow-dirty`, and `git diff --check` passed.
- Production: deployed `dist/site/` through the work-order Static Web App `sf-db-file-sync-safety`. `live-audit.json` reports 5 routes, the real HTTP 404, 3 viewports, zero Axe violations, zero console errors, keyboard/focus pass, reduced-motion pass, privacy pass, no service workers, 200% zoom pass, and 14 checked links.
- Factory URL verifier: `evidence/polish-3/verify-home/verify.json` and `verify-demo/verify.json` report HTTPS 200, route titles, `lang=en`, one h1/main, complete image alt coverage, labeled buttons, and zero console errors.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 0.8 s, LCP 1.7 s, CLS 0.026, TBT 20 ms, 86 KiB transfer. Report: `evidence/polish-3/lighthouse-mobile.json`.

No review finding remains open.
