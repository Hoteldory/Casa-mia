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

// Ghiaia/terra per il terreno
export function texTerreno(seed = 37) {
  return canvasTexture(512, (ctx, s, r) => {
    ctx.fillStyle = '#8f8a6e';
    ctx.fillRect(0, 0, s, s);
    noiseOver(ctx, s, r, { n: 15000, alpha: 0.25, colors: ['#5c6b45', '#a8a184', '#6e6a55', '#7f8c5a'], rmin: 1, rmax: 6 });
  }, { seed });
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
    terreno: std({ map: texTerreno(), roughness: 1 }),
    carta: std({ color: '#f1ead9', roughness: 0.9 }),
    paralume: new THREE.MeshStandardMaterial({ color: '#f3e8d0', roughness: 0.9, side: THREE.DoubleSide, emissive: '#000000' }),
    foglia: std({ color: '#3f6b3a', roughness: 0.8, side: THREE.DoubleSide }),
    lampadina: new THREE.MeshStandardMaterial({ color: '#ffe3b0', emissive: '#ffd08a', emissiveIntensity: 0 }),
  };
  // materiali usati come "decal" su superfici vicine (rivestimenti, carte, pitture): offset di profondità
  for (const k of ['maiolica', 'cartaBotanica', 'terracottaPittura', 'salvia', 'cotto', 'cementine', 'parquet', 'ceramica']) {
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
  for (const k of ['noce', 'noceVerticale', 'noceScuro', 'rovere']) _MAT[k].map.repeat.set(0.6, 0.6);
  for (const k of ['velluto', 'vellutoSalvia', 'lino', 'linoBianco', 'linoTortora', 'salvia', 'salviaChiaro', 'terracottaPittura', 'tortora']) _MAT[k].map.repeat.set(3, 3);
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
