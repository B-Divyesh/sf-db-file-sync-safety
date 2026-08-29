# Adversarial first-read review 2 — DB File Sync Safety

**Reviewed:** 29 August 2026 UTC<br>
**Candidate:** `48a0bbe91d32bafd2fe5d7f2f35c3ae69ba52a96`<br>
**Live site:** <https://db-file-sync-safety.sociobot.in><br>
**Verdict:** **FAIL**

The product passes the cold first read, one-click demo, sandbox, all 21 registered claims, full local test/build gates, normal-route structure, accessibility, privacy, and visual-identity checks. It does not meet the required zero-finding threshold. The actual production HTTP 404 is a separate, incomplete document: a previous metadata repair is only half fixed, one mobile target is under 44 pixels, and its headline uses product metaphor instead of naming the error.

## Findings

### F-2-1 — BLOCKING — The prior 404 metadata repair is only present in the SPA, not the real HTTP 404

**Re-raised prior finding:** `F-1-13`.

**Exact live location:** <https://db-file-sync-safety.sociobot.in/definitely-not-a-route> returns HTTP 404 and the standalone `site/public/404.html` document.

**Exact omissions:** the document has no `og:title`, `og:description`, `og:url`, `og:image`, Twitter card/title/description/image, or apple-touch icon. Its header contains only “dbsync-safe,” not the normal Demo, Install, and Privacy navigation. Its footer contains “Verified SQLite packets for file sync,” Privacy, and Terms, but omits “Built by Param Factory” and `v0.1.3 · build 004`.

**Why this fails:** `F-1-13` required route-specific description, Open Graph, Twitter, canonical, and indexing metadata on every route, including 404. The SPA `/404` implementation has those fields, but an unknown production URL is rewritten to a different static document. A first-time visitor who reaches the actual 404 gets a visibly different site shell, and a shared bad URL has incomplete preview metadata. This is a half-fixed earlier finding, so it is blocking under the review contract.

**Code evidence:** `site/public/404.html:3-12` contains only title, description, robots, theme color, canonical, SVG favicon, and stylesheet metadata. Lines 16 and 24 contain the reduced header/footer. The Playwright metadata test uses Vite's SPA fallback for `/not-a-route`; it checks the separate static file only for title, robots, h1, main, Privacy, and Terms, so production-only omissions are not asserted.

**Concrete fix:** make `404.html` use the same header/footer content as the application shell; add the route-specific Open Graph and Twitter fields, `/og-image.webp`, and `/apple-touch-icon.png`; retain `noindex, nofollow` and the `/404` canonical. Add a test that opens the built standalone `dist/site/404.html` or the deployed unknown URL and asserts the complete metadata and shell, rather than relying on Vite's fallback.

### F-2-2 — BLOCKING — The real mobile 404 repeats the earlier under-44-pixel target defect

**Earlier issue:** the cumulative handoff records sub-44-pixel mobile targets as a release blocker and says they were fixed.

**Exact live result:** at 390×844, the “Skip to main content” link on the actual HTTP 404 measures **198.58×43 CSS pixels**. All normal SPA routes pass the same ≥44×44 check.

**Why this fails:** the accessibility contract requires every interactive target to be at least 44×44 pixels. The skip link becomes visible and actionable on keyboard focus, so its hidden resting position does not exempt it. The existing test loops over `/not-a-route` under Vite, which renders the SPA 404 and misses `404.css`.

**Code evidence:** `site/public/404.css:6` gives `.skip-link` padding but no `min-height`; the live CSS and HTML SHA-256 hashes exactly match the repository files.

**Concrete fix:** give the standalone `.skip-link` `min-height: 44px`, use inline-flex alignment, and test every interactive target in the built standalone 404 at 390px. Keep the deployed unknown-URL check so the host rewrite cannot regress unnoticed.

### F-2-3 — MINOR — The 404 headline uses an internal packet metaphor

**Exact text:** eyebrow, “Path check failed”; h1, “This page is not in the packet.”

**Why this fails:** a packet is the CLI's safe snapshot artifact, not a website container. The h1 does not name the page state when read out of context and violates the plain-words rule against metaphor or brand-lore headings.

**Concrete rewrite:** eyebrow: “404 error”; h1: “Page not found”; supporting text: “Check the address or return to the DB File Sync Safety overview.”

## Cold first screen

Fresh Chromium contexts opened the home page at 390×844 and 1440×900 with `scrollY = 0` before any interaction.

- **What it does, in my words:** blocks raw SQLite file copying and creates a verified snapshot packet that is safer to sync.
- **For whom:** developers who sync application folders between devices.
- **What to click first:** **Try it with sample data**.

The exact first-screen text that answers those questions is “Make SQLite snapshots safe to sync,” “For developers syncing app folders, it blocks raw database copies and creates a verified packet,” and “Try it with sample data.” The three facts “Runs on your device,” “No telemetry,” and “Free under MIT” are also visible at 390px. This gate passes.

## Copy audit

Counts are whitespace-delimited; hyphenated terms, paths, and version strings count as one word. Visible labels, accessible image purpose text, and terminal recording lines are included. README code fences are excluded because they are commands rather than sentences. No landing or README item exceeds 22 words, uses a banned marketing adjective, changes an established term, uses an uninformative heading, or presents a non-result-naming action. `write-ahead log (WAL)` and `shared-memory (SHM)` are expanded on first explanatory use. The 404 copy defect is separately recorded as F-2-3.

### Live landing page

| Words | Exact copy |
| ---: | --- |
| 4 | Skip to main content |
| 1 | dbsync-safe |
| 1 | Demo |
| 1 | Install |
| 1 | Privacy |
| 5 | SQLite sync check · v0.1.3 |
| 6 | Make SQLite snapshots safe to sync |
| 15 | For developers syncing app folders, it blocks raw database copies and creates a verified packet. |
| 5 | Try it with sample data |
| 4 | Download for Linux x64 |
| 12 | See the CLI include a live write-ahead log in a verified packet. |
| 4 | Runs on your device |
| 2 | No telemetry |
| 3 | Free under MIT |
| 16 | Glass database layers show a live write stopped before a verified snapshot crosses to another device. |
| 2 | LIVE BUNDLE |
| 2 | BACKUP API |
| 2 | VERIFIED PACKET |
| 3 | Real CLI output |
| 10 | See the CLI block raw copying and create a packet |
| 12 | The bundled demo creates and uses sample files in its temporary folder. |
| 9 | It includes a live write-ahead log in the snapshot. |
| 6 | Terminal recording of the sample workflow |
| 3 | `$ dbsync-safe --demo` |
| 7 | 01 · SCAN field-notes.sqlite + live WAL |
| 7 | 02 · BLOCK raw file copy refused |
| 6 | 03 · SNAPSHOT backup created ✓ |
| 8 | 04 · RESTORE checksum + integrity passed ✓ |
| 2 | → safe-packet/dbsync-safe-manifest.json |
| 3 | Copy demo command |
| 3 | Demo command copied |
| 2 | Safe procedure |
| 6 | Replace raw copying with three checks |
| 4 | Scan the source folder |
| 13 | Find SQLite headers and their write-ahead log (WAL), shared-memory (SHM), or journal sidecars. |
| 4 | Make the snapshot packet |
| 12 | Copy the bundle privately, then use SQLite’s backup API and write checksums. |
| 5 | Restore on the other device |
| 10 | Check the packet before copying, then run SQLite’s integrity check. |
| 1 | Scope |
| 6 | Know what this safety check covers |
| 1 | Included |
| 4 | SQLite databases and sidecars |
| 3 | Consistent backup snapshots |
| 3 | Checksummed restore packets |
| 3 | Machine-readable JSON output |
| 2 | Not included |
| 3 | A file-sync engine |
| 4 | Conflict merging or replication |
| 3 | Other database formats |
| 4 | A universal browser-profile guarantee |
| 5 | Close the app when possible. |
| 5 | OS and application locks vary. |
| 10 | The tool never claims that simultaneous app use is safe. |
| 1 | Install |
| 3 | Install one binary |
| 11 | Choose a package, or use the installer for your current system. |
| 7 | The shell installer verifies SHA-256 before installation. |
| 2 | Detected system |
| 2 | Linux x64 |
| 4 | Download for Linux x64 |
| 6 | v0.1.3 is ready for Linux x64. |
| 3 | macOS or Linux |
| 2 | Windows PowerShell |
| 3 | Package manager options |
| 10 | The macOS package and Windows binary are unsigned in v0.1.3. |
| 6 | Verified SQLite packets for file sync. |
| 1 | Privacy |
| 1 | Terms |
| 5 | Built by Param Factory (external) |
| 4 | v0.1.3 · build 004 |

Conditional landing states were also checked: “View downloads” (2), “Checking your system…” (3), “Checking the latest release…” (4), “Choose a macOS download” (4), “v0.1.3 has Apple silicon and Intel packages” (7), “Downloads are being published” (4), and “The release page has the current status” (7). All pass.

### README

| Words | Exact copy |
| ---: | --- |
| 4 | DB File Sync Safety |
| 10 | Make verified SQLite snapshots before a file-sync tool copies them. |
| 16 | DB File Sync Safety is for developers and power users who sync app folders between devices. |
| 14 | It detects SQLite files and their write-ahead log (WAL), shared-memory (SHM), or rollback-journal sidecars. |
| 11 | It blocks the raw-copy path and creates a checksummed packet instead. |
| 5 | The tool supports SQLite only. |
| 14 | It is not a sync engine, conflict resolver, replication system, or universal browser-profile fix. |
| 4 | Try the isolated demo |
| 10 | The command creates bundled sample data in a temporary folder. |
| 9 | It scans, snapshots, restores, verifies, and prints that folder. |
| 10 | Its sample, packet, and restore paths stay inside that folder. |
| 8 | The isolated browser recording is available at `https://db-file-sync-safety.sociobot.in/?demo=1`. |
| 1 | Install |
| 3 | macOS or Linux |
| 2 | Windows PowerShell |
| 9 | The shell installer checks the published SHA-256 before installation. |
| 15 | Each release includes tarballs, a portable Windows zip, `.deb`, `.rpm`, and unsigned macOS `.pkg` files. |
| 9 | Homebrew and Scoop manifests are under `packaging/homebrew/` and `scoop-bucket/`. |
| 7 | The winget submission file is under `winget/`. |
| 2 | Safe procedure |
| 4 | First, scan the folder. |
| 9 | This command always treats raw SQLite copying as blocked. |
| 11 | `guard` exits with code 2 when it finds a SQLite database. |
| 8 | Use that exit code in a sync hook. |
| 4 | Next, create a packet. |
| 9 | The CLI copies the database bundle into private staging. |
| 6 | SQLite opens only that private copy. |
| 4 | Sync only that packet. |
| 10 | On the other device, restore it into a separate folder. |
| 10 | The restore checks every SHA-256 and runs SQLite's integrity check. |
| 11 | It refuses to replace an existing database unless you pass `--force`. |
| 9 | Snapshot acquisition does not open the source through SQLite. |
| 13 | Closed WAL-mode and finalized persistent-journal databases keep every source path and byte unchanged. |
| 6 | Every command accepts `--json` for scripts. |
| 2 | Safety limits |
| 6 | Close the source application when possible. |
| 8 | Lock behavior differs by application and operating system. |
| 7 | Keep a separate backup before using `--force`. |
| 10 | A verified packet does not make simultaneous application use safe. |
| 7 | The CLI needs no account or credentials. |
| 9 | It records no telemetry and sends no network requests. |
| 3 | Develop and verify |
| 7 | Requirements: stable Rust, Node.js 22, and npm. |
| 16 | `npm test` runs Rust integration tests, builds the site, and runs browser claim and accessibility tests. |
| 12 | Its 20-scenario regression covers SQLite databases with and without live WAL files. |
| 14 | `npm run build` creates the release binary and writes the static site to `dist/site/`. |
| 11 | The site can also be built alone with `npm run build:site`. |
| 3 | Release and deploy |
| 9 | Tag a tested commit with the next `v*` version. |
| 16 | The release workflow builds Intel and Apple-silicon macOS packages, Windows and Linux packages, `SHA256SUMS`, and `latest.json`. |
| 6 | Deploy `dist/site/` to the static host. |
| 8 | Infrastructure, DNS, and billing stay outside this repository. |
| 1 | License |
| 1 | MIT. |
| 2 | See LICENSE. |

### Terminology and actions

`bundle` means the source database plus sidecars; `snapshot` is SQLite's consistent copy; `packet` is the checksummed directory intended for sync; `restore` is the verified destination operation. Those terms remain distinct. Landing actions use result-naming verbs: Try, Download/View, Copy, Scan, Make, Restore, Install, and Choose. No copy finding is raised for the landing page or README.

## Demo and sandbox

**Browser demo: PASS.** One click from the cold home screen opens `/?demo=1`. Before scrolling, the resulting screen already shows the `field-notes.sqlite` sample, live WAL, raw-copy refusal, snapshot, checksum/integrity restore, and safe packet path. The result states that all four notes reached a new folder, including the live-WAL note.

The persistent banner reads “Demo — sample data, nothing is saved.” Reset replaces the terminal with its original state, removes an injected marker, and announces “Demo reset with fresh sample data.” “Install the CLI” points to `/#install`.

**Browser isolation: PASS.** A fresh direct demo context made only same-origin requests, stored no local/session data or cookies, and registered no service worker. Entering from the landing page retained only the disclosed pre-existing `dbsync-safe:release` public-release cache; demo actions neither read nor changed it and wrote no sample state.

**CLI demo: PASS.** `target/release/dbsync-safe --json --demo` ran from a new empty temporary working directory. The working directory remained empty. The sample, packet, and restored database were all placed under the process-specific `/tmp/dbsync-safe-demo-7076` root; raw copying was blocked and restore verification was true.

No offline claim is made. Privacy claims were checked through the browser request/storage log and the registered socket-denial tests.

## Claims

A no-hardlinks clone of the candidate was created under `/tmp`, followed by `npm ci`. Every exact `test` string in `.factory/claims.json` was run separately. Each claim tag occurs exactly once in the test sources.

| Claim ID | Exact test | Result |
| --- | --- | --- |
| `sqlite-wal-detection` | `npm test -- --grep @claim:sqlite-wal-detection` | PASS |
| `consistent-snapshot` | `npm test -- --grep @claim:consistent-snapshot` | PASS |
| `persistent-journal-snapshot` | `npm test -- --grep @claim:persistent-journal-snapshot` | PASS |
| `readonly-source-snapshot` | `npm test -- --grep @claim:readonly-source-snapshot` | PASS |
| `source-open-isolation` | `npm test -- --grep @claim:source-open-isolation` | PASS |
| `verified-restore` | `npm test -- --grep @claim:verified-restore` | PASS |
| `restore-overwrite-refusal` | `npm test -- --grep @claim:restore-overwrite-refusal` | PASS |
| `demo-restored-count` | `npm test -- --grep @claim:demo-restored-count` | PASS |
| `json-output` | `npm test -- --grep @claim:json-output` | PASS |
| `local-execution` | `npm test -- --grep @claim:local-execution` | PASS |
| `no-account` | `npm test -- --grep @claim:no-account` | PASS |
| `no-network` | `npm test -- --grep @claim:no-network` | PASS |
| `no-telemetry` | `npm test -- --grep @claim:no-telemetry` | PASS |
| `github-release-cache` | `npm test -- --grep @claim:github-release-cache` | PASS |
| `sqlite-only-scope` | `npm test -- --grep @claim:sqlite-only-scope` | PASS |
| `mit-free` | `npm test -- --grep @claim:mit-free` | PASS |
| `installer-checksum` | `npm test -- --grep @claim:installer-checksum` | PASS |
| `release-assets` | `npm test -- --grep @claim:release-assets` | PASS |
| `package-manifests` | `npm test -- --grep @claim:package-manifests` | PASS |
| `build-contract` | `npm test -- --grep @claim:build-contract` | PASS |
| `release-workflow` | `npm test -- --grep @claim:release-workflow` | PASS |

The landing, demo, Privacy, Terms, and README claim-like statements map to these entries. No unlisted claim or untested registered claim was found.

## History verification

Every earlier review and polish finding was rechecked on the live site and in code.

| Earlier finding | Independent result |
| --- | --- |
| F-1-1 persistent rollback journal could not snapshot | Fixed: the clean `persistent-journal-snapshot` claim and Rust regression pass; restore contains the expected row and source stays unchanged. |
| F-1-2 “does not read your files” overclaim | Fixed: public copy now states only the tested temporary-folder behavior. |
| F-1-3 account/network claims exceeded telemetry coverage | Fixed: separate `no-account`, `no-network`, and `no-telemetry` claims pass. |
| F-1-4 “Every command” JSON breadth | Fixed: the tagged test covers scan, guard, snapshot, verify, restore, demo, `--demo`, and applicable errors. |
| F-1-5 overwrite refusal unregistered | Fixed: registered test leaves sentinel target bytes unchanged. |
| F-1-6 source-open isolation unregistered | Fixed: the syscall interposer test covers closed WAL, active WAL, and persistent journal. |
| F-1-7 distribution claims unregistered | Fixed: release-assets and package-manifests claims pass against the current release/repository. |
| F-1-8 build/release statements unregistered | Fixed: build-contract and release-workflow claims pass. |
| F-1-9 unexplained “preflight,” WAL, and SHM | Fixed: “sync check” is used and both acronyms are expanded on first explanatory use. |
| F-1-10 unsafe copy/WAL “become” a packet | Fixed: copy now says the CLI blocks raw copying and creates a separate packet. |
| F-1-11 visible “Copy” action | Fixed: “Copy demo command” changes to “Demo command copied.” |
| F-1-12 vague “Start for real” action | Fixed: “Install the CLI” points to `/#install`. |
| F-1-13 route metadata | **Half fixed: F-2-1.** SPA routes are complete, but the actual production HTTP 404 is a separate incomplete document. |

The older cumulative handoff issues were also rechecked: immutable asset caching, GitHub cache registration, checksum mismatch rejection, terminal keyboard naming, four-note demo parity, bounded lock failure/cleanup, release-tag provenance, closed-WAL/read-only source preservation, installer wording, and platform selection remain fixed. Unknown paths correctly return HTTP 404 and show a designed page. The earlier mobile-target issue is incomplete on that production-only page because its skip link is 43px high (F-2-2).

## Structure, accessibility, and identity

- PASS: `/`, `/?demo=1`, `/demo`, `/privacy`, and `/terms` have route-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, one h1, one main, `lang=en`, consistent navigation/footer, SVG and apple-touch icons, and Privacy/Terms links.
- PASS: deep links, SPA pushState, Back, heading focus, polite route announcement, skip link order, reduced motion, 200% zoom, no horizontal overflow, and all 14 crawled links.
- PASS: normal routes at 1440×900 and 390×844 have zero Axe violations, console errors, page errors, or targets below 44×44.
- PASS: the real unknown URL returns HTTP 404, is noindexed, has one h1/main, has no Axe violation, and visually uses the product's dark glass/database identity.
- FAIL: the real 404 metadata and shell are incomplete (F-2-1), its focused skip target is 43px high (F-2-2), and its h1 uses a packet metaphor (F-2-3).
- PASS: the luminous database landscape, mint/amber safety semantics, clipped instrument panels, narrow technical typography, and one-shot integrity sweep are recognizably product-specific rather than a generic SaaS template.
- PASS: built JS is 16.12 KB raw / 5.53 KB gzip; built CSS is 13.15 KB raw / 3.82 KB gzip.

## Quality gates

- `npm test`: PASS — 10 Rust integration tests and 28 Playwright tests.
- `npm run build`: PASS — release binary and `dist/site/` produced.
- All 21 exact claim commands: PASS from the clean clone.
- `/opt/fleet/lib/verify-url.sh` on home and demo: PASS — correct title/lang/h1/main/alt/button checks and zero console errors.
- Live audit: PASS for five normal routes at both viewports, keyboard/back focus, reduced motion, privacy, service workers, 200% zoom, links, and platform download.
- Production 404 audit: FAIL — F-2-1 and F-2-2.

## Missed leverage

No AI feature is justified. This job is deterministic inspection, SQLite backup, hashing, and restore; generated advice would reduce confidence. The brief does not require the tool to become a sync engine, and the existing `guard` exit code supplies the integration point for file-sync hooks. No missing import, export, sync, or AI feature is raised.

## What would make this perfect

1. Make the standalone production 404 use the complete route metadata and the same header/footer skeleton as the rest of the site.
2. Raise its skip link to at least 44×44 CSS pixels and test the built/deployed 404 rather than Vite's SPA fallback.
3. Replace “Path check failed / This page is not in the packet” with “404 error / Page not found.”
4. Re-run this entire review from a clean clone. PASS requires zero findings, including these production-only 404 details.
