use clap::{Parser, Subcommand};
use db_file_sync_safety::{create_snapshot, restore_packet, scan, verify_packet};
use rusqlite::Connection;
use serde::Serialize;
use std::{
    env, fs,
    path::{Path, PathBuf},
    process,
};

#[derive(Parser)]
#[command(name = "dbsync-safe", version, about = "Make verified SQLite snapshots before file sync", long_about = None)]
struct Cli {
    #[arg(long, global = true, help = "Print machine-readable JSON")]
    json: bool,
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Find SQLite files and live sidecars without changing them
    Scan { path: PathBuf },
    /// Exit 2 when a path contains any SQLite database that needs a snapshot
    Guard { path: PathBuf },
    /// Create a consistent, checksummed packet without opening the source in SQLite
    Snapshot {
        path: PathBuf,
        #[arg(short, long)]
        output: PathBuf,
    },
    /// Check every checksum and run SQLite integrity checks
    Verify { packet: PathBuf },
    /// Verify a packet, restore it, then verify each restored database
    Restore {
        packet: PathBuf,
        #[arg(short, long)]
        target: PathBuf,
        #[arg(
            long,
            help = "Replace an existing target database after packet verification"
        )]
        force: bool,
    },
    /// Run the full workflow on bundled sample data in a temporary folder
    Demo,
}

fn main() {
    let mut args: Vec<String> = env::args().collect();
    if args.iter().any(|arg| arg == "--demo") {
        args.retain(|arg| arg != "--demo");
        args.push("demo".to_string());
    }
    let cli = Cli::parse_from(args);
    let result = run(&cli);
    match result {
        Ok(exit) => process::exit(exit),
        Err(message) => {
            if cli.json {
                println!("{}", serde_json::json!({"ok": false, "error": message}));
            } else {
                eprintln!("Blocked: {message}");
            }
            process::exit(1);
        }
    }
}

fn run(cli: &Cli) -> Result<i32, String> {
    match &cli.command {
        Command::Scan { path } => {
            let report = scan(path)?;
            emit(cli.json, &report, || {
                if report.databases.is_empty() {
                    format!(
                        "No SQLite databases found in {}.\n{}",
                        report.root, report.next_step
                    )
                } else {
                    let rows = report
                        .databases
                        .iter()
                        .map(|db| format!("• {} — {}", db.path, db.reason))
                        .collect::<Vec<_>>()
                        .join("\n");
                    format!(
                        "Found {} SQLite database(s).\n{}\n\nRaw copy: BLOCKED\n{}",
                        report.databases.len(),
                        rows,
                        report.next_step
                    )
                }
            });
            Ok(0)
        }
        Command::Guard { path } => {
            let report = scan(path)?;
            let blocked = !report.databases.is_empty();
            emit(cli.json, &report, || {
                if blocked {
                    format!("Raw copy blocked.\n{}", report.next_step)
                } else {
                    report.next_step.clone()
                }
            });
            Ok(if blocked { 2 } else { 0 })
        }
        Command::Snapshot { path, output } => {
            let manifest = create_snapshot(path, output)?;
            emit(cli.json, &manifest, || {
                format!("Snapshot ready: {}\nVerified {} database(s). Sync this packet, not the live files.", output.display(), manifest.entries.len())
            });
            Ok(0)
        }
        Command::Verify { packet } => {
            let manifest = verify_packet(packet)?;
            emit(cli.json, &manifest, || {
                format!("Packet verified: {}\nChecksums and SQLite integrity passed for {} database(s).", packet.display(), manifest.entries.len())
            });
            Ok(0)
        }
        Command::Restore {
            packet,
            target,
            force,
        } => {
            let report = restore_packet(packet, target, *force)?;
            emit(cli.json, &report, || {
                format!(
                    "Restore verified: {}\nRestored {} database(s).",
                    target.display(),
                    report.restored.len()
                )
            });
            Ok(0)
        }
        Command::Demo => demo(cli.json),
    }
}

fn demo(json: bool) -> Result<i32, String> {
    let root = env::temp_dir().join(format!("dbsync-safe-demo-{}", process::id()));
    if root.exists() {
        fs::remove_dir_all(&root).map_err(|e| e.to_string())?;
    }
    let source = root.join("sync-folder");
    let packet = root.join("safe-packet");
    let restored = root.join("restored");
    fs::create_dir_all(&source).map_err(|e| e.to_string())?;
    let database = source.join("field-notes.sqlite");
    let connection = Connection::open(&database).map_err(|e| e.to_string())?;
    connection
        .execute_batch(include_str!("../examples/field-notes.sql"))
        .map_err(|e| e.to_string())?;
    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| e.to_string())?;
    connection
        .execute(
            "INSERT INTO notes(title, body) VALUES (?1, ?2)",
            ["Train changes", "Use the north entrance after 18:00."],
        )
        .map_err(|e| e.to_string())?;
    let scan_report = scan(&source)?;
    let manifest = create_snapshot(&source, &packet)?;
    let restore_report = restore_packet(&packet, &restored, false)?;
    drop(connection);
    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "ok": true, "demo": true, "temporary_root": root, "scan": scan_report,
                "manifest": manifest, "restore": restore_report
            }))
            .map_err(|e| e.to_string())?
        );
    } else {
        println!("Demo — bundled sample data in a temporary folder");
        println!("1  SCAN      found field-notes.sqlite + live WAL");
        println!("2  BLOCK     raw file copy refused");
        println!("3  SNAPSHOT  SQLite backup created and checksummed");
        println!("4  RESTORE   checksum and integrity check passed");
        println!("\nSample output: {}", root.display());
        println!("Nothing touched your real files. Remove this folder when finished.");
    }
    Ok(0)
}

fn emit<T: Serialize, F: FnOnce() -> String>(json: bool, value: &T, text: F) {
    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(value).expect("serializable output")
        );
    } else {
        println!("{}", text());
    }
}

#[allow(dead_code)]
fn _is_path(_: &Path) {}
