// Camera nord-est (matrimoniale principale), stile country chiaro: parete a doghe verde oliva,
// letto in rovere con testiera in lino avena, coperta azzurra e plaid ruggine, armadi bianco latte e rovere.
import * as THREE from 'three';
import { box, cyl, sphere, plane, place, cuscino, tappeto, tappetoPersiano, quadro, stampaBotanica, pareteDoghe, pendente, lampadarioTamburo, applique, lampadaTavolo, tende, antaTelaio, manigliaOttone, pianta, MAT } from './comune.js';

// ---- letto matrimoniale con testiera velluto senape a tutta parete (capitonné) ----
// legno, coperta, runner, cuscini: finiture (di serie noce, velluto salvia, lino tortora, velluto)
export function lettoMatrimoniale(ctx, { x, z, ry = 0, testieraW = 2.6, testieraH = 1.35, matTestiera, legno, coperta, runner, cuscini }) {
  const M = MAT();
  const g = new THREE.Group();
  const W = 1.7, L = 2.0;
  const mt = matTestiera || M.velluto;
  // testiera a parete: pannelli imbottiti a riquadri
  const cols = 4, rows = 3, gap = 0.03;
  const pw = (testieraW - gap * (cols + 1)) / cols, ph = (testieraH - 0.1 - gap * (rows + 1)) / rows;
  const Lg = legno || M.noce;
  g.add(box(testieraW, testieraH, 0.03, Lg, 0, 0.1 + testieraH / 2, -L / 2 - 0.09));
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const px = -testieraW / 2 + gap + c * (pw + gap) + pw / 2;
    const py = 0.1 + gap + r * (ph + gap) + ph / 2 + 0.05;
    g.add(box(pw, ph, 0.05, mt, px, py, -L / 2 - 0.065));
    g.add(box(pw - 0.07, ph - 0.07, 0.09, mt, px, py, -L / 2 - 0.05));
    g.add(sphere(0.012, M.ottone, px, py, -L / 2 - 0.004, 8));
  }
  // giroletto in noce, materasso, lenzuola, coperta salvia, cuscini
  g.add(box(W + 0.1, 0.22, L + 0.1, Lg, 0, 0.22, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.03, 0.04, 0.12, M.noceScuro, sx * (W / 2 - 0.05), 0.06, sz * (L / 2 - 0.05), 10));
  g.add(box(W, 0.22, L, M.linoBianco, 0, 0.44, 0));
  g.add(box(W + 0.06, 0.08, L * 0.62, coperta || M.vellutoSalvia, 0, 0.58, L * 0.19));
  g.add(box(W + 0.02, 0.05, 0.5, runner || M.linoTortora, 0, 0.6, L / 2 - 0.3));
  for (const s of [-1, 1]) {
    g.add(cuscino(0.7, 0.3, 0.22, M.linoBianco, s * 0.42, 0.66, -L / 2 + 0.2));
    g.add(cuscino(0.5, 0.26, 0.16, cuscini || M.velluto, s * 0.4, 0.68, -L / 2 + 0.4));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- comodino in noce con cassetto e pomolo in ottone ----
export function comodino(ctx, x, z, ry = 0, legno) {
  const M = MAT();
  const Lg = legno || M.noce;
  const g = new THREE.Group();
  g.add(box(0.5, 0.03, 0.4, M.pietraScura, 0, 0.6, 0));
  g.add(box(0.46, 0.35, 0.36, Lg, 0, 0.4, 0));
  g.add(box(0.4, 0.14, 0.02, M.noceScuro, 0, 0.47, 0.19));
  g.add(cyl(0.012, 0.012, 0.02, M.ottone, 0, 0.47, 0.21, 8).rotateX(Math.PI / 2));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.018, 0.022, 0.23, Lg, sx * 0.2, 0.115, sz * 0.15, 10));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- armadio a due ante a telaio, verniciato salvia, cimasa in noce ----
export function armadio(ctx, { w = 2.0, h = 2.4, d = 0.6, x, z, ry = 0, mat, ante = 3, cimasa }) {
  const M = MAT();
  const m = mat || M.salvia;
  const g = new THREE.Group();
  g.add(box(w - 0.06, 0.1, d - 0.04, M.noceScuro, 0, 0.05, -0.02));
  g.add(box(w, h - 0.1, d, m, 0, 0.1 + (h - 0.1) / 2, 0));
  g.add(box(w + 0.05, 0.06, d + 0.04, cimasa || M.noce, 0, h + 0.03, 0));
  const aw = w / ante;
  for (let i = 0; i < ante; i++) {
    const a = antaTelaio(aw - 0.02, h - 0.2, m, 0.07);
    a.position.set(-w / 2 + aw * (i + 0.5), 0.1 + (h - 0.2) / 2, d / 2 + 0.005); g.add(a);
    const hx = -w / 2 + aw * (i + 0.5) + (i % 2 ? -0.1 : 0.1) * (ante > 1 ? 1 : 0);
    g.add(manigliaOttone(0.16, hx, 1.05, d / 2 + 0.02, true));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- panca imbottita a piè di letto ----
export function pancaLetto(ctx, x, z, ry = 0, w = 1.3, seduta, legno) {
  const M = MAT();
  const g = new THREE.Group();
  const Lg = legno || M.noce;
  g.add(box(w, 0.12, 0.42, seduta || M.velluto, 0, 0.42, 0));
  g.add(box(w - 0.06, 0.04, 0.38, Lg, 0, 0.34, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.018, 0.022, 0.32, Lg, sx * (w / 2 - 0.06), 0.16, sz * 0.16, 10));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaCameraNord(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_nord.rects[0]; // x 6.14-10.26, z 0.28-4.06; porta ovest z 3.03-3.86; finestra nord x 6.89-8.10
  const zS = R.z + R.d;
  const bedX = 8.75;
  // parete del letto a doghe verde oliva fino a 2,20 m, con mensola-cimasa in rovere
  pareteDoghe(ctx.pareti, { asse: 'x', a: R.x, b: R.x + R.w, at: zS, verso: -1, h: 2.2, mat: M.olivaPittura, fuga: '#5f6948' });
  // letto in rovere con testiera in lino avena, biancheria panna, coperta azzurra, plaid ruggine
  g.add(lettoMatrimoniale(ctx, { x: bedX, z: zS - 1.12, ry: Math.PI, testieraW: 1.95, testieraH: 1.15, matTestiera: M.linoAvena,
    legno: M.rovereMiele, coperta: M.linoAzzurro, runner: M.linoRuggine, cuscini: M.floreale }));
  for (const s of [-1, 1]) {
    g.add(comodino(ctx, bedX + s * 1.2, zS - 0.25, Math.PI, M.rovereMiele));
    g.add(lampadaTavolo(ctx, bedX + s * 1.2, 0.615, zS - 0.25, { colore: 'bianca', intensita: 4, h: 0.42 }));
  }
  g.add(pancaLetto(ctx, bedX, zS - 2.35, 0, 1.3, M.linoAzzurro, M.rovereMiele));
  g.add(tappetoPersiano(2.5, 1.8, bedX, zS - 2.1));
  // armadio bianco latte a nord (a est della finestra) e armadio in rovere a ovest
  g.add(armadio(ctx, { w: 1.9, x: R.x + R.w - 0.97, z: R.z + 0.3, ante: 3, mat: M.biancoLatte, cimasa: M.rovereMiele }));
  g.add(armadio(ctx, { w: 1.9, h: 2.2, x: R.x + 0.3, z: R.z + 1.35, ry: Math.PI / 2, ante: 2, mat: M.rovereMiele, cimasa: M.rovereMiele }));
  // tende in lino avena, stampe botaniche sulla cimasa, pianta, lampadario a tamburo
  ctx.pareti.add(tende(1.24, 2.2, 7.5, 1.15, R.z + 0.03, 'z+', M.linoAvena)); // portafinestra a tutta altezza
  ctx.pareti.add(tende(1.24, 1.45, R.x + R.w - 0.03, 1.6, 2.25, 'x-', M.linoAvena));
  for (const [dx, sd] of [[-0.35, 101], [0.35, 102]]) {
    const q = stampaBotanica(0.36, 0.46, bedX + dx, 2.47, zS - 0.06, 'z-', sd, M.rovereMiele);
    q.rotation.x = 0.08; // appoggiate alla parete, sulla mensola
    ctx.pareti.add(q);
  }
  g.add(pianta(R.x + R.w - 0.35, 1.18, { h: 1.1, vaso: 0.16, matVaso: M.ceramica }));
  g.add(lampadarioTamburo(ctx, R.cx + 0.4, R.cz, { yTop: ctx.H, calata: 0.55, raggio: 0.28, intensita: 14 }));
  return g;
}
