# Minhaj Motion - video editing portfolio

A dark-first, one-page video editing portfolio inspired by
[minhajmotion.lovable.app](https://minhajmotion.lovable.app/), rebuilt as a
dependency-free static site. The hero adds three infinitely scrolling video
rails, alternating direction each row, plus a WebGL light-ray atmosphere.

## Run locally

The site uses local fonts and videos, so serve the folder over HTTP rather than
opening `index.html` directly:

```powershell
cd "C:\Users\dell\video editing portfolio"
python -m http.server 5500 --bind 127.0.0.1
```

Then open <http://127.0.0.1:5500/>.

Any static server works (`npx serve`, VS Code Live Server, etc.). There is no
build step or package install.

## Deploy to Vercel

The repository is ready for Vercel as a static project. Import the repo in the
Vercel dashboard, or run:

```powershell
npx vercel --prod
```

`vercel.json` adds clean URLs, security headers and long-lived caching for
fonts, posters and videos. The first visit per browser session plays the
three-slice intro; `?intro=0` skips it and `?intro=1` forces it.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Page markup, SVG icon sprite, lightbox, loading screen, content |
| `styles.css` | Design tokens, dark/light themes, layout, responsive rules |
| `script.js` | Theme, intro, rails, previews, lightbox, filters, footer hover, media guards |
| `light-rays.js` | Vanilla WebGL2 port of the React Bits LightRays component |
| `pixel-card.js` | Vanilla canvas port of the React Bits PixelCard component |
| `vercel.json` | Vercel static deployment, cache and security headers |
| `assets/fonts/` | Sequel Sans Display + Body (WOFF) |
| `assets/videos/` | 14 local MP4 clips |
| `assets/posters/` | Matching poster frames |
| `assets/img/logo.png` | Header/footer mark and favicon |

## Features

- **Dark mode first** with a light-mode toggle; choice persists in
  `localStorage` under `mm-theme`.
- **Animated intro** - three full-width typographic slices slide in from above
  one second apart, merge, then lift away as the site settles in. Runs once per
  session and respects `prefers-reduced-motion`.
- **Hero light rays** - theme-aware WebGL shader background at low opacity,
  with cursor influence, click pulses and automatic pause off-screen.
- **Hero video wall** - 3 rows, seamless loops, alternating directions, pause
  on hover, and muted hover previews. Tracks self-fill so the loop stays
  seamless on ultrawide screens.
- **PixelCard contact cards** - the React Bits pixel reveal/spotlight effect
  runs on the footer contact cards using a lightweight canvas port.
- **Footer wordmark hover** - the oversized outlined text follows the cursor
  with magnetic letters and a soft light-spot fill.
- **Showreel + filterable work grid** - 10 projects across short-form,
  long-form and motion graphics, with animated filtering.
- **Per-group lightboxes** - rail, work and showreel each get their own gallery,
  keyboard navigation, focus trap and portrait-aware sizing.
- **Animated stats, testimonial marquee, pricing panel, FAQ accordion,
  contact cards and copy-email toast.**
- **Responsive** from 320 px upward, with a mobile menu, 2-column work grid and
  reduced-motion support.

## Media protection

The page disables image/video dragging, blocks the context menu on media,
disables picture-in-picture/remote playback and hides the native download
control. Vercel also sends `Cross-Origin-Resource-Policy: same-origin` for
assets to discourage hotlinking.

No website can make a video impossible to download: the browser must receive
the bytes to play them, so anyone with DevTools or a screen recorder can still
capture them. For stronger protection, use signed/expiring CDN URLs, encrypted
HLS with a licence server, or visible per-viewer watermarking.

## Editing content

- Work items live directly in `index.html` inside `#workGrid`; each card uses
  `data-cat` (`short`, `long`, `motion`) for filtering.
- Hero rail items are defined in the `railData` array at the top of
  `script.js`.
- Theme colours and spacing live in the `:root` and `html[data-theme]` blocks in
  `styles.css`.
- To swap a video, replace the file in `assets/videos/`, its poster in
  `assets/posters/`, and update the matching `data-src` / `data-poster` values.
- LightRays options are on the `.hero__rays` element in `index.html`
  (`data-rays-*`). PixelCard options are on each contact card
  (`data-pixel-*`).

## Notes

- Videos are muted for hover previews and play with sound in the lightbox.
- The page is intentionally JS-enhanced: the hero rail, testimonial clones and
  intro are rendered/interacted with at runtime.
- No analytics, trackers or external runtime requests. React Bits components
  are ported to vanilla JS to keep the site build-free and local-first.
