// Cook-Along Mode — main app.
import { CONFIG } from './config.js';
import { VoiceInput, speak, narrator } from './voice.js';
import { COMMAND_LABELS, bestNameMatch, normalize } from './commands.js';
import { AlarmSound } from './alarm.js';
import { DistanceSensor } from './distance.js';
import { artSvg, ingredientThumb } from './art.js';
import { INTRO, THEMES } from './intro.js';

const MATERIAL_WEB = 'https://cdn.jsdelivr.net/npm/@material/web@2.3.0/all.js/+esm';
const DESIGN_W = 1194, DESIGN_H = 834;   // iPad 11" landscape, in pt
const STORE_KEY = 'cookalong:state:v1';
const SETTINGS_KEY = 'cookalong:settings:v1';
const CUE_ICON = { time: 'timer', whistle: 'sports', look: 'visibility' };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('app');

function loadJSON(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } }
function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } }

// ---------- State ----------
let recipe = null;
let catalog = { categories: [], recipes: [] };
let category = 'All';
const state = { screen: 'recipes', introIndex: 0, stepIndex: 0, completed: [], timers: [], panelOpen: false };
const settings = Object.assign(
  { theme: 'light', fastTimers: false, wakeWord: CONFIG.wakeWord, distanceMode: 'auto', calibrationK: null },
  loadJSON(SETTINGS_KEY) || {},
);
let started = false;
let cameraStatus = 'pending';
let sensorState = 'far';
let lastReading = null;

function save() {
  const { screen, introIndex, stepIndex, completed, timers } = state;
  saveJSON(STORE_KEY, { screen, introIndex, stepIndex, completed, timers });
}
function saveSettings() { saveJSON(SETTINGS_KEY, settings); }

function restore() {
  const s = loadJSON(STORE_KEY);
  if (!s) return;
  if (['recipes', 'intro', 'prep', 'step', 'done'].includes(s.screen)) state.screen = s.screen;
  if (Number.isInteger(s.introIndex) && s.introIndex >= 0 && s.introIndex < INTRO.length) state.introIndex = s.introIndex;
  if (Number.isInteger(s.stepIndex) && s.stepIndex >= 0 && s.stepIndex < recipe.steps.length) state.stepIndex = s.stepIndex;
  if (Array.isArray(s.completed)) state.completed = s.completed.filter(Number.isInteger);
  if (Array.isArray(s.timers)) state.timers = s.timers.filter((t) => t && t.id && t.startedAt && t.durationMs);
}

const current = () => recipe.steps[state.stepIndex];
const wakeWord = () => (settings.wakeWord || CONFIG.wakeWord).trim().split(/\s+/)[0];

// ---------- Services ----------
const alarm = new AlarmSound();
const voice = new VoiceInput({
  lang: CONFIG.recognitionLang,
  wakeWords: [],
  listeningTimeoutMs: CONFIG.listeningTimeoutMs,
  isAlarmRinging: () => ringingTimers().length > 0,
});
let sensor = null;

function applyWakeWord() {
  const w = normalize(wakeWord());
  voice.setWakeWords(w === normalize(CONFIG.wakeWord) ? [w, ...CONFIG.wakeWordAliases] : [w]);
  document.querySelectorAll('.wake').forEach((el) => { el.textContent = wakeWord(); });
  $('simField')?.setAttribute('placeholder', `e.g. ${wakeWord()} next`);
  renderVoicePill();
}

function say(parts) { speak(parts, { lang: CONFIG.speechLang, rate: CONFIG.speechRate }); }

// ---------- Stage scaling ----------
function fitStage() {
  const s = Math.min(innerWidth / DESIGN_W, innerHeight / DESIGN_H);
  const r = document.documentElement.style;
  r.setProperty('--scale', s);
  r.setProperty('--stage-w', `${innerWidth / s}px`);
  r.setProperty('--stage-h', `${innerHeight / s}px`);
  const el = $('stage').querySelector('.step:not(.exit-next):not(.exit-prev)');
  if (el && state.screen === 'step') fitStep(el);
}

// ---------- Screens ----------
function showScreen() {
  app.dataset.screen = state.screen;
  $('recipesScreen').hidden = state.screen !== 'recipes';
  $('introScreen').hidden = state.screen !== 'intro';
  if (state.screen === 'intro') renderIntro();
  $('prepScreen').hidden = state.screen !== 'prep';
  $('stepScreen').hidden = state.screen !== 'step';
  $('doneScreen').hidden = state.screen !== 'done';
  $('panelToggle').hidden = state.screen !== 'step';
  if (state.screen !== 'step') closePanel();
  fitStage();
  lastAlarmKey = '';   // re-place a ringing alarm (button on the cook screen, banner elsewhere)
  tick();
}

// ---------- Recipes (choose what to cook) ----------
function renderRecipes() {
  const h = new Date().getHours();
  $('greet').textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('catRow').innerHTML = catalog.categories
    .map((c) => `<button class="cat${c === category ? ' active' : ''}" role="tab" aria-selected="${c === category}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  const list = catalog.recipes.filter((r) => category === 'All' || r.category === category);
  $('recipeGrid').innerHTML = list.map((r) => `
    <button class="recipe-card" data-id="${esc(r.id)}" aria-label="${esc(r.title)}">
      <div class="thumb">${artSvg(r.art, r.title)}</div>
      <div class="body">
        <span class="name">${esc(r.title)}</span>
        <span class="meta"><span><md-icon>schedule</md-icon>${esc(r.time)}</span><span><md-icon>signal_cellular_alt</md-icon>${esc(r.level)}</span><span><md-icon>star</md-icon>${r.rating}</span></span>
      </div>
    </button>`).join('');
}

function openRecipe(id) {
  const r = catalog.recipes.find((x) => x.id === id);
  if (!r || !r.available) return;   // only Dal tadka is built in this prototype
  state.screen = 'intro'; state.introIndex = 0;
  save(); showScreen(); speakIntro();
}

// ---------- Feature intro: Voice · Distance · Alarms ----------
function renderIntro() {
  const it = INTRO[state.introIndex];
  const box = $('intro');
  const theme = THEMES[it.key];
  box.style.setProperty('--feat-tint', theme.tint);
  box.style.setProperty('--feat-mid', theme.mid);
  box.style.setProperty('--feat-deep', theme.deep);
  $('introArt').innerHTML = it.art;
  attachPhoto($('introArt'), `images/intro-${it.key}.jpg`);   // your own illustration, if present
  $('introCount').textContent = `${state.introIndex + 1} of ${INTRO.length}`;
  $('introKicker').textContent = it.kicker;
  $('introTitle').textContent = it.title;
  $('introBody').textContent = it.body;
  $('introChips').innerHTML = it.chips.map((c) => `<span>${esc(c)}</span>`).join('');
  const icon = { voice: 'mic', distance: 'videocam', alarm: 'touch_app' }[it.key];
  $('introTry').innerHTML = `<md-icon>${icon}</md-icon><span>${it.tryIt}</span>`;
  $('introDots').innerHTML = INTRO.map((_, i) => `<i class="${i === state.introIndex ? 'on' : ''}"></i>`).join('');
  $('introNextLabel').textContent = state.introIndex === INTRO.length - 1 ? 'See ingredients' : 'Next';
  document.querySelectorAll('.wake').forEach((el) => { el.textContent = wakeWord(); });
  box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');
}
function speakIntro() {
  const it = INTRO[state.introIndex];
  say([it.title + '.', it.body]);
}
function skipIntro() { state.screen = 'prep'; save(); showScreen(); speakPrep(); }

function renderPrep() {
  $('prepTitle').textContent = recipe.title;
  $('prepServings').textContent = `${recipe.servings} servings`;
  $('prepTime').textContent = recipe.totalTime;
  $('prepIngredients').innerHTML = recipe.ingredients
    .map((i) => `<li>${ingredientThumb(i.id)}<span class="txt"><span class="name">${esc(i.name)}</span><span class="qty-s">${esc(i.quantity)}</span></span></li>`).join('');
  $('prepPhoto').innerHTML = artSvg('final', `${recipe.title}, ready to serve`);
  attachPhoto($('prepPhoto'), recipe.finalPhoto);
  $('doneTitle').textContent = `${recipe.title} is ready`;
  $('donePhoto').innerHTML = artSvg('final', `${recipe.title}, ready to serve`);
  attachPhoto($('donePhoto'), recipe.finalPhoto);
}

// ---------- Step screen ----------
const photoOk = new Map();
function attachPhoto(container, src) {
  if (!src || photoOk.get(src) === false) return;
  const img = new Image();
  img.alt = '';
  img.onload = () => { photoOk.set(src, true); container.querySelector('svg')?.remove(); container.prepend(img); };
  img.onerror = () => photoOk.set(src, false);
  img.src = src;
}

// Never split a quantity from its unit across lines ("½ tsp", "1 green chilli").
const keepTogether = (s) => s.replace(/(\d|½|¼) (\S+)/g, '$1 $2');

function buildStep(step) {
  const el = document.createElement('article');
  el.className = 'step';
  const name = (id) => recipe.ingredients.find((i) => i.id === id)?.name || id;
  el.innerHTML = `
    <figure class="photo">
      ${artSvg(step.art, `What it looks like when done: ${step.cue || step.action}`)}
      <figcaption class="photo-label"><md-icon>visibility</md-icon>Done looks like this</figcaption>
    </figure>
    <div class="step-text" data-mode="${distanceMode()}">
      <p class="step-num"><b class="num">Step ${step.number}</b> <span class="of">of ${recipe.steps.length}</span></p>
      <h1 class="action">${esc(step.action)}</h1>
      ${step.actionQuantity ? `<p class="qty">${esc(keepTogether(step.actionQuantity))}</p>` : ''}
      ${step.cue ? `<p class="cue"><md-icon>${step.cueIcon || CUE_ICON[step.cueType] || 'visibility'}</md-icon><span>${esc(step.cue)}</span></p>` : ''}
      <div class="close-only">
        ${step.details ? `<p class="details">${esc(step.details)}</p>` : ''}
        ${step.ingredients.length ? `<ul class="step-ingredients">${step.ingredients.map((i) => `<li><b>${esc(name(i.id))}</b> · ${esc(i.quantity)}</li>`).join('')}</ul>` : ''}
        ${step.parallelHint ? `<p class="hint"><md-icon>alt_route</md-icon><span>${esc(step.parallelHint)}</span></p>` : ''}
      </div>
    </div>
    ${step.process ? `<ol class="process" aria-label="How to do it">
      ${step.process.map((p, i) => `<li><span class="pic">${artSvg(p.art, p.caption)}<b>${i + 1}</b></span><span class="cap">${esc(p.caption)}</span></li>`).join('')}
    </ol>` : ''}`;
  if (step.process) el.classList.add('has-process');
  attachPhoto(el.querySelector('.photo'), step.photo);
  return el;
}

/** Shrink type only if a step's text would overflow its column (per distance mode). */
function fitStep(el) {
  const text = el.querySelector('.step-text');
  const mode = text.dataset.mode;
  el.classList.add('measuring');
  for (const m of ['far', 'close']) {
    text.dataset.mode = m;
    let fit = 1;
    el.style.setProperty(`--fit-${m}`, fit);
    while (fit > 0.7 && text.scrollHeight > text.clientHeight + 1) {
      fit = Math.round((fit - 0.02) * 100) / 100;
      el.style.setProperty(`--fit-${m}`, fit);
    }
  }
  text.dataset.mode = mode;
  void text.offsetHeight;
  el.classList.remove('measuring');
}

function renderStep(dir = 0, { speakIt = true } = {}) {
  const stage = $('stage');
  const old = [...stage.querySelectorAll('.step')];
  const el = buildStep(current());
  stage.append(el);
  fitStep(el);
  for (const o of old) {
    if (dir) { o.classList.add(dir > 0 ? 'exit-next' : 'exit-prev'); setTimeout(() => o.remove(), 240); }
    else o.remove();
  }
  if (dir) el.classList.add(dir > 0 ? 'enter-next' : 'enter-prev');
  el.querySelector('.step-num').classList.add('flash');
  renderStepper();
  renderBottomBar();
  renderPanel();
  if (speakIt) speakStep();
}

// Minimal stepper at the top: numbered dots on a line, name underneath; tap to jump.
function renderStepper() {
  const n = recipe.steps.length;
  const pct = n > 1 ? (state.stepIndex / (n - 1)) * 100 : 0;
  $('stepper').style.setProperty('--progress', `${pct}%`);
  $('stepper').innerHTML = recipe.steps.map((s, i) => {
    // A tick only for steps the cook has finished AND moved past; anything ahead shows its number.
    const cur = i === state.stepIndex, done = i < state.stepIndex && state.completed.includes(s.number);
    const cls = cur ? 'current' : done ? 'completed' : '';
    return `<button class="seg ${cls}" data-index="${i}" aria-label="Step ${s.number}, ${esc(s.short)}${cur ? ', current' : done ? ', done' : ''}"${cur ? ' aria-current="step"' : ''}>
      <span class="dot">${done ? '<md-icon>check</md-icon>' : s.number}</span></button>`;
  }).join('');
}

function renderBottomBar() {
  if (state.screen !== 'step') return;
  const last = state.stepIndex === recipe.steps.length - 1;
  $('nextBtnLabel').textContent = last ? 'Finish' : 'Next';
  $('nextBtnIcon').textContent = last ? 'check' : 'arrow_forward';
  updateTimerButton();
}

// Timers live on the bottom bar, never at the top:
//  - Timer button: this step's own timer → "Start timer", then its countdown (or red "Tap to stop")
//  - Run button: another step's timer that is still running (or ringing), shown beside it
//  Both can be visible together, so a running timer never hides "Start timer". Next fills what's left.
function setBtn(prefix, { icon, label, sub, ringing, running }) {
  const btn = $(`${prefix}Btn`);
  btn.classList.toggle('ringing', !!ringing);
  btn.classList.toggle('running', !!running);
  btn.querySelector('md-icon').textContent = icon;
  if ($(`${prefix}BtnLabel`).textContent !== label) $(`${prefix}BtnLabel`).textContent = label;
  if ($(`${prefix}BtnSub`).textContent !== sub) $(`${prefix}BtnSub`).textContent = sub;
}
function updateTimerButton() {
  if (state.screen !== 'step') return;
  const step = current();
  const now = Date.now();
  const ringing = started ? ringingTimers(now) : [];
  const isRinging = (t) => ringing.includes(t);
  const left = (t) => (remaining(t, now) <= 0 ? 'Done' : `${fmt(remaining(t, now))} left`);

  // This step's timer
  const mine = state.timers.find((x) => x.stepNumber === step.number);
  $('timerBtn').hidden = !step.timer;
  if (step.timer) {
    if (mine && isRinging(mine)) setBtn('timer', { icon: 'notifications_active', label: 'Tap to stop', sub: `${mine.name} done`, ringing: true });
    else if (mine) setBtn('timer', { icon: 'timer', label: left(mine), sub: mine.name, running: true });
    else setBtn('timer', { icon: 'timer', label: 'Start timer', sub: '' });
  }

  // Other steps' timers: a ringing one first (oldest-started), else the one ending soonest
  const others = state.timers.filter((x) => x !== mine)
    .sort((a, b) => (isRinging(b) - isRinging(a)) || (isRinging(a) ? a.startedAt - b.startedAt : remaining(a, now) - remaining(b, now)));
  const o = others[0];
  $('runBtn').hidden = !o;
  if (o) {
    const more = others.length > 1 ? ` · +${others.length - 1}` : '';
    if (isRinging(o)) setBtn('run', { icon: 'notifications_active', label: 'Tap to stop', sub: `Step ${o.stepNumber} · ${o.name} done${more}`, ringing: true });
    else setBtn('run', { icon: 'timer', label: left(o), sub: `Step ${o.stepNumber} · ${o.name}${more}`, running: true });
  }
}
function speakStep() {
  const s = current();
  say([`Step ${s.number}.`, s.action + (s.actionQuantity ? `. ${s.actionQuantity}.` : '.'), s.cue, s.details, s.parallelHint]);
}
function speakPrep() {
  say([`${recipe.title}.`, 'Get everything ready before you start.', 'When you are ready, tap Start cooking, or say the wake word, then next.']);
}

// ---------- Navigation ----------
function markCompleted(n) { if (!state.completed.includes(n)) state.completed.push(n); }

function startCooking() {
  state.screen = 'step'; state.stepIndex = 0;
  save(); showScreen(); renderStep(1);
}
function goNext() {
  if (state.screen === 'recipes') return openRecipe(recipe.id);
  if (state.screen === 'intro') {
    if (state.introIndex >= INTRO.length - 1) return skipIntro();
    state.introIndex++; save(); renderIntro(); speakIntro(); return;
  }
  if (state.screen === 'prep') return startCooking();
  if (state.screen === 'done') return finishRecipe();
  markCompleted(current().number);
  if (state.stepIndex >= recipe.steps.length - 1) return showDone();
  state.stepIndex++;
  save(); renderStep(1);
}
function goBack() {
  if (state.screen === 'recipes') return;
  if (state.screen === 'intro') {
    if (state.introIndex === 0) { state.screen = 'recipes'; save(); showScreen(); return; }
    state.introIndex--; save(); renderIntro(); speakIntro(); return;
  }
  if (state.screen === 'prep') { state.screen = 'intro'; state.introIndex = INTRO.length - 1; save(); showScreen(); return; }
  if (state.screen === 'done') { state.screen = 'step'; save(); showScreen(); renderStep(-1); return; }
  if (state.stepIndex === 0) { state.screen = 'prep'; save(); showScreen(); speakPrep(); return; }
  state.stepIndex--;
  save(); renderStep(-1);
}
function jumpTo(i) {
  if (i === state.stepIndex) return;
  const dir = i > state.stepIndex ? 1 : -1;
  if (dir > 0) markCompleted(current().number);
  state.stepIndex = i;
  save(); renderStep(dir);
}
function showDone() {
  state.screen = 'done';
  save(); showScreen();
  say([`${recipe.title} is ready.`, 'Enjoy your meal!']);
}
function finishRecipe() {
  resetRecipe();
  showScreen();
}
function resetRecipe() {
  state.screen = 'recipes'; state.stepIndex = 0; state.completed = []; state.timers = [];
  save(); tick();
}

function repeat() {
  if (state.screen === 'recipes') say(['Choose a recipe.', `${recipe.title} is ready for cook-along.`]);
  else if (state.screen === 'intro') speakIntro();
  else if (state.screen === 'step') speakStep();
  else if (state.screen === 'prep') speakPrep();
  else say([`${recipe.title} is ready.`]);
}

// ---------- Timers ----------
const remaining = (t, now = Date.now()) => t.startedAt + t.durationMs - now;
const ringingTimers = (now = Date.now()) => state.timers.filter((t) => remaining(t, now) <= 0).sort((a, b) => a.startedAt - b.startedAt);
function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function spokenDuration(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return [m ? `${m} minute${m > 1 ? 's' : ''}` : '', s ? `${s} seconds` : ''].filter(Boolean).join(' ');
}

function startTimer() {
  const step = state.screen === 'step' ? current() : null;
  if (!step || !step.timer) return feedback('No timer for this step.');
  if (state.timers.some((t) => t.stepNumber === step.number)) return feedback('Timer already running.');
  const durationMs = (step.timer.durationSec * 1000) / (settings.fastTimers ? 10 : 1);
  state.timers.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: step.timer.name, stepNumber: step.number, startedAt: Date.now(), durationMs,
  });
  save(); tick();
  say([`Timer started. ${step.timer.name}, ${spokenDuration(durationMs / 1000)}.`]);
}

function removeTimer(id) {
  state.timers = state.timers.filter((t) => t.id !== id);
  save(); tick();
}

function stopAlarm() {
  const ringing = ringingTimers();
  if (!ringing.length) return;
  removeTimer(ringing[0].id);   // oldest-started first
}

function cancelTimer(name) {
  const running = state.timers;
  if (!running.length) return feedback('No timers are running.');
  if (!name) {
    if (running.length === 1) { removeTimer(running[0].id); return feedback(`Cancelled ${running[0].name}.`, false); }
    return feedback(`Which timer? Running: ${running.map((t) => t.name).join(', ')}.`);
  }
  const t = bestNameMatch(name, running);
  if (!t) return feedback(`No timer called ${name}. Running: ${running.map((x) => x.name).join(', ')}.`);
  removeTimer(t.id);
  feedback(`Cancelled ${t.name}.`, false);
}

let lastAlarmKey = '';
function tick() {
  const now = Date.now();
  renderPanelTimers(now);
  updateTimerButton();
  const ringing = started ? ringingTimers(now) : [];
  const key = ringing.map((t) => t.id).join(',');
  if (key !== lastAlarmKey) { lastAlarmKey = key; renderAlarm(ringing); }
}

function renderAlarm(ringing) {
  const el = $('alarm');
  if (!ringing.length) { el.hidden = true; alarm.stop(); return; }
  alarm.start();
  // On the cook screen the alarm lives on the timer button; elsewhere fall back to the banner.
  if (state.screen === 'step') { el.hidden = true; return; }
  const t = ringing[0];
  const sameStep = state.screen === 'step' && current().number === t.stepNumber;
  $('alarmTitle').textContent = sameStep ? `${t.name} is done` : `Step ${t.stepNumber}: ${t.name} is done`;
  $('alarmSub').textContent = `Touch anywhere or say “${wakeWord()}, stop alarm”`
    + (ringing.length > 1 ? ` · ${ringing.length - 1} more ringing` : '');
  el.hidden = false;
}

// ---------- Side panel ----------
function ingredientUses(id) {
  return recipe.steps
    .filter((s) => s.ingredients.some((i) => i.id === id))
    .map((s) => ({ step: s.number, quantity: s.ingredients.find((i) => i.id === id).quantity }));
}

// Every use of an ingredient is its own row, grouped by Now / Coming up / Used,
// so a multi-use ingredient (salt) shows each quantity with its step.
function renderPanel() {
  const cur = state.screen === 'step' ? current().number : null;
  const groups = { now: [], next: [], used: [] };
  for (const s of recipe.steps) {
    for (const use of s.ingredients) {
      const ing = recipe.ingredients.find((i) => i.id === use.id);
      const item = { ing, quantity: use.quantity, step: s.number };
      if (s.number === cur) groups.now.push(item);
      else if (state.completed.includes(s.number)) groups.used.push(item);
      else groups.next.push(item);
    }
  }
  // "4 cloves, chopped" → quantity "4 cloves" on the right, "chopped" under the name.
  const row = (it, status) => {
    const [qty, ...rest] = it.quantity.split(',');
    const note = rest.join(',').trim();
    const st = [status(it), note].filter(Boolean).join(' · ');
    return `<li class="ing-item">${ingredientThumb(it.ing.id)}
      <span class="tx"><span class="nm">${esc(it.ing.name)}</span>${st ? `<span class="st">${st}</span>` : ''}</span>
      <span class="q">${esc(qty.trim())}</span></li>`;
  };
  const card = (cls, icon, title, items, status) => items.length ? `
    <div class="panel-card ${cls}">
      <h3 class="group-title"><md-icon>${icon}</md-icon>${title}<span class="count">${items.length}</span></h3>
      <ul class="panel-list">${items.map((it) => row(it, status)).join('')}</ul>
    </div>` : '';
  $('panelIngredients').innerHTML =
    card('now', 'radio_button_checked', `Now · Step ${cur}`, groups.now, () => '')
    + card('next', 'schedule', 'Coming up', groups.next, (it) => `Step ${it.step}`)
    // Used items are done with, so they collapse to one compact line of tags.
    + (groups.used.length ? `<div class="panel-used"><md-icon>check_circle</md-icon><span class="lbl">Used</span>${
      groups.used.map((it) => `<span class="used-tag">${esc(it.ing.name)}</span>`).join('')}</div>` : '');
  $('panelSub').textContent = `${recipe.title} · for ${recipe.servings} servings`;
  renderPanelTimers();
}

function renderPanelTimers(now = Date.now()) {
  const list = $('panelTimerList');
  if (!list) return;   // the panel shows ingredients only; timers live on the bottom bar
  const timers = [...state.timers].sort((a, b) => a.startedAt - b.startedAt);
  if (!timers.length) {
    if (!list.querySelector('.empty')) {
      list.innerHTML = `<li class="empty">No timers running. On a step with a timer, tap Start timer or say “<span class="wake">${esc(wakeWord())}</span>, start timer”.</li>`;
    }
    return;
  }
  list.querySelector('.empty')?.remove();
  const ids = new Set(timers.map((t) => t.id));
  list.querySelectorAll('.timer-row').forEach((row) => { if (!ids.has(row.dataset.id)) row.remove(); });
  for (const t of timers) {
    let row = list.querySelector(`.timer-row[data-id="${t.id}"]`);
    if (!row) {
      row = document.createElement('li');
      row.className = 'timer-row';
      row.dataset.id = t.id;
      row.innerHTML = `<span class="timer-ic"><md-icon>timer</md-icon></span>
        <span class="timer-name">${esc(t.name)}</span><span class="timer-left"></span>
        <span class="timer-meta"><span>Step ${t.stepNumber}</span>·<md-icon>front_hand</md-icon><span>Hold to cancel</span></span>`;
      bindHold(row, t);
      list.append(row);
    }
    const left = remaining(t, now);
    row.classList.toggle('alert', left <= 0);
    const txt = left <= 0 ? 'Done' : fmt(left);
    const el = row.querySelector('.timer-left');
    if (el.textContent !== txt) el.textContent = txt;
  }
}

function bindHold(row, t) {
  let timer = null;
  const cancel = () => { clearTimeout(timer); timer = null; row.classList.remove('holding'); };
  row.style.setProperty('--hold-ms', `${CONFIG.holdToCancelMs}ms`);
  row.addEventListener('pointerdown', () => {
    row.classList.add('holding');
    timer = setTimeout(() => { cancel(); removeTimer(t.id); feedback(`Cancelled ${t.name}.`, false); }, CONFIG.holdToCancelMs);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => row.addEventListener(ev, cancel));
}

function openPanel(section = 'ingredients') {
  if (state.screen !== 'step') return;
  state.panelOpen = true;
  renderPanel();
  const panel = $('panel');
  panel.classList.add('open');
  $('stepScreen').classList.add('panel-open');
  fitStage();   // the step text column narrows to make room; re-fit its type
  panel.setAttribute('aria-hidden', 'false');
  $('panelToggle').setAttribute('aria-expanded', 'true');
  $('panelToggleLabel').textContent = 'Close';
  $('panelToggle').querySelector('md-icon').textContent = 'close';
  const scroller = panel.querySelector('.panel-inner');
  scroller.scrollTo({ top: section === 'timers' ? $('panelTimers').offsetTop - 16 : 0, behavior: 'smooth' });
}
function closePanel() {
  state.panelOpen = false;
  const panel = $('panel');
  panel.classList.remove('open');
  const wasOpen = $('stepScreen').classList.contains('panel-open');
  $('stepScreen').classList.remove('panel-open');
  if (wasOpen) fitStage();
  panel.setAttribute('aria-hidden', 'true');
  $('panelToggle').setAttribute('aria-expanded', 'false');
  $('panelToggleLabel').textContent = 'Ingredients';
  $('panelToggle').querySelector('md-icon').textContent = 'list_alt';
}


// ---------- Feedback ----------
let snackTimer = null;
function snackbar(msg, ms = 3000) {
  const el = $('snackbar');
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => { el.hidden = true; }, ms);
}
function feedback(msg, spoken = true) {
  snackbar(msg);
  if (spoken) say([msg]);
}

let pillTimer = null;
function setVoicePill(kind, text, ms) {
  const pill = $('voicePill');
  clearTimeout(pillTimer);
  pill.dataset.state = kind;
  $('voiceIcon').textContent = { listening: 'mic', heard: 'check', unknown: 'hearing' }[kind] || 'mic';
  $('voiceText').textContent = text;
  if (ms) pillTimer = setTimeout(renderVoicePill, ms);
}
function renderVoicePill() {
  const s = voice.status;
  const pill = $('voicePill');
  clearTimeout(pillTimer);
  const map = {
    on: ['idle', 'mic', `Say “${wakeWord()}” + command`],
    off: ['off', 'mic_off', 'Voice off'],
    unsupported: ['off', 'mic_off', 'Voice off · use Chrome or Edge'],
    offline: ['off', 'wifi_off', 'Voice offline'],
  };
  const [kind, icon, text] = map[s] || ['idle', 'mic', started ? 'Starting voice…' : 'Tap anywhere to turn on voice'];
  pill.dataset.state = kind;
  $('voiceIcon').textContent = icon;
  $('voiceText').textContent = text;
  if ($('voiceStatus')) $('voiceStatus').textContent = `Voice: ${text}`;
}

// ---------- Commands (voice and touch share these) ----------
function howMuch(name) {
  const aliases = (i) => `${i.name} ${i.id === 'toor-dal' ? 'dal lentils' : ''} ${i.id === 'red-chilli' ? 'chilli powder' : ''}`;
  const ing = name ? bestNameMatch(name, recipe.ingredients, aliases) : null;
  if (!ing) return feedback(name ? `No ingredient called ${name}.` : 'Which ingredient?');
  const uses = ingredientUses(ing.id);
  const detail = uses.length > 1 ? uses.map((u) => `${u.quantity} in Step ${u.step}`).join(' · ') : ing.quantity;
  feedback(`${ing.name}: ${detail}`);
}

const ACTIONS = {
  next: goNext,
  back: goBack,
  repeat,
  startTimer,
  stopAlarm,
  cancel: (arg) => cancelTimer(arg),
  ingredients: () => (state.screen === 'step' ? openPanel('ingredients') : feedback('The ingredients are on screen.', false)),
  timers: () => feedback(state.timers.length
    ? state.timers.map((t) => `${t.name}: ${remaining(t) <= 0 ? 'done' : `${fmt(remaining(t))} left`}`).join(' · ')
    : 'No timers are running.'),
  close: closePanel,
  howMuch: (arg) => howMuch(arg),
  pause: () => narrator.pause(),
  resume: () => (narrator.state === 'paused' ? narrator.resume() : repeat()),
};

// The Repeat target doubles as the voice-over control: Pause while reading,
// Resume when paused, Repeat when finished.
function onSpeakControl() {
  if (narrator.state === 'speaking') narrator.pause();
  else if (narrator.state === 'paused') narrator.resume();
  else repeat();
}
function renderSpeakControl() {
  const [icon, label] = { speaking: ['pause', 'Pause'], paused: ['play_arrow', 'Resume'] }[narrator.state] || ['volume_up', 'Repeat'];
  document.querySelectorAll('.speak-btn').forEach((btn) => {
    btn.querySelector('md-icon').textContent = icon;
    btn.querySelector('.btn-label').textContent = label;
    btn.classList.toggle('is-paused', narrator.state === 'paused');
    btn.setAttribute('aria-label', label === 'Repeat' ? 'Read it again' : `${label} the voice-over`);
  });
}

function runVoiceCommand({ cmd, arg }) {
  if (!started) return;
  const label = COMMAND_LABELS[cmd] + (arg ? ` ${arg}` : '');
  setVoicePill('heard', `${label} ✓`, CONFIG.commandConfirmMs);
  const run = () => ACTIONS[cmd]?.(arg);
  if (cmd === 'stopAlarm') run();
  else setTimeout(run, CONFIG.actionDelayMs);
}

// ---------- Distance ----------
function distanceMode() {
  if (settings.distanceMode === 'far' || settings.distanceMode === 'close') return settings.distanceMode;
  return cameraStatus === 'on' ? sensorState : 'far';
}
function applyDistance() {
  const mode = distanceMode();
  document.documentElement.dataset.distance = mode;
  $('stage').querySelectorAll('.step-text').forEach((t) => { t.dataset.mode = mode; });
  const o = $('overridePill');
  o.hidden = settings.distanceMode === 'auto';
  o.querySelector('span').textContent = `Test: ${settings.distanceMode} text`;
  renderDistanceStatus();
}
function renderDistanceStatus() {
  const el = $('distanceStatus');
  if (!el) return;
  const cam = { pending: 'starting…', on: 'on', denied: 'permission denied', unavailable: 'unavailable' }[cameraStatus] || cameraStatus;
  const reading = cameraStatus === 'on' ? (lastReading ? ` · face ≈ ${lastReading} cm` : ' · no face in view') : '';
  el.textContent = `Camera: ${cam}${reading} · showing ${distanceMode()} layout (switches at ${CONFIG.distance.thresholdCm} ± ${CONFIG.distance.bandCm} cm after ${CONFIG.distance.holdMs / 1000} s)`;
}

function startSensor() {
  sensor = new DistanceSensor(CONFIG.distance, CONFIG.vision, settings.calibrationK);
  sensor.addEventListener('status', (e) => { cameraStatus = e.detail; applyDistance(); });
  sensor.addEventListener('state', (e) => { sensorState = e.detail; applyDistance(); });
  sensor.addEventListener('reading', (e) => { lastReading = e.detail; if ($('testDialog').open) renderDistanceStatus(); });
  sensor.start();
}

// ---------- Device ----------
let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not supported or not allowed */ }
}

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
  document.querySelector('meta[name="theme-color"]').content = settings.theme === 'dark' ? '#16130F' : '#FBF7F0';
}

// ---------- Start ----------
// Browsers only allow sound, speech and full screen after a user gesture, so the
// first touch (usually picking a recipe) switches on voice, camera, alarms and wake lock.
function startServices() {
  if (started) return;
  started = true;
  alarm.unlock();
  try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance('')); } catch { /* ignore */ }
  // ?nofs in the URL skips full screen (handy when testing in a desktop browser).
  if (!new URLSearchParams(location.search).has('nofs')) {
    try { document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {}); } catch { /* not allowed */ }
  }
  keepAwake();
  voice.start();
  renderVoicePill();
  startSensor();
  lastAlarmKey = '';
  tick();
}

// ---------- Input wiring ----------
function bindUI() {
  $('startBtn').addEventListener('click', goNext);
  $('nextBtn').addEventListener('click', goNext);
  $('backBtn').addEventListener('click', goBack);
  $('repeatBtn').addEventListener('click', onSpeakControl);
  $('prepPauseBtn').addEventListener('click', onSpeakControl);
  narrator.addEventListener('state', renderSpeakControl);
  $('timerBtn').addEventListener('click', () => ($('timerBtn').classList.contains('ringing') ? stopAlarm() : startTimer()));
  // Another step's timer: tap stops it if ringing, otherwise reads out how long is left.
  $('runBtn').addEventListener('click', () => {
    if ($('runBtn').classList.contains('ringing')) return stopAlarm();
    const name = $('runBtnSub').textContent.replace(/^Step \d+ · /, '').replace(/ · \+\d+$/, '');
    say([`${name}, ${$('runBtnLabel').textContent}.`]);
  });
  $('doneBtn').addEventListener('click', finishRecipe);
  $('doneBackBtn').addEventListener('click', goBack);
  $('prepBackBtn').addEventListener('click', goBack);
  $('panelToggle').addEventListener('click', () => (state.panelOpen ? closePanel() : openPanel()));
  $('stepper').addEventListener('click', (e) => {
    const seg = e.target.closest('.seg');
    if (seg) jumpTo(Number(seg.dataset.index));
  });
  $('catRow').addEventListener('click', (e) => {
    const c = e.target.closest('.cat');
    if (!c) return;
    category = c.dataset.cat;
    renderRecipes();
  });
  $('recipeGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.recipe-card');
    if (card) openRecipe(card.dataset.id);
  });
  $('rail').addEventListener('click', (e) => {
    const item = e.target.closest('.rail-item');
    if (!item) return;
    const nav = item.dataset.nav;
    if (nav === 'settings') return $('testBtn').click();
    if (nav === 'home' && state.screen !== 'recipes') { state.screen = 'recipes'; save(); showScreen(); }
  });
  $('introNextBtn').addEventListener('click', goNext);
  $('introBackBtn').addEventListener('click', goBack);
  $('introSkipBtn').addEventListener('click', skipIntro);
  document.addEventListener('pointerdown', startServices, { capture: true });
  document.addEventListener('keydown', startServices, { capture: true });

  // Visible "pressed" state for elbows: fill on contact, not on release.
  app.addEventListener('pointerdown', (e) => e.target.closest('.target')?.classList.add('pressed'));
  const unpress = () => app.querySelectorAll('.pressed').forEach((el) => el.classList.remove('pressed'));
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => app.addEventListener(ev, unpress));

  // Touch anywhere: the alarm takes priority, then touching outside the panel closes it.
  // (Progress is always visible at the top, so stray elbow touches do nothing else.)
  app.addEventListener('click', (e) => {
    if (!started) return;
    if (e.target.closest('#alarm')) { stopAlarm(); return; }
    const isTarget = e.target.closest('.target, .seg, .timer-row, #testBtn');
    if (state.panelOpen && !e.target.closest('.panel') && !isTarget) closePanel();
  });

  // Keyboard shortcuts for laptop testing.
  document.addEventListener('keydown', (e) => {
    if (!started || $('testDialog').open || e.target.closest?.('input, textarea, md-outlined-text-field')) return;
    if (ringingTimers().length && (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 's')) { e.preventDefault(); stopAlarm(); return; }
    const k = e.key.toLowerCase();
    const map = { arrowright: goNext, arrowleft: goBack, r: repeat, t: startTimer, i: () => openPanel('ingredients'), escape: closePanel };
    if (map[k]) { e.preventDefault(); map[k](); }
  });

  voice.addEventListener('wake', () => setVoicePill('listening', 'Listening…'));
  voice.addEventListener('listening-end', renderVoicePill);
  voice.addEventListener('unknown', () => setVoicePill('unknown', 'Didn’t catch that. Try again.', CONFIG.notUnderstoodMs));
  voice.addEventListener('command', (e) => runVoiceCommand(e.detail));
  voice.addEventListener('status', renderVoicePill);

  window.addEventListener('resize', fitStage);
  document.addEventListener('fullscreenchange', fitStage);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && started) { keepAwake(); tick(); }
  });
  setInterval(tick, 250);

  bindTestDialog();
}

function bindTestDialog() {
  const dialog = $('testDialog');
  const syncChips = (setId, value) => {
    $(setId).querySelectorAll('md-filter-chip').forEach((c) => { c.selected = c.dataset.value === value; });
  };
  $('testBtn').addEventListener('click', () => {
    syncChips('distanceChips', settings.distanceMode);
    syncChips('themeChips', settings.theme);
    $('fastSwitch').selected = settings.fastTimers;
    $('wakeField').value = wakeWord();
    renderDistanceStatus();
    renderVoicePill();
    dialog.show();
  });
  $('distanceChips').addEventListener('click', (e) => {
    const chip = e.target.closest('md-filter-chip');
    if (!chip) return;
    settings.distanceMode = chip.dataset.value;
    saveSettings();
    setTimeout(() => syncChips('distanceChips', settings.distanceMode));
    applyDistance();
  });
  $('themeChips').addEventListener('click', (e) => {
    const chip = e.target.closest('md-filter-chip');
    if (!chip) return;
    settings.theme = chip.dataset.value;
    saveSettings();
    setTimeout(() => syncChips('themeChips', settings.theme));
    applyTheme();
  });
  $('calibrateBtn').addEventListener('click', () => {
    const k = sensor?.calibrate();
    if (k) { settings.calibrationK = k; saveSettings(); $('distanceStatus').textContent = 'Calibrated: this distance is now 1 m.'; }
    else $('distanceStatus').textContent = 'Calibration needs the camera on and your face in view.';
  });
  $('fastSwitch').addEventListener('change', () => { settings.fastTimers = $('fastSwitch').selected; saveSettings(); });
  $('wakeField').addEventListener('input', () => {
    const v = $('wakeField').value.trim();
    if (!v) return;
    settings.wakeWord = v;
    saveSettings();
    applyWakeWord();
  });
  const simulate = () => {
    const text = $('simField').value.trim();
    if (!text) return;
    dialog.close();
    setTimeout(() => voice.simulate(text), 250);
  };
  $('simBtn').addEventListener('click', simulate);
  $('simField').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); simulate(); } });
  $('resetBtn').addEventListener('click', () => {
    resetRecipe();
    dialog.close();
    say([]);
    showScreen();
  });
}

// ---------- Boot ----------
async function boot() {
  applyTheme();
  fitStage();
  try { await import(MATERIAL_WEB); } catch (e) { console.warn('Material Web components could not load', e); }
  try {
    // The single-file build embeds the data; the dev server loads the JSON files.
    recipe = window.INLINE_RECIPE || await (await fetch(CONFIG.recipeUrl)).json();
    catalog = window.INLINE_CATALOG || await (await fetch(CONFIG.catalogUrl)).json();
  } catch (e) {
    document.body.insertAdjacentHTML('beforeend', '<p style="font:600 22px Inter,sans-serif;padding:32px">Could not load the recipe. Start the app with start.cmd, or use cook-along-mode.html.</p>');
    return;
  }
  restore();
  renderRecipes();
  renderPrep();
  renderPanel();
  bindUI();
  applyWakeWord();
  applyDistance();
 
  showScreen();
  app.classList.remove('booting');
  await document.fonts.ready;
  fitStage();
  if (state.screen === 'step') renderStep(0, { speakIt: false });   // resumed mid-recipe
}

boot();
