# Adversarial first-read review 1 — DB File Sync Safety

**Reviewed:** 29 August 2026 UTC<br>
**Candidate:** `727b71e6ddcb9cc69c4da0de9656c0f202201f5d`<br>
**Live site:** <https://db-file-sync-safety.sociobot.in><br>
**Verdict:** **FAIL**

The first-read, demo, WAL safety, accessibility, privacy-on-the-web, routing, link, test, and build checks pass. The product does not reach a zero-finding result. One previously documented SQLite mode still cannot complete the advertised job, several public claims are outside the claim registry, and five copy/metadata defects remain.

## Findings

### F-1-1 — BLOCKING — A closed persistent-journal database cannot be snapshotted

**Exact public text:** landing workflow, “Find SQLite headers and their WAL, SHM, or journal sidecars”; landing scope, “SQLite databases and sidecars” and “Consistent backup snapshots”; README, “It detects SQLite files and their WAL, SHM, or journal sidecars.”

**Earlier location:** `.factory/handoff.md` calls this a remaining P2 limitation but gives it no finding ID. This review assigns `F-1-1` and re-raises it as blocking because the live page now includes journal sidecars without stating the dead end.

**Evidence:** a fresh database was closed after `PRAGMA journal_mode=PERSIST`. Both `persist.sqlite` and its valid 8,720-byte `persist.sqlite-journal` remained. `dbsync-safe snapshot` exited 1 after two seconds:

```text
Blocked: SQLite stayed locked for 2 seconds while snapshotting .../persist.sqlite. Close the app and try again.
```

The application was already closed. Repeating the stated next step cannot succeed because `wait_for_rollback_journal` treats every existing rollback journal as a live lock. This fails the real snapshot job for a SQLite mode that the page says it detects and covers. It also violates the error-copy rule because the prescribed recovery cannot resolve the condition.

**Concrete fix:** distinguish a hot rollback journal from a closed `PERSIST` journal, copy the valid bundle into private staging, and produce/restore a verified snapshot without changing the source. Add a `@claim:persistent-journal-snapshot` clean-source regression. Until that works, remove “journal sidecars” and the broad “SQLite databases and sidecars” scope, state that persistent rollback journals are unsupported, and give a recovery step that actually works.

### F-1-2 — MAJOR — The “does not read your files” privacy claim is unlisted and unproved

**Exact text:** landing, “It snapshots and restores that database without reading your files”; README, “It does not read your files.”

**Why this fails:** `.factory/claims.json` has no no-user-file-read claim. `@claim:local-execution` proves outputs remain under a temporary root; it does not observe which other paths the process reads. This is a privacy statement a visitor may rely on.

**Concrete fix:** register the claim and run the CLI demo in an OS sandbox that exposes only its bundled sample and temp output, failing on any attempted read elsewhere. Alternatively say the narrower tested fact: “The demo creates and uses sample files in its temporary folder.”

### F-1-3 — MAJOR — Network/account claims exceed the registered telemetry claim

**Exact text:** README, “The CLI has no account, telemetry, or network client”; Privacy, “The CLI has no account, analytics, ads, or telemetry” and “The CLI makes no network requests.”

**Why this fails:** `no-telemetry` registers only “no telemetry” for the CLI and checks that selected HTTP crates are absent. It does not prove the broader no-account/no-network statements; Rust can open sockets without those crates or launch another program. The browser request log does correctly prove the browser-demo portion.

**Concrete fix:** add separate registered claims for no account and no network, then run every CLI demo operation under socket/syscall observation in a denied network namespace. Keep the browser request-log assertion.

### F-1-4 — MAJOR — “Every command” JSON support is broader than its test

**Exact text:** README, “Every command accepts `--json` for scripts.”

**Why this fails:** `@claim:json-output` invokes only `scan`. It does not cover `guard`, `snapshot`, `verify`, `restore`, or both demo spellings. “Every” is a quantitative breadth claim.

**Concrete fix:** make the claim test table-driven across every command and assert parseable JSON for both success and error paths, or rewrite this as “`scan` accepts `--json` for scripts.”

### F-1-5 — MAJOR — Overwrite refusal is a public but unregistered safety claim

**Exact text:** README, “It refuses to replace an existing database unless you pass `--force`.”

**Why this fails:** an ordinary Rust test covers the behavior, but `.factory/claims.json` has no entry and no exactly tagged claim test. The claim contract requires both.

**Concrete fix:** add `restore-overwrite-refusal` to `claims.json`, tag the existing regression, and assert the pre-existing target remains byte-identical after refusal.

### F-1-6 — MAJOR — “Only the copy is opened by SQLite” is an unregistered implementation promise

**Exact text:** README, “The CLI copies the database bundle into private staging. It opens only that copy with SQLite's backup API” and “Snapshot acquisition does not open the source through SQLite”; Privacy, “SQLite opens only a temporary working copy.”

**Why this fails:** the source-preservation claims prove paths and bytes remain unchanged, not which path SQLite opens. This distinction matters because a previous release changed source-side WAL/SHM state by opening the source.

**Concrete fix:** register a source-open-isolation claim and observe file opens during closed-WAL, active-WAL, and read-only runs. Assert SQLite opens only acquisition/output paths while source files are read only by the bundle-copy step.

### F-1-7 — MINOR — Distribution claims are absent from the claim registry

**Exact text:** README, “Release packages also include tarballs, a portable Windows zip, `.deb`, `.rpm`, and unsigned macOS `.pkg` files”; “Homebrew and Scoop manifests are under `packaging/homebrew/` and `scoop-bucket/`”; “The winget submission file is under `winget/`.”

**Why this fails:** these are concrete availability claims and have no `claims.json` entries. The files and current GitHub release existed during this review, but the mandatory claim audit cannot reproduce that evidence from a tagged test.

**Concrete fix:** register a `release-assets` claim that checks the release manifest and expected files, plus a `package-manifests` claim that parses each shipped manifest. Keep signing status in the expected assertions.

### F-1-8 — MINOR — README build and release statements are unlisted claims

**Exact text:** “`npm test` runs Rust integration tests, builds the site, and runs browser claim and accessibility tests”; “The 20-scenario Rust suite covers SQLite databases with and without live WAL files”; “`npm run build` creates the release binary and writes the static site to `dist/site/`”; “The release workflow builds macOS Intel and Apple silicon archives, Windows, Linux, `.deb`, `.rpm`, and `.pkg` assets”; “It publishes `SHA256SUMS` and `latest.json` with the GitHub Release.”

**Why this fails:** all are testable statements a maintainer relies on, but none has a claim entry. This review confirmed the first three locally and observed the current release assets; that does not satisfy the repository's exact registry rule.

**Concrete fix:** add tagged build/release contract tests and entries, or move maintainer-only assertions into a separately identified verification section that the claim contract explicitly excludes.

### F-1-9 — MINOR — Acronyms and “preflight” are unexplained jargon

**Exact text:** landing, “SQLite preflight · v0.1.2,” “See a live WAL become a verified packet,” and “Find SQLite headers and their WAL, SHM, or journal sidecars”; README first use, “WAL, SHM, or journal sidecars.”

**Why this fails:** a power user can understand the job without knowing SQLite's internal acronyms. Neither live page nor README expands WAL or SHM, and “preflight” does not name an action.

**Concrete fix:** use “SQLite sync check · v0.1.2” and expand the first occurrence to “write-ahead log (WAL) and shared-memory (SHM) sidecars.”

### F-1-10 — MINOR — Two headings imply that an unsafe copy or WAL turns into a packet

**Exact text:** landing action note, “See a live WAL become a verified packet”; section heading, “Watch the unsafe copy become a packet.”

**Why this fails:** the CLI refuses raw copying and creates a separate snapshot packet. A WAL by itself does not become the packet. The current metaphor blurs the safety boundary the product needs to teach.

**Concrete fix:** “See the CLI include a live WAL in a verified packet” and “See the CLI block raw copying and create a packet.”

### F-1-11 — MINOR — The landing copy button does not name its result

**Exact location:** landing terminal; visible button text “Copy” (the accessible name is “Copy demo command”).

**Why this fails:** visible copy must be clear without relying on nearby layout or an accessibility-only label.

**Concrete fix:** make the visible label “Copy demo command,” then “Demo command copied” after activation.

### F-1-12 — MINOR — “Start for real” does not name the destination

**Exact location:** Demo banner; “Start for real.”

**Why this fails:** the action scrolls to installation; its label does not say that.

**Concrete fix:** rename it “Install the CLI.”

### F-1-13 — MINOR — Non-landing routes keep landing-page metadata

**Exact location:** `/demo`, `/privacy`, `/terms`, and `/404` all retain description “Check live SQLite files, make a consistent snapshot, and verify the restore before syncing it to another device,” OG title “DB File Sync Safety — Make SQLite snapshots safe,” and the landing OG description.

**Why this fails:** titles and canonicals change correctly, but shared/search previews for Privacy, Terms, Demo, and 404 describe the landing workflow instead of the current route. The 404 metadata is especially misleading.

**Concrete fix:** update description, `og:title`, `og:description`, `og:url`, Twitter title, and Twitter description on every route. Give the designed 404 a noindex directive.

## Cold first screen

Fresh Chromium contexts were opened at 390×844 and 1440×900 before scrolling.

- **What it does, in my words:** a local CLI blocks raw SQLite database copying and creates a verified snapshot packet for syncing.
- **For whom:** developers who sync application folders between devices.
- **What to click first:** **Try it with sample data**.

The exact text that made all three answers possible was “Make SQLite snapshots safe to sync,” “For developers syncing app folders, it blocks raw database copies and creates a verified packet,” and “Try it with sample data.” This gate passes at both sizes. On mobile the first screen also includes all three plain facts.

## Copy audit

Counts use whitespace-delimited words; hyphenated terms, paths, flags, and version strings count as one word. Headings, labels, and controls are included even when they are fragments. Commands are excluded because they are executable syntax, not sentences. No item exceeds 22 words. No banned marketing adjective appears. The terms **bundle**, **snapshot**, **packet**, and **restore** are used consistently for different stages.

### Live landing page

| Words | Copy | Result |
| ---: | --- | --- |
| 3 | SQLite preflight · v0.1.2 | Flag: F-1-9 |
| 6 | Make SQLite snapshots safe to sync | Pass |
| 15 | For developers syncing app folders, it blocks raw database copies and creates a verified packet. | Pass |
| 5 | Try it with sample data | Pass |
| 4 | Download for Linux x64 | Pass |
| 8 | See a live WAL become a verified packet. | Flags: F-1-9, F-1-10 |
| 4 | Runs on your device | Pass: `local-execution` |
| 2 | No telemetry | Pass: `no-telemetry` |
| 3 | Free under MIT | Pass: `mit-free` |
| 2 | Live bundle | Pass |
| 2 | Backup API | Pass for the developer audience |
| 2 | Verified packet | Pass |
| 16 | Glass database layers show a live write stopped before a verified snapshot crosses to another device. | Pass: useful image purpose text |
| 3 | Real CLI output | Pass |
| 7 | Watch the unsafe copy become a packet | Flag: F-1-10 |
| 12 | The bundled demo creates a temporary SQLite database with a live WAL. | Covered by demo evidence |
| 10 | It snapshots and restores that database without reading your files. | Flag: F-1-2 |
| 6 | Terminal recording of the sample workflow | Pass |
| 5 | Scan: field-notes.sqlite plus live WAL | Flag: F-1-9 |
| 6 | Block: raw file copy refused | Pass |
| 4 | Snapshot: backup created | Pass |
| 5 | Restore: checksum and integrity passed | Pass |
| 1 | Copy | Flag: F-1-11 |
| 2 | Safe procedure | Pass |
| 6 | Replace raw copying with three checks | Pass |
| 4 | Scan the source folder | Pass |
| 10 | Find SQLite headers and their WAL, SHM, or journal sidecars. | Flags: F-1-1, F-1-9 |
| 4 | Make the snapshot packet | Pass |
| 11 | Copy the bundle privately, then use SQLite’s backup API and write checksums. | Pass: registered snapshot behavior |
| 5 | Restore on the other device | Pass |
| 10 | Check the packet before copying, then run SQLite’s integrity check. | Pass: `verified-restore` |
| 1 | Scope | Pass |
| 6 | Know what this safety check covers | Pass |
| 1 | Included | Pass |
| 4 | SQLite databases and sidecars | Flag: F-1-1 |
| 3 | Consistent backup snapshots | Flag: F-1-1 for persistent journals; WAL claim passes |
| 3 | Checksummed restore packets | Pass |
| 3 | Machine-readable JSON output | Pass for tested `scan`; breadth issue is F-1-4 in README |
| 2 | Not included | Pass |
| 3 | A file-sync engine | Pass |
| 4 | Conflict merging or replication | Pass |
| 3 | Other database formats | Pass |
| 4 | A universal browser-profile guarantee | Pass |
| 5 | Close the app when possible. | Pass generally; fails as recovery for F-1-1 |
| 5 | OS and application locks vary. | Pass |
| 10 | The tool never claims that simultaneous app use is safe. | Pass |
| 1 | Install | Pass |
| 3 | Install one binary | Pass |
| 11 | Choose a package, or use the installer for your current system. | Pass |
| 8 | The shell installer verifies SHA-256 before installation. | Pass: `installer-checksum` |
| 2 | Detected system | Pass |
| 2 | Linux x64 | Pass |
| 4 | Download for Linux x64 | Pass |
| 6 | v0.1.2 is ready for Linux x64. | Live release confirmed |
| 3 | macOS or Linux | Pass |
| 2 | Windows PowerShell | Pass |
| 3 | Package manager options | Pass |
| 10 | The macOS package and Windows binary are unsigned in v0.1.2. | Conservative disclosure |
| 6 | Verified SQLite packets for file sync. | Pass |
| 4 | Built by Param Factory | Pass |

### README

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | DB File Sync Safety | Pass as the document title |
| 10 | Make verified SQLite snapshots before a file-sync tool copies them. | Pass |
| 16 | DB File Sync Safety is for developers and power users who sync app folders between devices. | Pass |
| 11 | It detects SQLite files and their WAL, SHM, or journal sidecars. | Flags: F-1-1, F-1-9 |
| 11 | It blocks the raw-copy path and creates a checksummed packet instead. | Pass |
| 5 | The tool supports SQLite only. | Pass |
| 14 | It is not a sync engine, conflict resolver, replication system, or universal browser-profile fix. | Pass |
| 4 | Try the isolated demo | Pass |
| 10 | The command creates bundled sample data in a temporary folder. | Pass |
| 9 | It scans, snapshots, restores, verifies, and prints that folder. | Pass for the WAL demo |
| 6 | It does not read your files. | Flag: F-1-2 |
| 7 | The browser recording is available at https://db-file-sync-safety.sociobot.in/demo. | Pass |
| 1 | Install | Pass |
| 3 | macOS or Linux | Pass |
| 2 | Windows PowerShell | Pass |
| 9 | The shell installer checks the published SHA-256 before installation. | Pass: `installer-checksum` |
| 16 | Release packages also include tarballs, a portable Windows zip, `.deb`, `.rpm`, and unsigned macOS `.pkg` files. | Flag: F-1-7 |
| 9 | Homebrew and Scoop manifests are under `packaging/homebrew/` and `scoop-bucket/`. | Flag: F-1-7 |
| 7 | The winget submission file is under `winget/`. | Flag: F-1-7 |
| 2 | Safe procedure | Pass |
| 4 | First, scan the folder. | Pass |
| 9 | This command always treats raw SQLite copying as blocked. | Pass: `sqlite-wal-detection` |
| 11 | `guard` exits with code 2 when it finds a SQLite database. | Pass: observed by `sqlite-wal-detection` |
| 8 | Use that exit code in a sync hook. | Pass |
| 4 | Next, create a packet. | Pass |
| 9 | The CLI copies the database bundle into private staging. | Flag: F-1-6 |
| 9 | It opens only that copy with SQLite's backup API. | Flag: F-1-6 |
| 4 | Sync only that packet. | Pass |
| 10 | On the other device, restore it into a separate folder. | Pass |
| 10 | The restore checks every SHA-256 and runs SQLite's integrity check. | Pass: `verified-restore` |
| 11 | It refuses to replace an existing database unless you pass `--force`. | Flag: F-1-5 |
| 9 | Snapshot acquisition does not open the source through SQLite. | Flag: F-1-6 |
| 16 | Closed WAL-mode databases work from read-only folders, and every source path and file byte stays unchanged. | Pass: `consistent-snapshot`, `readonly-source-snapshot` |
| 6 | Every command accepts `--json` for scripts. | Flag: F-1-4 |
| 2 | Safety limits | Pass |
| 6 | Close the source application when possible. | Pass generally; not a valid F-1-1 recovery |
| 8 | Lock behavior differs by application and operating system. | Pass |
| 7 | Keep a separate backup before using `--force`. | Pass |
| 10 | A verified packet does not make simultaneous application use safe. | Pass |
| 9 | The CLI has no account, telemetry, or network client. | Flag: F-1-3 |
| 3 | Develop and verify | Pass |
| 7 | Requirements: stable Rust, Node.js 22, and npm. | Pass |
| 16 | `npm test` runs Rust integration tests, builds the site, and runs browser claim and accessibility tests. | Flag: F-1-8 |
| 13 | The 20-scenario Rust suite covers SQLite databases with and without live WAL files. | Flag: F-1-8 |
| 14 | `npm run build` creates the release binary and writes the static site to `dist/site/`. | Flag: F-1-8 |
| 11 | The site can also be built alone with `npm run build:site`. | Flag: F-1-8 |
| 3 | Release and deploy | Pass |
| 9 | Tag a tested commit with the next `v*` version. | Pass as an instruction |
| 17 | The release workflow builds macOS Intel and Apple silicon archives, Windows, Linux, `.deb`, `.rpm`, and `.pkg` assets. | Flag: F-1-8 |
| 9 | It publishes `SHA256SUMS` and `latest.json` with the GitHub Release. | Flag: F-1-8 |
| 6 | Deploy `dist/site/` to the static host. | Pass as an instruction |
| 8 | Infrastructure, DNS, and billing stay outside this repository. | Pass |
| 1 | License | Pass |
| 1 | MIT. | Pass: `mit-free` |
| 2 | See LICENSE. | Pass |

## Demo and sandbox

**Browser demo:** PASS. The first screen after one click already shows `field-notes.sqlite`, a live WAL, raw-copy refusal, snapshot, restore, and a packet path. The persistent banner reads “Demo — sample data, nothing is saved.” Reset rebuilds all five terminal rows, removes a deliberately added DOM marker, and announces “Demo reset with fresh sample data.” “Start for real” reaches `/#install`; its label remains F-1-12.

**Browser isolation:** PASS. A fresh `/demo` context made only same-origin requests, left cookies/localStorage/sessionStorage empty, and registered no service worker. Leaving for installation caused only the disclosed GitHub release request and still stored no sample data.

**CLI demo:** PASS for the advertised WAL sample. `target/release/dbsync-safe --json --demo` was run from a new empty temporary working directory. The working directory remained empty; all generated paths were under `/tmp/dbsync-safe-demo-5734`. Raw copy was blocked, source sidecars were WAL and SHM, snapshot integrity was `ok`, and restore was verified.

## Declared claim results

The clone had no tracked or untracked changes before review. `npm ci` installed the lockfile with zero reported vulnerabilities; `cargo clean` confirmed no prior build output. Every exact test string in `.factory/claims.json` was then run independently.

| Claim ID | Exact command | Result |
| --- | --- | --- |
| `sqlite-wal-detection` | `npm test -- --grep @claim:sqlite-wal-detection` | PASS |
| `consistent-snapshot` | `npm test -- --grep @claim:consistent-snapshot` | PASS |
| `readonly-source-snapshot` | `npm test -- --grep @claim:readonly-source-snapshot` | PASS |
| `verified-restore` | `npm test -- --grep @claim:verified-restore` | PASS |
| `demo-restored-count` | `npm test -- --grep @claim:demo-restored-count` | PASS |
| `json-output` | `npm test -- --grep @claim:json-output` | PASS, but public “every command” breadth is F-1-4 |
| `local-execution` | `npm test -- --grep @claim:local-execution` | PASS |
| `no-telemetry` | `npm test -- --grep @claim:no-telemetry` | PASS, but broader privacy claims are F-1-2/F-1-3 |
| `github-release-cache` | `npm test -- --grep @claim:github-release-cache` | PASS |
| `mit-free` | `npm test -- --grep @claim:mit-free` | PASS |
| `installer-checksum` | `npm test -- --grep @claim:installer-checksum` | PASS |

No listed test failed. Findings F-1-2 through F-1-8 identify public statements that are absent from, or broader than, the registry.

## History check

There were no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. The full `.factory/handoff.md` history was checked.

| Earlier issue | Live and code confirmation |
| --- | --- |
| Fingerprinted assets lacked immutable caching | Fixed: live JS/CSS return `public, max-age=31536000, immutable`; HTML returns 30-second revalidation. |
| Mobile footer/banner/repository targets were under 44 px | Fixed: the 390 px live crawl found no target below 44×44. |
| Local execution, GitHub cache, and checksum mismatch were unregistered/weak | Fixed for those exact claims; all three exact claim commands pass. |
| Unknown documents returned 200 | Fixed: `/not-a-real-route` responds 404, then shows the designed `/404` UI. |
| Terminal scroll region lacked a keyboard name/tab stop | Fixed; full Axe/keyboard audit passes. |
| Demo reported three notes instead of four | Fixed; real CLI and browser both report four including `Train changes`. |
| Exclusive lock waited without a bound and left partial output | Fixed; the Rust regression passes with the two-second bound and cleanup. |
| Release tag did not identify the repaired source | Fixed: annotated `v0.1.2^{}` resolves to `6063c38`, the source-preservation repair. |
| Closed-WAL snapshot created source WAL/SHM files and failed read-only folders | Fixed: exact-tree and read-only claim tests pass. |
| Installer copy overclaimed all installers; platform detection guessed wrong packages | Fixed: copy says “shell installer”; platform tests and the live Linux tarball target pass. |
| Closed `journal_mode=PERSIST` database cannot snapshot | **Not fixed: F-1-1.** Fresh reproduction matches the handoff. |

## Structure, accessibility, and identity

- PASS: `/`, `/demo`, `/privacy`, `/terms`, and `/404` use route-specific titles in the required pattern, one `<h1>`, one `<main>`, `lang=en`, consistent header/footer, Privacy and Terms links, favicon, 180 px apple-touch icon, canonical URL, and a 1200×630 OG image.
- PASS: deep links, SPA navigation, browser Back, route-heading focus, polite announcement, skip link, designed 404, reduced motion, 200% zoom, and all 12 crawled links.
- PASS: both 1440×900 and 390×844 route audits had zero Axe violations, zero console/page errors, no horizontal page overflow, and no touch target below 44×44.
- PASS: `verify-url.sh` found title, `lang=en`, one h1, main, complete alt text, labeled buttons, and no console errors.
- PASS: the first-load JavaScript is 14.89 KB raw / 5.21 KB gzip, comfortably inside the product budget.
- PASS: the luminous glass database landscape, clipped technical panels, mint/amber safety states, narrow display type, and one-shot integrity sweep are specific to the database-boundary job and do not look like a generic SaaS template.
- FAIL: route metadata is incomplete as described in F-1-13.

## Full quality gates

- `npm test`: PASS — 9 Rust tests and 17 Playwright tests.
- `npm run build`: PASS — release binary built and `dist/site/` was produced.
- Live audit: PASS — four normal routes × two viewports, links, keyboard, reduced motion, privacy, and zoom.
- Persistent-journal probe: FAIL — F-1-1.

## Missed leverage

No AI feature is justified. The job is deterministic SQLite inspection, backup, hashing, and restore; model output would reduce trust. A sync engine is explicitly out of scope, and `guard` already supplies an exit code for sync hooks. No separate AI/import/export/sync finding is raised.

One useful safety follow-up is to register and test the existing PowerShell checksum rejection path, matching the shell installer's tagged regression. This should be part of F-1-7's distribution contract rather than a decorative new feature.

## What would make this perfect

1. Complete safe snapshots for closed persistent rollback journals, or narrow the product's public SQLite-sidecar scope and give a truthful recovery step.
2. Register every public privacy, isolation, JSON-breadth, overwrite, distribution, build, and release claim with one observable sandbox test.
3. Replace the two inaccurate “become a packet” lines, expand WAL/SHM once, and use result-naming labels for both copy and install actions.
4. Set route-specific description and social metadata, including noindex for the designed 404.
5. Re-run this entire review from a clean clone. PASS requires zero remaining findings, including minor copy defects.
