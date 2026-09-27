// Piano terra (suoceri): arredi. Misure in metri nel riferimento dell'edificio dei suoceri
// (origine nell'angolo nord-ovest esterno, x verso est, z verso sud, pavimento a quota 0):
// tutto sta in un gruppo spostato in ORIGINE_SUOCERI. Posizioni da piano-suoceri.json.
// Dettagli di carattere, uno per stanza:
//   soggiorno   parete nord in terracotta dietro al divano
//   cucina      ad L con ante crema e paraspruzzi in piastrelle smaltate ocra
//   bagno       rivestimento a meta' parete in piastrelle crema, cementine a terra
//   camera 13,22  parete del letto in blu polvere
//   camera 12,47  testiera in velluto salvia
//   bagno 5,31 (della cognata)  piastrelle verde bottiglia come il suo bagno
import * as THREE from 'three';
import { box, cyl, plane, pendente, applique, lampadaTavolo, lampadaTerra, tappeto, quadro, pianta, tende, manigliaOttone, MAT } from './comune.js';
import { baseCucina, cappaMuratura, mensole, colonne, tavolo, sedia } from './cucina.js';
import { divano, poltrona, mobileTv, tvOled } from './soggiorno.js';
import { lettoMatrimoniale, comodino, armadio } from './camera_nord.js';
import { colonnaLavatrice } from './camera_est.js';
import { lavaboCatino, specchio, wc, bidet, scaldasalviette } from './bagno.js';
import { appendiabiti } from './disimpegno.js';
import { inCornice, fascia, docciaAngolo } from './piano_terra.js';

// ---- lavatoio in pietra su gambe in ferro, rubinetto in ottone a muro (contro il muro a -z) ----
function lavatoio(ctx, x, z) {
  const M = MAT();
  const g = new THREE.Group();
  const w = 0.8, d = 0.55, h = 0.86;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.035, h - 0.2, 0.035, M.ferro, sx * (w / 2 - 0.05), (h - 0.2) / 2, sz * (d / 2 - 0.05)));
  g.add(box(w - 0.1, 0.03, d - 0.1, M.noce, 0, 0.2, 0));
  g.add(box(w, 0.2, d, M.pietra, 0, h - 0.1, 0));
  g.add(box(w - 0.1, 0.16, d - 0.1, M.pietraScura, 0, h - 0.07, 0));
  g.add(box(0.03, 0.03, 0.2, M.ottoneScuro, 0, h + 0.25, -d / 2 + 0.07)); // dal muro (a -d/2 - 0,025)
  g.add(cyl(0.012, 0.012, 0.08, M.ottoneScuro, 0, h + 0.2, -d / 2 + 0.16, 8));
  g.add(box(0.4, 0.05, 0.3, M.linoTortora, -0.1, 0.24, 0)); // cesto dei panni
  g.position.set(x, 0, z);
  ctx.solid(g);
  return g;
}

// ---- caldaia murale bianca con tubi in rame (contro il muro a -z) ----
function caldaia(x, y, z) {
  const M = MAT();
  const g = new THREE.Group();
  const bianco = new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: 0.4 });
  g.add(box(0.44, 0.72, 0.3, bianco, 0, 0, 0.15));
  g.add(box(0.2, 0.05, 0.005, M.nero, 0, -0.22, 0.303));
  for (const dx of [-0.14, -0.05, 0.05, 0.14]) g.add(cyl(0.012, 0.012, y - 0.36, M.rame, dx, -(y - 0.36) / 2 - 0.36, 0.08, 8));
  g.position.set(x, y, z);
  return g;
}

function soggiornoCucina(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H;
  const zN = 0.45, xW = 0.45, xE = 7.69;
  // parete nord in terracotta attorno alla prima finestra (x 1,55-3,05, davanzale 0,90, h 1,50)
  for (const [a, b, y0, y1] of [[xW, 1.55, 0.08, H], [3.05, 4.3, 0.08, H], [1.55, 3.05, 0.08, 0.9], [1.55, 3.05, 2.4, H]]) {
    fascia(ctx.pareti, M.terracottaPittura, { asse: 'x', a, b, at: zN, y0, y1, verso: 1, listello: false });
  }
  // divano sotto la finestra, mobile TV contro il muro del bagno
  g.add(divano(ctx, 2.3, zN + 0.5, 0, 2.2));
  g.add(tappeto(2.4, 1.6, M.lino, 2.2, 2.25, M.linoTortora));
  g.add(mobileTv(ctx, { x: 1.95, z: 3.94 - 0.24, w: 2.8, d: 0.46, h: 0.46, ry: Math.PI }));
  g.add(tvOled(ctx, { x: 1.95, y: 0.495, z: 3.94 - 0.21, ry: Math.PI }));
  g.add(lampadaTerra(ctx, 3.75, 0.8));
  g.add(pianta(0.8, 0.8, { h: 1.2, vaso: 0.2 }));
  ctx.pareti.add(appendiabiti(ctx, xW + 0.005, 1.75, 1.45, 'x+', 0.6));
  g.add(pendente(ctx, 2.2, 2.2, { yTop: H, calata: 0.8, raggio: 0.24, paralume: 'ottone' }));
  // tavolo per sei, lato lungo nord-sud, tre sedie per lato
  const tx = 5.5, tz = 2.0, L = 1.8, W = 0.9;
  g.add(tavolo(ctx, { cx: tx, cz: tz, L, W, ry: 0 }));
  for (const dz of [-0.6, 0, 0.6]) {
    g.add(sedia(ctx, tx - W / 2 - 0.25, tz + dz, Math.PI / 2));
    g.add(sedia(ctx, tx + W / 2 + 0.25, tz + dz, -Math.PI / 2));
  }
  for (const dz of [-0.4, 0.4]) g.add(pendente(ctx, tx, tz + dz, { yTop: H, calata: 1.05, raggio: 0.19, paralume: 'salvia' }));
  for (const x of [2.3, 6.1]) ctx.pareti.add(tende(1.5, 1.55, x, 1.65, zN + 0.03, 'z+'));
  // cucina ad L con ante crema: lavello sotto la finestra est, piano cottura verso la camera.
  // I mobili del piano primo corrono lungo Z contro un muro a -x: si costruiscono in cornici ruotate.
  const est = new THREE.Group();
  est.position.set(xE, 0, 3.59);
  est.rotation.y = Math.PI;                      // x locale -> ovest, z locale -> nord
  g.add(est);
  inCornice(ctx, est, (c) => {
    c.add(baseCucina(ctx, { x0: 0, z0: 0, z1: 1.23, sinkZ: 3.59 - 2.71, mat: M.crema }));
  });
  const sud = new THREE.Group();
  sud.position.set(4.45, 0, 4.19);
  sud.rotation.y = Math.PI / 2;                  // x locale -> nord, z locale -> est
  g.add(sud);
  const hob = 1.65;                              // piano cottura a x 6,10
  inCornice(ctx, sud, (c) => {
    c.add(baseCucina(ctx, { x0: 0, z0: 0, z1: 3.24, hobZ: hob, mat: M.crema }));
    c.add(cappaMuratura(ctx, { x: 0, z: hob }));
    c.add(mensole(ctx, { x: 0, z0: 0.15, z1: 1.05 }));
  });
  g.add(colonne(ctx, { x1: xE, z0: 1.55, z1: 2.35, mat: M.crema }));
  // paraspruzzi in piastrelle ocra con listello in pietra (il muro est ha la finestra sul lavello)
  const zS = 4.19;
  g.add(plane(3.24, 0.72, M.piastrelleOcra, 4.45 + 1.62, 0.9 + 0.36, zS - 0.015, 'z-'));
  g.add(box(3.24, 0.04, 0.05, M.pietra, 4.45 + 1.62, 1.64, zS - 0.025));
  g.add(plane(3.59 - 3.01, 0.72, M.piastrelleOcra, xE - 0.015, 0.9 + 0.36, (3.01 + 3.59) / 2, 'x-'));
  g.add(box(0.05, 0.04, 3.59 - 3.01, M.pietra, xE - 0.025, 1.64, (3.01 + 3.59) / 2));
  return g;
}

function bagno(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const x0 = 0.45, x1 = 3.25, z0 = 4.04, z1 = 5.84;
  // rivestimento a 1,20 m in piastrelle crema, a tutta altezza nella doccia (angolo nord-est)
  const p = ctx.pareti, T = M.piastrelleCrema;
  fascia(p, T, { asse: 'x', a: x0, b: 2.45, at: z0, verso: 1 });
  fascia(p, T, { asse: 'x', a: 2.45, b: x1, at: z0, verso: 1, y1: 2.1 });
  fascia(p, T, { asse: 'x', a: x0, b: x1, at: z1, verso: -1 });
  fascia(p, T, { asse: 'z', a: z0, b: 4.84, at: x1, verso: -1, y1: 2.1 });
  fascia(p, T, { asse: 'z', a: 4.84, b: 4.9, at: x1, verso: -1 });
  fascia(p, T, { asse: 'z', a: 5.68, b: z1, at: x1, verso: -1 });
  fascia(p, T, { asse: 'z', a: z0, b: 4.98, at: x0, verso: 1 });
  fascia(p, T, { asse: 'z', a: 4.98, b: 5.58, at: x0, verso: 1, y1: 0.88, listello: false });
  fascia(p, T, { asse: 'z', a: 5.58, b: z1, at: x0, verso: 1 });
  // wc e bidet sulla parete ovest, lavabo a nord, doccia nell'angolo nord-est
  g.add(wc(ctx, x0 + 0.28, 4.45, Math.PI / 2));
  g.add(bidet(ctx, x0 + 0.22, 5.3, Math.PI / 2));
  g.add(lavaboCatino(ctx, { x: 1.96, z: z0 + 0.275 }));
  p.add(specchio(ctx, 0.6, 0.8, 1.96, 1.75, z0 + 0.02, 'z+'));
  p.add(applique(ctx, 1.46, 2.0, z0 + 0.02, 'z+', { intensita: 4 }));
  g.add(docciaAngolo(ctx, { x0: 2.45, x1, z0, z1: 4.84 }));
  p.add(scaldasalviette(ctx, 2.2, 1.2, z1 - 0.02, 'z-'));
  g.add(pendente(ctx, 1.85, 4.95, { yTop: ctx.H, calata: 0.5, raggio: 0.14, intensita: 10 }));
  return g;
}

function disimpegno(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(tappeto(0.7, 1.4, M.linoTortora, 3.85, 4.94, M.noceScuro));
  g.add(pendente(ctx, 3.85, 4.94, { yTop: ctx.H, calata: 0.5, raggio: 0.14, intensita: 10, paralume: 'ottone' }));
  return g;
}

function camera1(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H, zS = 9.33;
  // parete del letto in blu polvere
  fascia(ctx.pareti, M.bluPolvere, { asse: 'x', a: 0.45, b: 3.45, at: zS, y0: 0.08, y1: H, verso: -1, listello: false });
  // armadio a tre moduli sulla parete nord, letto con testata a sud
  g.add(armadio(ctx, { w: 2.73, h: 2.4, d: 0.6, x: 1.945, z: 5.94 + 0.3, ry: 0, ante: 6, mat: M.tortora }));
  g.add(lettoMatrimoniale(ctx, { x: 2.1, z: zS - 1.105, ry: Math.PI, testieraW: 2.0, testieraH: 1.2, matTestiera: M.linoTortora }));
  for (const x of [0.95, 3.25]) {
    g.add(comodino(ctx, x, zS - 0.22, Math.PI));
    g.add(lampadaTavolo(ctx, x, 0.62, zS - 0.22, { colore: 'salvia', intensita: 4 }));
  }
  ctx.pareti.add(quadro(0.8, 0.55, M.cartaBotanica, 2.1, 1.85, zS - 0.035, 'z-'));
  g.add(tappeto(2.2, 1.3, M.lino, 2.1, 7.3, M.linoTortora));
  ctx.pareti.add(tende(1.2, 1.55, 0.45 + 0.03, 1.65, 8.55, 'x+'));
  g.add(pendente(ctx, 2.3, 7.6, { yTop: H, calata: 0.75, raggio: 0.2 }));
  return g;
}

function camera2(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H, zN = 4.29, xE = 8.09;
  // letto con testata a nord, testiera in velluto salvia; a ovest il passaggio dalla porta
  g.add(lettoMatrimoniale(ctx, { x: 6.1, z: zN + 1.1, ry: 0, testieraW: 1.8, testieraH: 1.25, matTestiera: M.vellutoSalvia }));
  for (const x of [4.95, 7.25]) {
    g.add(comodino(ctx, x, zN + 0.22, 0));
    g.add(lampadaTavolo(ctx, x, 0.62, zN + 0.22, { colore: 'salvia', intensita: 4 }));
  }
  g.add(poltrona(ctx, 7.55, 7.3, -Math.PI * 3 / 4, M.velluto));
  g.add(tappeto(2.2, 1.4, M.linoTortora, 6.1, 6.3, M.noceScuro));
  ctx.pareti.add(tende(1.8, 2.45, xE - 0.03, 1.27, 6.29, 'x-'));
  g.add(pendente(ctx, 6.1, 5.7, { yTop: H, calata: 0.75, raggio: 0.2, paralume: 'ottone' }));
  return g;
}

function cabina(ctx) {
  const g = new THREE.Group();
  g.add(armadio(ctx, { w: 3.3, h: 2.4, d: 0.6, x: 6.4, z: 9.33 - 0.3, ry: Math.PI, ante: 6, mat: MAT().crema }));
  g.add(pendente(ctx, 6.3, 8.35, { yTop: ctx.H, calata: 0.4, raggio: 0.14, intensita: 8, paralume: 'ottone' }));
  return g;
}

function lavanderia(ctx) {
  const g = new THREE.Group();
  const zN = 9.43;
  g.add(colonnaLavatrice(ctx, { x: 5.34 - 0.32, z: 9.95, ry: -Math.PI / 2 }));
  g.add(lavatoio(ctx, 2.35, zN + 0.3));
  g.add(caldaia(1.2, 1.65, zN));
  g.add(pendente(ctx, 2.8, 10.45, { yTop: ctx.H, calata: 0.4, raggio: 0.14, intensita: 10 }));
  return g;
}

function bagnoCognata(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const x0 = 5.44, x1 = 8.09, z0 = 9.43, z1 = 11.43;
  // rivestimento a 1,20 m in piastrelle verde bottiglia, come il bagno della cognata
  const p = ctx.pareti, V = M.piastrelleVerdi;
  fascia(p, V, { asse: 'x', a: x0, b: x1, at: z0, verso: 1 });
  fascia(p, V, { asse: 'x', a: x0, b: 5.65, at: z1, verso: -1 });
  fascia(p, V, { asse: 'x', a: 6.45, b: 7.29, at: z1, verso: -1 });
  fascia(p, V, { asse: 'x', a: 7.29, b: x1, at: z1, verso: -1, y1: 2.1 });
  fascia(p, V, { asse: 'z', a: z0, b: 10.05, at: x1, verso: -1 });
  fascia(p, V, { asse: 'z', a: 10.05, b: 10.65, at: x1, verso: -1, y1: 0.88, listello: false });
  fascia(p, V, { asse: 'z', a: 10.65, b: 10.71, at: x1, verso: -1 });
  fascia(p, V, { asse: 'z', a: 10.71, b: z1, at: x1, verso: -1, y1: 2.1 });
  fascia(p, V, { asse: 'z', a: z0, b: z1, at: x0, verso: 1 });
  // lavabo, bidet e wc a nord, doccia nell'angolo sud-est
  g.add(lavaboCatino(ctx, { x: 6.04, z: z0 + 0.275 }));
  p.add(specchio(ctx, 0.6, 0.8, 6.04, 1.75, z0 + 0.02, 'z+'));
  g.add(bidet(ctx, 6.9, z0 + 0.22, 0));
  g.add(wc(ctx, 7.53, z0 + 0.28, 0));
  g.add(docciaAngolo(ctx, { x0: 7.29, x1, z0: 10.71, z1 }));
  p.add(scaldasalviette(ctx, x0 + 0.02, 1.2, 10.55, 'x+'));
  g.add(pendente(ctx, 6.7, 10.4, { yTop: ctx.H, calata: 0.5, raggio: 0.14, intensita: 10 }));
  return g;
}

// radice: gruppo gia' spostato nell'origine dei suoceri; pareti: gruppo per gli elementi a muro
export function arredaSuoceri(ctx, radice, pareti) {
  const primaC = ctx.cornice, primaP = ctx.pareti;
  ctx.cornice = radice;
  ctx.pareti = pareti;
  for (const f of [soggiornoCucina, bagno, disimpegno, camera1, camera2, cabina, lavanderia, bagnoCognata]) radice.add(f(ctx));
  ctx.cornice = primaC;
  ctx.pareti = primaP;
  return radice;
}
