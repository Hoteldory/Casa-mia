// Bagno del piano primo, dalle due foto di riferimento: perlinato panna a tutta altezza, doccia
// rivestita in piastrelle blu lucide verticali con nicchia illuminata e rubinetteria in ottone,
// vetri con profili in ottone, pavimento a ottagonette bianche con tozzetti neri, soffitto a
// doghe di rovere con travetti, mobile lavabo in rovere con vano a giorno e spugne salvia,
// lavabo d'appoggio smerlato, specchio laccato azzurro, applique in rattan, sanitari sospesi.
import * as THREE from 'three';
import { box, cyl, sphere, plane, group, place, pareteDoghe, manigliaOttone, stampaBotanica, pianta, cesta, matColore, MAT } from './comune.js';

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
export function specchio(ctx, w, h, x, y, z, normal = 'z+', cornice) {
  const M = MAT();
  const Cr = cornice || M.noceScuro;
  const g = new THREE.Group();
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 0.9, roughness: 0.08 }));
  mirror.position.z = 0.03; g.add(mirror);
  const c = 0.05;
  g.add(box(w + 2 * c, c, 0.04, Cr, 0, h / 2 + c / 2, 0.02));
  g.add(box(w + 2 * c, c, 0.04, Cr, 0, -h / 2 - c / 2, 0.02));
  g.add(box(c, h, 0.04, Cr, -w / 2 - c / 2, 0, 0.02));
  g.add(box(c, h, 0.04, Cr, w / 2 + c / 2, 0, 0.02));
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

// tubo morbido in ottone lungo una curva (bracci, flessibili)
function tubo(punti, r, mat, seg = 24) {
  const curva = new THREE.CatmullRomCurve3(punti.map((p) => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curva, seg, r, 6), mat);
  m.castShadow = true;
  return m;
}

// ---- mobile lavabo in rovere: cassetto con maniglia in ottone, due ripiani a giorno con spugne
// salvia e una cesta, piano in marmo, lavabo smerlato d'appoggio, rubinetto a muro in ottone
// (costruito contro un muro a -z) ----
export function mobileLavaboRovere(ctx, { x, z, ry = 0, w = 0.8 }) {
  const M = MAT();
  const L = M.rovereMiele;
  const g = new THREE.Group();
  const d = 0.5, h = 0.85;
  g.add(box(w + 0.02, 0.03, d + 0.01, M.marmo, 0, h - 0.015, 0.005));
  for (const s of [-1, 1]) g.add(box(0.03, h - 0.03, d, L, s * (w / 2 - 0.015), (h - 0.03) / 2, 0));
  g.add(box(w - 0.06, h - 0.03, 0.015, L, 0, (h - 0.03) / 2, -d / 2 + 0.0075));
  g.add(box(w - 0.06, 0.08, d - 0.05, L, 0, 0.04, -0.02));                     // zoccolo arretrato
  g.add(box(w - 0.06, 0.025, d - 0.02, L, 0, 0.09, 0));                         // ripiano basso
  g.add(box(w - 0.06, 0.025, d - 0.02, L, 0, 0.4, 0));                          // ripiano medio
  g.add(box(w - 0.06, 0.025, d - 0.02, L, 0, 0.64, 0));                         // fondo del cassetto
  g.add(box(w - 0.07, 0.17, 0.02, L, 0, h - 0.12, d / 2 - 0.005));              // frontale del cassetto
  g.add(manigliaOttone(0.14, 0, h - 0.12, d / 2));
  // spugne salvia piegate e una cesta
  for (const [sx, n, y0] of [[-0.17, 3, 0.1025], [0.17, 2, 0.1025], [-0.17, 2, 0.4125]]) {
    for (let i = 0; i < n; i++) g.add(box(0.28, 0.065, 0.3, M.spugnaSalvia, sx + (i % 2 ? 0.01 : -0.005), y0 + 0.0325 + i * 0.068, 0.04));
  }
  const ce = cesta(0.17, 0.02, { r: 0.12, h: 0.18 }); ce.position.y = 0.4125; g.add(ce);
  // lavabo d'appoggio smerlato (travertino), sulla curva di un catino
  const profilo = [[0, 0], [0.1, 0], [0.16, 0.03], [0.2, 0.08], [0.215, 0.13], [0.205, 0.135], [0.19, 0.09], [0.14, 0.04], [0.06, 0.022], [0, 0.022]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const lg = new THREE.LatheGeometry(profilo, 60);
  const pos = lg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i), pz = pos.getZ(i), a = Math.atan2(pz, px);
    const f = 1 + 0.07 * Math.abs(Math.cos(5 * a)) * Math.min(1, pos.getY(i) / 0.06);
    pos.setX(i, px * f); pos.setZ(i, pz * f);
  }
  lg.computeVertexNormals();
  const catino = new THREE.Mesh(lg, M.travertino);
  catino.position.set(0, h, 0.04); catino.castShadow = true; g.add(catino);
  g.add(cyl(0.02, 0.02, 0.004, M.ottone, 0, h + 0.024, 0.04, 12));
  // rubinetto a muro: bocca ricurva e due manopole a croce
  const zw = -d / 2;
  g.add(cyl(0.03, 0.03, 0.015, M.ottone, 0, h + 0.3, zw + 0.008, 14).rotateX(Math.PI / 2));
  g.add(tubo([[0, h + 0.3, zw], [0, h + 0.3, zw + 0.16], [0, h + 0.27, zw + 0.24], [0, h + 0.22, zw + 0.26]], 0.011, M.ottone, 12));
  for (const dx of [-0.11, 0.11]) {
    g.add(cyl(0.022, 0.022, 0.05, M.ottone, dx, h + 0.3, zw + 0.025, 12).rotateX(Math.PI / 2));
    g.add(box(0.07, 0.012, 0.012, M.ottone, dx, h + 0.3, zw + 0.055));
    g.add(box(0.012, 0.07, 0.012, M.ottone, dx, h + 0.3, zw + 0.055));
  }
  // flaconi in vetro ambrato su un vassoio
  g.add(box(0.26, 0.012, 0.12, M.noceScuro, w / 2 - 0.16, h + 0.006, -0.1));
  for (const [dx, hh] of [[-0.08, 0.17], [0, 0.13], [0.07, 0.11]]) {
    g.add(cyl(0.03, 0.03, hh, M.vetroAmbra, w / 2 - 0.16 + dx, h + 0.012 + hh / 2, -0.1, 14));
    g.add(cyl(0.008, 0.008, 0.04, M.nero, w / 2 - 0.16 + dx, h + 0.032 + hh, -0.1, 8));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- specchio con cornice laccata azzurra a tubo, angoli arrotondati ----
export function specchioLaccato(w, h, x, y, z, normal = 'z+') {
  const M = MAT();
  const g = new THREE.Group();
  const rett = (hw, hh, r) => {
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r); s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  };
  const fuori = rett(w / 2, h / 2, 0.12);
  fuori.holes.push(rett(w / 2 - 0.05, h / 2 - 0.05, 0.08));
  const cornice = new THREE.Mesh(new THREE.ExtrudeGeometry(fuori, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 10 }), M.laccaAzzurra);
  cornice.position.z = 0.02; cornice.castShadow = true; g.add(cornice);
  const vetro = new THREE.Mesh(new THREE.ShapeGeometry(rett(w / 2 - 0.045, h / 2 - 0.045, 0.08), 10), new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 0.9, roughness: 0.08 }));
  vetro.position.z = 0.025; g.add(vetro);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- applique a collo di cigno in ottone con paralume in rattan ----
export function appliqueRattan(ctx, x, y, z, normal = 'z+', { intensita = 4 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.035, 0.035, 0.015, M.ottone, 0, 0, 0.008, 16).rotateX(Math.PI / 2));
  g.add(tubo([[0, 0, 0.01], [0, -0.04, 0.09], [0, 0.03, 0.17], [0, 0.11, 0.19]], 0.008, M.ottone, 16));
  // rattan: il color paglia e la trama in rilievo della juta
  const matP = new THREE.MeshStandardMaterial({ color: '#c9a46c', roughness: 0.9, side: THREE.DoubleSide, normalMap: M.juta.normalMap, bumpMap: M.juta.bumpMap });
  matP.emissive = new THREE.Color('#ffcf8f'); matP.emissiveIntensity = 0;
  g.add(cyl(0.06, 0.095, 0.15, matP, 0, 0.17, 0.19, 18, { open: true }));
  const bulb = sphere(0.02, M.lampadina, 0, 0.14, 0.19, 8);
  g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 4, 2);
  light.position.set(0, 0.1, 0.22);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// ---- sanitari sospesi (vaso e bidet), appesi a una controparete a -z ----
export function sanitarioSospeso(ctx, x, z, ry = 0, { bidet = false } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(0.32, 0.2, 0.1, M.ceramica, 0, 0.32, 0.05));
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.22, 28), M.ceramica);
  corpo.scale.set(1, 1, 1.4); corpo.position.set(0, 0.31, 0.27); corpo.castShadow = true; g.add(corpo);
  if (bidet) {
    g.add(cyl(0.012, 0.012, 0.08, M.ottone, 0, 0.46, 0.12, 8));
    g.add(tubo([[0, 0.5, 0.12], [0, 0.52, 0.16], [0, 0.49, 0.2]], 0.009, M.ottone, 8));
    g.add(cyl(0.02, 0.02, 0.03, M.ottone, 0.07, 0.435, 0.12, 10));
  } else {
    const sedile = new THREE.Mesh(new THREE.CylinderGeometry(0.182, 0.182, 0.035, 28), M.ceramica);
    sedile.scale.set(1, 1, 1.4); sedile.position.set(0, 0.437, 0.27); sedile.castShadow = true; g.add(sedile);
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- sgabello in noce con gambe tornite a rocchetto ----
export function sgabelloTornito(ctx, x, z) {
  const M = MAT();
  const L = M.noceCaldo;
  const g = new THREE.Group();
  g.add(cyl(0.17, 0.165, 0.045, L, 0, 0.48, 0, 28));
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    for (let k = 0; k < 8; k++) {
      const t = k / 7, rr = 0.1 + t * 0.05;
      g.add(sphere(0.022 - (k % 2) * 0.005, L, Math.cos(a) * rr, 0.45 - t * 0.43, Math.sin(a) * rr, 10));
    }
  }
  for (let i = 0; i < 4; i++) {                                                  // traversi
    const a = Math.PI / 4 + (i * Math.PI) / 2, b = a + Math.PI / 2, rr = 0.135;
    g.add(tubo([[Math.cos(a) * rr, 0.2, Math.sin(a) * rr], [Math.cos(b) * rr, 0.2, Math.sin(b) * rr]], 0.009, L, 2));
  }
  g.position.set(x, 0, z);
  ctx.solid(g);
  return g;
}

export function arredaBagno(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const P = ctx.pareti;
  const R = stanze.bagno.rects[0]; // x 4.31-5.99, z 0.28-2.84; finestra nord x 4.65-5.36 (y 0.9-2.3); porta sud x 5.13-5.99
  const xO = R.x, xE = R.x + R.w, zN = R.z, zS = R.z + R.d, H = ctx.H;
  // doccia nell'angolo sud-ovest, 80 x 110: controparete piastrellata sul fondo (con la nicchia)
  const xD = 5.11, zD = 1.74, zC = zS - 0.08;

  // perlinato panna a tutta altezza (con cimasa a cornice), dove non c'e' la doccia
  const doghe = (asse, a, b, at, verso, h = H - 0.05) => pareteDoghe(P, { asse, a, b, at, verso, h, mat: M.biancoLatte, cimasa: M.biancoLatte, fuga: '#d6ccba' });
  doghe('x', xO, 4.65, zN, 1); doghe('x', 5.36, xE, zN, 1);
  P.add(plane(0.71, H - 2.3, M.biancoLatte, 5.005, (2.3 + H) / 2, zN + 0.015, 'z+'));      // sopra la finestra
  P.add(plane(xE - xD, H - 2.2, M.biancoLatte, (xD + xE) / 2, (2.2 + H) / 2, zS - 0.015, 'z-')); // sopra la porta
  doghe('z', zN, zD, xO, 1);
  doghe('z', zN, zS, xE, -1);

  // controparete bassa sotto la finestra (cassetta del vaso), rivestita a doghe con piano in marmo
  const hC = 0.865, dC = 0.15;
  g.add(box(R.w, hC - 0.02, dC, M.biancoLatte, R.cx, (hC - 0.02) / 2, zN + dC / 2));
  for (let xx = xO + 0.06; xx < xE - 0.03; xx += 0.12) g.add(box(0.006, hC - 0.16, 0.004, matColore('#d6ccba', 0.9), xx, (hC - 0.02) / 2 + 0.04, zN + dC + 0.002));
  g.add(box(R.w, 0.02, dC + 0.02, M.marmo, R.cx, hC - 0.01, zN + (dC + 0.02) / 2));
  // vaso e bidet sospesi, placca di scarico e scopino in ottone
  const xW = 5.0, xB = 5.62;
  g.add(sanitarioSospeso(ctx, xW, zN + dC, 0));
  g.add(sanitarioSospeso(ctx, xB, zN + dC, 0, { bidet: true }));
  g.add(box(0.22, 0.14, 0.012, M.ottone, xW, 0.66, zN + dC + 0.006));
  for (const dx of [-0.045, 0.045]) g.add(cyl(0.035, 0.035, 0.006, M.ottoneScuro, xW + dx, 0.66, zN + dC + 0.014, 18).rotateX(Math.PI / 2));
  g.add(cyl(0.05, 0.05, 0.36, M.ottone, 4.66, 0.18, zN + dC + 0.1, 16));
  g.add(cyl(0.012, 0.012, 0.1, M.ottone, 4.66, 0.41, zN + dC + 0.1, 8));
  const pv = pianta(5.27, zN + 0.07, { h: 0.22, vaso: 0.055, matVaso: M.ceramica }); pv.position.y = hC; g.add(pv);

  // lavabo sulla parete ovest: mobile in rovere, specchio laccato azzurro, applique in rattan
  const zL = 1.3;
  g.add(mobileLavaboRovere(ctx, { x: xO + 0.28, z: zL, ry: Math.PI / 2, w: 0.8 }));
  P.add(specchioLaccato(0.56, 0.8, xO + 0.025, 1.68, zL, 'x+'));
  P.add(appliqueRattan(ctx, xO + 0.025, 1.78, 0.78, 'x+', { intensita: 4 }));

  // doccia: piastrelle blu lucide sulle due pareti, nicchia illuminata nella controparete
  P.add(plane(zC - zD, H - 0.012, M.zellige, xO + 0.015, (H - 0.012) / 2, (zD + zC) / 2, 'x+'));
  const nx0 = 4.4, nx1 = 4.8, ny0 = 1.15, ny1 = 1.45, hT = H - 0.012;
  for (const [a, b, y0, y1] of [[xO, nx0, 0, hT], [nx1, xD, 0, hT], [nx0, nx1, 0, ny0], [nx0, nx1, ny1, hT]]) {
    P.add(box(b - a, y1 - y0, zS - zC, M.zellige, (a + b) / 2, (y0 + y1) / 2, (zC + zS) / 2, { cast: false }));
  }
  P.add(plane(nx1 - nx0, ny1 - ny0, M.piastrelleCrema, (nx0 + nx1) / 2, (ny0 + ny1) / 2, zS - 0.015, 'z-'));
  const led = box(nx1 - nx0 - 0.04, 0.008, 0.01, M.lampadina, (nx0 + nx1) / 2, ny1 - 0.01, zC + 0.02, { cast: false });
  P.add(led);
  const luceNicchia = new THREE.PointLight('#ffd9a8', 0.35, 1.2, 2);
  luceNicchia.position.set((nx0 + nx1) / 2, ny1 - 0.04, zC - 0.12);
  P.add(luceNicchia);
  ctx.addLight(luceNicchia, led, null);
  for (const [dx, hh, m] of [[-0.12, 0.17, M.vetroAmbra], [-0.05, 0.14, M.vetroAmbra], [0.08, 0.12, M.ceramica]]) {
    P.add(cyl(0.028, 0.028, hh, m, (nx0 + nx1) / 2 + dx, ny0 + hh / 2, zC + 0.04, 14));
    P.add(cyl(0.008, 0.008, 0.035, M.nero, (nx0 + nx1) / 2 + dx, ny0 + hh + 0.017, zC + 0.04, 8));
  }
  // soffione a pioggia, miscelatore a incasso, doccetta col flessibile, scarico a canalina
  const xS = (xO + xD) / 2;
  g.add(tubo([[xS, 2.12, zC], [xS, 2.12, zC - 0.2], [xS, 2.08, zC - 0.3]], 0.011, M.ottone, 10));
  g.add(cyl(0.12, 0.12, 0.025, M.ottone, xS, 2.06, zC - 0.32, 28));
  g.add(cyl(0.11, 0.11, 0.004, M.ottoneScuro, xS, 2.046, zC - 0.32, 28));
  g.add(box(0.13, 0.2, 0.012, M.ottone, 4.96, 1.0, zC - 0.006));
  for (const y of [1.05, 0.95]) g.add(cyl(0.022, 0.022, 0.04, M.ottone, 4.96, y, zC - 0.03, 12).rotateX(Math.PI / 2));
  g.add(cyl(0.02, 0.02, 0.03, M.ottone, 4.96, 0.82, zC - 0.015, 10).rotateX(Math.PI / 2));
  g.add(box(0.03, 0.05, 0.04, M.ottone, 4.96, 1.36, zC - 0.02));
  g.add(cyl(0.012, 0.016, 0.2, M.ottone, 4.96, 1.4, zC - 0.05, 10));
  g.add(cyl(0.035, 0.025, 0.04, M.ottone, 4.96, 1.51, zC - 0.06, 14));
  g.add(tubo([[4.96, 0.81, zC - 0.03], [4.92, 0.5, zC - 0.06], [4.97, 0.36, zC - 0.08], [5.02, 0.55, zC - 0.07], [4.97, 1.3, zC - 0.05]], 0.007, M.ottone, 32));
  g.add(box(0.6, 0.006, 0.05, M.ottoneScuro, xS, 0.008, zC - 0.08, { cast: false }));
  // vetri a filo pavimento con profili in ottone: fisso a nord, porta a battente a est
  const vetro = (w, cx, cz, rot) => {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.0), M.vetro);
    v.position.set(cx, 1.01, cz); v.rotation.y = rot; g.add(v);
  };
  vetro(xD - xO, (xO + xD) / 2, zD, 0);
  vetro(zC - zD, xD, (zD + zC) / 2, Math.PI / 2);
  g.add(box(xD - xO, 0.02, 0.02, M.ottone, (xO + xD) / 2, 2.02, zD));
  g.add(box(0.02, 0.02, zC - zD, M.ottone, xD, 2.02, (zD + zC) / 2));
  for (const [px, pz] of [[xD, zD], [xO + 0.01, zD], [xD, zC - 0.01]]) g.add(box(0.02, 2.03, 0.02, M.ottone, px, 1.015, pz));
  for (const y of [0.3, 1.7]) g.add(box(0.03, 0.08, 0.05, M.ottone, xD, y, zC - 0.05));     // cerniere
  g.add(cyl(0.01, 0.01, 0.35, M.ottone, xD + 0.04, 1.05, zD + 0.12, 8));                    // maniglione
  for (const y of [0.9, 1.2]) g.add(box(0.04, 0.012, 0.012, M.ottone, xD + 0.02, y, zD + 0.12));

  // parete est: scaldasalviette in ottone con spugne, sgabello tornito, stampa botanica
  P.add(scaldasalviette(ctx, xE - 0.03, 1.2, 1.15, 'x-'));
  P.add(box(0.03, 0.45, 0.32, M.linoAzzurro, xE - 0.13, 1.25, 1.15));
  P.add(box(0.032, 0.02, 0.322, matColore('#2f3a55'), xE - 0.13, 1.1, 1.15));
  g.add(sgabelloTornito(ctx, 5.8, 1.8));
  P.add(stampaBotanica(0.3, 0.4, xE - 0.03, 1.6, 1.78, 'x-', 121, M.rovereMiele));
  // tappeto da bagno blu in cotone, davanti alla doccia
  g.add(box(0.45, 0.014, 0.7, matColore('#4f6788', 1), 5.36, 0.007, 1.8, { cast: false }));
  g.add(box(0.37, 0.016, 0.62, matColore('#5d7697', 1), 5.36, 0.008, 1.8, { cast: false }));

  // due faretti incassati nel soffitto a doghe, una luce sola fra i due
  let bulbo = null;
  for (const [fx, fz] of [[5.05, 0.9], [5.3, 2.2]]) {
    g.add(cyl(0.05, 0.05, 0.008, M.ottone, fx, H - 0.016, fz, 20));
    const b = cyl(0.035, 0.035, 0.004, M.lampadina, fx, H - 0.021, fz, 20, { cast: false });
    g.add(b); bulbo = bulbo || b;
  }
  const luce = new THREE.PointLight('#ffd9a8', 5, 5, 2);
  luce.position.set(5.5, H - 0.25, 1.15); // lontana dallo spigolo del box doccia, che la rifletterebbe
  g.add(luce);
  ctx.addLight(luce, bulbo, null);
  return g;
}
