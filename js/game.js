'use strict';
(function (CR) {
  var G = {};
  var els = {};
  var settingsReturn = 'menu';
  var lastTime = 0;
  var bannerTimer = null;

  var SCREENS = ['menu', 'help', 'settings', 'pause', 'gameover'];

  function cache() {
    [
      'hud', 'score', 'hudBest', 'combo', 'comboBar', 'sector', 'btnPause',
      'hearts', 'dashWrap', 'dashFill', 'dashState', 'fps', 'menu', 'help',
      'settings', 'pause', 'gameover', 'menuBest', 'btnPlay', 'btnSettings',
      'btnHelp', 'btnHelpBack', 'btnSettingsBack', 'btnFullscreen', 'btnResume',
      'btnPauseSettings', 'btnPauseRestart', 'btnPauseMenu', 'btnRetry',
      'btnGoMenu', 'goScore', 'goBest', 'newRecord', 'optQuality', 'optAdaptive',
      'optMusic', 'optSfx', 'optFps', 'banner', 'mobile', 'joystick', 'stick',
      'btnJump', 'btnDash', 'flash', 'fatal'
    ].forEach(function (id) { els[id] = CR.$(id); });
  }

  function showScreen(name) {
    SCREENS.forEach(function (k) {
      if (!els[k]) return;
      els[k].classList.toggle('hidden', k !== name);
    });
  }
  function hideScreens() {
    SCREENS.forEach(function (k) { if (els[k]) els[k].classList.add('hidden'); });
  }
  function setHudVisible(v) {
    els.hud.classList.toggle('hidden', !v);
  }
  function setMobileVisible(v) {
    els.mobile.classList.toggle('hidden', !(v && CR.IS_TOUCH));
  }
  function updateMenuBest() {
    els.menuBest.textContent = CR.pad(CR.State.best);
  }
  function showBanner(text) {
    els.banner.textContent = text;
    els.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { els.banner.classList.remove('show'); }, 2200);
  }

  G.updateHearts = function () {
    var S = CR.State, html = '';
    for (var i = 0; i < S.maxHp; i++) {
      html += '<span class="heart' + (i < S.hp ? '' : ' empty') + '">♥</span>';
    }
    els.hearts.innerHTML = html;
  };

  function updateHUD(force) {
    var S = CR.State;
    if (!force && !els.hud) return;
    els.score.textContent = CR.pad(S.score);
    els.hudBest.textContent = CR.pad(S.best);
    els.combo.textContent = 'x' + S.combo;
    els.combo.classList.toggle('on', S.combo > 1);
    els.comboBar.style.width = CR.clamp(S.comboTimer / 3.5 * 100, 0, 100) + '%';
    if (S.sector >= 0) {
      els.sector.textContent = 'SECTOR ' + (S.sector + 1) + ' · ' + CR.SECTORS[S.sector].name;
    }
    els.dashFill.style.width = CR.clamp((1 - S.dashCd / CR.DASH_CD) * 100, 0, 100) + '%';
    els.dashWrap.classList.toggle('ready', S.dashCd <= 0);
    els.dashState.textContent = S.dashCd <= 0 ? 'READY' : 'CHARGING';
    els.fps.style.display = CR.Settings.showFps ? '' : 'none';
    els.fps.textContent = Math.round(S.fps) + ' FPS';
  }

  function resetRun() {
    var S = CR.State;
    S.score = 0;
    S.combo = 1;
    S.comboTimer = 0;
    S.hp = S.maxHp;
    S.time = 0;
    S.distance = 0;
    S.speed = CR.BASE_SPEED;
    S.dashCd = 0;
    S.dashTime = 0;
    S.invuln = 0;
    S.shake = 0;
    S.flash = 0;
    S.spawnTimer = 0.6;
    S.sector = 0;
    S.adaptiveScale = 1;
    S.adaptiveCooldown = 0;
    S.hudTimer = 0;
    S.newRecord = false;

    CR.Input.joy.x = 0;
    CR.Input.jumpQueued = false;
    CR.Input.dashQueued = false;

    CR.R.applyPalette(0, true);
    CR.World.reset();
    G.updateHearts();
    updateHUD(true);
  }

  function startGame() {
    CR.Audio.init();
    CR.Audio.resume();
    CR.Audio.startMusic();
    resetRun();
    CR.State.mode = 'PLAYING';
    hideScreens();
    setHudVisible(true);
    setMobileVisible(true);
    CR.R.setPlayerVisible(true);
    showBanner('SECTOR 1 · NEON GRID');
    lastTime = performance.now();
  }

  function pauseGame() {
    var S = CR.State;
    if (S.mode !== 'PLAYING') return;
    S.mode = 'PAUSED';
    showScreen('pause');
    setMobileVisible(false);
  }

  function resumeGame() {
    var S = CR.State;
    if (S.mode !== 'PAUSED') return;
    S.mode = 'PLAYING';
    hideScreens();
    setHudVisible(true);
    setMobileVisible(true);
    lastTime = performance.now();
  }

  function quitToMenu() {
    CR.State.mode = 'MENU';
    CR.World.clear();
    CR.R.setPlayerVisible(false);
    setHudVisible(false);
    setMobileVisible(false);
    hideScreens();
    showScreen('menu');
    updateMenuBest();
  }

  G.gameOver = function () {
    var S = CR.State;
    if (S.mode === 'GAMEOVER') return;
    S.mode = 'GAMEOVER';
    S.newRecord = Math.floor(S.score) > S.best;
    if (S.newRecord) {
      S.best = Math.floor(S.score);
      CR.Store.set('chroma.best', S.best);
    }
    els.goScore.textContent = CR.pad(S.score);
    els.goBest.textContent = CR.pad(S.best);
    els.newRecord.classList.toggle('hidden', !S.newRecord);
    setHudVisible(false);
    setMobileVisible(false);
    showScreen('gameover');
    CR.Audio.gameover();
    CR.R.spawnBurst(CR.World.Player.x, CR.World.Player.feet + 0.8, 0, 0xff2bd6, 40, 4);
    updateMenuBest();
  };

  function sectorCheck() {
    var S = CR.State;
    var idx = Math.floor(S.distance / CR.SECTOR_LEN) % CR.SECTORS.length;
    if (idx !== S.sector) {
      S.sector = idx;
      CR.R.applyPalette(idx, false);
      showBanner('SECTOR ' + (idx + 1) + ' · ' + CR.SECTORS[idx].name);
    }
  }

  function update(dt) {
    var S = CR.State;
    S.time += dt;
    S.speed = Math.min(CR.MAX_SPEED, CR.BASE_SPEED + S.time * 0.11);
    S.distance += S.speed * dt;
    S.score += S.speed * dt * 0.8;

    if (S.comboTimer > 0) {
      S.comboTimer -= dt;
      if (S.comboTimer <= 0) S.combo = 1;
    }
    if (S.dashCd > 0) S.dashCd -= dt;
    if (S.dashTime > 0) S.dashTime -= dt;
    if (S.invuln > 0) S.invuln -= dt;

    sectorCheck();
    CR.World.update(dt);

    S.hudTimer -= dt;
    if (S.hudTimer <= 0) {
      S.hudTimer = 0.08;
      updateHUD();
    }
  }

  function adapt() {
    var S = CR.State;
    if (!CR.Settings.adaptive || S.mode !== 'PLAYING') return;
    if (S.adaptiveCooldown > 0) {
      S.adaptiveCooldown -= 0.5;
      return;
    }
    if (S.fps < 38 && S.adaptiveScale > 0.56) {
      S.adaptiveScale = Math.max(0.55, S.adaptiveScale - 0.08);
      CR.R.applyRendererScale();
      S.adaptiveCooldown = 2;
    } else if (S.fps > 56 && S.adaptiveScale < 1) {
      S.adaptiveScale = Math.min(1, S.adaptiveScale + 0.04);
      CR.R.applyRendererScale();
      S.adaptiveCooldown = 3;
    }
  }

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!isFinite(dt) || dt < 0) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;

    var S = CR.State;
    S.clock += dt;
    S.fpsAccum += dt;
    S.fpsFrames++;
    if (S.fpsAccum >= 0.5) {
      S.fps = S.fpsFrames / S.fpsAccum;
      S.fpsAccum = 0;
      S.fpsFrames = 0;
      adapt();
    }

    if (S.mode === 'PLAYING') update(dt);

    CR.R.updateDecor(dt, S.mode === 'PLAYING' ? S.speed : 5);
    CR.R.updateParticles(dt);
    CR.R.updateColors(dt);
    CR.R.updateCamera(dt);

    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2.2);
    els.flash.style.opacity = (S.flash * 0.8).toFixed(3);

    CR.R.render();
  }

  function toggleFullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      var p = el.requestFullscreen ? el.requestFullscreen() :
              (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
      if (p && p.catch) p.catch(function () {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  function syncSettingsUI() {
    els.optQuality.value = CR.Settings.quality;
    els.optAdaptive.checked = !!CR.Settings.adaptive;
    els.optMusic.checked = !!CR.Settings.music;
    els.optSfx.checked = !!CR.Settings.sfx;
    els.optFps.checked = !!CR.Settings.showFps;
  }

  function readSettingsUI(qualityChanged) {
    CR.Settings.quality = els.optQuality.value;
    CR.Settings.adaptive = els.optAdaptive.checked;
    CR.Settings.music = els.optMusic.checked;
    CR.Settings.sfx = els.optSfx.checked;
    CR.Settings.showFps = els.optFps.checked;
    CR.saveSettings();
    if (qualityChanged) CR.State.adaptiveScale = 1;
    CR.R.applyQuality();
    CR.Audio.setMusic(CR.Settings.music);
    CR.Audio.setSfx(CR.Settings.sfx);
    els.fps.style.display = CR.Settings.showFps ? '' : 'none';
  }

  function openSettings(from) {
    settingsReturn = from || 'menu';
    syncSettingsUI();
    showScreen('settings');
    setMobileVisible(false);
  }
  function closeSettings() {
    if (settingsReturn === 'pause') {
      showScreen('pause');
    } else {
      updateMenuBest();
      showScreen('menu');
    }
  }

  function bind() {
    els.btnPlay.addEventListener('click', startGame);
    els.btnSettings.addEventListener('click', function () { openSettings('menu'); });
    els.btnHelp.addEventListener('click', function () { showScreen('help'); });
    els.btnHelpBack.addEventListener('click', function () { showScreen('menu'); });
    els.btnSettingsBack.addEventListener('click', closeSettings);
    els.btnPause.addEventListener('click', pauseGame);
    els.btnResume.addEventListener('click', resumeGame);
    els.btnPauseSettings.addEventListener('click', function () { openSettings('pause'); });
    els.btnPauseRestart.addEventListener('click', startGame);
    els.btnPauseMenu.addEventListener('click', quitToMenu);
    els.btnRetry.addEventListener('click', startGame);
    els.btnGoMenu.addEventListener('click', quitToMenu);
    els.btnFullscreen.addEventListener('click', toggleFullscreen);

    els.optQuality.addEventListener('change', function () { readSettingsUI(true); });
    els.optAdaptive.addEventListener('change', function () { readSettingsUI(false); });
    els.optMusic.addEventListener('change', function () { readSettingsUI(false); });
    els.optSfx.addEventListener('change', function () { readSettingsUI(false); });
    els.optFps.addEventListener('change', function () { readSettingsUI(false); });

    window.addEventListener('keydown', function (e) {
      var S = CR.State;
      if (e.code === 'Escape') {
        if (S.mode === 'PLAYING') pauseGame();
        else if (S.mode === 'PAUSED') resumeGame();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'Enter') {
        if (S.mode === 'MENU' || S.mode === 'GAMEOVER') startGame();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && CR.State.mode === 'PLAYING') pauseGame();
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('button')) CR.Audio.click();
    });

    window.addEventListener('pointerdown', function () {
      CR.Audio.init();
      CR.Audio.resume();
    }, { once: true });
  }

  G.boot = function () {
    cache();
    if (typeof THREE === 'undefined') {
      els.fatal.classList.remove('hidden');
      return;
    }
    if (!CR.R.init()) {
      els.fatal.classList.remove('hidden');
      return;
    }
    CR.Input.init();
    bind();
    syncSettingsUI();
    readSettingsUI(false);
    updateMenuBest();
    G.updateHearts();
    updateHUD(true);
    CR.State.mode = 'MENU';
    showScreen('menu');
    setHudVisible(false);
    setMobileVisible(false);
    CR.R.setPlayerVisible(false);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  };

  CR.Game = G;
  G.boot();
})(window.CR);
