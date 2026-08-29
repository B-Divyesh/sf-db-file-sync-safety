# Handoff — adversarial first-read review 1

**Completed:** 2026-08-29 UTC<br>
**Work order:** `db-file-sync-safety-review-1`<br>
**Candidate:** `727b71e6ddcb9cc69c4da0de9656c0f202201f5d`<br>
**Result:** **FAIL**

No product code was changed. The full report is `.factory/review-1.md`.

## What was done

- Opened the live deployment cold in fresh 390×844 and 1440×900 browser contexts and recorded the first-read answers before scrolling.
- Audited every landing-page and README sentence/label for length, jargon, terminology, information value, and action naming.
- Exercised the one-click browser demo, Reset, Start for real, storage isolation, request isolation, and the real `dbsync-safe --json --demo` command from a temporary directory.
- Ran every exact command in `.factory/claims.json` after `npm ci` and `cargo clean`.
- Rechecked all earlier issues recorded in this handoff, live and in code.
- Crawled routes and links; checked 404 behavior, metadata, history/focus, keyboard use, reduced motion, 200% zoom, mobile targets, Axe, console output, security headers, and cache headers.
- Reproduced the remaining persistent rollback-journal limitation from a newly created closed SQLite database.

## Verification summary

- All 11 declared claim commands: PASS.
- `npm test`: PASS — 9 Rust and 17 Playwright tests.
- `npm run build`: PASS — release binary and `dist/site/` produced.
- `node scripts/live-audit.mjs https://db-file-sync-safety.sociobot.in`: PASS — 4 normal routes at both viewports, zero Axe violations or console errors, all links live, keyboard/reduced-motion/privacy/zoom checks pass.
- `/opt/fleet/lib/verify-url.sh <url> <temp-evidence-dir>`: PASS.
- Real CLI WAL demo: PASS — raw copy blocked, integrity `ok`, restore verified, all generated files under its process-specific temp root.
- Closed `journal_mode=PERSIST` probe: FAIL — exits after two seconds with “Close the app and try again” even though the app is already closed.

## Findings and next steps

`F-1-1` is blocking: implement a safe closed-persistent-journal snapshot or narrow the advertised journal-sidecar scope and provide a truthful recovery path. `F-1-2` through `F-1-8` cover unlisted or broader-than-tested privacy, isolation, JSON, overwrite, distribution, build, and release claims. `F-1-9` through `F-1-13` cover jargon, inaccurate transformation copy, two vague controls, and route metadata.

Re-run the complete review after repairs. PASS requires no remaining blocking or minor finding and no untested public claim.

---

# Earlier handoff — DB File Sync Safety v0.1.2

## Independent verification `db-file-sync-safety-verify-5` — PASS

**Verified:** 2026-08-29 UTC

**Candidate:** `4330e016293ae9bf9d6ca349e8f7ed198f1e8303`

**Live URL:** <https://db-file-sync-safety.sociobot.in>

**PASS — accept this candidate.** No P0 or P1 release-blocking defects were found.

Fresh evidence:

- All 11 exact `.factory/claims.json` commands pass after the documented clean `npm ci` install.
- `npm test` passes 9 Rust and 17 Playwright tests. Formatting, clippy with warnings denied, TypeScript checking, the exact production build, `cargo package --locked`, and a clean consumer install all pass.
- Independent closed and active WAL probes preserve the complete source tree byte-for-byte and restore expected rows with SQLite integrity `ok`. Invalid, tampered, overwrite, force, traversal, missing, empty, and locked recovery paths fail safely.
- All 13 deployable candidate files match the live site byte-for-byte. Desktop and 390px audits have zero Axe violations and zero normal-route console/page errors; keyboard, focus, reduced motion, 200% zoom, and touch targets pass.
- Live privacy logging shows only same-origin demo requests and the disclosed landing-page GitHub release lookup. Security headers and immutable hashed-asset caching are present.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.537 s, CLS 0.0239, total transfer 87,968 bytes.
- GitHub Release v0.1.2 has all required platform assets, checksums, and `latest.json`. The downloaded Linux asset passes its checksum and demo; the live shell installer installs it successfully.

One non-blocking P2 limitation remains: a closed SQLite database using `journal_mode=PERSIST` keeps its rollback journal, so snapshot fails closed after two seconds with a “close the app” instruction that cannot resolve this mode. The accepted brief and success measure target SQLite/WAL; WAL behavior passes.

Full commands, evidence, hashes, release details, and defect severity are in [`.factory/verification-5.md`](verification-5.md).

## Repair work order `db-file-sync-safety-repair-4` — PASS

**Completed:** 2026-08-29 UTC

**Rejected candidate:** `3568fc48836f43acb14d68e25d62bf202121d17c`

**Root-cause repair:** `6063c38c2268b3f5d9744f13e2d6c43f91ba6a82`

**Release:** `v0.1.2` at the exact root-cause repair commit

The researched SQLite safety job, CLI installer artifact class, static deployment class, and established visual system remain unchanged.

### Root cause and repair

- `SQLITE_OPEN_READ_ONLY` still let SQLite create WAL shared-memory state beside a closed source. It added a zero-byte `-wal`, added a 32 KiB `-shm`, changed the next scan result, and failed when the directory was genuinely read-only.
- Snapshot acquisition now copies only source database and WAL bytes into the packet's private staging area. SQLite opens that writable working copy and uses its backup API there. SQLite never opens the source database.
- Existing source SHM files are not copied or opened. Active-WAL regression coverage proves the main file, WAL, and SHM paths, modes, and bytes remain identical while committed WAL rows reach the snapshot.
- A persistent rollback journal remains a conservative blocked state. The CLI waits at most two seconds, removes its partial packet, and tells the user to close the app.
- The public installer sentence now promises only the tested shell checksum behavior. Mac browsers no longer guess CPU architecture from `MacIntel`, and Linux selects the distribution-neutral tarball instead of a Debian package.
- Version 0.1.2 records the safety change. The Homebrew, Scoop, and winget manifests use its published URLs and hashes.

### Exact source-tree evidence

- `closed_wal_database_snapshot_preserves_every_source_path_and_byte` starts from a closed WAL-mode database with only `closed.sqlite`, inventories the recursive tree and every file byte, snapshots, compares the entire tree, restores four rows, and passes.
- `active_wal_snapshot_preserves_existing_sidecar_bytes` holds an active WAL connection and proves the main file, WAL, and SHM bytes do not change during snapshot. Its restored row count is covered in the 20-scenario suite.
- `readonly_closed_wal_source_snapshot_preserves_exact_tree` snapshots a `0444` database inside a `0555` directory and compares the exact tree before and after.
- `@claim:consistent-snapshot` makes the same complete recursive path/type/mode/size/SHA-256 comparison for an ordinary closed WAL source.
- `@claim:readonly-source-snapshot` runs the production-shaped debug CLI as uid/gid 65534 when the test process is root. The `0555`/`0444` tree is identical and the packet passes SQLite integrity verification.
- The downloaded published Linux 0.1.2 binary was run separately against new ordinary and uid/gid-65534 read-only fixtures. Ordinary tree digests were `001d46d67bbde00a124912649be24879efb992129de56ed1f68f266de56b6e13` before and after. Read-only tree digests were `e96fa143a9bd03d50e36b116def4395de4f49b4540eaf0fc4c0fabacaa1a9075` before and after. Both snapshots verified and contained the committed row.

### Clean local verification

- `cargo clean` and `npm ci`: passed; 22 packages installed, 0 vulnerabilities.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts`: passed.
- Exact original production command `npm run build`: passed; produced `target/release/dbsync-safe` and `dist/site/`.
- `npm test`: passed; 9 Rust integration tests and 17 Playwright tests.
- Every one of the 11 exact commands in `.factory/claims.json`: passed independently and selected one tagged claim test.
- `cargo package --locked`: passed from clean commit `6063c38`; Cargo's clean verification build passed.
- Clean `cargo install --path target/package/db-file-sync-safety-0.1.2 --root <temp> --locked`: passed. The installed binary reported 0.1.2 and completed its verified JSON demo with integrity `ok`.
- Local mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.590s, CLS 0.0246, TBT 32ms, transfer 88,402 bytes.
- Production JavaScript is 14.89 KB raw / 5.21 KB gzip. CSS is 13.15 KB raw / 3.82 KB gzip.

### Release and installer verification

- GitHub release workflow run `33232384048` passed all Linux, Windows, Intel macOS, Apple-silicon macOS, and publish jobs.
- Release `v0.1.2` has eight package payloads plus `SHA256SUMS` and `latest.json`. All eight payloads passed `sha256sum -c`.
- `latest.json` reports version 0.1.2, tag `v0.1.2`, and all eight package URLs.
- The public Linux tarball SHA-256 is `af8b4a7627a6b69dcc123524cdb330fcd4e37841e45c034757011bc7534625e7`. Its binary reports 0.1.2 and passed both exact-tree probes above.
- The live shell installer installed the checksum-verified 0.1.2 binary into a clean prefix. That binary's JSON demo restored and verified with integrity `ok`.
- Public Homebrew tap commit `7a6f9f438ea2c96d384f5c20e322a81c40dfa7ff` has the 0.1.2 formula. Repository Scoop and winget manifests match the published Windows hash.
- CI runs `33232383485` for the tagged implementation and `33232526166` for the release-manifest commit passed.

### Deployment and live verification

- `dist/site/` was deployed with the configured factory static deployment to production resource `sf-db-file-sync-safety`; deployment id `52605ae1-02c9-4e0e-b251-4a9cada912a6` succeeded.
- All 13 public build files match the live site byte-for-byte. SHA-256: `index.html` `b385c42b8c308268f6fe753a0043c13140560764dc9bfa33adddd3c56af90fad`; JavaScript `0f4fd5eea08a8aa5ae324f5c9189caab7fc7face8047b673a255de54c1b87dd6`; CSS `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08`.
- `/`, `/demo`, `/privacy`, `/terms`, and `/404` return 200. An arbitrary document path returns HTTP 404.
- The factory `verify-url.sh` passed with the expected title, `lang=en`, one `<h1>`, one `<main>`, complete alt text, and no console errors.
- The repeatable `scripts/live-audit.mjs` covered all four normal routes at 1440×900 and 390×844: zero Axe violations, zero console/page errors, no overflow, and no target below 44×44 CSS pixels.
- Keyboard flow starts at the skip link, Enter opens Demo, route headings receive focus, and Back restores heading focus. Reduced motion hides the integrity sweep and reduces terminal animation. Content remains visible at 200% browser zoom.
- A fresh Demo run makes only same-origin requests, leaves cookies/localStorage/sessionStorage empty, and registers zero service workers. Offline/update behavior is not applicable because the product has no service worker and makes no offline claim.
- All 12 discovered links resolve. The detected Linux action links to the real 0.1.2 distribution-neutral archive. Mac shows explicit Apple-silicon and Intel choices.
- HTML uses `public, must-revalidate, max-age=30`; hashed assets use `public, max-age=31536000, immutable`. CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present.
- Live mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.206s, CLS 0.0239, TBT 7ms, transfer 87,973 bytes.

### Remaining operator notes

- Submit `winget/ParamFactory.DBSyncSafe.yaml` upstream when desired.
- macOS packages and the Windows binary remain unsigned, as stated on the site. Signing requires operator certificates.
- The release supports Linux x64, Windows x64, and both current macOS architectures. Linux ARM and Windows ARM are not included.
- This product has no backend, account, payment, AI action, analytics, or service worker. Related backend, payment, model, and offline-update checks are not applicable.

## Independent verification 4 — FAIL (superseded by v0.1.2)

**Verified:** 2026-08-29 UTC

**Candidate:** `3568fc48836f43acb14d68e25d62bf202121d17c`

**Live URL:** <https://db-file-sync-safety.sociobot.in>

**Report:** `.factory/verification-4.md`

**FAIL — do not accept or promote this candidate.**

Fresh verification found that snapshotting a closed WAL-mode SQLite database changes the source folder. Before snapshot the source contained only `app.sqlite`; afterward it also contained a zero-byte `app.sqlite-wal` and a 32 KiB `app.sqlite-shm`. The main-file hash stayed stable, so `@claim:consistent-snapshot` passed, but the complete source bundle did not stay unchanged and the tool's own scan changed from `ready_for_snapshot` to `snapshot_required`. The published v0.1.1 Linux binary reproduced the same defect. Against a genuinely read-only source directory, snapshot failed with `SQLite could not make a consistent snapshot ...: not an error` even though the output directory was writable. This violates the researched brief's source non-modification constraint and the live demo's “The source stayed unchanged” claim.

The live page also says plural **“Installers verify SHA-256 before changing your path,”** while `.factory/claims.json` and its test cover only the shell installer. That broader public promise remains unregistered and untested. Browser platform detection additionally labels common Apple-silicon Safari identifiers as macOS Intel and gives generic Linux/Fedora identifiers a Debian package.

All ten exact claim commands themselves exited 0. `npm ci`, `npm test` (6 Rust + 15 Playwright), format, Clippy, TypeScript, exact production build, `cargo package --locked`, and clean consumer installation passed. Normal, invalid, tampered, overwrite, traversal, symlink, bounded-lock, and 500-live-write CLI cases otherwise behaved safely. All 13 public build files matched the live deployment byte-for-byte. Normal live routes passed desktop/390px accessibility, keyboard, reduced-motion, privacy, security-header, caching, and link checks with zero Axe violations and no console/page errors. Live Lighthouse scored 96/100/100/100 with LCP 1.304s and CLS 0.0246. Release v0.1.1 has all required platform assets; the downloaded Linux archive matched SHA-256 and passed the demo. Full evidence and retest steps are in `.factory/verification-4.md`.

## Repair work order `db-file-sync-safety-repair-3` — PASS

**Completed:** 2026-08-29 UTC

**Verifier report:** `2f7e9c0b3f3ac0f9df7228fad204d7c04102b9ea`

**Rejected candidate:** `0e69eef3d1a42782dea2e22d01bb3eda25a89e81`

**Repair implementation and v0.1.1 tag:** `e7adb0e354215b796cfba643fed9c1df53dabb23`

All findings in `.factory/verification-3.md` are repaired. The researched brief, CLI artifact class, static deployment class, passed safety behavior, and visual system are unchanged.

### Reproduction and repairs

- The rejected browser demo said three notes were restored. A fresh candidate `dbsync-safe --json --demo` database contained four rows and one `Train changes` row written while WAL mode was active. The browser now reports all 4 notes and names the live-WAL note.
- `.factory/claims.json` registers `demo-restored-count`. Its one exact Playwright test runs the real CLI demo, queries the restored SQLite database, requires four rows and one live-WAL row, then compares that observed count with `/demo`.
- The rejected CLI remained silent under `BEGIN EXCLUSIVE` until external `timeout 3` returned 124. It left `packet.partial-<pid>/databases/locked.sqlite` at zero bytes. Snapshot backup now retries in small steps, returns a plain error after two continuous seconds of lock contention, and passes through the existing failure cleanup.
- `locked_database_fails_within_a_bound_and_removes_staging_files` holds a real exclusive SQLite lock and requires the bounded error, no published packet, and no partial directory.
- Version 0.1.1 records the changed CLI behavior. Tag `v0.1.1` resolves to the exact implementation commit above, closing the older-tag provenance finding.

### Local verification

- Clean `cargo clean` and `npm ci`: passed; 22 packages, 0 vulnerabilities.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- Standalone TypeScript check for `site/src/site.ts`: passed.
- Final `npm test`: passed; 6 Rust integration tests and 15 Playwright tests.
- Every one of the 10 exact commands in `.factory/claims.json`: passed independently. Each claim ID occurs in exactly one tagged test.
- `npm run build`: passed; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: passed, including Cargo's verification build.
- Clean consumer install from `target/package/db-file-sync-safety-0.1.1`: passed. The installed binary reported 0.1.1 and its restored database contained four notes, including one live-WAL note, with integrity `ok`.
- Local browser audit at 1440×900 and 390×844 covered `/`, `/demo`, `/privacy`, `/terms`, and the not-found UI. Every route had one `main`, one `h1`, `lang=en`, no page overflow, no console/page errors, and zero serious/critical Axe findings. Every mobile interactive target was at least 44×44 CSS pixels.
- Keyboard audit reached the skip link first and all 12 demo controls without a trap. Focus used the designed 3px outline, and browser Back restored focus to the landing heading.
- Reduced motion hid the integrity sweep and reduced terminal animation to `0.00001s`. At 200% zoom the demo retained its heading and footer without page overflow.
- Privacy audit: `/demo` made only same-origin requests and left cookies, localStorage, and sessionStorage empty. No service worker was registered. The product makes no offline claim, so offline/update testing is not applicable.
- Local Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5s, CLS 0.025, TBT 0ms, transfer 86KiB. Production JS is 14,747 bytes and CSS is 13,145 bytes.

### Release and installers

- GitHub Actions release run `33229880162` passed all Linux, Windows, Intel macOS, Apple-silicon macOS, and publish jobs.
- GitHub Release `v0.1.1` has eight platform/package payloads plus `SHA256SUMS` and `latest.json`. All eight payloads passed `sha256sum -c`.
- `latest.json` reports version 0.1.1, tag `v0.1.1`, and all eight payload URLs.
- The published Linux archive reports 0.1.1. Its demo restored four notes with one live-WAL note and integrity `ok`.
- The published Debian package reports `0.1.1-1`; its extracted binary reports 0.1.1.
- The live shell installer installed the checksum-verified v0.1.1 binary into a clean prefix. The mismatch regression still proves installation is refused before any file is installed.
- The tracked Homebrew, Scoop, and winget manifests use the v0.1.1 URLs and published hashes. Public Homebrew tap commit `fd34925` carries the same formula.

### Deployment and live verification

- `dist/site/` was deployed with Static Web Apps CLI 2.0.10 to production resource `sf-db-file-sync-safety` in resource group `sociobot`. The Azure hostname and <https://db-file-sync-safety.sociobot.in> serve the repair.
- All 13 public build files are byte-identical live. `staticwebapp.config.json` is host configuration and is correctly not public. Key SHA-256 values: `index.html` `cf84cc9cb17e1afe519b6759dcac9765acd317318ea45a8a8ddc4c738bfee734`; JS `c321653df69f09e95cfcfeb39e1677c07b9e5419451eaaf52d3a8ef7d468ed9e`; CSS `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08`.
- `/`, `/demo`, `/privacy`, `/terms`, and `/404` return 200. An arbitrary document path returns HTTP 404.
- HTML uses `public, must-revalidate, max-age=30`; hashed assets use `public, max-age=31536000, immutable`. CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present.
- The worker's `verify-url.sh` passed with no console errors. Live desktop and 390px mobile audits passed on all four normal routes with zero serious/critical Axe findings, no overflow, and no sub-44px targets.
- The live demo says four notes, makes only same-origin requests, stores nothing, and registers no service worker. The live landing detects Linux and links to the real v0.1.1 Debian asset without console errors.
- Live mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.6s, CLS 0.024, TBT 40ms, transfer 86KiB.

### Remaining operator notes

- Submit `winget/ParamFactory.DBSyncSafe.yaml` upstream when desired.
- macOS packages and the Windows binary remain unsigned, as stated on the site. Signing requires operator certificates and was not part of this repair.
- This product has no backend, account, payment, AI action, analytics, or service worker. Related rate-limit, authority, payment, model, and offline-update checks are not applicable.

## Independent verification 3 — 2026-08-29 UTC

**Status: FAIL — candidate `0e69eef3d1a42782dea2e22d01bb3eda25a89e81` is not accepted.**

All nine declared claim commands, the full clean test/build/package matrix, core SQLite safety paths, live deployment identity, installer/release checks, privacy, accessibility, caching, and performance passed. The first-read and one-click demo gates also passed.

The live demo nevertheless says **“Three notes reached a new folder”**, while both the candidate binary and published v0.1.0 binary deterministically restore **four** notes: three seeded rows plus the live-WAL “Train changes” row. This public quantitative statement is false and absent from `.factory/claims.json`, which is release-blocking under the claims contract. A secondary lock-recovery issue was also reproduced: an exclusive lock causes a silent unbounded wait, and external termination leaves a `.partial-*` staging directory. The public release tag still points to the older, source-equivalent CLI commit `feb4bf046d2fd6f3d82729c67538d97c131517d5`.

Full evidence and retest instructions are in `.factory/verification-3.md`.

## Repair work order `db-file-sync-safety-repair-2` — PASS

**Repaired and deployed:** 2026-08-28 UTC

**Verifier report:** `27c984051c1f3132e3d282464f6b922aed3468af`

**Rejected candidate:** `308e0c483b17b12cefaab876484d780c733577fe`

**Repair implementation:** `3cb325f9a74aa49b51ddb2942c7e632c6b1b1a4d` and `32ba1f30cf51ad042c570cb5fa9b9590c2912759`

All release-blocking findings in `.factory/verification-2.md` are repaired.

### Repairs

- Footer links, Demo's **Start for real**, and the Privacy repository link now expose at least 44×44 CSS-pixel targets. The regression checks every link, button, and summary on `/`, `/demo`, `/privacy`, `/terms`, and the not-found UI at 390×844.
- `.factory/claims.json` now registers the local-execution statement and the landing page's GitHub release request plus one-hour cache. Each claim has one exact tagged test.
- The GitHub cache claim test records the exact outbound origin and endpoint, checks the one-hour expiry, proves a reload uses the cache, and proves an expired record triggers a refresh.
- The installer checksum claim now supplies a deliberately wrong digest, requires a nonzero exit, checks the clear error, and proves the install folder remains empty. A separate success-path test remains.
- Known SPA routes now have explicit Static Web Apps rewrites. The broad navigation fallback was removed, so arbitrary document paths return HTTP 404 while `/404` keeps the designed route.
- A live mobile audit exposed the horizontally scrollable terminal as an unlabelled keyboard scroll region. It now has an explicit tab stop, and the 390px regression runs Axe on every route.

No Rust source, CLI behavior, package manifest, installer implementation, researched brief, public copy, or visual system changed.

### Verification evidence

- Clean `npm ci`: passed; 0 vulnerabilities.
- `npm test`: passed; 5 Rust integration tests and 14 Playwright tests.
- Every one of the 9 exact commands in `.factory/claims.json`: passed individually.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- TypeScript check for `site/src/site.ts`: passed. The repository has no separate lint script.
- `npm run build`: passed; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: passed from the final clean tree, including Cargo's package verification build.
- Clean consumer `cargo install` from `target/package/db-file-sync-safety-0.1.0`: passed. The installed binary reported 0.1.0 and its JSON demo reported raw copy blocked, SQLite integrity `ok`, and restore verified.
- Azure Static Web Apps emulator: `/`, `/demo`, `/privacy`, `/terms`, and `/404` returned 200; an arbitrary missing document and missing asset returned 404.
- Final live browser audit: 10 combinations across desktop 1440×900 and mobile 390×844. All had one `main`, one `h1`, `lang=en`, no horizontal overflow, no console/page errors, no sub-44px interactive targets, and zero serious/critical Axe findings.
- Keyboard: first Tab focused the skip link with a visible 3px amber outline. Demo controls, header links, terminal scroll region, copy action, and footer links were reachable without a trap.
- Reduced motion: terminal animations resolved to 0.00001 seconds and the landing integrity sweep was hidden.
- Privacy: a fresh Demo run made only same-origin requests and left cookies, localStorage, and sessionStorage empty. A fresh landing run contacted only `api.github.com` outside the site and wrote only `dbsync-safe:release`. No service worker is registered, so offline/update testing is not applicable and no offline claim is made.
- Response policy: HTML retains `public, must-revalidate, max-age=30`; hashed JS/CSS retain `public, max-age=31536000, immutable`; CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present. An arbitrary live path returns HTTP 404.
- Live identity: 13 deployed files matched `dist/site` byte-for-byte. Final SHA-256 values are `42bebde274a486f3e0495659963725f3df76f879b2de6a4182beaa6bcbb13b6b` for `index.html`, `45beac43f1223c90c85f2c215e904cc7f714714dc7fce4c5a413a4f544b08912` for `index-DMs0W6ts.js`, and `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08` for `index-DGiDdORx.css`.
- Live mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 seconds, CLS 0.023, TBT 30 ms, total transfer 86 KiB.
- Public release: `latest.json` is valid with all 8 package files. The Linux archive matches `SHA256SUMS`; its binary reports 0.1.0 and passes the JSON demo. The live shell installer installs that verified release into a clean prefix.
- GitHub CI run `33196414344` passed for final implementation commit `32ba1f30cf51ad042c570cb5fa9b9590c2912759`.

### Deployment

`dist/site/` from commit `32ba1f30cf51ad042c570cb5fa9b9590c2912759` was deployed to the Azure Static Web Apps production resource `sf-db-file-sync-safety` in resource group `sociobot`. Both the Azure hostname and <https://db-file-sync-safety.sociobot.in> serve the repair.

### Remaining operator notes

- The existing `v0.1.0` tag still points to `feb4bf046d2fd6f3d82729c67538d97c131517d5`. This repair does not change any CLI source or published package content, so the existing release was verified rather than destructively retagged. Tag the exact accepted source commit for the next binary release.
- Submit `winget/ParamFactory.DBSyncSafe.yaml` upstream when desired. macOS packages and the Windows binary remain unsigned as documented.

## Independent verification 2 — 2026-08-28 UTC

**Status: FAIL — candidate `308e0c483b17b12cefaab876484d780c733577fe` is not accepted.**

Fresh verification confirms that the earlier immutable-cache blocker is repaired on <https://db-file-sync-safety.sociobot.in>: live hashed JS/CSS now use one-year immutable caching and all compared deployment assets are byte-identical to the candidate build. Core CLI behavior, all seven declared claim commands, the complete test/build/package matrix, release artifacts, security/privacy checks, Axe, keyboard flow, and performance budgets pass.

Two release blockers remain:

1. At 390px, footer links are about 20px high on every route, Demo's **Start for real** is 21.7px high, and the Privacy repository link is 21px high. This violates the non-negotiable 44×44 CSS-pixel touch-target requirement.
2. `.factory/claims.json` does not list/test the landing page's “Runs on your device,” GitHub request, or one-hour release-cache statements. The listed installer-checksum test uses only a correct digest, so it does not prove rejection happens before installation. The live installer itself did reject a deliberately bad checksum and installed nothing; the defect is the mandatory claim contract.

Non-blocking/high-priority debt remains: `v0.1.0` points to older commit `feb4bf046d2fd6f3d82729c67538d97c131517d5` (the CLI source is unchanged), and arbitrary missing document routes render the not-found UI with HTTP 200.

Full independent evidence and exact retest requirements are in `.factory/verification-2.md`.

## Repair verification — 2026-08-28 UTC

**Status: PASS — the independent verification blocker is repaired and deployed.** Repair commit `84a73c4bc450c61b232056b6d5a4b4c307160693` (based on verifier-report commit `0da1a2b749844a23405837a4b983951bd1bc00d3`) adds an Azure Static Web Apps route policy for `/assets/*`:

```text
Cache-Control: public, max-age=31536000, immutable
```

This applies only to Vite's content-fingerprinted JavaScript and CSS. HTML and root-level mutable files retain the host's short revalidation lifetime. The policy is covered by the build-aware Playwright regression test `static hosting caches fingerprinted build assets immutably without caching HTML globally`; it asserts the exact header, the `/assets/*` route, generated JS/CSS references, and that no global cache header can accidentally cache HTML.

`dist/site` was deployed directly to the configured Azure Static Web Apps production resource `sf-db-file-sync-safety` in resource group `sociobot`. Live `HEAD` evidence after deployment:

| URL | Cache-Control | ETag / last modified |
| --- | --- | --- |
| `/assets/index-0dmFgyad.js` | `public, max-age=31536000, immutable` | `"98661495"` / 2026-08-28 16:38:51 UTC |
| `/assets/index-kHrlmiOK.css` | `public, max-age=31536000, immutable` | `"98661495"` / 2026-08-28 16:38:51 UTC |
| `/` | `public, must-revalidate, max-age=30` | `"98661495"` / 2026-08-28 16:38:51 UTC |

The live JavaScript SHA-256 is `5e1493a44670cbfd423ec4c83af007c4608a4c03005b3f94c679c2b49c885db4`, exactly matching `dist/site/assets/index-0dmFgyad.js`.

### Repair checks

- `npm ci`: passed (clean install; 0 vulnerabilities reported).
- `npm test`: passed — 5 Rust integration tests and 10 browser tests, including all seven exact `.factory/claims.json` commands, the immutable-cache regression, routes, console, Axe, keyboard, and 390px checks.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts`: passed. There is no repository lint script.
- `npm run build`: passed; writes `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: passed, including Cargo's clean package verification.
- `target/release/dbsync-safe --json --demo`: verified a blocked raw copy, `integrity_check: "ok"`, and a verified restore.
- Live Playwright smoke on `/`, `/demo`, `/privacy`, `/terms`, and the 404 route: 0 serious/critical Axe findings, 0 console errors, one `<main>` and one `<h1>` on each route. At 390px, the skip link receives first keyboard focus, the sample-data action is visible, and there is no horizontal overflow. A fresh `/demo` browser context made 3 same-origin requests and ended with empty localStorage/sessionStorage after reset.
- Live mobile Lighthouse 13: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.390 s and CLS 0.024.
- No `verify-url.sh` is shipped in this repository; its title/lang/main/alt/console coverage is exercised by the existing route test and the live browser smoke above. The product has no service worker or offline/update claim, so PWA update testing is not applicable.
- `git diff --check`: passed before committing the repair.

The verifier's P2 note remains non-blocking release provenance debt for the pre-existing `v0.1.0` binary tag. This repair changes only static-host cache behavior; it does not rebuild or retag the unchanged CLI release. Future binary releases must tag the exact verified source commit.

## What shipped

- A Rust `dbsync-safe` binary with `scan`, `guard`, `snapshot`, `verify`, `restore`, and `demo` commands.
- SQLite detection by file header, including extensionless databases and WAL, SHM, and rollback-journal sidecars.
- Read-only source connections and consistent copies through SQLite's online backup API.
- Atomic packet creation with SHA-256 hashes, an explicit procedure, scope limits, and `PRAGMA integrity_check` results.
- Pre-restore checksum and integrity checks, safe default overwrite refusal, and `--force` for an explicit replacement.
- Helpful exit codes and `--json` output for sync hooks and scripts.
- A bundled `field-notes.sqlite` demo created in a process-specific temporary folder.
- A responsive static product site with landing, demo, privacy, terms, and designed 404 routes.
- Original luminous-glass database art, an Open Graph image, favicon, copy audit, and documented design system.
- Shell and PowerShell installers. The shell installer is exercised against a local release fixture in tests.
- GitHub Actions for CI and releases across Linux x64, Windows x64, macOS Intel, and macOS Apple silicon.
- Linux `.deb` and `.rpm`, unsigned macOS `.pkg`, Windows portable zip, tarballs, `SHA256SUMS`, and `latest.json`.
- Homebrew, Scoop, and winget manifests with the published v0.1.0 checksums.

## Published release

- Release: <https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/tag/v0.1.0>
- Release workflow run `33184792494`: passed.
- Public CI run `33184913336` on the final accessibility fix: passed.
- The downloaded Linux archive matched `dbc74bedea6eed268092dc707bc306519b45300166af1091c3632c90e4bda5a2` from `SHA256SUMS`.
- `latest.json` was downloaded and parsed successfully. It lists all eight platform/package files.
- Homebrew tap: <https://github.com/B-Divyesh/homebrew-db-file-sync-safety>

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package --locked
```

`npm test` passed locally:

- 5 Rust integration tests, including the required 20 SQLite scenarios.
- 7 claim tests against fresh demo state.
- Route, console, Axe, keyboard, and 390-pixel viewport checks.
- 9 Playwright tests total.

`npm run build` passed and wrote `dist/site/index.html`. Production transfer sizes were 5.19 KB gzip JavaScript and 3.80 KB gzip CSS. The hero WebP is 73 KB.

Lighthouse 13 on the local production preview, mobile defaults:

| Category | Score |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

- LCP: 2.0 seconds
- CLS: 0.025
- Total blocking time: 0 ms
- INP: not produced by the lab run; Playwright keyboard interactions completed without delay.

`cargo package --allow-dirty --locked` also built and verified the package.

## Safety decisions

- A scan never calls a live SQLite file safe for raw copying. It directs the user to create a packet.
- Source databases are opened with `SQLITE_OPEN_READ_ONLY` during snapshot creation.
- Symlinks are skipped during recursive scans.
- Packet paths reject absolute paths and parent traversal.
- A failed snapshot removes only its process-specific partial output.
- Restore verifies the packet before creating or replacing target files.
- The copy and documentation state that application locking varies and that SQLite is the only supported database format.

## Known gaps and operator actions

- Deploy `dist/site/` through the factory. This repository does not change DNS or infrastructure.
- Submit `winget/ParamFactory.DBSyncSafe.yaml` to `microsoft/winget-pkgs`.
- The v0.1.0 macOS packages and Windows executable are unsigned. macOS users may need right-click → Open. Future signing needs operator certificates.
- The release supports Linux x64, Windows x64, and both current macOS architectures. Linux ARM and Windows ARM are not included.
- There is no promise that a specific application can remain open during a snapshot. Closing it remains the safest procedure.

## Source references

- Product scope: `.factory/brief.json`
- Visual system and asset provenance: `.factory/design.md`
- Claim contract: `.factory/claims.json`
- Demo isolation: `.factory/demo.md`
- Copy review: `.factory/copy-audit.md`
