# Demo sandbox

## Entry points

- Browser: `https://db-file-sync-safety.sociobot.in/?demo=1`
- Local site: `http://localhost:5173/?demo=1`
- CLI: `dbsync-safe --demo` or `dbsync-safe demo`

The CLI creates `field-notes.sqlite` from `examples/field-notes.sql`. It keeps the database open in WAL mode, runs the sync check, writes a packet, restores it into a second folder, and prints the temporary root.

The browser route replays the exact four states printed by the binary. Its result says all 4 sample notes reached the restored folder.

The fourth note is written while WAL mode is active. The claim regression queries the real CLI demo's restored database and requires the browser count to match.

The route makes no API request and uses no browser storage. Its sample state lives only in the current DOM.

## Reset and isolation

- Click **Reset demo** to rebuild the browser recording from its original state.
- Click **Install the CLI** to leave the demo and open installation.
- Each CLI run uses a process-specific folder under the operating system's temporary directory.
- CLI demo sample, packet, and restore paths stay inside that temporary folder.
