# Independent verification 4 — FAIL

**Candidate:** `3568fc48836f43acb14d68e25d62bf202121d17c`

**Live URL:** <https://db-file-sync-safety.sociobot.in>

**Verified:** 2026-08-29 UTC

**Work order:** `db-file-sync-safety-verify-4`

## Verdict

**FAIL — do not accept or promote this candidate.**

The first-read gate, all ten declared claim commands, clean install, full test/build/package matrix, normal and concurrent CLI workflows, deployment identity, release artifacts, privacy request log, security headers, desktop/mobile accessibility, and performance budgets pass.

Fresh independent testing nevertheless found a core safety defect: snapshotting a closed WAL-mode SQLite database creates new `-wal` and `-shm` files in the source folder. The product therefore changes the source bundle while publicly claiming that the source stays unchanged. The registered claim test hashes only the main `.sqlite` file and misses the new sidecars. A second claims-contract blocker remains in the broader, untested promise that both installers verify SHA-256. Platform detection also selects incompatible or suboptimal packages for common Apple-silicon and non-Debian Linux browsers.

## Release-blocking defects

### P1 — snapshot changes the source WAL bundle and fails on a read-only source

The researched brief says the tool must never modify source databases. The product consistently defines a live SQLite **bundle** as the main file plus its WAL/SHM sidecars. The live demo says, “The source stayed unchanged,” and `.factory/claims.json` says a snapshot is created “without changing the source database.”

An independent probe created a WAL-mode database, closed its only connection, and confirmed that the source folder contained one file:

```text
BEFORE
app.sqlite 8192 bytes
scan state: ready_for_snapshot; sidecars: []
```

Running the candidate production binary:

```text
target/release/dbsync-safe --json snapshot <source> --output <packet>
```

changed the source folder to:

```text
AFTER
app.sqlite      8192 bytes
app.sqlite-shm 32768 bytes
app.sqlite-wal     0 bytes
scan state: snapshot_required; sidecars: [app.sqlite-wal, app.sqlite-shm]
```

The main-file SHA-256 remained `ddc42bc8e208ee42771477ff35a8a8b4e4f141a4848ce630a9a9ede54a1c4146`, but the source bundle gained two files and the tool's own next scan changed from no sidecars to a live-sidecar warning. The published v0.1.1 Linux binary reproduced the same result.

The defect has an operational consequence beyond wording. With a WAL-mode database in a `0555` source directory and the database itself `0444`, execution as uid/gid 65534 failed even though the packet destination was writable:

```json
{"error":"SQLite could not make a consistent snapshot of .../app.sqlite: not an error. Close the app and try again.","ok":false}
```

The claim test is a false positive. `@claim:consistent-snapshot` hashes only `field-notes.sqlite`; it neither inventories the source directory nor hashes sidecars. The demo process also closes its SQLite connection before that test takes its “before” hash, removing the demo sidecars. The tested snapshot then recreates a zero-byte WAL and 32 KiB SHM without detection.

This is release-blocking because source non-modification is a primary safety constraint and a public claim, not an incidental implementation detail.

### P1 — the plural installer checksum promise is not registered or tested

The live install section says:

> Installers verify SHA-256 before changing your path.

The page immediately presents both the Unix shell installer and Windows PowerShell installer. The only registered claim is narrower:

> The shell installer rejects a SHA-256 mismatch before installing.

`@claim:installer-checksum` executes only `install.sh`. No claim entry or observable test covers `install.ps1`, although the public sentence uses “Installers.” Static inspection shows that the PowerShell script contains a checksum comparison, but the claims contract requires the promised result to be exercised in the sandbox. The copy must be narrowed to the tested shell installer, or the claim and test must cover both installers.

## Other defect

### P2 — browser platform detection offers the wrong package in common environments

The live download selection relies on `navigator.platform.includes('arm')` for macOS and chooses the first Linux asset matching either `.deb` or `.tar.gz`.

- Apple-silicon Safari-compatible identifiers (`MacIntel`, as browsers commonly expose for compatibility) produced **macOS Intel** and linked `dbsync-safe-macos-x86_64.pkg`, not the published arm64 asset.
- Fedora-compatible Linux identifiers produced **Linux x64** and linked the Debian `.deb`, not the distribution-neutral tarball or the published RPM.

The one-line shell installer correctly uses `uname`, and the GitHub release page remains available, so this is not the verdict driver. The primary detected-platform button should avoid architecture/distro guesses it cannot support or offer explicit choices.

## First-read hard gate — PASS

A cold 1440×900 live visit, before repository copy review, answered all required questions without scrolling:

- What it does: **“Make SQLite snapshots safe to sync.”**
- For whom: **“For developers syncing app folders…”**
- What to click first: **“Try it with sample data.”**
- What happens next: **“See a live WAL become a verified packet.”**

The sample action was fully visible at y=776.5–820.5 in the 900-pixel viewport and at y=417.2–461.2 in a 390×844 viewport. It opened `/demo` in one click. The destination immediately showed the sample workflow, the four-note result, and the persistent “Demo — sample data, nothing is saved” banner with **Reset demo** and **Start for real**.

## Mandatory claim commands

After `npm ci` in the candidate checkout, every exact command in `.factory/claims.json` was run separately. All commands exited 0 and selected exactly one Playwright test:

| Claim ID | Result |
| --- | --- |
| `sqlite-wal-detection` | PASS, 1/1 |
| `consistent-snapshot` | PASS, 1/1; inadequate assertion, P1 above |
| `verified-restore` | PASS, 1/1 |
| `demo-restored-count` | PASS, 1/1 |
| `json-output` | PASS, 1/1 |
| `local-execution` | PASS, 1/1 |
| `no-telemetry` | PASS, 1/1 |
| `github-release-cache` | PASS, 1/1 |
| `mit-free` | PASS, 1/1 |
| `installer-checksum` | PASS, 1/1 for shell only; broader live claim untested |

Each invocation also passed the six Rust integration tests and rebuilt the production site. The passing commands do not clear the two claims-contract defects above.

## Clean checkout, tests, build, and package

- Confirmed exact candidate `3568fc48836f43acb14d68e25d62bf202121d17c` with no pre-existing worktree changes.
- `npm ci`: PASS; 22 packages installed, 0 vulnerabilities.
- `npm test`: PASS; 6 Rust integration tests and 15 Playwright tests.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022,dom --skipLibCheck site/src/site.ts`: PASS.
- No separate repository lint script exists.
- Exact `npm run build`: PASS; produced `target/release/dbsync-safe` and `dist/site/`.
- `cargo package --locked`: PASS, including Cargo's clean package verification build.
- Clean consumer `cargo install --path target/package/db-file-sync-safety-0.1.1 --root <temp> --locked`: PASS.
- Installed consumer binary reported `dbsync-safe 0.1.1`; `--help` documented all commands and `--json --demo` completed.
- Public CI run `33230088165` passed for the exact candidate.

## Independent CLI exercise

Passing behavior, separate from the repository tests:

- The packaged demo detected `field-notes.sqlite-wal` and `field-notes.sqlite-shm`, blocked raw copy, produced a checksummed packet, restored four notes including `Train changes`, and reported integrity `ok`.
- A second snapshot preserved the main source-file SHA-256.
- `guard` returned 2 for a SQLite folder and 0 for an empty folder.
- Missing input and an empty non-SQLite folder returned actionable JSON errors and published no packet.
- A truncated packet returned a checksum error before creating the restore target.
- Existing-target restore was refused and the existing file remained byte-identical; explicit `--force` restored all four notes.
- A manifest destination containing `../escape.sqlite` was rejected and wrote nothing outside the target.
- A symlink-only source folder was ignored.
- A rollback-journal database held under `BEGIN EXCLUSIVE` failed after 2.016 seconds with the documented close-and-retry message and left no `.partial-*` directory.
- During 500 committed writes to a 20,000-row WAL database, scan found WAL/SHM, snapshot and restore completed, and the restored database contained 20,500 rows with `PRAGMA integrity_check = ok`.
- The six-test Rust suite includes the required 20 SQLite/WAL scenarios; all passed.

The source-bundle mutation described above remains decisive despite these otherwise safe paths.

## Live deployment, accessibility, privacy, and security

- All 13 public files in `dist/site/` matched live responses byte-for-byte. `staticwebapp.config.json` correctly returned 404 because it is host configuration.
- Candidate/live hashes include `index.html` `cf84cc9cb17e1afe519b6759dcac9765acd317318ea45a8a8ddc4c738bfee734`, JavaScript `c321653df69f09e95cfcfeb39e1677c07b9e5419451eaaf52d3a8ef7d468ed9e`, and CSS `e9a28bc38849030d3d86c4ad096888fcd3409d711ccce2924225960fbf907f08`.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200. An arbitrary path returned a designed HTTP 404.
- Desktop 1440×900 and mobile 390×844 normal routes had one `main`, one `h1`, `lang=en`, route-specific titles, no horizontal overflow, no console/page errors, and zero Axe violations of any impact.
- No interactive target measured below 44×44 CSS pixels at 390px.
- Keyboard-only flow reached the skip link first and then every header/action control. Focus used a 3px amber outline with 4px offset. Enter opened the demo, route focus moved to its heading, Reset announced “Demo reset with fresh sample data,” copy wrote `dbsync-safe --demo`, and browser Back focused the landing heading. No trap was observed.
- At 200% root text size, the demo retained its heading and footer without page overflow.
- Reduced motion hid the integrity sweep, set terminal animation to 0.00001 seconds with no delay, removed transforms, and made scrolling instant.
- A fresh complete `/demo` interaction made exactly three same-origin requests, set no cookies, and left localStorage/sessionStorage empty.
- A fresh landing visit contacted only `api.github.com` outside the product origin and wrote only `dbsync-safe:release`. No analytics, ads, third-party fonts/scripts, or telemetry request was observed.
- Response headers include HSTS, restrictive CSP, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial. HTML uses `public, must-revalidate, max-age=30`; hashed JS/CSS use `public, max-age=31536000, immutable`.
- Every discovered anchor returned 200 after redirects, including the selected Linux package.
- No service worker, offline/PWA claim, product backend, sign-in, payment, unlock call, or AI action exists. Service-worker update, product API rate-limit, persistence-boundary, and Entra-authority checks are not applicable. There is no missed AI leverage for this deterministic safety tool.

The only console error observed was Chromium's expected failed-resource message when deliberately navigating to the HTTP 404 path; all normal routes were clean.

## Performance and bundle budgets — PASS

Live mobile Lighthouse 13.0.1 produced:

| Metric | Result |
| --- | ---: |
| Performance | 96 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.954 s |
| LCP | 1.304 s |
| CLS | 0.0246 |
| Total blocking time | 225 ms |
| Total transfer | 87,942 bytes |

The production build is 5.21 KB gzip JavaScript and 3.82 KB gzip CSS. Lighthouse transferred 73,298 image bytes and no webfont. All static budgets pass. Lighthouse did not produce lab INP; tested keyboard/click responses completed without observable delay.

## Release and installer evidence

- GitHub Release `v0.1.1` contains Linux `.deb`, `.rpm`, and tarball; Windows x64 zip; Intel and Apple-silicon macOS tarballs and unsigned `.pkg` files; `SHA256SUMS`; and `latest.json`.
- `latest.json` parsed with version 0.1.1, tag `v0.1.1`, and all eight package URLs.
- Downloaded `dbsync-safe-linux-x86_64.tar.gz` matched published SHA-256 `7e75a6a40cec4ca0dcf24632215088cec272bf7093db5999f157484df58467fa`.
- The public Linux binary reported 0.1.1, detected its demo WAL/SHM, and completed a verified restore with integrity `ok`.
- The live shell installer installed the checksum-verified binary into a clean prefix; that binary passed its JSON demo. The declared wrong-checksum regression also passed.
- Homebrew, Scoop, and winget manifests match the v0.1.1 release URLs and hashes. The public Homebrew formula matches the repository formula.
- Release workflow run `33229880162` passed for tag implementation commit `e7adb0e354215b796cfba643fed9c1df53dabb23`. Candidate changes after that tag affect only `.factory/handoff.md` and the three release-package manifests; CLI and site implementation are unchanged.

## Required retest

1. Make snapshotting leave the complete source folder byte-for-byte and entry-for-entry unchanged, including WAL/SHM/journal files, while still including committed WAL content in the packet.
2. Prove the behavior with a claim test that inventories and hashes the entire source bundle before and after snapshot, including a closed WAL-mode database with no sidecars present.
3. Prove snapshot operation against a genuinely read-only source directory, and replace the current “not an error” failure with an actionable error if the platform cannot support it.
4. Narrow the public installer sentence to the shell installer or register and execute checksum-mismatch tests for both shell and PowerShell installers.
5. Replace unreliable architecture/distro guessing with a distribution-neutral detected download or explicit platform choices.
6. Re-run all ten exact claim commands, the complete build/package matrix, the published binary probe, deployment identity checks, and live browser audits.
