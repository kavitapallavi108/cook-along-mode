// Looping alarm sound generated with Web Audio (no audio file needed).
export class AlarmSound {
  constructor() { this.ctx = null; this.loop = null; }

  /** Must be called from a user gesture once, so the browser allows sound later. */
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    // A silent blip fully unlocks audio on iPad Safari.
    const g = this.ctx.createGain(); g.gain.value = 0;
    const o = this.ctx.createOscillator(); o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.01);
  }

  get playing() { return !!this.loop; }

  start() {
    if (this.loop) return;
    this.unlock();
    if (!this.ctx) return;
    const pattern = () => {
      const t0 = this.ctx.currentTime + 0.03;
      [0, 0.26, 0.52].forEach((dt, i) => this._beep(t0 + dt, i === 1 ? 880 : 1175, 0.2));
    };
    pattern();
    this.loop = setInterval(pattern, 1300);
  }

  stop() { clearInterval(this.loop); this.loop = null; }

  _beep(t, freq, dur) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.setValueAtTime(0.22, t + dur - 0.03);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}
