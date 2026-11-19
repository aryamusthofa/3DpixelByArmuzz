'use strict';
window.CR = window.CR || {};
(function (CR) {
  CR.$ = function (id) { return document.getElementById(id); };
  CR.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  CR.rand = function (a, b) { return a + Math.random() * (b - a); };
  CR.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  CR.pad = function (n) {
    n = Math.max(0, Math.floor(n));
    var s = String(n);
    while (s.length < 6) s = '0' + s;
    return s;
  };
  CR.IS_TOUCH = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);

  var Store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };
  CR.Store = Store;

  var defaults = { quality: 'medium', adaptive: true, music: true, sfx: true, showFps: true };
  var loaded = Store.get('chroma.settings', {});
  CR.Settings = Object.assign({}, defaults, loaded || {});
  if (!CR.Settings.quality) CR.Settings.quality = 'medium';
  CR.saveSettings = function () { Store.set('chroma.settings', CR.Settings); };

  CR.QUALITY = {
    low:    { scale: 0.55, shadows: false, stars: 140, particles: 180, decor: 34 },
    medium: { scale: 0.80, shadows: true,  stars: 280, particles: 340, decor: 48 },
    high:   { scale: 1.00, shadows: true,  stars: 420, particles: 520, decor: 64 },
    ultra:  { scale: 1.50, shadows: true,  stars: 600, particles: 700, decor: 80 }
  };

  CR.State = {
    mode: 'BOOT',
    score: 0,
    best: Store.get('chroma.best', 0) || 0,
    combo: 1, comboTimer: 0,
    hp: 3, maxHp: 3,
    time: 0, clock: 0, distance: 0, speed: 9,
    sector: -1, spawnTimer: 0,
    dashCd: 0, dashTime: 0, invuln: 0,
    shake: 0, flash: 0,
    fps: 60, fpsAccum: 0, fpsFrames: 0,
    adaptiveCooldown: 0, adaptiveScale: 1,
    hudTimer: 0,
    newRecord: false
  };

  CR.SECTORS = [
    { name: 'NEON GRID',   fog: 0x04030a, c1: 0x00f0ff, c2: 0xff2bd6, ground: 0x070710 },
    { name: 'SOLAR FLARE', fog: 0x120402, c1: 0xff8a00, c2: 0xff2b5c, ground: 0x140706 },
    { name: 'VOID GARDEN', fog: 0x020a06, c1: 0x2bff9e, c2: 0xaaff00, ground: 0x06120c },
    { name: 'GLITCH SEA',  fog: 0x06020a, c1: 0x9b5cff, c2: 0x00ddff, ground: 0x0a0814 }
  ];

  CR.LANES = [-6, -3, 0, 3, 6];
  CR.GRAVITY = 34;
  CR.JUMP_VEL = 11;
  CR.MAX_JUMPS = 2;
  CR.BASE_SPEED = 9;
  CR.MAX_SPEED = 24;
  CR.DASH_CD = 2.2;
  CR.DASH_TIME = 0.24;
  CR.SECTOR_LEN = 450;
})(window.CR);
