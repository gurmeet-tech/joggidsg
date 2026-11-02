# Minhaj Motion — video editing portfolio

A dark-first, build-free portfolio for a short-form and long-form video editor.
The landing page leads with a full-bleed `MAKE THEM WATCH.` statement and a
CSS-built MacBook Pro playing the showreel. Short-form and long-form work each
live on their own gallery page.

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

## Pages

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page: hero, showreel, about, reviews, FAQ and contact |
| `short-form.html` | Short-form gallery with its own lightbox |
| `long-form.html` | Long-form gallery with its own lightbox |

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page markup, SVG sprite, lightbox, intro loader |
| `short-form.html` / `long-form.html` | Work pages and their galleries |
| `styles.css` | Tokens, themes, hero/MacBook, work pages, responsive rules |
| `script.js` | Theme, intro, lightbox, footer hover, counters, media guards |
| `pixel-card.js` | Vanilla canvas port of the React Bits PixelCard effect |
| `light-rays.js` | Optional WebGL LightRays module (not loaded by the current hero) |
| `vercel.json` | Static deployment, cache and security headers |
| `assets/fonts/` | Creato Display (WOFF) + Sequel Sans body (WOFF) |
| `assets/videos/` | 14 local MP4 clips |
| `assets/posters/` | Matching poster frames |
| `assets/img/logo.png` | Header/footer mark and favicon |

## Features

- **Dark mode first** with a light-mode toggle; choice persists in
  `localStorage` under `mm-theme`.
- **MacBook hero** — oversized Creato Display type beside a CSS-built MacBook
  Pro. The screen autoplays the muted showreel, pauses when reduced motion is
  requested, and respects tab visibility.
- **Creato Display CTAs** — buttons use Creato Display Bold with a subtle
  canvas PixelCard reveal on hover/focus.
- **Animated intro** — three full-width typographic slices slide in from above
  one second apart, merge, then lift away as the site settles in. Runs once per
  session and respects `prefers-reduced-motion`.
- **Dedicated work pages** — seven short-form edits and three long-form cuts,
  each in its own lightbox gallery.
- **Showreel lightbox** — the hero CTA opens the same showreel with sound.
- **Footer wordmark hover** — the oversized outlined text follows the cursor
  with magnetic letters and a soft light-spot fill.
- **Responsive** from 320 px upward, with a mobile menu, fluid type and
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

- The landing hero lives in `index.html` under `.hero`. Swap the hero video by
  changing the `.macbook__video` source and poster.
- Work items live in `short-form.html` and `long-form.html`. Each gallery card
  uses `data-src`, `data-poster`, `data-title`, `data-category`,
  `data-duration` and `data-orientation` (`portrait` or `landscape`).
- PixelCard is applied automatically to every `.btn`; options are set in
  `prepareButton()` inside `pixel-card.js`.
- Theme colours, hero sizing and the MacBook frame live in `styles.css`.
- LightRays is available in `light-rays.js` but is not loaded on the current
  pages.

## Notes

- Videos are muted in the hero showcase and play with sound in the lightbox.
- No analytics, trackers or external runtime requests.
