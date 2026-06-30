/* Lemon Prod — interactions (LOUPE) */
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

  if (reduced) return; /* no pointer-driven motion if reduced */

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

  /* ---- Jeweller's loupe: magnify the strategy under the lens ---- */
  var loupeTarget = document.querySelector('[data-loupe]');
  if (loupeTarget && !touch) {
    var Z = 1.7, R = 100; /* magnification, lens radius */
    var lens = document.createElement('div');
    lens.className = 'loupe-lens';
    var inner = document.createElement('div');
    inner.className = 'loupe-lens__inner';
    lens.appendChild(inner);
    document.body.appendChild(lens);
    var built = false;
    function build() {
      inner.innerHTML = '';
      var clone = loupeTarget.cloneNode(true);
      clone.removeAttribute('id'); clone.style.margin = '0'; clone.style.transform = 'none';
      var rect = loupeTarget.getBoundingClientRect();
      clone.style.width = rect.width + 'px';
      inner.style.width = rect.width + 'px';
      inner.style.transform = 'scale(' + Z + ')';
      inner.appendChild(clone);
      built = true;
    }
    loupeTarget.addEventListener('pointerenter', function () { build(); lens.classList.add('on'); });
    loupeTarget.addEventListener('pointerleave', function () { lens.classList.remove('on'); });
    loupeTarget.addEventListener('pointermove', function (e) {
      if (!built) build();
      var rect = loupeTarget.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      lens.style.left = (e.clientX - R) + 'px';
      lens.style.top = (e.clientY - R) + 'px';
      inner.style.left = (R - x * Z) + 'px';
      inner.style.top = (R - y * Z) + 'px';
    });
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
      var mat = new THREE.MeshPhongMaterial({ color: 0xCDA64C, specular: 0xF4DA88, shininess: 80, emissive: 0x241906, flatShading: true });
      var gem = new THREE.Mesh(geo, mat); gem.scale.set(1, 1.4, 1); scene.add(gem);
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xE7C97E, transparent: true, opacity: 0.55 }));
      edges.scale.copy(gem.scale); scene.add(edges);

      scene.add(new THREE.AmbientLight(0x4a3722, 1.1));
      var key = new THREE.DirectionalLight(0xfff0d2, 1.7); key.position.set(2.5, 3, 4); scene.add(key);
      var rim = new THREE.DirectionalLight(0xE7C97E, 1.0); rim.position.set(-3, -1.5, 2); scene.add(rim);

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
