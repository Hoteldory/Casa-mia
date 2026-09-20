// Scena, luci, controlli (orbita + prima persona con collisioni), pannello laterale.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { costruisciArchitettura, H } from './architettura.js';
import { arredi } from './arredi/index.js';

// ---------- contesto condiviso ----------
const colliders = []; // {minX,maxX,minZ,maxZ,minY,maxY}
const luciArtificiali = []; // {light, base, bulb}
const ctx = {
  H,
  addCollider(mesh) {
    mesh.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(mesh);
    colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y });
  },
  addColliderBox(minX, maxX, minZ, maxZ, minY = 0, maxY = 2) {
    colliders.push({ minX, maxX, minZ, maxZ, minY, maxY });
  },
  // ingombro solido di un arredo (in coordinate mondo, da chiamare dopo il posizionamento)
  solid(obj) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y });
    return obj;
  },
  addLight(light, bulb) {
    light.castShadow = false;
    luciArtificiali.push({ light, base: light.intensity, bulb });
  },
  pareti: null, // gruppo per elementi appesi ai muri (boiserie, carta, quadri)
};

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
scene.add(arch.walls, arch.wallsLow, arch.floors, arch.ceilings, arch.exterior);
arch.wallsLow.visible = false;
const gruppiArredi = arredi(ctx, arch.stanze);
for (const g of gruppiArredi) scene.add(g);

// ---------- ottimizzazione: fonde le mesh statiche per materiale (meno draw call) ----------
function ottimizza(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const daRimuovere = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.visible) { daRimuovere.push(o); return; }
    if (Array.isArray(o.material)) return; // muri esterni multi-materiale: restano come sono
    const key = `${o.material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`;
    if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, receive: o.receiveShadow, geoms: [] });
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    buckets.get(key).geoms.push(g);
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
for (const g of [arch.walls, arch.wallsLow, arch.floors, arch.ceilings, arch.exterior, ...gruppiArredi]) ottimizza(g);

// luci artificiali vicine tra loro (< 1.5 m) vengono fuse in una sola: meno luci nello shader
{
  const tenute = [];
  const pa = new THREE.Vector3(), pb = new THREE.Vector3();
  for (const l of luciArtificiali) {
    l.light.getWorldPosition(pa);
    const vicina = tenute.find((t) => t.light.getWorldPosition(pb).distanceTo(pa) < 1.5);
    if (vicina) { vicina.base = Math.min(vicina.base + l.base * 0.6, 30); l.light.removeFromParent(); }
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
function applicaLuce() {
  if (giorno) {
    scene.background = new THREE.Color('#c9d6df');
    scene.fog = new THREE.Fog('#c9d6df', 40, 80);
    sole.intensity = 3.2; cielo.intensity = 1.1; ambiente.intensity = 0.35; riempimento.intensity = 0.8;
    renderer.toneMappingExposure = 1.0;
    for (const l of luciArtificiali) { l.light.visible = false; l.bulb.material.emissiveIntensity = 0.2; }
  } else {
    scene.background = new THREE.Color('#0f1620');
    scene.fog = new THREE.Fog('#0f1620', 30, 70);
    sole.intensity = 0.0; cielo.intensity = 0.12; ambiente.intensity = 0.06; riempimento.intensity = 0.05;
    cielo.color.set('#3a4a66'); cielo.groundColor.set('#1a1611');
    renderer.toneMappingExposure = 1.1;
    for (const l of luciArtificiali) { l.light.visible = true; l.light.intensity = l.base; l.bulb.material.emissiveIntensity = 1.6; }
  }
  if (giorno) { cielo.color.set('#dfe8f0'); cielo.groundColor.set('#6b6350'); }
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

function blocca(x, z) {
  for (const c of colliders) {
    if (c.minY >= EYE - 0.1 || c.maxY <= 0.3) continue;
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
  camera.position.set(pos.x, EYE, pos.z);
}

function entraFP() {
  modoFP = true;
  orbit.enabled = false;
  camera.position.set(pos.x, EYE, pos.z);
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
const viste = {
  soggiorno: { fp: [2.0, 7.6, 2.0, 3.0], orbit: [2.2, 5.2, 5.5, 5.6, 6.5] },
  cucina: { fp: [3.2, 2.4, 0.9, 1.4], orbit: [1.9, 2.2, 4.5, 3.4, 3.8] },
  bagno: { fp: [5.7, 2.6, 4.4, 1.0], orbit: [5.15, 1.5, 6.2, 4.6, 4.9] },
  disimpegno: { fp: [5.3, 4.9, 6.0, 3.4], orbit: [5.3, 4.1, 6.4, 4.4, 5.9] },
  camera_nord: { fp: [7.0, 3.5, 9.2, 2.0], orbit: [8.2, 2.3, 10.3, 5.0, 4.9] },
  camera_est: { fp: [7.2, 5.4, 9.3, 5.3], orbit: [8.2, 5.4, 10.4, 7.3, 7.0] },
  camera_sud: { fp: [7.0, 8.5, 9.3, 7.2], orbit: [8.2, 8.2, 10.5, 9.5, 11.2] },
};
const nomi = { soggiorno: 'Soggiorno', cucina: 'Cucina', bagno: 'Bagno', disimpegno: 'Disimpegno', camera_nord: 'Camera nord (matrimoniale)', camera_est: 'Camera est (studio e lavanderia)', camera_sud: 'Camera sud (matrimoniale)' };
const divStanze = document.getElementById('stanze');
for (const k of Object.keys(viste)) {
  const b = document.createElement('button');
  b.textContent = nomi[k];
  b.onclick = () => vaiA(k);
  divStanze.appendChild(b);
}
function vaiA(k) {
  const v = viste[k];
  pos.set(v.fp[0], EYE, v.fp[1]);
  if (modoFP) {
    camera.position.copy(pos);
    camera.lookAt(v.fp[2], EYE - 0.1, v.fp[3]);
  } else {
    orbit.target.set(v.orbit[0], 1.0, v.orbit[1]);
    camera.position.set(v.orbit[2], v.orbit[3], v.orbit[4]);
  }
}
document.getElementById('btn-orbit').onclick = () => esciFP();
const apri = document.getElementById('apri-pannello');
apri.onclick = () => { const on = document.body.classList.toggle('pannello-aperto'); apri.textContent = on ? 'Chiudi' : 'Menu'; };
// su schermi piccoli il pannello si chiude dopo la scelta di una stanza
divStanze.addEventListener('click', () => { if (getComputedStyle(apri).display !== 'none') apri.click(); });
document.getElementById('btn-fp').onclick = () => entraFP();
const bt = document.getElementById('btn-tetto');
bt.onclick = () => { arch.ceilings.visible = !arch.ceilings.visible; bt.classList.toggle('on', arch.ceilings.visible); };
const bp = document.getElementById('btn-pareti');
bp.onclick = () => {
  const full = !arch.walls.visible;
  arch.walls.visible = full; arch.wallsLow.visible = !full;
  if (!full && arch.ceilings.visible) bt.click();
  bp.classList.toggle('on', full);
};
const bg = document.getElementById('btn-giorno');
bg.onclick = () => { giorno = !giorno; applicaLuce(); bg.classList.toggle('on', giorno); bg.textContent = giorno ? 'Luce del giorno' : 'Luce della sera'; };

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
window.__casa = { scene, camera, renderer, colliders, vaiA, arch, blocca, pos, luci: luciArtificiali };
