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

  /* ---- Narrative scroll-progress thread ---- */
  var prog = document.createElement('div');
  prog.className = 'progress';
  document.body.appendChild(prog);
  function updateProgress() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var doch = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (doch > 0 ? (st / doch) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (reduced) return; /* no pointer-driven motion beyond this point */

  /* ---- Hero: gold light follows the cursor ---- */
  var hero = document.querySelector('.hero');
  var light = document.getElementById('heroLight');
  if (hero && light && !touch) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      light.style.left = (e.clientX - r.left) + 'px';
      light.style.top = (e.clientY - r.top) + 'px';
      light.style.opacity = '0.7';
    });
    hero.addEventListener('pointerleave', function () { light.style.opacity = '0'; });
  }

  /* ---- Strategy card: tilt toward the cursor (a stone turned to the light) ---- */
  var wrap = document.getElementById('protoWrap');
  var card = document.getElementById('protoCard');
  if (wrap && card && !touch) {
    wrap.classList.add('tilt-ready');
    wrap.addEventListener('pointermove', function (e) {
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(1200px) rotateY(' + (px * 6.5) + 'deg) rotateX(' + (-py * 6.5) + 'deg)';
    });
    wrap.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }

  /* ---- 3D faceted gem (Three.js, lazy + graceful fallback to SVG) ---- */
  function init3D() {
    var mount = document.getElementById('gem3d');
    if (!mount || touch || window.innerWidth < 900) return;
    try {
      var test = document.createElement('canvas');
      if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return;
    } catch (e) { return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.async = true;
    s.onload = build3D;
    s.onerror = function () {}; /* keep SVG fallback */
    document.head.appendChild(s);

    function build3D() {
      var THREE = window.THREE; if (!THREE) return;
      var w = mount.clientWidth, h = mount.clientHeight;
      var scene = new THREE.Scene();
      var cam = new THREE.PerspectiveCamera(42, w / h, 0.1, 100); cam.position.set(0, 0, 5);
      var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      mount.appendChild(renderer.domElement); mount.classList.add('is-3d');

      var geo = new THREE.OctahedronGeometry(1.25, 0);
      var mat = new THREE.MeshPhongMaterial({ color: 0xE6A62A, specular: 0xF5CE55, shininess: 90, emissive: 0x2a1d05, flatShading: true });
      var gem = new THREE.Mesh(geo, mat); gem.scale.set(1, 1.4, 1); scene.add(gem);
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xF5CE55, transparent: true, opacity: 0.6 }));
      edges.scale.copy(gem.scale); scene.add(edges);

      scene.add(new THREE.AmbientLight(0x4a3722, 1.1));
      var key = new THREE.DirectionalLight(0xfff0d2, 1.8); key.position.set(2.5, 3, 4); scene.add(key);
      var rim = new THREE.DirectionalLight(0xF5CE55, 1.0); rim.position.set(-3, -1.5, 2); scene.add(rim);

      var drag = false, lx = 0, ly = 0, rotX = -0.25, rotY = 0, vy = 0.004;
      var cv = renderer.domElement;
      cv.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; });
      window.addEventListener('pointerup', function () { drag = false; });
      window.addEventListener('pointermove', function (e) {
        if (!drag) return;
        rotY += (e.clientX - lx) * 0.01; rotX += (e.clientY - ly) * 0.01;
        lx = e.clientX; ly = e.clientY;
      });
      function loop() {
        requestAnimationFrame(loop);
        if (!drag) rotY += vy;
        gem.rotation.y = rotY; gem.rotation.x = rotX;
        edges.rotation.set(rotX, rotY, 0);
        renderer.render(scene, cam);
      }
      loop();
    }
  }
  if ('requestIdleCallback' in window) { requestIdleCallback(init3D, { timeout: 2500 }); }
  else { window.addEventListener('load', function () { setTimeout(init3D, 800); }); }
})();
