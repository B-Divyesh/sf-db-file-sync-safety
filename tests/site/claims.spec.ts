import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const binary = resolve('target/debug/dbsync-safe');

function cli(...args: string[]): string {
  return execFileSync(binary, args, { encoding: 'utf8' });
}

function freshDemo() {
  return JSON.parse(cli('--json', '--demo')) as {
    temporary_root: string;
    scan: { raw_copy_safe: boolean; databases: { sidecars: string[] }[] };
    manifest: { entries: { integrity_check: string; sha256: string; snapshot_path: string }[] };
    restore: { verified: boolean; restored: string[] };
  };
}

type SourceTreeEntry = { path: string; type: 'directory' | 'file'; mode: number; sha256?: string; bytes?: number };

function sourceTree(root: string): SourceTreeEntry[] {
  const entries: SourceTreeEntry[] = [{ path: './', type: 'directory', mode: statSync(root).mode & 0o777 }];
  const visit = (directory: string, prefix = '') => {
    for (const item of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, item.name);
      const relative = prefix ? `${prefix}/${item.name}` : item.name;
      const mode = statSync(path).mode & 0o777;
      if (item.isDirectory()) {
        entries.push({ path: `${relative}/`, type: 'directory', mode });
        visit(path, relative);
      } else if (item.isFile()) {
        const bytes = readFileSync(path);
        entries.push({ path: relative, type: 'file', mode, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
      }
    }
  };
  visit(root);
  return entries;
}

function closedWalFixture(readOnly: boolean) {
  const root = mkdtempSync(join(tmpdir(), 'dbsync-closed-wal-'));
  chmodSync(root, 0o755);
  const source = join(root, 'source');
  const output = join(root, 'output');
  mkdirSync(source, { mode: 0o755 });
  mkdirSync(output, { mode: 0o777 });
  chmodSync(output, 0o777);
  const databasePath = join(source, 'app.sqlite');
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode=WAL; CREATE TABLE items(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO items(value) VALUES ('closed WAL row');");
  database.close();
  expect(readdirSync(source)).toEqual(['app.sqlite']);
  if (readOnly) {
    chmodSync(databasePath, 0o444);
    chmodSync(source, 0o555);
  }
  return { root, source, packet: join(output, 'packet') };
}

function persistentJournalFixture() {
  const root = mkdtempSync(join(tmpdir(), 'dbsync-persist-journal-'));
  const source = join(root, 'source');
  mkdirSync(source);
  const databasePath = join(source, 'persist.sqlite');
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode=PERSIST; CREATE TABLE items(value TEXT); INSERT INTO items VALUES ('persistent row');");
  database.close();
  const journalPath = `${databasePath}-journal`;
  expect(statSync(journalPath).size).toBeGreaterThan(512);
  expect(readFileSync(journalPath).subarray(0, 8)).toEqual(Buffer.alloc(8));
  return { root, source, databasePath, packet: join(root, 'packet'), journalPath };
}

let auditLibraryPath: string | undefined;
function auditLibrary(): string {
  if (auditLibraryPath) return auditLibraryPath;
  const root = mkdtempSync(join(tmpdir(), 'dbsync-io-audit-'));
  auditLibraryPath = join(root, 'io-audit.so');
  execFileSync('cc', ['-shared', '-fPIC', '-O2', '-o', auditLibraryPath, resolve('tests/fixtures/io-audit.c')]);
  return auditLibraryPath;
}

function auditedCli(log: string, args: string[]) {
  return spawnSync(binary, args, {
    encoding: 'utf8',
    env: { ...process.env, LD_PRELOAD: auditLibrary(), DBSYNC_SAFE_AUDIT_LOG: log },
  });
}

function parsedJsonRun(args: string[], expectedStatus: number | 'nonzero') {
  const result = spawnSync(binary, args, { encoding: 'utf8' });
  if (expectedStatus === 'nonzero') expect(result.status, `${args.join(' ')}\n${result.stderr}`).not.toBe(0);
  else expect(result.status, `${args.join(' ')}\n${result.stderr}`).toBe(expectedStatus);
  expect(() => JSON.parse(result.stdout), `${args.join(' ')}\n${result.stdout}\n${result.stderr}`).not.toThrow();
  return JSON.parse(result.stdout);
}

test('@claim:sqlite-wal-detection detects a SQLite WAL bundle and blocks raw copy', () => {
  const demo = freshDemo();
  expect(demo.scan.raw_copy_safe).toBe(false);
  expect(demo.scan.databases[0].sidecars).toEqual(expect.arrayContaining(['field-notes.sqlite-wal', 'field-notes.sqlite-shm']));
  const guarded = spawnSync(binary, ['guard', join(demo.temporary_root, 'sync-folder')]);
  expect(guarded.status).toBe(2);
});

test('@claim:consistent-snapshot writes a checksummed SQLite packet without changing the source', () => {
  const fixture = closedWalFixture(false);
  const before = sourceTree(fixture.source);
  cli('snapshot', fixture.source, '--output', fixture.packet);
  expect(sourceTree(fixture.source)).toEqual(before);
  const manifest = JSON.parse(readFileSync(join(fixture.packet, 'dbsync-safe-manifest.json'), 'utf8'));
  expect(manifest.entries[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest.entries[0].integrity_check).toBe('ok');
});

test('@claim:persistent-journal-snapshot snapshots a closed persistent journal without changing its source', () => {
  const fixture = persistentJournalFixture();
  const before = sourceTree(fixture.source);
  cli('snapshot', fixture.source, '--output', fixture.packet);
  expect(sourceTree(fixture.source)).toEqual(before);
  const target = join(fixture.root, 'restored');
  cli('restore', fixture.packet, '--target', target);
  const restored = new DatabaseSync(join(target, 'persist.sqlite'), { readOnly: true });
  expect(restored.prepare('SELECT value FROM items').get()).toEqual({ value: 'persistent row' });
  restored.close();
});

test('@claim:readonly-source-snapshot snapshots a read-only source and preserves its exact tree', () => {
  const fixture = closedWalFixture(true);
  const before = sourceTree(fixture.source);
  const runAsNobody = typeof process.getuid === 'function' && process.getuid() === 0;
  const result = spawnSync(binary, ['--json', 'snapshot', fixture.source, '--output', fixture.packet], {
    encoding: 'utf8',
    ...(runAsNobody ? { uid: 65534, gid: 65534 } : {}),
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(sourceTree(fixture.source)).toEqual(before);
  const manifest = JSON.parse(readFileSync(join(fixture.packet, 'dbsync-safe-manifest.json'), 'utf8'));
  expect(manifest.entries[0].integrity_check).toBe('ok');
});

test('@claim:verified-restore restores the sample into another folder and verifies it', () => {
  const demo = freshDemo();
  expect(demo.restore.verified).toBe(true);
  expect(demo.restore.restored).toHaveLength(1);
  expect(existsSync(demo.restore.restored[0])).toBe(true);
  expect(cli('verify', join(demo.temporary_root, 'safe-packet'))).toContain('Packet verified');
});

test('@claim:demo-restored-count browser result matches the restored CLI sample', async ({ page }) => {
  const demo = freshDemo();
  const restored = new DatabaseSync(demo.restore.restored[0], { readOnly: true });
  const sample = restored.prepare(`
    SELECT count(*) AS restored_note_count,
           sum(title = 'Train changes') AS live_wal_note_count
    FROM notes
  `).get() as { restored_note_count: number; live_wal_note_count: number };
  restored.close();
  expect(sample.restored_note_count).toBe(4);
  expect(sample.live_wal_note_count).toBe(1);

  await page.goto('/demo');
  const result = page.locator('.demo-result');
  await expect(result).toContainText(`${sample.restored_note_count} notes reached a new folder`);
  await expect(result).toContainText('including the live-WAL note');
});

test('@claim:json-output emits parseable JSON for every command and both demo spellings', () => {
  const fixture = closedWalFixture(false);
  const missing = join(fixture.root, 'missing');
  const packet = fixture.packet;
  const target = join(fixture.root, 'restored');

  expect(parsedJsonRun(['--json', 'scan', fixture.source], 0).sqlite_only).toBe(true);
  parsedJsonRun(['--json', 'guard', fixture.source], 2);
  parsedJsonRun(['--json', 'snapshot', fixture.source, '--output', packet], 0);
  parsedJsonRun(['--json', 'verify', packet], 0);
  parsedJsonRun(['--json', 'restore', packet, '--target', target], 0);
  expect(parsedJsonRun(['--json', 'demo'], 0).demo).toBe(true);
  expect(parsedJsonRun(['--json', '--demo'], 0).demo).toBe(true);

  for (const args of [
    ['--json', 'scan', missing],
    ['--json', 'guard', missing],
    ['--json', 'snapshot', missing, '--output', join(fixture.root, 'bad-packet')],
    ['--json', 'verify', missing],
    ['--json', 'restore', missing, '--target', join(fixture.root, 'bad-target')],
  ]) parsedJsonRun(args, 'nonzero');
});

test('@claim:local-execution runs the CLI demo entirely in its local temporary folder', () => {
  const demo = freshDemo();
  const temporaryRoot = resolve(demo.temporary_root);
  const systemTemporaryRoot = resolve(tmpdir());
  expect(temporaryRoot.startsWith(`${systemTemporaryRoot}/`)).toBe(true);
  expect(demo.restore.restored.every((path) => resolve(path).startsWith(`${temporaryRoot}/`))).toBe(true);
  expect(existsSync(join(temporaryRoot, 'sync-folder', 'field-notes.sqlite'))).toBe(true);
  expect(existsSync(join(temporaryRoot, 'safe-packet', 'dbsync-safe-manifest.json'))).toBe(true);
});

test('@claim:restore-overwrite-refusal preserves an existing target unless force is passed', () => {
  const fixture = closedWalFixture(false);
  cli('snapshot', fixture.source, '--output', fixture.packet);
  const target = join(fixture.root, 'target');
  mkdirSync(target);
  const targetDatabase = join(target, 'app.sqlite');
  const original = Buffer.from('keep this exact target');
  writeFileSync(targetDatabase, original);
  const result = spawnSync(binary, ['--json', 'restore', fixture.packet, '--target', target], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(JSON.parse(result.stdout).error).toContain('already exists');
  expect(readFileSync(targetDatabase)).toEqual(original);
});

test('@claim:source-open-isolation SQLite opens only private working and output copies', () => {
  test.skip(process.platform !== 'linux', 'Linux syscall interposer evidence');
  const cases: { name: string; source: string; packet: string; close?: () => void }[] = [];
  const closed = closedWalFixture(false);
  cases.push({ name: 'closed WAL', source: closed.source, packet: closed.packet });

  const activeRoot = mkdtempSync(join(tmpdir(), 'dbsync-active-wal-'));
  const activeSource = join(activeRoot, 'source');
  mkdirSync(activeSource);
  const activePath = join(activeSource, 'active.sqlite');
  const active = new DatabaseSync(activePath);
  active.exec("PRAGMA journal_mode=WAL; CREATE TABLE items(value TEXT); INSERT INTO items VALUES ('live WAL row');");
  cases.push({ name: 'active WAL', source: activeSource, packet: join(activeRoot, 'packet'), close: () => active.close() });

  const persistent = persistentJournalFixture();
  cases.push({ name: 'persistent journal', source: persistent.source, packet: persistent.packet });

  for (const fixture of cases) {
    const log = join(dirname(fixture.packet), `${fixture.name.replaceAll(' ', '-')}.audit`);
    const result = auditedCli(log, ['snapshot', fixture.source, '--output', fixture.packet]);
    fixture.close?.();
    expect(result.status, `${fixture.name}: ${result.stdout}\n${result.stderr}`).toBe(0);
    const events = readFileSync(log, 'utf8').trim().split('\n').map((line) => {
      const [kind, flags, ...path] = line.split('\t');
      return { kind, flags: Number(flags), path: path.join('\t') };
    }).filter((event) => event.kind.startsWith('OPEN'));
    const sourceEvents = events.filter((event) => event.path.startsWith(fixture.source));
    expect(sourceEvents.length, `${fixture.name}: source reads were not observed`).toBeGreaterThan(0);
    expect(sourceEvents.filter((event) => (event.flags & 3) !== 0), `${fixture.name}: ${JSON.stringify(sourceEvents)}`).toEqual([]);
    expect(events.some((event) => event.path.includes('dbsync-safe-acquisition') && (event.flags & 3) === 2), `${fixture.name}: private SQLite open missing`).toBe(true);
  }
});

test('@claim:no-account exposes no sign-in or credential workflow', () => {
  const help = cli('--help');
  expect(help).not.toMatch(/\b(login|sign[ -]?in|account|token|credential|api key)\b/i);
  expect(help).toContain('Commands:');
  expect(help).toContain('demo');
});

test('@claim:no-network every CLI operation succeeds while internet sockets are denied', () => {
  test.skip(process.platform !== 'linux', 'Linux socket interposer evidence');
  const fixture = closedWalFixture(false);
  const log = join(fixture.root, 'network.audit');
  const packet = fixture.packet;
  const target = join(fixture.root, 'target');
  const runs: { args: string[]; status: number }[] = [
    { args: ['--json', 'scan', fixture.source], status: 0 },
    { args: ['--json', 'guard', fixture.source], status: 2 },
    { args: ['--json', 'snapshot', fixture.source, '--output', packet], status: 0 },
    { args: ['--json', 'verify', packet], status: 0 },
    { args: ['--json', 'restore', packet, '--target', target], status: 0 },
    { args: ['--json', 'demo'], status: 0 },
    { args: ['--json', '--demo'], status: 0 },
  ];
  for (const run of runs) {
    const result = auditedCli(log, run.args);
    expect(result.status, `${run.args.join(' ')}\n${result.stdout}\n${result.stderr}`).toBe(run.status);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  }
  const audit = readFileSync(log, 'utf8');
  expect(audit).not.toContain('NETWORK\t');
  const sources = [readFileSync(resolve('src/main.rs'), 'utf8'), readFileSync(resolve('src/lib.rs'), 'utf8')].join('\n');
  expect(sources).not.toMatch(/std::net|TcpStream|UdpSocket|Command::new/);
});

test('@claim:no-telemetry demo sends no data and stores no sample state', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  const lock = readFileSync(resolve('Cargo.lock'), 'utf8');
  expect(lock).not.toMatch(/name = "(reqwest|ureq|hyper|curl)"/);
  if (process.platform === 'linux') {
    const auditRoot = mkdtempSync(join(tmpdir(), 'dbsync-telemetry-audit-'));
    const auditLog = join(auditRoot, 'io.audit');
    const result = auditedCli(auditLog, ['--json', 'demo']);
    expect(result.status, result.stderr).toBe(0);
    const demo = JSON.parse(result.stdout) as { temporary_root: string };
    const writesOutsideDemo = readFileSync(auditLog, 'utf8').trim().split('\n').filter(Boolean).map((line) => {
      const [kind, flags, ...path] = line.split('\t');
      return { kind, flags: Number(flags), path: path.join('\t') };
    }).filter((event) => event.kind.startsWith('OPEN') && (event.flags & 3) !== 0 && !event.path.startsWith(demo.temporary_root));
    expect(writesOutsideDemo).toEqual([]);
  }
});

test('@claim:sqlite-only-scope ignores files that do not contain a SQLite header', () => {
  const root = mkdtempSync(join(tmpdir(), 'dbsync-non-sqlite-'));
  writeFileSync(join(root, 'data.db'), 'not a SQLite database');
  writeFileSync(join(root, 'notes.txt'), 'plain text');
  const report = JSON.parse(cli('--json', 'scan', root));
  expect(report.sqlite_only).toBe(true);
  expect(report.databases).toEqual([]);
});

test('@claim:github-release-cache requests GitHub release details and caches them for one hour', async ({ page }) => {
  const githubRequests: string[] = [];
  const externalOrigins = new Set<string>();
  page.on('request', (request) => {
    const origin = new URL(request.url()).origin;
    if (origin !== 'http://127.0.0.1:4173') externalOrigins.add(origin);
  });
  await page.route('https://api.github.com/**', async (route) => {
    githubRequests.push(route.request().url());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ tag_name: 'v0.1.0', assets: [{ name: 'dbsync-safe-linux-x86_64.tar.gz', browser_download_url: 'https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-linux-x86_64.tar.gz' }] }]),
    });
  });

  await page.goto('/');
  await expect(page.locator('.release-state')).toContainText('v0.1.0 is ready');
  expect(githubRequests).toEqual(['https://api.github.com/repos/B-Divyesh/sf-db-file-sync-safety/releases?per_page=1']);
  expect([...externalOrigins]).toEqual(['https://api.github.com']);

  const cache = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const value = JSON.parse(localStorage.getItem('dbsync-safe:release') ?? '{}') as { expires?: number };
    return { keys, expires: value.expires, now: Date.now() };
  });
  expect(cache.keys).toEqual(['dbsync-safe:release']);
  expect(cache.expires! - cache.now).toBeGreaterThan(3_595_000);
  expect(cache.expires! - cache.now).toBeLessThanOrEqual(3_600_000);

  await page.reload();
  await expect(page.locator('.release-state')).toContainText('v0.1.0 is ready');
  expect(githubRequests).toHaveLength(1);

  await page.evaluate(() => {
    const cached = JSON.parse(localStorage.getItem('dbsync-safe:release') ?? '{}');
    cached.expires = Date.now() - 1;
    localStorage.setItem('dbsync-safe:release', JSON.stringify(cached));
  });
  await page.reload();
  await expect(page.locator('.release-state')).toContainText('v0.1.0 is ready');
  expect(githubRequests).toHaveLength(2);
});

test('platform download avoids guessing Mac architecture and uses the neutral Linux archive', async ({ browser }) => {
  const release = {
    tag_name: 'v0.1.2',
    assets: [
      { name: 'dbsync-safe-macos-x86_64.pkg', browser_download_url: 'https://github.com/example/macos-x86.pkg' },
      { name: 'dbsync-safe-macos-aarch64.pkg', browser_download_url: 'https://github.com/example/macos-arm.pkg' },
      { name: 'dbsync-safe-linux-x86_64.deb', browser_download_url: 'https://github.com/example/linux.deb' },
      { name: 'dbsync-safe-linux-x86_64.tar.gz', browser_download_url: 'https://github.com/example/linux.tar.gz' },
    ],
  };

  const macContext = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' });
  const macPage = await macContext.newPage();
  await macPage.route('https://api.github.com/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([release]) }));
  await macPage.goto('/');
  await expect(macPage.locator('.detected-platform')).toHaveText('macOS — Apple silicon or Intel');
  await expect(macPage.locator('.platform-download').first()).toHaveAttribute('href', 'https://github.com/B-Divyesh/sf-db-file-sync-safety/releases');
  await expect(macPage.locator('.release-state')).toContainText('Apple silicon and Intel packages');
  await macContext.close();

  const linuxContext = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Fedora; Linux x86_64)' });
  const linuxPage = await linuxContext.newPage();
  await linuxPage.route('https://api.github.com/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([release]) }));
  await linuxPage.goto('/');
  await expect(linuxPage.locator('.platform-download').first()).toHaveAttribute('href', 'https://github.com/example/linux.tar.gz');
  await linuxContext.close();
});

test('@claim:mit-free ships the MIT license', () => {
  const license = readFileSync(resolve('LICENSE'), 'utf8');
  expect(license).toContain('MIT License');
  expect(license).toContain('Permission is hereby granted, free of charge');
});

function installerFixture(publishedChecksum: string | 'correct') {
  const temp = mkdtempSync(join(tmpdir(), 'dbsync-installer-test-'));
  const fakeBin = join(temp, 'bin');
  const installDir = join(temp, 'install');
  execFileSync('mkdir', ['-p', fakeBin, installDir]);
  const archiveRoot = join(temp, 'archive');
  execFileSync('mkdir', ['-p', archiveRoot]);
  copyFileSync(binary, join(archiveRoot, 'dbsync-safe'));
  const archive = join(temp, 'dbsync-safe-linux-x86_64.tar.gz');
  execFileSync('tar', ['-C', archiveRoot, '-czf', archive, 'dbsync-safe']);
  const checksum = publishedChecksum === 'correct'
    ? createHash('sha256').update(readFileSync(archive)).digest('hex')
    : publishedChecksum;
  const fakeCurl = join(fakeBin, 'curl');
  writeFileSync(fakeCurl, `#!/bin/sh\nout=''\nurl=''\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = '-o' ]; then out="$2"; shift 2; else url="$1"; shift; fi\ndone\ncase "$url" in\n  *SHA256SUMS) printf '%s  dbsync-safe-linux-x86_64.tar.gz\\n' "$FIXTURE_SHA" > "$out" ;;\n  *) cp "$FIXTURE_ARCHIVE" "$out" ;;\nesac\n`);
  chmodSync(fakeCurl, 0o755);
  const result = spawnSync('sh', [resolve('site/public/install.sh')], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, FIXTURE_ARCHIVE: archive, FIXTURE_SHA: checksum, DBSYNC_SAFE_INSTALL_DIR: installDir },
  });
  return { result, installDir };
}

test('@claim:installer-checksum shell installer rejects a checksum mismatch before installing', () => {
  const { result, installDir } = installerFixture('0'.repeat(64));
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('checksum failed. Nothing was installed.');
  expect(readdirSync(installDir)).toEqual([]);
});

test('@claim:package-manifests ships valid Homebrew, Scoop, and winget metadata', () => {
  const version = readFileSync(resolve('Cargo.toml'), 'utf8').match(/^version = "([^"]+)"/m)?.[1];
  expect(version).toBeTruthy();
  const formula = readFileSync(resolve('packaging/homebrew/dbsync-safe.rb'), 'utf8');
  expect(formula).toContain(`version "${version}"`);
  expect(formula.match(/sha256 "[a-f0-9]{64}"/g)).toHaveLength(3);
  expect(formula.match(new RegExp(`/download/v${version}/`, 'g'))).toHaveLength(3);
  const scoop = JSON.parse(readFileSync(resolve('scoop-bucket/dbsync-safe.json'), 'utf8'));
  expect(scoop.version).toBe(version);
  expect(scoop.architecture['64bit'].hash).toMatch(/^[a-f0-9]{64}$/);
  expect(scoop.architecture['64bit'].url).toContain(`/download/v${version}/`);
  const winget = readFileSync(resolve('winget/ParamFactory.DBSyncSafe.yaml'), 'utf8');
  expect(winget).toContain(`PackageVersion: ${version}`);
  expect(winget).toMatch(/InstallerSha256: [A-F0-9]{64}/);
  expect(winget).toContain(`/download/v${version}/`);
});

test('@claim:release-assets latest GitHub release has every documented package and manifest', async () => {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'dbsync-safe-claim-test' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/B-Divyesh/sf-db-file-sync-safety/releases/latest`, { headers });
  expect(response.status).toBe(200);
  const release = await response.json() as { tag_name: string; assets: { name: string; browser_download_url: string }[] };
  const names = release.assets.map((asset) => asset.name);
  for (const name of [
    'dbsync-safe-linux-x86_64.tar.gz', 'dbsync-safe-linux-x86_64.deb', 'dbsync-safe-linux-x86_64.rpm',
    'dbsync-safe-windows-x86_64.zip', 'dbsync-safe-macos-x86_64.tar.gz', 'dbsync-safe-macos-x86_64.pkg',
    'dbsync-safe-macos-aarch64.tar.gz', 'dbsync-safe-macos-aarch64.pkg', 'SHA256SUMS', 'latest.json',
  ]) expect(names).toContain(name);
  const latestAsset = release.assets.find((asset) => asset.name === 'latest.json')!;
  const latest = await (await fetch(latestAsset.browser_download_url, { headers })).json() as { version: string; tag: string; files: { name: string; url: string }[] };
  expect(latest.tag).toBe(release.tag_name);
  expect(latest.version).toBe(release.tag_name.replace(/^v/, ''));
  expect(latest.files).toHaveLength(8);
  expect(latest.files.every((file) => names.includes(file.name) && file.url.startsWith('https://github.com/'))).toBe(true);
});

test('@claim:build-contract clean project commands test 20 SQLite scenarios and produce the binary and site', () => {
  const scenario = spawnSync('cargo', ['test', '--locked', '--test', 'safety', 'twenty_sqlite_scenarios_block_raw_copy_and_restore'], { encoding: 'utf8' });
  expect(scenario.status, `${scenario.stdout}\n${scenario.stderr}`).toBe(0);
  expect(`${scenario.stdout}\n${scenario.stderr}`).toContain('test result: ok');
  execFileSync('npm', ['run', 'build'], { encoding: 'utf8' });
  expect(existsSync(resolve('target/release/dbsync-safe'))).toBe(true);
  expect(existsSync(resolve('dist/site/index.html'))).toBe(true);
});

test('@claim:release-workflow builds the documented platform matrix, checksums, and latest manifest', () => {
  const workflow = readFileSync(resolve('.github/workflows/release.yml'), 'utf8');
  for (const value of ['ubuntu-latest', 'windows-latest', 'macos-latest', 'x86_64-apple-darwin', 'aarch64-apple-darwin', 'cargo deb', '--packager rpm', 'pkgbuild', 'sha256sum dbsync-safe-* > SHA256SUMS', 'latest.json', 'softprops/action-gh-release@v2']) {
    expect(workflow).toContain(value);
  }
  expect(workflow).not.toMatch(/codesign|notarytool|signtool|certificate/i);
});

test('shell installer installs an archive after its checksum succeeds', () => {
  const { result, installDir } = installerFixture('correct');
  expect(result.status, result.stderr).toBe(0);
  expect(readdirSync(installDir)).toContain('dbsync-safe');
});

test('static hosting caches fingerprinted build assets immutably without caching HTML globally', () => {
  const config = JSON.parse(readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8')) as {
    globalHeaders?: Record<string, string>;
    routes?: { route: string; headers?: Record<string, string> }[];
  };
  const cacheControl = 'public, max-age=31536000, immutable';
  const assetRoute = config.routes?.find((route) => route.route === '/assets/*');

  expect(assetRoute?.headers?.['Cache-Control']).toBe(cacheControl);
  expect(config.globalHeaders?.['Cache-Control']).toBeUndefined();

  const html = readFileSync(resolve('dist/site/index.html'), 'utf8');
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
  expect(builtAssets).toEqual(expect.arrayContaining([expect.stringMatching(/\.js$/), expect.stringMatching(/\.css$/)]));
  expect(builtAssets.every((asset) => asset.startsWith('/assets/'))).toBe(true);
});

test('static hosting serves only known application routes and returns a real 404 for unknown paths', () => {
  const config = JSON.parse(readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8')) as {
    navigationFallback?: unknown;
    responseOverrides?: Record<string, { rewrite?: string }>;
    routes?: { route: string; rewrite?: string }[];
  };
  const appRoutes = ['/', '/demo', '/privacy', '/terms', '/404'];

  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
  for (const route of appRoutes) {
    expect(config.routes).toContainEqual(expect.objectContaining({ route, rewrite: '/index.html' }));
  }
  expect(config.routes?.some((route) => route.route === '/*' && route.rewrite === '/index.html')).toBe(false);
});

test('all routes have one h1, useful titles, and no serious accessibility errors', async ({ page }) => {
  for (const route of ['/', '/demo', '/privacy', '/terms', '/not-a-route']) {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.title()).toMatch(/DB File Sync Safety/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  }
});

test('route metadata, demo query entry, reset, focus, and not-found indexing are real', async ({ page }) => {
  const expected = [
    { route: '/', title: 'DB File Sync Safety — Make SQLite snapshots safe', canonical: '/' },
    { route: '/demo', title: 'Demo — DB File Sync Safety', canonical: '/demo' },
    { route: '/privacy', title: 'Privacy — DB File Sync Safety', canonical: '/privacy' },
    { route: '/terms', title: 'Terms — DB File Sync Safety', canonical: '/terms' },
    { route: '/not-a-route', title: 'Page not found — DB File Sync Safety', canonical: '/404', noindex: true },
  ];
  for (const item of expected) {
    await page.goto(item.route);
    await expect(page).toHaveTitle(item.title);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(ogDescription).toBe(description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', item.title);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', item.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://db-file-sync-safety.sociobot.in${item.canonical}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://db-file-sync-safety.sociobot.in${item.canonical}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', item.noindex ? 'noindex, nofollow' : 'index, follow');
    await expect(page.locator('footer').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    await expect(page.locator('footer').getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  }

  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page).toHaveTitle('Demo — DB File Sync Safety');
  await page.locator('#demo-terminal').evaluate((node) => node.setAttribute('data-dirty', 'true'));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#demo-terminal')).not.toHaveAttribute('data-dirty');
  await expect(page.getByText('Demo reset with fresh sample data.')).toHaveText('Demo reset with fresh sample data.');
  await expect(page.getByRole('link', { name: 'Install the CLI' })).toHaveAttribute('href', '/#install');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — DB File Sync Safety');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
});

test('all interactive targets are at least 44 by 44 pixels at the 390-pixel viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/demo', '/privacy', '/terms', '/not-a-route']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')), `mobile Axe: ${route}`).toEqual([]);
    const targets = await page.locator('a, button, summary').evaluateAll((nodes) => nodes.map((node) => {
      const bounds = node.getBoundingClientRect();
      return { name: node.textContent?.trim().replace(/\s+/g, ' ') ?? '', width: bounds.width, height: bounds.height };
    }));
    expect(targets.filter((target) => target.width < 44 || target.height < 44), `${route}: ${JSON.stringify(targets)}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});
