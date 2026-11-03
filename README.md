# Minhaj Motion - video editing portfolio

A build-free portfolio for a short-form and long-form video editor. The landing
page opens with an editorial hero and a scroll-scrubbed 3D showreel, then moves
through selected work, an About section, a MagicBento values grid, reviews and a
minimal booking calendar. Short-form and long-form galleries have their own
pages.

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
| `index.html` | Landing page: editorial hero, showreel, selected work, About, reviews, FAQ and the `#book` calendar |
| `short-form.html` | Short-form gallery with its own lightbox |
| `long-form.html` | Long-form gallery with its own lightbox |

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page markup, SVG sprite, hero, booking calendar, lightbox, intro loader |
| `short-form.html` / `long-form.html` | Work pages and their galleries |
| `styles.css` | Tokens, device-aware themes, editorial hero, Dynamic Island navigation, booking, reviews, WhatsApp CTA, responsive rules |
| `script.js` | Theme defaults, nav state/progress, mobile menu, booking calendar, intro, filters/previews, lightbox, footer glow, counters, media guards |
| `hero-3d.js` | GSAP ScrollTrigger scrub for the hero video card |
| `hero-particles.js` | Canvas dust that falls through the hero ray field |
| `light-rays.js` | WebGL LightRays module used behind the hero |
| `magic-bento.js` | Vanilla spotlight/border interaction for the values grid |
| `pixel-card.js` | Vanilla canvas port of the React Bits PixelCard button mosaic |
| `assets/vendor/gsap.min.js` / `ScrollTrigger.min.js` | Locally vendored GSAP 3.15.0 runtime |
| `vercel.json` | Static deployment, cache and security headers |
| `assets/fonts/` | Inter for UI, body and buttons, Instrument Serif for editorial headings, Creato Display for large display type |
| `assets/videos/` | 14 local MP4 clips |
| `assets/posters/` | Matching poster frames |
| `assets/img/logo.png` | Header/footer mark and favicon |

## Features

- **Editorial hero** - Instrument Serif headline, italic blue "one stop"
  accent, compact pill CTAs and a 16:9 showreel inside a layered liquid-glass
  frame.
- **Scroll-scrubbed 3D showreel** - the glass card starts tilted back
  (`rotateX(15deg)`, `scale(.92)`, `translateZ(-80px)`), then GSAP ScrollTrigger
  (`scrub: true`, `ease: none`) moves it upright and full-size. Tablet and mobile
  reduce the tilt and distance, and `prefers-reduced-motion` shows the flat state
  immediately.
- **3-second Dynamic Island navigation** - a floating dotted pill condenses on
  scroll with a synchronized `3s` spring transition. The nav links, brand, island
  label and rounded SVG progress arc morph together with a subtle overshoot. The
  progress arc is the only scroll indicator. The island stays compact while
  scrolling upward and only expands at the very top. The mobile sheet never pops
  the island open when it closes mid-page.
- **Essential navigation** - Showreel, Short-form, Long-form, Reviews and
  Contact stay in the desktop bar; About is available as a clear button in the
  mobile menu. The blue "Hire me" button keeps its 32 px height, 10 px radius,
  bevelled gradient and dot-grid click ripple.
- **Device-aware theme defaults** - mobile and tablet open in light mode, desktop
  opens in dark mode. An explicit choice is saved in `localStorage` under
  `mm-theme` and wins on later visits.
- **Minimal booking flow** - `#book` is a compact calendar with weekday-only
  7 px date dots, available times and a prefilled email request. The date dots
  have no hover animation, keep a 24 px tap target and use native buttons and
  default cursors, with no backend dependency.
- **Editorial reviews** - rounded cards with a faint brand watermark, a stronger
  card silhouette, quote detail and clear Book a call / See the work CTAs.
- **MagicBento values grid** - a vanilla spotlight/border port with keyboard
  focus support and reduced-motion fallbacks.
- **Layered LightRays** - the WebGL ray field runs at full opacity. Soft canvas
  dust is masked to the beam and swells/fades at the end of its life.
- **Compact bevelled buttons** - 32-38 px buttons use restrained gradients and a
  short dot-grid ripple on click. The navbar CTA uses the blue SaaS treatment.
- **Selected work grid** - an editorial masthead, a Showreel feature and ten
  homepage cards with All / Short-form / Long-form / Motion filters, consistent
  framing, lazy hover previews and click-to-lightbox playback.
- **Floating WhatsApp CTA** - a bottom-right green disc with a 3 px black border,
  solid black offset shadow and three custom outlined stars that scale in, rotate
  and break away on a loop. The prefilled chat link is ready for a real number.
- **Animated intro** - three full-width typographic slices slide in from above
  one second apart, merge, then lift away as the site settles in. Runs once per
  session and respects `prefers-reduced-motion`.
- **Dedicated work pages** - seven short-form edits and three long-form cuts,
  each in a lightbox gallery.
- **Showreel lightbox** - the hero card and the showreel feature open with sound
  in the same accessible player.
- **Responsive** from 320 px upward, with a mobile menu, fluid type, no horizontal
  overflow and reduced-motion support.

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
- Navigation styling, the 3-second island transition and the progress arc live in
  `styles.css`. The condensed state, "stay compact until top" behavior and
  `--nav-progress`/SVG offset are handled in `script.js`.
- Update the WhatsApp destination in the three `.whatsapp-fab` links
  (`index.html`, `short-form.html`, `long-form.html`). The current `wa.me` link
  opens WhatsApp with a prefilled message but no fixed recipient.
- Booking logic lives in `script.js` under `Booking calendar`; styles live under
  `.booking` and `.booking-calendar` in `styles.css`. It creates weekday slots
  and builds a `mailto:` request for the selected date/time.
- LightRays is configured with `data-rays-*` attributes on the hero container.
  Particle density, palette and exit fade live in `hero-particles.js`; the beam
  mask is in `styles.css` under `.hero-editorial__particles`.
- Theme colours, work layout, button styling and responsive rules live in
  `styles.css`.
- The homepage selected-work cards live in `#workGrid` inside `index.html`.
  Work-page galleries live in `short-form.html` and `long-form.html`. Each card
  uses `data-src`, `data-poster`, `data-title`, `data-category`,
  `data-duration` and `data-orientation` (`portrait` or `landscape`).

## Notes

- Showreel previews are muted on the page and play with sound in the lightbox.
- No analytics, trackers or external runtime requests.
- Inter is licensed under the SIL Open Font License 1.1. Instrument Serif is also
  SIL OFL 1.1. Clash Display uses the ITF Free Font License. GSAP and ScrollTrigger
  are vendored under the GSAP standard license. Licence notes live beside each
  asset.
