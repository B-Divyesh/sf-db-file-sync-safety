import { mkdirSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PERFORMANCE_PORT ?? 4174);
const url = process.env.PERFORMANCE_URL ?? `http://127.0.0.1:${port}/`;
const report = resolve(process.env.PERFORMANCE_REPORT ?? '.factory/evidence/repair-5/lighthouse-mobile.json');

function chromiumPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsers) throw new Error('Set CHROME_PATH or PLAYWRIGHT_BROWSERS_PATH for the mobile Lighthouse audit.');
  const chromium = readdirSync(browsers).find((entry) => entry.startsWith('chromium-'));
  if (!chromium) throw new Error(`No Playwright Chromium installation found in ${browsers}.`);
  return join(browsers, chromium, 'chrome-linux64', 'chrome');
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited ${code}`)));
  });
}

function waitForServer() {
  return new Promise((resolveWait, reject) => {
    const deadline = Date.now() + 10_000;
    const check = () => {
      fetch(url).then((response) => {
        if (response.ok) resolveWait();
        else throw new Error(`Preview returned ${response.status}`);
      }).catch((error) => {
        if (Date.now() >= deadline) reject(error);
        else setTimeout(check, 100);
      });
    };
    check();
  });
}

let preview;
try {
  if (!process.env.PERFORMANCE_URL) {
    preview = spawn(join(root, 'node_modules/.bin/vite'), ['preview', '--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: 'ignore' });
    await waitForServer();
  }
  mkdirSync(dirname(report), { recursive: true });
  await run(join(root, 'node_modules/.bin/lighthouse'), [
    url,
    '--quiet',
    `--chrome-path=${chromiumPath()}`,
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage --disable-gpu',
    '--preset=perf',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${report}`,
  ], { env: { ...process.env, CHROME_PATH: chromiumPath() } });
  const result = JSON.parse(await (await import('node:fs/promises')).readFile(report, 'utf8'));
  const score = Math.round(result.categories.performance.score * 100);
  const tbt = result.audits['total-blocking-time'].numericValue;
  console.log(`Mobile Lighthouse: performance ${score}, TBT ${tbt} ms`);
  if (score < 90) throw new Error(`Mobile Lighthouse performance ${score} is below the required 90.`);
} finally {
  if (preview && !preview.killed) {
    preview.kill('SIGTERM');
    await new Promise((resolveExit) => preview.once('exit', resolveExit));
  }
}
