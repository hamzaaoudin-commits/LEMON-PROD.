# 🍋 Lemon Prod — Adaptive Survival Guides

Static site for Lemon Prod. Pure HTML / CSS / vanilla JS for the runtime — **no build step at deploy time**.
A small Node generator (`build-guides.mjs`) produces the SEO guide pages from `guides.json`; you run it
locally and commit the output. Deployable as-is to **GitHub Pages** and **Vercel**.

```
lemon-prod/
├── index.html            ← homepage
├── styles.css            ← design system (one stylesheet for the whole site)
├── script.js             ← mobile nav + scroll reveal
├── favicon.svg
├── og-image.png          ← social card (1200×630)
├── robots.txt            ← points crawlers at the sitemap
├── sitemap.xml           ← GENERATED (don't edit by hand)
├── vercel.json
├── guides.json           ← content source for every profession page (edit this)
├── build-guides.mjs      ← generator → writes /guides/** + sitemap.xml
├── guides/
│   ├── index.html        ← hub (all 24 professions) — GENERATED
│   └── <profession>/index.html  ← one SEO page per profession — GENERATED
└── README.md
```

---

## SEO surface (the engine)

Every profession now has its own indexable page at `/guides/<slug>/` — the thing search engines can rank
for queries like "AI strategy lawyer" or "repositioning accountant AI". Each page carries: unique title +
meta description, canonical URL, Open Graph + Twitter cards, `Article` + `BreadcrumbList` JSON-LD, and
internal links (hub ↔ siblings ↔ home). The homepage profession grid links straight into these pages.

### Editing / adding content
1. Edit `guides.json` (intro, the honest split, the hybrid move, the 90-day plan, meta).
2. Run the generator:
   ```bash
   node build-guides.mjs
   ```
3. Commit the regenerated `guides/**` and `sitemap.xml`.

### ⚠️ Before publishing — set your domain
Open `build-guides.mjs` and change one line:
```js
const BASE = "https://lemonprod.co";   // ← your final domain (used in canonical + sitemap + OG)
```
Then re-run the generator. Also update the `canonical` / `og:url` / `og:image` URLs in `index.html` to match.

---

## Deployment

### Vercel (fastest)
Import the repo → Framework **Other**, build command empty, output `.` → Deploy.
`cleanUrls` in `vercel.json` serves `/guides/lawyer/` from `/guides/lawyer/index.html`.

### GitHub Pages
Push, then **Settings → Pages → Deploy from a branch → `main` / `root`.**
Folder-with-`index.html` URLs resolve natively, so `/guides/lawyer/` works without config.

---

## Still open (deliberately not done yet)

- **No checkout / product.** The guide pages end in a `mailto:` waitlist CTA — it captures demand with
  zero backend. Swap it for a real checkout (Lemon Squeezy / Gumroad) once the PDFs exist.
- **Testimonials on the homepage are placeholders** (named people). Replace with real ones before launch —
  invented attributions are the easiest thing for a professional buyer to catch.
- **Legal / Terms / Privacy** footer links are `#` placeholders. Required in France once you take payment.
- **Lead-magnet "free audit" was removed** per request; the waitlist is now the only capture mechanism.

---

*Design: cinematographic dark monolith (#0a0a0a), lemon zest used sparingly as accent. Type: Playfair Display
(display) · DM Sans (text) · JetBrains Mono (labels) — Strawberry's foundations in lemon territory.
Responsive, keyboard-accessible, `prefers-reduced-motion` respected. The hero's floating lemon is a
lightweight animated SVG (the old ~600 KB three.js dependency was removed).*
