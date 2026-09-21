// Terrazzo nord: verde lungo tutto il perimetro, tavolo da otto e gazebo in acciaio
// con rampicanti. Le misure del terrazzo arrivano da planimetria.json.
import * as THREE from 'three';
import plan from '../data/planimetria.json';
import { box, cyl, sphere, place, pendente, lanterna, MAT, matColore } from './comune.js';

const C = 0.01;
const VERDI = ['#4a6b3a', '#3d5c32', '#5b7d45', '#38502c', '#6b8a4e'];
const VERDI_RAMP = ['#41623a', '#4f7340', '#37512e', '#5d7f48'];

function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// massa di fogliame: pochi poliedri sovrapposti, leggeri da disegnare
function cespuglio(g, x, y, z, r, rand, colori = VERDI, n = 5) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r * (0.55 + rand() * 0.5), 1),
      matColore(colori[Math.floor(rand() * colori.length)], 0.92));
    m.position.set(x + (rand() - 0.5) * r * 1.5, y + rand() * r * 0.8, z + (rand() - 0.5) * r * 1.5);
    m.scale.set(1, 0.8 + rand() * 0.5, 1);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
}

// ---- fioriera in cotto con siepe ----
export function fioriera(ctx, { x, z, lung = 1.4, prof = 0.38, h = 0.36, ry = 0, seed = 1 }) {
  const M = MAT();
  const g = new THREE.Group();
  const rand = rnd(seed * 7919 + 13);
  g.add(box(lung, h, prof, M.cotto, 0, h / 2, 0));
  g.add(box(lung + 0.04, 0.035, prof + 0.04, M.cotto, 0, h + 0.017, 0));   // bordo
  g.add(box(lung - 0.08, 0.04, prof - 0.08, M.terreno, 0, h + 0.03, 0));   // terra
  const n = Math.max(2, Math.round(lung / 0.42));
  for (let i = 0; i < n; i++) {
    const px = -lung / 2 + lung * (i + 0.5) / n;
    const r = 0.17 + rand() * 0.09;
    cespuglio(g, px, h + 0.06 + r * 0.5, 0, r, rand);
  }
  // qualche stelo fiorito che sborda
  for (let i = 0; i < 3; i++) {
    const px = -lung / 2 + lung * rand();
    g.add(sphere(0.035, matColore(rand() < 0.5 ? '#c8962c' : '#b0553f', 0.85),
      px, h + 0.3 + rand() * 0.15, (rand() - 0.5) * prof * 0.7, 8));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// riempie un tratto rettilineo di muro con fioriere affiancate
function filaFioriere(ctx, g, { da, a, fisso, asse, ry, seed }) {
  const L = a - da;
  const passo = 1.78, lung = 1.42;
  const n = Math.max(1, Math.floor(L / passo));
  const margine = (L - n * passo) / 2;
  for (let i = 0; i < n; i++) {
    const t = da + margine + passo * (i + 0.5);
    const x = asse === 'z' ? fisso : t;
    const z = asse === 'z' ? t : fisso;
    g.add(fioriera(ctx, { x, z, lung, ry, seed: seed + i }));
  }
}

// ---- tavolo da otto in legno massello su base in acciaio ----
export function tavoloTerrazzo(ctx, { cx, cz, L = 2.4, W = 1.0, H = 0.75, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const n = 7, gap = 0.008;
  const pw = (W - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    g.add(box(L, 0.045, pw, M.rovere, 0, H - 0.0225, -W / 2 + pw / 2 + i * (pw + gap)));
  }
  g.add(box(L + 0.05, 0.03, W + 0.05, M.ferro, 0, H - 0.06, 0)); // telaio sotto il piano
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.28);
    g.add(box(0.07, H - 0.08, 0.07, M.ferro, x, (H - 0.08) / 2, -W / 2 + 0.16));
    g.add(box(0.07, H - 0.08, 0.07, M.ferro, x, (H - 0.08) / 2, W / 2 - 0.16));
    g.add(box(0.05, 0.05, W - 0.26, M.ferro, x, 0.12, 0));
  }
  g.add(box(L - 0.5, 0.05, 0.05, M.ferro, 0, 0.12, 0));
  // apparecchiatura leggera
  g.add(cyl(0.16, 0.12, 0.07, M.ceramicaSalvia, 0, H + 0.035, 0, 20));
  for (let i = 0; i < 5; i++) g.add(sphere(0.042, matColore('#b0553f', 0.8), (i - 2) * 0.05, H + 0.08, (i % 2) * 0.04, 10));
  for (const s of [-1, 1]) g.add(cyl(0.05, 0.045, 0.24, M.vetro, s * 0.75, H + 0.12, 0, 14));
  place(g, cx, cz, ry);
  ctx.solid(g);
  return g;
}

// ---- sedia da esterno: struttura in acciaio, seduta e schienale a doghe ----
export function sediaTerrazzo(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  const s = 0.46, hs = 0.45;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const hh = sz < 0 ? 0.88 : hs;
    g.add(box(0.028, hh, 0.028, M.ferro, sx * (s / 2 - 0.03), hh / 2, sz * (s / 2 - 0.03)));
  }
  for (const sz of [-1, 1]) g.add(box(s - 0.06, 0.022, 0.022, M.ferro, 0, hs - 0.03, sz * (s / 2 - 0.03)));
  for (let i = 0; i < 4; i++) g.add(box(s - 0.08, 0.022, 0.075, M.rovere, 0, hs, -s / 2 + 0.07 + i * 0.1));
  for (let i = 0; i < 3; i++) g.add(box(s - 0.08, 0.075, 0.022, M.rovere, 0, 0.6 + i * 0.11, -s / 2 + 0.035));
  place(g, x, z, ry);
  return g;
}

// ---- gazebo in acciaio con rampicanti ----
export function gazebo(ctx, { cx, cz, L = 4.2, W = 3.3, H = 2.45 }) {
  const M = MAT();
  const g = new THREE.Group();
  const rand = rnd(4211);
  const p = 0.08;            // sezione dei montanti
  const hx = L / 2 - p / 2, hz = W / 2 - p / 2;
  const piedi = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sz] of piedi) {
    g.add(box(0.2, 0.05, 0.2, M.pietraScura, sx * hx, 0.025, sz * hz));   // piastra
    g.add(box(p, H, p, M.ferro, sx * hx, H / 2, sz * hz));
    // mensole d'angolo
    for (const [ax, az] of [[sx, 0], [0, sz]]) {
      const b = box(ax ? 0.32 : 0.05, 0.05, az ? 0.32 : 0.05, M.ferro,
        sx * hx - ax * 0.18, H - 0.18, sz * hz - az * 0.18);
      b.rotation.z = ax ? -ax * 0.7 : 0;
      b.rotation.x = az ? az * 0.7 : 0;
      g.add(b);
    }
  }
  // trave perimetrale
  for (const sz of [-1, 1]) g.add(box(L, 0.1, 0.07, M.ferro, 0, H - 0.05, sz * hz));
  for (const sx of [-1, 1]) g.add(box(0.07, 0.1, W - 0.16, M.ferro, sx * hx, H - 0.05, 0));
  // orditura di copertura: travetti e listelli incrociati
  const nt = 9;
  for (let i = 0; i < nt; i++) {
    const z = -hz + (W - p) * (i + 0.5) / nt;
    g.add(box(L - 0.1, 0.06, 0.035, M.ferro, 0, H + 0.02, z));
  }
  for (let i = 0; i < 6; i++) {
    const x = -hx + (L - p) * (i + 0.5) / 6;
    g.add(box(0.035, 0.05, W - 0.1, M.ferro, x, H + 0.07, 0));
  }
  // rampicanti: fusti attorcigliati sui montanti e fogliame sulla copertura
  for (const [sx, sz] of piedi) {
    const px = sx * hx, pz = sz * hz;
    let y = 0.05;
    while (y < H - 0.05) {
      const a = y * 9 + (sx + sz);
      const r = p * 0.75;
      g.add(cyl(0.017, 0.017, 0.16, matColore('#5a4a33', 0.9),
        px + Math.cos(a) * r, y + 0.08, pz + Math.sin(a) * r, 6));
      if (y > 0.4 && rand() < 0.42) cespuglio(g, px + Math.cos(a) * r * 2, y + 0.1, pz + Math.sin(a) * r * 2, 0.13, rand, VERDI_RAMP, 3);
      y += 0.16;
    }
  }
  for (let i = 0; i < 46; i++) {
    const x = (rand() - 0.5) * (L - 0.2);
    const z = (rand() - 0.5) * (W - 0.2);
    const bordo = Math.max(Math.abs(x) / (L / 2), Math.abs(z) / (W / 2));
    if (rand() > 0.35 + bordo * 0.6) continue;
    cespuglio(g, x, H + 0.14, z, 0.17 + rand() * 0.1, rand, VERDI_RAMP, 4);
  }
  // tralci che ricadono dal bordo
  for (let i = 0; i < 14; i++) {
    const lato = Math.floor(rand() * 4);
    const t = (rand() - 0.5) * (lato < 2 ? L - 0.3 : W - 0.3);
    const x = lato < 2 ? t : (lato === 2 ? -hx : hx);
    const z = lato < 2 ? (lato === 0 ? -hz : hz) : t;
    const l = 0.25 + rand() * 0.45;
    g.add(cyl(0.012, 0.012, l, matColore('#5a4a33', 0.9), x, H + 0.05 - l / 2, z, 6));
    cespuglio(g, x, H + 0.05 - l, z, 0.12, rand, VERDI_RAMP, 3);
  }
  // luce sotto il gazebo e due lanterne sui montanti
  g.add(pendente(ctx, 0, 0, { yTop: H - 0.02, calata: 0.75, raggio: 0.22, intensita: 16, paralume: 'ottone' }));
  g.add(lanterna(ctx, -hx + p / 2, 1.95, -hz, 'x+', { intensita: 10 }));  // montante nord-ovest
  g.add(lanterna(ctx, hx - p / 2, 1.95, hz, 'x-', { intensita: 10 }));    // montante sud-est
  for (const [sx, sz] of piedi) ctx.addColliderBox(cx + sx * hx - 0.06, cx + sx * hx + 0.06, cz + sz * hz - 0.06, cz + sz * hz + 0.06, 0, 2);
  g.position.set(cx, 0, cz);
  return g;
}

// ---- vaso alto con alberello ----
export function vasoAlbero(ctx, x, z, seed = 3) {
  const M = MAT();
  const g = new THREE.Group();
  const rand = rnd(seed * 131 + 7);
  g.add(cyl(0.26, 0.2, 0.52, M.cotto, 0, 0.26, 0, 22));
  g.add(cyl(0.28, 0.28, 0.04, M.cotto, 0, 0.53, 0, 22));
  g.add(cyl(0.05, 0.07, 0.75, matColore('#6b5a42', 0.9), 0, 0.9, 0, 10));
  cespuglio(g, 0, 1.45, 0, 0.42, rand, VERDI, 8);
  place(g, x, z);
  ctx.solid(g);
  return g;
}

export function arredaTerrazzo(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const T = plan.esterni.terrazzo_nord, I = T.interno_cm;
  const xO = I.x_ovest * C, zS = I.z_sud * C, zN = I.z_nord * C, zR = I.z_risega * C;
  const xEs = I.x_est_tratto_sud * C, xEn = I.x_est_tratto_nord * C;
  const off = 0.21; // distanza dell'asse fioriera dal filo del muro

  // verde lungo tutto il perimetro libero
  filaFioriere(ctx, g, { da: zN + 0.3, a: zS - 0.3, fisso: xO + off, asse: 'z', ry: Math.PI / 2, seed: 10 });
  filaFioriere(ctx, g, { da: xO + 0.5, a: xEn - 0.5, fisso: zN + off, asse: 'x', ry: 0, seed: 30 });
  filaFioriere(ctx, g, { da: zN + 0.5, a: zR - 0.3, fisso: xEn - off, asse: 'z', ry: Math.PI / 2, seed: 50 });
  filaFioriere(ctx, g, { da: zR + 0.3, a: zS - 0.3, fisso: xEs - off, asse: 'z', ry: Math.PI / 2, seed: 70 });
  // la risega e' corta: una fioriera sola
  g.add(fioriera(ctx, { x: (xEn + xEs) / 2 + 0.1, z: zR + off, lung: 0.6, ry: 0, seed: 90 }));

  // pranzo all'aperto sotto il gazebo, al centro del tratto largo
  const cx = (xO + xEs) / 2, cz = (zR + zS) / 2;
  g.add(gazebo(ctx, { cx, cz, L: 4.2, W: 3.3, H: 2.45 }));
  g.add(tavoloTerrazzo(ctx, { cx, cz, L: 2.4, W: 1.0 }));
  for (let i = 0; i < 3; i++) {
    g.add(sediaTerrazzo(ctx, cx - 0.82 + i * 0.82, cz - 0.79, 0));
    g.add(sediaTerrazzo(ctx, cx - 0.82 + i * 0.82, cz + 0.79, Math.PI));
  }
  g.add(sediaTerrazzo(ctx, cx - 1.52, cz, Math.PI / 2));
  g.add(sediaTerrazzo(ctx, cx + 1.52, cz, -Math.PI / 2));

  // due alberelli in vaso ai lati della portafinestra della cucina
  g.add(vasoAlbero(ctx, 1.78, -0.75, 4));
  g.add(vasoAlbero(ctx, 3.58, -0.75, 9));
  return g;
}
