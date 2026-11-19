'use strict';
(function (CR) {
  var A = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    musicTimer: null, step: 0,

    init: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.75;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = CR.Settings.music ? 0.14 : 0;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = CR.Settings.sfx ? 0.5 : 0;
      this.sfxGain.connect(this.master);
    },

    resume: function () {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    setMusic: function (on) {
      if (this.musicGain) this.musicGain.gain.value = on ? 0.14 : 0;
    },

    setSfx: function (on) {
      if (this.sfxGain) this.sfxGain.gain.value = on ? 0.5 : 0;
    },

    tone: function (freq, dur, type, vol, slide, dest) {
      if (!this.ctx) return;
      dest = dest || this.sfxGain;
      var t = this.ctx.currentTime;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol || 0.25), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + dur + 0.03);
    },

    click: function () { if (CR.Settings.sfx) this.tone(620, 0.05, 'square', 0.12); },
    jump: function () { if (CR.Settings.sfx) this.tone(320, 0.14, 'square', 0.16, 640); },
    dash: function () { if (CR.Settings.sfx) this.tone(220, 0.18, 'sawtooth', 0.18, 880); },
    hit: function () { if (CR.Settings.sfx) this.tone(180, 0.25, 'sawtooth', 0.3, 55); },

    collect: function (combo) {
      if (!CR.Settings.sfx) return;
      var f = 660 * Math.pow(1.055, Math.min(combo, 9));
      this.tone(f, 0.09, 'sine', 0.2);
      var self = this;
      setTimeout(function () { self.tone(f * 1.5, 0.08, 'sine', 0.12); }, 55);
    },

    gameover: function () {
      if (!CR.Settings.sfx) return;
      var self = this;
      [440, 330, 220, 165].forEach(function (f, i) {
        setTimeout(function () { self.tone(f, 0.22, 'triangle', 0.22); }, i * 130);
      });
    },

    startMusic: function () {
      if (this.musicTimer || !this.ctx) return;
      var self = this;
      var bass = [110, 110, 146.8, 110, 98, 98, 130.8, 146.8];
      var lead = [440, 523.3, 659.3, 523.3, 392, 493.9, 587.3, 493.9];
      this.step = 0;
      this.musicTimer = setInterval(function () {
        if (!self.ctx || CR.State.mode !== 'PLAYING' || !CR.Settings.music) return;
        self.tone(bass[self.step % 8], 0.16, 'triangle', 0.28, 0, self.musicGain);
        if (self.step % 2 === 0) {
          self.tone(lead[(self.step / 2) % 8], 0.1, 'square', 0.05, 0, self.musicGain);
        }
        self.step++;
      }, 165);
    }
  };

  CR.Audio = A;
})(window.CR);
