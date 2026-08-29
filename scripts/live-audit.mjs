import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = process.argv[2] ?? 'https://db-file-sync-safety.sociobot.in';
const browser = await chromium.launch();
const routes = ['/', '/?demo=1', '/demo', '/privacy', '/terms'];
const missingRoute = '/definitely-not-a-route';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(String(error)));
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    if (response?.status() !== 200) throw new Error(`${route} returned ${response?.status()}`);
    const structure = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    if (structure.lang !== 'en' || structure.main !== 1 || structure.h1 !== 1 || structure.overflow) {
      throw new Error(`${route} structure failed: ${JSON.stringify(structure)}`);
    }
    if (route === '/' && viewport.width === 1440) {
      const facts = await page.locator('.plain-facts li').evaluateAll((nodes) => nodes.map((node) => ({
        text: node.textContent?.replace(/\s+/g, ' ').trim(),
        bottom: node.getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
      })));
      if (facts.length !== 3 || facts.some((fact) => fact.bottom > fact.viewportHeight)) {
        throw new Error(`${route} first-screen facts are below the fold: ${JSON.stringify(facts)}`);
      }
    }
    const axe = await new AxeBuilder({ page }).analyze();
    if (axe.violations.length) throw new Error(`${route} Axe: ${axe.violations.map((item) => item.id).join(', ')}`);
    if (viewport.width === 390) {
      const small = await page.locator('a, button, summary').evaluateAll((nodes) => nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { text: node.textContent?.trim(), width: box.width, height: box.height };
      }).filter((item) => item.width < 44 || item.height < 44));
      if (small.length) throw new Error(`${route} small targets: ${JSON.stringify(small)}`);
    }
    if (errors.length) throw new Error(`${route} console: ${errors.join(' | ')}`);
    await page.close();
  }
  await context.close();
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const response = await page.goto(`${origin}${missingRoute}`, { waitUntil: 'networkidle' });
  if (response?.status() !== 404) throw new Error(`${missingRoute} returned ${response?.status()}`);
  const expected = {
    title: 'Page not found — DB File Sync Safety',
    description: 'This address is not part of the DB File Sync Safety site.',
    canonical: `${origin}/404`,
  };
  const actual = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
    h1: document.querySelector('h1')?.textContent?.trim(),
    main: document.querySelectorAll('main').length,
    headerLinks: document.querySelectorAll('header nav a').length,
    footerLinks: document.querySelectorAll('footer nav a').length,
    build: document.querySelector('.build')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  if (actual.title !== expected.title || actual.description !== expected.description || actual.robots !== 'noindex, nofollow' || actual.canonical !== expected.canonical || actual.ogTitle !== expected.title || actual.ogDescription !== expected.description || actual.ogUrl !== expected.canonical || actual.ogImage !== `${origin}/og-image.webp` || actual.twitterTitle !== expected.title || actual.twitterDescription !== expected.description || actual.twitterImage !== `${origin}/og-image.webp` || actual.appleTouchIcon !== '/apple-touch-icon.png' || actual.h1 !== 'Page not found' || actual.main !== 1 || actual.headerLinks !== 3 || actual.footerLinks !== 3 || actual.build !== 'v0.1.3 · build 004' || actual.overflow) {
    throw new Error(`${missingRoute} shell/metadata failed: ${JSON.stringify(actual)}`);
  }
  const axe = await new AxeBuilder({ page }).analyze();
  if (axe.violations.length) throw new Error(`${missingRoute} Axe: ${axe.violations.map((item) => item.id).join(', ')}`);
  if (viewport.width === 390) {
    const small = await page.locator('a, button, summary').evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { text: node.textContent?.trim(), width: box.width, height: box.height };
    }).filter((item) => item.width < 44 || item.height < 44));
    if (small.length) throw new Error(`${missingRoute} small targets: ${JSON.stringify(small)}`);
  }
  await context.close();
}

const keyboard = await browser.newPage({ viewport: { width: 390, height: 844 } });
await keyboard.goto(`${origin}/`);
await keyboard.keyboard.press('Tab');
if (await keyboard.locator(':focus').textContent() !== 'Skip to main content') throw new Error('skip link was not first');
const sample = keyboard.getByRole('link', { name: 'Try it with sample data' });
await sample.focus();
await keyboard.keyboard.press('Enter');
await keyboard.waitForURL(`${origin}/?demo=1`);
if (!(await keyboard.getByRole('heading', { level: 1 }).evaluate((node) => node === document.activeElement))) throw new Error('route heading did not receive focus');
await keyboard.goBack();
if (!(await keyboard.getByRole('heading', { level: 1 }).evaluate((node) => node === document.activeElement))) throw new Error('back navigation did not restore heading focus');
await keyboard.close();

const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const reducedPage = await reduced.newPage();
await reducedPage.goto(`${origin}/`);
if (await reducedPage.locator('.integrity-sweep').evaluate((node) => getComputedStyle(node).display) !== 'none') throw new Error('integrity sweep remains visible');
await reducedPage.goto(`${origin}/?demo=1`);
const duration = await reducedPage.locator('.terminal-row').first().evaluate((node) => getComputedStyle(node).animationDuration);
if (Number.parseFloat(duration) > 0.00001) throw new Error(`reduced motion duration is ${duration}`);
await reduced.close();

const privacy = await browser.newContext({ viewport: { width: 390, height: 844 } });
const privacyPage = await privacy.newPage();
const requests = [];
privacyPage.on('request', (request) => requests.push(request.url()));
await privacyPage.goto(`${origin}/?demo=1`, { waitUntil: 'networkidle' });
await privacyPage.getByRole('button', { name: 'Reset demo' }).click();
const privacyState = await privacyPage.evaluate(async () => ({
  local: Object.keys(localStorage),
  session: Object.keys(sessionStorage),
  cookies: document.cookie,
  workers: (await navigator.serviceWorker?.getRegistrations() ?? []).length,
}));
if (privacyState.local.length || privacyState.session.length || privacyState.cookies || privacyState.workers) throw new Error(`privacy state: ${JSON.stringify(privacyState)}`);
if (requests.some((url) => new URL(url).origin !== origin)) throw new Error(`demo external requests: ${requests.join(', ')}`);
await privacy.close();

const zoom = await browser.newPage({ viewport: { width: 390, height: 844 } });
await zoom.goto(`${origin}/?demo=1`);
const devtools = await zoom.context().newCDPSession(zoom);
await devtools.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
if (!(await zoom.getByRole('heading', { level: 1 }).isVisible()) || !(await zoom.locator('footer').isVisible())) throw new Error('200% text lost content');
await zoom.close();

const linksContext = await browser.newContext();
const linksPage = await linksContext.newPage();
const links = new Set();
for (const route of routes) {
  await linksPage.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
  for (const href of await linksPage.locator('a').evaluateAll((nodes) => nodes.map((node) => node.href))) links.add(href);
}
await linksPage.goto(`${origin}/`, { waitUntil: 'networkidle' });
const detectedDownload = await linksPage.locator('.platform-download').first().getAttribute('href');
if (!detectedDownload?.endsWith('/v0.1.3/dbsync-safe-linux-x86_64.tar.gz')) throw new Error(`wrong detected download: ${detectedDownload}`);
for (const href of links) {
  const response = await linksContext.request.fetch(href, { method: 'HEAD', maxRedirects: 10 });
  if (response.status() >= 400) throw new Error(`dead link ${href}: ${response.status()}`);
}
await linksContext.close();

await browser.close();
console.log(JSON.stringify({ routes: routes.length, production404: 'pass', viewports: 2, axeViolations: 0, consoleErrors: 0, keyboard: 'pass', reducedMotion: 'pass', privacy: 'pass', serviceWorkers: 0, textZoom: 'pass', liveLinks: links.size, detectedDownload: 'v0.1.3 Linux archive' }));
