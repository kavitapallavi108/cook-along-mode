// Fixed voice command set (spec 6.1), matched loosely.

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/chili/g, 'chilli')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FILLER = /\b(please|the|a|my|timer|timers|for|of|now|zara)\b/g;
const clean = (s) => normalize(s).replace(FILLER, ' ').replace(/\s+/g, ' ').trim();

// Order matters: more specific phrases first.
const RULES = [
  { cmd: 'stopAlarm', re: /\b(stop|end|silence|turn off|switch off)( the)? (alarm|alarms|ringing|beeping|sound)\b|\balarm (off|stop)\b/ },
  { cmd: 'startTimer', re: /\b(start|set|begin|run)( the| a| my)? (timer|time|time her|timers)\b|\btimer (start|on)\b/ },
  { cmd: 'cancel', re: /\b(?:cancel|delete|remove)\b(.*)$/, arg: (m) => clean(m[1]) },
  { cmd: 'howMuch', re: /\bhow (?:much|many)\b(.*)$/, arg: (m) => clean(m[1]) },
  { cmd: 'pause', re: /\b(pause|hold on|be quiet|quiet|stop talking|stop reading)\b/ },
  { cmd: 'resume', re: /\b(resume|play|keep reading|carry on)\b/ },
  { cmd: 'next', re: /\b(next|necks|nexxt|next step|go next|forward|continue|start cooking)\b/ },
  { cmd: 'back', re: /\b(back|go back|previous|last step)\b/ },
  { cmd: 'repeat', re: /\b(repeat|again|say again|read again|replay)\b/ },
  { cmd: 'ingredients', re: /\b(ingredients?|ingredient list)\b/ },
  { cmd: 'timers', re: /\b(timers?|show timers?)\b/ },
  { cmd: 'close', re: /\b(close|close panel|hide|hide panel|dismiss)\b/ },
];

export const COMMAND_LABELS = {
  next: 'Next', back: 'Back', repeat: 'Repeat', startTimer: 'Start timer',
  stopAlarm: 'Stop alarm', cancel: 'Cancel', ingredients: 'Ingredients',
  timers: 'Timers', close: 'Close', howMuch: 'How much', pause: 'Pause', resume: 'Resume',
};

/** Returns { cmd, arg } or null. `ctx.alarmRinging` lets a bare "stop" silence the alarm. */
export function matchCommand(text, ctx = {}) {
  const t = normalize(text);
  if (!t) return null;
  if (ctx.alarmRinging && /^(stop|stop it|quiet|ok|okay)$/.test(t)) return { cmd: 'stopAlarm' };
  for (const rule of RULES) {
    const m = t.match(rule.re);
    if (m) return { cmd: rule.cmd, arg: rule.arg ? rule.arg(m) : undefined };
  }
  return null;
}

/** Best match of a spoken name against a list of {name} items, by shared words. */
export function bestNameMatch(spoken, items, getName = (x) => x.name) {
  const words = clean(spoken).split(' ').filter((w) => w.length > 1);
  if (!words.length) return null;
  let best = null, bestScore = 0;
  for (const item of items) {
    const nameWords = normalize(getName(item)).split(' ');
    let score = 0;
    for (const w of words) {
      if (nameWords.includes(w)) score += 2;
      else if (nameWords.some((n) => n.startsWith(w) || w.startsWith(n))) score += 1;
    }
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return best;
}
