# Landing copy audit

Audited on 28 August 2026. Counts treat hyphenated terms, paths, and version strings as one word. UI labels and terminal rows are included because visitors read them as product copy.

| Words | Copy |
| ---: | --- |
| 3 | SQLite preflight · v0.1.0 |
| 6 | Make SQLite snapshots safe to sync |
| 15 | For developers syncing app folders, it blocks raw database copies and creates a verified packet. |
| 5 | Try it with sample data |
| 2 | View downloads |
| 8 | See a live WAL become a verified packet. |
| 4 | Runs on your device |
| 2 | No telemetry |
| 3 | Free under MIT |
| 3 | Live bundle |
| 2 | Backup API |
| 2 | Verified packet |
| 3 | Real CLI output |
| 7 | Watch the unsafe copy become a packet |
| 12 | The bundled demo creates a temporary SQLite database with a live WAL. |
| 10 | It snapshots and restores that database without reading your files. |
| 5 | Scan: field-notes.sqlite plus live WAL |
| 6 | Block: raw file copy refused |
| 4 | Snapshot: backup created |
| 5 | Restore: checksum and integrity passed |
| 2 | Copy demo command |
| 2 | Safe procedure |
| 6 | Replace raw copying with three checks |
| 4 | Scan the source folder |
| 10 | Find SQLite headers and their WAL, SHM, or journal sidecars. |
| 4 | Make the snapshot packet |
| 11 | Use SQLite’s backup API, then write checksums and a restore procedure. |
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
| 7 | Installers verify SHA-256 before changing your path. |
| 2 | Detected system |
| 3 | Checking your system… |
| 2 | Checking the latest release… |
| 4 | Download for [detected system] |
| 4 | Downloads are being published. |
| 7 | The release page has the current status. |
| 3 | macOS or Linux |
| 2 | Windows PowerShell |
| 3 | Package manager options |
| 10 | The macOS package and Windows binary are unsigned in v0.1.0. |
| 6 | Verified SQLite packets for file sync. |
| 4 | Built by Param Factory |

No sentence exceeds 22 words. No copy contains a banned word from the plain-words contract.

## Terminology table

| Concept | One term |
| --- | --- |
| SQLite main file plus live sidecars | bundle |
| Safe directory produced for sync | packet |
| SQLite copy created through the backup API | snapshot |
| Destination operation on another folder | restore |
| Pre-copy detection step | scan |
| Refusal to approve raw copying | block |
| WAL, SHM, or rollback journal | sidecar |

The words **bundle** and **packet** name different states. A live bundle must never be described as a safe packet.

## Five-second read

Read aloud: “Make SQLite snapshots safe to sync. For developers syncing app folders, it blocks raw database copies and creates a verified packet. Try it with sample data.”

The job, audience, changed outcome, and first action fit in one short breath.

## Catalog description

Make verified SQLite snapshots before a file-sync tool copies them.

