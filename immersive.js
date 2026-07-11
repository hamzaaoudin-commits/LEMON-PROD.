/* Lemon Prod — scroll director v3 (home only, no WebGL)
   Pinned act scenes scrubbed by scroll, word reveals, hero parallax,
   and the gallery walk: rooms observed as they enter. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__IMMERSIVE = true;
  document.documentElement.classList.add('immersive');

  var G = { sp: [0, 0, 0] };
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var sceneParts = scenes.map(function (sc) {
    return { sc: sc, act: sc.querySelector('.act'), mark: sc.querySelector('.act__mark'), rule: sc.querySelector('.act__rule'), on: false };
  });
  var heroEl = document.querySelector('.hero');
  var h1 = document.querySelector('.hero h1');
  var plaque = document.getElementById('protoWrap');

  if (!reduced) {
    document.querySelectorAll('[data-words]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'w'; s.style.transitionDelay = (i * 80) + 'ms';
        s.textContent = w; el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
      });
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; measure(); });
  }
  function measure() {
    var vh = window.innerHeight;
    var st = window.scrollY || document.documentElement.scrollTop;
    var i, sp, rects = [];
    for (i = 0; i < sceneParts.length; i++) rects[i] = sceneParts[i].sc.getBoundingClientRect();
    for (i = 0; i < sceneParts.length; i++) {
      sp = sceneParts[i];
      var r = rects[i], total = r.height - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      G.sp[i] = p;
      var on = p > 0.05 && p < 0.98;
      if (on !== sp.on) { sp.on = on; sp.sc.classList.toggle('is-on', on); }
      if (!reduced) {
        if (sp.mark) sp.mark.style.transform = 'rotate(' + (p * 110).toFixed(1) + 'deg) scale(' + (0.82 + p * 0.28).toFixed(3) + ')';
        if (sp.rule) { sp.rule.style.transform = 'scaleX(' + Math.min(1, p * 1.6).toFixed(3) + ')'; sp.rule.style.opacity = Math.min(1, p * 3).toFixed(2); }
        if (sp.act) { var d = p > 0.72 ? (p - 0.72) : 0; sp.act.style.opacity = (1 - d * 3.4).toFixed(3); sp.act.style.transform = d > 0 ? 'scale(' + (1 + d * 0.05).toFixed(3) + ')' : ''; }
      }
    }
    if (!reduced && heroEl) {
      var hp = Math.min(1, st / (vh * 0.9));
      if (h1) h1.style.transform = 'translate3d(0,' + (hp * 52).toFixed(1) + 'px,0)';
      if (plaque) plaque.style.transform = 'translate3d(0,' + (hp * -40).toFixed(1) + 'px,0)';
      heroEl.style.opacity = (1 - hp * 0.6).toFixed(3);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  measure();

  /* rooms: reveal as each room takes the stage */
  var rooms = document.querySelectorAll('.room');
  if (reduced || !('IntersectionObserver' in window)) {
    rooms.forEach(function (r) { r.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.45 });
    rooms.forEach(function (r) { io.observe(r); });
  }
})();
