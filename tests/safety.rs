use db_file_sync_safety::{create_snapshot, restore_packet, scan, verify_packet, SafetyState};
use rusqlite::Connection;
use std::{collections::BTreeMap, fs, path::Path, time::Instant};
use tempfile::tempdir;

fn database(path: &Path, wal: bool, rows: usize) -> Connection {
    let connection = Connection::open(path).unwrap();
    connection
        .execute_batch("CREATE TABLE items(id INTEGER PRIMARY KEY, value TEXT NOT NULL);")
        .unwrap();
    if wal {
        connection
            .pragma_update(None, "journal_mode", "WAL")
            .unwrap();
    }
    for index in 0..rows {
        connection
            .execute(
                "INSERT INTO items(value) VALUES (?1)",
                [format!("row-{index}")],
            )
            .unwrap();
    }
    connection
}

#[derive(Debug, PartialEq, Eq)]
struct TreeEntry {
    bytes: Vec<u8>,
    readonly: bool,
}

fn exact_tree(root: &Path) -> BTreeMap<String, TreeEntry> {
    fn visit(root: &Path, directory: &Path, entries: &mut BTreeMap<String, TreeEntry>) {
        let mut children = fs::read_dir(directory)
            .unwrap()
            .map(|entry| entry.unwrap())
            .collect::<Vec<_>>();
        children.sort_by_key(|entry| entry.file_name());
        for child in children {
            let path = child.path();
            let relative = path
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .to_string();
            let kind = child.file_type().unwrap();
            if kind.is_dir() {
                entries.insert(
                    format!("{relative}/"),
                    TreeEntry {
                        bytes: Vec::new(),
                        readonly: fs::metadata(&path).unwrap().permissions().readonly(),
                    },
                );
                visit(root, &path, entries);
            } else if kind.is_file() {
                entries.insert(
                    relative,
                    TreeEntry {
                        bytes: fs::read(&path).unwrap(),
                        readonly: fs::metadata(&path).unwrap().permissions().readonly(),
                    },
                );
            }
        }
    }

    let mut entries = BTreeMap::new();
    visit(root, root, &mut entries);
    entries
}

#[test]
fn twenty_sqlite_scenarios_block_raw_copy_and_restore() {
    for scenario in 0..20 {
        let temp = tempdir().unwrap();
        let source = temp.path().join("source");
        fs::create_dir(&source).unwrap();
        let nested = if scenario % 4 == 0 {
            source.join("nested")
        } else {
            source.clone()
        };
        fs::create_dir_all(&nested).unwrap();
        let path = nested.join(format!("app-{scenario}.sqlite"));
        let connection = database(&path, scenario % 2 == 0, scenario + 1);
        let report = scan(&source).unwrap();
        assert_eq!(report.databases.len(), 1, "scenario {scenario}");
        assert!(!report.raw_copy_safe, "scenario {scenario}");
        if scenario % 2 == 0 {
            assert_eq!(report.databases[0].state, SafetyState::SnapshotRequired);
        }
        let packet = temp.path().join("packet");
        let manifest = create_snapshot(&source, &packet).unwrap();
        assert_eq!(manifest.entries.len(), 1);
        verify_packet(&packet).unwrap();
        let target = temp.path().join("target");
        let restored = restore_packet(&packet, &target, false).unwrap();
        assert!(restored.verified);
        let restored_path = target.join(&report.databases[0].path);
        let restored_connection = Connection::open(restored_path).unwrap();
        let count: usize = restored_connection
            .query_row("SELECT count(*) FROM items", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, scenario + 1, "scenario {scenario}");
        drop(connection);
    }
}

#[test]
fn ignores_non_sqlite_files_and_reports_empty_state() {
    let temp = tempdir().unwrap();
    fs::write(temp.path().join("notes.txt"), "not a database").unwrap();
    let report = scan(temp.path()).unwrap();
    assert!(report.databases.is_empty());
    assert!(report.next_step.contains("No SQLite"));
}

#[test]
fn detects_database_without_a_db_extension() {
    let temp = tempdir().unwrap();
    let connection = database(&temp.path().join("profile-data"), false, 2);
    let report = scan(temp.path()).unwrap();
    assert_eq!(report.databases[0].path, "profile-data");
    drop(connection);
}

#[test]
fn rejects_tampered_packet_before_restore() {
    let temp = tempdir().unwrap();
    let source = temp.path().join("source");
    fs::create_dir(&source).unwrap();
    let connection = database(&source.join("data.sqlite"), false, 3);
    let packet = temp.path().join("packet");
    create_snapshot(&source, &packet).unwrap();
    fs::write(packet.join("databases/data.sqlite"), "broken").unwrap();
    let error = restore_packet(&packet, &temp.path().join("target"), false).unwrap_err();
    assert!(error.contains("Checksum failed"));
    drop(connection);
}

#[test]
fn refuses_to_replace_a_target_by_default() {
    let temp = tempdir().unwrap();
    let source = temp.path().join("source");
    fs::create_dir(&source).unwrap();
    let connection = database(&source.join("data.sqlite"), false, 1);
    let packet = temp.path().join("packet");
    create_snapshot(&source, &packet).unwrap();
    let target = temp.path().join("target");
    fs::create_dir(&target).unwrap();
    fs::write(target.join("data.sqlite"), "keep me").unwrap();
    let error = restore_packet(&packet, &target, false).unwrap_err();
    assert!(error.contains("already exists"));
    assert_eq!(
        fs::read_to_string(target.join("data.sqlite")).unwrap(),
        "keep me"
    );
    drop(connection);
}

#[test]
fn locked_database_fails_within_a_bound_and_removes_staging_files() {
    let temp = tempdir().unwrap();
    let source = temp.path().join("source");
    fs::create_dir(&source).unwrap();
    let connection = database(&source.join("locked.sqlite"), false, 1);
    connection.execute_batch("BEGIN EXCLUSIVE;").unwrap();
    connection
        .execute("INSERT INTO items(value) VALUES ('uncommitted')", [])
        .unwrap();
    let packet = temp.path().join("packet");

    let started = Instant::now();
    let error = create_snapshot(&source, &packet).unwrap_err();

    assert!(started.elapsed().as_secs_f32() < 3.0, "{error}");
    assert!(error.contains("stayed locked for 2 seconds"), "{error}");
    assert!(!packet.exists());
    assert!(!packet
        .with_extension(format!("partial-{}", std::process::id()))
        .exists());
}

#[test]
fn closed_wal_database_snapshot_preserves_every_source_path_and_byte() {
    let temp = tempdir().unwrap();
    let source = temp.path().join("source");
    fs::create_dir(&source).unwrap();
    let database_path = source.join("closed.sqlite");
    let connection = database(&database_path, true, 4);
    drop(connection);
    assert_eq!(
        fs::read_dir(&source).unwrap().count(),
        1,
        "the closed WAL database must begin without sidecars"
    );

    let before = exact_tree(&source);
    let packet = temp.path().join("packet");
    create_snapshot(&source, &packet).unwrap();
    let after = exact_tree(&source);

    assert_eq!(after, before, "snapshot changed the source directory tree");
    let restored = temp.path().join("restored");
    restore_packet(&packet, &restored, false).unwrap();
    let restored_connection = Connection::open(restored.join("closed.sqlite")).unwrap();
    let count: usize = restored_connection
        .query_row("SELECT count(*) FROM items", [], |row| row.get(0))
        .unwrap();
    assert_eq!(count, 4);
}

#[cfg(unix)]
#[test]
fn readonly_closed_wal_source_snapshot_preserves_exact_tree() {
    use std::os::unix::fs::PermissionsExt;

    let temp = tempdir().unwrap();
    let source = temp.path().join("readonly-source");
    fs::create_dir(&source).unwrap();
    let database_path = source.join("closed.sqlite");
    let connection = database(&database_path, true, 3);
    drop(connection);
    fs::set_permissions(&database_path, fs::Permissions::from_mode(0o444)).unwrap();
    fs::set_permissions(&source, fs::Permissions::from_mode(0o555)).unwrap();

    let before = exact_tree(&source);
    let packet = temp.path().join("readonly-packet");
    create_snapshot(&source, &packet).unwrap();
    let after = exact_tree(&source);

    assert_eq!(after, before, "snapshot changed the read-only source tree");
    verify_packet(&packet).unwrap();
}

#[test]
fn active_wal_snapshot_preserves_existing_sidecar_bytes() {
    let temp = tempdir().unwrap();
    let source = temp.path().join("source");
    fs::create_dir(&source).unwrap();
    let database_path = source.join("active.sqlite");
    let connection = database(&database_path, true, 5);
    assert!(source.join("active.sqlite-wal").exists());
    assert!(source.join("active.sqlite-shm").exists());

    let before = exact_tree(&source);
    let packet = temp.path().join("packet");
    create_snapshot(&source, &packet).unwrap();
    let after = exact_tree(&source);

    assert_eq!(after, before, "snapshot changed active WAL sidecars");
    drop(connection);
}
