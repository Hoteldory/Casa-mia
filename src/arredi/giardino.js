// Giardino intorno alla casa, al piano del terreno: davanti (sud, lato ingressi), sui due lati
// e dietro (nord), dove e' piu' profondo e ospita l'orto oltre la casa dei suoceri.
// Recinzione: a sud muretto intonacato con cancellata in ferro, cancelletto sul vialetto e ai due
// capi i cancelli carrabili scorrevoli dei due posti auto;
// sui lati e dietro staccionata in castagno a doghe. Misure in metri, terreno a quota 0
// (main.js sposta il gruppo alla quota del piano terra).
import * as THREE from 'three';
import { box, cyl, sphere, plane, place, lanterna, MAT, matColore } from './comune.js';
import { cespuglio, rnd, VERDI, sediaTerrazzo } from './terrazzo.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// lotto: la casa occupa x 0-10,51, z 0-10,97; la casa dei suoceri, sotto il terrazzo,
// x 0,70-9,24 da z -7,94 a 0 e x 0,70-8,84 da z -11,78 a -7,94
export const LOTTO = { x0: -3.5, x1: 14.0, z0: -23.5, z1: 17.5 };
const CANCELLO = { x0: 4.5, x1: 5.7 }; // in asse con il vialetto per i due ingressi
// Cancelli carrabili scorrevoli ai due capi del fronte, con il posto auto subito dentro, contro
// la recinzione laterale. Varco 300, anta 330 (sormonta 5 cm la battuta e resta 25 cm dietro il
// pilastro di guida); in apertura l'anta corre verso il centro del fronte, dietro la recinzione,
// che deve quindi restare dritta per anta + 20 cm di fine corsa = 350 cm dal varco. Scorrendo
// verso l'interno, dalla parte del confine basta il pilastro di battuta da 40 cm.
// verso = direzione di apertura (+1 verso est, -1 verso ovest)
export const CARRABILI = [
  { per: 'piano primo', x0: -3.1, x1: -0.1, verso: 1, posto: [-3.35, -0.45], auto: '#34505a' },  // a ovest, vicino alla scala
  { per: 'piano terra', x0: 10.6, x1: 13.6, verso: -1, posto: [10.95, 13.85], auto: '#d8cdb4' }, // a est
];
const ANTA = 3.3, FINE_CORSA = 0.2, POSTO_Z = [12.2, 17.3];

// ---- albero: tronco e chioma a masse, con frutti se richiesti ----
function albero(ctx, { x, z, h = 3.2, r = 1.1, seed = 1, frutti = null, colori = VERDI, cipresso = false }) {
  const g = new THREE.Group();
  const rand = rnd(seed * 977 + 3);
  const tronco = matColore('#5a4632', 0.95);
  if (cipresso) {
    g.add(cyl(0.08, 0.12, 0.6, tronco, 0, 0.3, 0, 8));
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, h, 10), matColore('#2f4a2a', 0.95));
    c.position.y = 0.4 + h / 2; c.castShadow = true; c.receiveShadow = true; g.add(c);
  } else {
    const t = cyl(0.09, 0.15, h * 0.55, tronco, 0, h * 0.275, 0, 9);
    t.rotation.z = (rand() - 0.5) * 0.12; g.add(t);
    cespuglio(g, 0, h * 0.62, 0, r, rand, colori, 9);
    if (frutti) for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2, rr = r * (0.7 + rand() * 0.5);
      g.add(sphere(0.05, matColore(frutti, 0.6), Math.cos(a) * rr, h * 0.55 + rand() * r * 1.1, Math.sin(a) * rr, 8));
    }
  }
  place(g, x, z);
  ctx.addColliderBox(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 2);
  return g;
}

// ---- staccionata in castagno: pali, due traversi, doghe verticali ----
function staccionata(g, ctx, { x0, z0, x1, z1 }) {
  const M = MAT();
  const legno = M.noce;
  const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
  const lungoX = Math.abs(ux) > 0.5;
  const at = (t, y, w, h, d, mat) => {
    const x = x0 + ux * t, z = z0 + uz * t;
    g.add(lungoX ? box(w, h, d, mat, x, y, z) : box(d, h, w, mat, x, y, z));
  };
  const nPali = Math.max(1, Math.round(L / 2));
  for (let i = 0; i <= nPali; i++) at((L * i) / nPali, 0.65, 0.1, 1.3, 0.1, M.noceScuro);
  for (const y of [0.3, 0.95]) at(L / 2, y, L, 0.07, 0.045, legno);
  const nDoghe = Math.floor(L / 0.15);
  for (let i = 0; i < nDoghe; i++) at(0.075 + i * (L / nDoghe), 0.6, 0.075, 1.12, 0.02, legno);
  ctx.addColliderBox(Math.min(x0, x1) - 0.06, Math.max(x0, x1) + 0.06, Math.min(z0, z1) - 0.06, Math.max(z0, z1) + 0.06, 0, 1.3);
}

// ---- recinzione sul fronte: muretto intonacato, copertina in pietra, cancellata in ferro ----
function cancellata(g, ctx, { x0, x1, z }) {
  const M = MAT();
  const L = x1 - x0, cx = (x0 + x1) / 2;
  g.add(box(L, 0.55, 0.25, M.intonacoEsterno, cx, 0.275, z));
  g.add(box(L + 0.02, 0.05, 0.33, M.pietra, cx, 0.575, z));
  g.add(box(L, 0.03, 0.03, M.ferro, cx, 1.42, z));
  g.add(box(L, 0.025, 0.025, M.ferro, cx, 0.68, z));
  const n = Math.floor(L / 0.13);
  for (let i = 0; i <= n; i++) {
    const x = x0 + (L * i) / n;
    g.add(box(0.016, 0.82, 0.016, M.ferro, x, 1.01, z));
    if (i % 4 === 2) g.add(box(0.05, 0.05, 0.02, M.ferro, x, 1.2, z).rotateZ(Math.PI / 4));
  }
  ctx.addColliderBox(x0, x1, z - 0.15, z + 0.15, 0, 1.45);
}

// ---- pilastri e cancelletto pedonale, con lanterne ----
function ingressoCancello(g, ctx, { x0, x1, z }) {
  const M = MAT();
  for (const x of [x0 - 0.2, x1 + 0.2]) {
    pilastro(g, ctx, x, z);
    g.add(lanterna(ctx, x, 1.25, z + 0.2, 'z+', { intensita: 10 }));
  }
  // anta in ferro socchiusa verso il giardino, incernierata al pilastro ovest
  const w = x1 - x0 - 0.04;
  const anta = new THREE.Group();
  anta.add(box(w, 0.03, 0.03, M.ferro, w / 2, 1.35, 0));
  anta.add(box(w, 0.03, 0.03, M.ferro, w / 2, 0.12, 0));
  for (let i = 0; i <= 8; i++) anta.add(box(0.016, 1.25, 0.016, M.ferro, (w * i) / 8, 0.73, 0));
  anta.add(box(0.03, 1.3, 0.03, M.ottone, w - 0.02, 0.73, 0));
  anta.position.set(x0 + 0.02, 0, z);
  anta.rotation.y = 0.9; // aperta verso nord, dentro il giardino
  g.add(anta);
}

// ---- pilastro intonacato con copertina in pietra ----
function pilastro(g, ctx, x, z) {
  const M = MAT();
  g.add(box(0.4, 1.6, 0.4, M.intonacoEsterno, x, 0.8, z));
  g.add(box(0.48, 0.06, 0.48, M.pietra, x, 1.63, z));
  ctx.addColliderBox(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 1.6);
}

// ---- cancello carrabile scorrevole in ferro, chiuso: pilastro di battuta verso il confine,
// pilastro di guida verso il centro, binario a terra lungo tutta la corsa, motore e lampeggiante ----
function cancelloScorrevole(g, ctx, { x0, x1, z, verso }) {
  const M = MAT();
  const xB = verso > 0 ? x0 - 0.2 : x1 + 0.2;   // battuta, verso il confine
  const xG = verso > 0 ? x1 + 0.2 : x0 - 0.2;   // guida, dalla parte in cui l'anta si apre
  pilastro(g, ctx, xB, z);
  pilastro(g, ctx, xG, z);
  const zi = z - 0.28;                           // l'anta corre dentro il giardino, dietro i pilastri
  // anta: parte 5 cm dentro la battuta e finisce 25 cm dietro il pilastro di guida
  const a = verso > 0 ? x0 - 0.05 : x1 + 0.05, b = a + verso * ANTA;
  const xa = Math.min(a, b), L = ANTA, cx = xa + L / 2;
  g.add(box(L, 0.1, 0.05, M.ferro, cx, 0.13, zi));
  g.add(box(L, 0.04, 0.05, M.ferro, cx, 1.45, zi));
  g.add(box(L, 0.025, 0.03, M.ferro, cx, 0.72, zi));
  for (const x of [xa + 0.025, xa + L - 0.025]) g.add(box(0.05, 1.36, 0.05, M.ferro, x, 0.79, zi));
  const n = Math.round(L / 0.12);
  for (let i = 1; i < n; i++) {
    const x = xa + (L * i) / n;
    g.add(box(0.016, 1.27, 0.016, M.ferro, x, 0.815, zi));
    if (i % 4 === 2) g.add(box(0.05, 0.05, 0.02, M.ferro, x, 1.2, zi).rotateZ(Math.PI / 4));
  }
  for (const x of [xa + 0.4, xa + L - 0.4]) g.add(cyl(0.06, 0.06, 0.04, M.ferro, x, 0.07, zi, 12).rotateX(Math.PI / 2));
  g.add(box(0.03, 0.2, 0.05, M.ottone, (verso > 0 ? xa + 0.12 : xa + L - 0.12), 1.05, zi - 0.03)); // maniglia di sblocco
  // binario: dal varco fino a fine corsa (anta + 20 cm)
  const r0 = verso > 0 ? x0 - 0.05 : x1 + 0.05, r1 = (verso > 0 ? x1 : x0) + verso * (ANTA + FINE_CORSA);
  g.add(box(Math.abs(r1 - r0), 0.02, 0.05, M.ferro, (r0 + r1) / 2, 0.01, zi, { cast: false }));
  g.add(box(0.06, 0.12, 0.08, M.ferro, r1, 0.06, zi)); // fermo di fine corsa
  // motore accanto al pilastro di guida e lampeggiante sulla sua copertina
  const motore = matColore('#6d6f6b', 0.6);
  g.add(box(0.28, 0.34, 0.2, motore, xG + verso * 0.45, 0.17, zi - 0.2));
  g.add(sphere(0.07, matColore('#d9822b', 0.35), xG, 1.72, z, 10));
  ctx.addColliderBox(x0, x1, zi - 0.05, z + 0.15, 0, 1.5);
}

// ---- automobile stilizzata (muso verso -z), per dare la scala ai posti auto ----
function automobile(g, ctx, { x, z, colore }) {
  const M = MAT();
  const c = new THREE.Group();
  const carr = matColore(colore, 0.35);
  const vetri = matColore('#26313a', 0.15);
  const gomme = matColore('#1d1d1d', 0.9);
  const W = 1.78, L = 4.25;
  c.add(box(W, 0.55, L, carr, 0, 0.5, 0));                       // scocca
  c.add(box(W - 0.04, 0.12, L - 0.2, carr, 0, 0.83, 0.05));      // spalla
  c.add(box(W - 0.18, 0.46, 2.1, vetri, 0, 1.12, 0.25));          // abitacolo vetrato
  c.add(box(W - 0.22, 0.05, 1.9, carr, 0, 1.37, 0.3));            // tetto
  for (const s of [-1, 1]) {
    for (const zz of [-1.35, 1.35]) {
      const r = cyl(0.32, 0.32, 0.22, gomme, s * (W / 2 - 0.1), 0.32, zz, 18);
      r.rotation.z = Math.PI / 2; c.add(r);
      const cer = cyl(0.19, 0.19, 0.23, M.pietra, s * (W / 2 - 0.1), 0.32, zz, 14);
      cer.rotation.z = Math.PI / 2; c.add(cer);
    }
    c.add(box(0.36, 0.1, 0.03, M.ceramica, s * 0.6, 0.62, -L / 2 - 0.005));        // fari
    c.add(box(0.36, 0.08, 0.03, matColore('#8a2a22', 0.4), s * 0.6, 0.66, L / 2 + 0.005)); // fanali
    c.add(box(0.03, 0.06, 0.14, carr, s * (W / 2 + 0.06), 1.0, -0.72));          // specchietti
  }
  c.add(box(0.8, 0.14, 0.03, matColore('#2a2a2a', 0.6), 0, 0.42, -L / 2 - 0.005)); // griglia
  c.position.set(x, 0, z);
  ctx.solid(c);
  g.add(c);
}

// ---- cassone rialzato dell'orto con le sue colture ----
function cassone(g, ctx, { cx, cz, w = 1.2, d = 3.4, coltura, seed }) {
  const M = MAT();
  const rand = rnd(seed * 311 + 17);
  const h = 0.35, sp = 0.05;
  for (const s of [-1, 1]) {
    g.add(box(w, h, sp, M.noce, cx, h / 2, cz + s * (d / 2 - sp / 2)));
    g.add(box(sp, h, d - 2 * sp, M.noce, cx + s * (w / 2 - sp / 2), h / 2, cz));
  }
  g.add(box(w - 2 * sp, 0.02, d - 2 * sp, M.terraOrto, cx, h - 0.03, cz));
  const y = h - 0.02;
  const verde = (c) => matColore(c, 0.9);
  if (coltura === 'pomodori' || coltura === 'fagiolini') {
    // piante su tutori in canna; i fagiolini salgono su canne a capanna
    for (let i = 0; i < 5; i++) {
      const z = cz - d / 2 + 0.35 + i * ((d - 0.7) / 4);
      for (const dx of [-0.28, 0.28]) {
        const canna = cyl(0.01, 0.01, 1.5, matColore('#c9b88a', 0.8), cx + dx * (coltura === 'fagiolini' ? 0.4 : 1), y + 0.75, z, 6);
        if (coltura === 'fagiolini') canna.rotation.x = dx > 0 ? 0.25 : -0.25;
        g.add(canna);
        cespuglio(g, cx + dx * 0.9, y + 0.45, z, 0.2, rand, ['#4f7a35', '#3e6a2c', '#5c8a3e'], 3);
        if (coltura === 'pomodori') for (let k = 0; k < 4; k++) g.add(sphere(0.04, matColore(k % 3 ? '#c23a22' : '#e0762c', 0.5), cx + dx + (rand() - 0.5) * 0.2, y + 0.3 + rand() * 0.6, z + (rand() - 0.5) * 0.2, 8));
      }
    }
  } else if (coltura === 'insalata') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 9; j++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), verde(j % 2 ? '#8fb65a' : '#6f9c3e'));
      m.scale.set(1, 0.6, 1); m.position.set(cx - 0.36 + i * 0.36, y + 0.06, cz - d / 2 + 0.25 + j * ((d - 0.5) / 8));
      m.castShadow = true; g.add(m);
    }
  } else if (coltura === 'zucchine') {
    for (let i = 0; i < 4; i++) {
      const z = cz - d / 2 + 0.45 + i * ((d - 0.9) / 3);
      cespuglio(g, cx, y + 0.18, z, 0.34, rand, ['#3f6b2f', '#2f5a24', '#4d7a36'], 4);
      g.add(sphere(0.05, matColore('#e7b52c', 0.6), cx + 0.2, y + 0.42, z, 8));
      const zz = cyl(0.045, 0.045, 0.28, verde('#35592a'), cx - 0.25, y + 0.05, z + 0.15, 8);
      zz.rotation.z = Math.PI / 2; g.add(zz);
    }
  } else if (coltura === 'cavoli') {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), verde(j % 2 ? '#6f8f86' : '#5d7f76'));
      m.scale.set(1, 0.75, 1); m.position.set(cx - 0.27 + i * 0.54, y + 0.14, cz - d / 2 + 0.35 + j * ((d - 0.7) / 4));
      m.castShadow = true; g.add(m);
    }
  } else {
    // erbe aromatiche e fragole
    for (let j = 0; j < 7; j++) {
      cespuglio(g, cx + (j % 2 ? 0.25 : -0.25), y + 0.1, cz - d / 2 + 0.3 + j * ((d - 0.6) / 6), 0.16, rand, ['#6f8a5a', '#8a9b6a', '#5b7a4a'], 2);
      g.add(sphere(0.03, matColore('#c8302a', 0.6), cx + (j % 2 ? -0.25 : 0.25), y + 0.05, cz - d / 2 + 0.3 + j * ((d - 0.6) / 6), 6));
    }
    for (let j = 0; j < 7; j++) g.add(sphere(0.04, matColore('#8a6fb0', 0.8), cx + (j % 2 ? 0.3 : -0.1), y + 0.28, cz - d / 2 + 0.4 + j * 0.45, 6));
  }
  ctx.addColliderBox(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, 0, h);
}

// ---- casetta degli attrezzi in legno, tetto a capanna in coppi ----
function casetta(g, ctx, { x0, x1, z0, z1 }) {
  const M = MAT();
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = 2.0;
  g.add(box(w, h, d, M.rovere, cx, h / 2, cz));
  // doghe verticali in rilievo sul fronte sud
  for (let i = 0; i < Math.floor(w / 0.18); i++) g.add(box(0.02, h - 0.1, 0.015, M.noce, x0 + 0.09 + i * 0.18, h / 2, z1 + 0.008));
  g.add(box(0.8, 1.8, 0.04, M.salvia, cx, 0.92, z1 + 0.02));
  g.add(box(0.012, 0.12, 0.03, M.ferro, cx + 0.3, 1.0, z1 + 0.05));
  // tetto a due falde (colmo est-ovest)
  const p = 0.5, a = Math.atan(p), run = d / 2 + 0.25, Ls = run / Math.cos(a);
  for (const s of [1, -1]) {
    const f = box(w + 0.4, 0.06, Ls, [M.cotto, M.cotto, M.coppi, M.rovere, M.cotto, M.cotto], cx, 0, 0);
    f.rotation.x = -s * a;
    f.position.set(cx, h + (run / 2) * p + 0.03, cz - s * run / 2);
    g.add(f);
  }
  // timpani in legno
  for (const x of [x0 + 0.04, x1]) {
    const sh = new THREE.Shape([new THREE.Vector2(z0, h), new THREE.Vector2(z1, h), new THREE.Vector2(cz, h + (d / 2) * p)]);
    const gm = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }));
    gm.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(gm, M.rovere);
    m.position.x = x;
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }
  // botte per l'acqua piovana e attrezzi appoggiati
  g.add(cyl(0.32, 0.28, 0.9, M.noce, x1 + 0.45, 0.45, z1 - 0.4, 16));
  for (const y of [0.15, 0.75]) g.add(cyl(0.335, 0.335, 0.04, M.ferro, x1 + 0.45, y, z1 - 0.4, 16));
  for (const dx of [-0.6, -0.45]) {
    const r = cyl(0.015, 0.015, 1.4, M.noce, cx + dx, 0.7, z1 + 0.08, 6);
    r.rotation.x = -0.12; g.add(r);
  }
  ctx.addColliderBox(x0, x1 + 0.8, z0, z1, 0, h);
}

// ---- panchina in legno e ferro ----
function panchina(g, ctx, x, z, ry = 0) {
  const M = MAT();
  const b = new THREE.Group();
  for (let i = 0; i < 3; i++) b.add(box(1.5, 0.03, 0.09, M.noce, 0, 0.45, -0.12 + i * 0.12));
  for (let i = 0; i < 2; i++) b.add(box(1.5, 0.09, 0.03, M.noce, 0, 0.62 + i * 0.13, -0.22));
  for (const s of [-1, 1]) {
    b.add(box(0.04, 0.45, 0.04, M.ferro, s * 0.68, 0.225, 0.12));
    b.add(box(0.04, 0.85, 0.04, M.ferro, s * 0.68, 0.425, -0.2));
  }
  place(b, x, z, ry);
  ctx.solid(b);
  g.add(b);
}

// ---- aiuola bordata in pietra con cespugli fioriti ----
function aiuola(g, ctx, { x0, x1, z0, z1, seed, fiori = ['#8a6fb0', '#c8962c', '#b0553f', '#e8e0d0'] }) {
  const M = MAT();
  const rand = rnd(seed * 53 + 1);
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  g.add(box(w, 0.08, d, M.terraOrto, cx, 0.04, cz));
  for (const [a, b, c, e] of [[x0, z0, x1, z0 + 0.08], [x0, z1 - 0.08, x1, z1], [x0, z0, x0 + 0.08, z1], [x1 - 0.08, z0, x1, z1]]) {
    g.add(box(c - a, 0.12, e - b, M.pietra, (a + c) / 2, 0.06, (b + e) / 2));
  }
  const lungo = Math.max(w, d), n = Math.max(2, Math.round(lungo / 0.55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = w > d ? x0 + t * w : cx, z = w > d ? cz : z0 + t * d;
    cespuglio(g, x, 0.2, z, 0.2 + rand() * 0.08, rand, VERDI, 3);
    for (let k = 0; k < 3; k++) g.add(sphere(0.04, matColore(fiori[Math.floor(rand() * fiori.length)], 0.8), x + (rand() - 0.5) * 0.35, 0.38 + rand() * 0.15, z + (rand() - 0.5) * 0.35, 6));
  }
}

export function giardino(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const L = LOTTO;
  // ---- prato attorno alla casa (il piano terra ha pavimento a quota 0,005: il prato non entra) ----
  for (const [x0, z0, x1, z1] of [
    [L.x0, L.z0, L.x1, -11.78],       // dietro, oltre la casa dei suoceri
    [L.x0, -11.78, 0.70, 0],          // accanto alla casa dei suoceri, a ovest
    [8.84, -11.78, L.x1, -7.94],      // e a est, sul tratto stretto
    [9.24, -7.94, L.x1, 0],           // e sul tratto largo
    [L.x0, 0, 0, L.z1],               // lato ovest
    [10.51, 0, L.x1, L.z1],           // lato est
    [0, 10.97, 10.51, L.z1],          // davanti
  ]) g.add(plane(x1 - x0, z1 - z0, M.prato, (x0 + x1) / 2, 0.005, (z0 + z1) / 2, 'y+'));
  // ---- pavimentazioni: loggia, vialetti, patio (lastre) e sentieri in ghiaia ----
  const pav = (x0, z0, x1, z1, mat) => g.add(box(x1 - x0, 0.015, z1 - z0, mat, (x0 + x1) / 2, 0.0075, (z0 + z1) / 2, { cast: false }));
  pav(0.03, 9.65, 5.84, 10.97, M.lastre);            // sotto la loggia, davanti al portoncino del piano terra
  pav(CANCELLO.x0, 10.97, CANCELLO.x1, L.z1, M.lastre); // vialetto dal cancelletto
  pav(-0.25, 13.9, CANCELLO.x0, 15.0, M.lastre);     // ramo verso la scala e il posto auto ovest
  pav(6.3, 10.97, 10.2, 13.0, M.lastre);             // patio davanti alla portafinestra del soggiorno
  pav(10.2, 11.5, 12.9, POSTO_Z[0], M.ghiaia);       // raccordo verso il lato est e il posto auto
  pav(-2.4, -14.8, -1.4, POSTO_Z[0], M.ghiaia);      // sentiero lato ovest, fino al posto auto
  pav(11.9, -14.8, 12.9, 11.5, M.ghiaia);            // sentiero lato est
  pav(-2.8, -22.9, 13.3, -14.8, M.ghiaia);           // orto
  pav(-1.4, -9.95, 0.70, -8.85, M.lastre);           // ingresso dei suoceri
  pav(-1.4, -1.95, 0.70, -0.7, M.lastre);            // porta di servizio della lavanderia
  pav(9.24, -6.5, 11.9, -4.5, M.lastre);             // patio della camera dei suoceri
  // ---- recinzione ----
  // fronte: cancello carrabile, recinzione su cui scorre l'anta, cancelletto pedonale, e di nuovo
  const [ovest, est] = CARRABILI;
  cancellata(g, ctx, { x0: ovest.x1 + 0.4, x1: CANCELLO.x0 - 0.4, z: L.z1 });
  cancellata(g, ctx, { x0: CANCELLO.x1 + 0.4, x1: est.x0 - 0.4, z: L.z1 });
  ingressoCancello(g, ctx, { x0: CANCELLO.x0, x1: CANCELLO.x1, z: L.z1 });
  for (const c of CARRABILI) {
    cancelloScorrevole(g, ctx, { ...c, z: L.z1 });
    // posto auto in lastre 2,90 x 5,10, contro la recinzione laterale, con cordolo in pietra
    const [px0, px1] = c.posto, [pz0, pz1] = POSTO_Z;
    pav(px0, pz0, px1, pz1, M.lastre);
    const xc = c.verso > 0 ? px1 : px0; // lato verso la casa
    g.add(box(0.12, 0.1, pz1 - pz0, M.pietra, xc + c.verso * 0.06, 0.05, (pz0 + pz1) / 2));
    automobile(g, ctx, { x: (px0 + px1) / 2, z: (pz0 + pz1) / 2 - 0.1, colore: c.auto });
  }
  staccionata(g, ctx, { x0: L.x0, z0: L.z0, x1: L.x0, z1: L.z1 - 0.15 });
  staccionata(g, ctx, { x0: L.x1, z0: L.z0, x1: L.x1, z1: L.z1 - 0.15 });
  staccionata(g, ctx, { x0: L.x0, z0: L.z0, x1: L.x1, z1: L.z0 });
  // ---- davanti: aiuole lungo il muretto, due alberi, tavolino sul patio ----
  // le aiuole lungo il muretto lasciano libera la corsa delle ante (a 28 cm dalla recinzione)
  aiuola(g, ctx, { x0: 0.8, x1: 4.0, z0: 16.5, z1: 17.05, seed: 1 });
  aiuola(g, ctx, { x0: 6.3, x1: 9.7, z0: 16.5, z1: 17.05, seed: 2 });
  aiuola(g, ctx, { x0: 5.9, x1: 6.2, z0: 13.0, z1: 16.3, seed: 3, fiori: ['#8a6fb0', '#9b82c0'] }); // lavanda lungo il vialetto
  g.add(albero(ctx, { x: 2.2, z: 16.0, h: 3.0, r: 1.0, seed: 4, colori: ['#7d8f6a', '#8a9b78', '#6b7d5a'] })); // olivo
  g.add(albero(ctx, { x: 9.0, z: 15.4, h: 3.6, r: 1.25, seed: 5 }));
  g.add(cyl(0.35, 0.35, 0.03, M.ferro, 8.2, 0.74, 12.0, 20));
  g.add(cyl(0.03, 0.05, 0.72, M.ferro, 8.2, 0.37, 12.0, 8));
  ctx.addColliderBox(7.85, 8.55, 11.65, 12.35, 0, 0.75);
  g.add(sediaTerrazzo(ctx, 7.55, 12.0, Math.PI / 2));
  g.add(sediaTerrazzo(ctx, 8.85, 12.0, -Math.PI / 2));
  // ---- lati: cipressi lungo la staccionata ovest, alberi da frutto e siepe a est ----
  for (const z of [-6, 0, 6]) g.add(albero(ctx, { x: -2.95, z, h: 4.2, seed: 6, cipresso: true }));
  g.add(albero(ctx, { x: 13.2, z: 4.0, h: 3.2, r: 1.0, seed: 7, frutti: '#e0a02c' }));   // arancio
  g.add(albero(ctx, { x: 13.2, z: -4.5, h: 3.4, r: 1.1, seed: 8, frutti: '#c8342a' }));  // melo
  aiuola(g, ctx, { x0: 10.7, x1: 11.4, z0: 0.4, z1: 10.5, seed: 9 });
  // ---- patio dei suoceri a est: tavolino e due sedie ----
  g.add(cyl(0.32, 0.32, 0.03, M.ferro, 10.6, 0.74, -5.5, 20));
  g.add(cyl(0.03, 0.05, 0.72, M.ferro, 10.6, 0.37, -5.5, 8));
  ctx.addColliderBox(10.28, 10.92, -5.82, -5.18, 0, 0.75);
  g.add(sediaTerrazzo(ctx, 10.6, -6.1, 0));
  g.add(sediaTerrazzo(ctx, 10.6, -4.9, Math.PI));
  // ---- dietro: prato fra la casa dei suoceri e l'orto, poi l'orto ----
  g.add(albero(ctx, { x: -0.8, z: -5.0, h: 3.3, r: 1.0, seed: 10, frutti: '#e8d23a' }));  // limone
  g.add(albero(ctx, { x: 10.8, z: -9.2, h: 3.6, r: 1.2, seed: 11, frutti: '#7a2a4a' }));  // fico
  panchina(g, ctx, 5.0, -13.4, Math.PI);
  // sei cassoni rialzati 1,20 x 3,40 con passaggi da 1,20
  const colture = ['pomodori', 'insalata', 'zucchine', 'cavoli', 'fagiolini', 'erbe'];
  colture.forEach((c, i) => cassone(g, ctx, { cx: -1.6 + i * 2.4, cz: -20.2, coltura: c, seed: i + 1 }));
  casetta(g, ctx, { x0: 11.3, x1: 13.1, z0: -22.8, z1: -21.1 });
  return g;
}
