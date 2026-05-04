# mirador-ocr-helper

[![required Mirador version][mirador-badge]][mirador]

**A Mirador 4 plugin that adds an OCR side panel next to the OpenSeadragon
viewer, with bidirectional line highlighting and an optional selectable
text overlay rendered on the image.**

[![Screenshot][screenshot]][screenshot]

## Provenance

This package is a port of [`@4eyes/mirador-ocr-helper`][upstream-4eyes] 2.0.5
(itself a fork of [`dbmdz/mirador-textoverlay`][upstream-dbmdz]), updated to
the Mirador 4 / MUI 7 / React 18+ / Vite stack and reorganised as a
source-only ESM package (no build step — the host project's bundler
consumes `src/` directly).

The Mirador 4 port mirrors the work done upstream in
[dbmdz/mirador-textoverlay#319][upstream-pr-v4] but keeps the side panel
and click-to-highlight features that the original `mirador-textoverlay`
does not provide.

License: MIT (unchanged from the 4eyes / dbmdz lineage).

## Features

- **OCR side panel**: lists every OCR line of the current canvas, click a
  line to highlight + zoom on it in the viewer.
- **Bidirectional highlight**: click a line in the image to highlight it
  in the panel (and scroll the panel to that line).
- **Floating settings bubble** on top of the OpenSeadragon viewer with
  five buttons: text visibility (Tt), text selection (I-beam), opacity
  slider, colour palette (text colour + background colour + reset),
  collapse.
- **Selectable text overlay**: optionally render a transparent text layer
  that the browser can select and copy.
- **Click pass-through when the panel is hidden**: with `panelVisible:
  false` the rect layer lets pointer events fall through to OSD so the
  default click-to-zoom keeps working.
- **Window menu entry**: a `WindowTopBarPluginMenu` item to show/hide the
  floating settings bubble and the side panel per window.

## Requirements for supported IIIF manifests

- Line-level annotations with either:
  - a `motivation` that is `supplementing` (IIIF v3 with embedded
    `TextualBody` or external resource)
  - a resource that has a `@type` of `cnt:contentAsText` (IIIF v2)
  - a `dcType` equal to `Line` (Europeana)
- Or a per-canvas `seeAlso` entry pointing to ALTO or hOCR OCR markup:
  - `format`: `application/xml+alto` or `text/vnd.hocr+html`
  - or `profile` starting with `http://www.loc.gov/standards/alto/`,
    `http://kba.cloud/hocr-spec`, `http://kba.github.io/hocr-spec/` or
    `https://github.com/kba/hocr-spec/blob/master/hocr-spec.md`

Arbitrary scaling factors are handled — as long as the OCR matches the
canvas dimensions the overlay renders at the right place.

## Installation

The package ships as ESM source (no `dist/` build). Add it as a
dependency of your Mirador host project, then import and register:

```javascript
import Mirador from 'mirador';
import ocrHelper from 'mirador-ocr-helper';

const config = {
  // your Mirador configuration
};

Mirador.viewer(config, [...ocrHelper]);
```

Your bundler (Vite, Rollup, Webpack) must be able to consume JSX from
`node_modules/mirador-ocr-helper/src`. With Vite, declare the package in
`optimizeDeps.exclude` or simply rely on the default `esbuild`-based
transform that handles JSX out of the box.

## Configuration

Configure globally via `windowDefaults.textOverlay`, or per-window via
`windows[].textOverlay`:

```javascript
const config = {
  windowDefaults: {
    textOverlay: {
      // Global defaults for every window
    },
  },
  windows: [{
    // ...
    textOverlay: {
      // Per-window overrides
    },
  }],
};
```

### Available options

| Option                | Type    | Default      | Notes                                                                                       |
|-----------------------|---------|--------------|---------------------------------------------------------------------------------------------|
| `enabled`             | bool    | `true`       | Whether the plugin is active for the window.                                                |
| `visible`             | bool    | `false`      | Whether the text overlay is painted on the image (toggled by the Tt button).                |
| `selectable`          | bool    | `false`      | Whether the text overlay is selectable (toggled by the I button).                           |
| `opacity`             | number  | `0`          | Text overlay opacity, `0` to `1`.                                                           |
| `useAutoColors`       | bool    | `false`      | Try to derive text/bg colour from the page image. Skipped at boot when `false` (perf win).  |
| `textColor`           | string  | `'#000000'`  | Fallback text colour.                                                                       |
| `bgColor`             | string  | `'#00FF7B'`  | Fallback background colour (also the panel-to-image highlight colour).                      |
| `bubbleVisible`       | bool    | `false`      | Whether the floating settings bubble is shown on the OSD viewer.                            |
| `panelVisible`        | bool    | `true`       | Whether the side OCR panel is rendered. Set to `false` to never show the panel.             |
| `panelScrollBehavior` | string  | `'smooth'`   | Side panel scroll animation: `'smooth'`, `'instant'` or `'auto'`.                           |
| `skipEmptyLines`      | bool    | `true`       | Hide OCR lines with empty `text` from the panel.                                            |
| `optionsRenderMode`   | string  | `'complex'`  | `'complex'` (full bubble) or `'simple'` (Tt button only).                                   |
| `correction`          | object  | see below    | Email-based OCR correction reporting.                                                       |

### `correction` sub-options

| Option                | Type       | Default   | Notes                                                                |
|-----------------------|------------|-----------|----------------------------------------------------------------------|
| `enabled`             | bool       | `false`   | Enable the per-line correction button (mailto link).                 |
| `emailRecipient`      | string     | `null`    | Recipient address for the mailto link.                               |
| `emailUrlKeepParams`  | string[]   | `[]`      | URL query parameters to forward in the mailto body.                  |

### Theming

The plugin reads two values from the Mirador theme under `textOverlay`:

- `overlayFont` — `font-family` for the text overlay.
- `selectionTextColor` / `selectionBackgroundColor` — currently unused
  (the browser's native selection style is preferred since v4 to avoid a
  Chrome SVG bug where the selection colour leaked back into the
  resting style).

## UI controls

When `bubbleVisible` is true and the OCR is available, a five-button
floating bubble appears on the OSD viewer, top-right:

| Button   | Icon                          | Toggles                            |
|----------|-------------------------------|------------------------------------|
| Tt       | `TextFieldsIcon`              | `visible` (and the side panel).    |
| I-beam   | `TextSelectIcon`              | `selectable`.                      |
| Opacity  | `OpacityIcon` + slider        | `opacity`.                         |
| Palette  | `PaletteIcon` + colour popup  | `textColor` / `bgColor` + reset.   |
| Close    | `CloseIcon`                   | Collapses the bubble.              |

The colour popup shows two colour pickers (text + background) and, when
either colour differs from its default, a reset button at the bottom
that restores the defaults.

The window-level `WindowTopBarPluginMenu` (the 3-dots menu next to the
window title) exposes a single entry, "Show / Hide text overlay", that
toggles `bubbleVisible`.

## How it works

For every page, the plugin renders two stacked SVG layers inside an OSD
portal:

1. A **rect layer** — one `<rect data-line-key="x_y">` per OCR line.
   Always mounted (rects are cheap). When `panelVisible` is true it
   captures pointer events so a click on the image highlights the
   corresponding panel line and zooms the OSD viewport onto the line;
   when the panel is hidden the layer becomes `pointer-events: none` so
   OSD's default click-to-zoom takes over.
2. A **text layer** — `<text>`/`<tspan>` nodes with `textLength` and
   `lengthAdjust="spacingAndGlyphs"`. Painted only when `visible` is true
   or `selectable` is on; controlled by `opacity` (defaults to 0).

The wrapper `<div>` stays unsized (no explicit `width`/`height`) — giving
it the canvas dimensions plus `willChange: transform` made Chromium
allocate a per-page compositing layer that exceeded GPU memory on dense
scans and triggered a SIGILL / black-screen freeze.

The side panel reserves 50% of the viewer width up-front (via the
styled `ViewerContainer` / `TextContainer` components) so OSD measures
its container correctly on the very first paint — without this, OSD
would size itself to the full window before the panel mounts, then fail
to re-fit once the panel pushes it to half-width.

OSD's default "click to zoom" gesture is suppressed on rect clicks
through `stopPropagation()` on `pointerdown` / `pointerup` / `click` —
otherwise OSD would double the magnification every time the user clicks
a line.

## Possible improvements

Roadmap items, in roughly decreasing impact-vs-effort order:

- **Lazy text-layer mount**: only build the `<text>`/`<tspan>` subtree
  when `selectable` is on or `opacity > 0`. A previous attempt
  (display:none on the SVG plus explicit pageWidth/pageHeight on the
  wrapper) caused a Chromium GPU-layer freeze on dense scans and was
  reverted — the safe approach is to gate the React subtree without
  giving the wrapper an explicit size.
- **Virtualise the side panel** with `react-window` (or equivalent) for
  manifests with hundreds of OCR lines per canvas. Mounting hundreds of
  `<button>` nodes synchronously is currently the dominant post-manifest
  cost.
- **Defer OCR parsing** through `requestIdleCallback` or a Web Worker.
  `parseIiifAnnotations` and the hOCR/ALTO parsers run on the main
  thread; offloading would unblock first paint on dense manifests.
- **Persist the bubble position** (per-window or per-session) so the
  user can drag it out of the way of other plugins.
- **Word-level granularity**: today the panel is line-based. A
  word-level mode would help search-hit highlighting plug into the same
  bidirectional flow.
- **Page color auto-detection**: re-enable `requestColors` lazily (when
  the user opens the palette) instead of skipping it everywhere when
  `useAutoColors=false`. Would make the reset button useful as a "back
  to auto" affordance again.
- **Theming**: revisit the `::selection` rule that was removed to avoid
  the Chrome SVG residual-colour bug. A scoped `::selection` (only when
  text is `visible`) could re-introduce custom selection colours
  without the post-selection visual leak.
- **Mobile layout**: the current side panel takes up to 50% of the
  window width; a bottom-sheet layout would be friendlier on narrow
  viewports.
- **i18n coverage**: locales currently cover fr/en/de/it. Mirror new
  keys (`ocrHelperShowOverlay`, `ocrHelperHideOverlay`,
  `resetTextColors`, `backgroundColor`, etc.) into upstream Mirador
  language packs where contributors are willing.

## Differences from `mirador-textoverlay`

- Adds a **side panel** (`MiradorOcrWindowViewer`) listing OCR lines —
  textoverlay only renders the SVG on the image.
- Adds **bidirectional click-to-highlight** (image ↔ panel) with OSD
  zoom-to-line on panel click.
- The floating settings bubble is **mounted on-demand** through a
  window-menu entry (`bubbleVisible: false` by default) — textoverlay
  shows the bubble unconditionally.
- The text layer is **lazy-mounted** for performance on dense manifests.
- The colour widget exposes a **manual reset** (not auto-detect-based):
  it returns to the configured `textColor`/`bgColor` defaults.

## Contributing

Bug reports and pull requests are welcome. For non-trivial changes,
please open an issue first to discuss scope.

[mirador-badge]: https://img.shields.io/badge/Mirador-%E2%89%A54.0.0-blueviolet
[mirador]: https://github.com/ProjectMirador/mirador/releases
[screenshot]: .docassets/screenshot.jpg
[upstream-4eyes]: https://github.com/4eyes/mirador-ocr-helper
[upstream-dbmdz]: https://github.com/dbmdz/mirador-textoverlay
[upstream-pr-v4]: https://github.com/dbmdz/mirador-textoverlay/pull/319
