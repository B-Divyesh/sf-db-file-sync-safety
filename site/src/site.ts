import './style.css';

const repo = 'B-Divyesh/sf-db-file-sync-safety';
const releasePage = `https://github.com/${repo}/releases`;
const app = document.querySelector<HTMLDivElement>('#app')!;
const routeStatus = document.querySelector<HTMLDivElement>('#route-status')!;

type Route = '/' | '/demo' | '/privacy' | '/terms' | '/404';

const routeMeta: Record<Route, { title: string; description: string; path: string; noindex?: boolean }> = {
  '/': {
    title: 'DB File Sync Safety — Make SQLite snapshots safe',
    description: 'Block raw SQLite copies, create verified snapshots, and restore them safely on another device.',
    path: '/',
  },
  '/demo': {
    title: 'Demo — DB File Sync Safety',
    description: 'Try the bundled SQLite sample in an isolated browser demo. Nothing is saved.',
    path: '/demo',
  },
  '/privacy': {
    title: 'Privacy — DB File Sync Safety',
    description: 'Read what the local CLI and download page access, store, and request.',
    path: '/privacy',
  },
  '/terms': {
    title: 'Terms — DB File Sync Safety',
    description: 'Read the license, safety limits, and SQLite-only scope for DB File Sync Safety.',
    path: '/terms',
  },
  '/404': {
    title: 'Page not found — DB File Sync Safety',
    description: 'This address is not part of the DB File Sync Safety site.',
    path: '/404',
    noindex: true,
  },
};

function shell(content: string, route: Route): string {
  const demoBanner = route === '/demo' ? `
    <aside class="demo-banner" aria-label="Demo mode">
      <span><strong>Demo</strong> — sample data, nothing is saved</span>
      <div><button class="text-button" data-reset-demo>Reset demo</button><a href="/#install" data-link>Install the CLI</a></div>
    </aside>` : '';
  return `${demoBanner}
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="DB File Sync Safety home">
        <span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>dbsync<span>-safe</span></span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-link ${route === '/demo' ? 'aria-current="page"' : ''}>Demo</a>
        <a href="/#install">Install</a>
        <a href="/privacy" data-link ${route === '/privacy' ? 'aria-current="page"' : ''}>Privacy</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <p><span class="signal-dot" aria-hidden="true"></span> Verified SQLite packets for file sync.</p>
      <nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external)</span></a></nav>
      <p class="build">v0.1.3 · build 004</p>
    </footer>`;
}

function terminal(id = 'terminal'): string {
  return `<div class="terminal" id="${id}" aria-label="Terminal recording of the sample workflow">
    <div class="terminal-bar"><span></span><span></span><span></span><b>sample / field-notes.sqlite</b></div>
    <div class="terminal-body" role="log" aria-live="polite" tabindex="0">
      <p><span class="prompt">$</span> dbsync-safe --demo</p>
      <p class="terminal-row row-1"><span class="step">01 · SCAN</span> field-notes.sqlite <span class="warn">+ live WAL</span></p>
      <p class="terminal-row row-2"><span class="step">02 · BLOCK</span> raw file copy refused</p>
      <p class="terminal-row row-3"><span class="step">03 · SNAPSHOT</span> backup created <span class="safe">✓</span></p>
      <p class="terminal-row row-4"><span class="step">04 · RESTORE</span> checksum + integrity passed <span class="safe">✓</span></p>
      <p class="terminal-row row-5"><span class="prompt">→</span> safe-packet/dbsync-safe-manifest.json</p>
    </div>
  </div>`;
}

function landing(): string {
  return shell(`<main id="main">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">SQLite sync check · v0.1.3</p>
        <h1 id="page-title" tabindex="-1">Make SQLite snapshots safe to sync</h1>
        <p class="lede">For developers syncing app folders, it blocks raw database copies and creates a verified packet.</p>
        <div class="hero-actions">
          <a class="button primary" href="/?demo=1" data-link>Try it with sample data</a>
          <a class="button secondary platform-download" href="${releasePage}">View downloads</a>
        </div>
        <p class="action-note">See the CLI include a live write-ahead log in a verified packet.</p>
        <ul class="plain-facts" aria-label="Product facts">
          <li><span aria-hidden="true">⌂</span> Runs on your device</li>
          <li><span aria-hidden="true">○</span> No telemetry</li>
          <li><span aria-hidden="true">◇</span> Free under MIT</li>
        </ul>
      </div>
      <figure class="hero-art">
        <img src="/hero-database.webp" width="1536" height="1024" fetchpriority="high" alt="Glass database layers show a live write stopped before a verified snapshot crosses to another device.">
        <figcaption><span>LIVE BUNDLE</span><span>BACKUP API</span><span>VERIFIED PACKET</span></figcaption>
        <div class="integrity-sweep" aria-hidden="true"></div>
      </figure>
    </section>

    <section class="preview band" aria-labelledby="preview-heading">
      <div class="section-label"><span>01</span><p>Real CLI output</p></div>
      <div>
        <h2 id="preview-heading">See the CLI block raw copying and create a packet</h2>
        <p class="measure">The bundled demo creates and uses sample files in its temporary folder. It includes a live write-ahead log in the snapshot.</p>
        ${terminal('landing-terminal')}
        <p class="terminal-command"><code>dbsync-safe --demo</code><button data-copy="dbsync-safe --demo">Copy demo command</button></p>
      </div>
    </section>

    <section class="workflow band" aria-labelledby="workflow-heading">
      <div class="section-label"><span>02</span><p>Safe procedure</p></div>
      <div>
        <h2 id="workflow-heading">Replace raw copying with three checks</h2>
        <ol class="steps">
          <li><span>1</span><div><h3>Scan the source folder</h3><p>Find SQLite headers and their write-ahead log (WAL), shared-memory (SHM), or journal sidecars.</p><code>dbsync-safe scan ~/Sync/App</code></div></li>
          <li><span>2</span><div><h3>Make the snapshot packet</h3><p>Copy the bundle privately, then use SQLite’s backup API and write checksums.</p><code>dbsync-safe snapshot ~/Sync/App -o ~/ToSync</code></div></li>
          <li><span>3</span><div><h3>Restore on the other device</h3><p>Check the packet before copying, then run SQLite’s integrity check.</p><code>dbsync-safe restore ~/ToSync -t ~/AppData</code></div></li>
        </ol>
      </div>
    </section>

    <section class="limits band" aria-labelledby="limits-heading">
      <div class="section-label"><span>03</span><p>Scope</p></div>
      <div>
        <h2 id="limits-heading">Know what this safety check covers</h2>
        <div class="scope-grid">
          <div><p class="status safe"><span aria-hidden="true">✓</span> Included</p><ul><li>SQLite databases and sidecars</li><li>Consistent backup snapshots</li><li>Checksummed restore packets</li><li>Machine-readable JSON output</li></ul></div>
          <div><p class="status warn"><span aria-hidden="true">!</span> Not included</p><ul><li>A file-sync engine</li><li>Conflict merging or replication</li><li>Other database formats</li><li>A universal browser-profile guarantee</li></ul></div>
        </div>
        <p class="caution"><strong>Close the app when possible.</strong> OS and application locks vary. The tool never claims that simultaneous app use is safe.</p>
      </div>
    </section>

    <section class="install band" id="install" aria-labelledby="install-heading">
      <div class="section-label"><span>04</span><p>Install</p></div>
      <div>
        <h2 id="install-heading">Install one binary</h2>
        <p class="measure">Choose a package, or use the installer for your current system. The shell installer verifies SHA-256 before installation.</p>
        <div class="install-panel">
          <div><p class="os-label">Detected system</p><p class="detected-platform">Checking your system…</p></div>
          <a class="button primary platform-download" href="${releasePage}">View downloads</a>
          <p class="release-state" role="status">Checking the latest release…</p>
        </div>
        <div class="commands">
          <div><p>macOS or Linux</p><code>curl -fsSL https://db-file-sync-safety.sociobot.in/install.sh | sh</code></div>
          <div><p>Windows PowerShell</p><code>irm https://db-file-sync-safety.sociobot.in/install.ps1 | iex</code></div>
        </div>
        <details><summary>Package manager options</summary><div class="package-list"><code>brew install B-Divyesh/db-file-sync-safety/dbsync-safe</code><code>scoop install https://raw.githubusercontent.com/B-Divyesh/sf-db-file-sync-safety/main/scoop-bucket/dbsync-safe.json</code><p>The macOS package and Windows binary are unsigned in v0.1.3.</p></div></details>
      </div>
    </section>
  </main>`, '/');
}

function demo(): string {
  return shell(`<main id="main" class="inner-main demo-page">
    <p class="eyebrow">Isolated sample · no setup</p>
    <h1 id="page-title" tabindex="-1">Run the SQLite safety check</h1>
    <p class="lede">This recording uses the same field-notes sample shipped with the CLI.</p>
    <section aria-labelledby="demo-result-heading" class="demo-stage">
      <div class="demo-path"><span>temporary folder</span><code>/tmp/dbsync-safe-demo/sync-folder</code></div>
      ${terminal('demo-terminal')}
      <div class="demo-result"><span class="safe-mark" aria-hidden="true">✓</span><div><h2 id="demo-result-heading">Restore verified</h2><p>4 notes reached a new folder, including the live-WAL note. The source stayed unchanged.</p></div></div>
    </section>
    <section class="try-cli" aria-labelledby="try-heading"><h2 id="try-heading">Run the same demo after install</h2><p><code>dbsync-safe --demo</code></p><button class="button secondary" data-copy="dbsync-safe --demo">Copy demo command</button></section>
  </main>`, '/demo');
}

function privacy(): string {
  return shell(`<main id="main" class="inner-main legal">
    <p class="eyebrow">Policy · effective 28 August 2026</p>
    <h1 id="page-title" tabindex="-1">Your database stays on your device</h1>
    <p class="lede">The CLI needs no account and sends no network requests.</p>
    <section><h2>What the CLI reads</h2><p>It reads database and sidecar bytes from paths you give it. SQLite opens only a temporary working copy.</p><p>Read-only source folders stay unchanged. Snapshots and manifests go only to the output folder you choose.</p></section>
    <section><h2>What this site stores</h2><p>The site may cache public GitHub release details for one hour. The demo does not save any data.</p></section>
    <section><h2>Network requests</h2><p>The landing page asks GitHub for the latest public release. The CLI sends no network requests.</p></section>
    <section><h2>Questions</h2><p>Open an issue in the <a href="https://github.com/${repo}">public repository <span class="sr-only">(external)</span></a>.</p></section>
  </main>`, '/privacy');
}

function terms(): string {
  return shell(`<main id="main" class="inner-main legal">
    <p class="eyebrow">Terms · effective 28 August 2026</p>
    <h1 id="page-title" tabindex="-1">Use the tool with a separate backup</h1>
    <p class="lede">DB File Sync Safety is free software for SQLite workflows.</p>
    <section><h2>License</h2><p>The software is provided under the MIT License.</p></section>
    <section><h2>No universal safety promise</h2><p>Applications and operating systems lock files differently. Close the source application when possible.</p><p>Keep an independent backup before replacing an existing database.</p></section>
    <section><h2>Scope</h2><p>The tool supports SQLite. It is not a sync engine, conflict resolver, or database replication service.</p></section>
  </main>`, '/terms');
}

function notFound(): string {
  return shell(`<main id="main" class="inner-main missing">
    <div class="lost-plate" aria-hidden="true"><span>404</span></div>
    <p class="eyebrow">404 error</p>
    <h1 id="page-title" tabindex="-1">Page not found</h1>
    <p class="lede">Check the address or return to the DB File Sync Safety overview.</p>
    <a class="button primary" href="/" data-link>Return home</a>
  </main>`, '/404');
}

function currentRoute(): Route {
  if (new URLSearchParams(window.location.search).get('demo') === '1') return '/demo';
  const clean = window.location.pathname.replace(/\/$/, '') || '/';
  return (['/', '/demo', '/privacy', '/terms'].includes(clean) ? clean : '/404') as Route;
}

function render(shouldFocus = false): void {
  const route = currentRoute();
  const meta = routeMeta[route];
  const canonical = `https://db-file-sync-safety.sociobot.in${meta.path}`;
  document.title = meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = meta.description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = canonical;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = meta.title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = meta.description;
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content = canonical;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = meta.description;
  document.querySelector<HTMLMetaElement>('meta[name="robots"]')!.content = meta.noindex ? 'noindex, nofollow' : 'index, follow';
  app.innerHTML = route === '/' ? landing() : route === '/demo' ? demo() : route === '/privacy' ? privacy() : route === '/terms' ? terms() : notFound();
  bindEvents();
  if (route === '/') void loadRelease();
  if (shouldFocus) {
    const heading = document.querySelector<HTMLHeadingElement>('h1')!;
    heading.focus();
    routeStatus.textContent = heading.textContent ?? '';
  }
}

function bindEvents(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach((link) => link.addEventListener('click', (event) => {
    const target = new URL(link.href);
    if (target.origin !== window.location.origin) return;
    event.preventDefault();
    history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`);
    render(true);
    if (target.hash) document.querySelector(target.hash)?.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(button.dataset.copy ?? '');
    button.textContent = 'Demo command copied';
  }));
  document.querySelector<HTMLButtonElement>('[data-reset-demo]')?.addEventListener('click', () => {
    const old = document.querySelector('#demo-terminal');
    if (old) { old.outerHTML = terminal('demo-terminal'); }
    routeStatus.textContent = 'Demo reset with fresh sample data.';
  });
}

function platform(): { label: string; asset: RegExp | null } {
  const value = navigator.userAgent.toLowerCase();
  if (value.includes('windows')) return { label: 'Windows x64', asset: /windows.*x86_64.*\.zip$/i };
  if (value.includes('mac')) return { label: 'macOS — Apple silicon or Intel', asset: null };
  return { label: 'Linux x64', asset: /linux.*x86_64.*\.tar\.gz$/i };
}

async function loadRelease(): Promise<void> {
  const detected = platform();
  document.querySelectorAll('.detected-platform').forEach((node) => { node.textContent = detected.label; });
  const state = document.querySelector<HTMLElement>('.release-state');
  try {
    const cached = localStorage.getItem('dbsync-safe:release');
    const parsed = cached ? JSON.parse(cached) as { expires: number; data: Release } : null;
    const release = parsed && parsed.expires > Date.now() ? parsed.data : await fetchRelease();
    if (!detected.asset) {
      document.querySelectorAll<HTMLAnchorElement>('.platform-download').forEach((link) => {
        link.href = releasePage;
        link.textContent = 'Choose a macOS download';
      });
      if (state) state.textContent = `${release.tag_name} has Apple silicon and Intel packages.`;
      return;
    }
    const asset = release.assets.find((item) => detected.asset!.test(item.name));
    if (!asset) throw new Error('platform asset not published');
    document.querySelectorAll<HTMLAnchorElement>('.platform-download').forEach((link) => {
      link.href = asset.browser_download_url;
      link.textContent = `Download for ${detected.label}`;
    });
    if (state) state.textContent = `${release.tag_name} is ready for ${detected.label}.`;
  } catch {
    if (state) state.textContent = 'Downloads are being published. The release page has the current status.';
    document.querySelectorAll<HTMLAnchorElement>('.platform-download').forEach((link) => { link.href = releasePage; });
  }
}

type Release = { tag_name: string; assets: { name: string; browser_download_url: string }[] };
async function fetchRelease(): Promise<Release> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=1`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error('release unavailable');
  const releases = await response.json() as Release[];
  const data = releases[0];
  if (!data) throw new Error('release unavailable');
  localStorage.setItem('dbsync-safe:release', JSON.stringify({ expires: Date.now() + 3_600_000, data }));
  return data;
}

window.addEventListener('popstate', () => render(true));
render();
