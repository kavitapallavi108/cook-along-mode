// Placeholder "expected result" art: consistent top-down view, same top-left light,
// tight crop on the food. Replace with real photos via the steps/ folder.

let uid = 0;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inCircle(r, R, cx = 200, cy = 200) {
  const rad = R * Math.sqrt(r());
  const th = r() * Math.PI * 2;
  return [cx + rad * Math.cos(th), cy + rad * Math.sin(th)];
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const f = (n) => n.toFixed(1);

// ---------- vessels ----------

function steelBowl(id) {
  return `
  <g filter="url(#${id}-sh)"><circle cx="200" cy="200" r="184" fill="url(#${id}-steelRim)"/></g>
  <circle cx="200" cy="200" r="166" fill="url(#${id}-steelIn)"/>`;
}

function kadai(id) {
  return `
  <g filter="url(#${id}-sh)">
    <path d="M28 168 Q-14 200 28 232" fill="none" stroke="#24221f" stroke-width="16" stroke-linecap="round"/>
    <path d="M372 168 Q414 200 372 232" fill="none" stroke="#24221f" stroke-width="16" stroke-linecap="round"/>
    <circle cx="200" cy="200" r="180" fill="url(#${id}-ironRim)"/>
  </g>
  <circle cx="200" cy="200" r="162" fill="url(#${id}-ironIn)"/>`;
}

function cookerOpen(id) {
  return `
  <g filter="url(#${id}-sh)"><circle cx="200" cy="200" r="184" fill="url(#${id}-steelRim)"/></g>
  <circle cx="200" cy="200" r="168" fill="url(#${id}-steelIn)"/>`;
}

function servingBowl(id) {
  return `
  <g filter="url(#${id}-sh)"><circle cx="200" cy="200" r="182" fill="url(#${id}-ceramic)"/></g>
  <circle cx="200" cy="200" r="158" fill="#e9e1d4"/>`;
}

// ---------- contents ----------

function lentils(r, n, R, colors = ['#f2b43c', '#eba62c', '#f5c255', '#e89f26']) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(5.5 + r() * 2)}" ry="${f(4.6 + r() * 1.6)}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${pick(r, colors)}" stroke="#c98a1c" stroke-width=".7"/>`;
  }
  return s;
}

function cuminSeeds(r, n, R) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="6" ry="2.3" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${pick(r, ['#5d3a1c', '#6e4724', '#4c2f16'])}" stroke="#3a220f" stroke-width=".6"/>`;
  }
  return s;
}

function onionArcs(r, n, R, colors) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    const rad = 9 + r() * 10;
    const a0 = r() * Math.PI * 2, a1 = a0 + 1.4 + r() * 1.4;
    const p = (a) => `${f(x + rad * Math.cos(a))} ${f(y + rad * Math.sin(a))}`;
    s += `<path d="M${p(a0)} A${f(rad)} ${f(rad)} 0 0 1 ${p(a1)}" fill="none" stroke="${pick(r, colors)}" stroke-width="${f(5 + r() * 3)}" stroke-linecap="round"/>`;
  }
  return s;
}

function bits(r, n, R, colors, size = [4, 7]) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    const w = size[0] + r() * (size[1] - size[0]);
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w * (0.7 + r() * 0.5))}" rx="1.6" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})" fill="${pick(r, colors)}"/>`;
  }
  return s;
}

function dots(r, n, R, colors, rad = [1.2, 2.6], opacity = 1) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad[0] + r() * (rad[1] - rad[0]))}" fill="${pick(r, colors)}" opacity="${opacity}"/>`;
  }
  return s;
}

function coriander(r, n, R) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    const rot = r() * 360, c = pick(r, ['#3b8a2c', '#4c9d36', '#2f7a24']);
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
      <circle cx="0" cy="-5" r="5" fill="${c}"/><circle cx="-5" cy="3" r="5" fill="${c}"/><circle cx="5" cy="3" r="5" fill="${c}"/>
      <circle cx="0" cy="0" r="2" fill="#6fb851"/></g>`;
  }
  return s;
}

function bubbles(r, n, R) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, R);
    const rad = 4 + r() * 7;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="#f6d27a" fill-opacity=".35" stroke="#fbe6a8" stroke-width="1.6"/>
      <circle cx="${f(x - rad * 0.35)}" cy="${f(y - rad * 0.35)}" r="${f(rad * 0.25)}" fill="#fff8e0" opacity=".9"/>`;
  }
  return s;
}

function tadkaSwirl(id) {
  return `<path d="M200 200 m-6 0 a6 6 0 1 1 12 0 a22 22 0 1 1 -44 0 a40 40 0 1 1 80 0 a62 62 0 1 1 -124 0 a84 84 0 1 1 168 0"
    fill="none" stroke="url(#${id}-tadka)" stroke-width="15" stroke-linecap="round" opacity=".85"/>`;
}

function steam(id, x, y, label) {
  return `<g filter="url(#${id}-blur)" opacity=".85"><circle cx="${x}" cy="${y}" r="26" fill="#ffffff"/>
    <circle cx="${x + 18}" cy="${y - 8}" r="18" fill="#ffffff"/></g>
    <text x="${x + 6}" y="${y + 9}" font-family="Inter, sans-serif" font-weight="800" font-size="26" fill="#3b3a38" text-anchor="middle">${label}</text>`;
}

// ---------- scenes ----------

const SCENES = {
  rinsed(id, r) {
    return steelBowl(id) +
      `<circle cx="200" cy="200" r="152" fill="#d9ecef" opacity=".6"/>` +
      lentils(r, 420, 140) +
      `<circle cx="200" cy="200" r="152" fill="#e4f3f5" opacity=".18"/>
       <path d="M110 120 Q160 90 220 100" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
       <path d="M95 160 Q110 135 135 125" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>`;
  },

  // ----- Step 1 process: measure → rub in water → drain → clear -----
  rinse1(id, r) {
    return `<g filter="url(#${id}-sh)">
        <rect x="300" y="182" width="110" height="36" rx="18" fill="#9a9ea1"/>
        <circle cx="200" cy="200" r="150" fill="url(#${id}-steelRim)"/></g>
      <circle cx="200" cy="200" r="134" fill="url(#${id}-steelIn)"/>` +
      lentils(r, 300, 122) +
      `<text x="200" y="372" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="30" fill="#1D1B18">1 cup</text>`;
  },

  rinse2(id, r) {
    return steelBowl(id) + lentils(r, 380, 140) +
      `<circle cx="200" cy="200" r="152" fill="#efe9da" opacity=".72"/>
       <g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".95">
         <path d="M140 180 a60 60 0 0 1 120 0"/><path d="M260 220 a60 60 0 0 1 -120 0"/>
       </g>
       <path d="M262 168 l10 22 l-24 -2z" fill="#fff"/><path d="M138 232 l-10 -22 l24 2z" fill="#fff"/>`;
  },

  rinse3(id, r) {
    return steelBowl(id) + lentils(r, 380, 140) +
      `<circle cx="200" cy="200" r="152" fill="#efe9da" opacity=".5"/>
       <path d="M300 300 q40 40 90 70" stroke="#e8e2d2" stroke-width="28" fill="none" stroke-linecap="round" opacity=".95"/>
       <g fill="#1D1B18"><path d="M330 250 l46 46 l-14 -50z"/></g>
       <path d="M250 200 L340 270" stroke="#1D1B18" stroke-width="9" stroke-linecap="round"/>`;
  },

  cooker(id, r, { steam: withSteam = true } = {}) {
    return `
      <g filter="url(#${id}-sh)">
        <rect x="200" y="182" width="230" height="36" rx="18" fill="#1f1e1c"/>
        <circle cx="200" cy="200" r="184" fill="url(#${id}-steelRim)"/>
      </g>
      <circle cx="200" cy="200" r="156" fill="url(#${id}-steelLid)"/>
      <circle cx="200" cy="200" r="156" fill="none" stroke="#8d9194" stroke-width="3"/>
      <rect x="236" y="184" width="200" height="32" rx="16" fill="#2b2a28"/>
      <circle cx="200" cy="200" r="30" fill="#2b2a28"/><circle cx="200" cy="200" r="13" fill="#4a4846"/>
      <circle cx="194" cy="194" r="5" fill="#77746f"/>
      ${withSteam ? steam(id, 138, 132, '1') + steam(id, 92, 214, '2') + steam(id, 150, 292, '3') : ''}`;
  },

  ghee(id, r) {
    let glints = '';
    for (let i = 0; i < 9; i++) {
      const [x, y] = inCircle(r, 90);
      glints += `<path d="M${f(x)} ${f(y)} q14 -6 28 0" stroke="#fff6cf" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>`;
    }
    return kadai(id) +
      `<ellipse cx="205" cy="208" rx="118" ry="108" fill="url(#${id}-ghee)"/>` + glints +
      `<ellipse cx="170" cy="170" rx="34" ry="14" fill="#fffbe6" opacity=".55" transform="rotate(-25 170 170)"/>`;
  },

  cumin(id, r) {
    let pops = '';
    for (let i = 0; i < 8; i++) {
      const [x, y] = inCircle(r, 95);
      pops += `<g stroke="#fff3c4" stroke-width="2.4" stroke-linecap="round" opacity=".9">
        <path d="M${f(x)} ${f(y - 9)} v-7"/><path d="M${f(x + 8)} ${f(y - 4)} l6 -4"/><path d="M${f(x - 8)} ${f(y - 4)} l-6 -4"/></g>`;
    }
    return kadai(id) +
      `<ellipse cx="205" cy="208" rx="118" ry="108" fill="url(#${id}-ghee)"/>` +
      cuminSeeds(r, 80, 100) + dots(r, 30, 95, ['#f3e2a5'], [1, 2], 0.8) + pops;
  },

  onions(id, r) {
    return kadai(id) +
      `<circle cx="200" cy="200" r="150" fill="#7a4c1a" opacity=".55"/>` +
      onionArcs(r, 170, 135, ['#c8862c', '#d69a3e', '#b87526', '#e0ae55', '#a8641f']) +
      bits(r, 40, 125, ['#ebc77e', '#e2b765', '#d9a24b']) +
      cuminSeeds(r, 18, 125) +
      dots(r, 26, 130, ['#fff1c2'], [1.2, 2.4], 0.75);
  },

  tomato(id, r, { oil = true } = {}) {
    let chilli = '';
    for (const [x, y, rot] of [[150, 170, -30], [245, 245, 20]]) {
      chilli += `<g transform="translate(${x} ${y}) rotate(${rot})">
        <path d="M-46 0 Q0 -18 46 -4 Q50 2 44 6 Q0 4 -46 10 Q-52 5 -46 0Z" fill="#3f8b2c"/>
        <path d="M-38 4 Q0 -6 38 0" stroke="#2a641c" stroke-width="2.5" fill="none"/>
        ${[-20, -6, 8, 22].map((dx) => `<circle cx="${dx}" cy="1" r="2.2" fill="#f2f0d8"/>`).join('')}</g>`;
    }
    return kadai(id) +
      (oil ? `<circle cx="200" cy="200" r="152" fill="none" stroke="#e8862e" stroke-width="16" opacity=".55"/>` : '') + `
       <circle cx="200" cy="200" r="138" fill="url(#${id}-masala)"/>` +
      dots(r, 160, 132, ['#8e2c14', '#a33618', '#d8673c', '#c24a22'], [2, 5]) +
      onionArcs(r, 30, 125, ['#c97c3a', '#d18a44']) +
      dots(r, 24, 150, ['#f2a03d', '#f7b75a'], [3, 6], 0.7) +
      chilli;
  },

  mashed(id, r) {
    let swirls = '';
    for (let i = 0; i < 14; i++) {
      const [x, y] = inCircle(r, 110);
      const rad = 14 + r() * 26;
      swirls += `<path d="M${f(x - rad)} ${f(y)} a${f(rad)} ${f(rad * 0.7)} 0 0 1 ${f(rad * 2)} 0" fill="none" stroke="${pick(r, ['#f7d886', '#cf9526'])}" stroke-width="4" opacity=".7" stroke-linecap="round"/>`;
    }
    return cookerOpen(id) +
      `<circle cx="200" cy="200" r="154" fill="url(#${id}-dal)"/>` + swirls +
      dots(r, 30, 140, ['#f2c25a', '#d7a236'], [3, 6], 0.8);
  },

  simmer(id, r, { bubbles: withBubbles = true } = {}) {
    return cookerOpen(id) +
      `<circle cx="200" cy="200" r="154" fill="url(#${id}-dal)"/>` +
      tadkaSwirl(id) +
      cuminSeeds(r, 30, 130) +
      onionArcs(r, 24, 120, ['#b8702a', '#c8862c']) +
      (withBubbles ? bubbles(r, 16, 135) : '');
  },

  garnish(id, r) {
    return servingBowl(id) +
      `<circle cx="200" cy="200" r="146" fill="url(#${id}-dal)"/>` +
      tadkaSwirl(id) +
      cuminSeeds(r, 22, 110) +
      dots(r, 30, 120, ['#b5381a', '#c94a25'], [1.5, 3]) +
      coriander(r, 26, 70) +
      `<ellipse cx="160" cy="150" rx="30" ry="10" fill="#fff6d8" opacity=".5" transform="rotate(-30 160 150)"/>`;
  },

  // ----- "how to" frames for steps 2–9 -----
  cookerFill(id, r) {
    return cookerOpen(id) + `<circle cx="200" cy="200" r="154" fill="#ead792" opacity=".75"/>` +
      lentils(r, 260, 130) + `<circle cx="200" cy="200" r="154" fill="#f1e2a4" opacity=".35"/>` +
      dots(r, 40, 120, ['#e39b12'], [2, 4], 0.8);
  },
  cookerLid(id) { return SCENES.cooker(id, null, { steam: false }); },
  kadaiEmpty(id) {
    return kadai(id) + `<g fill="none" stroke="#7d7873" stroke-width="5" stroke-linecap="round" opacity=".55">
      <path d="M150 240 q12 -22 0 -44 t0 -44"/><path d="M200 250 q12 -22 0 -44 t0 -44"/><path d="M250 240 q12 -22 0 -44 t0 -44"/></g>`;
  },
  gheeAdd(id) {
    return kadai(id) + `<ellipse cx="200" cy="205" rx="62" ry="54" fill="url(#${id}-ghee)"/>
      <ellipse cx="184" cy="188" rx="18" ry="8" fill="#fffbe6" opacity=".6" transform="rotate(-25 184 188)"/>`;
  },
  cuminAdd(id, r) {
    return kadai(id) + `<ellipse cx="205" cy="208" rx="118" ry="108" fill="url(#${id}-ghee)"/>` + cuminSeeds(r, 40, 90);
  },
  cuminHing(id, r) {
    return SCENES.cumin(id, r) + dots(r, 90, 55, ['#efe3b6', '#e6d79f'], [1.4, 2.8], 0.95);
  },
  garlicAdd(id, r) {
    return kadai(id) + `<ellipse cx="205" cy="208" rx="118" ry="108" fill="url(#${id}-ghee)"/>` +
      cuminSeeds(r, 30, 100) + bits(r, 45, 95, ['#f3e6c4', '#ead7a6', '#f7eed6'], [6, 9]);
  },
  onionRaw(id, r) {
    return kadai(id) + `<circle cx="200" cy="200" r="150" fill="#d9a12c" opacity=".35"/>` +
      onionArcs(r, 160, 135, ['#efe2ea', '#f3e9dc', '#e8d4df', '#f6eee3']) +
      bits(r, 35, 120, ['#ebd394', '#e2c070'], [5, 8]) + cuminSeeds(r, 16, 120);
  },
  tomatoRaw(id, r) {
    return SCENES.onions(id, r) + bits(r, 46, 120, ['#d8452a', '#c93a22', '#e05a3a'], [14, 22]);
  },
  tomatoSpice(id, r) {
    return SCENES.tomato(id, r, { oil: false }) + dots(r, 120, 110, ['#9c1f0e', '#b5301a'], [1.4, 2.6], 0.9);
  },
  dalCooked(id, r) {
    return cookerOpen(id) + `<circle cx="200" cy="200" r="154" fill="url(#${id}-dal)"/>` +
      lentils(r, 160, 135, ['#f4cf6e', '#efc35a', '#f7d982']) + `<circle cx="200" cy="200" r="154" fill="#f0c860" opacity=".35"/>`;
  },
  tadkaPour(id, r) {
    return cookerOpen(id) + `<circle cx="200" cy="200" r="154" fill="url(#${id}-dal)"/>` +
      `<ellipse cx="250" cy="160" rx="72" ry="56" fill="url(#${id}-tadka)" opacity=".9"/>` +
      cuminSeeds(r, 18, 50).replace(/cx="([\d.]+)" cy="([\d.]+)"/g, (_, x, y) => `cx="${(+x + 50).toFixed(1)}" cy="${(+y - 40).toFixed(1)}"`) +
      onionArcs(r, 10, 40, ['#b8702a']).replace(/M([\d.]+) ([\d.]+)/g, (_, x, y) => `M${(+x + 50).toFixed(1)} ${(+y - 40).toFixed(1)}`);
  },
  stirred(id, r) { return SCENES.simmer(id, r, { bubbles: false }); },
  bowlPlain(id, r) {
    return servingBowl(id) + `<circle cx="200" cy="200" r="146" fill="url(#${id}-dal)"/>` + tadkaSwirl(id) + cuminSeeds(r, 20, 110);
  },

  // ----- other recipes on the Recipes screen -----
  jeera(id, r) {
    let rice = '';
    for (let i = 0; i < 520; i++) {
      const [x, y] = inCircle(r, 136);
      rice += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="2.4" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${pick(r, ['#fbf7ec', '#f3ecda', '#fffdf6'])}" stroke="#ddd2b8" stroke-width=".6"/>`;
    }
    return servingBowl(id) + `<circle cx="200" cy="200" r="146" fill="#efe6d2"/>` + rice + cuminSeeds(r, 40, 130) + coriander(r, 8, 60);
  },

  aloo(id, r) {
    return kadai(id) + `<circle cx="200" cy="200" r="150" fill="#b8792a" opacity=".5"/>` +
      bits(r, 70, 128, ['#e9b949', '#f0c75c', '#dca73a', '#e4b041'], [18, 28]) +
      dots(r, 60, 135, ['#3a2a1a', '#2b1f14'], [1.8, 2.8]) + coriander(r, 14, 110);
  },

  poha(id, r) {
    return servingBowl(id) + `<circle cx="200" cy="200" r="146" fill="#f3d77a"/>` +
      bits(r, 260, 136, ['#f6df8c', '#f1d16b', '#fae7a3', '#ecc85c'], [6, 11]) +
      dots(r, 30, 125, ['#5f9d3c', '#6fae47'], [4.5, 6]) +
      bits(r, 22, 120, ['#b9773f', '#a8662f'], [8, 11]) + coriander(r, 12, 90);
  },

  rajma(id, r) {
    let beans = '';
    for (let i = 0; i < 46; i++) {
      const [x, y] = inCircle(r, 118);
      beans += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="13" ry="7.5" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${pick(r, ['#6d1f15', '#7d2a1b', '#5c1a12'])}"/>
        <ellipse cx="${f(x - 3)}" cy="${f(y - 2)}" rx="4" ry="1.6" fill="#c46a55" opacity=".6"/>`;
    }
    return servingBowl(id) + `<circle cx="200" cy="200" r="146" fill="url(#${id}-rajma)"/>` + beans + coriander(r, 10, 70);
  },

  palak(id, r) {
    return servingBowl(id) + `<circle cx="200" cy="200" r="146" fill="url(#${id}-palak)"/>` +
      bits(r, 22, 112, ['#f6efdc', '#efe5cc', '#fbf6e8'], [22, 30]) +
      `<path d="M150 200 q50 -40 100 0 t-60 30" stroke="#f7f1e2" stroke-width="7" fill="none" opacity=".85" stroke-linecap="round"/>`;
  },

  bhurji(id, r) {
    let egg = '';
    for (let i = 0; i < 70; i++) {
      const [x, y] = inCircle(r, 128);
      egg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(9 + r() * 10)}" fill="${pick(r, ['#f3d36b', '#f6dc82', '#ecc653', '#f8e39b'])}"/>`;
    }
    return kadai(id) + egg + bits(r, 30, 125, ['#c9452a', '#d65a35'], [5, 8]) + onionArcs(r, 18, 120, ['#e7cfa0']) + coriander(r, 14, 110);
  },

  chai(id) {
    return `<g filter="url(#${id}-sh)">
        <path d="M318 168 q64 32 0 64" fill="none" stroke="#e9e1d4" stroke-width="22" stroke-linecap="round"/>
        <circle cx="200" cy="200" r="150" fill="url(#${id}-ceramic)"/></g>
      <circle cx="200" cy="200" r="126" fill="url(#${id}-chai)"/>
      <ellipse cx="170" cy="168" rx="40" ry="14" fill="#e8c9a4" opacity=".55" transform="rotate(-25 170 168)"/>
      <circle cx="235" cy="235" r="7" fill="#e7cfaf" opacity=".7"/><circle cx="252" cy="220" r="4" fill="#e7cfaf" opacity=".7"/>`;
  },

  final(id, r) {
    return servingBowl(id) +
      `<circle cx="200" cy="200" r="146" fill="url(#${id}-dal)"/>` +
      tadkaSwirl(id) +
      `<circle cx="200" cy="200" r="60" fill="#f4c64f" opacity=".45"/>` +
      cuminSeeds(r, 28, 110) +
      dots(r, 34, 125, ['#b5381a', '#c94a25'], [1.5, 3]) +
      coriander(r, 40, 85) +
      `<ellipse cx="160" cy="150" rx="30" ry="10" fill="#fff6d8" opacity=".55" transform="rotate(-30 160 150)"/>`;
  },
};

function defs(id) {
  return `<defs>
    <radialGradient id="${id}-bg" cx="28%" cy="22%" r="95%"><stop offset="0" stop-color="#ddd5c8"/><stop offset="1" stop-color="#a69b8b"/></radialGradient>
    <radialGradient id="${id}-light" cx="25%" cy="18%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="${id}-sh" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="10" dy="14" stdDeviation="12" flood-color="#2b2118" flood-opacity=".45"/></filter>
    <filter id="${id}-blur"><feGaussianBlur stdDeviation="5"/></filter>
    <linearGradient id="${id}-steelRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f2f2"/><stop offset=".5" stop-color="#c3c6c8"/><stop offset="1" stop-color="#868a8d"/></linearGradient>
    <radialGradient id="${id}-steelIn" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#d2d5d7"/><stop offset="1" stop-color="#8f9396"/></radialGradient>
    <linearGradient id="${id}-steelLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e4e5"/><stop offset="1" stop-color="#9ea2a5"/></linearGradient>
    <linearGradient id="${id}-ironRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e5a56"/><stop offset="1" stop-color="#1c1a18"/></linearGradient>
    <radialGradient id="${id}-ironIn" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#504c48"/><stop offset="1" stop-color="#22201e"/></radialGradient>
    <linearGradient id="${id}-ceramic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8f2"/><stop offset="1" stop-color="#cdc3b2"/></linearGradient>
    <radialGradient id="${id}-ghee" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#f9dc7e"/><stop offset="1" stop-color="#d9a12c" stop-opacity=".95"/></radialGradient>
    <radialGradient id="${id}-masala" cx="42%" cy="40%" r="70%"><stop offset="0" stop-color="#d45e30"/><stop offset="1" stop-color="#a1361a"/></radialGradient>
    <radialGradient id="${id}-dal" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#f4c95e"/><stop offset="1" stop-color="#d4992a"/></radialGradient>
    <linearGradient id="${id}-tadka" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9622b"/><stop offset="1" stop-color="#b8431c"/></linearGradient>
    <radialGradient id="${id}-rajma" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#b24a26"/><stop offset="1" stop-color="#7c2a16"/></radialGradient>
    <radialGradient id="${id}-palak" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#4f8f33"/><stop offset="1" stop-color="#2f6420"/></radialGradient>
    <radialGradient id="${id}-chai" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#c8925f"/><stop offset="1" stop-color="#94613a"/></radialGradient>
  </defs>`;
}

const SEEDS = { rinsed: 11, cooker: 2, ghee: 3, cumin: 4, onions: 5, tomato: 6, mashed: 7, simmer: 8, garnish: 9, final: 10,
  rinse1: 31, rinse2: 32, rinse3: 33, jeera: 21, aloo: 22, poha: 23, rajma: 24, palak: 25, bhurji: 26, chai: 27 };

// Small top-down bowl thumbnails for ingredient lists.
const THUMB = {
  'toor-dal': ['#f2b43c', '#d9961f', 'dots'], water: ['#d4eaf1', '#a9d3e2', 'shine'],
  turmeric: ['#e39b12', '#c47f05', 'powder'], salt: ['#fbfaf7', '#c9c6bd', 'powder'],
  ghee: ['#f4cd5c', '#e0a930', 'shine'], cumin: ['#8a5c34', '#4f3119', 'seeds'],
  hing: ['#ece0b4', '#c9b780', 'powder'], garlic: ['#f3e9cf', '#d6c49a', 'chunks'],
  onion: ['#ead0dc', '#c995ab', 'chunks'], tomato: ['#d8452a', '#a92d17', 'chunks'],
  'green-chilli': ['#4a9a33', '#2f6c20', 'seeds'], 'red-chilli': ['#bf3219', '#8c1f0e', 'powder'],
  coriander: ['#3e8f2f', '#2a6a1f', 'leaves'],
};

export function ingredientThumb(id) {
  const [base, dark, kind] = THUMB[id] || ['#e7dccb', '#bfae94', 'dots'];
  const r = rng(id.length * 97 + id.charCodeAt(0));
  let marks = '';
  const n = kind === 'chunks' ? 7 : kind === 'seeds' ? 10 : kind === 'leaves' ? 6 : kind === 'shine' ? 0 : 14;
  for (let i = 0; i < n; i++) {
    const [x, y] = inCircle(r, 15, 24, 24);
    if (kind === 'chunks') marks += `<rect x="${f(x - 3)}" y="${f(y - 3)}" width="6" height="6" rx="1.5" fill="${dark}"/>`;
    else if (kind === 'seeds') marks += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3" ry="1.2" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${dark}"/>`;
    else if (kind === 'leaves') marks += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="${dark}"/>`;
    else marks += `<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${dark}" opacity=".7"/>`;
  }
  const shine = kind === 'shine' ? `<ellipse cx="19" cy="18" rx="7" ry="3" fill="#fff" opacity=".6" transform="rotate(-30 19 18)"/>` : '';
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="23" fill="#f3eee5" stroke="#e2d9ca" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="18" fill="${base}"/>${marks}${shine}</svg>`;
}

export function artSvg(name, label = '') {
  const scene = SCENES[name] || SCENES.final;
  const id = `art${++uid}`;
  const r = rng(SEEDS[name] || 1);
  return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
    ${defs(id)}
    <rect width="400" height="400" fill="url(#${id}-bg)"/>
    ${scene(id, r)}
    <rect width="400" height="400" fill="url(#${id}-light)"/>
  </svg>`;
}
