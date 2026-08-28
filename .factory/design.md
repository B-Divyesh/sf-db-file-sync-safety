# Visual thesis — luminous glass data landscape

## Product idea

DB File Sync Safety is a guard rail between a live SQLite file and a sync folder. Its visual world treats a database as a bright, layered object whose integrity can be inspected before it crosses a boundary. The landing page therefore resembles a dark instrument panel overlooking a quiet field of translucent data plates. It does not use a generic gradient hero or floating feature cards.

## Palette

The single dark treatment keeps the safety states unambiguous and makes the glass layers readable.

| Token | Value | Use |
| --- | --- | --- |
| `--ink-950` | `#071014` | page background |
| `--ink-900` | `#0b171b` | raised surface |
| `--glass` | `rgba(196, 246, 238, .08)` | translucent panels |
| `--line` | `#35535a` | borders and dividers |
| `--text` | `#edf9f6` | primary text |
| `--muted` | `#a9c4c4` | secondary text; 7:1 on the background |
| `--mint` | `#73f3cb` | primary action and safe state |
| `--mint-ink` | `#06241e` | text on mint |
| `--amber` | `#ffc766` | live-file warning |
| `--red` | `#ff8d91` | blocked/error state |
| `--blue` | `#8fcdff` | paths, links, and transfer state |

## Type and spacing

- Display: `Arial Narrow`, `Aptos Narrow`, then system sans. The compressed letterforms feel like labels on a technical instrument.
- Body and controls: `Inter`, `ui-sans-serif`, system sans. No font is fetched at runtime; the system stack keeps the first load small and private.
- Code: `SFMono-Regular`, `Cascadia Code`, `Roboto Mono`, monospace.
- Type scale: 16, 18, 24, 36, and fluid 64 pixels.
- Spacing uses an 8-pixel base: 8, 16, 24, 32, 48, 64, 96.
- Copy stays under 70 characters per line. Controls have at least 44-pixel targets.

## Shape and layout

The hero is an asymmetric split: a narrow safety readout beside a wide data landscape. Clipped corners make panels feel like protective cases, while thin inner highlights suggest laminated glass. Section boundaries use long horizontal rules and small coordinate labels instead of generic cards. The primary action is a solid mint lozenge; secondary actions remain outlined.

## Interaction grammar

- Hover and focus raise a control by two pixels and brighten its edge.
- The demo terminal advances like a measured scan: source, warning, snapshot, verify.
- Safety states always pair a color with a word and symbol.
- Route changes move focus to the page heading and announce the new page.

## Motion policy

One signature motion, **the integrity sweep**, moves a narrow light across the hero database plates once on entry. Terminal rows reveal in sequence over 900 ms. No motion loops. With `prefers-reduced-motion: reduce`, all content appears immediately, the sweep is hidden, and scrolling is instant.

## Original asset plan and provenance

- `site/public/hero-database.webp`: generated specifically for this product with `/opt/fleet/lib/gen-image.sh` using the factory `factory-image` deployment. Prompt: “A cinematic abstract data landscape for a SQLite safety CLI landing page: three translucent glass database platters nested inside a precise protective frame, a small amber live-write pulse stopped at the boundary, and a calm mint snapshot continuing across to a second verified platter. Oblique isometric view, deep near-black teal environment, luminous mint and ice-blue edge light, restrained amber warning, etched data-grid details, premium technical editorial 3D render, strong dark negative space, no people, no logos, no letters, no readable text, no watermark.” Generated at 1536×1024, then encoded to WebP at quality 82 and kept below 300 KB.
- Open Graph art is composed locally from the same original asset and product typography. No external stock or icon library is used.
- The database bundle mark, warning glyphs, and terminal symbols are hand-made SVG/CSS geometry under the MIT project license.

## Why this fits

SQLite safety is about preserving the relationship between a main database and its live sidecars. Layered glass makes that bundle visible. The stopped amber pulse explains the risk, while the mint copy shows the safe alternative. The result feels calm and technical because the tool should stop a dangerous action without creating panic.
