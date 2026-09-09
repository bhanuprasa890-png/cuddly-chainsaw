/* ═══════════ RapidGo · 3D animated city (Three.js) ═══════════ */
(function () {
  var canvas = document.getElementById('scene3d');
  if (!canvas) return;
  if (typeof THREE === 'undefined') { canvas.style.display = 'none'; return; }

  var hero = canvas.parentElement;
  var W = hero.clientWidth, H = hero.clientHeight;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x101216, 22, 60);

  var camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 120);
  var camBase = new THREE.Vector3(0, 5.4, 14.5);
  camera.position.copy(camBase);
  camera.lookAt(0, 1.2, 0);

  /* ── lights ── */
  scene.add(new THREE.HemisphereLight(0xfff3c4, 0x1a1d24, 0.9));
  var sun = new THREE.DirectionalLight(0xffe27a, 1.1);
  sun.position.set(8, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  var glow1 = new THREE.PointLight(0xffc300, 1.2, 30); glow1.position.set(-6, 4, 4); scene.add(glow1);
  var glow2 = new THREE.PointLight(0x4da3ff, 0.7, 30); glow2.position.set(6, 3, -6); scene.add(glow2);

  /* ── ground + road ── */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true;
  scene.add(ground);

  var road = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 80),
    new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.9 })
  );
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true;
  scene.add(road);

  [-5.4, 5.4].forEach(function (x) {
    var walk = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.18, 80),
      new THREE.MeshStandardMaterial({ color: 0x2e323c, roughness: 1 })
    );
    walk.position.set(x, 0.09, 0); walk.receiveShadow = true; scene.add(walk);
  });

  /* lane dashes (animated) */
  var dashMat = new THREE.MeshBasicMaterial({ color: 0xffc300 });
  var dashes = [];
  [-1.5, 1.5].forEach(function (x) {
    for (var i = 0; i < 14; i++) {
      var d = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.6), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.02, -38 + i * 5.8);
      scene.add(d); dashes.push(d);
    }
  });

  /* ── buildings with lit windows ── */
  function windowTexture() {
    var c = document.createElement('canvas'); c.width = 64; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128);
    for (var y = 6; y < 120; y += 12) for (var x = 6; x < 56; x += 12) {
      var lit = Math.random() > 0.45;
      g.fillStyle = lit ? (Math.random() > 0.25 ? '#ffcf4d' : '#9fd8ff') : '#1b1e26';
      g.fillRect(x, y, 7, 7);
    }
    var t = new THREE.CanvasTexture(c); return t;
  }
  var palette = [0x2b303c, 0x343a48, 0x23262f, 0x3a3226];
  for (var b = 0; b < 26; b++) {
    var h = 3 + Math.random() * 9, w = 2.4 + Math.random() * 2.4;
    var side = b % 2 === 0 ? -1 : 1;
    var tex = windowTexture();
    var mat = new THREE.MeshStandardMaterial({
      color: palette[b % palette.length], roughness: 0.85,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9
    });
    var bld = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    bld.position.set(side * (8.5 + Math.random() * 6), h / 2, -36 + b * 2.9 + Math.random());
    bld.castShadow = true;
    scene.add(bld);
  }
  /* glowing billboards */
  for (var bb = 0; bb < 4; bb++) {
    var board = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.4),
      new THREE.MeshBasicMaterial({ color: bb % 2 ? 0xffc300 : 0x4da3ff })
    );
    var sideB = bb % 2 === 0 ? -1 : 1;
    board.position.set(sideB * 7.2, 5.5 + (bb % 3), -18 + bb * 11);
    board.rotation.y = -sideB * Math.PI / 2 + (sideB > 0 ? Math.PI : 0);
    scene.add(board);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.5), new THREE.MeshStandardMaterial({ color: 0x111318 }));
    pole.position.set(sideB * 7.35, 2.75, -18 + bb * 11); scene.add(pole);
  }

  /* street lamps */
  var lampHead = new THREE.MeshBasicMaterial({ color: 0xffe9a3 });
  for (var l = 0; l < 8; l++) {
    var s = l % 2 === 0 ? -1 : 1, z = -28 + l * 8;
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.4), new THREE.MeshStandardMaterial({ color: 0x0e0f13 }));
    post.position.set(s * 6.6, 2.7, z); scene.add(post);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), post.material);
    arm.position.set(s * 6.0, 5.3, z); scene.add(arm);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), lampHead);
    bulb.position.set(s * 5.4, 5.2, z); scene.add(bulb);
  }

  /* ── vehicle builders ── */
  function wheel(r, wdt) {
    var geo = new THREE.CylinderGeometry(r, r, wdt || 0.35, 18); geo.rotateZ(Math.PI / 2);
    var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.7 }));
    var hubG = new THREE.CylinderGeometry(r * 0.45, r * 0.45, (wdt || 0.35) + 0.02, 12); hubG.rotateZ(Math.PI / 2);
    m.add(new THREE.Mesh(hubG, new THREE.MeshStandardMaterial({ color: 0xffc300, metalness: 0.5, roughness: 0.4 })));
    m.castShadow = true; return m;
  }
  function rider(jacket) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: jacket, roughness: 0.6 }));
    body.position.y = 0.95; body.castShadow = true; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf2c99b, roughness: 0.6 }));
    head.position.y = 1.5; head.castShadow = true; g.add(head);
    var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.35 }));
    helmet.position.y = 1.52; g.add(helmet);
    return g;
  }
  var yellow = new THREE.MeshStandardMaterial({ color: 0xffc300, roughness: 0.4, metalness: 0.15 });

  function buildScooter() {
    var g = new THREE.Group(), wheels = [];
    var bodyM = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 1.5), yellow);
    bodyM.position.y = 0.55; bodyM.castShadow = true; g.add(bodyM);
    var nose = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.35), yellow);
    nose.position.set(0, 0.75, 0.85); nose.rotation.x = 0.25; g.add(nose);
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0x111318 }));
    bar.position.set(0, 1.15, 0.95); g.add(bar);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff6c9 }));
    lamp.position.set(0, 0.85, 1.05); g.add(lamp);
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: 0x16181d }));
    seat.position.set(0, 0.82, -0.35); g.add(seat);
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.5 }));
    box.position.set(0, 1.0, -0.85); box.castShadow = true; g.add(box);
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.12, 0.52), yellow);
    stripe.position.set(0, 1.0, -0.85); g.add(stripe);
    var w1 = wheel(0.3); w1.position.set(0, 0.3, 0.85); g.add(w1); wheels.push(w1);
    var w2 = wheel(0.3); w2.position.set(0, 0.3, -0.7); g.add(w2); wheels.push(w2);
    g.add(rider(0x16181d));
    return { group: g, wheels: wheels };
  }
  function buildCar(color) {
    var g = new THREE.Group(), wheels = [];
    var paint = new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.25 });
    var lower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 3.6), paint);
    lower.position.y = 0.6; lower.castShadow = true; g.add(lower);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.9),
      new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.15, metalness: 0.4 }));
    cabin.position.set(0, 1.12, -0.2); cabin.castShadow = true; g.add(cabin);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.6), paint);
    roof.position.set(0, 1.42, -0.2); g.add(roof);
    var plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.06), new THREE.MeshBasicMaterial({ color: 0xffc300 }));
    plate.position.set(0, 0.55, 1.83); g.add(plate);
    [[-0.85, 1.15], [0.85, 1.15], [-0.85, -1.15], [0.85, -1.15]].forEach(function (p) {
      var w = wheel(0.36, 0.3); w.position.set(p[0], 0.36, p[1]); g.add(w); wheels.push(w);
    });
    g.add(rider(0x2f6df6));
    return { group: g, wheels: wheels };
  }
  function buildTruck() {
    var g = new THREE.Group(), wheels = [];
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.5, 1.8), yellow);
    cab.position.set(0, 1.1, 2.6); cab.castShadow = true; g.add(cab);
    var shield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.15, metalness: 0.4 }));
    shield.position.set(0, 1.45, 3.52); g.add(shield);
    var boxM = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 4.4),
      new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.6 }));
    boxM.position.set(0, 1.4, -0.6); boxM.castShadow = true; g.add(boxM);
    var band = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.5, 4.44),
      new THREE.MeshStandardMaterial({ color: 0x16181d }));
    band.position.set(0, 1.0, -0.6); g.add(band);
    [[-1.0, 2.6], [1.0, 2.6], [-1.0, -1.6], [1.0, -1.6], [-1.0, -2.4], [1.0, -2.4]].forEach(function (p) {
      var w = wheel(0.42, 0.32); w.position.set(p[0], 0.42, p[1]); g.add(w); wheels.push(w);
    });
    return { group: g, wheels: wheels };
  }

  /* traffic */
  var fleet = [];
  function addVehicle(obj, lane, speed, z0, dir) {
    obj.group.position.set(lane, 0, z0);
    if (dir < 0) obj.group.rotation.y = Math.PI;
    scene.add(obj.group);
    fleet.push({ o: obj, speed: speed * dir, lane: lane });
  }
  addVehicle(buildScooter(), -3.1, 11, -20, 1);
  addVehicle(buildScooter(), 3.1, 13, 10, -1);
  addVehicle(buildCar(0xffc300), -1.1, 8, 5, 1);
  addVehicle(buildCar(0xe8eaee), 1.1, 9, -14, -1);
  addVehicle(buildCar(0xe5484d), 3.1, 7, -30, -1);
  addVehicle(buildTruck(), -3.1, 5.5, 18, 1);

  /* floating parcels */
  var parcels = [];
  for (var p = 0; p < 6; p++) {
    var s = 0.35 + Math.random() * 0.3;
    var cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s),
      new THREE.MeshStandardMaterial({ color: p % 2 ? 0xffc300 : 0xb07a3f, roughness: 0.7 }));
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry),
      new THREE.LineBasicMaterial({ color: 0x16181d })));
    cube.position.set(-5 + Math.random() * 10, 2.5 + Math.random() * 3.5, -14 + Math.random() * 26);
    scene.add(cube);
    parcels.push({ m: cube, y: cube.position.y, sp: 0.5 + Math.random(), ph: Math.random() * 6 });
  }

  /* dust particles */
  var pCount = 220, pos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = Math.random() * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xffd75e, size: 0.09, transparent: true, opacity: 0.8
  }));
  scene.add(points);

  /* mouse parallax */
  var mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* pause off-screen */
  var running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(hero);
  }

  window.addEventListener('resize', function () {
    W = hero.clientWidth; H = hero.clientHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  var clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!running) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    dashes.forEach(function (d) { d.position.z += dt * 10; if (d.position.z > 40) d.position.z = -40; });

    fleet.forEach(function (v, idx) {
      v.o.group.position.z += v.speed * dt;
      if (v.o.group.position.z > 42) v.o.group.position.z = -42;
      if (v.o.group.position.z < -42) v.o.group.position.z = 42;
      v.o.wheels.forEach(function (w) { w.rotation.x += v.speed * dt * 2.2; });
      if (idx < 2) { /* scooters bounce + lean */
        v.o.group.position.y = Math.abs(Math.sin(t * 9 + idx * 2)) * 0.05;
        v.o.group.rotation.z = Math.sin(t * 1.4 + idx) * 0.04;
      }
    });

    parcels.forEach(function (pc) {
      pc.m.position.y = pc.y + Math.sin(t * pc.sp + pc.ph) * 0.35;
      pc.m.rotation.x += dt * 0.6; pc.m.rotation.y += dt * 0.8;
    });

    var arr = pGeo.attributes.position.array;
    for (var k = 0; k < pCount; k++) {
      arr[k * 3 + 1] += dt * 0.35;
      if (arr[k * 3 + 1] > 10) arr[k * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    glow1.intensity = 1.1 + Math.sin(t * 2) * 0.25;

    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
    camera.position.x = camBase.x + tx * 2.2;
    camera.position.y = camBase.y - ty * 1.1;
    camera.lookAt(tx * 1.2, 1.2 - ty * 0.5, 0);

    renderer.render(scene, camera);
  })();
})();
