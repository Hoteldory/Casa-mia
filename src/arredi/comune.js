// Helper geometrici e oggetti ricorrenti condivisi da tutte le stanze.
// Tutte le misure in metri. Ogni funzione ritorna una Mesh o un THREE.Group.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { getMateriali, uvMetri, texPersiano, texStampaBotanica } from '../data/stile.js';

export const MAT = () => getMateriali();

// Materiali opachi per colore, condivisi (evita un materiale per ogni libro/oggetto)
const _matCache = new Map();
export function matColore(color, roughness = 0.85) {
  const k = color + '|' + roughness;
  if (!_matCache.has(k)) _matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness }));
  return _matCache.get(k);
}

// Spigoli arrotondati: dentro conSmusso(fn) ogni box ha gli spigoli raggiati (raggio RAGGIO, mai
// piu' di un terzo del lato corto; sotto 1,5 cm di spessore resta vivo). Si usa per arredi,
// infissi e giardino; i muri restano a spigolo vivo, perche' si accostano fra loro.
// Il raggio lo sceglie main.js prima di costruire (0 su telefono: meno triangoli).
let SMUSSO = 0, RAGGIO = 0.012;
export function raggioSmusso(r) { RAGGIO = r; }
export function conSmusso(fn) {
  const prima = SMUSSO;
  SMUSSO = RAGGIO;
  try { return fn(); } finally { SMUSSO = prima; }
}
const _smussate = new Map();
function geomSmussata(w, h, d, r) {
  const key = [w, h, d, r].map((v) => v.toFixed(4)).join('|');
  let g = _smussate.get(key);
  if (!g) {
    // un segmento per arco: smusso morbido con normali raccordate, 108 triangoli
    const rb = new RoundedBoxGeometry(w, h, d, 1, r);
    // UV in metri, faccia per faccia come uvMetri (gruppi nell'ordine +x -x +y -y +z -z)
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    const uv = rb.attributes.uv;
    rb.groups.forEach((gr, f) => {
      for (let i = gr.start; i < gr.start + gr.count; i++) uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    });
    g = mergeVertices(rb); // indicizzata come le box normali: si fonde con loro in ottimizza()
    rb.dispose();
    _smussate.set(key, g);
  }
  return g;
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m0 = Math.min(w, h, d);
  const g = SMUSSO && m0 >= 0.015 ? geomSmussata(w, h, d, Math.min(SMUSSO, m0 / 3)) : uvMetri(new THREE.BoxGeometry(w, h, d), w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 20, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, opts.open ?? false), mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function sphere(r, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// Piano verticale o orizzontale con UV in metri. normal: 'x+','x-','y+','y-','z+','z-'
export function plane(w, h, mat, x, y, z, normal = 'z+', opts = {}) {
  const g = uvMetri(new THREE.PlaneGeometry(w, h), w, h);
  const m = new THREE.Mesh(g, mat);
  const rot = { 'z+': [0, 0, 0], 'z-': [0, Math.PI, 0], 'x+': [0, Math.PI / 2, 0], 'x-': [0, -Math.PI / 2, 0], 'y+': [-Math.PI / 2, 0, 0], 'y-': [Math.PI / 2, 0, 0] }[normal];
  m.rotation.set(...rot);
  m.position.set(x, y, z);
  m.receiveShadow = opts.receive ?? true;
  m.castShadow = opts.cast ?? false;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

// Gruppo posizionato e ruotato (rotazione attorno a Y in radianti)
export function place(g, x, z, ry = 0, y = 0) {
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}

// ---------- oggetti ricorrenti ----------

// Anta a telaio (shaker): pannello incassato in una cornice — w x h, spessore 2 cm, sul piano XY, normale +Z
export function antaTelaio(w, h, mat, cornice = 0.06) {
  const g = new THREE.Group();
  g.add(box(w, h, 0.012, mat, 0, 0, -0.004)); // pannello di fondo
  g.add(box(w, cornice, 0.02, mat, 0, h / 2 - cornice / 2, 0));
  g.add(box(w, cornice, 0.02, mat, 0, -h / 2 + cornice / 2, 0));
  g.add(box(cornice, h - 2 * cornice, 0.02, mat, -w / 2 + cornice / 2, 0, 0));
  g.add(box(cornice, h - 2 * cornice, 0.02, mat, w / 2 - cornice / 2, 0, 0));
  return g;
}

// Maniglia a ponte in ottone (orizzontale), lunghezza l, sporge sul +Z
export function manigliaOttone(l = 0.12, x = 0, y = 0, z = 0, vertical = false) {
  const M = MAT();
  const g = new THREE.Group();
  const bar = cyl(0.006, 0.006, l, M.ottone, 0, 0, 0.03, 10);
  bar.rotation.z = vertical ? 0 : Math.PI / 2;
  g.add(bar);
  for (const s of [-1, 1]) {
    const p = cyl(0.005, 0.005, 0.03, M.ottone, vertical ? 0 : s * (l / 2 - 0.01), vertical ? s * (l / 2 - 0.01) : 0, 0.015, 8);
    p.rotation.x = Math.PI / 2;
    g.add(p);
  }
  g.position.set(x, y, z);
  return g;
}

// Pomolo in ottone
export function pomolo(x, y, z) {
  const M = MAT();
  const g = new THREE.Group();
  const s = cyl(0.004, 0.004, 0.025, M.ottone, 0, 0, 0.012, 8); s.rotation.x = Math.PI / 2; g.add(s);
  g.add(sphere(0.014, M.ottone, 0, 0, 0.03, 12));
  g.position.set(x, y, z);
  return g;
}

// Lampada a sospensione: rosone, cavo/asta in ottone, paralume ceramico a campana + luce
export function pendente(ctx, x, z, { yTop, calata = 0.6, raggio = 0.18, intensita = 18, colore = '#ffd9a8', paralume = 'ceramica' } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const y = yTop - calata;
  g.add(cyl(0.05, 0.05, 0.02, M.ottone, x, yTop - 0.01, z, 16));
  g.add(cyl(0.004, 0.004, calata, M.ottone, x, yTop - calata / 2, z, 8));
  const matP = (paralume === 'ceramica' ? M.ceramica : paralume === 'salvia' ? M.ceramicaSalvia : M.ottoneScuro).clone();
  matP.side = THREE.DoubleSide;
  matP.emissive = new THREE.Color('#ffd9a8');
  matP.emissiveIntensity = 0;
  const shade = cyl(raggio * 0.35, raggio, raggio * 0.9, matP, x, y - raggio * 0.45, z, 24, { open: true });
  g.add(shade);
  const bulb = sphere(0.03, M.lampadina, x, y - raggio * 0.6, z, 12);
  g.add(bulb);
  const light = new THREE.PointLight(colore, intensita, 7, 2);
  light.position.set(x, y - raggio * 0.7, z);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  return g;
}

// Sospensione a globo di vetro con calotta e stelo in ottone (cucina country)
export function pendenteGlobo(ctx, x, z, { yTop, calata = 0.75, raggio = 0.13, intensita = 12 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const y = yTop - calata;
  g.add(cyl(0.05, 0.05, 0.02, M.ottone, x, yTop - 0.01, z, 16));
  g.add(cyl(0.005, 0.005, calata - raggio, M.ottone, x, yTop - (calata - raggio) / 2, z, 8));
  g.add(cyl(0.035, 0.05, 0.05, M.ottone, x, y + raggio * 0.95, z, 16)); // calotta
  const vetro = M.vetroGlobo.clone();
  vetro.emissive = new THREE.Color('#ffd9a8'); vetro.emissiveIntensity = 0;
  g.add(sphere(raggio, vetro, x, y, z, 24));
  const bulb = sphere(0.028, M.lampadina, x, y, z, 12);
  g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 7, 2);
  light.position.set(x, y - 0.05, z);
  g.add(light);
  ctx.addLight(light, bulb, vetro);
  return g;
}

// Lampadario a tamburo: stelo e bracci in ottone con candele, paralume in lino avena
export function lampadarioTamburo(ctx, x, z, { yTop, calata = 0.95, raggio = 0.33, intensita = 22 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const y = yTop - calata;
  g.add(cyl(0.06, 0.06, 0.02, M.ottone, x, yTop - 0.01, z, 16));
  g.add(cyl(0.006, 0.006, calata - 0.1, M.ottone, x, yTop - (calata - 0.1) / 2, z, 8));
  g.add(sphere(0.03, M.ottone, x, y + 0.08, z, 12));
  // bracci e candele
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, cx = x + Math.cos(a) * raggio * 0.6, cz = z + Math.sin(a) * raggio * 0.6;
    const br = cyl(0.006, 0.006, raggio * 0.6, M.ottone, (x + cx) / 2, y, (z + cz) / 2, 6);
    br.rotation.z = Math.PI / 2; br.rotation.y = -a; g.add(br);
    g.add(cyl(0.025, 0.02, 0.025, M.ottone, cx, y + 0.012, cz, 10));
    g.add(cyl(0.012, 0.012, 0.08, M.carta, cx, y + 0.065, cz, 8));
  }
  // paralume a tamburo, aperto sopra e sotto
  const tela = M.linoAvena.clone();
  tela.side = THREE.DoubleSide;
  tela.emissive = new THREE.Color('#ffd9a8'); tela.emissiveIntensity = 0;
  g.add(cyl(raggio, raggio, 0.3, tela, x, y + 0.08, z, 32, { open: true }));
  for (const yy of [y - 0.07, y + 0.23]) {
    const anello = new THREE.Mesh(new THREE.TorusGeometry(raggio, 0.005, 6, 40), M.ottone);
    anello.rotation.x = Math.PI / 2; anello.position.set(x, yy, z); g.add(anello);
  }
  const bulb = sphere(0.03, M.lampadina, x, y + 0.1, z, 12);
  g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 8, 2);
  light.position.set(x, y, z);
  g.add(light);
  ctx.addLight(light, bulb, tela);
  return g;
}

// Tappeto persiano: una texture per tutto il tappeto (campo panna, medaglione, cornici)
export function tappetoPersiano(w, d, x, z, opzioni = {}) {
  const tex = texPersiano(opzioni);
  tex.repeat.set(1 / w, 1 / d);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, bumpMap: tex, bumpScale: 0.6 });
  return box(w, 0.012, d, mat, x, 0.006, z, { cast: false });
}

// Stampa botanica incorniciata (una texture per quadro, adattata alla sua misura)
export function stampaBotanica(w, h, x, y, z, normal = 'z+', seed = 91, matCornice) {
  const tex = texStampaBotanica(seed);
  tex.repeat.set(1 / w, 1 / h);
  const tela = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  return quadro(w, h, tela, x, y, z, normal, matCornice);
}

// Tenda a pacchetto in bambu', raccolta in alto sopra una finestra (piano XY, normale +Z)
export function tendaBambu(w, x, yTop, z, normal = 'z+', { aperta = 0.42 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w + 0.06, 0.04, 0.05, M.rovereMiele, 0, -0.02, 0.04));      // cassonetto
  const pieghe = 4, hp = aperta / pieghe;
  for (let i = 0; i < pieghe; i++) {
    const p = box(w, hp + 0.01, 0.035 + (i % 2) * 0.012, M.bambu, 0, -0.04 - hp * (i + 0.5), 0.05 + (i % 2) * 0.006);
    p.rotation.x = (i % 2 ? -1 : 1) * 0.08;
    g.add(p);
  }
  for (const sx of [-1, 1]) g.add(box(0.012, aperta + 0.04, 0.006, M.linoAvena, sx * w * 0.3, -0.04 - aperta / 2, 0.075));
  g.position.set(x, yTop, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// Applique in ottone con paralume in tessuto
export function applique(ctx, x, y, z, normal = 'z+', { intensita = 6 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(0.08, 0.14, 0.02, M.ottone, 0, 0, 0.01));
  const arm = cyl(0.006, 0.006, 0.12, M.ottone, 0, 0.03, 0.07, 8); arm.rotation.x = Math.PI / 2; g.add(arm);
  const matP = M.paralume.clone();
  matP.emissive = new THREE.Color('#ffd9a8'); matP.emissiveIntensity = 0;
  const shade = cyl(0.05, 0.08, 0.13, matP, 0, 0.09, 0.13, 20, { open: true }); g.add(shade);
  const bulb = sphere(0.02, M.lampadina, 0, 0.08, 0.13, 8); g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 4.5, 2);
  light.position.set(0, 0.06, 0.16);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// Lampada da tavolo: base ceramica + paralume lino
export function lampadaTavolo(ctx, x, y, z, { colore = 'salvia', intensita = 5, h = 0.5 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const base = cyl(0.06, 0.08, h * 0.45, colore === 'salvia' ? M.ceramicaSalvia : M.ceramica, 0, h * 0.225, 0, 20);
  g.add(base);
  g.add(cyl(0.006, 0.006, h * 0.3, M.ottone, 0, h * 0.55, 0, 8));
  const matP = M.paralume.clone();
  matP.emissive = new THREE.Color('#ffd9a8'); matP.emissiveIntensity = 0;
  const shade = cyl(0.11, 0.15, h * 0.4, matP, 0, h * 0.8, 0, 24, { open: true });
  g.add(shade);
  const bulb = sphere(0.025, M.lampadina, 0, h * 0.72, 0, 8); g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 3.6, 2);
  light.position.set(0, h * 0.75, 0);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, y, z);
  return g;
}

// Lampada da terra ad arco in ottone
export function lampadaTerra(ctx, x, z, { h = 1.7, intensita = 8 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.14, 0.16, 0.025, M.pietraScura, 0, 0.012, 0, 24));
  g.add(cyl(0.012, 0.012, h, M.ottone, 0, h / 2, 0, 10));
  const arm = cyl(0.01, 0.01, 0.5, M.ottone, 0.22, h - 0.05, 0, 8); arm.rotation.z = Math.PI / 2; g.add(arm);
  const matP = M.ottoneScuro.clone();
  matP.side = THREE.DoubleSide;
  matP.emissive = new THREE.Color('#ffd9a8'); matP.emissiveIntensity = 0;
  const shade = cyl(0.07, 0.14, 0.2, matP, 0.45, h - 0.18, 0, 20, { open: true });
  g.add(shade);
  const bulb = sphere(0.025, M.lampadina, 0.45, h - 0.25, 0, 8); g.add(bulb);
  const light = new THREE.PointLight('#ffd9a8', intensita, 5, 2);
  light.position.set(0.45, h - 0.3, 0);
  g.add(light);
  ctx.addLight(light, bulb, matP);
  g.position.set(x, 0, z);
  return g;
}

// Tappeto: piano sottile con bordo
export function tappeto(w, d, mat, x, z, matBordo) {
  const g = new THREE.Group();
  const b = box(w, 0.012, d, matBordo || mat, x, 0.006, z, { cast: false });
  g.add(b);
  if (matBordo) g.add(box(w - 0.2, 0.014, d - 0.2, mat, x, 0.007, z, { cast: false }));
  return g;
}

// Quadro con cornice, appeso su un muro (normal = lato verso la stanza)
export function quadro(w, h, matTela, x, y, z, normal = 'z+', matCornice) {
  const M = MAT();
  const g = new THREE.Group();
  const c = matCornice || M.noceScuro;
  g.add(box(w, h, 0.02, matTela, 0, 0, 0.012, { cast: false }));
  g.add(box(w + 0.06, 0.03, 0.035, c, 0, h / 2 + 0.015, 0.017));
  g.add(box(w + 0.06, 0.03, 0.035, c, 0, -h / 2 - 0.015, 0.017));
  g.add(box(0.03, h, 0.035, c, -w / 2 - 0.015, 0, 0.017));
  g.add(box(0.03, h, 0.035, c, w / 2 + 0.015, 0, 0.017));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// Pianta in vaso di cotto
export function pianta(x, z, { h = 0.9, vaso = 0.16, matVaso } = {}) {
  const M = MAT();
  const mv = matVaso || M.cotto;
  const g = new THREE.Group();
  g.add(cyl(vaso, vaso * 0.8, vaso * 1.2, mv, 0, vaso * 0.6, 0, 20));
  g.add(cyl(vaso * 1.05, vaso * 1.05, 0.03, mv, 0, vaso * 1.2, 0, 20));
  g.add(cyl(0.012, 0.015, h * 0.5, M.noceScuro, 0, vaso * 1.2 + h * 0.25, 0, 8));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const l = 0.25 + (i % 3) * 0.08;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.1, l), M.foglia);
    leaf.position.set(Math.cos(a) * 0.12, vaso * 1.2 + h * 0.45 + (i % 2) * 0.12, Math.sin(a) * 0.12);
    leaf.rotation.y = -a;
    leaf.rotation.x = -0.9 + (i % 3) * 0.25;
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}

// Fila di libri: n dorsi colorati lungo X, larghezza totale w
export function libri(w, x, y, z, seed = 1) {
  const g = new THREE.Group();
  const cols = ['#7a3b2e', '#3d4f3a', '#c8b58a', '#2f3a55', '#8a6a3c', '#5c2f2a', '#d9c9a5', '#4a5a6a', '#9a7a2c'];
  let cx = -w / 2;
  let i = seed;
  while (cx < w / 2 - 0.02) {
    const bw = 0.02 + ((i * 7) % 5) * 0.006;
    const bh = 0.18 + ((i * 13) % 6) * 0.02;
    const b = box(bw, bh, 0.14 + ((i * 3) % 3) * 0.02, matColore(cols[i % cols.length]), cx + bw / 2, bh / 2, 0);
    g.add(b);
    cx += bw + 0.003;
    i++;
  }
  g.position.set(x, y, z);
  return g;
}

// Cuscino morbido (box smussato con scala)
export function cuscino(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  return m;
}

// Termosifone in ghisa (colonne)
export function termosifone(w, x, y, z, normal = 'z+') {
  const M = MAT();
  const g = new THREE.Group();
  const n = Math.floor(w / 0.06);
  for (let i = 0; i < n; i++) {
    g.add(box(0.045, 0.6, 0.12, M.ferro, -w / 2 + 0.03 + i * 0.06, 0, 0.09));
  }
  g.add(cyl(0.012, 0.012, w, M.ferro, 0, 0.25, 0.09, 8).rotateZ(Math.PI / 2));
  g.add(cyl(0.012, 0.012, w, M.ferro, 0, -0.25, 0.09, 8).rotateZ(Math.PI / 2));
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// Tenda in lino ai lati di una finestra (due teli), sul piano XY, normale +Z
export function tende(w, h, x, y, z, normal = 'z+', mat) {
  const M = MAT();
  const g = new THREE.Group();
  const m = mat || M.linoBianco;
  const bar = cyl(0.012, 0.012, w + 0.5, M.ottone, 0, h / 2 + 0.06, 0.12, 8); bar.rotation.z = Math.PI / 2; g.add(bar);
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, h + 0.1, 0.06, 4, 1, 1), m);
    const pos = t.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + Math.sin(pos.getX(i) * 40) * 0.02);
    t.position.set(s * (w / 2 + 0.08), 0, 0.12);
    t.castShadow = true;
    g.add(t);
  }
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}

// Lanterna da esterno in ottone brunito: gabbia di vetro e luce calda
export function lanterna(ctx, x, y, z, normal = 'z+', { intensita = 14 } = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const vetro = new THREE.MeshPhysicalMaterial({ color: '#ffe9c4', roughness: 0.25, transparent: true, opacity: 0.35, emissive: new THREE.Color('#ffce85'), emissiveIntensity: 0 });
  g.add(box(0.05, 0.16, 0.02, M.ottoneScuro, 0, 0, 0.01));            // piastra a muro
  g.add(cyl(0.008, 0.008, 0.14, M.ottoneScuro, 0, 0.05, 0.08, 8).rotateX(Math.PI / 2));
  g.add(box(0.15, 0.2, 0.15, vetro, 0, 0.02, 0.15, { cast: false })); // gabbia in vetro
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(box(0.012, 0.21, 0.012, M.ottoneScuro, sx * 0.07, 0.02, 0.15 + sz * 0.07));
  }
  g.add(box(0.19, 0.03, 0.19, M.ottoneScuro, 0, 0.135, 0.15));         // cappello
  g.add(box(0.17, 0.02, 0.17, M.ottoneScuro, 0, -0.09, 0.15));         // fondo
  const bulb = sphere(0.022, M.lampadina, 0, 0.01, 0.15, 8);
  g.add(bulb);
  const light = new THREE.PointLight('#ffce85', intensita, 7, 2);
  light.position.set(0, 0.01, 0.17);
  g.add(light);
  ctx.addLight(light, bulb, vetro);
  g.position.set(x, y, z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[normal];
  return g;
}
