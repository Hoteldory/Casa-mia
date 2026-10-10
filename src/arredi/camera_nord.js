// Camera nord-est (matrimoniale principale), dalla foto di riferimento: pareti e cornice in blu avio,
// soffitto bianco, tende in velluto oliva a tutta altezza, letto, comodini e cassettiera in noce
// anni '60, lampadario sputnik in ottone, parete di quadri sopra il letto, specchio tondo in ottone,
// poltrona in velluto oliva con tavolino d'ottone, tappeto persiano sbiadito azzurro e panna.
import * as THREE from 'three';
import { box, cyl, sphere, plane, place, cuscino, tappeto, tappetoPersiano, quadro, stampaBotanica, lampadaTavolo, tende, antaTelaio, manigliaOttone, pianta, matColore, MAT } from './comune.js';
import { texAstratto } from '../data/stile.js';

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

// ---------- camera matrimoniale: pezzi anni '60 in noce ----------

// cilindro sottile da a a b (gambe inclinate, raggi, bracci)
function asta(r, a, b, mat, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = cyl(r, r, d.length(), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, seg);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

// gamba affusolata e un po' divaricata, come nei mobili scandinavi
function gambaAffusolata(g, x, z, h, mat, { r = 0.02, apre = 0.03 } = {}) {
  const sx = Math.sign(x) || 0, sz = Math.sign(z) || 0;
  const gm = cyl(r, r * 0.6, h, mat, x + sx * apre / 2, h / 2, z + sz * apre / 2, 10);
  gm.rotation.set(sz * Math.atan2(apre, h), 0, -sx * Math.atan2(apre, h));
  g.add(gm);
}

// ---- letto in noce: testiera a pannello, sponde basse, piumone bianco, plaid in maglia panna,
// cuscini azzurri e oliva in velluto. Locale: testiera a -Z ----
export function lettoNoce(ctx, { x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const W = 1.6, L = 2.0, Lg = M.noceCaldo;
  // testiera: due montanti, pannello a tre doghe, traverso in cima
  const zt = -L / 2 - 0.035;
  for (const s of [-1, 1]) g.add(box(0.055, 1.02, 0.055, Lg, s * (W / 2 + 0.05), 0.51, zt));
  for (let i = 0; i < 3; i++) g.add(box((W + 0.04) / 3 - 0.008, 0.5, 0.03, Lg, -W / 2 - 0.02 + (W + 0.04) * (i + 0.5) / 3, 0.68, zt));
  g.add(box(W + 0.16, 0.06, 0.06, Lg, 0, 0.99, zt));
  g.add(box(W + 0.04, 0.05, 0.035, Lg, 0, 0.41, zt));
  // giroletto basso e gambe affusolate
  for (const s of [-1, 1]) g.add(box(0.04, 0.16, L + 0.04, Lg, s * (W / 2 + 0.03), 0.3, 0));
  g.add(box(W + 0.1, 0.16, 0.04, Lg, 0, 0.3, L / 2 + 0.03));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gambaAffusolata(g, sx * (W / 2 + 0.03), sz * (L / 2 + 0.01), 0.23, Lg, { r: 0.026, apre: sz > 0 ? 0.03 : 0 });
  // materasso, piumone bianco che ricade sui lati e ai piedi
  g.add(box(W, 0.22, L, M.linoBianco, 0, 0.42, 0));
  const lp = L * 0.82, zp = L / 2 - lp / 2;
  g.add(box(W + 0.1, 0.07, lp, M.linoBianco, 0, 0.555, zp));
  for (const s of [-1, 1]) g.add(box(0.025, 0.3, lp, M.linoBianco, s * (W / 2 + 0.06), 0.43, zp));
  g.add(box(W + 0.12, 0.3, 0.025, M.linoBianco, 0, 0.43, L / 2 + 0.07));
  // plaid in maglia panna ai piedi
  g.add(box(W + 0.14, 0.03, 0.55, M.linoAvena, 0, 0.6, L / 2 - 0.3));
  for (const s of [-1, 1]) g.add(box(0.02, 0.24, 0.55, M.linoAvena, s * (W / 2 + 0.08), 0.49, L / 2 - 0.3));
  // cuscini: due bianchi, due grandi azzurri contro la testiera, due oliva e un rullo oliva
  // cuscino imbottito: squadrato, a spigoli morbidi, appena inclinato verso il letto
  const imbottito = (w, h, d, mat, cx, cy, cz, incl) => {
    const c = box(w, h, d, mat, cx, cy, cz);
    c.rotation.x = incl;
    g.add(c);
  };
  for (const s of [-1, 1]) {
    g.add(cuscino(0.66, 0.16, 0.42, M.linoBianco, s * 0.4, 0.64, -L / 2 + 0.24));
    imbottito(0.6, 0.5, 0.1, M.vellutoAvio, s * 0.39, 0.86, -L / 2 + 0.1, -0.2);
    imbottito(0.44, 0.4, 0.09, M.vellutoOliva, s * 0.36, 0.8, -L / 2 + 0.26, -0.28);
  }
  imbottito(0.5, 0.26, 0.08, M.vellutoOliva, 0, 0.72, -L / 2 + 0.4, -0.35);
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- comodino in noce: cassetto con incavo, vano a giorno, gambe affusolate. Fronte +Z ----
export function comodinoNoce(ctx, x, z, ry = 0, { libriNelVano = false } = {}) {
  const M = MAT();
  const Lg = M.noceCaldo;
  const g = new THREE.Group();
  g.add(box(0.5, 0.03, 0.4, Lg, 0, 0.6, 0));                                  // piano (a 61,5 cm)
  for (const s of [-1, 1]) g.add(box(0.025, 0.34, 0.4, Lg, s * 0.2375, 0.415, 0));
  g.add(box(0.5, 0.025, 0.4, Lg, 0, 0.2575, 0));                               // fondo
  g.add(box(0.45, 0.33, 0.01, Lg, 0, 0.42, -0.195));                          // schienale
  g.add(box(0.448, 0.15, 0.02, Lg, 0, 0.505, 0.19));                           // cassetto
  g.add(box(0.2, 0.014, 0.012, M.noceScuro, 0, 0.574, 0.2));                   // incavo-maniglia
  g.add(box(0.45, 0.015, 0.37, Lg, 0, 0.42, 0));                               // ripiano sotto il cassetto
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gambaAffusolata(g, sx * 0.21, sz * 0.15, 0.25, Lg, { r: 0.018, apre: 0.03 });
  if (libriNelVano) for (const [i, c] of ['#2f3a55', '#c8b58a', '#5c2f2a'].entries()) g.add(box(0.28 - i * 0.02, 0.03, 0.2, matColore(c), 0.02, 0.285 + i * 0.031, 0.02));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- cassettiera bassa in noce a sei cassetti, gambe affusolate. Fronte +Z ----
export function cassettieraNoce(ctx, { x, z, ry = 0, w = 1.6, h = 0.8, d = 0.48 }) {
  const M = MAT();
  const Lg = M.noceCaldo;
  const g = new THREE.Group();
  const y0 = 0.17;
  g.add(box(w, h - y0 - 0.025, d, Lg, 0, y0 + (h - y0 - 0.025) / 2, 0));
  g.add(box(w + 0.02, 0.025, d + 0.02, Lg, 0, h - 0.0125, 0));                 // piano
  const col = 2, righe = 3, cw = w / col, rh = (h - y0 - 0.045) / righe;
  for (let c = 0; c < col; c++) for (let r = 0; r < righe; r++) {
    const cx = -w / 2 + cw * (c + 0.5), cy = y0 + 0.01 + rh * (r + 0.5);
    g.add(box(cw - 0.012, rh - 0.012, 0.02, Lg, cx, cy, d / 2 + 0.01));
    g.add(box(cw * 0.36, 0.014, 0.012, M.noceScuro, cx, cy + rh / 2 - 0.03, d / 2 + 0.021));
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gambaAffusolata(g, sx * (w / 2 - 0.08), sz * (d / 2 - 0.07), y0, Lg, { r: 0.024, apre: 0.025 });
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- specchio tondo con cornice in ottone, appeso al muro ----
export function specchioTondo(r, x, y, z, normal = 'z+') {
  const M = MAT();
  const g = new THREE.Group();
  const vetro = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 0.9, roughness: 0.08 }));
  vetro.position.z = 0.02; g.add(vetro);
  const anello = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, 0.016, 8, 64), M.ottone);
  anello.position.z = 0.022; anello.castShadow = true; g.add(anello);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(r + 0.01, 48), M.noceScuro);
  fondo.position.z = 0.012; g.add(fondo);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- lampadario sputnik in ottone: sfera centrale e raggi con le lampadine in punta ----
export function lampadarioSputnik(ctx, x, z, { yTop, calata = 0.7, raggio = 0.38, intensita = 16 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const y = yTop - calata;
  g.add(cyl(0.06, 0.06, 0.02, M.ottone, x, yTop - 0.01, z, 16));
  g.add(cyl(0.007, 0.007, calata - 0.04, M.ottone, x, yTop - (calata - 0.04) / 2 - 0.01, z, 8));
  g.add(sphere(0.05, M.ottone, x, y, z, 16));
  const c = new THREE.Vector3(x, y, z);
  let bulb = null;
  const n = 26;
  for (let i = 0; i < n; i++) {
    // direzioni sulla sfera (spirale di Fibonacci), senza quelle che salirebbero nello stelo
    const dy = 1 - (2 * (i + 0.5)) / n;
    if (dy > 0.8) continue;
    const rr = Math.sqrt(1 - dy * dy), a = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(a) * rr, dy, Math.sin(a) * rr);
    const l = raggio * (i % 3 ? 1 : 0.8);
    const punta = c.clone().addScaledVector(dir, l);
    g.add(asta(0.0045, c, punta, M.ottone, 6));
    const b = sphere(0.013, M.lampadina, punta.x, punta.y, punta.z, 8);
    g.add(b);
    bulb = bulb || b;
  }
  const light = new THREE.PointLight('#ffd9a8', intensita, 8, 2);
  light.position.set(x, y - 0.05, z);
  g.add(light);
  ctx.addLight(light, bulb, null);
  return g;
}

// ---- applique a braccio in ottone con paralume a tamburo, il braccio verso -X ----
export function appliqueBraccio(ctx, x, y, z, normal = 'z+', { intensita = 4 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(0.06, 0.13, 0.02, M.ottone, 0, 0, 0.01));
  const gomito = new THREE.Vector3(-0.16, 0.02, 0.22);
  g.add(asta(0.007, new THREE.Vector3(0, 0, 0.02), gomito, M.ottone));
  g.add(asta(0.006, gomito, gomito.clone().add(new THREE.Vector3(0, 0.08, 0)), M.ottone));
  g.add(sphere(0.012, M.ottone, gomito.x, gomito.y, gomito.z, 8));
  const matP = M.paralume.clone();
  matP.emissive = new THREE.Color('#ffd9a8'); matP.emissiveIntensity = 0;
  g.add(cyl(0.085, 0.1, 0.15, matP, gomito.x, gomito.y + 0.1, gomito.z, 24, { open: true }));
  const bulb = sphere(0.02, M.lampadina, gomito.x, gomito.y + 0.08, gomito.z, 8);
  g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 4, 2);
  light.position.set(gomito.x, gomito.y + 0.05, gomito.z + 0.03);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- lampada da comodino in ottone: stelo, braccio e cupolino. Il cupolino guarda verso +Z ----
export function lampadaOttone(ctx, x, y, z, ry = 0, { intensita = 3 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.07, 0.075, 0.018, M.ottone, 0, 0.009, 0, 24));
  const a = new THREE.Vector3(0, 0.018, -0.02), b = new THREE.Vector3(0, 0.36, -0.04), c = new THREE.Vector3(0, 0.4, 0.12);
  g.add(asta(0.006, a, b, M.ottone));
  g.add(asta(0.006, b, c, M.ottone));
  g.add(sphere(0.012, M.ottone, b.x, b.y, b.z, 8));
  const coppa = cyl(0.03, 0.075, 0.1, M.ottone, c.x, c.y - 0.04, c.z + 0.02, 20, { open: true });
  coppa.rotation.x = 0.35; g.add(coppa);
  const matP = M.paralume.clone();
  matP.emissive = new THREE.Color('#ffd9a8'); matP.emissiveIntensity = 0;
  const dentro = cyl(0.027, 0.07, 0.095, matP, c.x, c.y - 0.04, c.z + 0.02, 20, { open: true });
  dentro.rotation.x = 0.35; g.add(dentro);
  const bulb = sphere(0.018, M.lampadina, c.x, c.y - 0.05, c.z + 0.02, 8);
  g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 3, 2);
  light.position.set(c.x, c.y - 0.1, c.z + 0.04);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}

// ---- poltrona anni '60 in velluto oliva, gambe in noce. Fronte +Z ----
export function poltronaVelluto(ctx, x, z, ry = 0, mat) {
  const M = MAT();
  const V = mat || M.vellutoOliva;
  const g = new THREE.Group();
  g.add(box(0.74, 0.2, 0.76, V, 0, 0.24, 0));                                  // scocca
  for (const s of [-1, 1]) g.add(box(0.13, 0.3, 0.74, V, s * 0.315, 0.49, 0.01)); // braccioli
  const sch = box(0.74, 0.52, 0.14, V, 0, 0.61, -0.32); sch.rotation.x = -0.12; g.add(sch);
  const cs = box(0.48, 0.4, 0.12, V, 0, 0.66, -0.22); cs.rotation.x = -0.16; g.add(cs); // cuscino dello schienale
  g.add(box(0.5, 0.12, 0.6, V, 0, 0.4, 0.06));                                // cuscino della seduta
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gambaAffusolata(g, sx * 0.31, sz * 0.31, 0.14, M.noceCaldo, { r: 0.022, apre: 0.03 });
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- tavolino d'appoggio in ottone su tre gambe sottili, con una pila di libri ----
export function tavolinoOttone(ctx, x, z) {
  const M = MAT();
  const g = new THREE.Group();
  const h = 0.55;
  g.add(cyl(0.2, 0.2, 0.014, M.ottone, 0, h, 0, 28));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const top = new THREE.Vector3(Math.cos(a) * 0.11, h - 0.01, Math.sin(a) * 0.11);
    const piede = new THREE.Vector3(Math.cos(a) * 0.19, 0.012, Math.sin(a) * 0.19);
    g.add(asta(0.007, top, piede, M.ottone));
    g.add(sphere(0.014, M.ottone, piede.x, piede.y, piede.z, 8));
  }
  for (const [i, c] of ['#d9d0bd', '#2f4a3a', '#4a5a6a'].entries()) {
    const l = box(0.25 - i * 0.02, 0.032, 0.18, matColore(c), 0, h + 0.023 + i * 0.033, 0);
    l.rotation.y = (i - 1) * 0.15; g.add(l);
  }
  g.position.set(x, 0, z);
  ctx.solid(g);
  return g;
}

// ---- vaso in ceramica oliva con rami di eucalipto ----
let _fogliaEucalipto = null;
export function vasoEucalipto(x, y, z, { h = 0.5 } = {}) {
  _fogliaEucalipto = _fogliaEucalipto || new THREE.MeshStandardMaterial({ color: '#8b9d8a', roughness: 0.8, side: THREE.DoubleSide });
  const vaso = matColore('#5c6831', 0.3);
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.065, 0.2, vaso, 0, 0.1, 0, 20));
  g.add(cyl(0.03, 0.05, 0.05, vaso, 0, 0.225, 0, 20));
  const fusto = matColore('#6b5a45', 0.8);
  const foglia = new THREE.CircleGeometry(0.022, 7);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, t = 0.25 + (i % 3) * 0.12;
    const base = new THREE.Vector3(0, 0.24, 0);
    const cima = new THREE.Vector3(Math.cos(a) * t * 0.6, 0.24 + h * (0.6 + (i % 3) * 0.2), Math.sin(a) * t * 0.6);
    g.add(asta(0.003, base, cima, fusto, 5));
    for (let k = 1; k <= 7; k++) {
      const p = base.clone().lerp(cima, 0.3 + k * 0.1);
      for (const s of [-1, 1]) {
        const f = new THREE.Mesh(foglia, _fogliaEucalipto);
        f.position.set(p.x + s * 0.02 * Math.sin(a), p.y, p.z - s * 0.02 * Math.cos(a));
        f.rotation.set(0.4 * s, a + k, 0.3);
        f.castShadow = true;
        g.add(f);
      }
    }
  }
  g.position.set(x, y, z);
  return g;
}

export function arredaCameraNord(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_nord.rects[0]; // x 6.14-10.26, z 0.28-4.06; porta ovest z 3.03-3.86; portafinestra nord x 6.88-8.12; finestra est z 1.63-2.87
  const xO = R.x, xE = R.x + R.w, zN = R.z, zS = R.z + R.d, H = ctx.H;
  const P = ctx.pareti;

  // pareti in blu avio, attorno a porta e finestre; cornice modanata dello stesso blu, soffitto bianco
  const blu = (asse, at, verso, a, b, y0 = 0, y1 = H) => {
    const L = b - a, h = y1 - y0, m = (a + b) / 2, y = (y0 + y1) / 2;
    P.add(asse === 'x' ? plane(L, h, M.bluAvio, m, y, at + verso * 0.015, verso > 0 ? 'z+' : 'z-')
      : plane(L, h, M.bluAvio, at + verso * 0.015, y, m, verso > 0 ? 'x+' : 'x-'));
  };
  blu('x', zN, 1, xO, 6.88); blu('x', zN, 1, 8.12, xE); blu('x', zN, 1, 6.88, 8.12, 2.2);   // nord, portafinestra
  blu('x', zS, -1, xO, xE);                                                                    // sud, dietro al letto
  blu('z', xE, -1, zN, 1.63); blu('z', xE, -1, 2.87, zS);                                      // est, finestra
  blu('z', xE, -1, 1.63, 2.87, 0, 0.9); blu('z', xE, -1, 1.63, 2.87, 2.2);
  blu('z', xO, 1, zN, 3.01); blu('z', xO, 1, 3.88, zS); blu('z', xO, 1, 3.01, 3.88, 2.2);    // ovest, porta
  for (const [asse, at, verso, a, b] of [['x', zN, 1, xO, xE], ['x', zS, -1, xO, xE], ['z', xE, -1, zN, zS], ['z', xO, 1, zN, zS]]) {
    const L = b - a, m = (a + b) / 2;
    for (const [hh, dd, y] of [[0.13, 0.03, H - 0.065], [0.045, 0.075, H - 0.0225], [0.025, 0.05, H - 0.145]]) {
      const off = 0.015 + dd / 2;
      P.add(asse === 'x' ? box(L, hh, dd, M.bluAvio, m, y, at + verso * off) : box(dd, hh, L, M.bluAvio, at + verso * off, y, m));
    }
  }

  // letto in noce contro la parete sud, comodini a gambe affusolate
  const bedX = 8.75;
  g.add(lettoNoce(ctx, { x: bedX, z: zS - 1.08, ry: Math.PI }));
  g.add(comodinoNoce(ctx, bedX - 1.2, zS - 0.24, Math.PI, { libriNelVano: true }));
  g.add(comodinoNoce(ctx, bedX + 1.2, zS - 0.24, Math.PI));
  // a est lampada in ceramica bianca e applique a braccio, a ovest lampada d'ottone e una piantina
  g.add(lampadaTavolo(ctx, bedX + 1.27, 0.615, zS - 0.26, { colore: 'bianca', intensita: 3, h: 0.44 }));
  P.add(appliqueBraccio(ctx, bedX + 1.12, 1.38, zS, 'z-', { intensita: 3 }));
  g.add(lampadaOttone(ctx, bedX - 1.1, 0.615, zS - 0.22, Math.PI, { intensita: 3 }));
  const piantina = pianta(bedX - 1.32, zS - 0.3, { h: 0.2, vaso: 0.06, matVaso: M.ceramica });
  piantina.position.y = 0.615; g.add(piantina);

  // parete di quadri sopra il letto: stampa astratta al centro, sei stampe botaniche attorno
  const tex = texAstratto(97);
  tex.repeat.set(1 / 0.46, 1 / 0.6);
  P.add(quadro(0.46, 0.6, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), bedX, 1.68, zS - 0.02, 'z-', M.ottone));
  for (const [dx, y, w, h, sd] of [[0, 2.23, 0.38, 0.26, 111], [-0.5, 2.15, 0.3, 0.38, 112], [0.5, 2.15, 0.3, 0.38, 113],
    [-0.54, 1.62, 0.34, 0.42, 114], [0.54, 1.62, 0.34, 0.42, 115]]) {
    P.add(stampaBotanica(w, h, bedX + dx, y, zS - 0.02, 'z-', sd, M.rovereMiele));
  }

  // tappeto persiano sbiadito, azzurro e panna, sotto il letto
  g.add(tappetoPersiano(2.4, 2.7, bedX - 0.1, zS - 1.4, { campo: '#d9d5c6', blu: '#8ea3b4', bluScuro: '#647a8e', ruggine: '#ab9c87', seed: 95 }));

  // parete ovest: cassettiera in noce con specchio tondo in ottone, eucalipto, libri e vassoio
  const zC = 2.15;
  g.add(cassettieraNoce(ctx, { x: xO + 0.26, z: zC, ry: Math.PI / 2, w: 1.6 }));
  P.add(specchioTondo(0.42, xO + 0.02, 1.48, zC + 0.1, 'x+'));
  g.add(vasoEucalipto(xO + 0.28, 0.8, zC - 0.55));
  for (const [i, c] of ['#e8e1d0', '#5a6a3a'].entries()) g.add(box(0.22, 0.03, 0.16, matColore(c), xO + 0.27, 0.815 + i * 0.03, zC + 0.5));
  g.add(cyl(0.11, 0.11, 0.012, M.ottone, xO + 0.27, 0.806, zC + 0.15, 24));
  g.add(cyl(0.035, 0.035, 0.07, M.ceramica, xO + 0.27, 0.847, zC + 0.15, 14));

  // angolo lettura vicino alla portafinestra: poltrona in velluto oliva e tavolino d'ottone
  g.add(poltronaVelluto(ctx, xO + 0.5, zN + 0.72, Math.PI / 2 - 0.35));
  g.add(tavolinoOttone(ctx, xO + 0.98, zN + 1.2));

  // armadio a muro a nord, verniciato blu avio come le pareti, maniglie in ottone
  g.add(armadio(ctx, { w: 1.8, x: xE - 0.92, z: zN + 0.3, ante: 3, mat: M.bluAvio, cimasa: M.bluAvio }));

  // tende in velluto oliva a tutta altezza, su bastone d'ottone
  P.add(tende(1.24, 2.46, 7.5, 1.27, zN + 0.03, 'z+', M.vellutoOliva));
  P.add(tende(1.24, 2.46, xE - 0.03, 1.27, 2.25, 'x-', M.vellutoOliva));

  g.add(lampadarioSputnik(ctx, bedX, 2.15, { yTop: H, calata: 0.68, raggio: 0.38, intensita: 14 }));
  return g;
}
