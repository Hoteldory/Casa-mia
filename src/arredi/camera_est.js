// Camera est (piccola): studio con letto singolo e zona lavanderia.
// Dettaglio: parete nord in terracotta bruciata con lavanderia in noce e libreria in ferro e noce.
import * as THREE from 'three';
import { box, cyl, plane, place, cuscino, tappeto, quadro, pendente, applique, lampadaTavolo, tende, pianta, libri, antaTelaio, manigliaOttone, MAT } from './comune.js';
import { scrittoio } from './camera_sud.js';
import { sedia } from './cucina.js';

// ---- colonna lavatrice + asciugatrice in mobile noce ----
export function colonnaLavanderia(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  const w = 0.72, d = 0.66, h = 2.0;
  g.add(box(w, h, d, M.noce, 0, h / 2, 0));
  for (const y of [0.5, 1.4]) {
    // oblò in vetro con cornice in ferro
    g.add(box(w - 0.06, 0.82, 0.02, M.tortora, 0, y, d / 2 + 0.005));
    g.add(cyl(0.2, 0.2, 0.03, M.ferro, 0, y, d / 2 + 0.02, 24).rotateX(Math.PI / 2));
    g.add(cyl(0.16, 0.16, 0.035, M.nero, 0, y, d / 2 + 0.025, 24).rotateX(Math.PI / 2));
    g.add(cyl(0.02, 0.02, 0.02, M.ottone, 0.25, y + 0.32, d / 2 + 0.02, 10).rotateX(Math.PI / 2));
  }
  g.add(box(w + 0.04, 0.05, d + 0.03, M.noceScuro, 0, h + 0.025, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- banco lavanderia: piano in pietra, lavatoio in ceramica, ante, mensole con ceste ----
export function bancoLavanderia(ctx, { x0, x1, z, d = 0.6 }) {
  const M = MAT();
  const g = new THREE.Group();
  const w = x1 - x0, cx = (x0 + x1) / 2, cz = z + d / 2, h = 0.9;
  g.add(box(w, h - 0.14, d, M.noce, cx, 0.1 + (h - 0.14) / 2, cz));
  g.add(box(w - 0.06, 0.1, d - 0.05, M.noceScuro, cx, 0.05, cz));
  g.add(box(w + 0.02, 0.04, d + 0.03, M.pietra, cx, h - 0.02, cz + 0.01));
  const n = Math.round(w / 0.5), aw = w / n;
  for (let i = 0; i < n; i++) {
    const a = antaTelaio(aw - 0.02, h - 0.2, M.noce, 0.05);
    a.position.set(x0 + aw * (i + 0.5), 0.1 + (h - 0.2) / 2, z + d + 0.005); g.add(a);
    g.add(manigliaOttone(0.1, x0 + aw * (i + 0.5), 0.62, z + d + 0.02, true));
  }
  // lavatoio in ceramica
  g.add(box(0.5, 0.06, 0.42, M.ceramica, x0 + 0.4, h + 0.02, cz));
  g.add(box(0.42, 0.02, 0.34, M.pietraScura, x0 + 0.4, h + 0.045, cz, { cast: false }));
  g.add(cyl(0.01, 0.01, 0.25, M.ottoneScuro, x0 + 0.4, h + 0.14, z + 0.08, 8));
  g.add(cyl(0.01, 0.01, 0.15, M.ottoneScuro, x0 + 0.4, h + 0.26, z + 0.15, 8).rotateX(Math.PI / 2));
  // cesta di panni e flaconi
  g.add(box(0.36, 0.28, 0.3, M.lino, x1 - 0.35, h + 0.16, cz));
  g.add(cyl(0.04, 0.04, 0.22, M.ceramicaSalvia, x0 + 0.9, h + 0.13, z + 0.15, 12));
  // mensole alte con ceste
  for (const y of [1.55, 1.95]) {
    g.add(box(w, 0.03, 0.3, M.noce, cx, y, z + 0.15));
    for (const bx of [x0 + 0.15, cx, x1 - 0.15]) g.add(box(0.015, 0.14, 0.26, M.ottone, bx, y - 0.085, z + 0.15));
  }
  for (let i = 0; i < 3; i++) g.add(box(0.36, 0.26, 0.28, i % 2 ? M.linoTortora : M.lino, x0 + 0.25 + i * 0.5, 1.7, z + 0.15));
  g.add(libri(0.5, x1 - 0.35, 1.97, z + 0.15, 7));
  ctx.addColliderBox(x0, x1, z, z + d, 0, h);
  return g;
}

// ---- letto singolo / daybed con cuscini ----
export function lettoSingolo(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  const W = 0.9, L = 2.0;
  g.add(box(W + 0.08, 0.2, L + 0.08, M.noce, 0, 0.2, 0));
  g.add(box(W, 0.18, L, M.linoBianco, 0, 0.39, 0));
  g.add(box(W + 0.04, 0.06, L * 0.7, M.velluto, 0, 0.5, L * 0.12));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.03, 0.12, M.noceScuro, sx * (W / 2 - 0.02), 0.06, sz * (L / 2 - 0.05), 10));
  g.add(cuscino(0.6, 0.28, 0.2, M.linoBianco, 0, 0.58, -L / 2 + 0.25));
  g.add(cuscino(0.4, 0.4, 0.15, M.vellutoSalvia, -0.2, 0.62, -L / 2 + 0.45, 0.2));
  g.add(cuscino(0.35, 0.35, 0.15, M.linoTortora, 0.25, 0.6, -L / 2 + 0.5, -0.3));
  // sponda posteriore in noce (lato muro)
  g.add(box(0.04, 0.5, L + 0.08, M.noce, -W / 2 - 0.02, 0.5, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- mensole a giorno in ferro e noce a parete ----
export function mensoleParete(ctx, x, y, z, normal = 'z+', w = 1.6) {
  const M = MAT();
  const g = new THREE.Group();
  for (const dy of [0, 0.4]) {
    g.add(box(w, 0.03, 0.24, M.noce, 0, dy, 0.12));
    for (const bx of [-w / 2 + 0.12, 0, w / 2 - 0.12]) {
      g.add(box(0.015, 0.2, 0.015, M.ferro, bx, dy - 0.1, 0.01));
      g.add(box(0.015, 0.015, 0.2, M.ferro, bx, dy - 0.015, 0.11));
    }
  }
  g.add(libri(w * 0.5, -w * 0.2, 0.017, 0.12, 9));
  g.add(cyl(0.05, 0.045, 0.14, M.cotto, w * 0.3, 0.09, 0.12, 12));
  g.add(libri(w * 0.35, w * 0.2, 0.417, 0.12, 11));
  g.add(box(0.12, 0.16, 0.02, M.carta, -w * 0.3, 0.5, 0.12));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

export function arredaCameraEst(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_est.rects[0]; // x 6.14-10.26, z 4.22-6.50; porta ovest z 4.26-5.07; finestra est z 4.81-5.94
  const zS = R.z + R.d;
  // parete nord in terracotta bruciata
  ctx.pareti.add(plane(R.w, ctx.H, M.terracottaPittura, R.cx, ctx.H / 2, R.z + 0.006, 'z+'));
  // lavanderia lungo la parete nord (oltre la porta): colonna + banco
  g.add(colonnaLavanderia(ctx, R.x + 1.4, R.z + 0.33));
  g.add(bancoLavanderia(ctx, { x0: R.x + 1.78, x1: R.x + 3.5, z: R.z }));
  // letto singolo sulla parete sud, mensole sopra
  g.add(lettoSingolo(ctx, R.x + 2.1, zS - 0.47, Math.PI / 2));
  ctx.pareti.add(mensoleParete(ctx, R.x + 2.1, 1.35, zS - 0.02, 'z-', 1.7));
  ctx.pareti.add(applique(ctx, R.x + 3.2, 1.5, zS - 0.02, 'z-', { intensita: 4 }));
  // scrittoio sotto la finestra est con sedia
  g.add(scrittoio(ctx, R.x + R.w - 0.3, R.z + 1.37, -Math.PI / 2, 1.0));
  g.add(sedia(ctx, R.x + R.w - 0.92, R.z + 1.37, Math.PI / 2));
  g.add(lampadaTavolo(ctx, R.x + R.w - 0.3, 0.77, R.z + 1.75, { colore: 'salvia', intensita: 4, h: 0.42 }));
  ctx.pareti.add(tende(1.14, 1.5, R.x + R.w - 0.03, 1.62, 5.37, 'x-'));
  g.add(tappeto(1.6, 0.8, M.linoTortora, R.x + 2.1, zS - 1.2));
  g.add(pianta(R.x + 0.4, zS - 0.35, { h: 0.8, vaso: 0.14 }));
  ctx.pareti.add(quadro(0.4, 0.5, M.cartaBotanica, R.x + 0.03, 1.6, zS - 0.55, 'x+'));
  g.add(pendente(ctx, R.cx, R.cz + 0.1, { yTop: ctx.H, calata: 0.4, raggio: 0.18, intensita: 12 }));
  return g;
}
