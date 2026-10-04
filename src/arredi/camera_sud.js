// Camera sud-est (seconda matrimoniale), stile country chiaro con il tocco d'azzurro polvere:
// carta a righe azzurre dietro al letto, testiera in lino azzurro, cuscini a fiorellini,
// scrittoio in rovere con sedia Windsor, armadio bianco latte.
import * as THREE from 'three';
import { box, cyl, plane, place, tappeto, tappetoPersiano, quadro, stampaBotanica, pendente, lampadarioTamburo, applique, lampadaTavolo, tende, tendaBambu, pianta, libri, MAT } from './comune.js';
import { lettoMatrimoniale, comodino, armadio } from './camera_nord.js';
import { sediaWindsor } from './cucina.js';

// ---- scrittoio in noce con cassetto ----
export function scrittoio(ctx, x, z, ry = 0, w = 1.1, legno) {
  const M = MAT();
  const Lg = legno || M.noce;
  const g = new THREE.Group();
  g.add(box(w, 0.04, 0.55, Lg, 0, 0.75, 0));
  g.add(box(w - 0.1, 0.1, 0.5, Lg, 0, 0.68, 0));
  g.add(box(0.4, 0.07, 0.02, M.noceScuro, 0, 0.68, 0.26));
  g.add(cyl(0.01, 0.01, 0.02, M.ottone, 0, 0.68, 0.28, 8).rotateX(Math.PI / 2));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.028, 0.63, Lg, sx * (w / 2 - 0.08), 0.315, sz * 0.22, 10));
  g.add(box(0.3, 0.005, 0.4, M.carta, -0.15, 0.775, 0));
  g.add(cyl(0.035, 0.03, 0.09, M.ceramicaSalvia, 0.35, 0.82, -0.12, 12));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaCameraSud(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_sud.rects[0]; // x 6.14-10.26, z 6.65-10.77; porta ovest z 8.43-9.24; portafinestra sud x 7.46-8.88
  // carta da parati a righe azzurre sulla parete nord (testiera)
  ctx.pareti.add(plane(R.w, ctx.H, M.cartaRigheAzzurre, R.cx, ctx.H / 2, R.z + 0.02, 'z+'));
  // letto in rovere con testiera in lino azzurro, coperta panna, cuscini a fiorellini
  const bedX = 8.2;
  g.add(lettoMatrimoniale(ctx, { x: bedX, z: R.z + 1.0 + 0.06, ry: 0, testieraW: 1.9, testieraH: 1.1, matTestiera: M.linoAzzurro,
    legno: M.rovereMiele, coperta: M.linoAvena, runner: M.righeAzzurre, cuscini: M.floreale }));
  for (const s of [-1, 1]) {
    g.add(comodino(ctx, bedX + s * 1.15, R.z + 0.22, 0, M.rovereMiele));
    g.add(lampadaTavolo(ctx, bedX + s * 1.15, 0.615, R.z + 0.22, { colore: 'bianca', intensita: 4, h: 0.42 }));
  }
  g.add(tappetoPersiano(2.4, 1.7, bedX, R.z + 2.3, { campo: '#e9e0cc', blu: '#7f98b4', bluScuro: '#5c7491', ruggine: '#c08a6a', seed: 85 }));
  // armadio bianco latte sulla parete est (parte sud)
  g.add(armadio(ctx, { w: 2.3, x: R.x + R.w - 0.3, z: R.z + R.d - 1.4, ry: -Math.PI / 2, ante: 4, mat: M.biancoLatte, cimasa: M.rovereMiele }));
  // scrittoio in rovere con sedia Windsor sulla parete ovest, a sud della porta
  g.add(scrittoio(ctx, R.x + 0.28, R.z + R.d - 0.75, Math.PI / 2, 1.1, M.rovereMiele));
  g.add(sediaWindsor(ctx, R.x + 0.85, R.z + R.d - 0.75, -Math.PI / 2));
  g.add(lampadaTavolo(ctx, R.x + 0.3, 0.77, R.z + R.d - 0.4, { colore: 'bianca', intensita: 4, h: 0.45 }));
  ctx.pareti.add(stampaBotanica(0.42, 0.55, R.x + 0.03, 1.7, R.z + R.d - 0.75, 'x+', 103, M.rovereMiele));
  // tende a righe azzurre e a pacchetto in bambu' alla portafinestra, pianta, lampadario
  ctx.pareti.add(tende(1.42, 2.2, 8.17, 1.15, R.z + R.d - 0.03, 'z-', M.righeAzzurre));
  ctx.pareti.add(tendaBambu(1.42, 8.17, 2.42, R.z + R.d - 0.04, 'z-'));
  g.add(pianta(R.x + R.w - 0.4, R.z + 0.45, { h: 1.2, vaso: 0.2, matVaso: M.ceramica }));
  ctx.pareti.add(applique(ctx, bedX - 1.15, 1.6, R.z + 0.02, 'z+', { intensita: 4 }));
  ctx.pareti.add(applique(ctx, bedX + 1.15, 1.6, R.z + 0.02, 'z+', { intensita: 4 }));
  g.add(lampadarioTamburo(ctx, R.cx, R.cz + 0.3, { yTop: ctx.H, calata: 0.55, raggio: 0.26, intensita: 14 }));
  return g;
}
