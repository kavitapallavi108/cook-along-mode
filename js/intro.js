// Feature intro screens shown after choosing a recipe: Voice, Distance, Alarms.
// Illustrations use the app palette: off-white, near-black, turmeric; red only for the alarm.

const INK = '#1D1B18', PAPER = '#FBF7F0', TURMERIC = '#F0A30A', SAND = '#E2D4BC', RED = '#C4271F';

// One colour family per feature (tint = backgrounds, mid = details, deep = text/strong shapes).
export const THEMES = {
  voice: { tint: '#D6EEE8', mid: '#5DB3A4', deep: '#17675D' },
  distance: { tint: '#DEE5F7', mid: '#7D97D6', deep: '#2C4A8A' },
  alarm: { tint: '#FADFD9', mid: '#E57B68', deep: '#A3231B' },
};

function tablet(x, y, w, h, screen) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${INK}"/>
    <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" rx="12" fill="${PAPER}"/>
    ${screen}
  </g>`;
}

const ART = {
  voice: `<svg viewBox="0 0 440 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Saying Zara, next to the tablet">
    <circle cx="230" cy="205" r="175" fill="${THEMES.voice.tint}"/>
    ${tablet(170, 120, 230, 170, `
      <rect x="196" y="146" width="178" height="22" rx="11" fill="${THEMES.voice.tint}"/>
      <rect x="196" y="182" width="140" height="18" rx="9" fill="${INK}"/>
      <rect x="196" y="210" width="110" height="14" rx="7" fill="${INK}" opacity=".85"/>
      <rect x="196" y="240" width="96" height="30" rx="15" fill="${TURMERIC}"/>
      <path d="M212 255 l7 7 l14 -14" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="242" y="261" font-family="Inter, sans-serif" font-weight="800" font-size="15" fill="${INK}">Next</text>`)}
    <rect x="300" y="290" width="22" height="40" fill="${INK}"/><rect x="262" y="326" width="98" height="12" rx="6" fill="${INK}"/>
    <g>
      <rect x="22" y="70" width="190" height="78" rx="26" fill="${THEMES.voice.deep}"/>
      <path d="M150 146 l26 28 l-2 -28z" fill="${THEMES.voice.deep}"/>
      <text x="117" y="120" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="27" fill="${PAPER}">“Zara, next”</text>
    </g>
    <g fill="none" stroke="${THEMES.voice.mid}" stroke-width="7" stroke-linecap="round">
      <path d="M118 196 q16 18 0 36"/><path d="M96 180 q34 34 0 68" opacity=".7"/><path d="M74 164 q52 50 0 100" opacity=".45"/>
    </g>
    <g transform="translate(120 300)">
      <circle r="38" fill="${THEMES.voice.deep}"/>
      <rect x="-10" y="-22" width="20" height="30" rx="10" fill="${PAPER}"/>
      <path d="M-17 0 a17 17 0 0 0 34 0 M0 17 v9" stroke="${PAPER}" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`,

  distance: `<svg viewBox="0 0 440 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cook standing at the stove, the tablet shows bigger text">
    <circle cx="220" cy="205" r="175" fill="${THEMES.distance.tint}"/>
    ${tablet(42, 128, 168, 124, `
      <text x="126" y="210" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="58" fill="${INK}">Aa</text>`)}
    <rect x="116" y="252" width="18" height="40" fill="${INK}"/><rect x="84" y="288" width="82" height="12" rx="6" fill="${INK}"/>
    <g>
      <circle cx="346" cy="128" r="30" fill="${THEMES.distance.deep}"/>
      <path d="M300 300 v-96 a46 46 0 0 1 92 0 v96z" fill="${THEMES.distance.deep}"/>
      <rect x="272" y="300" width="148" height="14" rx="7" fill="${SAND}"/>
      <rect x="282" y="314" width="128" height="40" rx="8" fill="${SAND}" opacity=".7"/>
      <ellipse cx="318" cy="292" rx="34" ry="9" fill="#9a9c9e"/>
      <path d="M306 280 q4 -14 0 -26 M322 280 q4 -14 0 -26" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
    </g>
    <g stroke="${THEMES.distance.mid}" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M222 190 h56" stroke-dasharray="2 12"/>
      <path d="M232 178 l-12 12 l12 12 M268 178 l12 12 l-12 12"/>
    </g>
    <rect x="212" y="214" width="76" height="36" rx="18" fill="${THEMES.distance.deep}"/>
    <text x="250" y="238" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="19" fill="${PAPER}">1.5 m</text>
  </svg>`,

  alarm: `<svg viewBox="0 0 440 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A timer alarm ringing, touch anywhere to stop">
    <circle cx="220" cy="200" r="175" fill="${THEMES.alarm.tint}"/>
    <g fill="none" stroke="${THEMES.alarm.mid}" stroke-width="7" stroke-linecap="round">
      <path d="M118 96 l-26 -22 M322 96 l26 -22 M96 170 h-32 M344 170 h32"/>
    </g>
    <circle cx="220" cy="176" r="96" fill="${PAPER}" stroke="${INK}" stroke-width="12"/>
    <rect x="204" y="62" width="32" height="20" rx="6" fill="${INK}"/>
    <path d="M220 176 v-58" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M220 176 l40 24" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="220" cy="176" r="12" fill="${INK}"/>
    <rect x="46" y="290" width="348" height="74" rx="26" fill="${RED}"/>
    <g transform="translate(88 327)" fill="#fff">
      <path d="M-14 8 h28 l-4 -6 v-10 a10 10 0 0 0 -20 0 v10z"/><circle cy="13" r="4"/>
    </g>
    <text x="118" y="336" font-family="Inter, sans-serif" font-weight="600" font-size="25" fill="#fff">Sauté onions is done</text>
  </svg>`,
};

export const INTRO = [
  {
    key: 'voice',
    kicker: 'Hands-free',
    title: 'Talk to it',
    body: 'Hands covered in masala? Say the wake word, then a command. The screen shows what it heard.',
    chips: ['next', 'back', 'repeat', 'pause', 'start timer', 'stop alarm', 'ingredients'],
    tryIt: 'Try it now: say “<span class="wake"></span>, next”',
    art: ART.voice,
  },
  {
    key: 'distance',
    kicker: 'Read it from the stove',
    title: 'Step back, text gets bigger',
    body: 'The front camera checks how far away you are. At the stove you see big text; come closer for details and tips.',
    chips: [],
    tryIt: 'Camera frames stay on this tablet. They are never stored or sent.',
    art: ART.distance,
  },
  {
    key: 'alarm',
    kicker: 'Never miss a step',
    title: 'Timers ring until you stop them',
    body: 'Start a timer when a step needs one. Several can run at once. When one finishes, the alarm rings and names the step.',
    chips: [],
    tryIt: 'To stop it: tap the red timer button, or say “<span class="wake"></span>, stop alarm”',
    art: ART.alarm,
  },
];
