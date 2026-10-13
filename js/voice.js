// Voice input (wake word + fixed commands) and voice output, via the Web Speech API.
import { matchCommand, normalize } from './commands.js';

export class VoiceInput extends EventTarget {
  constructor({ lang, wakeWords, listeningTimeoutMs, isAlarmRinging }) {
    super();
    this.lang = lang;
    this.wakeWords = wakeWords;
    this.listeningTimeoutMs = listeningTimeoutMs;
    this.isAlarmRinging = isAlarmRinging;
    this.listeningUntil = 0;
    this.shouldRun = false;
    this.status = 'idle';
  }

  get supported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

  setWakeWords(words) { this.wakeWords = words.map(normalize).filter(Boolean); }

  start() {
    if (!this.supported) { this._setStatus('unsupported'); return; }
    if (this.rec) return;
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onstart = () => this._setStatus('on');
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alts = Array.from(res).map((a) => a.transcript);
        if (res.isFinal) this.handleFinal(alts);
        else if (alts.some((a) => this._findWake(a) >= 0)) this._wake();
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
        this.shouldRun = false;
        this._setStatus('off');
      } else if (e.error === 'network') {
        this._setStatus('offline');
      }
    };
    rec.onend = () => {
      if (this.shouldRun) setTimeout(() => { try { rec.start(); } catch { /* already started */ } }, 300);
    };
    this.rec = rec;
    this.shouldRun = true;
    try { rec.start(); } catch { this._setStatus('off'); }
  }

  /** Same pipeline as real speech; used by the Test controls. */
  simulate(text) { this.handleFinal([text]); }

  handleFinal(alts) {
    const alarmRinging = this.isAlarmRinging();
    let sawWakeOnly = false, sawUnknown = false;
    for (const alt of alts) {
      const words = normalize(alt).split(' ');
      const idx = this._findWakeIndex(words);
      if (idx < 0) continue;
      const rest = words.slice(idx + 1).join(' ');
      if (!rest) { sawWakeOnly = true; continue; }
      const match = matchCommand(rest, { alarmRinging });
      if (match) { this._command(match); return; }
      sawUnknown = true;
    }
    if (sawUnknown) { this.listeningUntil = 0; this._emit('unknown'); return; }
    if (sawWakeOnly) { this._wake(); return; }
    // Wake word was said on its own a moment ago: treat this phrase as the command.
    if (Date.now() < this.listeningUntil) {
      for (const alt of alts) {
        const match = matchCommand(alt, { alarmRinging });
        if (match) { this._command(match); return; }
      }
      this.listeningUntil = 0;
      this._emit('unknown');
    }
  }

  _findWake(text) { return this._findWakeIndex(normalize(text).split(' ')); }
  _findWakeIndex(words) { return words.findIndex((w) => this.wakeWords.includes(w)); }

  _wake() {
    this.listeningUntil = Date.now() + this.listeningTimeoutMs;
    this._emit('wake');
    clearTimeout(this._listenTimer);
    this._listenTimer = setTimeout(() => {
      if (Date.now() >= this.listeningUntil) this._emit('listening-end');
    }, this.listeningTimeoutMs + 50);
  }

  _command(match) {
    this.listeningUntil = 0;
    clearTimeout(this._listenTimer);
    this._emit('command', match);
  }

  _setStatus(s) { this.status = s; this._emit('status', s); }
  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
}

// ---------- Voice output ----------

let ttsVoice = null;
function pickVoice(lang) {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((v) => v.lang === lang)
    || voices.find((v) => v.lang?.startsWith('en-IN'))
    || voices.find((v) => v.lang?.startsWith('en-GB'))
    || voices.find((v) => v.lang?.startsWith('en'))
    || null;
}

/** Make recipe text sound natural when spoken. */
export function speechify(text) {
  return String(text || '')
    .replace(/½\s*(tsp|tbsp|cup)/g, (_, u) => `half a ${u}`)
    .replace(/½/g, 'half')
    .replace(/¼/g, 'a quarter')
    .replace(/\b(\d+)\s*tbsp\b/g, (_, n) => `${n} tablespoon${n === '1' ? '' : 's'}`)
    .replace(/\btbsp\b/g, 'tablespoon')
    .replace(/\b(\d+)\s*tsp\b/g, (_, n) => `${n} teaspoon${n === '1' ? '' : 's'}`)
    .replace(/\btsp\b/g, 'teaspoon')
    .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2')
    .replace(/~\s*/g, 'about ')
    .replace(/\s\+\s/g, ', and ')
    .replace(/\bmin\b/g, 'minutes')
    .replace(/\bsec\b/g, 'seconds');
}

/**
 * Speaks a list of short parts one after another, and can pause/resume.
 * Pausing stops at the current sentence and resumes from its start, which works
 * the same in every browser (speechSynthesis.pause() is unreliable on Android).
 * Emits 'state' with 'speaking' | 'paused' | 'idle'.
 */
class Narrator extends EventTarget {
  constructor() { super(); this.parts = []; this.index = 0; this.state = 'idle'; this.run = 0; }

  speak(parts, { lang, rate } = {}) {
    this.opts = { lang, rate };
    this.parts = [].concat(parts).filter(Boolean);
    this.index = 0;
    this._play();
  }

  pause() {
    if (this.state !== 'speaking') return;
    this.run++;                       // invalidate callbacks of the cancelled utterance
    window.speechSynthesis?.cancel();
    this._set('paused');
  }

  resume() { if (this.state === 'paused') this._play(); }

  stop() { this.run++; window.speechSynthesis?.cancel(); this.parts = []; this._set('idle'); }

  _play() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const run = ++this.run;
    synth.cancel();
    if (this.index >= this.parts.length) { this._set('idle'); return; }
    ttsVoice = ttsVoice || pickVoice(this.opts.lang);
    this._set('speaking');
    const next = () => {
      if (run !== this.run) return;
      if (this.index >= this.parts.length) { this._set('idle'); return; }
      const u = new SpeechSynthesisUtterance(speechify(this.parts[this.index]));
      if (ttsVoice) u.voice = ttsVoice;
      u.lang = ttsVoice?.lang || this.opts.lang;
      u.rate = this.opts.rate || 1;
      u.onend = () => { if (run === this.run) { this.index++; next(); } };
      u.onerror = u.onend;
      synth.speak(u);
    };
    next();
  }

  _set(s) {
    if (this.state === s) return;
    this.state = s;
    this.dispatchEvent(new CustomEvent('state', { detail: s }));
  }
}

export const narrator = new Narrator();
export function speak(parts, opts) { narrator.speak(parts, opts); }

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => { ttsVoice = null; });
}

