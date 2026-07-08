/* Lemon Prod — immersive scroll director (home only)
   A persistent 3D stone lives behind the page and is "cut" as you scroll:
   raw at the hero -> approached (Act I) -> under the loupe (Act II)
   -> one facet ignites (Act III) -> radiant at the decision/closing.
   Vanilla + Three.js (lazy). Full fallback: no WebGL / touch / reduced motion. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window);
  window.__IMMERSIVE = true;
  document.documentElement.classList.add('immersive');

  /* ---------- Scene scrub: expose per-scene progress as --sp (0..1) ---------- */
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var heroEl = document.querySelector('.hero');
  var h1 = document.querySelector('.hero h1');
  var plaque = document.getElementById('protoWrap');

  /* word-split act titles for staggered reveal */
  if (!reduced) {
    document.querySelectorAll('[data-words]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'w'; s.style.transitionDelay = (i * 70) + 'ms';
        s.textContent = w; el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
      });
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }

  function update() {
    var vh = window.innerHeight;
    var st = window.scrollY || document.documentElement.scrollTop;

    /* per-scene progress */
    scenes.forEach(function (sc) {
      var r = sc.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      sc.style.setProperty('--sp', p.toFixed(4));
      if (p > 0.08 && p < 0.97) sc.classList.add('is-on'); else sc.classList.remove('is-on');
    });

    /* hero parallax */
    if (!reduced && heroEl) {
      var hp = Math.min(1, st / (vh * 0.9));
      if (h1) h1.style.transform = 'translateY(' + (hp * 46) + 'px)';
      if (plaque) plaque.style.transform = 'translateY(' + (hp * -34) + 'px)';
      heroEl.style.opacity = String(1 - hp * 0.55);
    }

    /* global progress for the 3D director */
    var doc = document.documentElement.scrollHeight - vh;
    G.p = doc > 0 ? st / doc : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- 3D director ---------- */
  var G = { p: 0 };
  update();
  if (reduced || touch || window.innerWidth < 900) return; /* pinned scenes still work via CSS */

  try {
    var test = document.createElement('canvas');
    if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return;
  } catch (e) { return; }

  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.async = true; s.onload = build; document.head.appendChild(s);

  function build() {
    var THREE = window.THREE; if (!THREE) return;
    var mount = document.getElementById('stage3d'); if (!mount) return;
    document.documentElement.classList.add('stage-live');

    var W = window.innerWidth, H = window.innerHeight;
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 100); cam.position.set(0, 0, 6);
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    var geo = new THREE.OctahedronGeometry(1.3, 0);
    var mat = new THREE.MeshPhongMaterial({ color: 0xE6A62A, specular: 0xF5CE55, shininess: 95, emissive: 0x1a1204, flatShading: true, transparent: true });
    var gem = new THREE.Mesh(geo, mat); gem.scale.set(1, 1.42, 1); scene.add(gem);
    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xF5CE55, transparent: true, opacity: 0.5 }));
    edges.scale.copy(gem.scale); scene.add(edges);

    scene.add(new THREE.AmbientLight(0x4a3722, 1.0));
    var key = new THREE.DirectionalLight(0xfff0d2, 1.7); key.position.set(2.5, 3, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xF5CE55, 0.9); rim.position.set(-3, -1.5, 2); scene.add(rim);

    /* keyframes derived at runtime from the real scene positions (locale-proof) */
    var KF = [];
    var lastDoc = 0;
    function buildKF() {
      var vh = window.innerHeight;
      var doc = document.documentElement.scrollHeight - vh;
      if (doc <= 0) return;
      lastDoc = doc;
      var els = Array.prototype.slice.call(document.querySelectorAll('.scene'));
      var C = els.map(function (el) {
        var top = el.getBoundingClientRect().top + (window.scrollY || 0);
        var h = el.offsetHeight;
        return { center: (top + (h - vh) / 2) / doc, end: (top + h - vh) / doc, start: top / doc };
      });
      var mid = function (i) { return C[i] && C[i + 1] ? (C[i].end + C[i + 1].start) / 2 : null; };
      var spot = [
        { x: 0.0, y: 0.10, s: 1.25, g: 0.32, o: 0.96 },  /* I  — approaches */
        { x: 0.0, y: 0.00, s: 2.35, g: 0.58, o: 0.98 },  /* II — under the loupe */
        { x: 0.0, y: 0.05, s: 1.50, g: 1.18, o: 1.00 },  /* III— facet ignites */
        { x: 0.0, y: 0.12, s: 1.80, g: 1.38, o: 1.00 }   /* IV — radiant */
      ];
      var rec = [
        { x: -2.0, y: -0.1, s: 0.72, g: 0.12, o: 0.28 },
        { x: 1.9, y: 0.15, s: 0.66, g: 0.16, o: 0.24 },
        { x: -1.8, y: 0.0, s: 0.70, g: 0.20, o: 0.28 }
      ];
      KF = [{ p: 0, x: 2.1, y: 0.35, s: 1.0, g: 0.18, o: 0.95 }];
      for (var i = 0; i < C.length; i++) {
        var k = spot[i] || spot[spot.length - 1];
        KF.push({ p: C[i].center, x: k.x, y: k.y, s: k.s, g: k.g, o: k.o });
        var m = mid(i);
        if (m != null) { var r = rec[i] || rec[rec.length - 1]; KF.push({ p: m, x: r.x, y: r.y, s: r.s, g: r.g, o: r.o }); }
      }
      KF.push({ p: 1, x: 0, y: 0.35, s: 1.95, g: 1.1, o: 0.55 });
      KF.sort(function (a, b) { return a.p - b.p; });
    }
    buildKF();
    window.addEventListener('resize', buildKF);
    function tween(p) {
      if (Math.abs((document.documentElement.scrollHeight - window.innerHeight) - lastDoc) > 60) buildKF();
      if (!KF.length) return { x: 0, y: 0, s: 1, g: 0.2, o: 0.9 };
      var a = KF[0], b = KF[KF.length - 1];
      for (var i = 0; i < KF.length - 1; i++) if (p >= KF[i].p && p <= KF[i + 1].p) { a = KF[i]; b = KF[i + 1]; break; }
      var t = (p - a.p) / Math.max(1e-5, b.p - a.p);
      t = t * t * (3 - 2 * t);
      var L = function (k) { return a[k] + (b[k] - a[k]) * t; };
      return { x: L('x'), y: L('y'), s: L('s'), g: L('g'), o: L('o') };
    }

    var drag = false, lx = 0, ly = 0, uRotX = 0, uRotY = 0;
    renderer.domElement.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', function () { drag = false; });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      uRotY += (e.clientX - lx) * 0.008; uRotX += (e.clientY - ly) * 0.008;
      lx = e.clientX; ly = e.clientY;
    });

    window.addEventListener('resize', function () {
      W = window.innerWidth; H = window.innerHeight;
      cam.aspect = W / H; cam.updateProjectionMatrix(); renderer.setSize(W, H);
    });

    var clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      var el = clock.getElapsedTime();
      var k = tween(G.p);
      gem.position.x = k.x; gem.position.y = k.y + Math.sin(el * 0.8) * 0.06;
      var sc = k.s; gem.scale.set(sc, sc * 1.42, sc);
      gem.rotation.y = el * 0.22 + G.p * 7.5 + uRotY;
      gem.rotation.x = -0.22 + G.p * 1.6 + uRotX;
      mat.emissive.setScalar ? mat.emissive.setScalar(0) : 0;
      mat.emissive.setRGB(0.16 * k.g, 0.11 * k.g, 0.02 * k.g);
      mat.opacity = k.o;
      edges.position.copy(gem.position); edges.rotation.copy(gem.rotation); edges.scale.copy(gem.scale);
      edges.material.opacity = 0.5 * k.o;
      renderer.render(scene, cam);
    })();
  }
})();
