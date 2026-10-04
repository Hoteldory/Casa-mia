// Cucina (zona nord del soggiorno), stile country chiaro: ante a riquadro azzurro polvere,
// piano in marmo bianco, piastrelle metro bianche, cappa intonacata con trave in rovere,
// mensole in rovere su staffe d'ottone, globi di vetro; tavolo da fattoria con sedie Windsor.
import * as THREE from 'three';
import { box, cyl, sphere, plane, group, place, antaTelaio, manigliaOttone, pendente, pendenteGlobo, lampadarioTamburo, libri, tappeto, pianta, MAT } from './comune.js';

// ---- base cucina lineare con ante a telaio e maniglie in ottone (lungo Z, contro il muro ovest) ----
// hobZ o sinkZ a null: tratto senza piano cottura o senza lavello; mat = colore delle ante
export function baseCucina(ctx, { x0, z0, z1, hobZ = null, sinkZ = null, mat, top }) {
  const M = MAT();
  const F = mat || M.salvia;
  const g = new THREE.Group();
  const L = z1 - z0, D = 0.6, Hb = 0.86;
  const cx = x0 + D / 2, cz = (z0 + z1) / 2;
  g.add(box(D - 0.06, 0.1, L - 0.04, M.noceScuro, cx - 0.03 + 0.05, 0.05, cz)); // zoccolo arretrato
  g.add(box(D, Hb - 0.1, L, F, cx, 0.1 + (Hb - 0.1) / 2, cz)); // corpo
  // top in pietra a spessore
  g.add(box(D + 0.03, 0.04, L + 0.02, top || M.pietra, cx + 0.015, Hb + 0.02, cz));
  // ante: moduli da ~60 cm, faccia verso +X
  const n = Math.round(L / 0.6);
  const aw = L / n;
  for (let i = 0; i < n; i++) {
    const z = z0 + aw * (i + 0.5);
    const isHob = hobZ !== null && Math.abs(z - hobZ) < aw / 2;
    if (isHob) {
      // forno sotto il piano cottura: cassetto sopra + anta forno con vetro scuro
      const dr = antaTelaio(aw - 0.02, 0.18, F, 0.04);
      dr.rotation.y = Math.PI / 2; dr.position.set(x0 + D + 0.005, Hb - 0.12, z); g.add(dr);
      g.add(manigliaOttone(0.25, x0 + D + 0.02, Hb - 0.12, z).rotateY(Math.PI / 2));
      g.add(box(0.02, 0.5, aw - 0.02, M.nero, x0 + D + 0.005, 0.37, z));
      g.add(box(0.01, 0.03, aw - 0.06, M.ottone, x0 + D + 0.02, 0.58, z));
      g.add(box(0.01, 0.26, aw - 0.1, M.pietraScura, x0 + D + 0.015, 0.32, z));
    } else if (sinkZ !== null && Math.abs(z - sinkZ) < aw / 2) {
      // lavello a catino: frontale in ceramica a vista
      g.add(box(0.06, 0.24, aw - 0.02, M.ceramica, x0 + D + 0.02, Hb - 0.1, z));
      const a = antaTelaio(aw - 0.02, Hb - 0.36, F);
      a.rotation.y = Math.PI / 2; a.position.set(x0 + D + 0.005, (Hb - 0.36) / 2 + 0.1, z); g.add(a);
      g.add(manigliaOttone(0.12, x0 + D + 0.02, 0.55, z).rotateY(Math.PI / 2));
    } else {
      const a = antaTelaio(aw - 0.02, Hb - 0.14, F);
      a.rotation.y = Math.PI / 2; a.position.set(x0 + D + 0.005, (Hb - 0.14) / 2 + 0.1, z); g.add(a);
      const h = manigliaOttone(0.12, x0 + D + 0.02, 0.62, z + (i % 2 ? -0.16 : 0.16), true);
      h.rotation.y = Math.PI / 2; g.add(h);
    }
  }
  // piano cottura: 4 fuochi con griglie in ghisa e manopole in ottone
  if (hobZ !== null) {
    for (const [dz, dx] of [[-0.14, -0.12], [0.14, -0.12], [-0.14, 0.12], [0.14, 0.12]]) {
      g.add(cyl(0.045, 0.045, 0.012, M.ottoneScuro, cx + dx, Hb + 0.046, hobZ + dz, 16));
      g.add(cyl(0.02, 0.02, 0.02, M.ferro, cx + dx, Hb + 0.05, hobZ + dz, 12));
      g.add(box(0.2, 0.01, 0.2, M.ferro, cx + dx, Hb + 0.06, hobZ + dz));
    }
    for (let i = 0; i < 4; i++) g.add(cyl(0.012, 0.012, 0.02, M.ottone, x0 + D - 0.03, Hb + 0.05, hobZ - 0.2 + i * 0.13, 10));
    // pentola in rame sul fuoco
    g.add(cyl(0.11, 0.1, 0.12, M.ottoneScuro, cx - 0.12, Hb + 0.12, hobZ + 0.14, 20));
    g.add(cyl(0.006, 0.006, 0.2, M.ferro, cx - 0.12, Hb + 0.16, hobZ + 0.3, 8).rotateX(Math.PI / 2));
  }
  // lavello: incasso nel top + rubinetto a collo d'oca in ottone brunito
  if (sinkZ !== null) {
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
    if (sinkZ + 0.8 < z1) g.add(box(0.28, 0.02, 0.4, M.rovere, cx, Hb + 0.05, sinkZ + 0.6)); // tagliere
  }
  // vasetti in ceramica in fondo al piano
  for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 0.14 + i * 0.03, M.ceramica, cx - 0.15, Hb + 0.11 + i * 0.015, z1 - 0.3 - i * 0.13, 16));
  ctx.solid(box(D + 0.05, Hb, L, M.nero, cx, Hb / 2, cz, { cast: false })).visible = false;
  return g;
}

// ---- rivestimento in maiolica: paraspruzzi lungo la base e nicchia alta dietro il piano cottura ----
export function rivestimentoMaiolica(ctx, { x, z0, z1, hobZ, salto = null, mat, listello }) {
  const M = MAT();
  const T = mat || M.maiolica, Li = listello || M.pietra;
  const g = new THREE.Group();
  // il paraspruzzi si interrompe dove la finestra scende a filo del piano di lavoro
  const tratti = salto ? [[z0, salto[0]], [salto[1], z1]] : [[z0, z1]];
  for (const [a, b] of tratti) {
    if (b - a < 0.05) continue;
    g.add(plane(b - a, 0.6, T, x + 0.02, 1.2, (a + b) / 2, 'x+'));
    g.add(box(0.05, 0.04, b - a + 0.04, Li, x + 0.025, 1.52, (a + b) / 2)); // listello di coronamento
  }
  g.add(plane(1.1, 0.6, T, x + 0.02, 1.8, hobZ, 'x+')); // nicchia dietro il piano cottura
  g.add(box(0.05, 0.04, 1.16, Li, x + 0.025, 2.12, hobZ));
  return g;
}

// ---- cappa in muratura ----
// trave: se data, al posto del bordo sottile in noce c'e' una mensola-trave in legno
export function cappaMuratura(ctx, { x, z, yBase = 1.62, trave }) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H;
  // corpo svasato
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.32, 4, 1), M.intonaco);
  body.rotation.y = Math.PI / 4; body.scale.set(0.75, 1, 1);
  body.position.set(x + 0.32, yBase + 0.16, z); body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  g.add(box(0.5, H - yBase - 0.32, 0.6, M.intonaco, x + 0.25, (yBase + 0.32 + H) / 2, z));
  // bordo in legno noce, oppure trave a vista
  if (trave) g.add(box(0.66, 0.14, 0.96, trave, x + 0.33, yBase - 0.03, z));
  else g.add(box(0.62, 0.05, 0.84, M.noce, x + 0.31, yBase, z));
  return g;
}

// ---- mensole a giorno in noce con reggimensola in ottone ----
export function mensole(ctx, { x, z0, z1, ys = [1.62, 2.02], legno, vasi }) {
  const M = MAT();
  const Lg = legno || M.noce, V = vasi || M.ceramicaSalvia;
  const g = new THREE.Group();
  const L = z1 - z0, cz = (z0 + z1) / 2;
  for (const y of ys) {
    g.add(box(0.28, 0.035, L, Lg, x + 0.14, y, cz));
    for (const zz of [z0 + 0.15, cz, z1 - 0.15]) {
      g.add(box(0.24, 0.015, 0.015, M.ottone, x + 0.12, y - 0.025, zz));
      g.add(box(0.015, 0.16, 0.015, M.ottone, x + 0.008, y - 0.1, zz));
    }
  }
  // oggetti: barattoli in ceramica, piatti in piedi, libri di cucina, pianta
  for (let i = 0; i < 4; i++) g.add(cyl(0.06, 0.055, 0.16 + (i % 2) * 0.06, i % 2 ? M.ceramica : V, x + 0.14, ys[0] + 0.1 + (i % 2) * 0.03, z0 + 0.22 + i * 0.2, 14));
  for (let i = 0; i < 3; i++) {
    const p = cyl(0.12, 0.12, 0.012, M.ceramica, x + 0.06, ys[1] + 0.14, z0 + 0.28 + i * 0.28, 20);
    p.rotation.z = Math.PI / 2; p.rotation.y = 0; p.rotation.x = 0.15; g.add(p);
  }
  g.add(libri(0.55, x + 0.14, ys[1] + 0.02, z1 - 0.42, 4).rotateY(Math.PI / 2));
  return g;
}

// ---- colonne dispensa/frigo con ante a telaio ----
export function colonne(ctx, { x1, z0, z1, mat, legno }) {
  const M = MAT();
  const F = mat || M.salvia;
  const g = new THREE.Group();
  const D = 0.6, Hc = 2.2, L = z1 - z0, cx = x1 - D / 2, cz = (z0 + z1) / 2;
  g.add(box(D - 0.05, 0.1, L, M.noceScuro, cx + 0.025, 0.05, cz));
  g.add(box(D, Hc - 0.1, L, F, cx, 0.1 + (Hc - 0.1) / 2, cz));
  g.add(box(D + 0.02, 0.05, L + 0.02, legno || M.noce, cx - 0.01, Hc + 0.025, cz));
  const n = 2, aw = L / n;
  for (let i = 0; i < n; i++) {
    const z = z0 + aw * (i + 0.5);
    const a = antaTelaio(aw - 0.02, Hc - 0.16, F, 0.07);
    a.rotation.y = -Math.PI / 2; a.position.set(x1 - D - 0.005, (Hc - 0.16) / 2 + 0.1, z); g.add(a);
    const h = manigliaOttone(0.4, x1 - D - 0.02, 1.1, z + (i ? 0.2 : -0.2), true);
    h.rotation.y = -Math.PI / 2; g.add(h);
  }
  ctx.solid(box(D, Hc, L, M.nero, cx, Hc / 2, cz, { cast: false })).visible = false;
  return g;
}

// ---- tavolo in noce massello, 8 posti, gambe tornite importanti ----
export function tavolo(ctx, { cx, cz, L = 2.2, W = 1.0, H = 0.76, ry = 0, giunti = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(W, 0.06, L, M.noceVerticale, 0, H - 0.03, 0));
  // linee di giunzione delle prolunghe (solo a tavolo aperto)
  if (giunti) for (const s of [-1, 1]) g.add(box(W, 0.003, 0.008, M.noceScuro, 0, H - 0.0005, s * giunti));
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
  const az = M.azzurroPolvere;
  // piastrelle metro bianche; la finestra sul lavello (F-cucina-lavello) interrompe il listello
  g.add(rivestimentoMaiolica(ctx, { x: xW, z0: runZ0, z1: runZ1, hobZ, salto: [2.85, 4.45], mat: M.metro, listello: M.marmo }));
  g.add(baseCucina(ctx, { x0: xW, z0: runZ0, z1: runZ1, hobZ, sinkZ, mat: az, top: M.marmo }));
  g.add(cappaMuratura(ctx, { x: xW, z: hobZ, trave: M.rovereMiele }));
  g.add(mensole(ctx, { x: xW, z0: 1.7, z1: 2.85, legno: M.rovereMiele, vasi: M.ceramica })); // si fermano prima della finestra
  g.add(colonne(ctx, { x1: xE, z0: R.z + 0.05, z1: R.z + 1.35, mat: az, legno: M.rovereMiele }));
  // piano di appoggio accanto alle colonne, fino alla fine del muro del bagno (z 2,99): top in rovere massello
  g.add(pianoAppoggio(ctx, { x1: xE, z0: R.z + 1.37, z1: 2.97, mat: az, top: M.rovereMiele, rivest: M.metro, legno: M.rovereMiele }));
  // luce: due globi di vetro sopra il piano di lavoro, lampadario a tamburo sul tavolo
  for (const z of [1.95, 3.0]) g.add(pendenteGlobo(ctx, xW + 0.85, z, { yTop: ctx.H, calata: 0.85 }));
  g.add(lampadarioTamburo(ctx, TAVOLO.cx, TAVOLO.cz, { yTop: ctx.H, calata: 1.0 }));
  // tappeto in juta sotto il tavolo e un vaso di ortensie bianche al centro (sul tavolo, vedi tavoloFattoria)
  g.add(tappeto(1.9, 3.1, M.juta, TAVOLO.cx, TAVOLO.cz));
  g.add(pianta(xE - 0.3, 3.35, { h: 1.3, vaso: 0.18, matVaso: M.ceramica }));
  return g;
}

// ---- il tavolo allungabile, lato lungo nord-sud: chiuso quattro posti, aperto otto ----
// Spostato verso est, lascia un corridoio di ~1 m davanti alla cucina; aperto entra nella zona cucina.
export const TAVOLO = { cx: 2.8, cz: 4.5, W: 1.0, chiuso: 1.4, aperto: 2.2, passo: 0.7, sporgenza: 0.3, lampade: 0.5 };

// ---- tavolo da fattoria: piano in rovere a tre assi, fascia, gambe tornite ----
const profiloGamba = (() => {
  // profilo (raggio, altezza) di una gamba tornita alta 0,72
  const p = [[0.0, 0], [0.032, 0], [0.034, 0.03], [0.026, 0.06], [0.03, 0.1], [0.04, 0.14], [0.042, 0.2], [0.03, 0.26],
    [0.026, 0.4], [0.036, 0.46], [0.026, 0.5], [0.024, 0.56], [0.045, 0.58], [0.045, 0.72], [0.0, 0.72]];
  return p.map(([r, y]) => new THREE.Vector2(r, y));
})();
export function tavoloFattoria(ctx, { cx, cz, L = 2.2, W = 1.0, H = 0.77, giunti = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const legno = M.rovereMiele;
  // piano: tre assi lungo la lunghezza (z), con le fughe
  const tp = 0.05, assi = 3, aw = W / assi;
  for (let i = 0; i < assi; i++) g.add(box(aw - 0.004, tp, L, legno, -W / 2 + aw * (i + 0.5), H - tp / 2, 0));
  if (giunti) for (const s of [-1, 1]) g.add(box(W, 0.003, 0.006, M.noceScuro, 0, H + 0.0005, s * giunti));
  // fascia sotto il piano
  for (const s of [-1, 1]) {
    g.add(box(0.03, 0.11, L - 0.24, legno, s * (W / 2 - 0.1), H - tp - 0.055, 0));
    g.add(box(W - 0.24, 0.11, 0.03, legno, 0, H - tp - 0.055, s * (L / 2 - 0.1)));
  }
  // gambe tornite
  const geo = new THREE.LatheGeometry(profiloGamba, 14);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const gm = new THREE.Mesh(geo, legno);
    gm.position.set(sx * (W / 2 - 0.1), 0, sz * (L / 2 - 0.12));
    gm.castShadow = true; gm.receiveShadow = true;
    g.add(gm);
  }
  // al centro: brocca in ceramica con ortensie bianche e un vassoio in vimini con candele
  g.add(cyl(0.08, 0.06, 0.2, M.ceramica, 0, H + 0.1, -0.15, 16));
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, r = i ? 0.07 : 0;
    g.add(sphere(0.06, M.carta, Math.cos(a) * r, H + 0.27 + (i % 2) * 0.02, -0.15 + Math.sin(a) * r, 10));
  }
  for (let i = 0; i < 4; i++) g.add(sphere(0.035, M.foglia, Math.cos(i * 1.6) * 0.13, H + 0.22, -0.15 + Math.sin(i * 1.6) * 0.13, 6));
  g.add(box(0.36, 0.04, 0.24, M.juta, 0, H + 0.02, 0.32));
  for (const dz of [-0.05, 0.05]) g.add(cyl(0.02, 0.02, 0.12, M.carta, dz * 2, H + 0.1, 0.32, 10));
  place(g, cx, cz, 0);
  ctx.solid(g);
  return g;
}

// ---- sedia Windsor: seduta sagomata, gambe divaricate, schienale a stecche con arco ----
export function sediaWindsor(ctx, x, z, ry = 0, mat) {
  const M = MAT();
  const m = mat || M.neroWindsor;
  const g = new THREE.Group();
  const hs = 0.45;
  g.add(box(0.44, 0.04, 0.42, m, 0, hs, 0.01));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = cyl(0.016, 0.02, hs, m, sx * 0.17, hs / 2, sz * 0.15, 8);
    leg.rotation.z = sx * 0.09; leg.rotation.x = -sz * 0.07;
    g.add(leg);
  }
  g.add(cyl(0.01, 0.01, 0.36, m, 0, 0.17, 0.01, 6).rotateZ(Math.PI / 2)); // traversa ad H
  for (const sz of [-1, 1]) g.add(cyl(0.01, 0.01, 0.3, m, 0, 0.17, sz * 0.15, 6).rotateX(Math.PI / 2).rotateZ(0));
  // schienale: due montanti, sette stecche e l'arco
  const hb = 0.5;
  for (const sx of [-1, 1]) g.add(cyl(0.014, 0.014, hb, m, sx * 0.19, hs + hb / 2, -0.19, 8));
  for (let i = 0; i < 7; i++) g.add(cyl(0.007, 0.008, hb - 0.03, m, -0.15 + i * 0.05, hs + (hb - 0.03) / 2, -0.19, 6));
  const arco = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.016, 6, 16, Math.PI), m);
  arco.scale.set(1, 0.25, 1);
  arco.position.set(0, hs + hb - 0.01, -0.19);
  arco.castShadow = true;
  g.add(arco);
  place(g, x, z, ry);
  return g;
}

export function tavoloPranzo(ctx, aperto) {
  const T = TAVOLO;
  const M = MAT();
  const g = new THREE.Group();
  const L = aperto ? T.aperto : T.chiuso;
  const tx = T.cx, tz = T.cz, dx = T.W / 2 + 0.25;
  g.add(tavoloFattoria(ctx, { cx: tx, cz: tz, L, W: T.W, giunti: aperto ? T.chiuso / 2 : 0 }));
  // sedie Windsor nere sui lati lunghi; a capotavola due in rovere naturale, come nelle foto
  const zs = aperto ? [tz - T.passo, tz, tz + T.passo] : [tz - 0.38, tz + 0.38];
  for (const z of zs) {
    g.add(sediaWindsor(ctx, tx - dx, z, Math.PI / 2));
    g.add(sediaWindsor(ctx, tx + dx, z, -Math.PI / 2));
  }
  if (aperto) {
    g.add(sediaWindsor(ctx, tx, tz - L / 2 - T.sporgenza, 0, M.rovereMiele));
    g.add(sediaWindsor(ctx, tx, tz + L / 2 + T.sporgenza, Math.PI, M.rovereMiele));
  }
  return g;
}

// ---- piccoli elettrodomestici in stile, costruiti con il fronte verso -X (parete est) ----
function planetaria(M, x, y, z) {
  const g = new THREE.Group();
  const c = M.ceramicaSalvia;
  g.add(box(0.2, 0.05, 0.3, c, 0, 0.025, 0));                 // base
  g.add(box(0.1, 0.24, 0.12, c, 0.05, 0.17, 0));              // colonna
  const testa = cyl(0.075, 0.09, 0.3, c, -0.03, 0.34, 0, 16); testa.rotation.z = Math.PI / 2; g.add(testa);
  g.add(cyl(0.11, 0.075, 0.14, M.ottone, -0.05, 0.12, 0, 18)); // ciotola
  g.add(cyl(0.012, 0.012, 0.1, M.ferro, -0.05, 0.22, 0, 8));  // frusta
  g.position.set(x, y, z);
  return g;
}
function macchinaCaffe(M, x, y, z) {
  const g = new THREE.Group();
  g.add(box(0.32, 0.36, 0.28, M.crema, 0, 0.18, 0));
  g.add(box(0.33, 0.03, 0.29, M.ottone, 0, 0.375, 0));
  g.add(cyl(0.035, 0.035, 0.06, M.ottone, -0.17, 0.25, 0, 12).rotateZ(Math.PI / 2)); // gruppo
  g.add(box(0.14, 0.02, 0.03, M.noceScuro, -0.24, 0.23, 0));                          // portafiltro
  g.add(box(0.08, 0.015, 0.18, M.ferro, -0.13, 0.05, 0));                             // griglia
  g.add(cyl(0.035, 0.03, 0.06, M.ceramica, -0.14, 0.09, 0, 12));                      // tazzina
  g.add(cyl(0.02, 0.02, 0.012, M.ottone, -0.145, 0.32, 0.08, 10).rotateZ(Math.PI / 2)); // manometro
  g.position.set(x, y, z);
  return g;
}
function microonde(M, x, y, z) {
  const g = new THREE.Group();
  g.add(box(0.36, 0.28, 0.48, M.crema, 0, 0.14, 0));
  g.add(box(0.01, 0.2, 0.3, M.nero, -0.18, 0.14, -0.05));      // oblo' scuro
  g.add(box(0.012, 0.22, 0.012, M.ottone, -0.185, 0.14, 0.12)); // maniglia
  for (const y2 of [0.19, 0.09]) g.add(cyl(0.018, 0.018, 0.015, M.ottone, -0.185, y2, 0.19, 12).rotateZ(Math.PI / 2));
  g.position.set(x, y, z);
  return g;
}

// ---- piano di lavoro sulla parete est, accanto alle colonne: planetaria, caffe', microonde ----
export function pianoAppoggio(ctx, { x1, z0, z1, mat, top, rivest, legno }) {
  const M = MAT();
  const F = mat || M.salvia, Tp = top || M.pietra, Rv = rivest || M.maiolica, Lg = legno || M.noce;
  const g = new THREE.Group();
  const D = 0.6, Hb = 0.86, L = z1 - z0, cx = x1 - D / 2, cz = (z0 + z1) / 2;
  g.add(box(D - 0.05, 0.1, L, M.noceScuro, cx + 0.025, 0.05, cz));
  g.add(box(D, Hb - 0.1, L, F, cx, 0.1 + (Hb - 0.1) / 2, cz));
  g.add(box(D + 0.03, 0.04, L + 0.02, Tp, cx - 0.015, Hb + 0.02, cz));
  const n = 2, aw = L / n;
  for (let i = 0; i < n; i++) {
    const z = z0 + aw * (i + 0.5);
    const a = antaTelaio(aw - 0.02, Hb - 0.14, F);
    a.rotation.y = -Math.PI / 2; a.position.set(x1 - D - 0.005, (Hb - 0.14) / 2 + 0.1, z); g.add(a);
    const h = manigliaOttone(0.12, x1 - D - 0.02, 0.62, z + (i ? -0.16 : 0.16), true);
    h.rotation.y = -Math.PI / 2; g.add(h);
  }
  const y = Hb + 0.04;
  g.add(planetaria(M, x1 - 0.3, y, z0 + 0.18));
  g.add(macchinaCaffe(M, x1 - 0.25, y, z0 + 0.55));
  g.add(microonde(M, x1 - 0.28, y, z1 - 0.3));
  // maiolica dietro il piano, come il paraspruzzi della cucina, e mensola in noce
  g.add(plane(L, 0.6, Rv, x1 - 0.02, Hb + 0.34, cz, 'x-'));
  g.add(box(0.05, 0.04, L + 0.04, M.pietra, x1 - 0.025, Hb + 0.66, cz));
  g.add(box(0.26, 0.035, L - 0.1, Lg, x1 - 0.13, 1.62, cz));
  for (const zz of [z0 + 0.2, z1 - 0.2]) g.add(box(0.22, 0.015, 0.015, M.ottone, x1 - 0.11, 1.595, zz));
  for (let i = 0; i < 4; i++) g.add(cyl(0.055, 0.05, 0.16 + (i % 2) * 0.05, i % 2 ? M.ceramica : M.ceramicaSalvia, x1 - 0.13, 1.72 + (i % 2) * 0.025, z0 + 0.25 + i * 0.26, 14));
  ctx.solid(box(D + 0.03, Hb + 0.04, L, M.nero, cx, (Hb + 0.04) / 2, cz, { cast: false })).visible = false;
  return g;
}
