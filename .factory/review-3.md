# Adversarial first-read review 3 — DB File Sync Safety

**Reviewed:** 29 August 2026 UTC<br>
**Candidate:** `df3daaaa870ff344d35104bc6f3d7f86b99a0434`<br>
**Live site:** <https://db-file-sync-safety.sociobot.in><br>
**Verdict:** **FAIL**

The cold read, one-click demo, sandbox, 21 registered claims, full test/build gates, prior-finding repairs, routing, production 404, accessibility, privacy, links, and visual identity pass. The required zero-finding threshold does not pass: the desktop first screen places all three mandatory privacy/price facts below the fold.

## Findings

### F-3-1 — MINOR — The desktop first screen hides all three mandatory facts

**Exact text and location:** landing hero, `.plain-facts`: “Runs on your device,” “No telemetry,” and “Free under MIT.”

**Evidence:** in a fresh Chromium context at 1440×900 with `scrollY = 0`, the list begins at y=878.2, while each fact begins at y=899.2 and ends at y=920.9. Less than one pixel of the text area intersects the viewport. At common 1440×768 and 1440×844 desktop viewports, none of the list intersects the viewport. The 390×844 phone layout does show all three facts before its hero image.

**Why this matters:** the mandatory first-screen shape requires three short privacy/offline/price facts. A desktop visitor cannot confirm local execution, telemetry status, or price without scrolling, despite those facts being present on mobile.

**Concrete fix:** reduce the desktop hero’s vertical copy footprint so all three `.plain-facts li` elements fit above the fold at 1440×900 and 1440×768. For example, reduce the headline size/line count and hero padding while keeping the asymmetric layout. Add a browser assertion that every fact’s `getBoundingClientRect().bottom` is no greater than `innerHeight` at 1440×900, 1440×768, and 390×844.

## Cold first screen

Fresh browser contexts opened `/` at 390×844 and 1440×900 before scrolling.

- **What it does, in my words:** blocks raw SQLite file copying and creates a verified snapshot packet for syncing.
- **For whom:** developers who sync application folders between devices.
- **What to click first:** **Try it with sample data**.

The exact text that supplied those answers was “Make SQLite snapshots safe to sync,” “For developers syncing app folders, it blocks raw database copies and creates a verified packet,” and “Try it with sample data.” All three questions are answerable at both widths, so the blocking cold-read gate passes. F-3-1 concerns the separate mandatory fact list.

## Copy audit

Counts are whitespace-delimited. Hyphenated terms, paths, flags, and version strings count as one word. Commands in README code fences are excluded because they are executable syntax; visible command/terminal labels on the landing page are included. No sentence exceeds 22 words. No banned marketing adjective, unexplained metaphor, inconsistent term, meaningless heading, or non-result-naming action was found. F-3-1 is a placement defect, not a copy defect.

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

Conditional landing states were also counted: “View downloads” (2), “Checking your system…” (3), “Checking the latest release…” (4), “Choose a macOS download” (4), “v0.1.3 has Apple silicon and Intel packages” (7), “Downloads are being published” (4), and “The release page has the current status” (7).

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

`bundle` means the source database plus sidecars; `snapshot` is SQLite’s consistent copy; `packet` is the checksummed sync directory; `restore` is the verified destination operation. Those terms remain distinct. Actions name their results: Try, Download/View, Copy, Scan, Make, Restore, Install, Choose, Reset, and Return.

## Demo and sandbox

**Browser demo: PASS.** One click opens `/?demo=1`. At 390×844, the first resulting screen already shows the `field-notes.sqlite` path and terminal rows for scan, raw-copy refusal, snapshot, and restore. The page reports four restored notes, including the live-WAL note.

The persistent banner says “Demo — sample data, nothing is saved” and contains **Reset demo** and **Install the CLI**. Reset removed an injected marker, restored all five terminal rows, and announced “Demo reset with fresh sample data.” A direct fresh demo made only three same-origin document/JS/CSS requests, left cookies, localStorage, and sessionStorage empty, and registered no service worker. The landing page’s separate, disclosed GitHub release cache was not read or changed by demo actions.

**CLI demo: PASS.** The clean-clone release binary ran `--json --demo` from a new empty temporary working directory. That directory remained empty. All generated sample, packet, and restore paths were under `/tmp/dbsync-safe-demo-7530`; raw copying was blocked, the packet integrity result was `ok`, and restore verification was true.

No offline claim is made. The no-network CLI claim passed under socket denial, and the browser request log confirms demo isolation.

## Claims

A no-local clone of the candidate was created under `/tmp`, followed by `npm ci`. Every exact `test` string in `.factory/claims.json` was run separately. Each claim tag occurs exactly once in the test sources.

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

The landing, Demo, Privacy, Terms, and README claim-like statements map to these entries. No unlisted claim or untested registered claim was found.

## History verification

Every earlier review and polish finding was checked on the live deployment and in current code.

| Earlier finding | Independent result |
| --- | --- |
| F-1-1 persistent rollback journal failed | Fixed: registered claim and Rust regression pass; source stays byte-identical and restore contains the row. |
| F-1-2 broad file-read promise | Fixed: public copy now states the tested temporary-folder boundary. |
| F-1-3 account/network claims exceeded coverage | Fixed: separate no-account, no-network, and no-telemetry tests pass. |
| F-1-4 “Every command” JSON breadth | Fixed: test covers all commands, both demo spellings, and applicable errors. |
| F-1-5 overwrite refusal unregistered | Fixed: registered test preserves sentinel target bytes. |
| F-1-6 source-open isolation unregistered | Fixed: syscall audit covers closed WAL, active WAL, and persistent journal. |
| F-1-7 distribution claims unregistered | Fixed: release-assets and package-manifests pass. |
| F-1-8 build/release claims unregistered | Fixed: build-contract and release-workflow pass. |
| F-1-9 unexplained jargon | Fixed: “sync check” is used and WAL/SHM are expanded on first explanatory use. |
| F-1-10 misleading “become a packet” copy | Fixed: copy now says raw copying is blocked and a separate packet is created. |
| F-1-11 visible “Copy” action | Fixed: “Copy demo command” has a result confirmation. |
| F-1-12 vague “Start for real” action | Fixed: “Install the CLI” links to installation. |
| F-1-13 route metadata | Fixed: browser-rendered SPA routes and the real HTTP 404 have route-specific metadata. |
| F-2-1 incomplete standalone 404 | Fixed: live 404 has full OG/Twitter/apple-touch metadata and normal header/footer; its file hash matches the build. |
| F-2-2 43px standalone skip target | Fixed: live mobile measurement passes ≥44×44 and code sets `min-height: 44px`. |
| F-2-3 metaphorical 404 copy | Fixed: live copy says “404 error” and “Page not found.” |

No earlier finding is unfixed, half-fixed, or regressed. F-3-1 is new.

## Structure, accessibility, and identity

- PASS: `/`, `/demo`, `/privacy`, `/terms`, and the real HTTP 404 have route-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, one h1, one main, `lang=en`, icons, and Privacy/Terms links.
- PASS: an unknown address returns HTTP 404; its standalone HTML/CSS hashes match the clean build. It has the normal shell, `noindex`, complete metadata, and direct recovery wording.
- PASS: deep links, History API, Back, route-heading focus, polite announcements, keyboard navigation, reduced motion, 200% zoom, and all 14 crawled links.
- PASS: normal routes and the HTTP 404 at 1440×900 and 390×844 have zero Axe violations, console/page errors, overflow, or targets below 44×44.
- PASS: the luminous database landscape, mint/amber safety semantics, clipped instrument panels, technical type, and integrity sweep are product-specific rather than a generic SaaS template.
- PASS: first-load JavaScript is 16.10 KB raw / 5.51 KB gzip; CSS is 13.18 KB raw / 3.83 KB gzip.
- FAIL: the three mandatory facts are below the desktop first-screen fold (F-3-1).

## Quality gates

- All 21 exact claim commands: PASS from the clean clone.
- `npm test`: PASS — 10 Rust integration tests and 28 Playwright tests.
- `npm run build`: PASS — release binary and `dist/site/` produced.
- `node scripts/live-audit.mjs https://db-file-sync-safety.sociobot.in`: PASS — five routes plus production 404, two viewports, accessibility, privacy, links, focus, reduced motion, and zoom.
- `/opt/fleet/lib/verify-url.sh` on `/` and `/?demo=1`: PASS.
- Core live HTML/JS/CSS and standalone 404 HTML/CSS hashes match the clean build.

## Missed leverage

No missing AI feature is raised. SQLite inspection, backup, hashing, and integrity verification are deterministic safety work; generated advice would not improve the core job. The brief explicitly excludes a sync engine, and `guard` supplies a sync-hook integration point. No obvious import/export/sync feature is absent from the stated scope.

## What would make this perfect

Fit “Runs on your device,” “No telemetry,” and “Free under MIT” fully inside the desktop first viewport, add the viewport-bound regression described in F-3-1, and rerun the complete review. Nothing else remains open.
