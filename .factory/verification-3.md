# Independent verification 3 — FAIL

**Candidate:** `0e69eef3d1a42782dea2e22d01bb3eda25a89e81`  
**Live URL:** <https://db-file-sync-safety.sociobot.in>  
**Verified:** 2026-08-29 UTC  
**Work order:** `db-file-sync-safety-verify-3`

## Verdict

**FAIL — do not accept this candidate.**

The prior deployment-only failures are repaired: the live site is byte-identical to the candidate build, hashed assets have immutable caching, unknown routes return HTTP 404, and mobile touch targets pass. All nine declared claim commands, the full test/build/package matrix, core SQLite safety behavior, published installers, privacy checks, Axe, keyboard checks, and performance budgets also pass.

One release blocker remains. The one-click demo reports a quantitative result that disagrees with the real bundled CLI demo and is absent from the mandatory claim registry.

## Release-blocking defect

### P1 — the web demo says three notes were restored, but the real demo restores four

The live `/demo` result says:

> Three notes reached a new folder. The source stayed unchanged.

Fresh execution of both the candidate binary and the published Linux v0.1.0 binary produced a restored `field-notes.sqlite` containing **4** rows in `notes` (`SELECT count(*) FROM notes` → `4`). The discrepancy is deterministic:

- `examples/field-notes.sql` seeds three notes.
- `src/main.rs` then inserts the live-WAL note “Train changes.”
- The snapshot correctly includes that fourth row.
- `site/src/site.ts` nevertheless renders “Three notes reached a new folder.”

The number is also missing from `.factory/claims.json`; none of the nine claim tests asserts the displayed record count against the real demo output. This violates the attached claims contract twice: the public quantitative claim is false, and it has no registered observable test. The mismatch is especially material here because the demo is presented as a recording of the same shipped sample and the fourth row proves that live WAL content survives the snapshot.

Required repair: make the web result agree with the real CLI sample (or remove the numeric claim), register the retained claim, and test the browser result against the restored database count produced by `dbsync-safe --demo`.

## Other defect

### P2 — an exclusive SQLite lock causes an unbounded silent wait and interrupted staging debris

With a source database held under `BEGIN EXCLUSIVE`, `dbsync-safe snapshot` emitted no progress or error and was still waiting when terminated after three seconds (`timeout` exit `124`). The interrupted run did not alter the source or publish the requested packet, but it left a zero-byte staging database under `<output>.partial-<pid>/databases/`.

This is safe against raw copying, and the documented advice to close the source application remains valid, so it is not the verdict driver. It is still weak recovery behavior for a tool whose brief includes live-lock indicators. A bounded wait or periodic status plus cancellation cleanup would make the failure mode actionable.

### P2 — the published release tag is older than the candidate

The public `v0.1.0` tag resolves to `feb4bf046d2fd6f3d82729c67538d97c131517d5`, not the tested candidate. There is no difference in `src/`, `Cargo.toml`, `Cargo.lock`, `examples/`, or `tests/safety.rs`, and both binaries restore four notes, so this is provenance debt rather than a demonstrated binary difference. Future releases should tag the exact accepted source commit.

## First-read hard gate — PASS

A cold 1440×900 visit gave the following answer without scrolling:

- What it does: **“Make SQLite snapshots safe to sync.”**
- For whom: **“For developers syncing app folders…”**
- What to click first: **“Try it with sample data.”**
- What happens: **“See a live WAL become a verified packet.”**

The primary action opens `/demo` in one click. The destination immediately shows the sample workflow, the restored result, and the “Demo — sample data, nothing is saved” banner with **Reset demo** and **Start for real**.

## Mandatory claim commands — all listed claims PASS

`npm ci` completed from the clean candidate checkout with 22 packages and 0 vulnerabilities. Every exact command in `.factory/claims.json` was then run separately:

| Claim | Exact command | Result |
| --- | --- | --- |
| SQLite/WAL detection and raw-copy block | `npm test -- --grep @claim:sqlite-wal-detection` | PASS, 1/1 |
| Consistent snapshot | `npm test -- --grep @claim:consistent-snapshot` | PASS, 1/1 |
| Verified restore | `npm test -- --grep @claim:verified-restore` | PASS, 1/1 |
| JSON output | `npm test -- --grep @claim:json-output` | PASS, 1/1 |
| Local execution | `npm test -- --grep @claim:local-execution` | PASS, 1/1 |
| No telemetry / unsaved web demo | `npm test -- --grep @claim:no-telemetry` | PASS, 1/1 |
| GitHub release request and one-hour cache | `npm test -- --grep @claim:github-release-cache` | PASS, 1/1 |
| MIT/free | `npm test -- --grep @claim:mit-free` | PASS, 1/1 |
| Shell-installer checksum rejection | `npm test -- --grep @claim:installer-checksum` | PASS, 1/1 |

Each claim invocation also passed all five Rust integration tests and rebuilt the production site. Each registered ID has exactly one matching `@claim:<id>` test. The unregistered false demo count above still makes the claims review fail.

## Clean checkout, build, and package evidence — PASS

- Exact candidate checked out: `0e69eef3d1a42782dea2e22d01bb3eda25a89e81`.
- `npm test`: PASS; 5 Rust integration tests and 14 Playwright tests.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- Standalone TypeScript check of `site/src/site.ts`: PASS. No separate lint script exists.
- Exact `npm run build`: PASS; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: PASS, including Cargo's verification build.
- Clean consumer `cargo install --path target/package/db-file-sync-safety-0.1.0 --root <temp> --locked`: PASS. The installed binary reported 0.1.0 and completed the JSON demo.
- GitHub CI run `33196760495` for the exact candidate completed successfully.

## Independent CLI exercise — PASS except for the lock-wait finding

- `--help` is useful, `--version` reports 0.1.0, and commands are non-interactive.
- `--json --demo` found the WAL and SHM sidecars, reported raw copy unsafe, created an integrity-checked packet, and verified the restore.
- `guard` returned exit 2 for a SQLite folder and 0 for an empty folder.
- A normal snapshot preserved the source main-file SHA-256 and restored four rows with `PRAGMA integrity_check = ok`.
- Missing input, an empty non-SQLite folder, and a malformed SQLite-header file returned nonzero with no published packet; internal failure cleanup left no partial directory.
- A truncated packet failed checksum verification before its target existed.
- An existing database was refused and remained byte-identical; explicit `--force` replaced it with an integrity-checked restore.
- A nested Unicode path containing an extensionless SQLite database scanned, snapshotted, and restored successfully.
- Every command's JSON success output parsed; JSON errors parsed with `ok: false`; JSON guard retained exit 2.
- During 500 committed writes to a 50,000-row WAL database, scan found WAL/SHM, snapshot and restore succeeded, and the restored database contained 50,500 rows with integrity `ok`.

## Live deployment, privacy, accessibility, and performance — PASS

- All 13 deployable files in `dist/site/` matched the live responses byte-for-byte. This includes HTML, hashed JS/CSS, images, icons, installers, robots, sitemap, and 404 asset.
- Key candidate/live SHA-256 values: `index.html` `42bebde274a486f3e0495659963725f3df76f879b2de6a4182beaa6bcbb13b6b`; JS `45beac43f1223c90c85f2c215e904cc7f714714dc7fce4c5a413a4f544b08912`; CSS `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08`.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200. An arbitrary document path returned a designed HTTP 404.
- Desktop 1440×900 and mobile 390×844: no horizontal page overflow, no normal-route console/page errors, one `main`, one `h1`, `lang=en`, route-specific titles/canonicals, and no target below 44×44 CSS pixels.
- Axe found zero violations of any impact on the four normal routes at 390px; the desktop/mobile serious and critical counts were also zero.
- Keyboard: first Tab reached the skip link; every demo control and link received a visible 3px amber outline; the horizontally scrollable terminal responded to arrow keys; there was no trap. Enter/Space operated links/buttons, copy wrote the expected command, and browser Back restored and focused the demo heading.
- At 200% text size, the demo retained its heading/footer and had no page overflow.
- Reduced motion hid the integrity sweep and reduced terminal animations to `0.00001s` with no delay.
- Fresh `/demo` traffic was same-origin only and left cookies, localStorage, and sessionStorage empty. Fresh `/` traffic contacted only the disclosed `api.github.com` endpoint and wrote only `dbsync-safe:release`.
- HTML uses `public, must-revalidate, max-age=30`; hashed JS/CSS use `public, max-age=31536000, immutable`. CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present.
- Production sizes: JS 14,722 bytes / 5.20 KB gzip; CSS 13,145 bytes / 3.82 KB gzip; hero WebP 73,194 bytes. No webfont is fetched.
- Live mobile Lighthouse 13: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.592 s**, CLS **0.0246**, TBT **119 ms**, transfer **87,759 bytes**.
- Every discovered live anchor returned 200 after redirects.
- No service worker/PWA, product backend endpoint, sign-in, payment, or product-unlock call exists. Offline-update, API rate-limit, persistence-boundary, and Entra-authority checks are therefore not applicable.

## Published release and installers — PASS with provenance note

- GitHub release v0.1.0 has ten assets: eight platform/package files plus `SHA256SUMS` and `latest.json`.
- Linux `.deb`, `.rpm`, and tarball; Windows x64 zip; Intel/Apple-silicon macOS tarballs and unsigned `.pkg` files are present.
- `latest.json` parsed and listed all eight package files.
- Linux tarball SHA-256 `dbc74bedea6eed268092dc707bc306519b45300166af1091c3632c90e4bda5a2` matched `SHA256SUMS`; its binary reported 0.1.0 and passed the JSON demo.
- The Debian package matched its checksum, reported version `0.1.0-1`, extracted cleanly, and its binary reported 0.1.0.
- The live shell installer installed the checksum-verified release into a clean temporary prefix. The required mismatch test independently passed through the claim suite.
- The repository and public Homebrew formula match the release hash; Scoop and winget use the published Windows hash.

## Retest required

1. Correct or remove the live demo's false three-note statement.
2. Register and test any retained quantitative demo claim against the real CLI sample output.
3. Run all exact claim commands, `npm test`, `npm run build`, and the one-click live demo check after deployment.
4. Preferably add bounded/progress-aware handling and cleanup for an indefinitely locked snapshot.
