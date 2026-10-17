// Ottimizzazione della scena dopo la costruzione: meno materiali, meno draw call.
//
// - unificaMateriali: i materiali con gli stessi parametri (molti nascono uguali, uno per oggetto:
//   paralumi, lampadine, vetri...) diventano uno solo, cosi' si fondono insieme.
// - ottimizza: in un gruppo fonde le mesh statiche per materiale. Le forme che fanno ombra si
//   fondono anche, tutte insieme e senza materiale, in una "sagoma d'ombra" (una per verso delle
//   facce): la mappa d'ombra del sole disegna una sagoma per gruppo invece di una mesh per materiale.
// - ombreSuLivello: le sagome stanno su un livello che la camera vede solo mentre si disegna la
//   mappa d'ombra, cosi' non compaiono nell'immagine (ne' nelle ombre di contatto).
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export const LIVELLO_OMBRE = 1;

// ---------- materiali uguali -> un materiale solo ----------
// La firma raccoglie tutti i parametri propri del materiale (colori, texture, numeri, verso...).
// Un valore che non si sa confrontare rende il materiale unico: nel dubbio, non si unisce.
const _unici = new WeakMap();
let _contaUnici = 0;
function firma(m) {
  const parti = [m.type];
  for (const k of Object.keys(m).sort()) {
    if (k === 'uuid' || k === 'name' || k === 'id' || k === 'version' || k === 'userData' || k.startsWith('_')) continue;
    const v = m[k];
    if (typeof v === 'function') { parti.push(`${k}=f${unico(v)}`); continue; }
    if (v === null || typeof v !== 'object') { parti.push(`${k}=${v}`); continue; }
    if (v.isColor) parti.push(`${k}=${v.getHexString()}`);
    else if (v.isTexture) parti.push(`${k}=${v.uuid}`);
    else if (v.isVector2 || v.isVector3 || v.isEuler) parti.push(`${k}=${v.toArray().join(',')}`);
    else {
      let s = null;
      try { s = JSON.stringify(v); } catch { /* non serializzabile */ }
      parti.push(`${k}=${s ?? `o${unico(v)}`}`);
    }
  }
  return parti.join('|');
}
function unico(o) {
  if (!_unici.has(o)) _unici.set(o, ++_contaUnici);
  return _unici.get(o);
}

// distinti: materiali che si uniscono solo fra loro (es. i paralumi che di sera si accendono).
// Ritorna la mappa vecchio -> nuovo, per aggiornare chi tiene un riferimento ai materiali.
export function unificaMateriali(root, distinti = new Set()) {
  const perFirma = new Map(), sostituti = new Map();
  const scegli = (m) => {
    if (sostituti.has(m)) return sostituti.get(m);
    const f = (distinti.has(m) ? 'D|' : '') + firma(m);
    if (!perFirma.has(f)) perFirma.set(f, m);
    const n = perFirma.get(f);
    sostituti.set(m, n);
    return n;
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(scegli) : scegli(o.material);
  });
  return sostituti;
}

// ---------- fusione per materiale, con le sagome d'ombra ----------
const MAT_OMBRA = {};
const matOmbra = (side) => (MAT_OMBRA[side] ||= new THREE.MeshBasicMaterial({ side }));
// le geometrie da fondere devono essere tutte con indice o tutte senza: si da' l'indice a tutte
function conIndice(g) {
  if (!g.index) {
    const n = g.getAttribute('position').count;
    const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  return g;
}

// Quante mesh usano ogni geometria, in tutti i gruppi da ottimizzare: una geometria usata da una
// mesh sola si trasforma e si fonde senza farne una copia (la mesh poi sparisce); quelle condivise
// (gambe tornite, spigoli arrotondati dalla cache) si copiano.
export function contaUtenti(roots) {
  const n = new Map();
  for (const r of roots) r.traverse((o) => { if (o.isMesh) n.set(o.geometry, (n.get(o.geometry) || 0) + 1); });
  return n;
}

// utenti: da contaUtenti; senza, ogni geometria si copia
export function ottimizza(root, utenti = null) {
  root.updateMatrixWorld(true);
  // le geometrie fuse restano figlie di root: si portano nelle sue coordinate (root puo' essere spostato)
  const inv = root.matrixWorld.clone().invert();
  const rel = new THREE.Matrix4();
  const buckets = new Map();
  const ombre = new Map(); // verso delle facce -> forme che fanno ombra (solo posizioni)
  const daRimuovere = [];
  // i pezzi da tenere a parte (ante che scorrono, modelli 3D con geometria condivisa) non si fondono qui
  const visita = (o, fn) => { if (o !== root && o.userData.aParte) return; fn(o); for (const c of o.children) visita(c, fn); };
  visita(root, (o) => {
    if (!o.isMesh) return;
    if (!o.visible) { daRimuovere.push(o); return; }
    const metti = (material, geom) => {
      const key = `${material.uuid}|${o.receiveShadow ? 1 : 0}`;
      if (!buckets.has(key)) buckets.set(key, { material, receive: o.receiveShadow, geoms: [] });
      geom.applyMatrix4(rel.multiplyMatrices(inv, o.matrixWorld));
      for (const name of Object.keys(geom.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geom.deleteAttribute(name);
      buckets.get(key).geoms.push(geom);
      if (o.castShadow && material.visible) {
        const s = new THREE.BufferGeometry();
        s.setAttribute('position', geom.getAttribute('position'));
        if (geom.index) s.setIndex(geom.index);
        if (!ombre.has(material.side)) ombre.set(material.side, []);
        ombre.get(material.side).push(conIndice(s));
      }
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
    } else metti(o.material, utenti?.get(o.geometry) === 1 ? o.geometry : o.geometry.clone());
    daRimuovere.push(o);
  });
  for (const o of daRimuovere) o.parent.remove(o);
  // sagome d'ombra: prima delle mesh, che poi liberano le loro geometrie
  for (const [side, geoms] of ombre) {
    const s = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(geoms, false), matOmbra(side));
    s.castShadow = true;
    s.layers.set(LIVELLO_OMBRE);
    root.add(s);
  }
  for (const b of buckets.values()) {
    const merged = BufferGeometryUtils.mergeGeometries(b.geoms, false);
    for (const g of b.geoms) g.dispose();
    const m = new THREE.Mesh(merged, b.material);
    m.castShadow = false; // l'ombra la fa la sagoma
    m.receiveShadow = b.receive;
    root.add(m);
  }
}

// La mappa d'ombra si disegna una volta per fotogramma (non a ogni renderer.render: le ombre di
// contatto ridisegnano la scena) e con il livello delle sagome acceso sulla camera.
// Chi disegna un fotogramma chiama prima renderer.shadowMap.needsUpdate = true.
export function ombreSuLivello(renderer) {
  const sm = renderer.shadowMap;
  sm.autoUpdate = false;
  const disegna = sm.render;
  sm.render = function (luci, scena, camera) {
    camera.layers.enable(LIVELLO_OMBRE);
    try { disegna.call(this, luci, scena, camera); } finally { camera.layers.disable(LIVELLO_OMBRE); }
  };
}
