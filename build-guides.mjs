#!/usr/bin/env node
/* =========================================================================
   Lemon Prod — multilingual static generator (EN / FR / ES)
   Reads guides.json (EN source + structure), guides.fr.json, guides.es.json
   (translated content), and i18n.json (UI strings). Emits per locale:
     /            /guides/            /guides/<slug>/        (en)
     /fr/         /fr/guides/         /fr/guides/<slug>/     (fr)
     /es/         /es/guides/         /es/guides/<slug>/     (es)
   plus sitemap.xml (with hreflang alternates) and robots.txt.

   No build step at deploy time — run once locally, commit, push:
     node build-guides.mjs
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* >>> CHANGE THIS to your final domain before publishing <<< */
const BASE = "https://lemon-prod.vercel.app";
const CONTACT = "contact@lemonprod.co";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const rd = (f) => JSON.parse(readFileSync(join(ROOT, f), "utf8"));

const data = rd("guides.json");
const i18n = rd("i18n.json");
const CONTENT = { en: null, fr: rd("guides.fr.json"), es: rd("guides.es.json") };
const LOCALES = i18n.locales;
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const firstSentence = (t) => { const m = String(t).match(/^[^.!?]*[.!?]/); return m ? m[0].trim() : String(t); };

/* Flatten jobs with category attached (structure + EN content live in guides.json) */
const jobs = [];
for (const cat of data.categories) for (const job of cat.jobs) jobs.push({ ...job, categoryId: cat.id });

/* Resolve a profession's content for a locale */
function content(slug, loc) {
  if (loc === "en") return jobs.find((j) => j.slug === slug);
  const c = CONTENT[loc][slug];
  const base = jobs.find((j) => j.slug === slug);
  return { ...c, slug, popular: base.popular, categoryId: base.categoryId };
}
function jobTitle(slug, loc) { return content(slug, loc).title; }
function jobFocus(slug, loc) { return loc === "en" ? content(slug, "en").focus : firstSentence(content(slug, "en") && CONTENT[loc][slug].intro); }
function catName(catId, loc) { return i18n.categoryNames[catId][loc]; }
const T = (loc) => i18n.ui[loc];
const fmt = (s, vars) => s.replace(/\{(\w)\}/g, (_, k) => vars[k] ?? "");

/* ---- URL / path helpers (clean, extensionless, root-relative) ---- */
const prefix = (loc) => (loc === "en" ? "" : `/${loc}`);
function path(loc, kind, slug) {
  if (kind === "home") return prefix(loc) || "/";
  if (kind === "hub") return `${prefix(loc)}/guides`;
  if (kind === "cases") return `${prefix(loc)}/case-studies`;
  return `${prefix(loc)}/guides/${slug}`;
}
const url = (loc, kind, slug) => BASE + path(loc, kind, slug);

/* ---- <head> with canonical + hreflang ---- */
function head({ loc, kind, slug, title, description, ogType }) {
  const canonical = url(loc, kind, slug);
  const alts = LOCALES.map((l) => `  <link rel="alternate" hreflang="${i18n.htmlLang[l]}" href="${url(l, kind, slug)}" />`).join("\n");
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="author" content="Lemon Prod" />
  <link rel="canonical" href="${canonical}" />
${alts}
  <link rel="alternate" hreflang="x-default" href="${url("en", kind, slug)}" />

  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${BASE}/og-image.png" />
  <meta property="og:locale" content="${i18n.ogLocale[loc]}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${BASE}/og-image.png" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />`;
}

/* ---- language switch (links to the same page in each locale) ---- */
function langSwitch(loc, kind, slug) {
  const items = LOCALES.map((l) =>
    `<a class="lang__opt${l === loc ? " is-active" : ""}" href="${path(l, kind, slug)}" hreflang="${i18n.htmlLang[l]}"${l === loc ? ' aria-current="true"' : ""}>${i18n.langName[l]}</a>`
  ).join('<span class="lang__sep" aria-hidden="true">·</span>');
  return `<div class="lang" role="group" aria-label="Language">${items}</div>`;
}

const brandSvg = `<svg class="brand__lemon" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="27" fill="none" stroke="#CDA64C" stroke-width="2.4"/>
          <polygon points="32,16 45.9,24 45.9,40 32,48 18.1,40 18.1,24" fill="none" stroke="#E7C97E" stroke-width="2.2"/>
          <circle cx="32" cy="32" r="3.4" fill="#E7C97E"/>
        </svg>`;

function nav(loc, kind, slug) {
  const t = T(loc), p = prefix(loc);
  return `  <header class="nav">
    <div class="wrap nav__inner">
      <a class="brand" href="${p || "/"}" aria-label="Lemon Prod — home">${brandSvg}
        LEMON&nbsp;PROD.
      </a>
      <nav class="nav__links" id="navLinks" aria-label="Primary navigation">
        <a href="${p}/guides">${esc(t.nav_all)}</a>
        <a href="${p}/case-studies">${esc(t.nav_cases)}</a>
        <a href="${p || "/"}#faq">${esc(t.nav_faq)}</a>
        ${langSwitch(loc, kind, slug)}
        <a class="btn btn--primary nav__cta" href="${p}/guides">${esc(t.nav_find)}</a>
      </nav>
      <button class="nav__toggle" id="navToggle" aria-label="${esc(t.open_menu)}" aria-expanded="false" aria-controls="navLinks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </header>`;
}

function footer(loc) {
  const t = T(loc), p = prefix(loc);
  return `  <footer class="foot">
    <div class="wrap">
      <div class="foot__top">
        <div class="foot__brand">
          <a class="brand" href="${p || "/"}" aria-label="Lemon Prod">${brandSvg}
            LEMON&nbsp;PROD.
          </a>
          <p>${esc(t.foot_desc)}</p>
        </div>
        <div class="foot__col">
          <h4>${esc(t.foot_explore)}</h4>
          <a href="${p}/guides">${esc(t.nav_all)}</a>
          <a href="${p || "/"}#collection">${esc(t.foot_how)}</a>
          <a href="${p || "/"}#faq">${esc(t.nav_faq)}</a>
        </div>
        <div class="foot__col">
          <h4>${esc(t.foot_outlook)}</h4>
          <a href="${p}/guides/lawyer">${esc(jobTitle("lawyer", loc))}</a>
          <a href="${p}/guides/real-estate-agent">${esc(jobTitle("real-estate-agent", loc))}</a>
          <a href="${p}/guides/copywriter">${esc(jobTitle("copywriter", loc))}</a>
        </div>
        <div class="foot__col">
          <h4>${esc(t.foot_contact)}</h4>
          <a href="mailto:${CONTACT}">${esc(t.foot_email)}</a>
        </div>
      </div>
      <div class="foot__bottom">
        <small>© ${new Date().getFullYear()} Lemon Prod. ${esc(t.foot_rights)}</small>
        <div class="foot__legal">
          <a href="#">${esc(t.foot_legal)}</a>
          <a href="#">${esc(t.foot_terms)}</a>
          <a href="#">${esc(t.foot_privacy)}</a>
        </div>
      </div>
    </div>
  </footer>`;
}

const lemonSvg = `<svg class="lemon3d" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
            <circle cx="120" cy="120" r="110" fill="none" stroke="#9A7A2E" stroke-width="1" opacity=".45"/>
            <circle cx="120" cy="120" r="94" fill="none" stroke="#E7C97E" stroke-width="1.4" opacity=".9"/>
            <polygon points="120,70 163.3,95 163.3,145 120,170 76.7,145 76.7,95" fill="rgba(205,166,76,.05)" stroke="#CDA64C" stroke-width="1.1" opacity=".75"/>
            <g stroke="#CDA64C" stroke-width=".9" opacity=".55" stroke-linecap="round">
              <path d="M120,70 L120,30 M163.3,95 L197.8,75 M163.3,145 L197.8,165 M120,170 L120,210 M76.7,145 L42.2,165 M76.7,95 L42.2,75"/>
            </g>
            <circle cx="120" cy="120" r="42" fill="none" stroke="#9A7A2E" stroke-width=".7" opacity=".4"/>
            <circle cx="120" cy="120" r="5" fill="#E7C97E"/>
          </svg>`;

/* proto card body built from the localized lawyer content */
function protoBody(loc) {
  const law = content("lawyer", loc), t = T(loc);
  return `<span class="field">${esc(t.proto_f1)}</span>
${esc(law.irreplaceable[0].h)}. ${esc(law.irreplaceable[1].h)}.
${esc(law.irreplaceable[2].h)}.

<span class="field">${esc(t.proto_f2)}</span>
${esc(law.commoditized[0].h)}. ${esc(law.commoditized[1].h)}.
${esc(law.commoditized[2].h)}.

<span class="field">${esc(t.proto_f3)}</span>
<span class="k">${esc(law.hybrid[0].h)}.</span>
${esc(law.hybrid[0].p)}`;
}

/* Narrative helpers: a facet mark + full-width act intertitle */
const facetMark = `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><polygon points="20,3 34,12.5 34,27.5 20,37 6,27.5 6,12.5" stroke="currentColor" stroke-width="1.2"/><path d="M6,12.5 H34 M20,3 V37 M6,12.5 L34,27.5 M34,12.5 L6,27.5" stroke="currentColor" stroke-width=".6" opacity=".5"/></svg>`;

function actCard(loc, n) {
  const t = T(loc);
  const roman = ["I", "II", "III", "IV"][n - 1];
  return `    <section class="scene" data-scene="${n}">
      <div class="scene__pin">
        <div class="act wrap">
          <span class="act__mark" aria-hidden="true">${facetMark}</span>
          <span class="act__n">${esc(t.act_word)} ${roman}</span>
          <h2 class="act__title" data-words>${esc(t["act" + n + "_title"])}</h2>
          <span class="act__rule" aria-hidden="true"></span>
          <p class="act__line">${esc(t["act" + n + "_line"])}</p>
        </div>
      </div>
    </section>`;
}

/* ----------------------------- HOMEPAGE ----------------------------- */
function homePage(loc) {
  const t = T(loc), p = prefix(loc);
  const cats = data.categories.map((cat) => ({
    id: cat.id, name: catName(cat.id, loc),
    jobs: cat.jobs.map((j) => ({ slug: j.slug, title: jobTitle(j.slug, loc), popular: !!j.popular, focus: jobFocus(j.slug, loc), href: path(loc, "guide", j.slug) })),
  }));

  const marq = [t.marq_1, t.marq_2, t.marq_3, t.marq_4, t.marq_5].map((m) => `<span>${esc(m)}</span>`).join("");
  const faqItems = [1,2,3,4,5,6,7].map((n) => `        <details>
          <summary>${esc(t["faq_q"+n])}<span class="plus" aria-hidden="true"></span></summary>
          <p class="faq__a">${esc(t["faq_a"+n])}</p>
        </details>`).join("\n");

  return `<!DOCTYPE html>
<html lang="${i18n.htmlLang[loc]}">
<head>
${head({ loc, kind: "home", title: t.home_title, description: t.home_desc, ogType: "website" })}
  <script type="application/ld+json">
${JSON.stringify({ "@context":"https://schema.org","@type":"Organization", name:"Lemon Prod", url: BASE + "/", email: CONTACT, description: t.foot_desc }, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">${esc(t.skip)}</a>
${nav(loc, "home", null)}

  <main id="main">
    <div id="stage3d" aria-hidden="true"></div>
    <section class="hero wrap" id="home">
      <span class="hero__light" id="heroLight" aria-hidden="true"></span>
      <div class="hero__grid">
        <div>
          <span class="eyebrow enter" style="--d:.05s">${esc(t.hero_eyebrow)}</span>
          <h1>
            <span class="line"><span style="--d:.15s">${esc(t.hero_l1)}</span></span>
            <span class="line"><span style="--d:.27s">${esc(t.hero_l2)}</span></span>
            <span class="line"><span class="ital zest" style="--d:.4s">${esc(t.hero_l3)}</span></span>
          </h1>
          <p class="lede enter" style="--d:.6s">${esc(t.hero_lede)}</p>
          <div class="hero__cta enter" style="--d:.72s">
            <a class="btn btn--primary" href="#collection">${esc(t.hero_cta_find)}</a>
            <a class="btn btn--ghost" href="${p}/guides">${esc(t.hero_cta_browse)}</a>
          </div>
          <div class="hero__trust enter" style="--d:.84s">
            <span>${esc(t.trust_1)}</span><span>${esc(t.trust_2)}</span><span>${esc(t.trust_3)}</span><span>${esc(t.trust_4)}</span>
          </div>
        </div>
        <div class="enter proto3d" style="--d:.5s" id="protoWrap" data-tilt>
          <div class="gem3d" id="gem3d" aria-hidden="true">${lemonSvg}</div>
          <figure class="plaque" id="protoCard" aria-label="${esc(jobTitle("lawyer", loc))}">
            <div class="plaque__top">
              <span class="plaque__mark" aria-hidden="true">${facetMark}</span>
              <span class="plaque__cartel">Adaptive Survival — ${esc(jobTitle("lawyer", loc))}</span>
            </div>
            <div class="plaque__body">
              <div class="plaque__row">
                <span class="plaque__label">${esc(t.g_keep)}</span>
                <p>${esc(content("lawyer", loc).irreplaceable.map((x) => x.h).join("  ·  "))}</p>
              </div>
              <div class="plaque__row">
                <span class="plaque__label">${esc(t.g_lose)}</span>
                <p>${esc(content("lawyer", loc).commoditized.map((x) => x.h).join("  ·  "))}</p>
              </div>
              <div class="plaque__row plaque__row--accent">
                <span class="plaque__label">${esc(t.g_hybrid_eyebrow)}</span>
                <p class="plaque__accent">${esc(content("lawyer", loc).hybrid[0].h)}.</p>
              </div>
            </div>
            <div class="plaque__foot">
              <a class="plaque__link" href="${p}/guides/lawyer">${esc(t.proto_read)}</a>
              <span class="plaque__seal" aria-hidden="true">${facetMark}</span>
            </div>
          </figure>
        </div>
      </div>
    </section>


${actCard(loc, 1)}

    <section class="section wrap act-section">
      <div class="reveal">
        <span class="eyebrow">${esc(t.prob_eyebrow)}</span>
        <h2 class="display prob__head">${esc(t.prob_head_a)}<b>${esc(t.prob_head_b)}</b></h2>
        <p class="lede prob__lede">${esc(t.prob_lede)}</p>
      </div>
      <p class="prob__quote reveal">${esc(t.prob_quote_a)}<br><span>${esc(t.prob_quote_b)}</span></p>
      <div class="prob__cards reveal">
        <div class="pcard"><div class="pcard__n">01</div><p>${esc(t.prob_c1)}</p></div>
        <div class="pcard"><div class="pcard__n">02</div><p>${esc(t.prob_c2)}</p></div>
        <div class="pcard"><div class="pcard__n">03</div><p>${esc(t.prob_c3)}</p></div>
      </div>
      <p class="prob__authority reveal">${esc(t.prob_authority)}</p>
    </section>

${actCard(loc, 2)}

    <section class="section" id="collection">
      <div class="wrap">
        <div class="reveal coll__head">
          <span class="eyebrow">${esc(t.coll_eyebrow)}</span>
          <h2 class="display">${esc(t.coll_head)}</h2>
          <p class="lede coll__intro">${esc(t.coll_intro)}</p>
        </div>
        <div class="toc reveal">
          <div class="toc__row"><div class="toc__n">01</div><div class="toc__main"><h3>${esc(t.toc_1h)}</h3><p>${esc(t.toc_1p)}</p></div></div>
          <div class="toc__row"><div class="toc__n">02</div><div class="toc__main"><h3>${esc(t.toc_2h)}</h3><p>${esc(t.toc_2p)}</p></div></div>
          <div class="toc__row"><div class="toc__n">03</div><div class="toc__main"><h3>${esc(t.toc_3h)}</h3><p>${esc(t.toc_3p)}</p></div></div>
          <div class="toc__row"><div class="toc__n">04</div><div class="toc__main"><h3>${esc(t.toc_4h)}</h3><p>${esc(t.toc_4p)}</p></div></div>
          <div class="toc__row"><div class="toc__n">05</div><div class="toc__main"><h3>${esc(t.toc_5h)}</h3><p>${esc(t.toc_5p)}</p></div></div>
        </div>
        <div class="proof reveal">
          <div class="proof__stat"><s>${esc(t.proof_a)}</s> → <b>${esc(t.proof_b)}</b></div>
          <p class="proof__label">${esc(t.proof_label)}</p>
        </div>
        <div class="reveal" style="margin-top:4.5rem" id="professions">
          <span class="eyebrow">${esc(t.prof_eyebrow)}</span>
          <h2 class="display">${esc(t.prof_head)}</h2>
          <p class="lede" id="catBackWrap" style="display:none;margin-top:.6rem">
            <button class="btn btn--ghost" id="catBackBtn" type="button">${esc(t.prof_back)}</button>
          </p>
        </div>
        <div class="metiers reveal" id="categoryGrid"></div>
        <div class="metiers metiers--jobs reveal" id="jobGrid" style="display:none"></div>
      </div>
    </section>

${actCard(loc, 3)}

    <section class="section wrap act-section proofstrip">
      <div class="reveal">
        <h2 class="display">${esc(t.cases_head)}</h2>
        <div class="proofstrip__chips">
          <span>${esc(jobTitle("lawyer", loc))}</span>
          <span>${esc(jobTitle("copywriter", loc))}</span>
          <span>${esc(jobTitle("real-estate-agent", loc))}</span>
        </div>
        <a class="btn btn--primary" href="${p}/case-studies">${esc(t.proof_cta)}</a>
      </div>
    </section>

${actCard(loc, 4)}

    <section class="section wrap section--tight">
      <div class="reveal" style="margin-bottom:2.8rem">
        <span class="eyebrow">${esc(t.doc_eyebrow)}</span>
        <h2 class="display">${esc(t.doc_head)}</h2>
      </div>
      <div class="doctrine reveal">
        <div class="dcard"><div class="dcard__n">01</div><h3>${esc(t.doc_1h)}</h3><p>${esc(t.doc_1p)}</p></div>
        <div class="dcard"><div class="dcard__n">02</div><h3>${esc(t.doc_2h)}</h3><p>${esc(t.doc_2p)}</p></div>
        <div class="dcard"><div class="dcard__n">03</div><h3>${esc(t.doc_3h)}</h3><p>${esc(t.doc_3p)}</p></div>
      </div>
    </section>

    <section class="section wrap closing">
      <p class="closing__kicker reveal">${esc(t.close_kicker)}</p>
      <h2 class="display reveal">${esc(t.close_l1)}<br>${esc(t.close_l2)}</h2>
      <p class="closing__res reveal">${esc(t.close_res)}</p>
      <div class="closing__cta reveal">
        <a class="btn btn--primary" href="#collection">${esc(t.hero_cta_find)}</a>
        <a class="btn btn--ghost" href="${p}/guides">${esc(t.hero_cta_browse)}</a>
      </div>
    </section>

    <section class="section divider wrap" id="faq">
      <div class="faq__head reveal">
        <span class="eyebrow">${esc(t.faq_eyebrow)}</span>
        <h2 class="display">${esc(t.faq_head)}</h2>
      </div>
      <div class="faq__list faq reveal">
${faqItems}
      </div>
    </section>
  </main>

${footer(loc)}

  <script>
    const CATEGORIES = ${JSON.stringify(cats)};
    const L = { one: ${JSON.stringify(t.guide_one)}, many: ${JSON.stringify(t.guide_many)}, most: ${JSON.stringify(t.most_read)} };
    const categoryGrid = document.getElementById("categoryGrid");
    const jobGrid = document.getElementById("jobGrid");
    const catBackWrap = document.getElementById("catBackWrap");
    const catBackBtn = document.getElementById("catBackBtn");
    function renderCategories(){
      categoryGrid.innerHTML = CATEGORIES.map(cat => \`
        <div class="metier" data-cat="\${cat.id}" role="button" tabindex="0" aria-label="\${cat.name}">
          <div class="metier__count">\${cat.jobs.length} \${cat.jobs.length>1?L.many:L.one}</div>
          <h3>\${cat.name}</h3>
        </div>\`).join("");
    }
    function renderJobs(catId){
      const cat = CATEGORIES.find(c=>c.id===catId); if(!cat) return;
      jobGrid.innerHTML = cat.jobs.map(job => \`
        <a class="metier \${job.popular?"metier--pop":""}" href="\${job.href}" aria-label="\${job.title}">
          \${job.popular?'<span class="metier__pop">'+L.most+'</span>':""}
          <h3>\${job.title}</h3>
          <p class="metier__focus">\${job.focus}</p>
        </a>\`).join("");
      categoryGrid.style.display="none"; jobGrid.style.display="grid"; catBackWrap.style.display="block";
      document.getElementById("professions").scrollIntoView({behavior:"smooth",block:"start"});
    }
    function showCategories(){
      jobGrid.style.display="none"; categoryGrid.style.display="grid"; catBackWrap.style.display="none";
      document.getElementById("professions").scrollIntoView({behavior:"smooth",block:"start"});
    }
    renderCategories();
    categoryGrid.addEventListener("click",e=>{const c=e.target.closest(".metier"); if(c) renderJobs(c.dataset.cat);});
    categoryGrid.addEventListener("keydown",e=>{ if(e.key!=="Enter"&&e.key!==" ")return; const c=e.target.closest(".metier"); if(!c)return; e.preventDefault(); renderJobs(c.dataset.cat);});
    catBackBtn.addEventListener("click", showCategories);
  </script>
  <script src="/script.js"></script>
  <script src="/immersive.js" defer></script>
</body>
</html>
`;
}

/* ----------------------------- GUIDE PAGE ----------------------------- */
function guidePage(slug, loc) {
  const t = T(loc), p = prefix(loc);
  const j = content(slug, loc);
  const title = jobTitle(slug, loc);
  const catId = j.categoryId;
  const cat = data.categories.find((c) => c.id === catId);
  const siblings = cat.jobs.filter((s) => s.slug !== slug);
  const mail = `mailto:${CONTACT}?subject=${encodeURIComponent(fmt(t.mail_subject, { t: title }))}&body=${encodeURIComponent(fmt(t.mail_body, { t: title }))}`;

  const jsonld = { "@context":"https://schema.org","@graph":[
    { "@type":"BreadcrumbList", itemListElement:[
      { "@type":"ListItem", position:1, name:t.crumb_home, item:url(loc,"home") },
      { "@type":"ListItem", position:2, name:t.crumb_guides, item:url(loc,"hub") },
      { "@type":"ListItem", position:3, name:title, item:url(loc,"guide",slug) } ]},
    { "@type":"Article", headline:j.metaTitle, description:j.metaDescription, inLanguage:i18n.htmlLang[loc],
      datePublished:BUILD_DATE, dateModified:BUILD_DATE,
      author:{ "@type":"Organization", name:"Lemon Prod" }, publisher:{ "@type":"Organization", name:"Lemon Prod" },
      mainEntityOfPage:url(loc,"guide",slug) } ]};

  const splitItem = (it) => `        <div class="split__item"><h3>${esc(it.h)}</h3><p>${esc(it.p)}</p></div>`;
  const hcard = (it,i) => `        <div class="hcard"><div class="hcard__n">${String(i+1).padStart(2,"0")}</div><h3>${esc(it.h)}</h3><p>${esc(it.p)}</p></div>`;
  const planItem = (s,i) => `          <li><span class="plan__n">${String(i+1).padStart(2,"0")}</span><span>${esc(s)}</span></li>`;
  const sib = (s) => `        <a class="rel__card" href="${p}/guides/${s.slug}">
          <span class="rel__focus">${esc(jobFocus(s.slug, loc))}</span>
          <h3>${esc(jobTitle(s.slug, loc))}</h3>
          <span class="rel__go">${esc(t.g_read)}</span>
        </a>`;

  return `<!DOCTYPE html>
<html lang="${i18n.htmlLang[loc]}">
<head>
${head({ loc, kind:"guide", slug, title:j.metaTitle, description:j.metaDescription, ogType:"article" })}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">${esc(t.skip)}</a>
${nav(loc, "guide", slug)}

  <main id="main">
    <article class="section wrap guide">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${p || "/"}">${esc(t.crumb_home)}</a><span aria-hidden="true">/</span>
        <a href="${p}/guides">${esc(t.crumb_guides)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(title)}</span>
      </nav>
      <header class="guide__head">
        <span class="eyebrow">${esc(catName(catId, loc))} · ${esc(t.g_outlook_suffix)}</span>
        <h1 class="display">${esc(fmt(t.g_ai_the, { t: title }))}</h1>
        <p class="lede guide__intro">${esc(j.intro)}</p>
      </header>

      <section class="split" aria-label="${esc(t.g_keep)} / ${esc(t.g_lose)}">
        <div class="split__col split__col--keep">
          <span class="split__label">${esc(t.g_keep)}</span>
${j.irreplaceable.map(splitItem).join("\n")}
        </div>
        <div class="split__col split__col--lose">
          <span class="split__label">${esc(t.g_lose)}</span>
${j.commoditized.map(splitItem).join("\n")}
        </div>
      </section>

      <section class="vault" aria-label="${esc(t.vault_eyebrow)}">
        <span class="eyebrow">${esc(t.vault_eyebrow)}</span>
        <h2 class="display">${esc(fmt(t.vault_head, { t: title }))}</h2>
        <p class="lede vault__intro">${esc(t.vault_intro)}</p>
        <div class="vault__grid">
${j.hybrid.map((h) => `          <div class="vault__item"><span class="vault__d" aria-hidden="true">◆</span><div><h3>${esc(h.h)}</h3><span class="vault__lock">${esc(t.vault_locked)}</span></div></div>`).join("\n")}
          <div class="vault__item"><span class="vault__d" aria-hidden="true">◆</span><div><h3>${esc(t.vault_plan_title)}</h3><span class="vault__lock">${esc(t.vault_locked)}</span></div></div>
        </div>
        <div class="locked">
          <div class="locked__preview" aria-hidden="true">
            <span class="locked__pn">01</span><span class="locked__bar" style="width:78%"></span>
            <span class="locked__pn">02</span><span class="locked__bar" style="width:63%"></span>
            <span class="locked__pn">03</span><span class="locked__bar" style="width:84%"></span>
            <span class="locked__pn">04</span><span class="locked__bar" style="width:55%"></span>
          </div>
          <div class="locked__veil">
            <svg class="locked__ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="32,14 47.6,23 47.6,41 32,50 16.4,41 16.4,23" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="32" cy="32" r="3" fill="currentColor"/></svg>
            <p class="locked__note">${esc(t.vault_unlock_note)}</p>
            <a class="btn btn--primary" href="${mail}">${esc(t.g_notify)}</a>
            <span class="waitlist__fine">${esc(t.g_fine)}</span>
          </div>
        </div>
        <p class="guide__close">${esc(j.close)}</p>
      </section>

      <section class="waitlist">
        <div>
          <span class="eyebrow">${esc(t.g_full_eyebrow)}</span>
          <h2>${esc(fmt(t.g_full_head, { t: title }))}</h2>
          <p>${esc(t.g_full_body)}</p>
        </div>
        <div class="waitlist__cta">
          <a class="btn btn--primary" href="${mail}">${esc(t.g_notify)}</a>
          <span class="waitlist__fine">${esc(t.g_fine)}</span>
        </div>
      </section>

      <section class="rel">
        <span class="eyebrow">${esc(fmt(t.g_more, { c: catName(catId, loc) }))}</span>
        <div class="rel__grid">
${siblings.map(sib).join("\n")}
        </div>
        <p class="rel__all"><a href="${p}/guides">${esc(fmt(t.g_browse_all, { n: jobs.length }))}</a></p>
      </section>
    </article>
  </main>

${footer(loc)}
  <script src="/script.js"></script>
</body>
</html>
`;
}

/* ----------------------------- CASE STUDIES ----------------------------- */
function caseStudiesPage(loc) {
  const t = T(loc), p = prefix(loc);
  const demoSlugs = ["lawyer", "copywriter", "real-estate-agent"];
  const casesMail = `mailto:${CONTACT}?subject=${encodeURIComponent(loc === "fr" ? "Devenir un cas d'étude — Lemon Prod" : loc === "es" ? "Convertirme en un caso — Lemon Prod" : "Become a case study — Lemon Prod")}`;

  const caseBlock = (slug, i) => {
    const c = content(slug, loc);
    const title = jobTitle(slug, loc);
    const facet = c.irreplaceable[0], move = c.hybrid[0];
    return `      <article class="case${i % 2 ? " case--alt" : ""}">
        <div class="case__head">
          <div class="case__meta"><span class="case__tag">${esc(t.cases_demo_tag)}</span><span class="case__n">N°${String(i + 1).padStart(2, "0")}</span></div>
          <h2 class="case__title">${esc(title)}</h2>
          <p class="case__situation"><span class="case__label">${esc(t.cases_situation)}</span>${esc(c.intro)}</p>
        </div>
        <div class="case__cols">
          <div class="case__col case__col--facet">
            <span class="case__label">${esc(t.cases_facet)}</span>
            <h3>${esc(facet.h)}</h3><p>${esc(facet.p)}</p>
          </div>
          <div class="case__col">
            <span class="case__label">${esc(t.cases_move)}</span>
            <h3>${esc(move.h)}</h3><p>${esc(move.p)}</p>
          </div>
        </div>
        <a class="case__link" href="${p}/guides/${slug}">${esc(t.cases_view)} →</a>
      </article>`;
  };

  const jsonld = { "@context":"https://schema.org","@type":"WebPage", name:t.cases_head, description:t.cases_desc, url:url(loc,"cases"), inLanguage:i18n.htmlLang[loc] };

  return `<!DOCTYPE html>
<html lang="${i18n.htmlLang[loc]}">
<head>
${head({ loc, kind:"cases", title:t.cases_title, description:t.cases_desc, ogType:"website" })}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">${esc(t.skip)}</a>
${nav(loc, "cases", null)}

  <main id="main">
    <section class="section wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${p || "/"}">${esc(t.crumb_home)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(t.cases_eyebrow)}</span>
      </nav>
      <header class="cases__head">
        <span class="eyebrow">${esc(t.cases_eyebrow)}</span>
        <h1 class="display">${esc(t.cases_head)}</h1>
        <p class="lede">${esc(t.cases_lede)}</p>
      </header>

      <div class="cases__list">
${demoSlugs.map(caseBlock).join("\n")}
      </div>

      <section class="cases__real">
        <span class="eyebrow">${esc(t.cases_real_eyebrow)}</span>
        <h2 class="display">${esc(t.cases_real_head)}</h2>
        <p class="lede">${esc(t.cases_real_note)}</p>
        <a class="btn btn--primary" href="${casesMail}">${esc(t.cases_cta)}</a>
      </section>
    </section>
  </main>

${footer(loc)}
  <script src="/script.js"></script>
</body>
</html>
`;
}

/* ----------------------------- HUB ----------------------------- */
function hubPage(loc) {
  const t = T(loc), p = prefix(loc);
  const catBlock = (cat) => {
    const cards = cat.jobs.map((j) => `          <a class="hub__card${j.popular ? " hub__card--pop" : ""}" href="${p}/guides/${j.slug}">
            ${j.popular ? `<span class="hub__pop">${esc(t.most_read)}</span>` : ""}
            <h3>${esc(jobTitle(j.slug, loc))}</h3>
            <p>${esc(jobFocus(j.slug, loc))}</p>
            <span class="hub__go">${esc(t.g_read)}</span>
          </a>`).join("\n");
    return `      <section class="hub__cat">
        <h2 class="hub__catname">${esc(catName(cat.id, loc))}</h2>
        <div class="hub__grid">
${cards}
        </div>
      </section>`;
  };
  const jsonld = { "@context":"https://schema.org","@type":"CollectionPage", name:"Adaptive Survival Guides",
    description:t.hub_desc, url:url(loc,"hub"), inLanguage:i18n.htmlLang[loc],
    hasPart: jobs.map((j) => ({ "@type":"Article", headline: content(j.slug, loc).metaTitle, url: url(loc,"guide",j.slug) })) };

  return `<!DOCTYPE html>
<html lang="${i18n.htmlLang[loc]}">
<head>
${head({ loc, kind:"hub", title:t.hub_title, description:t.hub_desc, ogType:"website" })}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body>
  <a class="skip" href="#main">${esc(t.skip)}</a>
${nav(loc, "hub", null)}

  <main id="main">
    <section class="section wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${p || "/"}">${esc(t.crumb_home)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(t.crumb_guides)}</span>
      </nav>
      <header class="hub__head">
        <span class="eyebrow">${esc(t.prof_eyebrow)}</span>
        <h1 class="display">${esc(t.hub_head)}</h1>
        <p class="lede">${esc(t.hub_lede)}</p>
      </header>
${data.categories.map(catBlock).join("\n")}
    </section>
  </main>

${footer(loc)}
  <script src="/script.js"></script>
</body>
</html>
`;
}

/* ----------------------------- SITEMAP ----------------------------- */
function sitemap() {
  const entries = [];
  for (const loc of LOCALES) {
    entries.push({ loc, kind: "home" });
    entries.push({ loc, kind: "hub" });
    entries.push({ loc, kind: "cases" });
    for (const j of jobs) entries.push({ loc, kind: "guide", slug: j.slug });
  }
  const body = entries.map((e) => {
    const alts = LOCALES.map((l) => `      <xhtml:link rel="alternate" hreflang="${i18n.htmlLang[l]}" href="${url(l, e.kind, e.slug)}"/>`).join("\n");
    return `  <url>\n    <loc>${url(e.loc, e.kind, e.slug)}</loc>\n${alts}\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}

/* ----------------------------- WRITE ----------------------------- */
function write(rel, content) {
  const full = join(ROOT, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

let count = 0;
for (const loc of LOCALES) {
  const pdir = loc === "en" ? "" : `${loc}/`;
  write(`${pdir}index.html`, homePage(loc));
  write(`${pdir}guides/index.html`, hubPage(loc));
  write(`${pdir}case-studies/index.html`, caseStudiesPage(loc));
  for (const j of jobs) { write(`${pdir}guides/${j.slug}/index.html`, guidePage(j.slug, loc)); count++; }
}
write("sitemap.xml", sitemap());
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);

console.log(`Done. ${LOCALES.length} locales × (home + hub + ${jobs.length} guides) = ${LOCALES.length * (2 + jobs.length)} pages.`);
console.log(`Base URL: ${BASE}`);
