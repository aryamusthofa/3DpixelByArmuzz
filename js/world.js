'use strict';
(function (CR) {
  var W = { objects: [], Player: { x: 0, feet: 0, vy: 0, jumps: 0 } };

  var coreGeo = new THREE.OctahedronGeometry(0.33, 0);
  var coreMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  var haloMat = new THREE.SpriteMaterial({
    map: CR.R.makeGlowTexture(), color: 0xffdd00, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  var hazardGeo = new THREE.BoxGeometry(1, 1, 1);
  var hazardMat = new THREE.MeshStandardMaterial({
    color: 0x330008, emissive: 0xff1144, emissiveIntensity: 1.1,
    roughness: 0.35, metalness: 0.2
  });
  var hazardEdgeGeo = new THREE.EdgesGeometry(hazardGeo);
  var hazardEdgeMat = new THREE.LineBasicMaterial({ color: 0xff88cc, transparent: true, opacity: 0.8 });

  function removeMesh(obj) {
    if (!obj || !obj.mesh) return;
    CR.R.scene.remove(obj.mesh);
  }

  function addCore(x, y, z) {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(coreGeo, coreMat));
    var halo = new THREE.Sprite(haloMat);
    halo.scale.set(1.6, 1.6, 1);
    g.add(halo);
    g.position.set(x, y, z);
    CR.R.scene.add(g);
    W.objects.push({
      type: 'core', mesh: g, x: x, y: y, z: z,
      phase: Math.random() * 6.28, dead: false
    });
  }

  function addHazard(x, z, opts) {
    opts = opts || {};
    var h = opts.tall ? 2.2 : 1.2;
    var m = new THREE.Mesh(hazardGeo, hazardMat);
    m.scale.set(1.9, h, 1.9);
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.add(new THREE.LineSegments(hazardEdgeGeo, hazardEdgeMat));
    CR.R.scene.add(m);
    W.objects.push({
      type: 'hazard', mesh: m, x: x, baseX: x, z: z,
      halfX: 0.95, halfZ: 0.95, top: h,
      drift: opts.drift || 0, phase: Math.random() * 6.28, dead: false
    });
  }

  W.spawnPattern = function (z) {
    var S = CR.State;
    var lanes = CR.LANES;
    var r = Math.random();
    var type;
    if (S.time < 10) {
      type = r < 0.7 ? 'cores' : 'hazard1';
    } else if (r < 0.26) type = 'cores';
    else if (r < 0.42) type = 'arc';
    else if (r < 0.60) type = 'hazard1';
    else if (r < 0.74) type = 'hazard2';
    else if (r < 0.87) type = 'gate';
    else type = 'mixed';

    var lane, lane2, i, n, safe;

    if (type === 'cores') {
      lane = CR.pick(lanes);
      n = 4 + Math.floor(Math.random() * 3);
      for (i = 0; i < n; i++) addCore(lane, 1.1, z - i * 2.1);
    } else if (type === 'arc') {
      lane = CR.pick(lanes);
      n = 5;
      for (i = 0; i < n; i++) {
        addCore(lane, 1.1 + Math.sin(i / (n - 1) * Math.PI) * 1.55, z - i * 2.1);
      }
    } else if (type === 'hazard1') {
      addHazard(CR.pick(lanes), z, { drift: S.time > 25 && Math.random() < 0.35 ? 1.8 : 0 });
    } else if (type === 'hazard2') {
      lane = CR.pick(lanes);
      lane2 = CR.pick(lanes);
      if (lane2 === lane) lane2 = lanes[(lanes.indexOf(lane) + 2) % lanes.length];
      addHazard(lane, z, {});
      addHazard(lane2, z, {});
    } else if (type === 'gate') {
      safe = CR.pick(lanes);
      for (i = 0; i < lanes.length; i++) {
        if (lanes[i] !== safe) addHazard(lanes[i], z, {});
      }
      addCore(safe, 1.1, z);
    } else {
      lane = CR.pick(lanes);
      lane2 = CR.pick(lanes);
      if (lane2 === lane) lane2 = lanes[(lanes.indexOf(lane) + 1) % lanes.length];
      addHazard(lane, z, {});
      for (i = 0; i < 3; i++) addCore(lane2, 1.1, z - i * 2.1);
    }
  };

  W.initialFill = function () {
    for (var z = -34; z > -160; z -= 12) W.spawnPattern(z);
    CR.State.spawnTimer = 0.6;
  };

  W.clear = function () {
    for (var i = 0; i < W.objects.length; i++) removeMesh(W.objects[i]);
    W.objects.length = 0;
  };

  W.reset = function () {
    W.clear();
    var P = W.Player;
    P.x = 0; P.feet = 0; P.vy = 0; P.jumps = 0;
    W.initialFill();
  };

  function updatePlayer(dt) {
    var I = CR.Input, S = CR.State, P = W.Player;

    var ax = I.joy.x;
    if (I.keys['KeyA'] || I.keys['ArrowLeft']) ax -= 1;
    if (I.keys['KeyD'] || I.keys['ArrowRight']) ax += 1;
    ax = CR.clamp(ax, -1, 1);

    var lateral = Math.max(9, S.speed * 0.85) * (S.dashTime > 0 ? 1.6 : 1);
    P.x = CR.clamp(P.x + ax * lateral * dt, -7.2, 7.2);

    if (I.jumpQueued) {
      if (P.jumps < CR.MAX_JUMPS) {
        P.vy = CR.JUMP_VEL * (P.jumps === 0 ? 1 : 0.92);
        P.jumps++;
        CR.Audio.jump();
        CR.R.spawnBurst(P.x, P.feet + 0.15, 0, 0x7df9ff, 6, 1.4);
      }
      I.jumpQueued = false;
    }

    if (I.dashQueued) {
      if (S.dashCd <= 0 && S.dashTime <= 0) {
        S.dashTime = CR.DASH_TIME;
        S.dashCd = CR.DASH_CD;
        CR.Audio.dash();
        CR.R.spawnBurst(P.x, P.feet + 0.8, 0, 0xff2bd6, 14, 2.4);
      }
      I.dashQueued = false;
    }

    if (S.dashTime > 0 && Math.random() < 0.65) {
      CR.R.spawnBurst(P.x, P.feet + CR.rand(0.2, 1.2), 0.2, 0x7df9ff, 2, 0.7);
    }

    P.vy -= CR.GRAVITY * dt;
    P.feet += P.vy * dt;
    if (P.feet <= 0) {
      P.feet = 0;
      P.vy = 0;
      P.jumps = 0;
    }

    CR.R.syncPlayer(P, S);
  }

  function collect(o) {
    var S = CR.State;
    o.dead = true;
    S.score += 10 * S.combo;
    S.combo = Math.min(9, S.combo + 1);
    S.comboTimer = 3.5;
    CR.Audio.collect(S.combo);
    CR.R.spawnBurst(o.x, o.mesh.position.y, o.z, 0xffdd00, 12, 2.4);
  }

  function damage() {
    var S = CR.State;
    if (S.invuln > 0 || S.mode !== 'PLAYING') return;
    S.hp--;
    S.invuln = 1.6;
    S.shake = 0.7;
    S.flash = 1;
    S.combo = 1;
    S.comboTimer = 0;
    CR.Audio.hit();
    CR.R.spawnBurst(W.Player.x, W.Player.feet + 0.8, 0, 0xff2255, 22, 3);
    if (CR.Game) {
      CR.Game.updateHearts();
      if (S.hp <= 0) CR.Game.gameOver();
    }
  }

  function updateObjects(dt) {
    var S = CR.State, P = W.Player;
    var objs = W.objects;

    for (var i = objs.length - 1; i >= 0; i--) {
      var o = objs[i];
      o.z += S.speed * dt;

      if (o.type === 'hazard') {
        if (o.drift) o.x = o.baseX + Math.sin(S.clock * 1.7 + o.phase) * o.drift;
        o.mesh.position.x = o.x;
      } else {
        o.mesh.rotation.y += dt * 2.6;
      }
      o.mesh.position.z = o.z;
      if (o.type === 'core') {
        o.mesh.position.y = o.y + Math.sin(S.clock * 3 + o.phase) * 0.08;
      }

      if (!o.dead && o.type === 'core') {
        if (Math.abs(o.z) < 1.0 && Math.abs(o.x - P.x) < 1.05) {
          var cy = o.mesh.position.y;
          if (cy > P.feet - 0.2 && cy < P.feet + 1.75) collect(o);
        }
      } else if (!o.dead && o.type === 'hazard') {
        if (Math.abs(o.z) < 1.5 &&
            Math.abs(o.x - P.x) < o.halfX + 0.5 &&
            P.feet < o.top - 0.05) {
          damage();
        }
      }

      if (o.dead || o.z > 16) {
        removeMesh(o);
        objs.splice(i, 1);
      }
    }
  }

  W.update = function (dt) {
    var S = CR.State;

    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) {
      var gap = Math.max(11, S.speed * 0.95);
      W.spawnPattern(-150);
      S.spawnTimer = gap / S.speed;
    }

    updatePlayer(dt);
    updateObjects(dt);
  };

  CR.World = W;
})(window.CR);
