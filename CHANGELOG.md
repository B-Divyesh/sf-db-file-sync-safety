# Changelog

## 0.1.3 — 2026-08-29

- Snapshot closed databases that retain a finalized `journal_mode=PERSIST` rollback journal without changing the source.
- Add syscall-level source-open and network-denial claim checks plus complete JSON, overwrite, packaging, and build claims.
- Add the isolated `?demo=1` entry, precise first-screen copy, route metadata, and a standalone designed 404 response.

## 0.1.2 — 2026-08-29

- Stage source database and WAL bytes before SQLite opens a working copy, so snapshot acquisition cannot create or edit source sidecars.
- Snapshot closed WAL-mode databases from read-only folders and compare the complete source tree before and after.
- Offer the distribution-neutral archive on Linux and avoid guessing the Mac architecture from browser identifiers.

## 0.1.1 — 2026-08-29

- Correct the browser demo to report all four restored sample notes, including the live-WAL write.
- Stop a snapshot after two seconds of continuous SQLite lock contention and remove its staging files.
- Add regression coverage linking the browser result to the real restored sample database.

## 0.1.0 — 2026-08-28

- Detect SQLite databases by file header and group WAL, SHM, and journal sidecars.
- Create consistent snapshots with SQLite's backup API.
- Write checksummed manifests and verify restores in a separate folder.
- Add JSON output, an isolated CLI demo, installers, packages, and product documentation.
