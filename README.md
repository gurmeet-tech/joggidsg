# Minhaj Motion - video editing portfolio

A dark-first, build-free portfolio for a short-form and long-form video editor.
The landing page opens with an editorial hero, a scroll-scrubbed 3D showreel,
then the selected-work masthead, a filterable work grid, about, reviews, FAQ and
contact. Short-form and long-form galleries each have their own page.

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
| `index.html` | Landing page: editorial hero, showreel, selected work, about, reviews, FAQ and contact |
| `short-form.html` | Short-form gallery with its own lightbox |
| `long-form.html` | Long-form gallery with its own lightbox |

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page markup, SVG sprite, hero, lightbox, intro loader |
| `short-form.html` / `long-form.html` | Work pages and their galleries |
| `styles.css` | Tokens, themes, editorial hero, floating navigation, glass, responsive rules |
| `script.js` | Theme, Lenis smooth scroll, floating nav state/progress, intro, filters/previews, lightbox, footer glow, counters, media guards |
| `hero-3d.js` | GSAP ScrollTrigger scrub for the hero video card |
| `hero-particles.js` | Canvas dust that falls through the hero ray field |
| `light-rays.js` | WebGL LightRays module used behind the hero |
| `pixel-card.js` | Vanilla canvas port of the React Bits PixelCard button mosaic |
| `assets/vendor/lenis.min.js` | Locally vendored Lenis smooth-scroll runtime |
| `assets/vendor/gsap.min.js` / `ScrollTrigger.min.js` | Locally vendored GSAP 3.15.0 runtime |
| `vercel.json` | Static deployment, cache and security headers |
| `assets/fonts/` | Instrument Serif for the hero, Clash Display for buttons, Creato Display and SF Pro/system UI for other type |
| `assets/videos/` | 14 local MP4 clips |
| `assets/posters/` | Matching poster frames |
| `assets/img/logo.png` | Header/footer mark and favicon |

## Features

- **Editorial hero** - Instrument Serif headline, italic blue "one stop"
  accent, a dotted navigation divider, compact pill CTAs and a 16:9 showreel
  inside a 20 px layered liquid-glass frame.
- **Scroll-scrubbed 3D showreel** - the glass card starts tilted back
  (`rotateX(15deg)`, `scale(.92)`, `translateZ(-80px)`), then GSAP ScrollTrigger
  (`scrub: true`, `ease: none`) moves it upright and full-size. The scrub ends
  just beneath the floating navigation so the final frame stays visible. Tablet
  and mobile reduce the tilt and distance, and `prefers-reduced-motion` shows
  the flat state immediately.
- **Floating Dynamic Island navigation** - the glass pill floats inside the page
  gutters. Scrolling down condenses it with a spring-like bounce and hides the
  dotted divider; scrolling up restores the full bar. A thin blue arc around the
  pill tracks page scroll from 0 to 100%.
- **Layered LightRays** - the existing WebGL ray field remains intact and now
  runs at full opacity. Soft canvas dust is masked to the beam and swells/fades
  at the end of its life, so particles leave the light without a hard cut.
- **Dark mode first** with a light-mode toggle; the choice persists in
  `localStorage` under `mm-theme`. Theme changes do not reset the hero's 3D
  scroll progress.
- **Smooth scrolling** - Lenis runs locally with gentle inertia, handles
  same-page anchors, pauses for overlays, and falls back to native scrolling
  when reduced motion is requested.
- **Compact Clash Display buttons** - 32 px bevel buttons use Clash Display
  Medium, quiet gradients and an enhanced square PixelCard mosaic on hover.
  The old sheen sweep has been removed; clicks add a short dot-grid ripple.
- **Selected work grid** - an editorial masthead, a Showreel feature and ten
  homepage cards with All / Short-form / Long-form / Motion filters, consistent
  landscape/portrait framing, lazy hover previews and click-to-lightbox playback.
- **SF Pro body type** - secondary/UI copy uses SF Pro on Apple devices and
  native system fallbacks elsewhere.
- **Animated intro** - three full-width typographic slices slide in from above
  one second apart, merge, then lift away as the site settles in. Runs once per
  session and respects `prefers-reduced-motion`.
- **Dedicated work pages** - seven short-form edits and three long-form cuts,
  each in its own lightbox gallery.
- **Showreel lightbox** - the hero card and the showreel feature open with sound
  in the same accessible player.
- **Footer wordmark hover** - a highly blurred brand-coloured sphere follows the
  cursor and subtly tints only the letters near it.
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

- The editorial hero lives in `index.html` under `section.hero--editorial`. The
  headline is split into two spans; keep `one stop` inside the `em` for the blue
  italic treatment. The hero card carries the same lightbox `data-*` fields as
  other media.
- The 3D start values sit in `hero-3d.js` (`state.desktop`, `state.tablet`,
  `state.mobile`). The scrub end is measured from the video plane and the
  floating nav height, so re-check it after major hero layout changes.
- Floating navigation styling and the condensed state live in `styles.css`;
  scroll direction, the `is-condensed` class and `--nav-progress` are handled in
  `script.js`.
- LightRays is configured with `data-rays-*` attributes on the hero container.
  Particle density, palette and exit fade live in `hero-particles.js`; the beam
  mask is in `styles.css` under `.hero-editorial__particles`.
- Theme colours, work layout, button styling and responsive rules live in
  `styles.css`.
- PixelCard is applied automatically to every `.btn`; options are set in
  `prepareButton()` inside `pixel-card.js`.
- The homepage selected-work cards live in `#workGrid` inside `index.html`.
  Work-page galleries live in `short-form.html` and `long-form.html`. Each card
  uses `data-src`, `data-poster`, `data-title`, `data-category`,
  `data-duration` and `data-orientation` (`portrait` or `landscape`).

## Notes

- Showreel previews are muted on the page and play with sound in the lightbox.
- No analytics, trackers or external runtime requests.
- Instrument Serif is licensed under the SIL Open Font License 1.1. Clash
  Display uses the ITF Free Font License; Lenis ships under MIT. GSAP and
  ScrollTrigger are vendored under the GSAP standard license. Licence notes live
  beside each asset.
