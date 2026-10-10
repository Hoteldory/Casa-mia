// Palette, texture procedurali (canvas) e materiali condivisi.
// Stile: "antico in chiave moderna" — finiture opache, legno noce, ottone brunito,
// ceramica smaltata, pietra, ferro battuto sottile, cotto. Niente lucido, niente cromo.
import * as THREE from 'three';

export const PALETTE = {
  calce: '#efe9dd',
  calceScuro: '#e3dccd',
  tortora: '#b5a999',
  tortoraScuro: '#8c7f70',
  salvia: '#4d6152',
  salviaChiaro: '#8d9d88',
  noce: '#5a3b25',
  noceChiaro: '#8a5f3d',
  noceScuro: '#3e2818',
  rovere: '#b08a5e',
  ottone: '#b08d57',
  ottoneScuro: '#7d6238',
  ferro: '#2a2825',
  cotto: '#b46644',
  senape: '#c8962c',
  cobalto: '#1d3f8c',
  terracotta: '#9a4f33',
  crema: '#ede0c6',
  nero: '#1b1917',
  pietra: '#b9b2a3',
  verdeBottiglia: '#2c4740',
};

// ---------- utilità ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(size, draw, { repeat = [1, 1], srgb = true, seed = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function noiseOver(ctx, size, r, { n = 4000, alpha = 0.06, colors = ['#000', '#fff'], rmin = 1, rmax = 3 } = {}) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = alpha * r();
    const rad = rmin + r() * (rmax - rmin);
    ctx.beginPath();
    ctx.arc(r() * size, r() * size, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- texture ----------
export function texIntonaco(color = PALETTE.calce, seed = 3) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 14000, alpha: 0.035, colors: ['#6b5f52', '#ffffff', '#c8bba8'], rmin: 0.5, rmax: 2 });
    // tracce di frattazzo
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = '#7a6c5d';
    for (let i = 0; i < 160; i++) {
      ctx.beginPath();
      const x = r() * s, y = r() * s, a = r() * Math.PI, l = 20 + r() * 80;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, { seed });
}

// Legno con venature: tavole orizzontali (lungo U)
export function texLegno({ base = PALETTE.noce, scuro = PALETTE.noceScuro, chiaro = PALETTE.noceChiaro, plance = 0, seed = 7, repeat = [1, 1] } = {}) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    // venature: linee ondulate
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = r() < 0.5 ? scuro : chiaro;
      ctx.globalAlpha = 0.10 + r() * 0.25;
      ctx.lineWidth = 0.6 + r() * 2.2;
      const y = r() * s;
      const amp = 2 + r() * 8;
      const f = 0.01 + r() * 0.03;
      ctx.beginPath();
      for (let x = 0; x <= s; x += 6) {
        const yy = y + Math.sin(x * f + i) * amp + Math.sin(x * f * 3.1) * amp * 0.3;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // nodi
    for (let i = 0; i < 3; i++) {
      const x = r() * s, y = r() * s;
      for (let k = 6; k > 0; k--) {
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = scuro;
        ctx.beginPath();
        ctx.ellipse(x, y, k * 4, k * 2.2, r() * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (plance > 0) {
      const h = s / plance;
      ctx.strokeStyle = 'rgba(20,10,5,0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= plance; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * h); ctx.lineTo(s, i * h); ctx.stroke();
        // giunti di testa sfalsati
        ctx.beginPath();
        const jx = ((i * 0.37) % 1) * s;
        ctx.moveTo(jx, i * h); ctx.lineTo(jx, (i + 1) * h); ctx.stroke();
      }
    }
    noiseOver(ctx, s, r, { n: 3000, alpha: 0.05, colors: [scuro, chiaro], rmin: 0.5, rmax: 1.5 });
  }, { seed, repeat });
}

// Maiolica dipinta a mano, blu cobalto su bianco: modulo 2x2 piastrelle 15 cm (texture = 30 cm)
export function texMaiolica(seed = 11) {
  return canvasTexture(512, (ctx, s, r) => {
    const t = s / 2; // lato piastrella in px
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, s, s);
    const blu = PALETTE.cobalto;
    const bluChiaro = '#4b6fb8';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const ox = i * t, oy = j * t;
      ctx.save();
      ctx.translate(ox, oy);
      // sfumature dello smalto
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = bluChiaro;
      ctx.fillRect(4, 4, t - 8, t - 8);
      ctx.globalAlpha = 1;
      // bordo
      ctx.strokeStyle = blu;
      ctx.lineWidth = 5;
      ctx.strokeRect(14, 14, t - 28, t - 28);
      // quarti di rosetta agli angoli (formano un fiore tra 4 piastrelle)
      ctx.fillStyle = blu;
      const corners = [[0, 0], [t, 0], [0, t], [t, t]];
      for (const [cx, cy] of corners) {
        ctx.beginPath(); ctx.arc(cx, cy, t * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f4f1e8';
        ctx.beginPath(); ctx.arc(cx, cy, t * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = blu;
        ctx.beginPath(); ctx.arc(cx, cy, t * 0.07, 0, Math.PI * 2); ctx.fill();
      }
      // stella centrale a 8 punte
      ctx.save();
      ctx.translate(t / 2, t / 2);
      ctx.fillStyle = blu;
      for (let k = 0; k < 2; k++) {
        ctx.rotate(Math.PI / 4 * k);
        ctx.beginPath();
        for (let p = 0; p < 4; p++) {
          const a = (Math.PI / 2) * p;
          ctx.lineTo(Math.cos(a) * t * 0.3, Math.sin(a) * t * 0.3);
          ctx.lineTo(Math.cos(a + Math.PI / 4) * t * 0.12, Math.sin(a + Math.PI / 4) * t * 0.12);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#f4f1e8';
      ctx.beginPath(); ctx.arc(0, 0, t * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // foglioline sui lati
      ctx.strokeStyle = blu;
      ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.translate(t / 2, t / 2);
        ctx.rotate((Math.PI / 2) * k);
        ctx.beginPath();
        ctx.moveTo(0, -t * 0.34);
        ctx.quadraticCurveTo(t * 0.06, -t * 0.42, 0, -t * 0.46);
        ctx.quadraticCurveTo(-t * 0.06, -t * 0.42, 0, -t * 0.34);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    // fughe
    ctx.strokeStyle = '#cfc8b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t, 0); ctx.lineTo(t, s); ctx.moveTo(0, t); ctx.lineTo(s, t);
    ctx.moveTo(1, 0); ctx.lineTo(1, s); ctx.moveTo(0, 1); ctx.lineTo(s, 1);
    ctx.stroke();
    // imperfezioni dello smalto dipinto a mano
    noiseOver(ctx, s, r, { n: 700, alpha: 0.12, colors: [blu, '#ffffff'], rmin: 0.5, rmax: 2 });
  }, { seed });
}

// Cementine: modulo 2x2 piastrelle 20 cm (texture = 40 cm) — motivo a stella terracotta/nero/crema
export function texCementine(seed = 5) {
  return canvasTexture(512, (ctx, s, r) => {
    const t = s / 2;
    const crema = '#e6d9bf', terra = PALETTE.terracotta, nero = '#2a2624', salvia = PALETTE.salvia;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.save();
      ctx.translate(i * t, j * t);
      ctx.fillStyle = crema;
      ctx.fillRect(0, 0, t, t);
      // 4 triangoli terracotta dagli angoli verso il centro (a rotazione formano stelle)
      ctx.fillStyle = terra;
      const tri = (a, b, c) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.closePath(); ctx.fill(); };
      tri([0, 0], [t / 2, 0], [0, t / 2]);
      tri([t, 0], [t, t / 2], [t / 2, 0]);
      tri([0, t], [0, t / 2], [t / 2, t]);
      tri([t, t], [t / 2, t], [t, t / 2]);
      // rombo centrale salvia con bordo nero
      ctx.fillStyle = salvia;
      ctx.beginPath();
      ctx.moveTo(t / 2, t * 0.2); ctx.lineTo(t * 0.8, t / 2); ctx.lineTo(t / 2, t * 0.8); ctx.lineTo(t * 0.2, t / 2); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = nero; ctx.lineWidth = 4; ctx.stroke();
      // punto nero al centro
      ctx.fillStyle = nero;
      ctx.beginPath(); ctx.arc(t / 2, t / 2, t * 0.06, 0, Math.PI * 2); ctx.fill();
      // linee nere sottili lungo le diagonali dei triangoli
      ctx.strokeStyle = nero; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t / 2, 0); ctx.lineTo(0, t / 2); ctx.moveTo(t / 2, 0); ctx.lineTo(t, t / 2);
      ctx.moveTo(t / 2, t); ctx.lineTo(0, t / 2); ctx.moveTo(t / 2, t); ctx.lineTo(t, t / 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#a89c86';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t, 0); ctx.lineTo(t, s); ctx.moveTo(0, t); ctx.lineTo(s, t);
    ctx.moveTo(1, 0); ctx.lineTo(1, s); ctx.moveTo(0, 1); ctx.lineTo(s, 1);
    ctx.stroke();
    noiseOver(ctx, s, r, { n: 2500, alpha: 0.10, colors: ['#000', '#fff', terra], rmin: 0.5, rmax: 2 });
  }, { seed });
}

// Cotto: modulo 2x2 di 30 cm (texture = 60 cm)
export function texCotto(seed = 9) {
  return canvasTexture(512, (ctx, s, r) => {
    const t = s / 2;
    ctx.fillStyle = '#7a4a33';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const h = 15 + r() * 5, l = 39 + r() * 5;
      ctx.fillStyle = `hsl(${h}, 48%, ${l}%)`;
      ctx.fillRect(i * t + 3, j * t + 3, t - 6, t - 6);
      ctx.save();
      ctx.beginPath(); ctx.rect(i * t + 3, j * t + 3, t - 6, t - 6); ctx.clip();
      noiseOver(ctx, s, r, { n: 1500, alpha: 0.12, colors: ['#3a1f12', '#e0a07a', '#c47c55'], rmin: 1, rmax: 5 });
      ctx.restore();
    }
  }, { seed });
}

// Parquet: 8 plance per texture (texture = 1,2 m x 1,2 m circa)
export function texParquet(seed = 13) {
  return texLegno({ base: '#7d5537', scuro: '#4a2f1b', chiaro: '#a7754c', plance: 8, seed });
}

// Pietra grigio-beige venata (top isola, davanzali, lavabo)
export function texPietra(seed = 17, base = '#b7b0a2') {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 12000, alpha: 0.07, colors: ['#6e6558', '#ffffff', '#8f8676'], rmin: 1, rmax: 5 });
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = r() < 0.5 ? '#7c7466' : '#d9d3c6';
      ctx.globalAlpha = 0.25 + r() * 0.3;
      ctx.lineWidth = 0.5 + r() * 1.8;
      ctx.beginPath();
      let x = r() * s, y = r() * s;
      ctx.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        const nx = x + (r() - 0.5) * 140, ny = y + (r() - 0.5) * 140;
        ctx.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60, nx, ny);
        x = nx; y = ny;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, { seed });
}

// Lastre di pietra a correre, 60 x 60 cm (texture = 1,2 m): tono diverso per lastra, fughe sottili
export function texLastre(base = '#c9c0ad', seed = 43) {
  return canvasTexture(512, (ctx, s, r) => {
    const t = s / 2;
    ctx.fillStyle = '#8f877a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = base;
      ctx.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
      ctx.save();
      ctx.beginPath(); ctx.rect(i * t + 2, j * t + 2, t - 4, t - 4); ctx.clip();
      ctx.globalAlpha = 0.10 + r() * 0.12;
      ctx.fillStyle = r() < 0.5 ? '#8a8171' : '#efe8da';
      ctx.fillRect(i * t, j * t, t, t);
      ctx.globalAlpha = 1;
      noiseOver(ctx, s, r, { n: 2500, alpha: 0.10, colors: ['#6e6558', '#ffffff', '#a39a88'], rmin: 1, rmax: 4 });
      ctx.restore();
    }
  }, { seed });
}

// Piastrelle smaltate fatte a mano 10 x 10 (texture = 40 cm): smalto irregolare, fuga chiara
export function texPiastrelle(color, seed = 47, fuga = '#d8d0c0', variazione = 0.36) {
  return canvasTexture(512, (ctx, s, r) => {
    const n = 4, t = s / n;
    ctx.fillStyle = fuga;
    ctx.fillRect(0, 0, s, s);
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const hsl = {}; c.getHSL(hsl);
      const tone = new THREE.Color().setHSL(hsl.h + (r() - 0.5) * 0.02, hsl.s * (0.85 + r() * 0.3), hsl.l * (1 - variazione / 2 + r() * variazione));
      ctx.fillStyle = '#' + tone.getHexString();
      ctx.fillRect(i * t + 3, j * t + 3, t - 6, t - 6);
      // riflesso dello smalto e bordi piu' scuri, come nelle piastrelle fatte a mano
      const gr = ctx.createRadialGradient(i * t + t * 0.35, j * t + t * 0.3, 2, i * t + t / 2, j * t + t / 2, t * 0.75);
      gr.addColorStop(0, 'rgba(255,255,255,0.18)');
      gr.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = gr;
      ctx.fillRect(i * t + 3, j * t + 3, t - 6, t - 6);
    }
    noiseOver(ctx, s, r, { n: 1500, alpha: 0.08, colors: ['#000', '#fff'], rmin: 0.5, rmax: 2 });
  }, { seed });
}

// Carta da parati a righe (texture = 50 cm di larghezza): fondo e righe larghe, filetti sottili
export function texRighe(fondo, riga, seed = 53) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = riga;
    for (let k = 0; k < 4; k++) {
      const x0 = k * s / 4;
      ctx.fillRect(x0 + s * 0.04, 0, s * 0.09, s);
      ctx.fillRect(x0 + s * 0.17, 0, s * 0.012, s);
    }
    noiseOver(ctx, s, r, { n: 3000, alpha: 0.05, colors: ['#000', '#fff'], rmin: 0.5, rmax: 1.5 });
  }, { seed });
}

// Coppi in cotto visti dall'alto (texture = 80 x 80 cm): 4 file da 20 cm, corsi da 40 cm,
// ogni coppo con la sua ombreggiatura a mezzo cilindro e un tono leggermente diverso
export function texCoppi(seed = 59) {
  return canvasTexture(512, (ctx, s, r) => {
    const nc = 4, nr = 2, cw = s / nc, rh = s / nr;
    ctx.fillStyle = '#5e2f1c';
    ctx.fillRect(0, 0, s, s);
    for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) {
      const hue = 14 + r() * 8, lum = 36 + r() * 10;
      const gr = ctx.createLinearGradient(i * cw, 0, (i + 1) * cw, 0);
      gr.addColorStop(0, `hsl(${hue}, 45%, ${lum - 14}%)`);
      gr.addColorStop(0.45, `hsl(${hue}, 50%, ${lum + 6}%)`);
      gr.addColorStop(1, `hsl(${hue}, 45%, ${lum - 16}%)`);
      ctx.fillStyle = gr;
      ctx.fillRect(i * cw + 2, j * rh + 3, cw - 4, rh - 3);
      // bordo inferiore del coppo che sormonta il corso sotto
      ctx.fillStyle = 'rgba(40, 18, 8, 0.45)';
      ctx.fillRect(i * cw + 2, (j + 1) * rh - 7, cw - 4, 5);
    }
    noiseOver(ctx, s, r, { n: 5000, alpha: 0.12, colors: ['#2a140a', '#d9956a', '#8a8a6a'], rmin: 0.5, rmax: 3 });
  }, { seed });
}

// Prato (texture = 2 m): verde variato con ciuffi piu' chiari e piu' scuri
export function texPrato(seed = 61) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = '#5d7a3c';
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 26000, alpha: 0.35, colors: ['#4a6a2e', '#7a9650', '#3f5a28', '#6f8c45', '#8aa35c'], rmin: 0.8, rmax: 3 });
  }, { seed });
}

// Ghiaia chiara (texture = 1 m)
export function texGhiaia(seed = 67) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = '#b9ad98';
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 22000, alpha: 0.5, colors: ['#8d8271', '#d8cfbd', '#a29680', '#e9e2d3', '#766b5c'], rmin: 1, rmax: 3.5 });
  }, { seed });
}

// Velluto: colore pieno con grana finissima
export function texVelluto(color = PALETTE.senape, seed = 19) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 20000, alpha: 0.10, colors: ['#000', '#fff'], rmin: 0.4, rmax: 1 });
  }, { seed });
}

// Lino / tessuto tramato
export function texLino(color = '#c9bfae', seed = 23) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < s; i += 3) {
      ctx.fillStyle = i % 6 ? '#000' : '#fff';
      ctx.fillRect(i, 0, 1, s);
      ctx.fillRect(0, i, s, 1);
    }
    ctx.globalAlpha = 1;
    noiseOver(ctx, s, r, { n: 4000, alpha: 0.08, colors: ['#000', '#fff'], rmin: 0.4, rmax: 1.2 });
  }, { seed });
}

// Carta da parati botanica: fondo verde bottiglia, foglie salvia e crema — seamless
export function texCartaBotanica(seed = 29) {
  return canvasTexture(1024, (ctx, s, r) => {
    ctx.fillStyle = PALETTE.verdeBottiglia;
    ctx.fillRect(0, 0, s, s);
    const leaf = (x, y, len, ang, col) => {
      for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.rotate(ang);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.35, -len * 0.28, len, 0);
        ctx.quadraticCurveTo(len * 0.35, len * 0.28, 0, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(len * 0.05, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke();
        ctx.restore();
      }
    };
    const branch = (x, y, ang, n, col) => {
      ctx.strokeStyle = 'rgba(190,200,170,0.5)';
      ctx.lineWidth = 2;
      let px = x, py = y;
      for (let i = 0; i < n; i++) {
        const nx = px + Math.cos(ang) * 40, ny = py + Math.sin(ang) * 40;
        for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
          ctx.beginPath(); ctx.moveTo(px + dx, py + dy); ctx.lineTo(nx + dx, ny + dy); ctx.stroke();
        }
        leaf(nx, ny, 55 + r() * 30, ang + 0.9 + r() * 0.3, col);
        leaf(nx, ny, 55 + r() * 30, ang - 0.9 - r() * 0.3, col);
        px = nx; py = ny;
        ang += (r() - 0.5) * 0.5;
      }
    };
    const cols = [PALETTE.salviaChiaro, '#6f8a72', '#d8ccae', '#9fb094'];
    for (let i = 0; i < 14; i++) {
      branch(r() * s, r() * s, r() * Math.PI * 2, 5 + Math.floor(r() * 5), cols[i % cols.length]);
    }
    // bacche crema
    ctx.fillStyle = PALETTE.crema;
    for (let i = 0; i < 60; i++) {
      const x = r() * s, y = r() * s;
      for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 3 + r() * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }, { seed });
}

// Boiserie: nessuna texture (geometria), ma vernice opaca con grana leggera
export function texVernice(color, seed = 31) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 5000, alpha: 0.05, colors: ['#000', '#fff'], rmin: 0.5, rmax: 2 });
  }, { seed });
}

// Rete in ottone (ante di credenze e mobili hi-fi): fondo scuro, trama a rombi
export function texRete(seed = 41) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#16130f';
    ctx.fillRect(0, 0, s, s);
    const step = s / 8;
    ctx.lineWidth = 2.6;
    for (let i = -8; i < 17; i++) {
      ctx.strokeStyle = PALETTE.ottoneScuro;
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step + s, s); ctx.stroke();
      ctx.strokeStyle = PALETTE.ottone;
      ctx.beginPath(); ctx.moveTo(i * step, s); ctx.lineTo(i * step + s, 0); ctx.stroke();
    }
    // luce sui nodi della trama
    ctx.fillStyle = '#d8b476';
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
      ctx.globalAlpha = 0.5 + r() * 0.4;
      ctx.beginPath(); ctx.arc(a * step, b * step, 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, { seed });
}

// Ghiaia/terra per il terreno
export function texTerreno(seed = 37) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = '#8f8a6e';
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 15000, alpha: 0.25, colors: ['#5c6b45', '#a8a184', '#6e6a55', '#7f8c5a'], rmin: 1, rmax: 6 });
  }, { seed });
}

// ================= piano primo, stile country chiaro (foto di riferimento) =================

// Rovere a listoni larghi (texture = 1,20 m): 6 listoni da 20 cm, ognuno con il suo tono,
// venatura, qualche nodo e i giunti di testa sfalsati
export function texListoni(seed = 71) {
  return canvasTexture(1024, (ctx, s, r) => {
    const n = 6, h = s / n;
    for (let i = 0; i < n; i++) {
      // giunti di testa: ogni listone ha uno o due tagli, sfalsati
      const tagli = [0, (0.25 + r() * 0.5) * s, s];
      const tratti = [[tagli[0], tagli[1]], [tagli[1], tagli[2]]];
      for (const [x0, x1] of tratti) {
        const hue = 31 + r() * 3, sat = 30 + r() * 6, lum = 53 + r() * 5;
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
        ctx.fillRect(x0, i * h, x1 - x0, h);
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, i * h, x1 - x0, h); ctx.clip();
        for (let k = 0; k < 26; k++) {
          ctx.strokeStyle = r() < 0.65 ? `hsla(${hue - 4}, 38%, ${lum - 20}%, 0.55)` : `hsla(${hue + 3}, 42%, ${lum + 10}%, 0.4)`;
          ctx.globalAlpha = 0.15 + r() * 0.35;
          ctx.lineWidth = 0.6 + r() * 2;
          const y = i * h + r() * h, amp = 1 + r() * 5, f = 0.004 + r() * 0.012, ph = r() * 9;
          ctx.beginPath();
          for (let x = x0; x <= x1 + 8; x += 8) {
            const yy = y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.7) * amp * 0.25;
            x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        if (r() < 0.45) {
          const nx = x0 + r() * (x1 - x0), ny = i * h + h * (0.3 + r() * 0.4);
          for (let k = 5; k > 0; k--) {
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = `hsl(${hue - 6}, 45%, ${lum - 28}%)`;
            ctx.beginPath(); ctx.ellipse(nx, ny, k * 4.5, k * 2, 0, 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(40,24,10,0.55)';
        ctx.fillRect(x1 - 1, i * h, 2, h); // giunto di testa
      }
      ctx.fillStyle = 'rgba(40,24,10,0.6)';
      ctx.fillRect(0, i * h, s, 2);           // fuga fra i listoni
      ctx.fillStyle = 'rgba(255,240,215,0.10)';
      ctx.fillRect(0, i * h + 2, s, 2);        // smusso illuminato
    }
    noiseOver(ctx, s, r, { n: 9000, alpha: 0.05, colors: ['#3b2412', '#f2d6a8'], rmin: 0.5, rmax: 1.6 });
  }, { seed });
}

// Piastrelle "metro" bianche 7,5 x 15 a correre (texture = 60 cm), smalto con bordo stondato
export function texMetro(seed = 73) {
  return canvasTexture(512, (ctx, s, r) => {
    const tw = s / 4, th = s / 8, f = 3;
    ctx.fillStyle = '#cdc8be';
    ctx.fillRect(0, 0, s, s);
    for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) {
      const x = i * tw + (j % 2 ? tw / 2 : 0), y = j * th;
      const l = 93 + r() * 3;
      const gr = ctx.createLinearGradient(0, y + f, 0, y + th - f);
      gr.addColorStop(0, `hsl(40, 18%, ${l - 3}%)`);
      gr.addColorStop(0.2, `hsl(40, 18%, ${l}%)`);
      gr.addColorStop(0.85, `hsl(40, 16%, ${l - 1}%)`);
      gr.addColorStop(1, `hsl(40, 14%, ${l - 6}%)`);
      ctx.fillStyle = gr;
      ctx.fillRect(x + f / 2, y + f / 2, tw - f, th - f);
    }
    noiseOver(ctx, s, r, { n: 2500, alpha: 0.04, colors: ['#000', '#fff'], rmin: 0.5, rmax: 1.5 });
  }, { seed });
}

// Juta intrecciata (texture = 40 cm): trama a canestro in fili grossi
export function texJuta(seed = 75) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#b39467';
    ctx.fillRect(0, 0, s, s);
    const p = s / 16;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const orizz = (i + j) % 2 === 0;
      ctx.fillStyle = `hsl(${34 + r() * 6}, ${32 + r() * 10}%, ${52 + r() * 12}%)`;
      if (orizz) for (let k = 0; k < 3; k++) ctx.fillRect(i * p, j * p + k * p / 3 + 1, p, p / 3 - 2);
      else for (let k = 0; k < 3; k++) ctx.fillRect(i * p + k * p / 3 + 1, j * p, p / 3 - 2, p);
    }
    noiseOver(ctx, s, r, { n: 3000, alpha: 0.08, colors: ['#3a2a14', '#f0dcb0'], rmin: 0.4, rmax: 1.2 });
  }, { seed });
}

// Tessuto a fiorellini azzurri su fondo panna (texture = 25 cm)
export function texFloreale(fondo = '#efe8da', fiore = '#5f7f9c', seed = 77) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, s, s);
    const fiorellino = (x, y, rr) => {
      for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
        ctx.fillStyle = fiore;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(x + dx + Math.cos(a) * rr, y + dy + Math.sin(a) * rr, rr * 0.75, rr * 0.45, a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#d9b46a';
        ctx.beginPath(); ctx.arc(x + dx, y + dy, rr * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7d9474'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + dx + rr, y + dy + rr); ctx.quadraticCurveTo(x + dx + rr * 2.5, y + dy + rr * 1.2, x + dx + rr * 3, y + dy + rr * 2.6); ctx.stroke();
      }
    };
    for (let i = 0; i < 22; i++) fiorellino(r() * s, r() * s, 4 + r() * 4);
    noiseOver(ctx, s, r, { n: 2000, alpha: 0.05, colors: ['#000', '#fff'], rmin: 0.4, rmax: 1.2 });
  }, { seed });
}

// Tenda a pacchetto in bambu' (texture = 30 cm): stecche orizzontali e due fili di cucitura
export function texBambu(seed = 79) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#a07d4c';
    ctx.fillRect(0, 0, s, s);
    const n = 24, h = s / n;
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = `hsl(${33 + r() * 6}, ${38 + r() * 10}%, ${50 + r() * 14}%)`;
      ctx.fillRect(0, j * h + 1, s, h - 2);
      ctx.fillStyle = 'rgba(80,50,20,0.35)';
      for (let k = 0; k < 3; k++) ctx.fillRect(r() * s, j * h + 1, 2, h - 2); // nodi della canna
    }
    ctx.fillStyle = 'rgba(70,45,20,0.6)';
    for (const x of [s * 0.25, s * 0.75]) ctx.fillRect(x, 0, 2, s);
  }, { seed });
}

// Tappeto persiano (una texture per tutto il tappeto): campo panna a rosette su reticolo,
// medaglione a losanga, cornice blu polvere con rosette, filetti ruggine; tinte sbiadite
export function texPersiano({ campo = '#e7dbc3', blu = '#6d84a0', bluScuro = '#4d6280', ruggine = '#b0704f', seed = 81 } = {}) {
  return canvasTexture(1024, (ctx, s, r) => {
    ctx.fillStyle = campo;
    ctx.fillRect(0, 0, s, s);
    // abrash: fasce di tono leggermente diverse, come la lana tinta a mano
    for (let y = 0; y < s; y += 32) { ctx.fillStyle = `rgba(120,90,50,${r() * 0.05})`; ctx.fillRect(0, y, s, 32); }
    const rosetta = (x, y, k, petali, centro) => {
      ctx.fillStyle = petali;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * k * 0.55, y + Math.sin(a) * k * 0.55, k * 0.42, k * 0.22, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = centro; ctx.beginPath(); ctx.arc(x, y, k * 0.25, 0, Math.PI * 2); ctx.fill();
    };
    const losanga = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - ry); ctx.lineTo(x + rx, y); ctx.lineTo(x, y + ry); ctx.lineTo(x - rx, y); ctx.closePath(); ctx.fill(); };
    // campo: reticolo di tralci e rosette
    const passo = 56;
    ctx.strokeStyle = 'rgba(109,132,160,0.45)'; ctx.lineWidth = 2;
    for (let k = -s; k < 2 * s; k += passo) {
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + s, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k, s); ctx.lineTo(k + s, 0); ctx.stroke();
    }
    for (let y = 0; y <= s; y += passo) for (let x = (y / passo) % 2 ? passo / 2 : 0; x <= s; x += passo) {
      rosetta(x, y, 13, r() < 0.5 ? blu : ruggine, '#d8c59c');
    }
    // medaglione a losanga con cornice e rosette
    const c = s / 2;
    losanga(c, c, 250, 200, bluScuro);
    losanga(c, c, 234, 186, campo);
    losanga(c, c, 200, 158, blu);
    losanga(c, c, 150, 118, '#e2d2b2');
    losanga(c, c, 70, 56, ruggine);
    losanga(c, c, 40, 32, '#e2d2b2');
    for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; rosetta(c + Math.cos(t) * 110, c + Math.sin(t) * 86, 16, a % 2 ? ruggine : bluScuro, '#efe3c8'); }
    // pennacchi negli angoli del campo
    for (const [x, y] of [[150, 150], [s - 150, 150], [150, s - 150], [s - 150, s - 150]]) { losanga(x, y, 70, 56, blu); rosetta(x, y, 22, ruggine, campo); }
    // cornice: banda blu polvere con rosette, filetti ruggine e blu scuro
    const banda = (m, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.strokeRect(m, m, s - 2 * m, s - 2 * m); };
    banda(52, 64, blu);
    banda(16, 10, ruggine);
    banda(90, 6, ruggine);
    banda(104, 4, bluScuro);
    for (let i = 0; i < 22; i++) {
      const t = 52 + (i + 0.5) / 22 * (s - 104);
      for (const [x, y] of [[t, 52], [t, s - 52], [52, t], [s - 52, t]]) rosetta(x, y, 17, i % 2 ? '#e8d9b8' : ruggine, bluScuro);
    }
    noiseOver(ctx, s, r, { n: 40000, alpha: 0.06, colors: ['#000', '#fff'], rmin: 0.5, rmax: 1.4 });
  }, { seed });
}

// Stampa botanica incorniciata: carta panna, un rametto di foglie e qualche fiore azzurro
export function texStampaBotanica(seed = 91) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(120,100,70,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(22, 22, s - 44, s - 44);
    const verdi = ['#6f7f5a', '#8a9a72', '#5e6b47'];
    ctx.strokeStyle = '#6a5a3e'; ctx.lineWidth = 2.5;
    const x0 = s * (0.4 + r() * 0.2), y0 = s * 0.86, x1 = s * (0.35 + r() * 0.3), y1 = s * 0.16;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(s * (0.3 + r() * 0.4), s * 0.5, x1, y1); ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const t = 0.12 + i * 0.075, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, lato = i % 2 ? 1 : -1;
      ctx.fillStyle = verdi[i % 3];
      ctx.save(); ctx.translate(x, y); ctx.rotate(lato * (0.7 + r() * 0.4) - 0.2);
      ctx.beginPath(); ctx.ellipse(lato * 20, 0, 22 - i, 8 - i * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const x = x1 + (r() - 0.5) * 40, y = y1 + 10 + r() * 30;
      ctx.fillStyle = '#7f98b4';
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#d9b46a'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(90,70,50,0.6)'; ctx.font = 'italic 12px Georgia';
    ctx.fillText(['Olea europaea', 'Salvia officinalis', 'Laurus nobilis', 'Rosmarinus'][Math.floor(r() * 4)], 40, s - 34);
    noiseOver(ctx, s, r, { n: 2500, alpha: 0.05, colors: ['#5a4a30', '#fff'], rmin: 0.4, rmax: 1.2 });
  }, { seed });
}

// Stampa astratta (camera matrimoniale): carta panna, un arco blu avio, una forma verde oliva
// e un filo nero, come le stampe moderne di una parete di quadri
export function texAstratto(seed = 97) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#eee7d8';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#4f6f8c';
    ctx.beginPath(); ctx.arc(s * 0.46, s * 0.62, s * 0.26, Math.PI, 0); ctx.lineTo(s * 0.72, s * 0.8); ctx.lineTo(s * 0.2, s * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eee7d8';
    ctx.beginPath(); ctx.arc(s * 0.46, s * 0.66, s * 0.11, Math.PI, 0); ctx.lineTo(s * 0.57, s * 0.8); ctx.lineTo(s * 0.35, s * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a5530';
    ctx.beginPath(); ctx.ellipse(s * 0.62, s * 0.3, s * 0.13, s * 0.09, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a9bcc9';
    ctx.beginPath(); ctx.arc(s * 0.3, s * 0.28, s * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1f1d1a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.45); ctx.bezierCurveTo(s * 0.4, s * 0.35, s * 0.55, s * 0.55, s * 0.8, s * 0.42); ctx.stroke();
    noiseOver(ctx, s, r, { n: 2500, alpha: 0.05, colors: ['#5a4a30', '#fff'], rmin: 0.4, rmax: 1.2 });
  }, { seed });
}

// Ardesia in lastre 40 x 40 (texture = 80 cm): grigio antracite con riflessi blu e verdi,
// superficie a sfaldature, fughe scure
export function texArdesia(seed = 83) {
  return canvasTexture(512, (ctx, s, r) => {
    const t = s / 2;
    ctx.fillStyle = '#2a2b2c';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const l = 30 + r() * 8, h = 200 + r() * 30;
      ctx.fillStyle = `hsl(${h}, 7%, ${l}%)`;
      ctx.fillRect(i * t + 3, j * t + 3, t - 6, t - 6);
      ctx.save(); ctx.beginPath(); ctx.rect(i * t + 3, j * t + 3, t - 6, t - 6); ctx.clip();
      for (let k = 0; k < 18; k++) {
        ctx.fillStyle = `hsla(${h + (r() - 0.5) * 60}, 10%, ${l + (r() - 0.5) * 12}%, 0.35)`;
        const y = j * t + r() * t;
        ctx.beginPath(); ctx.moveTo(i * t, y);
        for (let x = 0; x <= t; x += 16) ctx.lineTo(i * t + x, y + (r() - 0.5) * 10);
        ctx.lineTo(i * t + t, y + 14 + r() * 20); ctx.lineTo(i * t, y + 14 + r() * 20); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    noiseOver(ctx, s, r, { n: 9000, alpha: 0.08, colors: ['#000', '#9aa3a8'], rmin: 0.5, rmax: 1.8 });
  }, { seed });
}

// Pavimento in gomma da palestra: grigio ardesia con granuli chiari (texture = 50 cm)
export function texGomma(seed = 87) {
  return canvasTexture(256, (ctx, s, r) => {
    ctx.fillStyle = '#3d4140';
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 2600, alpha: 0.9, colors: ['#6f7672', '#8d948e', '#2c2f2e', '#a3a89f'], rmin: 0.6, rmax: 1.6 });
  }, { seed });
}

// ---------- rilievo: la texture stessa fa da mappa di rilievo (bump map) ----------
// L'altezza e' la tinta della texture: fughe, venature, trame e bordi dei coppi, piu' scuri,
// stanno piu' in basso. Lo calcola la scheda grafica pixel per pixel, nessuna texture in piu'.
// Forza < 0 inverte, per le piastrelle smaltate con la fuga chiara.
// materiale -> forza del rilievo
const RILIEVO = {
  intonaco: 0.35, intonacoSoffitto: 0.2, intonacoEsterno: 0.5,
  noce: 0.5, noceVerticale: 0.5, noceScuro: 0.5, rovere: 0.5, parquet: 0.7,
  cotto: 0.6, cementine: 0.5, maiolica: 0.5, lastre: 0.9, pietra: 0.35, pietraScura: 0.35,
  piastrelleVerdi: -1.0, piastrelleCrema: 0.9, piastrelleOcra: -1.0, coppi: 1.6,
  lino: 0.8, linoBianco: 0.8, linoTortora: 0.8, velluto: 0.4, vellutoSalvia: 0.4, vellutoRuggine: 0.4,
  salvia: 0.25, salviaChiaro: 0.25, terracottaPittura: 0.25, tortora: 0.25, bluPetrolio: 0.25, bluPolvere: 0.25, crema: 0.25, scuri: 0.3,
  prato: 1.0, ghiaia: 1.4, terreno: 1.0, terraOrto: 1.0,
  rovereListoni: 0.8, rovereMiele: 0.5, marmo: 0.2, metro: 1.0, azzurroPolvere: 0.25, biancoLatte: 0.2,
  linoAvena: 0.8, linoAzzurro: 0.8, floreale: 0.3, righeAzzurre: 0.2, juta: 1.5, bambu: 1.2,
  olivaPittura: 0.25, linoRuggine: 0.8, ardesia: 1.2, cartaRigheAzzurre: 0.15, gomma: 1.4, cognac: 0.3,
  bluAvio: 0.25, noceCaldo: 0.5, vellutoOliva: 0.4, vellutoAvio: 0.4,
};
function applicaRilievo(M) {
  for (const [k, f] of Object.entries(RILIEVO)) {
    const m = M[k];
    if (!m?.map) continue;
    m.bumpMap = m.map;
    m.bumpScale = f;
  }
}

// ---------- texture fotografiche (Poly Haven, CC0; vedi tools/texture_foto.py) ----------
// Per ogni materiale: la foto da cui prendere trama e rilievo, quanti metri copre, la forza della
// normal map, se ha la mappa di ruvidita', una rotazione in piu'. Nei materiali "dettaglio" il
// colore resta quello scelto per la casa (la media della texture disegnata); i "naturali" tengono
// i colori della foto.
const PAINT = { src: 'vernice', m: 1.2, n: 0.25 };
const LEGNO = { src: 'legno', m: 0.8, n: 0.5, rot: Math.PI / 2 };
const LINO = { src: 'lino', m: 0.35, n: 0.6 };
const VELLUTO = { src: 'velluto', m: 0.4, n: 0.4 };
const FOTO = {
  intonaco: { src: 'intonaco', m: 2.0, n: 0.6 },
  intonacoSoffitto: { src: 'intonaco', m: 2.0, n: 0.4 },
  intonacoEsterno: { src: 'intonaco', m: 1.5, n: 1.0 },
  salvia: PAINT, salviaChiaro: PAINT, terracottaPittura: PAINT, tortora: PAINT, scuri: PAINT,
  bluPetrolio: PAINT, bluPolvere: PAINT, crema: PAINT, azzurroPolvere: PAINT, biancoLatte: PAINT, olivaPittura: PAINT, bluAvio: PAINT,
  rovereListoni: { src: 'listoni', m: 1.6, n: 0.8, r: true },
  noce: LEGNO, noceVerticale: LEGNO, noceScuro: LEGNO, rovere: LEGNO, rovereMiele: LEGNO, cognac: LEGNO, noceCaldo: LEGNO,
  parquet: { src: 'parquet', m: 2.0, n: 0.8, r: true },
  lino: LINO, linoBianco: LINO, linoTortora: LINO, linoAvena: LINO, linoAzzurro: LINO, linoRuggine: LINO, tessutoGrafite: LINO,
  velluto: VELLUTO, vellutoSalvia: VELLUTO, vellutoRuggine: VELLUTO, vellutoOliva: VELLUTO, vellutoAvio: VELLUTO,
  cuoio: { src: 'cuoio', m: 0.6, n: 0.6, r: true },
  cotto: { src: 'cotto', m: 2.0, n: 0.8, r: true },
  pietra: { src: 'pietra', m: 2.0, n: 0.5, r: true },
  pietraScura: { src: 'pietra', m: 2.0, n: 0.5, r: true },
  prato: { src: 'prato', m: 2.5, n: 0.8 },
  terreno: { src: 'terreno', m: 6.0, n: 0.8, naturale: true, tinta: '#c9dca0' },
  coppi: { src: 'coppi', m: 3.0, n: 1.0, r: true, naturale: true, tinta: '#f0a27e' },
  juta: { src: 'juta', m: 0.5, n: 0.8, naturale: true },
  ghiaia: { src: 'ghiaia', m: 1.2, n: 0.8, naturale: true },
};
const _foto = {}; // sorgente -> { d, n, r } texture caricate

// Carica le foto prima di costruire la casa (main.js la attende). Se qualcosa non arriva,
// quei materiali restano con la texture disegnata.
export async function preparaFoto() {
  const base = `${import.meta.env.BASE_URL}tex/`;
  const loader = new THREE.TextureLoader();
  const carica = (f) => loader.loadAsync(base + f).catch(() => null);
  const sorgenti = {};
  for (const c of Object.values(FOTO)) sorgenti[c.src] = sorgenti[c.src] || !!c.r;
  await Promise.all(Object.entries(sorgenti).map(async ([src, conR]) => {
    const [d, n, r] = await Promise.all([carica(`${src}_d.webp`), carica(`${src}_n.webp`), conR ? carica(`${src}_r.webp`) : null]);
    if (d && n) _foto[src] = { d, n, r };
  }));
}

// colore medio di una texture disegnata (canvas), letto su una copia di 4 x 4 pixel
function mediaColore(tex) {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d');
  g.drawImage(tex.image, 0, 0, 4, 4);
  const px = g.getImageData(0, 0, 4, 4).data;
  let r = 0, gg = 0, b = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; }
  const n = px.length / 4;
  return new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
}

function applicaFoto(M) {
  for (const [k, c] of Object.entries(FOTO)) {
    const m = M[k], f = _foto[c.src];
    if (!m || !f) continue;
    const vecchia = m.map;
    const rot = (vecchia?.rotation || 0) + (c.rot || 0);
    const copia = (t, spazio) => {
      const x = t.clone();
      x.wrapS = x.wrapT = THREE.RepeatWrapping;
      x.repeat.set(1 / c.m, 1 / c.m);
      x.rotation = rot; x.center.set(0.5, 0.5);
      x.colorSpace = spazio;
      x.anisotropy = 8;
      x.needsUpdate = true;
      return x;
    };
    if (c.naturale) {
      m.map = copia(f.d, THREE.SRGBColorSpace);
      m.color.set(c.tinta || '#ffffff'); // una velatura per scaldare o schiarire la foto
    } else {
      // la trama grigia ha media 0.8: il colore del materiale la riporta alla tinta di prima
      const tinta = vecchia ? mediaColore(vecchia).multiply(m.color) : m.color.clone();
      m.map = copia(f.d, THREE.NoColorSpace);
      m.color.copy(tinta).multiplyScalar(1 / 0.8);
    }
    m.normalMap = copia(f.n, THREE.NoColorSpace);
    m.normalScale.set(c.n, c.n);
    if (f.r) { m.roughnessMap = copia(f.r, THREE.NoColorSpace); m.roughness = Math.min(1, m.roughness + 0.1); }
    m.bumpMap = null;
    m.needsUpdate = true;
  }
}

// ---------- materiali condivisi ----------
let _MAT = null;
export function getMateriali() {
  if (_MAT) return _MAT;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const legnoNoce = texLegno({ seed: 7 });
  const legnoNoceV = texLegno({ seed: 8 });
  legnoNoceV.rotation = Math.PI / 2; legnoNoceV.center.set(0.5, 0.5);
  const legnoRovere = texLegno({ base: PALETTE.rovere, scuro: '#7d5f3c', chiaro: '#cfae82', seed: 21 });
  const pietraTex = texPietra();
  const legnoCognac = texLegno({ base: '#a9713f', scuro: '#8a5730', chiaro: '#c18c58', seed: 89 });
  legnoCognac.rotation = Math.PI / 2; legnoCognac.center.set(0.5, 0.5);

  _MAT = {
    intonaco: std({ map: texIntonaco(), roughness: 0.95 }),
    intonacoSoffitto: std({ map: texIntonaco('#f6f2ea', 4), roughness: 0.97 }),
    intonacoEsterno: std({ map: texIntonaco('#d9cfbb', 5), roughness: 0.95 }),
    salvia: std({ map: texVernice(PALETTE.salvia), roughness: 0.85 }),
    salviaChiaro: std({ map: texVernice(PALETTE.salviaChiaro, 32), roughness: 0.85 }),
    terracottaPittura: std({ map: texVernice(PALETTE.terracotta, 33), roughness: 0.9 }),
    tortora: std({ map: texVernice(PALETTE.tortora, 34), roughness: 0.9 }),
    noce: std({ map: legnoNoce, roughness: 0.62 }),
    noceVerticale: std({ map: legnoNoceV, roughness: 0.62 }),
    noceScuro: std({ map: texLegno({ base: '#3f2a1a', scuro: '#241409', chiaro: '#5c4029', seed: 9 }), roughness: 0.65 }),
    rovere: std({ map: legnoRovere, roughness: 0.65 }),
    parquet: std({ map: texParquet(), roughness: 0.55 }),
    cotto: std({ map: texCotto(), roughness: 0.9 }),
    cementine: std({ map: texCementine(), roughness: 0.6 }),
    maiolica: std({ map: texMaiolica(), roughness: 0.35 }),
    pietra: std({ map: pietraTex, roughness: 0.55 }),
    pietraScura: std({ map: texPietra(18, '#7e786c'), roughness: 0.6 }),
    ottone: std({ color: PALETTE.ottone, metalness: 0.85, roughness: 0.42 }),
    ottoneScuro: std({ color: PALETTE.ottoneScuro, metalness: 0.9, roughness: 0.5 }),
    ferro: std({ color: PALETTE.ferro, metalness: 0.6, roughness: 0.62 }),
    ceramica: std({ color: '#f3efe6', roughness: 0.28 }),
    ceramicaSalvia: std({ color: PALETTE.salviaChiaro, roughness: 0.3 }),
    vetro: new THREE.MeshPhysicalMaterial({ color: '#cfdde0', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    velluto: new THREE.MeshPhysicalMaterial({ map: texVelluto(), roughness: 0.92, sheen: 0.8, sheenColor: new THREE.Color('#e7c16a') }),
    vellutoSalvia: new THREE.MeshPhysicalMaterial({ map: texVelluto(PALETTE.salvia, 20), roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color('#9fb39a') }),
    lino: std({ map: texLino(), roughness: 0.95 }),
    linoBianco: std({ map: texLino('#ece5d8', 24), roughness: 0.95 }),
    linoTortora: std({ map: texLino('#a3968a', 25), roughness: 0.95 }),
    cartaBotanica: std({ map: texCartaBotanica(), roughness: 0.9 }),
    cuoio: std({ color: '#6b3f24', roughness: 0.55 }),
    nero: std({ color: PALETTE.nero, roughness: 0.7 }),
    reteOttone: std({ map: texRete(), roughness: 0.45, metalness: 0.35 }),
    terreno: std({ map: texTerreno(), roughness: 1 }),
    carta: std({ color: '#f1ead9', roughness: 0.9 }),
    paralume: new THREE.MeshStandardMaterial({ color: '#f3e8d0', roughness: 0.9, side: THREE.DoubleSide, emissive: '#000000' }),
    foglia: std({ color: '#3f6b3a', roughness: 0.8, side: THREE.DoubleSide }),
    lampadina: new THREE.MeshStandardMaterial({ color: '#ffe3b0', emissive: '#ffd08a', emissiveIntensity: 0 }),
    coppi: std({ map: texCoppi(), roughness: 0.85 }),
    scuri: std({ map: texVernice('#b6bfad', 39), roughness: 0.85 }),
    rame: std({ color: '#a2603a', metalness: 0.75, roughness: 0.4 }),
    prato: std({ map: texPrato(), roughness: 1 }),
    ghiaia: std({ map: texGhiaia(), roughness: 1 }),
    terraOrto: std({ map: texTerreno(71), color: '#6b4a32', roughness: 1 }),
    // ---- piano terra ----
    lastre: std({ map: texLastre(), roughness: 0.7 }),
    piastrelleVerdi: std({ map: texPiastrelle('#2d5a48', 47), roughness: 0.25 }),
    piastrelleCrema: std({ map: texPiastrelle('#ece3cf', 48, '#cfc5b2', 0.1), roughness: 0.28 }),
    piastrelleOcra: std({ map: texPiastrelle('#c3903d', 49, '#e0d4bb', 0.3), roughness: 0.25 }),
    cartaRighe: std({ map: texRighe('#e6dcc7', PALETTE.salviaChiaro), roughness: 0.9 }),
    bluPetrolio: std({ map: texVernice('#2e6470', 35), roughness: 0.9 }),
    bluPolvere: std({ map: texVernice('#7f98a4', 36), roughness: 0.85 }),
    crema: std({ map: texVernice(PALETTE.crema, 37), roughness: 0.85 }),
    vellutoRuggine: new THREE.MeshPhysicalMaterial({ map: texVelluto('#8a4124', 38), roughness: 0.92, sheen: 0.7, sheenColor: new THREE.Color('#d9895f') }),
    // ---- piano primo, country chiaro ----
    rovereListoni: std({ map: texListoni(), roughness: 0.62 }),
    rovereMiele: std({ map: texLegno({ base: '#b98a55', scuro: '#7a5530', chiaro: '#dab27e', seed: 63 }), roughness: 0.6 }),
    marmo: std({ map: texPietra(23, '#ebe8e1'), roughness: 0.28 }),
    metro: std({ map: texMetro(), roughness: 0.16 }),
    azzurroPolvere: std({ map: texVernice('#8ea5b6', 40), roughness: 0.8 }),
    biancoLatte: std({ map: texVernice('#f1ece2', 41), roughness: 0.85 }),
    linoAvena: std({ map: texLino('#ddd3c0', 42), roughness: 0.95 }),
    linoAzzurro: std({ map: texLino('#a3b6c6', 43), roughness: 0.95 }),
    floreale: std({ map: texFloreale(), roughness: 0.9 }),
    righeAzzurre: std({ map: texRighe('#efe8da', '#93a9bb', 44), roughness: 0.9 }),
    juta: std({ map: texJuta(), roughness: 1 }),
    bambu: std({ map: texBambu(), roughness: 0.8 }),
    neroWindsor: std({ color: '#1f1c19', roughness: 0.45 }),
    olivaPittura: std({ map: texVernice('#7a8662', 45), roughness: 0.85 }),
    linoRuggine: std({ map: texLino('#b0663f', 46), roughness: 0.95 }),
    ardesia: std({ map: texArdesia(), roughness: 0.55 }),
    cartaRigheAzzurre: std({ map: texRighe('#efe8da', '#a7bacb', 47), roughness: 0.9 }),
    vetroGlobo: new THREE.MeshPhysicalMaterial({ color: '#f4efe4', roughness: 0.15, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }),
    // ---- versione 2: open space gaming e allenamento ----
    cognac: std({ map: legnoCognac, roughness: 0.55 }), // legno tinto caldo, venatura verticale (porte)
    gomma: std({ map: texGomma(), roughness: 0.95 }),
    tappetinoSalvia: std({ color: '#8c9c86', roughness: 0.9 }),
    plasticaBianca: std({ color: '#eef0f0', roughness: 0.35 }),
    plasticaNera: std({ color: '#151617', roughness: 0.4 }),
    tessutoGrafite: std({ map: texLino('#55585a', 48), roughness: 0.95 }),
    // ---- camera matrimoniale: blu avio, velluto oliva, noce anni '60 ----
    bluAvio: std({ map: texVernice('#8fabc8', 49), roughness: 0.85 }),
    noceCaldo: std({ map: texLegno({ base: '#7d4b2a', scuro: '#57311a', chiaro: '#a06a42', seed: 93 }), roughness: 0.55 }),
    vellutoOliva: new THREE.MeshPhysicalMaterial({ map: texVelluto('#46512a', 50), roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#8e9a5c') }),
    vellutoAvio: new THREE.MeshPhysicalMaterial({ map: texVelluto('#7e9cbf', 51), roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color('#c4d6ea') }),
  };
  // materiali usati come "decal" su superfici vicine (rivestimenti, carte, pitture): offset di profondità
  for (const k of ['maiolica', 'cartaBotanica', 'terracottaPittura', 'salvia', 'cotto', 'cementine', 'parquet', 'ceramica', 'reteOttone', 'lastre', 'piastrelleVerdi', 'piastrelleCrema', 'piastrelleOcra', 'cartaRighe', 'bluPetrolio', 'rovereListoni', 'metro', 'azzurroPolvere', 'biancoLatte', 'olivaPittura', 'ardesia', 'cartaRigheAzzurre', 'bluAvio']) {
    _MAT[k].polygonOffset = true; _MAT[k].polygonOffsetFactor = -1; _MAT[k].polygonOffsetUnits = -2;
  }
  // ripetizione per metro: gli oggetti impostano le UV in metri (vedi uvMetri)
  _MAT.intonaco.map.repeat.set(0.5, 0.5);
  _MAT.intonacoSoffitto.map.repeat.set(0.5, 0.5);
  _MAT.intonacoEsterno.map.repeat.set(0.5, 0.5);
  _MAT.cotto.map.repeat.set(1 / 0.6, 1 / 0.6);
  _MAT.cementine.map.repeat.set(1 / 0.4, 1 / 0.4);
  _MAT.maiolica.map.repeat.set(1 / 0.3, 1 / 0.3);
  _MAT.parquet.map.repeat.set(1 / 1.2, 1 / 1.2);
  _MAT.pietra.map.repeat.set(0.8, 0.8);
  _MAT.pietraScura.map.repeat.set(0.8, 0.8);
  _MAT.terreno.map.repeat.set(0.5, 0.5);
  _MAT.cartaBotanica.map.repeat.set(1 / 1.4, 1 / 1.4);
  _MAT.reteOttone.map.repeat.set(1 / 0.16, 1 / 0.16);
  _MAT.lastre.map.repeat.set(1 / 1.2, 1 / 1.2);
  _MAT.coppi.map.repeat.set(1 / 0.8, 1 / 0.8);
  _MAT.prato.map.repeat.set(0.5, 0.5);
  _MAT.ghiaia.map.repeat.set(1, 1);
  _MAT.terraOrto.map.repeat.set(1, 1);
  _MAT.piastrelleVerdi.map.repeat.set(1 / 0.4, 1 / 0.4);
  _MAT.piastrelleCrema.map.repeat.set(1 / 0.4, 1 / 0.4);
  _MAT.piastrelleOcra.map.repeat.set(1 / 0.3, 1 / 0.3);
  _MAT.rovereListoni.map.repeat.set(1 / 2.4, 1 / 1.2); // listoni da 20 cm, lunghi fino a 2,4 m
  _MAT.rovereMiele.map.repeat.set(0.6, 0.6);
  _MAT.marmo.map.repeat.set(0.7, 0.7);
  _MAT.metro.map.repeat.set(1 / 0.6, 1 / 0.6);
  _MAT.juta.map.repeat.set(1 / 0.4, 1 / 0.4);
  _MAT.bambu.map.repeat.set(1 / 0.3, 1 / 0.3);
  for (const k of ['azzurroPolvere', 'biancoLatte', 'linoAvena', 'linoAzzurro', 'righeAzzurre']) _MAT[k].map.repeat.set(3, 3);
  _MAT.floreale.map.repeat.set(4, 4);
  _MAT.olivaPittura.map.repeat.set(3, 3);
  _MAT.linoRuggine.map.repeat.set(3, 3);
  _MAT.ardesia.map.repeat.set(1 / 0.8, 1 / 0.8);
  _MAT.cartaRigheAzzurre.map.repeat.set(1 / 0.5, 1 / 0.5);
  _MAT.cartaRighe.map.repeat.set(1 / 0.5, 1 / 0.5);
  _MAT.cognac.map.repeat.set(1.4, 1.4);
  _MAT.gomma.map.repeat.set(2, 2);
  _MAT.tessutoGrafite.map.repeat.set(3, 3);
  for (const k of ['bluAvio', 'vellutoOliva', 'vellutoAvio']) _MAT[k].map.repeat.set(3, 3);
  _MAT.noceCaldo.map.repeat.set(0.6, 0.6);
  for (const k of ['noce', 'noceVerticale', 'noceScuro', 'rovere']) _MAT[k].map.repeat.set(0.6, 0.6);
  for (const k of ['velluto', 'vellutoSalvia', 'lino', 'linoBianco', 'linoTortora', 'salvia', 'salviaChiaro', 'terracottaPittura', 'tortora', 'bluPetrolio', 'bluPolvere', 'crema', 'vellutoRuggine', 'scuri']) _MAT[k].map.repeat.set(3, 3);
  applicaRilievo(_MAT);
  applicaFoto(_MAT);
  return _MAT;
}

// Scala le UV di una BoxGeometry/PlaneGeometry in metri, così la texture si ripete
// in modo uniforme indipendentemente dalle dimensioni del solido.
export function uvMetri(geom, w, h, d) {
  const uv = geom.attributes.uv;
  if (geom.type === 'PlaneGeometry') {
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  } else if (geom.type === 'BoxGeometry') {
    // ordine facce: +x -x +y -y +z -z, 4 vertici ciascuna
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  uv.needsUpdate = true;
  return geom;
}
