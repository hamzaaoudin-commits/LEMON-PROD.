# 🍋 Lemon Prod — Adaptive Survival Guides (EN / FR / ES)

Static, trilingual SEO site. The runtime is pure HTML / CSS / vanilla JS — no build step at deploy time.
A Node generator (build-guides.mjs) produces every localized page from the content + i18n JSON; you run it
locally, commit the output, and push. Deployable as-is to Vercel and GitHub Pages.

EVERYTHING under index.html, guides/, fr/, es/, sitemap.xml, robots.txt is GENERATED.
Don't edit those by hand — edit the JSON and re-run the generator, or your changes get overwritten.

Edit by hand: styles.css (one design system for the whole site), script.js (mobile nav + scroll reveal),
favicon.svg, og-image.png, vercel.json.

Content sources: guides.json (EN content + structure: slugs, categories, "popular"),
guides.fr.json / guides.es.json (translated profession content), i18n.json (UI strings + category names per locale).

## Languages
Three real, separately-indexable locales — not a JS text-swap.
  EN (default): /            /guides            /guides/lawyer
  FR:           /fr          /fr/guides         /fr/guides/lawyer
  ES:           /es          /es/guides         /es/guides/lawyer
Each page declares hreflang alternates for all three + x-default (EN). The FR·EN·ES switch in the nav links
to the same page in the other language. Slugs are identical across locales; only visible text changes.

## Editing content
1. UI text (nav, hero, FAQ, footer, labels) -> i18n.json, under ui.<locale>.
2. A profession's content -> guides.json (EN) and guides.fr.json / guides.es.json.
3. Regenerate, then commit the regenerated folders:  node build-guides.mjs
Add a profession: add it to a category in guides.json, then add a same-slug entry to the FR and ES files.

## BEFORE PUBLISHING — set your domain
BASE is currently the Vercel URL so indexing can start now:
  // build-guides.mjs
  const BASE = "https://lemon-prod.vercel.app";
When you connect lemonprod.co, change that one line, re-run the generator, and re-push. BASE drives every
canonical, hreflang, OG URL and the sitemap. After it's live on the final domain, submit sitemap.xml in
Google Search Console.

## Deployment
- Vercel: push -> auto-redeploy. cleanUrls serves /fr/guides/lawyer from the folder's index.html.
- GitHub Pages: Settings -> Pages -> Deploy from main / root. Folder URLs resolve natively.

## Still open (deliberately)
- No checkout / product yet. Guide pages end in a mailto: waitlist (zero backend). Swap for a real checkout
  (Lemon Squeezy / Gumroad) once the PDFs exist.
- Testimonials removed. The fabricated ones were dropped rather than translated into 3 languages. Re-add real
  ones (in all three locales) when you have them.
- Legal / Terms / Privacy footer links are # placeholders — required in France once you take payment.

Design: cinematographic dark monolith (#0a0a0a), lemon zest as a sparing accent. Type: Playfair Display ·
DM Sans · JetBrains Mono. The hero lemon is a lightweight animated SVG (no three.js). Responsive,
keyboard-accessible, prefers-reduced-motion respected.

## Update — Case Studies, gated guides, 3D/interactivity

NEW PAGE: /case-studies (+ /fr/case-studies, /es/case-studies). Honest "method applied"
worked examples (no fabricated client names/figures) + a "Your case, next" slot for real
testimonials later. Linked in the nav and in sitemap.xml.

GATED GUIDES: profession pages now keep the free diagnosis (the honest split) as the hook,
but the PRESCRIPTION — the hybrid moves' "how" and the full 90-day plan — is locked. Only the
move TITLES are teased; the plan is a locked module. IMPORTANT: the gated text is NOT emitted
to the HTML at all (no blur-only fake-gate), so it can't be scraped from source. The actual
content still lives in guides*.json for when you build the real paid guide/PDF.

INTERACTIVITY (home only, progressive + graceful fallback):
- Card tilt toward the cursor + gold light that follows the pointer across the hero.
- Jeweller's loupe: hovering the strategy card shows a magnifying lens that follows the cursor.
- 3D faceted gem: a Three.js octahedral "gem" lazy-loaded from the cdnjs CDN, drag to rotate,
  slow auto-spin. Falls back to the SVG aperture on mobile, no-WebGL, or prefers-reduced-motion.
  Three.js is loaded ONLY on the home page, lazily, so the other 80 pages stay light.
All of the above is in script.js and is disabled under prefers-reduced-motion / touch.

NOTE on case studies: each worked example shows ONE sample move as proof of quality (the same
"free sample" logic as the home hero). If you'd rather tease those too, say so and I'll gate them.

## Update — Immersive scrollytelling (v3)

The HOME page is now a scroll-driven experience ("La Taille" — the cutting):
- A persistent 3D stone (Three.js, lazy CDN) lives on a fixed full-screen canvas behind the page.
  Scroll drives it through runtime-computed keyframes anchored to the REAL scene positions
  (locale-proof): raw at the hero -> approaches (Act I) -> huge under the loupe (Act II)
  -> facet ignites (Act III) -> radiant behind the decision/closing -> settles at the footer.
  Drag to rotate at any time.
- The four act intertitles are pinned scenes (position:sticky, 210vh): the title reveals
  word-by-word, the facet mark rotates with scroll (--sp custom property scrubbed in JS),
  and the act dissolves as you scroll past.
- Hero parallax (headline/plaque drift at different speeds, hero fades as you leave it).
- Content sections carry a subtle vertical veil so the stone reads as *behind* the page.

Files: immersive.js (home only; guide pages unchanged), scene CSS block in styles.css.
Fallbacks: touch / <900px / no-WebGL / prefers-reduced-motion => static scenes, no canvas,
no pinning under reduced-motion. script.js's small hero gem is disabled when the stage runs.
NOTE: scroll-behavior:smooth is site-wide; anchor jumps animate through the scenes (nice),
and the 3D keyframes recompute on resize/height changes.
