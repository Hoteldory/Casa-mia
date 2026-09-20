// Disimpegno: snodo tra bagno e camere. Dettaglio: soffitto in verde salvia (in architettura.js),
// appendiabiti in noce con ganci in ottone, panchetta, specchio.
import * as THREE from 'three';
import { box, cyl, plane, place, applique, quadro, MAT } from './comune.js';
import { specchio } from './bagno.js';

export function appendiabiti(ctx, x, y, z, normal = 'x+', w = 0.9) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, 0.12, 0.025, M.noce, 0, 0, 0.012));
  for (let i = 0; i < 4; i++) {
    const hx = -w / 2 + 0.12 + i * ((w - 0.24) / 3);
    g.add(cyl(0.008, 0.008, 0.07, M.ottone, hx, -0.01, 0.05, 8).rotateX(Math.PI / 2));
    g.add(cyl(0.012, 0.012, 0.02, M.ottone, hx, 0.02, 0.085, 8));
  }
  // cappotto e cappello appesi
  g.add(box(0.32, 0.85, 0.1, M.vellutoSalvia, -w / 2 + 0.12, -0.5, 0.1));
  g.add(cyl(0.14, 0.14, 0.02, M.lino, w / 2 - 0.12, 0.0, 0.1, 20).rotateX(Math.PI / 2));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

export function panchetta(ctx, x, z, ry = 0, w = 0.9) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, 0.04, 0.32, M.noce, 0, 0.44, 0));
  g.add(box(w - 0.1, 0.05, 0.28, M.lino, 0, 0.485, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.025, 0.42, 0.025, M.ferro, sx * (w / 2 - 0.05), 0.21, sz * 0.12));
  g.add(box(0.25, 0.25, 0.25, M.lino, w / 2 - 0.2, 0.14, 0)); // cesto
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaDisimpegno(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.disimpegno.rects[0]; // x 4.67-5.99, z 3.00-5.24
  // parete ovest libera (z 3.0-4.36): appendiabiti e panchetta
  ctx.pareti.add(appendiabiti(ctx, R.x + 0.02, 1.75, R.z + 0.7, 'x+', 0.9));
  g.add(panchetta(ctx, R.x + 0.2, R.z + 0.7, Math.PI / 2, 0.9));
  // parete sud: specchio e applique
  ctx.pareti.add(specchio(ctx, 0.5, 0.9, R.cx, 1.6, R.z + R.d - 0.02, 'z-'));
  ctx.pareti.add(applique(ctx, R.x + R.w - 0.3, 2.0, R.z + R.d - 0.02, 'z-', { intensita: 5 }));
  ctx.pareti.add(applique(ctx, R.x + 0.3, 2.0, R.z + R.d - 0.02, 'z-', { intensita: 5 }));
  // passatoia
  g.add(box(0.7, 0.01, R.d - 0.5, M.linoTortora, R.cx, 0.005, R.cz, { cast: false }));
  g.add(box(0.6, 0.012, R.d - 0.6, M.velluto, R.cx, 0.006, R.cz, { cast: false }));
  return g;
}
