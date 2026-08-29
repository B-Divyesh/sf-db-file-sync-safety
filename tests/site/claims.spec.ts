import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

test('@claim:json-output emits parseable scan output for scripts', () => {
  const demo = freshDemo();
  const output = JSON.parse(cli('--json', 'scan', join(demo.temporary_root, 'sync-folder')));
  expect(output.sqlite_only).toBe(true);
  expect(output.databases).toHaveLength(1);
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
