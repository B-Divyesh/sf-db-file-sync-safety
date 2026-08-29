use rusqlite::{
    backup::{Backup, StepResult},
    Connection, OpenFlags,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const MANIFEST_NAME: &str = "dbsync-safe-manifest.json";
const BACKUP_LOCK_TIMEOUT: Duration = Duration::from_secs(2);
const BACKUP_RETRY_DELAY: Duration = Duration::from_millis(25);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DatabaseFinding {
    pub path: String,
    pub sidecars: Vec<String>,
    pub state: SafetyState,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SafetyState {
    SnapshotRequired,
    ReadyForSnapshot,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanReport {
    pub root: String,
    pub sqlite_only: bool,
    pub databases: Vec<DatabaseFinding>,
    pub raw_copy_safe: bool,
    pub next_step: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestEntry {
    pub source_relative_path: String,
    pub snapshot_path: String,
    pub sha256: String,
    pub bytes: u64,
    pub source_sidecars_seen: Vec<String>,
    pub integrity_check: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub format: String,
    pub tool_version: String,
    pub created_unix_seconds: u64,
    pub source_root: String,
    pub entries: Vec<ManifestEntry>,
    pub procedure: Vec<String>,
    pub limits: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreReport {
    pub target: String,
    pub restored: Vec<String>,
    pub verified: bool,
}

pub fn scan(root: &Path) -> Result<ScanReport, String> {
    if !root.exists() {
        return Err(format!(
            "{} does not exist. Check the path and try again.",
            root.display()
        ));
    }
    let files = collect_files(root)?;
    let mut databases = Vec::new();
    for path in files {
        if is_sidecar(&path) || !has_sqlite_header(&path) {
            continue;
        }
        let sidecars = sidecars_for(&path);
        let names: Vec<String> = sidecars
            .iter()
            .filter(|item| item.exists())
            .filter_map(|item| {
                item.file_name()
                    .map(|name| name.to_string_lossy().to_string())
            })
            .collect();
        let state = if names.is_empty() {
            SafetyState::ReadyForSnapshot
        } else {
            SafetyState::SnapshotRequired
        };
        let reason = if names.is_empty() {
            "No SQLite sidecar file was found. A snapshot is still required before sync."
                .to_string()
        } else {
            format!(
                "Found live SQLite sidecar files: {}. Do not copy this bundle raw.",
                names.join(", ")
            )
        };
        databases.push(DatabaseFinding {
            path: relative_string(root, &path),
            sidecars: names,
            state,
            reason,
        });
    }
    databases.sort_by(|a, b| a.path.cmp(&b.path));
    let next_step = if databases.is_empty() {
        "No SQLite databases were found. Select a folder that contains a SQLite file.".to_string()
    } else {
        "Run `dbsync-safe snapshot <path> --output <packet>` and sync only the packet.".to_string()
    };
    Ok(ScanReport {
        root: absolute(root),
        sqlite_only: true,
        raw_copy_safe: false,
        databases,
        next_step,
    })
}

pub fn create_snapshot(root: &Path, output: &Path) -> Result<Manifest, String> {
    if output.exists() {
        return Err(format!(
            "{} already exists. Choose a new packet path.",
            output.display()
        ));
    }
    let report = scan(root)?;
    if report.databases.is_empty() {
        return Err("No SQLite databases were found. Nothing was written.".to_string());
    }
    let stage = output.with_extension(format!("partial-{}", std::process::id()));
    if stage.exists() {
        fs::remove_dir_all(&stage).map_err(io_error)?;
    }
    fs::create_dir_all(stage.join("databases")).map_err(io_error)?;

    let result = (|| {
        let mut entries = Vec::new();
        for finding in &report.databases {
            let source = resolve_finding(root, &finding.path);
            let relative = safe_relative(&finding.path)?;
            let destination = stage.join("databases").join(&relative);
            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent).map_err(io_error)?;
            }
            backup_database(&source, &destination)?;
            let integrity = integrity_check(&destination)?;
            if integrity != "ok" {
                return Err(format!(
                    "Snapshot verification failed for {}: {}",
                    finding.path, integrity
                ));
            }
            entries.push(ManifestEntry {
                source_relative_path: finding.path.clone(),
                snapshot_path: format!(
                    "databases/{}",
                    relative.to_string_lossy().replace('\\', "/")
                ),
                sha256: sha256_file(&destination)?,
                bytes: fs::metadata(&destination).map_err(io_error)?.len(),
                source_sidecars_seen: finding.sidecars.clone(),
                integrity_check: integrity,
            });
        }
        let manifest = Manifest {
            format: "dbsync-safe/v1".to_string(),
            tool_version: env!("CARGO_PKG_VERSION").to_string(),
            created_unix_seconds: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            source_root: absolute(root),
            entries,
            procedure: vec![
                "Sync this packet directory, not the live source database or its sidecars."
                    .to_string(),
                "On the other device, run `dbsync-safe restore <packet> --target <folder>`."
                    .to_string(),
                "Open the restored database only after verification succeeds.".to_string(),
            ],
            limits: vec![
                "SQLite only. Other database formats are ignored.".to_string(),
                "A successful snapshot does not make simultaneous application use safe."
                    .to_string(),
                "OS and application locking behavior varies; close the application when possible."
                    .to_string(),
            ],
        };
        write_manifest(&stage, &manifest)?;
        verify_packet(&stage)?;
        Ok(manifest)
    })();

    match result {
        Ok(manifest) => {
            fs::rename(&stage, output).map_err(io_error)?;
            Ok(manifest)
        }
        Err(error) => {
            let _ = fs::remove_dir_all(&stage);
            Err(error)
        }
    }
}

pub fn verify_packet(packet: &Path) -> Result<Manifest, String> {
    let manifest = read_manifest(packet)?;
    if manifest.format != "dbsync-safe/v1" {
        return Err("This packet format is not supported.".to_string());
    }
    if manifest.entries.is_empty() {
        return Err("The packet manifest has no databases.".to_string());
    }
    for entry in &manifest.entries {
        let file = packet.join(safe_relative(&entry.snapshot_path)?);
        if !file.is_file() {
            return Err(format!("Packet file is missing: {}", entry.snapshot_path));
        }
        let actual = sha256_file(&file)?;
        if actual != entry.sha256 {
            return Err(format!(
                "Checksum failed for {}. Get a fresh packet.",
                entry.snapshot_path
            ));
        }
        let integrity = integrity_check(&file)?;
        if integrity != "ok" {
            return Err(format!(
                "SQLite verification failed for {}: {}",
                entry.snapshot_path, integrity
            ));
        }
    }
    Ok(manifest)
}

pub fn restore_packet(packet: &Path, target: &Path, force: bool) -> Result<RestoreReport, String> {
    let manifest = verify_packet(packet)?;
    fs::create_dir_all(target).map_err(io_error)?;
    let mut planned = Vec::new();
    for entry in &manifest.entries {
        let relative = safe_relative(&entry.source_relative_path)?;
        let destination = target.join(relative);
        if destination.exists() && !force {
            return Err(format!(
                "{} already exists. Move it away or pass --force.",
                destination.display()
            ));
        }
        planned.push((entry, destination));
    }
    let mut restored = Vec::new();
    for (entry, destination) in planned {
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent).map_err(io_error)?;
        }
        let temp = destination.with_extension(format!("restore-{}", std::process::id()));
        fs::copy(packet.join(safe_relative(&entry.snapshot_path)?), &temp).map_err(io_error)?;
        if sha256_file(&temp)? != entry.sha256 || integrity_check(&temp)? != "ok" {
            let _ = fs::remove_file(&temp);
            return Err(format!(
                "Restore verification failed for {}. The target was not replaced.",
                entry.source_relative_path
            ));
        }
        if force && destination.exists() {
            fs::remove_file(&destination).map_err(io_error)?;
        }
        fs::rename(&temp, &destination).map_err(io_error)?;
        restored.push(destination.to_string_lossy().to_string());
    }
    Ok(RestoreReport {
        target: absolute(target),
        restored,
        verified: true,
    })
}

fn backup_database(source_path: &Path, destination_path: &Path) -> Result<(), String> {
    let source = Connection::open_with_flags(
        source_path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(sql_error(source_path))?;
    source.busy_timeout(Duration::ZERO).map_err(|e| {
        format!(
            "SQLite could not prepare a snapshot of {}: {}. Close the app and try again.",
            source_path.display(),
            e
        )
    })?;
    let mut destination =
        Connection::open(destination_path).map_err(sql_error(destination_path))?;
    let backup = Backup::new(&source, &mut destination).map_err(|e| e.to_string())?;
    let mut blocked_since = None;
    loop {
        match backup.step(32).map_err(|e| {
            format!(
                "SQLite could not make a consistent snapshot of {}: {}. Close the app and try again.",
                source_path.display(),
                e
            )
        })? {
            StepResult::Done => break,
            StepResult::More => blocked_since = None,
            StepResult::Busy | StepResult::Locked => {
                let started = blocked_since.get_or_insert_with(Instant::now);
                if started.elapsed() >= BACKUP_LOCK_TIMEOUT {
                    return Err(format!(
                        "SQLite stayed locked for 2 seconds while snapshotting {}. Close the app and try again.",
                        source_path.display()
                    ));
                }
            }
            _ => {}
        }
        thread::sleep(BACKUP_RETRY_DELAY);
    }
    drop(backup);
    destination.close().map_err(|(_, e)| e.to_string())?;
    Ok(())
}

fn integrity_check(path: &Path) -> Result<String, String> {
    let connection = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(sql_error(path))?;
    connection
        .query_row("PRAGMA integrity_check", [], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Could not verify {}: {}", path.display(), e))
}

fn read_manifest(packet: &Path) -> Result<Manifest, String> {
    let path = packet.join(MANIFEST_NAME);
    let bytes = fs::read(&path).map_err(|_| {
        format!(
            "{} is not a snapshot packet. The manifest is missing.",
            packet.display()
        )
    })?;
    serde_json::from_slice(&bytes).map_err(|e| format!("The packet manifest is invalid: {}", e))
}

fn write_manifest(packet: &Path, manifest: &Manifest) -> Result<(), String> {
    let json = serde_json::to_vec_pretty(manifest).map_err(|e| e.to_string())?;
    let mut file = File::create(packet.join(MANIFEST_NAME)).map_err(io_error)?;
    file.write_all(&json).map_err(io_error)?;
    file.write_all(b"\n").map_err(io_error)
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(io_error)?;
    let mut hash = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer).map_err(io_error)?;
        if read == 0 {
            break;
        }
        hash.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hash.finalize()))
}

fn collect_files(root: &Path) -> Result<Vec<PathBuf>, String> {
    if root.is_file() {
        return Ok(vec![root.to_path_buf()]);
    }
    if !root.is_dir() {
        return Err(format!("{} is not a file or folder.", root.display()));
    }
    let mut output = Vec::new();
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in fs::read_dir(&directory).map_err(io_error)? {
            let entry = entry.map_err(io_error)?;
            let path = entry.path();
            let kind = entry.file_type().map_err(io_error)?;
            if kind.is_symlink() {
                continue;
            }
            if kind.is_dir() {
                pending.push(path);
            } else if kind.is_file() {
                output.push(path);
            }
        }
    }
    Ok(output)
}

fn has_sqlite_header(path: &Path) -> bool {
    let mut header = [0_u8; 16];
    File::open(path)
        .and_then(|mut file| file.read_exact(&mut header))
        .is_ok()
        && &header == b"SQLite format 3\0"
}

fn is_sidecar(path: &Path) -> bool {
    let value = path.to_string_lossy();
    value.ends_with("-wal") || value.ends_with("-shm") || value.ends_with("-journal")
}

fn sidecars_for(path: &Path) -> [PathBuf; 3] {
    let base = path.as_os_str().to_string_lossy();
    [
        PathBuf::from(format!("{}-wal", base)),
        PathBuf::from(format!("{}-shm", base)),
        PathBuf::from(format!("{}-journal", base)),
    ]
}

fn relative_string(root: &Path, path: &Path) -> String {
    if root.is_file() {
        path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    } else {
        path.strip_prefix(root)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/")
    }
}

fn resolve_finding(root: &Path, finding: &str) -> PathBuf {
    if root.is_file() {
        root.to_path_buf()
    } else {
        root.join(finding)
    }
}

fn safe_relative(value: &str) -> Result<PathBuf, String> {
    let path = Path::new(value);
    if path.is_absolute()
        || path
            .components()
            .any(|part| matches!(part, std::path::Component::ParentDir))
    {
        return Err(format!("Unsafe path in packet: {}", value));
    }
    Ok(path.to_path_buf())
}

fn absolute(path: &Path) -> String {
    fs::canonicalize(path)
        .unwrap_or_else(|_| path.to_path_buf())
        .to_string_lossy()
        .to_string()
}

fn io_error(error: std::io::Error) -> String {
    error.to_string()
}

fn sql_error<'a>(path: &'a Path) -> impl Fn(rusqlite::Error) -> String + 'a {
    move |error| {
        format!(
            "Could not read SQLite database {}: {}",
            path.display(),
            error
        )
    }
}

pub fn wait_for_file(path: &Path) {
    for _ in 0..10 {
        if path.exists() {
            return;
        }
        thread::sleep(Duration::from_millis(5));
    }
}
