'use strict';
(function (CR) {
  var R = {};
  var scene, camera, renderer;
  var ambient, dirLight, spot, playerLight;
  var playerSprite, playerMat, shadowMesh, playerVisible = false;
  var grid, groundMat, railMat, decorMat;
  var starGeo, starMat, starGeoBase = 600;
  var decors = [], decorMax = 80;
  var particles = [], pCap = 340, pGeo, pPos, pCol, pPoints;
  var curFog, curC1, curC2, curGround, tgtFog, tgtC1, tgtC2, tgtGround;
  var camX = 0;

  function makePlayerTexture() {
    var S = 16;
    var cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    function r(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
    var O = '#070a14', SK = '#8df9ff', V = '#ff2bd6', SU = '#1e5bff', LI = '#b8ffff', DK = '#0a2a66', BT = '#0b0f1e';
    r(5, 1, 6, 1, O);
    r(4, 2, 8, 1, O); r(5, 2, 6, 1, SK);
    r(3, 3, 10, 1, O); r(4, 3, 8, 1, SK);
    r(3, 4, 10, 1, O); r(4, 4, 8, 1, V);
    r(3, 5, 10, 1, O); r(4, 5, 8, 1, V); r(5, 5, 2, 1, '#ffffff');
    r(3, 6, 10, 1, O); r(4, 6, 8, 1, SK);
    r(2, 7, 12, 1, O); r(4, 7, 8, 1, SU);
    r(3, 8, 10, 1, O); r(4, 8, 8, 1, SU);
    r(2, 9, 12, 1, O); r(3, 9, 2, 1, SU); r(11, 9, 2, 1, SU); r(5, 9, 6, 1, SU); r(7, 9, 2, 1, LI);
    r(3, 10, 10, 1, O); r(4, 10, 8, 1, SU);
    r(3, 11, 10, 1, O); r(4, 11, 8, 1, SU);
    r(3, 12, 10, 1, O); r(4, 12, 8, 1, DK);
    r(4, 13, 3, 1, O); r(9, 13, 3, 1, O); r(4, 13, 2, 1, SU); r(9, 13, 2, 1, SU);
    r(4, 14, 3, 1, O); r(9, 14, 3, 1, O); r(5, 14, 1, 1, SU); r(10, 14, 1, 1, SU);
    r(3, 15, 4, 1, O); r(9, 15, 4, 1, O); r(4, 15, 2, 1, BT); r(10, 15, 2, 1, BT);
    var tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (THREE.SRGBColorSpace && tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeGlowTexture() {
    var s = 64;
    var cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  function buildGrid(c1) {
    if (!scene) return;
    if (grid) {
      scene.remove(grid);
      if (grid.geometry) grid.geometry.dispose();
      if (grid.material) grid.material.dispose();
    }
    grid = new THREE.GridHelper(320, 160, c1, 0x0b0d18);
    grid.position.set(0, 0.012, -140);
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    grid.material.depthWrite = false;
    scene.add(grid);
  }

  function buildAmbient() {
    groundMat = new THREE.MeshStandardMaterial({ color: 0x070710, roughness: 0.9, metalness: 0.15 });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 340), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.03, -150);
    ground.receiveShadow = true;
    scene.add(ground);

    railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });
    var railGeo = new THREE.BoxGeometry(0.12, 0.12, 340);
    [-10.8, 10.8].forEach(function (x) {
      var m = new THREE.Mesh(railGeo, railMat);
      m.position.set(x, 0.06, -150);
      scene.add(m);
    });

    decorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4, depthWrite: false });
    var dGeo = new THREE.BoxGeometry(0.1, 0.02, 3.2);
    for (var i = 0; i < decorMax; i++) {
      var d = new THREE.Mesh(dGeo, decorMat);
      d.position.set(CR.rand(-9.5, 9.5), 0.03, CR.rand(-190, 8));
      scene.add(d);
      decors.push(d);
    }

    var sp = new Float32Array(starGeoBase * 3);
    var sc = new Float32Array(starGeoBase * 3);
    for (var s = 0; s < starGeoBase; s++) {
      var rad = CR.rand(80, 230);
      var ang = CR.rand(0, Math.PI * 2);
      sp[s * 3] = Math.cos(ang) * rad;
      sp[s * 3 + 1] = CR.rand(-10, 70);
      sp[s * 3 + 2] = -Math.abs(Math.sin(ang)) * rad - 20;
      var col = new THREE.Color(Math.random() < 0.65 ? 0x9ffcff : 0xff8ae2);
      sc[s * 3] = col.r; sc[s * 3 + 1] = col.g; sc[s * 3 + 2] = col.b;
    }
    starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    starMat = new THREE.PointsMaterial({ size: 1.7, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
    var stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);
  }

  function buildPlayer() {
    var tex = makePlayerTexture();
    playerMat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, alphaTest: 0.05 });
    playerSprite = new THREE.Sprite(playerMat);
    playerSprite.scale.set(1.6, 1.6, 1);
    playerSprite.position.set(0, 0.8, 0);
    playerSprite.visible = false;
    scene.add(playerSprite);

    var shMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false });
    shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), shMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.02, 0);
    shadowMesh.renderOrder = 1;
    scene.add(shadowMesh);

    playerLight = new THREE.PointLight(0x00f0ff, 1.3, 14, 2);
    playerLight.position.set(0, 2, 0.6);
    scene.add(playerLight);
  }

  function buildParticles() {
    pPos = new Float32Array(700 * 3);
    pCol = new Float32Array(700 * 3);
    pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setDrawRange(0, 0);
    var mat = new THREE.PointsMaterial({
      size: 0.17, vertexColors: true, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    pPoints = new THREE.Points(pGeo, mat);
    pPoints.frustumCulled = false;
    scene.add(pPoints);
  }

  R.init = function () {
    if (typeof THREE === 'undefined') return false;
    scene = new THREE.Scene();
    R.scene = scene;

    curFog = new THREE.Color(0x04030a); tgtFog = new THREE.Color(0x04030a);
    curC1 = new THREE.Color(0x00f0ff); tgtC1 = new THREE.Color(0x00f0ff);
    curC2 = new THREE.Color(0xff2bd6); tgtC2 = new THREE.Color(0xff2bd6);
    curGround = new THREE.Color(0x070710); tgtGround = new THREE.Color(0x070710);

    scene.background = new THREE.Color(0x04030a);
    scene.fog = new THREE.FogExp2(0x04030a, 0.014);

    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 5.5, 13);

    renderer = new THREE.WebGLRenderer({ canvas: CR.$('gl'), antialias: true, powerPreference: 'high-performance' });
    if (THREE.SRGBColorSpace) {
      try { renderer.outputColorSpace = THREE.SRGBColorSpace; } catch (e) {}
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    ambient = new THREE.AmbientLight(0x3a4a66, 0.75);
    scene.add(ambient);

    dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(8, 20, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.updateProjectionMatrix();
    scene.add(dirLight);

    spot = new THREE.SpotLight(0xff2bd6, 2, 160, Math.PI / 4.5, 0.6, 1.2);
    spot.position.set(-14, 13, 4);
    spot.target.position.set(0, 0, -20);
    scene.add(spot);
    scene.add(spot.target);

    buildAmbient();
    buildPlayer();
    buildParticles();

    window.addEventListener('resize', R.resize);
    R.applyQuality();
    R.applyPalette(0, true);
    R.resize();
    return true;
  };

  R.applyPalette = function (idx, immediate) {
    var p = CR.SECTORS[idx % CR.SECTORS.length];
    tgtFog.setHex(p.fog);
    tgtC1.setHex(p.c1);
    tgtC2.setHex(p.c2);
    tgtGround.setHex(p.ground);
    buildGrid(p.c1);
    if (immediate) {
      curFog.copy(tgtFog); curC1.copy(tgtC1); curC2.copy(tgtC2); curGround.copy(tgtGround);
      if (scene) {
        scene.fog.color.copy(curFog);
        scene.background.copy(curFog);
        dirLight.color.copy(curC1);
        spot.color.copy(curC2);
        railMat.color.copy(curC1);
        decorMat.color.copy(curC1);
        groundMat.color.copy(curGround);
        playerLight.color.copy(curC1);
      }
    }
  };

  R.updateColors = function (dt) {
    if (!scene) return;
    var k = Math.min(1, dt * 1.4);
    curFog.lerp(tgtFog, k);
    curC1.lerp(tgtC1, k);
    curC2.lerp(tgtC2, k);
    curGround.lerp(tgtGround, k);
    scene.fog.color.copy(curFog);
    scene.background.copy(curFog);
    dirLight.color.copy(curC1);
    spot.color.copy(curC2);
    railMat.color.copy(curC1);
    decorMat.color.copy(curC1);
    groundMat.color.copy(curGround);
    playerLight.color.copy(curC1);
  };

  R.applyQuality = function () {
    if (!renderer) return;
    var q = CR.QUALITY[CR.Settings.quality] || CR.QUALITY.medium;
    pCap = q.particles;
    renderer.shadowMap.enabled = q.shadows;
    if (dirLight) dirLight.castShadow = q.shadows;
    if (starGeo) starGeo.setDrawRange(0, Math.min(starGeoBase, q.stars));
    for (var i = 0; i < decors.length; i++) decors[i].visible = i < q.decor;
    R.applyRendererScale();
  };

  R.applyRendererScale = function () {
    if (!renderer) return;
    var q = CR.QUALITY[CR.Settings.quality] || CR.QUALITY.medium;
    var ratio = q.scale * CR.State.adaptiveScale;
    renderer.setPixelRatio(Math.max(0.4, Math.min(1.75, ratio)));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  R.resize = function () {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    R.applyRendererScale();
  };

  R.setPlayerVisible = function (v) {
    playerVisible = v;
    if (playerSprite) playerSprite.visible = v;
  };

  R.syncPlayer = function (p, S) {
    if (!playerSprite) return;
    playerSprite.position.set(p.x, p.feet + 0.8, 0);
    var blink = S.invuln > 0 && Math.floor(S.clock * 18) % 2 === 0;
    playerSprite.visible = playerVisible && !blink;
    playerMat.color.setHex(S.dashTime > 0 ? 0x9ffcff : 0xffffff);
    shadowMesh.position.set(p.x, 0.02, 0);
    var sc = CR.clamp(1 - p.feet * 0.16, 0.35, 1);
    shadowMesh.scale.set(sc, sc, 1);
    playerLight.position.set(p.x, p.feet + 1.7, 0.6);
  };

  R.spawnBurst = function (x, y, z, hex, count, spread) {
    if (!pGeo) return;
    var col = new THREE.Color(hex);
    for (var i = 0; i < count; i++) {
      if (particles.length >= pCap) break;
      var life = CR.rand(0.35, 0.9);
      particles.push({
        x: x, y: y, z: z,
        vx: CR.rand(-spread, spread),
        vy: CR.rand(0.2, spread),
        vz: CR.rand(-spread, spread),
        life: life, max: life,
        r: col.r, g: col.g, b: col.b
      });
    }
  };

  R.updateParticles = function (dt) {
    if (!pGeo) return;
    var n = 0;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy -= 6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.02) { p.y = 0.02; p.vy *= -0.4; }
    }
    for (var j = 0; j < particles.length && n < 700; j++, n++) {
      var q = particles[j];
      var fade = q.life / q.max;
      pPos[n * 3] = q.x;
      pPos[n * 3 + 1] = q.y;
      pPos[n * 3 + 2] = q.z;
      pCol[n * 3] = q.r * fade;
      pCol[n * 3 + 1] = q.g * fade;
      pCol[n * 3 + 2] = q.b * fade;
    }
    pGeo.setDrawRange(0, n);
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  };

  R.updateDecor = function (dt, speed) {
    for (var i = 0; i < decors.length; i++) {
      var d = decors[i];
      d.position.z += speed * dt;
      if (d.position.z > 14) {
        d.position.z = -CR.rand(160, 195);
        d.position.x = CR.rand(-9.5, 9.5);
      }
    }
  };

  R.updateCamera = function (dt) {
    if (!camera) return;
    var S = CR.State;
    var P = CR.World && CR.World.Player ? CR.World.Player : { x: 0, feet: 0 };
    if (S.mode === 'PLAYING' || S.mode === 'PAUSED' || S.mode === 'GAMEOVER') {
      camX += (P.x * 0.4 - camX) * Math.min(1, dt * 5);
      var sh = S.shake;
      var jx = sh ? (Math.random() - 0.5) * sh : 0;
      var jy = sh ? (Math.random() - 0.5) * sh : 0;
      camera.position.set(camX + jx, 5.0 + P.feet * 0.12 + jy, 11);
      camera.lookAt(P.x * 0.5, 2.1 + P.feet * 0.12, -7);
    } else {
      var t = S.clock;
      camera.position.set(Math.sin(t * 0.2) * 4, 6.0 + Math.sin(t * 0.27) * 0.5, 13);
      camera.lookAt(0, 1.8, -12);
    }
    S.shake = Math.max(0, S.shake - dt * 1.8);
  };

  R.render = function () {
    if (renderer && scene && camera) renderer.render(scene, camera);
  };

  R.makeGlowTexture = makeGlowTexture;
  CR.R = R;
})(window.CR);
