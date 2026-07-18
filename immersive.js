/* Lemon Prod — directeur de scroll v4 (accueil, sans WebGL)
   Une seule boucle rAF, lectures de layout groupées puis écritures,
   et aucune écriture de style quand la valeur n'a pas bougé. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__IMMERSIVE = true;
  document.documentElement.classList.add('immersive');

  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  if (!scenes.length && !document.querySelector('.hero')) return;

  var parts = scenes.map(function (sc) {
    return {
      sc: sc,
      act: sc.querySelector('.act'),
      mark: sc.querySelector('.act__mark'),
      rule: sc.querySelector('.act__rule'),
      on: false, top: 0, h: 0, last: -1
    };
  });

  var heroEl = document.querySelector('.hero');
  var h1 = document.querySelector('.hero h1');
  var plaque = document.getElementById('protoWrap');
  var lastHero = -1;

  /* découpe en mots : une seule fois, hors du chemin de scroll */
  if (!reduced) {
    document.querySelectorAll('[data-words]').forEach(function (el) {
      var frag = document.createDocumentFragment();
      el.textContent.trim().split(/\s+/).forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'w';
        s.style.transitionDelay = (i * 70) + 'ms';
        s.textContent = w;
        frag.appendChild(s);
        frag.appendChild(document.createTextNode(' '));
      });
      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* géométrie mesurée hors scroll : plus de getBoundingClientRect par frame */
  var vh = window.innerHeight;
  function cache() {
    vh = window.innerHeight;
    var sy = window.scrollY || document.documentElement.scrollTop;
    for (var i = 0; i < parts.length; i++) {
      var r = parts[i].sc.getBoundingClientRect();
      parts[i].top = r.top + sy;
      parts[i].h = r.height;
    }
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }

  function paint() {
    queued = false;
    var st = window.scrollY || document.documentElement.scrollTop;

    for (var i = 0; i < parts.length; i++) {
      var sp = parts[i];
      var total = sp.h - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, (st - sp.top) / total)) : 0;

      var on = p > 0.05 && p < 0.98;
      if (on !== sp.on) { sp.on = on; sp.sc.classList.toggle('is-on', on); }

      /* hors champ : rien à peindre */
      if (!on && p !== 0 && p !== 1) continue;
      if (reduced || Math.abs(p - sp.last) < 0.004) continue;
      sp.last = p;

      if (sp.mark) sp.mark.style.transform = 'rotate(' + (p * 110).toFixed(1) + 'deg) scale(' + (0.82 + p * 0.28).toFixed(3) + ')';
      if (sp.rule) {
        sp.rule.style.transform = 'scaleX(' + Math.min(1, p * 1.6).toFixed(3) + ')';
        sp.rule.style.opacity = Math.min(1, p * 3).toFixed(2);
      }
      if (sp.act) {
        var d = p > 0.72 ? (p - 0.72) : 0;
        sp.act.style.opacity = (1 - d * 3.4).toFixed(3);
        sp.act.style.transform = d > 0 ? 'scale(' + (1 + d * 0.05).toFixed(3) + ')' : '';
      }
    }

    if (!reduced && heroEl && st < vh * 1.2) {
      var hp = Math.min(1, st / (vh * 0.9));
      if (Math.abs(hp - lastHero) > 0.004) {
        lastHero = hp;
        if (h1) h1.style.transform = 'translate3d(0,' + (hp * 44).toFixed(1) + 'px,0)';
        if (plaque) plaque.style.transform = 'translate3d(0,' + (hp * -34).toFixed(1) + 'px,0)';
        heroEl.style.opacity = (1 - hp * 0.55).toFixed(3);
      }
    }
  }

  cache();
  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { cache(); onScroll(); }, { passive: true });
  window.addEventListener('load', function () { cache(); onScroll(); });

  /* révélation des blocs à l'entrée dans le champ */
  var rooms = document.querySelectorAll('.room');
  if (rooms.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rooms.forEach(function (r) { r.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.35 });
      rooms.forEach(function (r) { io.observe(r); });
    }
  }
})();
