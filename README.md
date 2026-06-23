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
