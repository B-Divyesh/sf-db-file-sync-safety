# Adversarial first-read review 4 — DB File Sync Safety

**Reviewed:** 29 August 2026 UTC  
**Candidate:** `c258e3842a033927a111105339c0f37f545bb7fb`  
**Live site:** <https://db-file-sync-safety.sociobot.in>  
**Verdict:** **PASS**

No finding remains. This review used fresh Chromium contexts, a fresh no-local clone, the live production URL, and the shipped release build. All checks described below passed.

## Cold first screen

Before scrolling at both 390×844 and 1440×900, I could answer all three required questions.

| Check | First-read answer | Exact text that establishes it |
| --- | --- | --- |
| What it does | Blocks unsafe raw SQLite copying and makes a verified packet to sync. | “Make SQLite snapshots safe to sync” and “it blocks raw database copies and creates a verified packet.” |
| Who it is for | Developers who sync application folders between devices. | “For developers syncing app folders” |
| What to click first | **Try it with sample data**. | “Try it with sample data” |

The three first-screen facts were also completely visible without scrolling: at 390px their bottoms were 609.2, 642.9, and 676.6 CSS pixels in an 844px viewport; at 1440px all ended at 706.5px in a 900px viewport. This confirms `F-3-1` remains fixed.

## Copy audit

Counts are whitespace-delimited; hyphenated words, paths, flags, versions, and commands each count as one. Commands in README code fences are excluded because they are executable syntax. Headings, controls, terminal labels, and conditional states are included separately so they are not hidden from review.

No landing-page or README sentence exceeds 22 words. No banned marketing adjective, metaphorical/mood heading, unexplained first-use acronym, terminology change, or non-result-naming button was found. `bundle`, `snapshot`, `packet`, and `restore` retain their distinct meanings.

### Landing page text

| Words | Text |
| ---: | --- |
| 4 | Skip to main content |
| 1 | dbsync-safe |
| 1 | Demo |
| 1 | Install |
| 1 | Privacy |
| 4 | SQLite sync check · v0.1.3 |
| 6 | Make SQLite snapshots safe to sync |
| 15 | For developers syncing app folders, it blocks raw database copies and creates a verified packet. |
| 5 | Try it with sample data |
| 2 | View downloads (pre-release-load state) |
| 4 | Download for Linux x64 (observed live state) |
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
| 8 | The shell installer verifies SHA-256 before installation. |
| 2 | Detected system |
| 2 | Linux x64 |
| 6 | v0.1.3 is ready for Linux x64. |
| 3 | macOS or Linux |
| 2 | Windows PowerShell |
| 3 | Package manager options |
| 10 | The macOS package and Windows binary are unsigned in v0.1.3. |
| 6 | Verified SQLite packets for file sync. |
| 1 | Terms |
| 5 | Built by Param Factory (external) |
| 4 | v0.1.3 · build 004 |

Conditional release states were also checked: “Checking your system…” (3), “Checking the latest release…” (4), “Choose a macOS download” (4), “v0.1.3 has Apple silicon and Intel packages.” (7), “Downloads are being published.” (4), and “The release page has the current status.” (7). They are plain, specific states and remain under the limit.

### README text

| Words | Text |
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

**Terminology:** source main file plus sidecars = **bundle**; consistent SQLite copy = **snapshot**; checksummed directory to sync = **packet**; checked destination operation = **restore**. The visible actions name results: Try, View/Download, Copy demo command, Scan, Make, Restore, Install, and Reset.

## Demo and sandbox

**PASS.** Clicking **Try it with sample data** from the first screen opens `/?demo=1`. The first resulting mobile screen is already populated with the realistic `field-notes.sqlite` sample, a live WAL, raw-copy refusal, snapshot, restore, checksum/integrity result, packet path, and the result “4 notes reached a new folder, including the live-WAL note.”

The persistent banner says exactly “Demo — sample data, nothing is saved” and supplies **Reset demo** and **Install the CLI**. Reset restores the original terminal recording and announces the fresh-demo result. A direct fresh demo made only same-origin document, JS, CSS, and image requests; localStorage, sessionStorage, cookies, and service workers were empty. The demo therefore does not enter real browser storage.

The independently run release command from an empty temporary invoking directory was:

```sh
dbsync-safe --json --demo
```

It reported `raw_copy_safe: false`, `restore.verified: true`, the WAL/SHM sidecars, and a single restored database. Its sample, packet, and restore all lived below `/tmp/dbsync-safe-demo-8202`; `find` showed the invoking directory remained empty.

No offline promise is made. The registered browser request/storage test and CLI socket-denial test confirm the stated privacy behavior.

## Claims

I created a fresh no-local clone at `/tmp/dbsync-review-4.ZNEL1Y/clone`, ran `npm ci`, then executed every exact command in `.factory/claims.json` separately. Each passed; each tag has one corresponding browser/test implementation. Public landing and README statements map to the relevant registered entries, so there is no unlisted claim.

| Claim ID | Result |
| --- | --- |
| `sqlite-wal-detection` | PASS |
| `consistent-snapshot` | PASS |
| `persistent-journal-snapshot` | PASS |
| `readonly-source-snapshot` | PASS |
| `source-open-isolation` | PASS |
| `verified-restore` | PASS |
| `restore-overwrite-refusal` | PASS |
| `demo-restored-count` | PASS |
| `json-output` | PASS |
| `local-execution` | PASS |
| `no-account` | PASS |
| `no-network` | PASS |
| `no-telemetry` | PASS |
| `github-release-cache` | PASS |
| `sqlite-only-scope` | PASS |
| `mit-free` | PASS |
| `installer-checksum` | PASS |
| `release-assets` | PASS |
| `package-manifests` | PASS |
| `build-contract` | PASS |
| `release-workflow` | PASS |

## Earlier findings

Every prior review and polish document, including the existing handoff, was read and rechecked against the live site and current code.

| Earlier finding | Independent result |
| --- | --- |
| F-1-1 persistent-journal snapshot | Fixed; the clean claim snapshots/restores the finalized journal and preserves source bytes. |
| F-1-2 broad file-read statement | Fixed; public text is limited to the tested temporary-folder boundary. |
| F-1-3 account/network/telemetry breadth | Fixed; separate `no-account`, `no-network`, and `no-telemetry` claims pass. |
| F-1-4 every-command JSON support | Fixed; the tagged test covers all commands, both demo spellings, and applicable errors. |
| F-1-5 overwrite refusal | Fixed; the registered regression retains sentinel bytes. |
| F-1-6 source-open isolation | Fixed; the syscall test observes read-only source access and private SQLite opens. |
| F-1-7 distribution claims | Fixed; release assets and all three package manifests are checked. |
| F-1-8 build/release claims | Fixed; the registered build and workflow contracts pass. |
| F-1-9 unexplained preflight/WAL/SHM | Fixed; “sync check” is used and WAL/SHM are expanded on first use. |
| F-1-10 unsafe copy/WAL becoming a packet | Fixed; copy says raw copying is blocked and a separate packet is created. |
| F-1-11 vague Copy control | Fixed; the visible control is “Copy demo command” and gives a result. |
| F-1-12 vague demo exit | Fixed; “Install the CLI” names its destination. |
| F-1-13 route metadata | Fixed on all SPA routes and on the production HTTP 404. |
| F-2-1 incomplete standalone 404 | Fixed; live 404 has full metadata and the normal shell. |
| F-2-2 short standalone-404 skip target | Fixed; 390px target checks pass at ≥44px. |
| F-2-3 metaphorical 404 copy | Fixed; it says “404 error” and “Page not found.” |
| F-3-1 desktop first-screen facts | Fixed; all three facts fit at both reviewed desktop heights. |

## Structure, accessibility, privacy, and identity

**PASS.** The independent live audit checked `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, and a real unknown URL at 1440×900, 1440×768, and 390×844. Every normal route returned 200; the unknown URL returned the designed 404. Each has `lang=en`, one `<main>`, one `<h1>`, a route-specific title/description/canonical/OG/Twitter metadata, favicon and apple-touch icon, consistent header/footer, Privacy and Terms links, and the proper noindex 404 policy.

The browser audit found zero Axe violations, console/page errors, horizontal overflow, dead links, undersized targets, or focus failures. The skip link is first; direct links, History API Back, focus movement to the route heading, and live route announcements work. Reduced motion suppresses the integrity sweep and terminal animation; 200% zoom retains the content. `robots.txt` and `sitemap.xml` are present. Production headers include HSTS, CSP with `frame-ancestors 'none'` as a response header, nosniff, referrer policy, and permissions policy.

The dark glass database landscape, clipped technical panels, restrained mint/amber safety states, custom database mark, and one-shot integrity sweep match `.factory/design.md` and are distinct from a generic SaaS template. There is no missing AI, import/export, or sync feature implied by the brief: deterministic detection, snapshotting, hashing, restoration, and a sync-hook guard are the appropriate complete scope.

## Quality gates

From the fresh clone:

- `npm test` — PASS: 10 Rust integration tests and 30 Playwright tests.
- `npm run typecheck` — PASS.
- `npm run build` — PASS; produces the release binary and `dist/site/`.
- All 21 exact claim commands — PASS individually.
- `node scripts/live-audit.mjs https://db-file-sync-safety.sociobot.in` — PASS: routes, production 404, desktop/mobile structure, Axe, console, keyboard/back focus, reduced motion, privacy/storage, 200% zoom, and 14 links.

## What would make this perfect

No additional product change was identified. Keep the current standard by running the full claim matrix and live audit after every release, especially the production-404 and first-screen viewport checks.
