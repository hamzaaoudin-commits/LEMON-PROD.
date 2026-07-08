/* Lemon Prod — immersive director v2 (home only)
   "La Taille": a procedurally cut stone lives behind the page.
   Scroll = the cutting. Camera dollies, gold dust drifts in fog,
   a loupe ring materialises at Act II, shards ignite at Act III.
   Vanilla + Three.js r128 (lazy CDN). Full graceful fallbacks. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window);
  window.__IMMERSIVE = true;
  document.documentElement.classList.add('immersive');

  /* ---------------- scroll model: raw + lerped (inertia) ---------------- */
  var G = { p: 0, pl: 0, sp: [0, 0, 0, 0], mx: 0, my: 0 };
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
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
    scenes.forEach(function (sc, i) {
      var r = sc.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      G.sp[i] = p;
      sc.style.setProperty('--sp', p.toFixed(4));
      if (p > 0.06 && p < 0.97) sc.classList.add('is-on'); else sc.classList.remove('is-on');
    });
    if (!reduced && heroEl) {
      var hp = Math.min(1, st / (vh * 0.9));
      if (h1) h1.style.transform = 'translateY(' + (hp * 52) + 'px)';
      if (plaque) plaque.style.transform = 'translateY(' + (hp * -40) + 'px) rotateX(' + (hp * 4) + 'deg)';
      heroEl.style.opacity = String(1 - hp * 0.6);
    }
    var doc = document.documentElement.scrollHeight - vh;
    G.p = doc > 0 ? st / doc : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pointermove', function (e) {
    G.mx = (e.clientX / window.innerWidth) * 2 - 1;
    G.my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  measure();

  /* ---------------- 3D stage ---------------- */
  if (reduced || touch || window.innerWidth < 900) return;
  try {
    var t = document.createElement('canvas');
    if (!(t.getContext('webgl') || t.getContext('experimental-webgl'))) return;
  } catch (e) { return; }

  var tag = document.createElement('script');
  tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  tag.async = true; tag.onload = build; document.head.appendChild(tag);

  function build() {
    var THREE = window.THREE; if (!THREE) return;
    var mount = document.getElementById('stage3d'); if (!mount) return;
    document.documentElement.classList.add('stage-live');

    var W = window.innerWidth, H = window.innerHeight;
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x110C14, 0.05);
    var cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    cam.position.set(0, 0, 6.4);
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    /* ---- procedurally cut stone: table / crown / girdle / pavilion ---- */
    function cutStone() {
      var TABLE_Y = 0.62, TABLE_R = 0.52, GIR_R = 1.05, CULET_Y = -1.5;
      var tab = [], gir = [];
      for (var i = 0; i < 8; i++) { var a = (i / 8) * Math.PI * 2; tab.push([Math.cos(a) * TABLE_R, TABLE_Y, Math.sin(a) * TABLE_R]); }
      for (var k = 0; k < 16; k++) { var b = ((k + 0.5) / 16) * Math.PI * 2; gir.push([Math.cos(b) * GIR_R, 0, Math.sin(b) * GIR_R]); }
      var P = [];
      function tri(a, b, c) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      var C = [0, TABLE_Y, 0];
      for (i = 0; i < 8; i++) tri(C, tab[i], tab[(i + 1) % 8]);                       /* table cap  */
      for (k = 0; k < 16; k++) tri(gir[k], gir[(k + 1) % 16], tab[((k + 1) >> 1) % 8]); /* crown break*/
      for (i = 0; i < 8; i++) tri(tab[i], tab[(i + 1) % 8], gir[(2 * i + 1) % 16]);     /* crown kite */
      var CU = [0, CULET_Y, 0];
      for (k = 0; k < 16; k++) tri(gir[k], CU, gir[(k + 1) % 16]);                    /* pavilion   */
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.computeVertexNormals();
      return g;
    }
    var stoneGeo = cutStone();
    var stoneMat = new THREE.MeshPhysicalMaterial({
      color: 0xE6A62A, metalness: 0.35, roughness: 0.16,
      clearcoat: 1.0, clearcoatRoughness: 0.22,
      emissive: 0x1a1204, flatShading: true, transparent: true
    });
    var stone = new THREE.Mesh(stoneGeo, stoneMat); scene.add(stone);
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(stoneGeo, 8),
      new THREE.LineBasicMaterial({ color: 0xF5CE55, transparent: true, opacity: 0.42 }));
    scene.add(edges);

    /* ---- loupe ring (materialises at Act II) ---- */
    var loupe = new THREE.Group();
    loupe.add(new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.012, 8, 90),
      new THREE.MeshBasicMaterial({ color: 0xF5CE55, transparent: true })));
    function circleLine(r, op) {
      var pts = []; for (var i = 0; i <= 72; i++) { var a = (i / 72) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
      var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xCDA64C, transparent: true, opacity: op }));
      return l;
    }
    loupe.add(circleLine(1.95, 0.5)); loupe.add(circleLine(2.75, 0.3));
    for (var q = 0; q < 4; q++) {
      var a2 = q * Math.PI / 2 + Math.PI / 4;
      var tick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a2) * 2.5, Math.sin(a2) * 2.5, 0),
        new THREE.Vector3(Math.cos(a2) * 2.95, Math.sin(a2) * 2.95, 0)]),
        new THREE.LineBasicMaterial({ color: 0xF5CE55, transparent: true }));
      loupe.add(tick);
    }
    scene.add(loupe);

    /* ---- ignition shards (Act III) ---- */
    var shards = new THREE.Group();
    var shardData = [];
    for (var sN = 0; sN < 8; sN++) {
      var sm = new THREE.Mesh(new THREE.TetrahedronGeometry(0.055 + Math.random() * 0.05),
        new THREE.MeshBasicMaterial({ color: 0xF5CE55, transparent: true }));
      shards.add(sm);
      shardData.push({ r: 1.7 + Math.random() * 1.1, sp: 0.4 + Math.random() * 0.7, ph: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 1.4 });
    }
    scene.add(shards);

    /* ---- gold dust in fog ---- */
    var DUST = 620, dpos = new Float32Array(DUST * 3);
    for (var d = 0; d < DUST; d++) {
      dpos[d * 3] = (Math.random() - 0.5) * 16;
      dpos[d * 3 + 1] = (Math.random() - 0.5) * 10;
      dpos[d * 3 + 2] = (Math.random() - 0.5) * 7 - 1;
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xE6C878, size: 0.022, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(dust);

    /* ---- lights (key follows the cursor) ---- */
    scene.add(new THREE.AmbientLight(0x4a3722, 0.9));
    var key = new THREE.DirectionalLight(0xfff0d2, 1.7); key.position.set(2.5, 3, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xF5CE55, 0.85); rim.position.set(-3, -1.5, 2); scene.add(rim);
    var warm = new THREE.PointLight(0xE6A62A, 0.8, 12); warm.position.set(0, -2, 2); scene.add(warm);

    /* ---- runtime keyframes anchored to real scene positions ---- */
    var KF = [], lastDoc = 0;
    function buildKF() {
      var vh = window.innerHeight;
      var doc = document.documentElement.scrollHeight - vh;
      if (doc <= 0) return; lastDoc = doc;
      var C = scenes.map(function (el) {
        var top = el.getBoundingClientRect().top + (window.scrollY || 0);
        var h = el.offsetHeight;
        return { center: (top + (h - vh) / 2) / doc, end: (top + h - vh) / doc, start: top / doc };
      });
      var mid = function (i) { return C[i] && C[i + 1] ? (C[i].end + C[i + 1].start) / 2 : null; };
      var spot = [
        { x: 0.0, y: 0.08, s: 1.10, g: 0.30, o: 0.97 },
        { x: 0.0, y: 0.00, s: 2.05, g: 0.55, o: 0.99 },
        { x: 0.0, y: 0.05, s: 1.30, g: 1.25, o: 1.00 },
        { x: 0.0, y: 0.10, s: 1.55, g: 1.40, o: 1.00 }];
      var rec = [
        { x: -1.9, y: -0.1, s: 0.62, g: 0.10, o: 0.24 },
        { x: 1.8, y: 0.15, s: 0.58, g: 0.14, o: 0.20 },
        { x: -1.7, y: 0.0, s: 0.62, g: 0.18, o: 0.24 }];
      KF = [{ p: 0, x: 1.9, y: 0.30, s: 0.92, g: 0.16, o: 0.96 }];
      for (var i = 0; i < C.length; i++) {
        var k = spot[i] || spot[spot.length - 1];
        KF.push({ p: C[i].center, x: k.x, y: k.y, s: k.s, g: k.g, o: k.o });
        var m = mid(i);
        if (m != null) { var r = rec[i] || rec[rec.length - 1]; KF.push({ p: m, x: r.x, y: r.y, s: r.s, g: r.g, o: r.o }); }
      }
      KF.push({ p: 1, x: 0, y: 0.3, s: 1.7, g: 1.05, o: 0.5 });
      KF.sort(function (a, b) { return a.p - b.p; });
    }
    buildKF();
    window.addEventListener('resize', function () {
      buildKF();
      W = window.innerWidth; H = window.innerHeight;
      cam.aspect = W / H; cam.updateProjectionMatrix(); renderer.setSize(W, H);
    });
    function tween(p) {
      if (Math.abs((document.documentElement.scrollHeight - window.innerHeight) - lastDoc) > 60) buildKF();
      if (!KF.length) return { x: 0, y: 0, s: 1, g: 0.2, o: 0.9 };
      var a = KF[0], b = KF[KF.length - 1];
      for (var i = 0; i < KF.length - 1; i++) if (p >= KF[i].p && p <= KF[i + 1].p) { a = KF[i]; b = KF[i + 1]; break; }
      var tt = (p - a.p) / Math.max(1e-5, b.p - a.p);
      tt = tt * tt * (3 - 2 * tt);
      var L = function (k) { return a[k] + (b[k] - a[k]) * tt; };
      return { x: L('x'), y: L('y'), s: L('s'), g: L('g'), o: L('o') };
    }
    function bell(x) { var c = Math.min(1, Math.max(0, x)); var s = Math.sin(Math.PI * c); return s * s; }

    /* ---- interaction: drag to rotate ---- */
    var drag = false, lx = 0, ly = 0, uRotX = 0, uRotY = 0;
    renderer.domElement.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', function () { drag = false; });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      uRotY += (e.clientX - lx) * 0.008; uRotX += (e.clientY - ly) * 0.008;
      lx = e.clientX; ly = e.clientY;
    });

    var running = true;
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) loop(); });

    window.__stage = { ring: 0, shard: 0, camZ: 0 }; /* debug probe */
    var clock = new THREE.Clock();
    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      var el = clock.getElapsedTime();
      G.pl += (G.p - G.pl) * 0.075;                       /* inertia */
      var k = tween(G.pl);
      var loupeF = bell(G.sp[1]);                          /* Act II  */
      var igniteF = bell(G.sp[2]);                         /* Act III */

      /* stone */
      stone.position.x = k.x; stone.position.y = k.y + Math.sin(el * 0.7) * 0.05;
      var sc = k.s; stone.scale.set(sc, sc, sc);
      stone.rotation.y = el * 0.18 + G.pl * 6.5 + uRotY;
      stone.rotation.x = -0.18 + G.pl * 1.3 + uRotX;
      var g = k.g + igniteF * 0.9;
      stoneMat.emissive.setRGB(0.17 * g, 0.115 * g, 0.02 * g);
      stoneMat.opacity = k.o;
      edges.position.copy(stone.position); edges.rotation.copy(stone.rotation); edges.scale.copy(stone.scale);
      edges.material.opacity = (0.32 + loupeF * 0.5) * k.o;

      /* loupe ring — materialises around the stone at Act II */
      loupe.position.copy(stone.position);
      loupe.quaternion.copy(cam.quaternion);
      loupe.rotation.z = el * 0.25;
      var lo = loupeF * 0.95;
      loupe.children.forEach(function (c) { c.material.opacity = lo * (c.material.opacity > 0 ? 1 : 1) * (c.geometry.type === 'TorusGeometry' ? 0.95 : 0.55); });
      loupe.scale.setScalar(0.85 + loupeF * 0.25);
      loupe.visible = lo > 0.02;

      /* ignition shards — orbit out of the stone at Act III */
      shards.position.copy(stone.position);
      shards.children.forEach(function (m, i) {
        var sd = shardData[i];
        var a = el * sd.sp + sd.ph;
        m.position.set(Math.cos(a) * sd.r * (0.6 + igniteF * 0.6), sd.y + Math.sin(el * 0.9 + sd.ph) * 0.2, Math.sin(a) * sd.r * (0.6 + igniteF * 0.6));
        m.material.opacity = igniteF * 0.9;
        m.rotation.x = a; m.rotation.y = a * 1.3;
      });
      shards.visible = igniteF > 0.02;

      /* gold dust drifts + parallax */
      dust.rotation.y = el * 0.012;
      dust.position.y = -G.pl * 2.2;
      dust.position.x = G.mx * 0.18;
      dust.material.opacity = 0.35 + 0.3 * Math.min(1, k.g);

      /* cinematic camera: dolly in at the loupe, sway with scroll, breathe */
      var cz = 6.4 - G.pl * 0.5 - loupeF * 1.7;
      cam.position.z += (cz - cam.position.z) * 0.08;
      cam.position.x += ((Math.sin(G.pl * Math.PI * 1.5) * 0.28 + G.mx * 0.14) - cam.position.x) * 0.05;
      cam.position.y += ((-G.my * 0.1) - cam.position.y) * 0.05;
      cam.lookAt(stone.position.x * 0.55, stone.position.y * 0.5, 0);

      /* key light follows the cursor */
      key.position.x += ((G.mx * 4) - key.position.x) * 0.04;
      key.position.y += ((3 - G.my * 2.5) - key.position.y) * 0.04;

      window.__stage.ring = lo; window.__stage.shard = igniteF; window.__stage.camZ = cam.position.z;
      renderer.render(scene, cam);
    }
    loop();
  }
})();
