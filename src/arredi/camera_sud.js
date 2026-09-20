// Camera sud-est (seconda matrimoniale). Dettaglio: carta da parati botanica sulla parete della testiera.
import * as THREE from 'three';
import { box, cyl, plane, place, tappeto, quadro, pendente, applique, lampadaTavolo, tende, pianta, libri, MAT } from './comune.js';
import { lettoMatrimoniale, comodino, armadio } from './camera_nord.js';
import { sedia } from './cucina.js';

// ---- scrittoio in noce con cassetto ----
export function scrittoio(ctx, x, z, ry = 0, w = 1.1) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, 0.04, 0.55, M.noce, 0, 0.75, 0));
  g.add(box(w - 0.1, 0.1, 0.5, M.noce, 0, 0.68, 0));
  g.add(box(0.4, 0.07, 0.02, M.noceScuro, 0, 0.68, 0.26));
  g.add(cyl(0.01, 0.01, 0.02, M.ottone, 0, 0.68, 0.28, 8).rotateX(Math.PI / 2));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.028, 0.63, M.noce, sx * (w / 2 - 0.08), 0.315, sz * 0.22, 10));
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
  // carta da parati botanica sulla parete nord (testiera)
  ctx.pareti.add(plane(R.w, ctx.H, M.cartaBotanica, R.cx, ctx.H / 2, R.z + 0.02, 'z+'));
  // letto con testiera in noce e velluto salvia
  const bedX = 8.2;
  g.add(lettoMatrimoniale(ctx, { x: bedX, z: R.z + 1.0 + 0.06, ry: 0, testieraW: 2.0, testieraH: 1.1, matTestiera: M.vellutoSalvia }));
  g.add(comodino(ctx, bedX - 1.15, R.z + 0.22));
  g.add(comodino(ctx, bedX + 1.15, R.z + 0.22));
  g.add(lampadaTavolo(ctx, bedX - 1.15, 0.615, R.z + 0.22, { colore: 'bianco', intensita: 4, h: 0.42 }));
  g.add(lampadaTavolo(ctx, bedX + 1.15, 0.615, R.z + 0.22, { colore: 'bianco', intensita: 4, h: 0.42 }));
  g.add(tappeto(2.4, 2.0, M.lino, bedX, R.z + 2.2, M.linoTortora));
  // armadio in noce sulla parete est (parte sud)
  g.add(armadio(ctx, { w: 2.3, x: R.x + R.w - 0.3, z: R.z + R.d - 1.4, ry: -Math.PI / 2, ante: 4, mat: M.noce }));
  // scrittoio con sedia sulla parete ovest, a sud della porta
  g.add(scrittoio(ctx, R.x + 0.28, R.z + R.d - 0.75, Math.PI / 2));
  g.add(sedia(ctx, R.x + 0.9, R.z + R.d - 0.75, -Math.PI / 2));
  g.add(lampadaTavolo(ctx, R.x + 0.3, 0.77, R.z + R.d - 0.4, { colore: 'salvia', intensita: 4, h: 0.45 }));
  ctx.pareti.add(quadro(0.45, 0.6, M.maiolica, R.x + 0.03, 1.7, R.z + R.d - 0.75, 'x+'));
  // tende alla portafinestra, pianta, lampadario, applique
  ctx.pareti.add(tende(1.42, 2.2, 8.17, 1.15, R.z + R.d - 0.03, 'z-', M.linoTortora));
  g.add(pianta(R.x + R.w - 0.4, R.z + 0.45, { h: 1.2, vaso: 0.2 }));
  ctx.pareti.add(applique(ctx, bedX - 1.15, 1.6, R.z + 0.02, 'z+', { intensita: 4 }));
  ctx.pareti.add(applique(ctx, bedX + 1.15, 1.6, R.z + 0.02, 'z+', { intensita: 4 }));
  g.add(pendente(ctx, R.cx, R.cz + 0.3, { yTop: ctx.H, calata: 0.5, raggio: 0.22, intensita: 14, paralume: 'salvia' }));
  return g;
}
