// Scena, luci, controlli (orbita + prima persona con collisioni), pannello laterale.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { costruisciArchitettura, H } from './architettura.js';
import { arredi, TAVOLO_STATI, VERSIONI } from './arredi/index.js';
import { creaPiantina } from './piantina.js';
import { costruisciPianoTerra, PIANO_TERRA, PIANO_SUOCERI, QUOTA_TERRA, ORIGINE_SUOCERI } from './pianoTerra.js';
import { arredaPianoTerra } from './arredi/piano_terra.js';
import { arredaSuoceri } from './arredi/suoceri.js';
import { giardino } from './arredi/giardino.js';
import { conSmusso, raggioSmusso } from './arredi/comune.js';
import { posizioneSole, direzioneSole, albaTramonto, puntoCardinale, hhmm, MESI, LUOGO } from './sole.js';
import { creaTour } from './tour.js';
import { creaMusica } from './musica.js';

// ---------- schermata di caricamento: la costruzione procede a tappe, la barra avanza ----------
const caricamento = document.getElementById('caricamento');
async function passo(testo, frazione) {
  caricamento.querySelector('.c-stato').textContent = testo;
  caricamento.style.setProperty('--avanzamento', frazione);
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
}

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
raggioSmusso(MOBILE ? 0 : 0.012); // spigoli arrotondati: solo dove la scheda grafica regge i triangoli in piu'
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
// luce d'ambiente riflessa: uno studio luminoso. Su tutto arriva appena (scene.environment
// tenue, se no gli intonaci sbiancano); ottone, ferro, vetri, ceramiche, smalti e pietra lucida
// lo riflettono pieno (envMap propria, assegnata dopo la costruzione: vedi lucidi).
const ambienteRiflesso = (() => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const t = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return t;
})();
scene.environment = ambienteRiflesso;
const lucidi = new Set();

// ---------- qualita': alta (ombre di contatto, bagliore delle lampade di sera) o leggera ----------
// Su telefono si parte leggeri; il pulsante nel pannello cambia al volo.
let qualita = MOBILE ? 'leggera' : 'alta';
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
// ombre di contatto (ambient occlusion): angoli, piedi dei mobili, fughe
const gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 1.0;
gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 1.2, distanceFallOff: 1, scale: 1, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
composer.addPass(gtao);
// bagliore di lampadine e paralumi, solo di sera
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.25, 0.2, 2.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- architettura + arredi ----------
await passo('Il piano primo', 0.15);
const arch = costruisciArchitettura(ctx);
ctx.pareti = new THREE.Group();
arch.walls.add(ctx.pareti);
scene.add(arch.walls, arch.wallsLow, arch.floors, arch.ceilings, arch.exterior, arch.terrazzo);
arch.wallsLow.visible = false;
// le due versioni del muro fra soggiorno e seconda camera: ognuna con il suo gruppo per i pezzi
// appesi ai muri; si uniscono ai muri dopo l'ottimizzazione, per accenderle una alla volta
const versioni = arch.versioni;
const paretiVersione = {};
for (const [tag, v] of Object.entries(versioni)) { paretiVersione[tag] = new THREE.Group(); v.walls.add(paretiVersione[tag]); }
const { comuni: gruppiArredi, varianti } = conSmusso(() => arredi(ctx, arch.stanze, paretiVersione));
for (const g of gruppiArredi) scene.add(g);
for (const g of Object.values(varianti)) scene.add(g);

// ---------- piano terra: stesso edificio, un interpiano piu' sotto ----------
await passo('Il piano terra e la casa dei suoceri', 0.45);
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
const arrediT = conSmusso(() => arredaPianoTerra(ctxT));
// appartamento dei suoceri: arredi nel riferimento del loro edificio
{
  const radice = new THREE.Group(), pareti = new THREE.Group();
  for (const g of [radice, pareti]) g.position.set(ORIGINE_SUOCERI[0], 0, ORIGINE_SUOCERI[1]);
  ctxT.pareti.add(pareti);
  arrediT.push(conSmusso(() => arredaSuoceri(ctxT, radice, pareti)));
}
for (const g of arrediT) terra.add(g);
ctxT.risolvi();

// ---------- giardino tutto intorno, al piano del terreno ----------
await passo('Il giardino', 0.65);
const gGiardino = new THREE.Group();
gGiardino.position.y = QUOTA_TERRA;
scene.add(gGiardino);
const ctxG = contestoDifferito(gGiardino, 3);
ctx.esterno = true; // le sue luci restano accese di sera su entrambi i piani
gGiardino.add(conSmusso(() => giardino(ctxG)));
ctx.esterno = false;
ctxG.risolvi();

// ---------- ottimizzazione: fonde le mesh statiche per materiale (meno draw call) ----------
await passo('Gli ultimi ritocchi', 0.82);
function ottimizza(root) {
  root.updateMatrixWorld(true);
  // le geometrie fuse restano figlie di root: si portano nelle sue coordinate (root puo' essere spostato)
  const inv = root.matrixWorld.clone().invert();
  const rel = new THREE.Matrix4();
  const buckets = new Map();
  const daRimuovere = [];
  // i pezzi mobili (le ante della vetrata) restano fuori: si fondono a parte, uno per uno
  const visita = (o, fn) => { if (o !== root && o.userData.mobile) return; fn(o); for (const c of o.children) visita(c, fn); };
  visita(root, (o) => {
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
  archT.walls, archT.wallsLow, archT.floors, archT.ceilings, archT.soletta, archT.esterno, ...arrediT, gGiardino,
  ...Object.values(versioni).flatMap((v) => [v.walls, v.low])]) ottimizza(g);
for (const v of Object.values(versioni)) { arch.walls.add(v.walls); arch.wallsLow.add(v.low); }
// la vetrata: ogni anta si fonde per conto suo e resta libera di scorrere
const vetrata = versioni.v2.vetrata;
for (const a of vetrata.userData.ante) ottimizza(a);
ottimizza(vetrata);
versioni.v2.walls.add(vetrata);

// materiali lucidi o metallici: riflettono l'ambiente per intero
scene.traverse((o) => {
  if (!o.isMesh) return;
  for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
    if (m.isMeshStandardMaterial && !m.envMap && (m.metalness > 0.3 || m.roughness < 0.5)) { m.envMap = ambienteRiflesso; lucidi.add(m); }
  }
});

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
// il sole: posizione vera per luogo, mese e ora (sole.js); le ombre coprono casa, suoceri e giardino
const CENTRO = new THREE.Vector3(5.2, 0, -2.5);
const sole = new THREE.DirectionalLight('#fff1d6', 3.2);
sole.position.set(-9, 12, 14);
sole.target.position.copy(CENTRO);
sole.castShadow = true;
sole.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
sole.shadow.camera.left = -22; sole.shadow.camera.right = 22;
sole.shadow.camera.top = 22; sole.shadow.camera.bottom = -22;
sole.shadow.camera.near = 1; sole.shadow.camera.far = 70;
sole.shadow.bias = -0.0004;
sole.shadow.normalBias = 0.05;
sole.shadow.radius = 4; // bordi delle ombre morbidi
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
// giorno dell'anno e ora del sole: di partenza il mese corrente, alle 11
const statoSole = { mese0: new Date().getMonth(), ora: 11 };
const soleAdesso = () => posizioneSole(statoSole);
const C_TRAMONTO = new THREE.Color('#ffa75e'), C_MEZZODI = new THREE.Color('#fff1d6');
const CIELO_TRAMONTO = new THREE.Color('#e7c3a2'), CIELO_GIORNO = new THREE.Color('#c9d6df');
const FATTORE_SERA = 0.85; // di sera le lampade restano sotto la nominale: pozze di luce, non luce piatta

function applicaLuce() {
  if (giorno) {
    // sole vero: basso e caldo all'alba e al tramonto, alto e bianco a mezzogiorno
    const s = soleAdesso(), d = direzioneSole(s);
    const f = THREE.MathUtils.smoothstep(s.altezza, -1, 28);
    const sfondo = CIELO_TRAMONTO.clone().lerp(CIELO_GIORNO, f);
    scene.background = sfondo;
    scene.fog = new THREE.Fog(sfondo, 45, 90);
    sole.color.copy(C_TRAMONTO).lerp(C_MEZZODI, f);
    sole.position.set(CENTRO.x + d.x * 35, CENTRO.y + Math.max(d.y, 0.03) * 35, CENTRO.z + d.z * 35);
    sole.intensity = 3.2 * (0.3 + 0.7 * f);
    // parte della luce diffusa ora arriva dall'ambiente riflesso: emisfero e ambiente calano
    cielo.color.set('#dfe8f0'); cielo.groundColor.set('#6b6350'); cielo.intensity = 0.95 * (0.5 + 0.5 * f);
    ambiente.color.set('#ffffff'); ambiente.intensity = 0.22;
    riempimento.color.set('#f4ecdf'); riempimento.intensity = 0.8;
    renderer.toneMappingExposure = 1.0;
    scene.environmentIntensity = 0.15;
    for (const m of lucidi) m.envMapIntensity = 1.0;
    bloom.enabled = false;
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
    scene.environmentIntensity = 0.02;
    for (const m of lucidi) m.envMapIntensity = 0.12;
    bloom.enabled = true;
    for (const l of luciArtificiali) {
      l.light.visible = (l.esterno || l.piano === piano) && (!l.v || attivi.has(l.v));
      l.light.intensity = l.base * FATTORE_SERA;
    }
    for (const e of emissivi) {
      e.bulb.material.emissiveIntensity = 4.0; // solo lampadine e brace superano la soglia del bagliore
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
  if (mv.lengthSq() > 0) mv.normalize();
  mv.addScaledVector(fwd, -joy.y).addScaledVector(right, joy.x); // joystick: anche piano piano
  if (mv.lengthSq() < 0.0004) return;
  if (mv.length() > 1) mv.normalize();
  mv.multiplyScalar(speed * dt);
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
  if (TOCCO) {
    // su telefono: niente puntatore catturato; joystick per camminare, dito sullo schermo per guardare
    sguardo.setFromQuaternion(camera.quaternion, 'YXZ');
    joy.base.classList.add('attivo');
  } else fp.lock();
}
function esciFP() {
  modoFP = false;
  if (fp.isLocked) fp.unlock();
  orbit.enabled = true;
  document.body.classList.remove('fp');
  document.getElementById('btn-fp').classList.remove('on');
  document.getElementById('btn-orbit').classList.add('on');
  joy.base.classList.remove('attivo');
  // la camera si alza e arretra con un volo, guardando dove si era
  orbit.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
  vola(pos.clone().add(new THREE.Vector3(2, 2.5, 2)), pos.clone().add(new THREE.Vector3(0, -0.6, 0)), 1.0);
}
fp.addEventListener('unlock', () => { if (modoFP && !TOCCO) esciFP(); });
renderer.domElement.addEventListener('click', () => { if (modoFP && !TOCCO && !fp.isLocked) fp.lock(); });

// ---------- prima persona al tocco: joystick a sinistra, sguardo trascinando altrove ----------
const TOCCO = window.matchMedia('(pointer: coarse)').matches;
const sguardo = new THREE.Euler(0, 0, 0, 'YXZ');
const joy = { base: document.getElementById('joy'), pomello: document.querySelector('#joy .pomello'), x: 0, y: 0, id: null };
{
  const R = 46;
  const muovi = (t) => {
    const r = joy.base.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > R) { dx *= R / l; dy *= R / l; }
    joy.x = dx / R; joy.y = dy / R;
    joy.pomello.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const rilascia = () => { joy.id = null; joy.x = joy.y = 0; joy.pomello.style.transform = ''; };
  joy.base.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; joy.id = t.identifier; muovi(t); }, { passive: false });
  joy.base.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === joy.id) muovi(t); }, { passive: false });
  joy.base.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === joy.id) rilascia(); });
  joy.base.addEventListener('touchcancel', rilascia);
  // sguardo: un dito che trascina sulla scena gira la testa
  let idS = null, ux = 0, uy = 0;
  const tela = renderer.domElement;
  tela.addEventListener('touchstart', (e) => {
    if (!modoFP || idS !== null) return;
    const t = e.changedTouches[0]; idS = t.identifier; ux = t.clientX; uy = t.clientY;
  }, { passive: true });
  tela.addEventListener('touchmove', (e) => {
    if (!modoFP) return;
    for (const t of e.changedTouches) if (t.identifier === idS) {
      sguardo.y -= (t.clientX - ux) * 0.005;
      sguardo.x = THREE.MathUtils.clamp(sguardo.x - (t.clientY - uy) * 0.004, -1.2, 1.2);
      ux = t.clientX; uy = t.clientY;
      camera.quaternion.setFromEuler(sguardo);
    }
  }, { passive: true });
  tela.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === idS) idS = null; });
  document.getElementById('esci-fp').onclick = () => esciFP();
}

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
// ---------- allestimento: versione del piano primo, vetrata, tavolo da pranzo ----------
let statoTavolo = 'aperto';
let versione = 'v1';          // 'v1' seconda camera | 'v2' open space gaming e allenamento
let vetrataChiusa = false;    // solo in V2
let vetrataK = 0;             // posizione delle ante: 0 aperta, 1 chiusa (scorre verso vetrataChiusa)
let attesaVetrata = 0;        // secondi prima che le ante partano (nel tour)
const attivi = new Set(); // i tag dei gruppi accesi in questo momento
const bottoniTavolo = { chiuso: document.getElementById('btn-t-chiuso'), aperto: document.getElementById('btn-t-aperto') };
const notaTavolo = document.getElementById('nota-tavolo');
const bottoniVersione = { v1: document.getElementById('btn-v1'), v2: document.getElementById('btn-v2') };
const btnVetrata = document.getElementById('btn-vetrata');
const notaVersione = document.getElementById('nota-versione');
function applicaAllestimento() {
  attivi.clear();
  attivi.add(statoTavolo);
  attivi.add(versione);
  if (versione === 'v2' && vetrataChiusa) attivi.add('vetrata'); // la vetrata chiusa ferma il passo
  for (const [tag, g] of Object.entries(varianti)) g.visible = piano === 'primo' && attivi.has(tag);
  for (const [tag, v] of Object.entries(versioni)) v.walls.visible = v.low.visible = attivi.has(tag);
  for (const k of Object.keys(bottoniTavolo)) bottoniTavolo[k].classList.toggle('on', k === statoTavolo);
  for (const k of Object.keys(bottoniVersione)) bottoniVersione[k].classList.toggle('on', k === versione);
  btnVetrata.style.display = versione === 'v2' ? '' : 'none';
  btnVetrata.textContent = vetrataChiusa ? 'Apri la vetrata' : 'Chiudi la vetrata';
  btnVetrata.classList.toggle('on', vetrataChiusa);
  notaTavolo.textContent = TAVOLO_STATI[statoTavolo].nota;
  notaVersione.textContent = VERSIONI[versione].nota;
}
function applicaTavolo(t) { statoTavolo = t; applicaAllestimento(); }
// subito: le ante vanno in posizione senza scorrere (link, tour)
function applicaVersione(v, { chiusa = vetrataChiusa, subito = false } = {}) {
  versione = v; vetrataChiusa = chiusa;
  if (subito) { vetrataK = chiusa ? 1 : 0; vetrata.userData.imposta(vetrataK); }
  applicaAllestimento();
  applicaLuce(); // di sera si accendono le lampade della versione in vista
}
for (const k of Object.keys(bottoniTavolo)) {
  bottoniTavolo[k].textContent = TAVOLO_STATI[k].nome;
  bottoniTavolo[k].onclick = () => applicaTavolo(k);
}
for (const k of Object.keys(bottoniVersione)) {
  bottoniVersione[k].textContent = VERSIONI[k].nome;
  bottoniVersione[k].onclick = () => applicaVersione(k);
}
btnVetrata.onclick = () => { vetrataChiusa = !vetrataChiusa; applicaAllestimento(); };
// le ante scorrono insieme in circa un secondo e mezzo
function aggiornaVetrata(dt) {
  const meta = vetrataChiusa ? 1 : 0;
  if (vetrataK === meta) return;
  if (attesaVetrata > 0) { attesaVetrata -= dt; return; }
  vetrataK = meta > vetrataK ? Math.min(meta, vetrataK + dt / 1.6) : Math.max(meta, vetrataK - dt / 1.6);
  const k = vetrataK * vetrataK * (3 - 2 * vetrataK);
  vetrata.userData.imposta(k);
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
function cambiaPiano(p, subito = false) {
  if (p === piano) return;
  const dq = (p === 'terra' ? QUOTA_TERRA : 0) - quotaPiano();
  piano = p;
  for (const k of Object.keys(bottoniPiano)) bottoniPiano[k].classList.toggle('on', k === piano);
  document.getElementById('sez-allestimento').style.display = piano === 'terra' ? 'none' : '';
  if (piantinaEl) { piantinaEl.remove(); piantinaEl = null; }
  applicaVisibilita();
  // la vista scende (o sale) di un piano; in prima persona si entra nella prima stanza del piano
  if (subito) return;
  if (modoFP) vaiA('soggiorno');
  else {
    const su = new THREE.Vector3(0, dq, 0);
    vola(camera.position.clone().add(su), orbit.target.clone().add(su), 1.1);
  }
}
for (const k of Object.keys(bottoniPiano)) bottoniPiano[k].onclick = () => cambiaPiano(k);
const bg = document.getElementById('btn-giorno');
const bq = document.getElementById('btn-qualita');
function applicaQualita() {
  bq.classList.toggle('on', qualita === 'alta');
  bq.textContent = qualita === 'alta' ? 'Qualità alta' : 'Qualità leggera';
}
bq.onclick = () => { qualita = qualita === 'alta' ? 'leggera' : 'alta'; applicaQualita(); };
applicaQualita();
function impostaGiorno(g) {
  giorno = g;
  bg.classList.toggle('on', giorno);
  bg.textContent = giorno ? 'Luce del giorno' : 'Luce della sera';
  applicaLuce();
}
// tornando al giorno con il sole gia' tramontato si riparte dalle 11
bg.onclick = () => {
  if (!giorno && soleAdesso().altezza <= -1) statoSole.ora = 11;
  impostaGiorno(!giorno);
  aggiornaSoleUI();
};

// ---------- sole: ora e mese, sul luogo della casa ----------
const slOra = document.getElementById('sl-ora'), slMese = document.getElementById('sl-mese');
const outOra = document.getElementById('out-ora'), outMese = document.getElementById('out-mese');
const notaSole = document.getElementById('nota-sole');
function aggiornaSoleUI() {
  slOra.value = statoSole.ora; slMese.value = statoSole.mese0;
  outOra.textContent = hhmm(statoSole.ora);
  outMese.textContent = `21 ${MESI[statoSole.mese0]}`;
  const s = soleAdesso();
  const { alba, tramonto } = albaTramonto(statoSole.mese0);
  const dove = s.altezza > -0.83 ? `Sole a ${puntoCardinale(s.azimut)}, ${Math.round(s.altezza)}° sull'orizzonte.` : 'Il sole è tramontato: luce della sera.';
  notaSole.textContent = `${dove} Alba ${hhmm(alba)}, tramonto ${hhmm(tramonto)}. ${LUOGO.comune}${LUOGO.provvisorio ? ' (luogo provvisorio)' : ''}.`;
}
function impostaSole(ora, mese0) {
  statoSole.ora = ora; statoSole.mese0 = mese0;
  impostaGiorno(soleAdesso().altezza > -1); // dopo il tramonto si passa da soli alla sera
  aggiornaSoleUI();
}
slOra.oninput = () => impostaSole(+slOra.value, statoSole.mese0);
slMese.oninput = () => impostaSole(statoSole.ora, +slMese.value);
aggiornaSoleUI();

// ---------- voli di camera: niente salti fra un punto e l'altro ----------
let volo = null;
function vola(p, mira, durata = 1.2) {
  volo = { p0: camera.position.clone(), m0: orbit.target.clone(), p1: p, m1: mira, t: 0, d: durata };
}
function aggiornaVolo(dt) {
  volo.t = Math.min(1, volo.t + dt / volo.d);
  const k = volo.t * volo.t * (3 - 2 * volo.t);
  camera.position.lerpVectors(volo.p0, volo.p1, k);
  orbit.target.lerpVectors(volo.m0, volo.m1, k);
  camera.lookAt(orbit.target);
  if (volo.t >= 1) { volo = null; orbit.update(); }
}

// ---------- tour guidato con musica ----------
const musica = creaMusica();
let musicaVoluta = true;
const didascalia = document.getElementById('didascalia');
const btnMusica = document.getElementById('tour-musica');
let primaDelTour = null;
const tour = creaTour({
  camera, orbit, velo: document.getElementById('velo'), didascalia,
  titolo: didascalia.querySelector('.d-titolo'), testo: didascalia.querySelector('.d-testo'),
  prepara(sc) {
    cambiaPiano(sc.piano, true);
    volo = null;
    // ogni scatto mostra la sua versione (di norma quella che si stava guardando)
    const v = sc.versione || primaDelTour.versione;
    applicaVersione(v, { chiusa: sc.vetrata === 'chiusa' || (!sc.versione && primaDelTour.vetrataChiusa), subito: true });
    if (sc.vetrata === 'scorre') { vetrataChiusa = true; attesaVetrata = 4.5; applicaAllestimento(); } // si chiude sotto gli occhi
    if (sc.sera) impostaGiorno(false);
    else { statoSole.ora = sc.ora; impostaGiorno(true); }
    aggiornaSoleUI();
  },
  fine() {
    const p = primaDelTour;
    cambiaPiano(p.piano, true);
    tettoOn = p.tettoOn; paretiIntere = p.paretiIntere;
    applicaVersione(p.versione, { chiusa: p.vetrataChiusa, subito: true });
    applicaVisibilita();
    statoSole.ora = p.ora; statoSole.mese0 = p.mese0;
    impostaGiorno(p.giorno);
    aggiornaSoleUI();
    camera.position.copy(p.p); orbit.target.copy(p.m);
    orbit.enabled = true; orbit.update();
    document.body.classList.remove('in-tour');
    musica.ferma();
  },
});
function avviaTour() {
  if (modoFP) esciFP();
  if (piantinaAperta) mostraPiantina(false);
  primaDelTour = { piano, versione, vetrataChiusa, giorno, ora: statoSole.ora, mese0: statoSole.mese0, tettoOn, paretiIntere, p: camera.position.clone(), m: orbit.target.clone() };
  tettoOn = true; paretiIntere = true;
  applicaVisibilita();
  volo = null; orbit.enabled = false;
  document.body.classList.add('in-tour');
  document.body.classList.remove('pannello-aperto');
  apri.textContent = 'Menu';
  if (musicaVoluta) musica.avvia();
  tour.avvia();
}
const aggiornaBtnMusica = () => { btnMusica.textContent = musicaVoluta ? 'Musica: sì' : 'Musica: no'; };
btnMusica.onclick = () => { musicaVoluta = !musicaVoluta; aggiornaBtnMusica(); if (musicaVoluta) musica.avvia(); else musica.ferma(); };
aggiornaBtnMusica();
document.getElementById('btn-tour').onclick = avviaTour;
document.getElementById('tour-esci').onclick = () => tour.ferma();
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tour.attivo) tour.ferma(); });

// ---------- link a questa vista: piano, camera, sole, tavolo ----------
const avviso = document.getElementById('avviso');
function mostraAvviso(testo) {
  avviso.textContent = testo;
  avviso.classList.add('vista');
  clearTimeout(mostraAvviso.t);
  mostraAvviso.t = setTimeout(() => avviso.classList.remove('vista'), 2600);
}
function linkVista() {
  const f = (v) => v.toArray().map((x) => x.toFixed(2)).join(',');
  const m = modoFP ? camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3())) : orbit.target;
  const q = new URLSearchParams({ piano, c: f(camera.position), t: f(m), ora: statoSole.ora, mese: statoSole.mese0 + 1, luce: giorno ? 'giorno' : 'sera', tavolo: statoTavolo, versione: versione.slice(1) });
  if (versione === 'v2') q.set('vetrata', vetrataChiusa ? 'chiusa' : 'aperta');
  return `${location.origin}${location.pathname}#${q}`;
}
document.getElementById('btn-link').onclick = () => {
  const url = linkVista();
  history.replaceState(null, '', url);
  const ok = () => mostraAvviso('Link copiato: riapre esattamente questa vista');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(ok, () => window.prompt('Copia il link di questa vista', url));
  else window.prompt('Copia il link di questa vista', url);
};
function leggiLink() {
  const h = location.hash.slice(1);
  if (!h) return;
  const q = new URLSearchParams(h);
  const vec = (k) => { const a = (q.get(k) || '').split(',').map(Number); return a.length === 3 && a.every(Number.isFinite) ? new THREE.Vector3(...a) : null; };
  if (q.get('piano') === 'terra' || q.get('piano') === 'primo') cambiaPiano(q.get('piano'), true);
  if (TAVOLO_STATI[q.get('tavolo')]) applicaTavolo(q.get('tavolo'));
  if (VERSIONI['v' + q.get('versione')]) applicaVersione('v' + q.get('versione'), { chiusa: q.get('vetrata') === 'chiusa', subito: true });
  const ora = +q.get('ora'), mese = +q.get('mese');
  if (ora >= 5 && ora <= 22) statoSole.ora = ora;
  if (mese >= 1 && mese <= 12) statoSole.mese0 = mese - 1;
  impostaGiorno(q.get('luce') === 'sera' ? false : soleAdesso().altezza > -1);
  aggiornaSoleUI();
  const c = vec('c'), t = vec('t');
  if (c && t) { camera.position.copy(c); orbit.target.copy(t); orbit.update(); }
}

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
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loop ----------
let tPrev = performance.now();
const fpsEl = document.getElementById('fps');
let frames = 0, acc = 0;
function loop() {
  if (piantinaAperta) return; // niente rendering mentre si guarda la piantina
  const tNow = performance.now();
  const dtVero = (tNow - tPrev) / 1000;
  const dt = Math.min(dtVero, 0.05);
  tPrev = tNow;
  // il tour va a tempo vero anche se i fotogrammi sono pochi: la musica non aspetta
  if (tour.aggiorna(Math.min(dtVero, 0.25))) { /* il tour muove la camera */ }
  else if (modoFP) aggiornaFP(dt);
  else if (volo) aggiornaVolo(dt);
  else orbit.update();
  aggiornaVetrata(tour.attivo ? Math.min(dtVero, 0.25) : dt);
  if (qualita === 'alta') composer.render(dt);
  else renderer.render(scene, camera);
  frames++; acc += dt;
  if (acc > 0.5) { fpsEl.textContent = `${Math.round(frames / acc)} fps`; frames = 0; acc = 0; }
  requestAnimationFrame(loop);
}
leggiLink();
loop();
caricamento.style.setProperty('--avanzamento', 1);
requestAnimationFrame(() => { caricamento.classList.add('fatto'); setTimeout(() => caricamento.remove(), 1400); });
window.__casa = { applicaVersione, vetrata, tour, vola, impostaSole, statoSole, linkVista, composer, gtao, bloom, scene, camera, renderer, colliders, vaiA, arch, archT, blocca, pos, orbit, varianti, applicaTavolo, cambiaPiano, luci: luciArtificiali };
