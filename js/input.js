'use strict';
(function (CR) {
  var I = { keys: {}, joy: { x: 0 }, jumpQueued: false, dashQueued: false };
  var joyPointer = null, joyBase = null, stick = null;

  function moveJoy(e) {
    var r = joyBase.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var max = r.width * 0.36;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    I.joy.x = CR.clamp(dx / max, -1, 1);
    stick.style.transform = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))';
  }

  I.init = function () {
    joyBase = CR.$('joystick');
    stick = CR.$('stick');

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      I.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        I.jumpQueued = true;
        e.preventDefault();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') {
        I.dashQueued = true;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' ||
          e.code === 'ArrowRight' || e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', function (e) { I.keys[e.code] = false; });

    var jumpBtn = CR.$('btnJump');
    var dashBtn = CR.$('btnDash');
    if (jumpBtn) jumpBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); I.jumpQueued = true; });
    if (dashBtn) dashBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); I.dashQueued = true; });

    if (joyBase) {
      joyBase.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        joyPointer = e.pointerId;
        try { joyBase.setPointerCapture(joyPointer); } catch (err) {}
        moveJoy(e);
      });
      joyBase.addEventListener('pointermove', function (e) {
        if (e.pointerId === joyPointer) moveJoy(e);
      });
      var end = function (e) {
        if (e.pointerId !== joyPointer) return;
        joyPointer = null;
        I.joy.x = 0;
        stick.style.transform = 'translate(-50%,-50%)';
      };
      joyBase.addEventListener('pointerup', end);
      joyBase.addEventListener('pointercancel', end);
    }
  };

  CR.Input = I;
})(window.CR);
