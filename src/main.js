// Scena, luci, controlli (orbita + prima persona con collisioni), pannello laterale.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { costruisciArchitettura, H } from './architettura.js';
import { arredi, TAVOLO_STATI } from './arredi/index.js';
import { creaPiantina } from './piantina.js';
import { costruisciPianoTerra, PIANO_TERRA, PIANO_SUOCERI, QUOTA_TERRA, ORIGINE_SUOCERI } from './pianoTerra.js';
import { arredaPianoTerra } from './arredi/piano_terra.js';
import { arredaSuoceri } from './arredi/suoceri.js';
import { giardino } from './arredi/giardino.js';

// ---------- contesto condiviso ----------
const colliders = []; // {minX,maxX,minZ,maxZ,minY,maxY}
const luciArtificiali = []; // punti luce accesi di sera
const emissivi = [];        // lampadine e paralumi che si illuminano di sera
const ctx = {
  H,
  variante: null, // 'chiuso' | 'aperto' mentre si costruisce il tavolo in una delle due forme
  addCollider(mesh) {
    mesh.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(mesh);
    colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, v: this.variante });
  },
  addColliderBox(minX, maxX, minZ, maxZ, minY = 0, maxY = 2) {
    colliders.push({ minX, maxX, minZ, maxZ, minY, maxY, v: this.variante });
  },
  // ingombro solido di un arredo (in coordinate mondo, da chiamare dopo il posizionamento)
  solid(obj) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, v: this.variante });
    return obj;
  },
  addLight(light, bulb, shade) {
    light.castShadow = false;
    luciArtificiali.push({ light, base: light.intensity, bulb, v: this.variante, esterno: !!this.esterno });
    emissivi.push({ bulb, shade });
  },
  pareti: null, // gruppo per elementi appesi ai muri (boiserie, carta, quadri)
};
let piano = 'primo'; // piano in vista: 'primo' (casa nostra) | 'terra' (cognata)

// Contesto per un piano costruito in un gruppo spostato (il piano terra): gli ingombri si
// registrano e si calcolano alla fine, quando ogni pezzo e' al suo posto nella scena.
// "cornice" e' il gruppo in cui si sta costruendo: serve per i box di ingombro non agganciati.
function contestoDifferito(radice, H) {
  const attesa = [];
  return {
    H, variante: null, pareti: null, cornice: radice,
    addCollider(mesh) { attesa.push({ obj: mesh, cornice: this.cornice }); },
    solid(obj) { attesa.push({ obj, cornice: this.cornice }); return obj; },
    addColliderBox(minX, maxX, minZ, maxZ, minY = 0, maxY = 2) {
      attesa.push({ box: new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ)), cornice: this.cornice });
    },
    addLight(light, bulb, shade) { ctx.addLight(light, bulb, shade); },
    risolvi() {
      radice.updateMatrixWorld(true);
      for (const a of attesa) {
        let b;
        if (a.box) b = a.box.clone().applyMatrix4(a.cornice.matrixWorld);
        else if (a.obj.parent) b = new THREE.Box3().setFromObject(a.obj);
        else b = new THREE.Box3().setFromObject(a.obj).applyMatrix4(a.cornice.matrixWorld);
        colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, v: null });
      }
      attesa.length = 0;
    },
  };
}

// ---------- renderer ----------
const app = document.getElementById('app');
const MOBILE = window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600;
if (window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.25 : 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.15, 120);

// ---------- architettura + arredi ----------
const arch = costruisciArchitettura(ctx);
ctx.pareti = new THREE.Group();
arch.walls.add(ctx.pareti);
scene.add(arch.walls, arch.wallsLow, arch.floors, arch.ceilings, arch.exterior, arch.terrazzo);
arch.wallsLow.visible = false;
const { comuni: gruppiArredi, varianti } = arredi(ctx, arch.stanze);
for (const g of gruppiArredi) scene.add(g);
for (const g of Object.values(varianti)) scene.add(g);

// ---------- piano terra: stesso edificio, un interpiano piu' sotto ----------
const terra = new THREE.Group();
terra.position.y = QUOTA_TERRA;
scene.add(terra);
const ctxT = contestoDifferito(terra, PIANO_TERRA.altezze.soffitto_cm / 100);
const archT = costruisciPianoTerra(ctxT);
ctxT.pareti = new THREE.Group();
archT.walls.add(ctxT.pareti);
terra.add(archT.walls, archT.wallsLow, archT.floors, archT.ceilings, archT.soletta, archT.esterno);
archT.wallsLow.visible = false;
archT.soletta.visible = false;
const arrediT = arredaPianoTerra(ctxT);
// appartamento dei suoceri: arredi nel riferimento del loro edificio
{
  const radice = new THREE.Group(), pareti = new THREE.Group();
  for (const g of [radice, pareti]) g.position.set(ORIGINE_SUOCERI[0], 0, ORIGINE_SUOCERI[1]);
  ctxT.pareti.add(pareti);
  arrediT.push(arredaSuoceri(ctxT, radice, pareti));
}
for (const g of arrediT) terra.add(g);
ctxT.risolvi();

// ---------- giardino tutto intorno, al piano del terreno ----------
const gGiardino = new THREE.Group();
gGiardino.position.y = QUOTA_TERRA;
scene.add(gGiardino);
const ctxG = contestoDifferito(gGiardino, 3);
ctx.esterno = true; // le sue luci restano accese di sera su entrambi i piani
gGiardino.add(giardino(ctxG));
ctx.esterno = false;
ctxG.risolvi();

// ---------- ottimizzazione: fonde le mesh statiche per materiale (meno draw call) ----------
function ottimizza(root) {
  root.updateMatrixWorld(true);
  // le geometrie fuse restano figlie di root: si portano nelle sue coordinate (root puo' essere spostato)
  const inv = root.matrixWorld.clone().invert();
  const rel = new THREE.Matrix4();
  const buckets = new Map();
  const daRimuovere = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.visible) { daRimuovere.push(o); return; }
    const metti = (material, geom) => {
      const key = `${material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`;
      if (!buckets.has(key)) buckets.set(key, { material, cast: o.castShadow, receive: o.receiveShadow, geoms: [] });
      geom.applyMatrix4(rel.multiplyMatrices(inv, o.matrixWorld));
      for (const name of Object.keys(geom.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geom.deleteAttribute(name);
      buckets.get(key).geoms.push(geom);
    };
    if (Array.isArray(o.material)) {
      // multi-materiale (muri esterni, solette, falde): si divide per gruppo di facce
      const geo = o.geometry;
      if (!geo.index || !geo.groups.length) return;
      for (const gr of geo.groups) {
        const mat = o.material[gr.materialIndex];
        if (!mat) continue;
        const sub = geo.clone();
        sub.setIndex(Array.from(geo.index.array.slice(gr.start, gr.start + gr.count)));
        sub.clearGroups();
        metti(mat, sub);
      }
    } else metti(o.material, o.geometry.clone());
    daRimuovere.push(o);
  });
  for (const o of daRimuovere) o.parent.remove(o);
  for (const b of buckets.values()) {
    const merged = BufferGeometryUtils.mergeGeometries(b.geoms, false);
    for (const g of b.geoms) g.dispose();
    const m = new THREE.Mesh(merged, b.material);
    m.castShadow = b.cast; m.receiveShadow = b.receive;
    root.add(m);
  }
}
for (const g of [arch.walls, arch.wallsLow, arch.floors, arch.ceilings, arch.exterior, arch.terrazzo, ...gruppiArredi, ...Object.values(varianti),
  archT.walls, archT.wallsLow, archT.floors, archT.ceilings, archT.soletta, archT.esterno, ...arrediT, gGiardino]) ottimizza(g);

// luci artificiali vicine tra loro (< 1.5 m) vengono fuse in una sola: meno luci nello shader
{
  const tenute = [];
  const pa = new THREE.Vector3(), pb = new THREE.Vector3();
  // ogni luce appartiene a un piano: si accende solo quando quel piano e' in vista
  for (const l of luciArtificiali) l.piano = l.light.getWorldPosition(pa).y < -0.3 ? 'terra' : 'primo';
  for (const l of luciArtificiali) {
    l.light.getWorldPosition(pa);
    // al piano terra (due appartamenti) si fonde piu' largo: le luci accese insieme restano poche
    const soglia = l.piano === 'terra' ? 2.4 : 1.5;
    const vicina = tenute.find((t) => t.v === l.v && t.piano === l.piano && t.esterno === l.esterno && t.light.getWorldPosition(pb).distanceTo(pa) < soglia);
    if (vicina) { vicina.base = Math.max(vicina.base, l.base) * 1.12; l.light.removeFromParent(); }
    else tenute.push(l);
  }
  luciArtificiali.length = 0;
  luciArtificiali.push(...tenute);
}

// ---------- luci ----------
const sole = new THREE.DirectionalLight('#fff1d6', 3.2);
sole.position.set(-9, 12, 14);
sole.target.position.set(5.2, 0, 5.5);
sole.castShadow = true;
sole.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
sole.shadow.camera.left = -12; sole.shadow.camera.right = 12;
sole.shadow.camera.top = 12; sole.shadow.camera.bottom = -12;
sole.shadow.camera.near = 1; sole.shadow.camera.far = 50;
sole.shadow.bias = -0.0004;
sole.shadow.normalBias = 0.05;
scene.add(sole, sole.target);
const cielo = new THREE.HemisphereLight('#dfe8f0', '#6b6350', 1.1);
scene.add(cielo);
const ambiente = new THREE.AmbientLight('#ffffff', 0.35);
scene.add(ambiente);
// riempimento interno morbido (compensa l'assenza di GI)
const riempimento = new THREE.DirectionalLight('#f4ecdf', 0.8);
riempimento.position.set(12, 8, -6);
scene.add(riempimento);

let giorno = true;
const FATTORE_SERA = 0.85; // di sera le lampade restano sotto la nominale: pozze di luce, non luce piatta

function applicaLuce() {
  if (giorno) {
    scene.background = new THREE.Color('#c9d6df');
    scene.fog = new THREE.Fog('#c9d6df', 40, 80);
    sole.color.set('#fff1d6');
    sole.position.set(-9, 12, 14);
    sole.intensity = 3.2;
    cielo.color.set('#dfe8f0'); cielo.groundColor.set('#6b6350'); cielo.intensity = 1.1;
    ambiente.color.set('#ffffff'); ambiente.intensity = 0.35;
    riempimento.color.set('#f4ecdf'); riempimento.intensity = 0.8;
    renderer.toneMappingExposure = 1.0;
    for (const l of luciArtificiali) l.light.visible = false;
    for (const e of emissivi) {
      e.bulb.material.emissiveIntensity = 0.12;
      if (e.shade) e.shade.emissiveIntensity = 0;
    }
  } else {
    // notte: la luna fa da unica direzionale con ombre, tutto il resto viene dalle lampade
    scene.background = new THREE.Color('#070b12');
    scene.fog = new THREE.Fog('#070b12', 26, 70);
    sole.color.set('#a9c2e6');
    sole.position.set(15, 11, -13);
    sole.intensity = 0.5;
    cielo.color.set('#31435e'); cielo.groundColor.set('#100d09'); cielo.intensity = 0.16;
    ambiente.color.set('#4a3a26'); ambiente.intensity = 0.06;
    riempimento.color.set('#2d3a52'); riempimento.intensity = 0.08;
    renderer.toneMappingExposure = 0.95;
    for (const l of luciArtificiali) {
      l.light.visible = l.esterno || l.piano === piano;
      l.light.intensity = l.base * FATTORE_SERA;
    }
    for (const e of emissivi) {
      e.bulb.material.emissiveIntensity = 1.5;
      if (e.shade) e.shade.emissiveIntensity = 0.3;
    }
  }
}
applicaLuce();

// ---------- controlli ----------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.minDistance = 0.5;
orbit.maxDistance = 45;
camera.position.set(-6, 12, 18);
orbit.target.set(5.2, 0.5, 5.2);

const fp = new PointerLockControls(camera, renderer.domElement);
const EYE = 1.65, RADIUS = 0.28;
let modoFP = false;
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
const pos = new THREE.Vector3(2.2, EYE, 5.6);

const quotaPiano = () => (piano === 'terra' ? QUOTA_TERRA : 0);

function blocca(x, z) {
  const q = quotaPiano();
  for (const c of colliders) {
    if (c.v && !attivi.has(c.v)) continue;
    if (c.minY >= q + EYE - 0.1 || c.maxY <= q + 0.3) continue;
    if (x + RADIUS > c.minX && x - RADIUS < c.maxX && z + RADIUS > c.minZ && z - RADIUS < c.maxZ) return true;
  }
  return false;
}

function aggiornaFP(dt) {
  const speed = (keys.ShiftLeft || keys.ShiftRight) ? 4.2 : 2.2;
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
  const mv = new THREE.Vector3();
  if (keys.KeyW || keys.ArrowUp) mv.add(fwd);
  if (keys.KeyS || keys.ArrowDown) mv.sub(fwd);
  if (keys.KeyD || keys.ArrowRight) mv.add(right);
  if (keys.KeyA || keys.ArrowLeft) mv.sub(right);
  if (mv.lengthSq() === 0) return;
  mv.normalize().multiplyScalar(speed * dt);
  const nx = pos.x + mv.x, nz = pos.z + mv.z;
  if (!blocca(nx, pos.z)) pos.x = nx;
  if (!blocca(pos.x, nz)) pos.z = nz;
  camera.position.set(pos.x, quotaPiano() + EYE, pos.z);
}

function entraFP() {
  modoFP = true;
  orbit.enabled = false;
  // senza elenco delle stanze si parte dal soggiorno del piano in vista, se il punto attuale e' occupato
  if (blocca(pos.x, pos.z) || Math.abs(pos.y - quotaPiano() - EYE) > 0.5) {
    vaiA('soggiorno');
    const v = vistePiano().soggiorno;
    camera.lookAt(v.fp[2], quotaPiano() + EYE - 0.1, v.fp[3]);
  }
  camera.position.set(pos.x, quotaPiano() + EYE, pos.z);
  document.body.classList.add('fp');
  document.getElementById('btn-fp').classList.add('on');
  document.getElementById('btn-orbit').classList.remove('on');
  fp.lock();
}
function esciFP() {
  modoFP = false;
  if (fp.isLocked) fp.unlock();
  orbit.enabled = true;
  document.body.classList.remove('fp');
  document.getElementById('btn-fp').classList.remove('on');
  document.getElementById('btn-orbit').classList.add('on');
  orbit.target.copy(pos).add(new THREE.Vector3(0, -0.6, 0));
  camera.position.copy(pos).add(new THREE.Vector3(2, 2.5, 2));
}
fp.addEventListener('unlock', () => { if (modoFP) esciFP(); });
renderer.domElement.addEventListener('click', () => { if (modoFP && !fp.isLocked) fp.lock(); });

// ---------- pannello ----------
const vistePrimo = {
  terrazzo: { fp: [2.7, -1.7, 5.4, -6.5], orbit: [4.9, -5.3, 4.9, 13.5, 3.5] },
  soggiorno: { fp: [2.0, 7.6, 2.0, 3.0], orbit: [2.2, 5.2, 5.5, 5.6, 6.5] },
  cucina: { fp: [3.2, 2.4, 0.9, 1.4], orbit: [1.9, 2.2, 4.5, 3.4, 3.8] },
  bagno: { fp: [5.7, 2.6, 4.4, 1.0], orbit: [5.15, 1.5, 6.2, 4.6, 4.9] },
  disimpegno: { fp: [5.3, 4.9, 6.0, 3.4], orbit: [5.3, 4.1, 6.4, 4.4, 5.9] },
  camera_nord: { fp: [7.0, 3.5, 9.2, 2.0], orbit: [8.2, 2.3, 10.3, 5.0, 4.9] },
  camera_est: { fp: [9.6, 5.9, 7.4, 4.8], orbit: [8.4, 5.2, 11.4, 6.4, 7.6] },
  camera_sud: { fp: [7.0, 8.5, 9.3, 7.2], orbit: [8.2, 8.2, 10.5, 9.5, 11.2] },
};
// piano terra: altezze riferite al pavimento del piano
const visteTerra = {
  cucina: { fp: [3.7, 6.9, 0.9, 8.6], orbit: [2.2, 7.6, 5.6, 4.2, 4.4] },
  soggiorno: { fp: [6.7, 7.0, 9.8, 9.9], orbit: [8.2, 8.5, 4.8, 4.4, 12.8] },
  ingresso: { fp: [5.1, 9.0, 3.0, 7.0], orbit: [5.1, 7.9, 6.6, 4.4, 12.9] },
  camera_3: { fp: [6.8, 1.0, 9.6, 3.6], orbit: [8.4, 2.2, 12.2, 4.6, 5.6] },
  bagno: { fp: [6.6, 4.9, 9.8, 5.9], orbit: [8.2, 5.2, 11.0, 4.6, 8.4] },
  camera_1: { fp: [3.7, 3.4, 1.0, 0.8], orbit: [2.2, 1.4, -2.2, 4.6, 4.6] },
  camera_2: { fp: [3.9, 4.6, 0.9, 3.4], orbit: [2.2, 4.2, -2.4, 4.6, 7.4] },
  disimpegno: { fp: [5.2, 5.1, 5.2, 0.9], orbit: [5.2, 2.8, 5.2, 6.0, 8.4] },
};
const vistePiano = () => (piano === 'terra' ? visteTerra : vistePrimo);
function vaiA(k) {
  const v = vistePiano()[k];
  const q = quotaPiano();
  pos.set(v.fp[0], q + EYE, v.fp[1]);
  if (modoFP) {
    camera.position.copy(pos);
    camera.lookAt(v.fp[2], q + EYE - 0.1, v.fp[3]);
  } else {
    orbit.target.set(v.orbit[0], q + 1.0, v.orbit[1]);
    camera.position.set(v.orbit[2], q + v.orbit[3], v.orbit[4]);
  }
}
// ---------- tavolo da pranzo: chiuso o aperto ----------
let statoTavolo = 'aperto';
const attivi = new Set(); // i tag dei gruppi accesi in questo momento
const bottoniTavolo = { chiuso: document.getElementById('btn-t-chiuso'), aperto: document.getElementById('btn-t-aperto') };
const notaTavolo = document.getElementById('nota-tavolo');
function applicaAllestimento() {
  attivi.clear();
  attivi.add(statoTavolo);
  for (const [tag, g] of Object.entries(varianti)) g.visible = piano === 'primo' && attivi.has(tag);
  for (const k of Object.keys(bottoniTavolo)) bottoniTavolo[k].classList.toggle('on', k === statoTavolo);
  notaTavolo.textContent = TAVOLO_STATI[statoTavolo].nota;
}
function applicaTavolo(t) { statoTavolo = t; applicaAllestimento(); }
for (const k of Object.keys(bottoniTavolo)) {
  bottoniTavolo[k].textContent = TAVOLO_STATI[k].nome;
  bottoniTavolo[k].onclick = () => applicaTavolo(k);
}
applicaAllestimento();

document.getElementById('btn-orbit').onclick = () => esciFP();
const apri = document.getElementById('apri-pannello');
apri.onclick = () => { const on = document.body.classList.toggle('pannello-aperto'); apri.textContent = on ? 'Chiudi' : 'Menu'; };
document.getElementById('btn-fp').onclick = () => entraFP();
const bt = document.getElementById('btn-tetto');
const bp = document.getElementById('btn-pareti');
let tettoOn = true, paretiIntere = true;
// Visibilita' dei due piani. In vista del piano primo il piano terra resta intero sotto
// (e' la facciata); in vista del piano terra il piano primo sparisce, restano gli esterni.
function applicaVisibilita() {
  const t = piano === 'terra';
  arch.walls.visible = !t && paretiIntere;
  arch.wallsLow.visible = !t && !paretiIntere;
  arch.floors.visible = !t;
  arch.ceilings.visible = !t && tettoOn;
  // il terrazzo e' il tetto dei suoceri: in vista del piano terra c'e' solo con il tetto acceso
  arch.terrazzo.visible = !t || tettoOn;
  for (const g of gruppiArredi) g.visible = !t || (!!g.userData.esterno && tettoOn);
  applicaAllestimento();
  archT.walls.visible = !t || paretiIntere;
  archT.wallsLow.visible = t && !paretiIntere;
  archT.ceilings.visible = !t || tettoOn;
  archT.soletta.visible = t && tettoOn;
  bt.classList.toggle('on', tettoOn);
  bp.classList.toggle('on', paretiIntere);
  applicaLuce();
}
bt.onclick = () => { tettoOn = !tettoOn; applicaVisibilita(); };
bp.onclick = () => {
  paretiIntere = !paretiIntere;
  if (!paretiIntere) tettoOn = false;
  applicaVisibilita();
};

// ---------- piano in vista ----------
const bottoniPiano = { primo: document.getElementById('btn-primo'), terra: document.getElementById('btn-terra') };
function cambiaPiano(p) {
  if (p === piano) return;
  const dq = (p === 'terra' ? QUOTA_TERRA : 0) - quotaPiano();
  piano = p;
  for (const k of Object.keys(bottoniPiano)) bottoniPiano[k].classList.toggle('on', k === piano);
  document.getElementById('sez-allestimento').style.display = piano === 'terra' ? 'none' : '';
  if (piantinaEl) { piantinaEl.remove(); piantinaEl = null; }
  applicaVisibilita();
  // la vista scende (o sale) di un piano; in prima persona si entra nella prima stanza del piano
  if (modoFP) vaiA('soggiorno');
  else { orbit.target.y += dq; camera.position.y += dq; }
}
for (const k of Object.keys(bottoniPiano)) bottoniPiano[k].onclick = () => cambiaPiano(k);
const bg = document.getElementById('btn-giorno');
bg.onclick = () => { giorno = !giorno; applicaLuce(); bg.classList.toggle('on', giorno); bg.textContent = giorno ? 'Luce del giorno' : 'Luce della sera'; };

// ---------- piantina quotata: pannello 2D separato, il modello resta intatto ----------
let piantinaEl = null;
let piantinaAperta = false;
const btnPiantina = document.getElementById('btn-piantina');
function mostraPiantina(on) {
  if (on && !piantinaEl) {
    piantinaEl = creaPiantina(piano === 'terra' ? [PIANO_TERRA, PIANO_SUOCERI] : undefined);
    document.body.appendChild(piantinaEl);
    piantinaEl.querySelector('#pg-chiudi').onclick = () => mostraPiantina(false);
    piantinaEl.querySelector('#pg-stampa').onclick = () => window.print();
  }
  piantinaAperta = on;
  document.body.classList.toggle('piantina', on);
  btnPiantina.classList.toggle('on', on);
  btnPiantina.textContent = on ? 'Torna al modello 3D' : 'Piantina quotata';
  if (on && modoFP) esciFP();
  if (!on) { tPrev = performance.now(); loop(); }
}
btnPiantina.onclick = () => mostraPiantina(!piantinaAperta);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && piantinaAperta) mostraPiantina(false); });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loop ----------
let tPrev = performance.now();
const fpsEl = document.getElementById('fps');
let frames = 0, acc = 0;
function loop() {
  if (piantinaAperta) return; // niente rendering mentre si guarda la piantina
  const tNow = performance.now();
  const dt = Math.min((tNow - tPrev) / 1000, 0.05);
  tPrev = tNow;
  if (modoFP) aggiornaFP(dt); else orbit.update();
  renderer.render(scene, camera);
  frames++; acc += dt;
  if (acc > 0.5) { fpsEl.textContent = `${Math.round(frames / acc)} fps`; frames = 0; acc = 0; }
  requestAnimationFrame(loop);
}
loop();
window.__casa = { scene, camera, renderer, colliders, vaiA, arch, archT, blocca, pos, orbit, varianti, applicaTavolo, cambiaPiano, luci: luciArtificiali };
