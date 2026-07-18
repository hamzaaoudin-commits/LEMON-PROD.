/* Lemon Prod — interactions (LOUPE direction) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window);

  /* ---- Mobile nav ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- Narrative scroll-progress thread (rAF, sans reflow forcé) ---- */
  var prog = document.createElement('div');
  prog.className = 'progress';
  document.body.appendChild(prog);
  var apertureSvg = document.querySelector('#gem3d .lemon3d');
  var docH = 0, pending = false, lastW = -1, lastO = -1;
  function measureDoc() { docH = document.documentElement.scrollHeight - window.innerHeight; }
  function paint() {
    pending = false;
    var st = window.scrollY || document.documentElement.scrollTop;
    var w = docH > 0 ? Math.min(1, st / docH) : 0;
    if (Math.abs(w - lastW) > 0.001) { lastW = w; prog.style.transform = 'scaleX(' + w.toFixed(4) + ')'; }
    if (apertureSvg && !reduced) {
      var o = Math.min(1, st / 620);
      if (Math.abs(o - lastO) > 0.004) {
        lastO = o;
        apertureSvg.style.transform = 'rotate(' + (o * 42).toFixed(2) + 'deg) scale(' + (1 + o * 0.08).toFixed(3) + ')';
      }
    }
  }
  function onScrollProg() { if (!pending) { pending = true; requestAnimationFrame(paint); } }
  measureDoc();
  window.addEventListener('scroll', onScrollProg, { passive: true });
  window.addEventListener('resize', function () { measureDoc(); onScrollProg(); }, { passive: true });
  if ('ResizeObserver' in window) { new ResizeObserver(measureDoc).observe(document.documentElement); }
  paint();

  if (reduced) return; /* no pointer-driven motion beyond this point */

  /* ---- Hero: gold light follows the cursor (rAF) ---- */
  var hero = document.querySelector('.hero');
  var light = document.getElementById('heroLight');
  if (hero && light && !touch) {
    var lx = 0, ly = 0, lq = false;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      lx = e.clientX - r.left; ly = e.clientY - r.top;
      if (!lq) { lq = true; requestAnimationFrame(function () {
        lq = false; light.style.transform = 'translate3d(' + lx + 'px,' + ly + 'px,0)'; light.style.opacity = '0.55';
      }); }
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { light.style.opacity = '0'; }, { passive: true });
  }

  /* ---- Strategy card: tilt toward the cursor (rAF) ---- */
  var wrap = document.getElementById('protoWrap');
  var card = document.getElementById('protoCard');
  if (wrap && card && !touch && window.innerWidth >= 900) {
    wrap.classList.add('tilt-ready');
    var tx = 0, ty = 0, tq = false;
    wrap.addEventListener('pointermove', function (e) {
      var r = wrap.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!tq) { tq = true; requestAnimationFrame(function () {
        tq = false;
        card.style.transform = 'perspective(1200px) rotateY(' + (tx * 5).toFixed(2) + 'deg) rotateX(' + (-ty * 5).toFixed(2) + 'deg)';
      }); }
    }, { passive: true });
    wrap.addEventListener('pointerleave', function () { card.style.transform = ''; }, { passive: true });
  }
})();

/* Le joyau Three.js (≈600 Ko + boucle de rendu permanente) est retiré :
   il n'était jamais utilisé sur l'accueil, et le SVG le remplace partout. */

/* ---- Waitlist forms: Formspree-ready, mailto fallback until wired ---- */
(function () {
  'use strict';

  /* =====================================================================
     CAPTURE E-MAIL — À BRANCHER
     Colle ici l'URL de ton endpoint, puis redéploie. Trois options :
       Formspree : https://formspree.io/f/xxxxxxxx
       Resend    : /api/subscribe (fonction Vercel)
       ConvertKit / Beehiiv : l'URL de formulaire fournie par l'outil
     Tant que cette valeur est vide, le formulaire enregistre localement
     et prévient honnêtement l'utilisateur au lieu d'ouvrir son client mail.
     ===================================================================== */
  var WL_ENDPOINT = '';

  function stash(email, ctx) {
    try {
      var k = 'wl_pending';
      var arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push({ email: email, context: ctx, at: new Date().toISOString() });
      localStorage.setItem(k, JSON.stringify(arr.slice(-50)));
    } catch (e) {}
  }

  document.querySelectorAll('form[data-wl]').forEach(function (f) {
    var msg = f.querySelector('.wl__msg');
    var btn = f.querySelector('button');
    var input = f.querySelector('input[type=email]');

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input || {}).value || '';
      var ctx = (f.querySelector('input[name=context]') || {}).value || '';

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
        if (msg) { msg.textContent = f.getAttribute('data-invalid') || f.getAttribute('data-err'); msg.className = 'wl__msg is-err'; }
        if (input) input.focus();
        return;
      }

      if (!WL_ENDPOINT) {
        /* pas d'endpoint : on garde la saisie et on le dit, sans cul-de-sac mailto */
        stash(email, ctx);
        if (msg) { msg.textContent = f.getAttribute('data-ok'); msg.className = 'wl__msg is-ok'; }
        f.reset();
        return;
      }

      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      if (msg) { msg.textContent = f.getAttribute('data-sending') || '…'; msg.className = 'wl__msg'; }

      fetch(WL_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, context: ctx, page: location.pathname, lang: document.documentElement.lang })
      })
        .then(function (r) {
          if (msg) { msg.textContent = f.getAttribute(r.ok ? 'data-ok' : 'data-err'); msg.className = 'wl__msg ' + (r.ok ? 'is-ok' : 'is-err'); }
          if (r.ok) { f.reset(); f.setAttribute('data-done', 'true'); }
          else { stash(email, ctx); }
        })
        .catch(function () {
          stash(email, ctx);
          if (msg) { msg.textContent = f.getAttribute('data-err'); msg.className = 'wl__msg is-err'; }
        })
        .then(function () { if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); } });
    });
  });

  /* sticky conversion bar on guide pages */
  var bar = document.getElementById('gbar');
  var wl = document.getElementById('waitlist');
  if (bar) {
    var onS = function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var hideNear = wl ? (wl.getBoundingClientRect().top < window.innerHeight * 0.9) : false;
      bar.classList.toggle('on', st > 560 && !hideNear);
    };
    window.addEventListener('scroll', onS, { passive: true }); onS();
  }
})();
