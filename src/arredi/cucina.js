// Cucina (zona nord del soggiorno). Dettaglio di carattere: maioliche blu cobalto/bianco
// dietro il piano cottura e sul frontale dell'isola.
import * as THREE from 'three';
import { box, cyl, sphere, plane, group, place, antaTelaio, manigliaOttone, pendente, libri, MAT } from './comune.js';

// ---- base cucina lineare con ante a telaio e maniglie in ottone (lungo Z, contro il muro ovest) ----
export function baseCucina(ctx, { x0, z0, z1, hobZ, sinkZ }) {
  const M = MAT();
  const g = new THREE.Group();
  const L = z1 - z0, D = 0.6, Hb = 0.86;
  const cx = x0 + D / 2, cz = (z0 + z1) / 2;
  g.add(box(D - 0.06, 0.1, L - 0.04, M.noceScuro, cx - 0.03 + 0.05, 0.05, cz)); // zoccolo arretrato
  g.add(box(D, Hb - 0.1, L, M.salvia, cx, 0.1 + (Hb - 0.1) / 2, cz)); // corpo
  // top in pietra a spessore
  g.add(box(D + 0.03, 0.04, L + 0.02, M.pietra, cx + 0.015, Hb + 0.02, cz));
  // ante: moduli da ~60 cm, faccia verso +X
  const n = Math.round(L / 0.6);
  const aw = L / n;
  for (let i = 0; i < n; i++) {
    const z = z0 + aw * (i + 0.5);
    const isHob = Math.abs(z - hobZ) < aw / 2;
    if (isHob) {
      // forno sotto il piano cottura: cassetto sopra + anta forno con vetro scuro
      const dr = antaTelaio(aw - 0.02, 0.18, M.salvia, 0.04);
      dr.rotation.y = Math.PI / 2; dr.position.set(x0 + D + 0.005, Hb - 0.12, z); g.add(dr);
      g.add(manigliaOttone(0.25, x0 + D + 0.02, Hb - 0.12, z).rotateY(Math.PI / 2));
      g.add(box(0.02, 0.5, aw - 0.02, M.nero, x0 + D + 0.005, 0.37, z));
      g.add(box(0.01, 0.03, aw - 0.06, M.ottone, x0 + D + 0.02, 0.58, z));
      g.add(box(0.01, 0.26, aw - 0.1, M.pietraScura, x0 + D + 0.015, 0.32, z));
    } else if (Math.abs(z - sinkZ) < aw / 2) {
      // lavello a catino: frontale in ceramica a vista
      g.add(box(0.06, 0.24, aw - 0.02, M.ceramica, x0 + D + 0.02, Hb - 0.1, z));
      const a = antaTelaio(aw - 0.02, Hb - 0.36, M.salvia);
      a.rotation.y = Math.PI / 2; a.position.set(x0 + D + 0.005, (Hb - 0.36) / 2 + 0.1, z); g.add(a);
      g.add(manigliaOttone(0.12, x0 + D + 0.02, 0.55, z).rotateY(Math.PI / 2));
    } else {
      const a = antaTelaio(aw - 0.02, Hb - 0.14, M.salvia);
      a.rotation.y = Math.PI / 2; a.position.set(x0 + D + 0.005, (Hb - 0.14) / 2 + 0.1, z); g.add(a);
      const h = manigliaOttone(0.12, x0 + D + 0.02, 0.62, z + (i % 2 ? -0.16 : 0.16), true);
      h.rotation.y = Math.PI / 2; g.add(h);
    }
  }
  // piano cottura: 4 fuochi con griglie in ghisa e manopole in ottone
  for (const [dz, dx] of [[-0.14, -0.12], [0.14, -0.12], [-0.14, 0.12], [0.14, 0.12]]) {
    g.add(cyl(0.045, 0.045, 0.012, M.ottoneScuro, cx + dx, Hb + 0.046, hobZ + dz, 16));
    g.add(cyl(0.02, 0.02, 0.02, M.ferro, cx + dx, Hb + 0.05, hobZ + dz, 12));
    g.add(box(0.2, 0.01, 0.2, M.ferro, cx + dx, Hb + 0.06, hobZ + dz));
  }
  for (let i = 0; i < 4; i++) g.add(cyl(0.012, 0.012, 0.02, M.ottone, x0 + D - 0.03, Hb + 0.05, hobZ - 0.2 + i * 0.13, 10));
  // lavello: incasso nel top + rubinetto a collo d'oca in ottone brunito
  g.add(box(0.44, 0.02, 0.5, M.ceramica, cx, Hb + 0.035, sinkZ));
  g.add(box(0.36, 0.01, 0.42, M.pietraScura, cx, Hb + 0.046, sinkZ, { cast: false }));
  const tap = group(
    cyl(0.018, 0.022, 0.06, M.ottoneScuro, 0, 0.03, 0),
    cyl(0.011, 0.011, 0.3, M.ottoneScuro, 0, 0.2, 0),
    (() => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.011, 8, 16, Math.PI), M.ottoneScuro); t.position.set(0.1, 0.35, 0); return t; })(),
    cyl(0.011, 0.011, 0.08, M.ottoneScuro, 0.2, 0.31, 0),
    cyl(0.006, 0.006, 0.08, M.ottoneScuro, 0, 0.12, 0).rotateX(Math.PI / 2),
  );
  tap.position.set(x0 + 0.1, Hb + 0.04, sinkZ); g.add(tap);
  // oggetti: tagliere, vasetti, pentola in rame sul fuoco
  g.add(box(0.28, 0.02, 0.4, M.rovere, cx, Hb + 0.05, sinkZ + 0.6));
  g.add(cyl(0.11, 0.1, 0.12, M.ottoneScuro, cx - 0.12, Hb + 0.12, hobZ + 0.14, 20));
  g.add(cyl(0.006, 0.006, 0.2, M.ferro, cx - 0.12, Hb + 0.16, hobZ + 0.3, 8).rotateX(Math.PI / 2));
  for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 0.14 + i * 0.03, M.ceramica, cx - 0.15, Hb + 0.11 + i * 0.015, z1 - 0.3 - i * 0.13, 16));
  ctx.solid(box(D + 0.05, Hb, L, M.nero, cx, Hb / 2, cz, { cast: false })).visible = false;
  return g;
}

// ---- rivestimento in maiolica: paraspruzzi lungo la base e nicchia alta dietro il piano cottura ----
export function rivestimentoMaiolica(ctx, { x, z0, z1, hobZ, salto = null }) {
  const M = MAT();
  const g = new THREE.Group();
  // il paraspruzzi si interrompe dove la finestra scende a filo del piano di lavoro
  const tratti = salto ? [[z0, salto[0]], [salto[1], z1]] : [[z0, z1]];
  for (const [a, b] of tratti) {
    if (b - a < 0.05) continue;
    g.add(plane(b - a, 0.6, M.maiolica, x + 0.02, 1.2, (a + b) / 2, 'x+'));
    g.add(box(0.05, 0.04, b - a + 0.04, M.pietra, x + 0.025, 1.52, (a + b) / 2)); // listello di coronamento
  }
  g.add(plane(1.1, 0.6, M.maiolica, x + 0.02, 1.8, hobZ, 'x+')); // nicchia dietro il piano cottura
  g.add(box(0.05, 0.04, 1.16, M.pietra, x + 0.025, 2.12, hobZ));
  return g;
}

// ---- cappa in muratura ----
export function cappaMuratura(ctx, { x, z, yBase = 1.62 }) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H;
  // corpo svasato
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.32, 4, 1), M.intonaco);
  body.rotation.y = Math.PI / 4; body.scale.set(0.75, 1, 1);
  body.position.set(x + 0.32, yBase + 0.16, z); body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  g.add(box(0.5, H - yBase - 0.32, 0.6, M.intonaco, x + 0.25, (yBase + 0.32 + H) / 2, z));
  // bordo in legno noce
  g.add(box(0.62, 0.05, 0.84, M.noce, x + 0.31, yBase, z));
  return g;
}

// ---- mensole a giorno in noce con reggimensola in ottone ----
export function mensole(ctx, { x, z0, z1, ys = [1.62, 2.02] }) {
  const M = MAT();
  const g = new THREE.Group();
  const L = z1 - z0, cz = (z0 + z1) / 2;
  for (const y of ys) {
    g.add(box(0.28, 0.035, L, M.noce, x + 0.14, y, cz));
    for (const zz of [z0 + 0.15, cz, z1 - 0.15]) {
      g.add(box(0.24, 0.015, 0.015, M.ottone, x + 0.12, y - 0.025, zz));
      g.add(box(0.015, 0.16, 0.015, M.ottone, x + 0.008, y - 0.1, zz));
    }
  }
  // oggetti: barattoli in ceramica, piatti in piedi, libri di cucina, pianta
  for (let i = 0; i < 4; i++) g.add(cyl(0.06, 0.055, 0.16 + (i % 2) * 0.06, M.ceramicaSalvia, x + 0.14, ys[0] + 0.1 + (i % 2) * 0.03, z0 + 0.22 + i * 0.2, 14));
  for (let i = 0; i < 3; i++) {
    const p = cyl(0.12, 0.12, 0.012, M.ceramica, x + 0.06, ys[1] + 0.14, z0 + 0.28 + i * 0.28, 20);
    p.rotation.z = Math.PI / 2; p.rotation.y = 0; p.rotation.x = 0.15; g.add(p);
  }
  g.add(libri(0.55, x + 0.14, ys[1] + 0.02, z1 - 0.42, 4).rotateY(Math.PI / 2));
  return g;
}

// ---- colonne dispensa/frigo con ante a telaio ----
export function colonne(ctx, { x1, z0, z1 }) {
  const M = MAT();
  const g = new THREE.Group();
  const D = 0.6, Hc = 2.2, L = z1 - z0, cx = x1 - D / 2, cz = (z0 + z1) / 2;
  g.add(box(D - 0.05, 0.1, L, M.noceScuro, cx + 0.025, 0.05, cz));
  g.add(box(D, Hc - 0.1, L, M.salvia, cx, 0.1 + (Hc - 0.1) / 2, cz));
  g.add(box(D + 0.02, 0.05, L + 0.02, M.noce, cx - 0.01, Hc + 0.025, cz));
  const n = 2, aw = L / n;
  for (let i = 0; i < n; i++) {
    const z = z0 + aw * (i + 0.5);
    const a = antaTelaio(aw - 0.02, Hc - 0.16, M.salvia, 0.07);
    a.rotation.y = -Math.PI / 2; a.position.set(x1 - D - 0.005, (Hc - 0.16) / 2 + 0.1, z); g.add(a);
    const h = manigliaOttone(0.4, x1 - D - 0.02, 1.1, z + (i ? 0.2 : -0.2), true);
    h.rotation.y = -Math.PI / 2; g.add(h);
  }
  ctx.solid(box(D, Hc, L, M.nero, cx, Hc / 2, cz, { cast: false })).visible = false;
  return g;
}

// ---- isola: top in pietra a spessore, frontale e testate in maiolica, lato lavoro in noce ----
export function isola(ctx, { x0, z0, z1, d = 0.8, sbalzo = 0.3 }) {
  const M = MAT();
  const g = new THREE.Group();
  const L = z1 - z0, Hb = 0.86, cz = (z0 + z1) / 2, cx = x0 + d / 2;
  g.add(box(d - 0.06, 0.1, L - 0.06, M.noceScuro, cx, 0.05, cz));
  g.add(box(d, Hb - 0.1, L, M.noce, cx, 0.1 + (Hb - 0.1) / 2, cz));
  // maiolica sul frontale (est) e sulle testate
  g.add(plane(L, Hb - 0.1, M.maiolica, x0 + d + 0.012, 0.1 + (Hb - 0.1) / 2, cz, 'x+'));
  g.add(plane(d, Hb - 0.1, M.maiolica, cx, 0.1 + (Hb - 0.1) / 2, z0 - 0.012, 'z-'));
  g.add(plane(d, Hb - 0.1, M.maiolica, cx, 0.1 + (Hb - 0.1) / 2, z1 + 0.012, 'z+'));
  // ante lato lavoro (ovest)
  const n = Math.round(L / 0.55), aw = L / n;
  for (let i = 0; i < n; i++) {
    const a = antaTelaio(aw - 0.02, Hb - 0.16, M.noce);
    a.rotation.y = -Math.PI / 2; a.position.set(x0 - 0.005, (Hb - 0.16) / 2 + 0.1, z0 + aw * (i + 0.5)); g.add(a);
    const h = manigliaOttone(0.12, x0 - 0.02, 0.62, z0 + aw * (i + 0.5), true);
    h.rotation.y = -Math.PI / 2; g.add(h);
  }
  // top in pietra spessore 6 cm, con sbalzo verso gli sgabelli
  g.add(box(d + sbalzo + 0.04, 0.06, L + 0.06, M.pietra, x0 + (d + sbalzo + 0.04) / 2 - 0.02, Hb + 0.03, cz));
  // oggetti: ciotola con frutta, tagliere, bottiglia (rientrano anche nell'isola corta)
  const q1 = Math.min(0.4, L / 2 - 0.25), q2 = Math.min(0.7, L / 2 - 0.2);
  g.add(cyl(0.16, 0.1, 0.07, M.ceramicaSalvia, cx + 0.05, Hb + 0.095, cz - q1, 20));
  for (let i = 0; i < 6; i++) g.add(sphere(0.04, i % 2 ? M.cotto : M.senape || M.cotto, cx + 0.05 + Math.cos(i) * 0.06, Hb + 0.14, cz - q1 + Math.sin(i * 1.7) * 0.06, 10));
  g.add(box(0.25, 0.025, 0.4, M.rovere, cx, Hb + 0.07, cz + q1));
  g.add(cyl(0.035, 0.035, 0.26, M.verdeVetro || M.vetro, cx - 0.2, Hb + 0.19, cz + q2, 12));
  ctx.solid(box(d + sbalzo, Hb, L, M.nero, x0 + (d + sbalzo) / 2, Hb / 2, cz, { cast: false })).visible = false;
  return g;
}

// ---- sgabello: seduta tonda in noce, gambe in ferro con anello poggiapiedi ----
export function sgabello(ctx, x, z, h = 0.68) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.17, 0.17, 0.035, M.noce, 0, h - 0.017, 0, 20));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = cyl(0.008, 0.008, h - 0.035, M.ferro, Math.cos(a) * 0.12, (h - 0.035) / 2, Math.sin(a) * 0.12, 8);
    leg.rotation.z = Math.cos(a) * 0.08; leg.rotation.x = -Math.sin(a) * 0.08;
    g.add(leg);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.006, 6, 20), M.ferro);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; g.add(ring);
  place(g, x, z);
  return g;
}

// ---- tavolo in noce massello, 8 posti, gambe tornite importanti ----
export function tavolo(ctx, { cx, cz, L = 2.2, W = 1.0, H = 0.76, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(W, 0.06, L, M.noceVerticale, 0, H - 0.03, 0));
  g.add(box(W - 0.3, 0.08, L - 0.3, M.noce, 0, H - 0.1, 0)); // fascia
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * (W / 2 - 0.12), z = sz * (L / 2 - 0.14);
    g.add(box(0.11, 0.18, 0.11, M.noce, x, 0.09, z));
    g.add(cyl(0.05, 0.06, 0.36, M.noce, x, 0.36, z, 14));
    g.add(sphere(0.075, M.noce, x, 0.56, z, 14));
    g.add(box(0.1, 0.12, 0.1, M.noce, x, H - 0.14, z));
  }
  // traversa bassa
  g.add(box(0.06, 0.06, L - 0.5, M.noce, 0, 0.2, 0));
  g.add(box(W - 0.3, 0.06, 0.06, M.noce, 0, 0.2, -(L / 2 - 0.14)));
  g.add(box(W - 0.3, 0.06, 0.06, M.noce, 0, 0.2, L / 2 - 0.14));
  // centrotavola: brocca in ceramica e ciotola
  g.add(cyl(0.07, 0.05, 0.22, M.ceramicaSalvia, 0, H + 0.11, -0.2, 16));
  g.add(cyl(0.14, 0.1, 0.05, M.ceramica, 0, H + 0.025, 0.3, 20));
  place(g, cx, cz, ry);
  ctx.solid(g);
  return g;
}

// ---- sedia in legno con seduta impagliata ----
export function sedia(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  const s = 0.42;
  g.add(box(s, 0.035, s, M.lino, 0, 0.45, 0)); // seduta impagliata
  g.add(box(s, 0.05, 0.04, M.noce, 0, 0.42, -s / 2 + 0.02));
  g.add(box(s, 0.05, 0.04, M.noce, 0, 0.42, s / 2 - 0.02));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const hh = sz < 0 ? 0.92 : 0.45;
    g.add(box(0.035, hh, 0.035, M.noce, sx * (s / 2 - 0.02), hh / 2, sz * (s / 2 - 0.02)));
  }
  // schienale: due doghe orizzontali
  g.add(box(s - 0.04, 0.05, 0.025, M.noce, 0, 0.88, -s / 2 + 0.02));
  g.add(box(s - 0.04, 0.05, 0.025, M.noce, 0, 0.72, -s / 2 + 0.02));
  g.add(box(0.03, 0.12, 0.02, M.noce, 0, 0.8, -s / 2 + 0.02));
  place(g, x, z, ry);
  return g;
}

// ---- assemblaggio cucina ----
export function arredaCucina(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.soggiorno.rects[0]; // x 0.25-4.16, z 0.28-9.40
  const xW = R.x, xE = R.x + R.w;
  const runZ0 = R.z + 0.08, runZ1 = 4.4, hobZ = 0.95, sinkZ = 3.55;
  // la finestra sul lavello (F-cucina-lavello) interrompe il listello del paraspruzzi
  g.add(rivestimentoMaiolica(ctx, { x: xW, z0: runZ0, z1: runZ1, hobZ, salto: [2.85, 4.45] }));
  g.add(baseCucina(ctx, { x0: xW, z0: runZ0, z1: runZ1, hobZ, sinkZ }));
  g.add(cappaMuratura(ctx, { x: xW, z: hobZ }));
  g.add(mensole(ctx, { x: xW, z0: 1.7, z1: 2.85 })); // si fermano prima della finestra sul lavello
  g.add(colonne(ctx, { x1: xE, z0: R.z + 0.05, z1: R.z + 1.35 }));
  return g;
}

// ---- isola + zona pranzo, variante V1: isola da 2,10 m con tre sgabelli, tavolo da 2,20 m ----
export function zonaPranzoV1(ctx) {
  const g = new THREE.Group();
  const H = ctx.H;
  const isoX0 = 1.75, isoZ0 = 1.8, isoZ1 = 3.9;
  g.add(isola(ctx, { x0: isoX0, z0: isoZ0, z1: isoZ1 }));
  for (let i = 0; i < 3; i++) g.add(sgabello(ctx, isoX0 + 0.8 + 0.3 + 0.12, isoZ0 + 0.4 + i * 0.65));
  // tavolo in orizzontale (lato lungo est-ovest): libera la parete davanti al divano per il mobile TV
  const tz = 5.4, tx = 2.2;
  g.add(tavolo(ctx, { cx: tx, cz: tz, ry: Math.PI / 2 }));
  for (let i = 0; i < 3; i++) {
    g.add(sedia(ctx, tx - 0.7 + i * 0.7, tz - 0.75, 0));
    g.add(sedia(ctx, tx - 0.7 + i * 0.7, tz + 0.75, Math.PI));
  }
  g.add(sedia(ctx, tx - 1.4, tz, Math.PI / 2));
  g.add(sedia(ctx, tx + 1.4, tz, -Math.PI / 2));
  // lampade: due campane in ceramica sull'isola, due sul tavolo
  g.add(pendente(ctx, isoX0 + 0.45, isoZ0 + 0.6, { yTop: H, calata: 0.95, raggio: 0.17 }));
  g.add(pendente(ctx, isoX0 + 0.45, isoZ1 - 0.6, { yTop: H, calata: 0.95, raggio: 0.17 }));
  g.add(pendente(ctx, tx - 0.5, tz, { yTop: H, calata: 1.0, raggio: 0.2, paralume: 'salvia' }));
  g.add(pendente(ctx, tx + 0.5, tz, { yTop: H, calata: 1.0, raggio: 0.2, paralume: 'salvia' }));
  return g;
}

// ---- isola + zona pranzo, variante V2: isola ridotta a 1,30 m (piano di lavoro e appoggio,
// due sgabelli) e tavolo da 2,40 m per otto, al centro della stanza con passaggi piu' larghi ----
export function zonaPranzoV2(ctx) {
  const g = new THREE.Group();
  const H = ctx.H;
  const isoX0 = 1.8, isoD = 0.75, isoSb = 0.28, isoZ0 = 1.75, isoZ1 = 3.05;
  g.add(isola(ctx, { x0: isoX0, z0: isoZ0, z1: isoZ1, d: isoD, sbalzo: isoSb }));
  const sgX = isoX0 + isoD + isoSb + 0.12;
  for (let i = 0; i < 2; i++) g.add(sgabello(ctx, sgX, isoZ0 + 0.33 + i * 0.64));
  // il tavolo guadagna 20 cm di lato lungo e 10 di profondita': otto posti veri
  const tz = 5.15, tx = 2.2, L = 2.4, W = 1.1;
  g.add(tavolo(ctx, { cx: tx, cz: tz, L, W, ry: Math.PI / 2 }));
  for (let i = 0; i < 3; i++) {
    g.add(sedia(ctx, tx - 0.75 + i * 0.75, tz - 0.8, 0));
    g.add(sedia(ctx, tx - 0.75 + i * 0.75, tz + 0.8, Math.PI));
  }
  g.add(sedia(ctx, tx - L / 2 - 0.28, tz, Math.PI / 2));
  g.add(sedia(ctx, tx + L / 2 + 0.28, tz, -Math.PI / 2));
  g.add(pendente(ctx, isoX0 + 0.42, isoZ0 + 0.35, { yTop: H, calata: 0.95, raggio: 0.17 }));
  g.add(pendente(ctx, isoX0 + 0.42, isoZ1 - 0.35, { yTop: H, calata: 0.95, raggio: 0.17 }));
  for (const dx of [-0.62, 0.62]) g.add(pendente(ctx, tx + dx, tz, { yTop: H, calata: 1.0, raggio: 0.2, paralume: 'salvia' }));
  return g;
}
