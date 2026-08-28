import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

test('@claim:sqlite-wal-detection detects a SQLite WAL bundle and blocks raw copy', () => {
  const demo = freshDemo();
  expect(demo.scan.raw_copy_safe).toBe(false);
  expect(demo.scan.databases[0].sidecars).toEqual(expect.arrayContaining(['field-notes.sqlite-wal', 'field-notes.sqlite-shm']));
  const guarded = spawnSync(binary, ['guard', join(demo.temporary_root, 'sync-folder')]);
  expect(guarded.status).toBe(2);
});

test('@claim:consistent-snapshot writes a checksummed SQLite packet without changing the source', () => {
  const demo = freshDemo();
  const source = join(demo.temporary_root, 'sync-folder', 'field-notes.sqlite');
  const before = createHash('sha256').update(readFileSync(source)).digest('hex');
  const secondPacket = join(demo.temporary_root, 'second-packet');
  cli('snapshot', join(demo.temporary_root, 'sync-folder'), '--output', secondPacket);
  const after = createHash('sha256').update(readFileSync(source)).digest('hex');
  expect(after).toBe(before);
  const manifest = JSON.parse(readFileSync(join(secondPacket, 'dbsync-safe-manifest.json'), 'utf8'));
  expect(manifest.entries[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest.entries[0].integrity_check).toBe('ok');
});

test('@claim:verified-restore restores the sample into another folder and verifies it', () => {
  const demo = freshDemo();
  expect(demo.restore.verified).toBe(true);
  expect(demo.restore.restored).toHaveLength(1);
  expect(existsSync(demo.restore.restored[0])).toBe(true);
  expect(cli('verify', join(demo.temporary_root, 'safe-packet'))).toContain('Packet verified');
});

test('@claim:json-output emits parseable scan output for scripts', () => {
  const demo = freshDemo();
  const output = JSON.parse(cli('--json', 'scan', join(demo.temporary_root, 'sync-folder')));
  expect(output.sqlite_only).toBe(true);
  expect(output.databases).toHaveLength(1);
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

test('@claim:mit-free ships the MIT license', () => {
  const license = readFileSync(resolve('LICENSE'), 'utf8');
  expect(license).toContain('MIT License');
  expect(license).toContain('Permission is hereby granted, free of charge');
});

test('@claim:installer-checksum shell installer checks SHA-256 before installing', () => {
  const temp = mkdtempSync(join(tmpdir(), 'dbsync-installer-test-'));
  const fakeBin = join(temp, 'bin');
  const installDir = join(temp, 'install');
  execFileSync('mkdir', ['-p', fakeBin, installDir]);
  const archiveRoot = join(temp, 'archive');
  execFileSync('mkdir', ['-p', archiveRoot]);
  copyFileSync(binary, join(archiveRoot, 'dbsync-safe'));
  const archive = join(temp, 'dbsync-safe-linux-x86_64.tar.gz');
  execFileSync('tar', ['-C', archiveRoot, '-czf', archive, 'dbsync-safe']);
  const checksum = createHash('sha256').update(readFileSync(archive)).digest('hex');
  const fakeCurl = join(fakeBin, 'curl');
  writeFileSync(fakeCurl, `#!/bin/sh\nout=''\nurl=''\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = '-o' ]; then out="$2"; shift 2; else url="$1"; shift; fi\ndone\ncase "$url" in\n  *SHA256SUMS) printf '%s  dbsync-safe-linux-x86_64.tar.gz\\n' "$FIXTURE_SHA" > "$out" ;;\n  *) cp "$FIXTURE_ARCHIVE" "$out" ;;\nesac\n`);
  chmodSync(fakeCurl, 0o755);
  const result = spawnSync('sh', [resolve('site/public/install.sh')], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, FIXTURE_ARCHIVE: archive, FIXTURE_SHA: checksum, DBSYNC_SAFE_INSTALL_DIR: installDir },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(readdirSync(installDir)).toContain('dbsync-safe');
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

test('landing works at 390 pixels and keyboard focus is visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

