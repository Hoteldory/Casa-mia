// Bagno. Dettaglio di carattere: cementine a terra con motivo a stella (terracotta, salvia, nero, crema).
import * as THREE from 'three';
import { box, cyl, sphere, plane, group, place, applique, pendente, pianta, MAT } from './comune.js';

// ---- lavabo a catino ampio e profondo su consolle in noce e ferro, rubinetteria a muro in ottone brunito ----
export function lavaboCatino(ctx, { x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  // consolle: piano in pietra su struttura in ferro, ripiano basso in noce
  g.add(box(0.9, 0.04, 0.55, M.pietraScura, 0, 0.84, 0));
  g.add(box(0.86, 0.03, 0.5, M.noce, 0, 0.25, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.03, 0.84, 0.03, M.ferro, sx * 0.42, 0.42, sz * 0.25));
  // catino: vasca in ceramica smaltata, bordo spesso, interno scavato
  const outer = box(0.72, 0.28, 0.48, M.ceramica, 0, 0.98, 0);
  g.add(outer);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.38), new THREE.MeshStandardMaterial({ color: '#dfd9cc', roughness: 0.3, side: THREE.BackSide }));
  inner.position.set(0, 1.01, 0);
  g.add(inner);
  // scarico in ottone
  g.add(cyl(0.02, 0.02, 0.005, M.ottoneScuro, 0, 0.892, 0, 12));
  // rubinetteria a muro: due maniglie a croce + bocca ricurva
  const wallZ = -0.275;
  for (const dx of [-0.12, 0.12]) {
    g.add(cyl(0.03, 0.03, 0.02, M.ottoneScuro, dx, 1.3, wallZ + 0.01, 12).rotateX(Math.PI / 2));
    g.add(cyl(0.012, 0.012, 0.05, M.ottoneScuro, dx, 1.3, wallZ + 0.04, 8).rotateX(Math.PI / 2));
    g.add(box(0.07, 0.012, 0.012, M.ottoneScuro, dx, 1.3, wallZ + 0.065));
    g.add(box(0.012, 0.07, 0.012, M.ottoneScuro, dx, 1.3, wallZ + 0.065));
  }
  g.add(cyl(0.035, 0.035, 0.02, M.ottoneScuro, 0, 1.3, wallZ + 0.01, 12).rotateX(Math.PI / 2));
  g.add(cyl(0.012, 0.012, 0.14, M.ottoneScuro, 0, 1.3, wallZ + 0.08, 8).rotateX(Math.PI / 2));
  const bocca = cyl(0.012, 0.012, 0.07, M.ottoneScuro, 0, 1.27, wallZ + 0.16, 8);
  bocca.rotation.x = 0.9;
  g.add(bocca);
  // sapone e asciugamano in lino sul ripiano
  g.add(cyl(0.04, 0.035, 0.09, M.ceramicaSalvia, 0.3, 0.905, -0.1, 12));
  g.add(box(0.3, 0.08, 0.4, M.linoBianco, -0.2, 0.31, 0));
  g.add(box(0.3, 0.06, 0.4, M.lino, 0.2, 0.3, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- specchio con cornice in noce e ottone ----
export function specchio(ctx, w, h, x, y, z, normal = 'z+') {
  const M = MAT();
  const g = new THREE.Group();
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 0.9, roughness: 0.08 }));
  mirror.position.z = 0.03; g.add(mirror);
  const c = 0.05;
  g.add(box(w + 2 * c, c, 0.04, M.noceScuro, 0, h / 2 + c / 2, 0.02));
  g.add(box(w + 2 * c, c, 0.04, M.noceScuro, 0, -h / 2 - c / 2, 0.02));
  g.add(box(c, h, 0.04, M.noceScuro, -w / 2 - c / 2, 0, 0.02));
  g.add(box(c, h, 0.04, M.noceScuro, w / 2 + c / 2, 0, 0.02));
  g.add(box(w + 2 * c + 0.02, 0.012, 0.02, M.ottone, 0, h / 2 + c + 0.006, 0.02));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- sanitari: wc e bidet in ceramica, forma classica ----
export function wc(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(0.2, 0.3, 0.14, M.ceramica, 0, 0.3, -0.18)); // piede
  const tazza = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.36, 18), M.ceramica);
  tazza.scale.set(1, 1, 1.3); tazza.position.set(0, 0.22, 0.02); tazza.castShadow = true; g.add(tazza);
  const sedile = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 18), M.noceScuro);
  sedile.scale.set(1, 1, 1.3); sedile.position.set(0, 0.415, 0.02); g.add(sedile);
  g.add(box(0.36, 0.4, 0.16, M.ceramica, 0, 0.62, -0.2)); // cassetta bassa
  g.add(cyl(0.012, 0.012, 0.03, M.ottone, 0, 0.83, -0.2, 8));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}
export function bidet(ctx, x, z, ry = 0) {
  const M = MAT();
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.4, 18), M.ceramica);
  b.scale.set(1, 1, 1.4); b.position.set(0, 0.2, 0.05); b.castShadow = true; g.add(b);
  g.add(cyl(0.012, 0.012, 0.09, M.ottone, 0, 0.43, -0.16, 8));
  g.add(box(0.06, 0.012, 0.012, M.ottone, 0, 0.47, -0.16));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- doccia con piatto in pietra, parete in vetro e colonna in ottone ----
export function doccia(ctx, { x0, z0, size = 0.8 }) {
  const M = MAT();
  const g = new THREE.Group();
  const cx = x0 + size / 2, cz = z0 + size / 2;
  g.add(box(size, 0.05, size, M.pietraScura, cx, 0.025, cz));
  g.add(box(size - 0.08, 0.01, size - 0.08, M.pietra, cx, 0.052, cz, { cast: false }));
  // vetro fisso sul lato est, profilo in ottone
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(size, 2.0), M.vetro);
  glass.rotation.y = Math.PI / 2; glass.position.set(x0 + size, 1.05, cz); g.add(glass);
  g.add(box(0.02, 2.0, 0.02, M.ottone, x0 + size, 1.05, z0 + size));
  g.add(box(0.02, 0.02, size, M.ottone, x0 + size, 2.05, cz));
  // colonna doccia
  g.add(cyl(0.012, 0.012, 1.1, M.ottoneScuro, x0 + 0.06, 1.6, cz, 8));
  g.add(cyl(0.11, 0.11, 0.015, M.ottoneScuro, x0 + 0.2, 2.15, cz, 20));
  g.add(cyl(0.01, 0.01, 0.3, M.ottoneScuro, x0 + 0.14, 2.15, cz, 8).rotateZ(Math.PI / 2));
  g.add(box(0.05, 0.04, 0.16, M.ottoneScuro, x0 + 0.06, 1.05, cz));
  // mensola d'angolo con boccette
  g.add(box(0.2, 0.02, 0.2, M.pietra, x0 + 0.1, 1.3, z0 + 0.1));
  g.add(cyl(0.025, 0.025, 0.14, M.ceramicaSalvia, x0 + 0.08, 1.38, z0 + 0.08, 10));
  g.add(cyl(0.02, 0.02, 0.1, M.ceramica, x0 + 0.14, 1.36, z0 + 0.13, 10));
  ctx.addColliderBox(x0 + size - 0.03, x0 + size + 0.03, z0, z0 + size, 0, 2);
  return g;
}

// ---- scaldasalviette in ottone brunito ----
export function scaldasalviette(ctx, x, y, z, normal = 'x-') {
  const M = MAT();
  const g = new THREE.Group();
  for (const dx of [-0.2, 0.2]) g.add(cyl(0.012, 0.012, 0.9, M.ottoneScuro, dx, 0, 0.06, 8));
  for (let i = 0; i < 8; i++) g.add(cyl(0.008, 0.008, 0.42, M.ottoneScuro, 0, -0.4 + i * 0.11, 0.06, 8).rotateZ(Math.PI / 2));
  g.add(box(0.44, 0.1, 0.02, M.linoBianco, 0, 0.14, 0.09));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- boiserie bassa in ceramica bianca (rivestimento a mezza altezza) ----
function rivestimento(ctx, r) {
  const M = MAT();
  const g = new THREE.Group();
  const h = 1.2, y = h / 2;
  const m = new THREE.MeshStandardMaterial({ color: '#f2eee6', roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  g.add(plane(r.d, h, m, r.x + 0.015, y, r.cz, 'x+'));
  g.add(plane(r.d, h, m, r.x + r.w - 0.015, y, r.cz, 'x-'));
  g.add(plane(r.w, h, m, r.cx, y, r.z + 0.015, 'z+'));
  g.add(plane(r.w - 0.9, h, m, r.x + (r.w - 0.9) / 2, y, r.z + r.d - 0.015, 'z-')); // lascia la porta
  // listello in ottone a coronamento
  for (const [w, x, z, rot] of [[r.d, r.x + 0.02, r.cz, 0], [r.d, r.x + r.w - 0.02, r.cz, 0], [r.w, r.cx, r.z + 0.02, 1], [r.w - 0.9, r.x + (r.w - 0.9) / 2, r.z + r.d - 0.02, 1]]) {
    g.add(rot ? box(w, 0.02, 0.012, M.ottone, x, h + 0.01, z, { cast: false }) : box(0.012, 0.02, w, M.ottone, x, h + 0.01, z, { cast: false }));
  }
  return g;
}

export function arredaBagno(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.bagno.rects[0]; // x 4.31-5.99, z 0.28-2.84
  ctx.pareti.add(rivestimento(ctx, R));
  // sanitari sotto la finestra, a nord
  g.add(wc(ctx, R.x + 0.38, R.z + 0.32));
  g.add(bidet(ctx, R.x + 1.2, R.z + 0.32));
  // lavabo sulla parete ovest, specchio e applique
  g.add(lavaboCatino(ctx, { x: R.x + 0.3, z: R.z + 1.45, ry: -Math.PI / 2 }));
  ctx.pareti.add(specchio(ctx, 0.6, 0.8, R.x + 0.03, 1.75, R.z + 1.45, 'x+'));
  ctx.pareti.add(applique(ctx, R.x + 0.02, 2.05, R.z + 1.0, 'x+', { intensita: 4 }));
  ctx.pareti.add(applique(ctx, R.x + 0.02, 2.05, R.z + 1.9, 'x+', { intensita: 4 }));
  // doccia nell'angolo sud-ovest
  g.add(doccia(ctx, { x0: R.x, z0: R.z + R.d - 0.8 }));
  // scaldasalviette sulla parete est
  ctx.pareti.add(scaldasalviette(ctx, R.x + R.w - 0.02, 1.2, R.z + 1.2, 'x-'));
  // sgabellino in noce con asciugamani, pianta
  g.add(box(0.3, 0.03, 0.3, M.noce, R.x + R.w - 0.3, 0.42, R.z + 1.85));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.03, 0.42, 0.03, M.noce, R.x + R.w - 0.3 + sx * 0.12, 0.21, R.z + 1.85 + sz * 0.12));
  g.add(box(0.26, 0.1, 0.22, M.linoBianco, R.x + R.w - 0.3, 0.485, R.z + 1.85));
  g.add(pianta(R.x + R.w - 0.25, R.z + 0.35, { h: 0.5, vaso: 0.1 }));
  // lampada centrale
  g.add(pendente(ctx, R.cx, R.cz, { yTop: ctx.H, calata: 0.35, raggio: 0.14, intensita: 10 }));
  return g;
}
