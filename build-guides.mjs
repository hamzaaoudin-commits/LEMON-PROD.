#!/usr/bin/env node
/* =========================================================================
   Lemon Prod — guide page generator
   Reads guides.json, emits static SEO pages under /guides/<slug>/index.html,
   the /guides/ hub, and sitemap.xml. No build step at deploy time — run this
   locally once, commit the output, push.

   Usage:  node build-guides.mjs
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* >>> CHANGE THIS to your final domain before publishing <<< */
const BASE = "https://lemonprod.co";
const CONTACT = "contact@lemonprod.co";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const data = JSON.parse(readFileSync(join(ROOT, "guides.json"), "utf8"));
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* Flatten jobs with their category attached */
const jobs = [];
for (const cat of data.categories) {
  for (const job of cat.jobs) {
    jobs.push({ ...job, categoryId: cat.id, categoryName: cat.name, icon: cat.icon });
  }
}
const jobBySlug = Object.fromEntries(jobs.map((j) => [j.slug, j]));

/* ---------- Shared <head> fragment ---------- */
function head({ title, description, canonical, ogType, relRoot }) {
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="author" content="Lemon Prod" />
  <link rel="canonical" href="${esc(canonical)}" />

  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${BASE}/og-image.png" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${BASE}/og-image.png" />

  <link rel="icon" type="image/svg+xml" href="${relRoot}favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${relRoot}styles.css" />`;
}

/* ---------- Shared nav (relRoot points at site root) ---------- */
function nav(relRoot) {
  return `  <header class="nav">
    <div class="wrap nav__inner">
      <a class="brand" href="${relRoot}index.html" aria-label="Lemon Prod — home">
        <svg class="brand__lemon" viewBox="0 0 64 64" aria-hidden="true">
          <ellipse cx="32" cy="33" rx="17" ry="20" fill="#EFC52B"/>
          <path d="M32 13c1.6 0 3 .2 3 .2l-1.4 4.6a6 6 0 0 0-3.2 0L29 13.2s1.4-.2 3-.2z" fill="#2C7A2C"/>
        </svg>
        LEMON&nbsp;PROD.
      </a>
      <nav class="nav__links" id="navLinks" aria-label="Primary navigation">
        <a href="${relRoot}guides/index.html">All guides</a>
        <a href="${relRoot}index.html#faq">FAQ</a>
        <a class="btn btn--primary nav__cta" href="${relRoot}guides/index.html">Find your guide</a>
      </nav>
      <button class="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </header>`;
}

/* ---------- Shared footer ---------- */
function footer(relRoot) {
  return `  <footer class="foot">
    <div class="wrap">
      <div class="foot__top">
        <div class="foot__brand">
          <a class="brand" href="${relRoot}index.html" aria-label="Lemon Prod">
            <svg class="brand__lemon" viewBox="0 0 64 64" aria-hidden="true">
              <ellipse cx="32" cy="33" rx="17" ry="20" fill="#EFC52B"/>
              <path d="M32 13c1.6 0 3 .2 3 .2l-1.4 4.6a6 6 0 0 0-3.2 0L29 13.2s1.4-.2 3-.2z" fill="#2C7A2C"/>
            </svg>
            LEMON&nbsp;PROD.
          </a>
          <p>Adaptive Survival Guides — strategic career guides for professionals who'd rather reposition than react to automation.</p>
        </div>
        <div class="foot__col">
          <h4>Explore</h4>
          <a href="${relRoot}guides/index.html">All guides</a>
          <a href="${relRoot}index.html#collection">How it works</a>
          <a href="${relRoot}index.html#faq">FAQ</a>
        </div>
        <div class="foot__col">
          <h4>Outlook</h4>
          <a href="${relRoot}guides/lawyer/index.html">Lawyer</a>
          <a href="${relRoot}guides/real-estate-agent/index.html">Real Estate Agent</a>
          <a href="${relRoot}guides/copywriter/index.html">Copywriter</a>
        </div>
        <div class="foot__col">
          <h4>Contact</h4>
          <a href="mailto:${CONTACT}">Email</a>
        </div>
      </div>
      <div class="foot__bottom">
        <small>© ${new Date().getFullYear()} Lemon Prod. All rights reserved.</small>
        <div class="foot__legal">
          <a href="#">Legal</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
      </div>
    </div>
  </footer>`;
}

/* ---------- One profession page ---------- */
function guidePage(job) {
  const relRoot = "../../";
  const canonical = `${BASE}/guides/${job.slug}/`;
  const siblings = jobs.filter((j) => j.categoryId === job.categoryId && j.slug !== job.slug);

  const waitlistHref =
    `mailto:${CONTACT}` +
    `?subject=${encodeURIComponent(`Waitlist — ${job.title} guide`)}` +
    `&body=${encodeURIComponent(`I'd like to be notified when the Adaptive Survival Guide for ${job.title} is ready.`)}`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE}/guides/` },
          { "@type": "ListItem", position: 3, name: job.title, item: canonical },
        ],
      },
      {
        "@type": "Article",
        headline: job.metaTitle,
        description: job.metaDescription,
        inLanguage: "en",
        datePublished: BUILD_DATE,
        dateModified: BUILD_DATE,
        author: { "@type": "Organization", name: "Lemon Prod" },
        publisher: { "@type": "Organization", name: "Lemon Prod" },
        mainEntityOfPage: canonical,
        about: `AI and the future of the ${job.title} profession`,
      },
    ],
  };

  const splitItem = (it) => `        <div class="split__item">
          <h3>${esc(it.h)}</h3>
          <p>${esc(it.p)}</p>
        </div>`;

  const hybridItem = (it, i) => `        <div class="hcard">
          <div class="hcard__n">${String(i + 1).padStart(2, "0")}</div>
          <h3>${esc(it.h)}</h3>
          <p>${esc(it.p)}</p>
        </div>`;

  const planItem = (p, i) => `          <li><span class="plan__n">${String(i + 1).padStart(2, "0")}</span><span>${esc(p)}</span></li>`;

  const siblingCard = (s) => `        <a class="rel__card" href="${relRoot}guides/${s.slug}/index.html">
          <span class="rel__focus">${esc(s.focus)}</span>
          <h3>${esc(s.title)}</h3>
          <span class="rel__go">Read the outlook →</span>
        </a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title: job.metaTitle, description: job.metaDescription, canonical, ogType: "article", relRoot })}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
${nav(relRoot)}

  <main id="main">
    <article class="section wrap guide">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${relRoot}index.html">Home</a>
        <span aria-hidden="true">/</span>
        <a href="${relRoot}guides/index.html">Guides</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(job.title)}</span>
      </nav>

      <header class="guide__head">
        <span class="eyebrow">${job.icon} ${esc(job.categoryName)} · Adaptive Survival Outlook</span>
        <h1 class="display">AI &amp; the ${esc(job.title)}.</h1>
        <p class="lede guide__intro">${esc(job.intro)}</p>
      </header>

      <section class="split" aria-label="The honest split">
        <div class="split__col split__col--keep">
          <span class="split__label">What stays irreplaceable</span>
${job.irreplaceable.map(splitItem).join("\n")}
        </div>
        <div class="split__col split__col--lose">
          <span class="split__label">What AI absorbs now</span>
${job.commoditized.map(splitItem).join("\n")}
        </div>
      </section>

      <section class="guide__block">
        <span class="eyebrow">The hybrid move</span>
        <h2 class="display">Where to stand instead.</h2>
        <div class="hybrid">
${job.hybrid.map(hybridItem).join("\n")}
        </div>
      </section>

      <section class="guide__block">
        <span class="eyebrow">The 90-day plan</span>
        <h2 class="display">Start this quarter.</h2>
        <ol class="plan">
${job.plan.map(planItem).join("\n")}
        </ol>
        <p class="guide__close">${esc(job.close)}</p>
      </section>

      <section class="waitlist">
        <div>
          <span class="eyebrow">The full guide</span>
          <h2>The complete ${esc(job.title)} guide is in production.</h2>
          <p>This is the outlook. The full guide goes deeper: the task-by-task split, the repricing model, and the moves professionals are making right now. Get notified the day it's ready.</p>
        </div>
        <div class="waitlist__cta">
          <a class="btn btn--primary" href="${waitlistHref}">Notify me →</a>
          <span class="waitlist__fine">One email when it ships. Nothing else.</span>
        </div>
      </section>

      <section class="rel">
        <span class="eyebrow">More in ${esc(job.categoryName)}</span>
        <div class="rel__grid">
${siblings.map(siblingCard).join("\n")}
        </div>
        <p class="rel__all"><a href="${relRoot}guides/index.html">← Browse all ${jobs.length} professions</a></p>
      </section>
    </article>
  </main>

${footer(relRoot)}
  <script src="${relRoot}script.js"></script>
</body>
</html>
`;
}

/* ---------- Hub page ---------- */
function hubPage() {
  const relRoot = "../";
  const canonical = `${BASE}/guides/`;
  const title = "Adaptive Survival Guides — One Outlook Per Profession · Lemon Prod";
  const description =
    "Browse strategic AI-survival outlooks by profession: what's being commoditized in your exact role, what stays irreplaceable, and a 90-day plan to reposition.";

  const catBlock = (cat) => {
    const cards = cat.jobs
      .map(
        (j) => `          <a class="hub__card${j.popular ? " hub__card--pop" : ""}" href="${j.slug}/index.html">
            ${j.popular ? '<span class="hub__pop">Most read</span>' : ""}
            <h3>${esc(j.title)}</h3>
            <p>${esc(j.focus)}</p>
            <span class="hub__go">Read the outlook →</span>
          </a>`
      )
      .join("\n");
    return `      <section class="hub__cat">
        <h2 class="hub__catname">${cat.icon} ${esc(cat.name)}</h2>
        <div class="hub__grid">
${cards}
        </div>
      </section>`;
  };

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Adaptive Survival Guides",
    description,
    url: canonical,
    inLanguage: "en",
    hasPart: jobs.map((j) => ({
      "@type": "Article",
      headline: j.metaTitle,
      url: `${BASE}/guides/${j.slug}/`,
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title, description, canonical, ogType: "website", relRoot })}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
${nav(relRoot)}

  <main id="main">
    <section class="section wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${relRoot}index.html">Home</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Guides</span>
      </nav>
      <header class="hub__head">
        <span class="eyebrow">${jobs.length} professions</span>
        <h1 class="display">One outlook. Your exact profession.</h1>
        <p class="lede">Pick your role. Each outlook maps what AI already does better, what stays scarce in your judgment, and the first moves to reposition — a free read ahead of the full guide.</p>
      </header>
${data.categories.map(catBlock).join("\n")}
    </section>
  </main>

${footer(relRoot)}
  <script src="${relRoot}script.js"></script>
</body>
</html>
`;
}

/* ---------- Sitemap ---------- */
function sitemap() {
  const urls = [
    { loc: `${BASE}/`, pri: "1.0" },
    { loc: `${BASE}/guides/`, pri: "0.9" },
    ...jobs.map((j) => ({ loc: `${BASE}/guides/${j.slug}/`, pri: "0.8" })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/* ---------- Write everything ---------- */
function write(path, content) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log("  ✓", path);
}

console.log("Generating guide pages…");
for (const job of jobs) write(`guides/${job.slug}/index.html`, guidePage(job));
write("guides/index.html", hubPage());
write("sitemap.xml", sitemap());
console.log(`\nDone — ${jobs.length} profession pages + hub + sitemap.`);
console.log(`Base URL: ${BASE}  (edit BASE in build-guides.mjs to change)`);
