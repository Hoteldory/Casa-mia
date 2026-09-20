// Involucro architettonico: muri con aperture, pavimenti, soffitti, porte, finestre con scuri,
// balconi, pianerottolo e scala esterna. Tutte le misure derivano da planimetria.json (cm).
import * as THREE from 'three';
import plan from './data/planimetria.json';
import { getMateriali, uvMetri, PALETTE, texVernice } from './data/stile.js';
import { box, cyl, plane, group } from './arredi/comune.js';

const C = 0.01; // cm -> m
export const H = plan.altezze.soffitto_cm * C;
const A = plan.altezze;
const ESTERNO_NORMALE = {
  'E-nord': [0, -1], 'E-ovest': [-1, 0], 'E-est': [1, 0],
  'E-sud-soggiorno': [0, 1], 'E-sud-camera-sud': [0, 1], 'E-vano-scala-est': [-1, 0],
};

const r2m = (r) => ({ x: r.x * C, z: r.y * C, w: r.w * C, d: r.d * C, cx: (r.x + r.w / 2) * C, cz: (r.y + r.d / 2) * C });

// Stanze con rettangoli in metri (per pavimenti, soffitti, UI)
export function stanze() {
  const S = plan.stanze;
  const out = {};
  for (const k of Object.keys(S)) {
    const rects = (S[k].rettangoli || [S[k].rect]).map(r2m);
    const main = rects[0];
    out[k] = { id: k, nome: S[k].nome, rects, centro: [main.cx, main.cz] };
  }
  out.soggiorno.centro = [2.2, 5.6];
  return out;
}

// Aperture per muro
function aperturePerMuro() {
  const map = {};
  const push = (id, o) => (map[id] = map[id] || []).push(o);
  for (const p of plan.porte) {
    const top = p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm;
    push(p.muro, { ...p, a: p.x_da ?? p.y_da, b: p.x_a ?? p.y_a, bottom: 0, top, kind: 'porta' });
  }
  for (const f of plan.finestre) {
    const pf = f.tipo === 'portafinestra';
    push(f.muro, { ...f, a: f.x_da ?? f.y_da, b: f.x_a ?? f.y_a, bottom: pf ? 0 : A.finestra_davanzale_cm, top: pf ? A.portafinestra_h_cm : A.finestra_davanzale_cm + A.finestra_h_cm, kind: pf ? 'portafinestra' : 'finestra' });
  }
  for (const k in map) map[k].sort((p, q) => p.a - q.a);
  return map;
}

// Costruisce i pezzi di un muro (in cm) intorno alle aperture, altezza massima hMax (m)
function buildMuro(seg, aperture, hMax, ctx, low = false) {
  const M = getMateriali();
  const r = seg.rect;
  const horiz = r.w >= r.d;
  const start = horiz ? r.x : r.y, len = horiz ? r.w : r.d, thick = horiz ? r.d : r.w;
  const cross = (horiz ? r.y : r.x) + thick / 2;
  const g = new THREE.Group();
  const nrm = ESTERNO_NORMALE[seg.id];
  const matFor = () => {
    if (!nrm) return M.intonaco;
    // BoxGeometry: facce +x -x +y -y +z -z
    const mats = new Array(6).fill(M.intonaco);
    mats[2] = M.intonacoEsterno;
    if (nrm[0] === 1) mats[0] = M.intonacoEsterno;
    if (nrm[0] === -1) mats[1] = M.intonacoEsterno;
    if (nrm[1] === 1) mats[4] = M.intonacoEsterno;
    if (nrm[1] === -1) mats[5] = M.intonacoEsterno;
    return mats;
  };
  const piece = (a, b, y0, y1) => {
    y1 = Math.min(y1, hMax);
    if (b - a < 0.5 || y1 - y0 < 0.005) return;
    const L = (b - a) * C, T = thick * C, Hh = y1 - y0;
    const m = horiz ? box(L, Hh, T, matFor(), (a + (b - a) / 2) * C, y0 + Hh / 2, cross * C)
                    : box(T, Hh, L, matFor(), cross * C, y0 + Hh / 2, (a + (b - a) / 2) * C);
    g.add(m);
    if (!low && y0 < 1.6) ctx.addCollider(m);
  };
  let cursor = start;
  for (const o of aperture) {
    piece(cursor, o.a, 0, hMax);
    if (o.bottom > 0) piece(o.a, o.b, 0, o.bottom * C);
    piece(o.a, o.b, o.top * C, hMax);
    cursor = o.b;
  }
  piece(cursor, start + len, 0, hMax);
  return g;
}

// ---------- porte ----------
function centroStanza(nome) {
  const s = plan.stanze[nome];
  if (!s) return null;
  const r = (s.rettangoli || [s.rect])[0];
  return [(r.x + r.w / 2) * C, (r.y + r.d / 2) * C];
}

function buildPorta(p, seg, ctx) {
  const M = getMateriali();
  const r = seg.rect;
  const horiz = r.w >= r.d;
  const thick = (horiz ? r.d : r.w) * C;
  const w = (p.b - p.a) * C;
  const h = (p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm) * C;
  const cross = ((horiz ? r.y : r.x) + (horiz ? r.d : r.w) / 2) * C;
  const g = new THREE.Group();
  const matT = p.tipo === 'portoncino' ? M.noceScuro : M.noce;
  // telaio (stipiti + traversa), poco più largo del muro
  const T = thick + 0.02, s = 0.09;
  const along = (len, hh, pos, y) => {
    const m = horiz ? box(len, hh, T, matT, pos, y, cross) : box(T, hh, len, matT, cross, y, pos);
    return m;
  };
  g.add(along(s, h + s, (p.a * C) + s / 2 - 0.02, (h + s) / 2));
  g.add(along(s, h + s, (p.b * C) - s / 2 + 0.02, (h + s) / 2));
  g.add(along(w + 0.04, s, (p.a + p.b) / 2 * C, h + s / 2));
  // soglia in pietra
  g.add(horiz ? box(w, 0.012, T, M.pietra, (p.a + p.b) / 2 * C, 0.006, cross) : box(T, 0.012, w, M.pietra, cross, 0.006, (p.a + p.b) / 2 * C));

  // battente: cerniera e verso di apertura
  const cern = /cerniera a (nord|sud|est|ovest)/.exec(p.battente || '')?.[1];
  const leafW = w - 0.07, leafH = h - 0.02;
  const leaf = new THREE.Group();
  const matL = p.tipo === 'portoncino' ? M.noceScuro : M.salvia;
  const body = box(leafW, leafH, 0.045, matL, leafW / 2, leafH / 2, 0);
  leaf.add(body);
  // due pannelli a rilievo
  for (const [py, ph] of [[leafH * 0.72, leafH * 0.42], [leafH * 0.27, leafH * 0.36]]) {
    leaf.add(box(leafW - 0.22, ph, 0.055, matL, leafW / 2, py, 0));
    leaf.add(box(leafW - 0.28, ph - 0.06, 0.06, M.noceScuro === matL ? M.noce : matL, leafW / 2, py, 0));
  }
  // maniglia in ottone su entrambi i lati
  const hx = leafW - 0.08;
  for (const side of [1, -1]) {
    const ros = cyl(0.025, 0.025, 0.008, M.ottone, hx, 1.05, side * 0.027, 12); ros.rotation.x = Math.PI / 2; leaf.add(ros);
    const stem = cyl(0.008, 0.008, 0.06, M.ottone, hx, 1.05, side * 0.055, 8); stem.rotation.x = Math.PI / 2; leaf.add(stem);
    const lever = cyl(0.007, 0.007, 0.11, M.ottone, hx - 0.05, 1.05, side * 0.08, 8); lever.rotation.z = Math.PI / 2; leaf.add(lever);
  }
  // pivot
  let hingeA, dir0, n;
  if (horiz) {
    hingeA = cern === 'ovest' ? p.a : p.b;
    dir0 = new THREE.Vector3(cern === 'ovest' ? 1 : -1, 0, 0);
    leaf.position.set(hingeA * C, 0.01, cross);
  } else {
    hingeA = cern === 'nord' ? p.a : p.b;
    dir0 = new THREE.Vector3(0, 0, cern === 'nord' ? 1 : -1);
    leaf.position.set(cross, 0.01, hingeA * C);
  }
  // normale verso la stanza "a"
  const dest = plan.porte.find((q) => q.id === p.id);
  const cTo = centroStanza(dest.a);
  n = horiz ? new THREE.Vector3(0, 0, Math.sign(cTo[1] - cross) || 1) : new THREE.Vector3(Math.sign(cTo[0] - cross) || 1, 0, 0);
  const ang = p.tipo === 'portoncino' ? 0 : (p.id === 'P-bagno' ? 0.35 : 1.15);
  const d = dir0.clone().multiplyScalar(Math.cos(ang)).add(n.clone().multiplyScalar(Math.sin(ang)));
  leaf.rotation.y = Math.atan2(-d.z, d.x);
  g.add(leaf);
  if (p.tipo === 'portoncino') ctx.addCollider(body);
  return g;
}

// ---------- finestre ----------
function buildFinestra(f, seg, ctx) {
  const M = getMateriali();
  const r = seg.rect;
  const horiz = r.w >= r.d;
  const thick = (horiz ? r.d : r.w) * C;
  const w = (f.b - f.a) * C;
  const y0 = f.bottom * C, y1 = f.top * C, h = y1 - y0;
  const cross = ((horiz ? r.y : r.x) + (horiz ? r.d : r.w) / 2) * C;
  const nrm = ESTERNO_NORMALE[seg.id];
  const mid = (f.a + f.b) / 2 * C;
  // gruppo locale: X lungo l'apertura, Z = normale esterna
  const g = new THREE.Group();
  if (horiz) { g.position.set(mid, 0, cross); g.rotation.y = nrm[1] === 1 ? 0 : Math.PI; }
  else { g.position.set(cross, 0, mid); g.rotation.y = nrm[0] === 1 ? Math.PI / 2 : -Math.PI / 2; }
  const matI = M.salvia; // infissi in legno verniciato verde salvia scuro
  const s = 0.06;
  // telaio fisso
  g.add(box(s, h, 0.07, matI, -w / 2 + s / 2, y0 + h / 2, 0));
  g.add(box(s, h, 0.07, matI, w / 2 - s / 2, y0 + h / 2, 0));
  g.add(box(w, s, 0.07, matI, 0, y1 - s / 2, 0));
  g.add(box(w, s, 0.07, matI, 0, y0 + s / 2, 0));
  // ante (2 se larghe), con traversa e vetro
  const nAnte = w > 0.8 ? 2 : 1;
  const aw = (w - 2 * s) / nAnte;
  for (let i = 0; i < nAnte; i++) {
    const cx = -w / 2 + s + aw * (i + 0.5);
    const t = 0.045;
    g.add(box(t, h - 2 * s, 0.05, matI, cx - aw / 2 + t / 2, y0 + h / 2, 0));
    g.add(box(t, h - 2 * s, 0.05, matI, cx + aw / 2 - t / 2, y0 + h / 2, 0));
    g.add(box(aw, t, 0.05, matI, cx, y1 - s - t / 2, 0));
    g.add(box(aw, t * 1.6, 0.05, matI, cx, y0 + s + t * 0.8, 0));
    // traversa a metà
    g.add(box(aw, 0.03, 0.05, matI, cx, y0 + h * 0.5, 0));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(aw - 2 * t, h - 2 * s - 2 * t), M.vetro);
    glass.position.set(cx, y0 + h / 2, 0);
    g.add(glass);
    // cremonese in ottone
    if (i === 0) {
      const cr = cyl(0.006, 0.006, 0.09, M.ottone, cx + aw / 2 - t / 2 - 0.01, y0 + h * 0.5, -0.045, 8);
      cr.rotation.z = Math.PI / 2; cr.rotation.y = Math.PI / 2; g.add(cr);
    }
  }
  // davanzale in pietra (interno ed esterno) se finestra
  if (f.kind === 'finestra') {
    g.add(box(w + 0.16, 0.035, thick + 0.16, M.pietra, 0, y0 - 0.017, 0));
    const sill = box(w + 0.16, 0.035, thick + 0.16, M.pietra, 0, y0 - 0.017, 0);
    ctx.addCollider(sill);
  } else {
    g.add(box(w + 0.1, 0.02, thick + 0.1, M.pietra, 0, 0.01, 0));
  }
  // scuri esterni in legno, aperti e appoggiati alla facciata
  const sh = h + 0.06, sw = w / 2 + 0.03;
  const matS = M.noceScuro;
  for (const side of [-1, 1]) {
    const sg = new THREE.Group();
    const leafB = box(sw, sh, 0.04, matS, side * sw / 2, 0, 0);
    sg.add(leafB);
    for (const yy of [-sh / 2 + 0.2, 0, sh / 2 - 0.2]) sg.add(box(sw - 0.08, 0.1, 0.06, matS, side * sw / 2, yy, 0));
    // cardini in ferro
    for (const yy of [-sh / 2 + 0.25, sh / 2 - 0.25]) sg.add(cyl(0.012, 0.012, 0.05, M.ferro, side * 0.03, yy, -0.02, 8));
    sg.position.set(side * (w / 2 + 0.02), y0 + h / 2, thick / 2 + 0.045);
    g.add(sg);
  }
  return g;
}

// ---------- battiscopa ----------
function battiscopa(st, ctx) {
  const M = getMateriali();
  const g = new THREE.Group();
  const segs = plan.muri.segmenti;
  const aper = aperturePerMuro();
  const inWall = (x, y) => segs.find((s) => x >= s.rect.x && x <= s.rect.x + s.rect.w && y >= s.rect.y && y <= s.rect.y + s.rect.d);
  for (const k of Object.keys(st)) {
    for (const rc of plan.stanze[k].rettangoli || [plan.stanze[k].rect]) {
      const edges = [
        { a: rc.x, b: rc.x + rc.w, horiz: true, at: rc.y, out: -3 },
        { a: rc.x, b: rc.x + rc.w, horiz: true, at: rc.y + rc.d, out: 3 },
        { a: rc.y, b: rc.y + rc.d, horiz: false, at: rc.x, out: -3 },
        { a: rc.y, b: rc.y + rc.d, horiz: false, at: rc.x + rc.w, out: 3 },
      ];
      for (const e of edges) {
        // campiona l'edge ogni 10 cm e crea tratti dove c'è muro dietro e nessuna porta
        let runStart = null;
        const flush = (end) => {
          if (runStart === null) return;
          const L = (end - runStart) * C;
          if (L > 0.05) {
            const pos = (runStart + end) / 2 * C, off = (e.at + e.out * 0.5) * C;
            g.add(e.horiz ? box(L, 0.08, 0.015, M.noceScuro, pos, 0.04, off, { cast: false }) : box(0.015, 0.08, L, M.noceScuro, off, 0.04, pos, { cast: false }));
          }
          runStart = null;
        };
        for (let t = e.a; t <= e.b; t += 5) {
          const px = e.horiz ? t : e.at + e.out, py = e.horiz ? e.at + e.out : t;
          const wall = inWall(px, py);
          let ok = !!wall;
          if (wall) {
            const ops = (aper[wall.id] || []).filter((o) => o.bottom === 0);
            if (ops.some((o) => t > o.a - 6 && t < o.b + 6)) ok = false;
          }
          if (ok && runStart === null) runStart = t;
          if (!ok) flush(t);
        }
        flush(e.b);
      }
    }
  }
  return g;
}

// ---------- ringhiera in ferro battuto ----------
export function ringhiera(x0, z0, x1, z1, ctx, { h = 1.05, y = 0 } = {}) {
  const M = getMateriali();
  const g = new THREE.Group();
  const dx = x1 - x0, dz = z1 - z0;
  const L = Math.hypot(dx, dz);
  const ang = Math.atan2(-dz, dx);
  const top = box(L, 0.035, 0.05, M.ferro, 0, y + h, 0);
  const bot = box(L, 0.02, 0.02, M.ferro, 0, y + 0.08, 0);
  g.add(top, bot);
  const n = Math.max(1, Math.round(L / 0.12));
  for (let i = 0; i <= n; i++) {
    const t = -L / 2 + (i / n) * L;
    g.add(box(0.014, h - 0.09, 0.014, M.ferro, t, y + 0.08 + (h - 0.09) / 2, 0));
    if (i % 3 === 1) g.add(box(0.05, 0.05, 0.02, M.ferro, t, y + h * 0.55, 0).rotateX(Math.PI / 4));
  }
  g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  g.rotation.y = ang;
  // collider
  ctx.addColliderBox(Math.min(x0, x1) - 0.05, Math.max(x0, x1) + 0.05, Math.min(z0, z1) - 0.05, Math.max(z0, z1) + 0.05, y, y + h);
  return g;
}

// ---------- esterni ----------
function esterni(ctx) {
  const M = getMateriali();
  const g = new THREE.Group();
  const E = plan.esterni;
  const slab = (r, y = -0.16, t = 0.16) => {
    const m = r2m(r);
    const s = box(m.w, t, m.d, M.pietraScura, m.cx, y + t / 2, m.cz);
    g.add(s);
    // pavimento in cotto
    g.add(plane(m.w, m.d, M.cotto, m.cx, y + t + 0.001, m.cz, 'y+'));
    return m;
  };
  // balcone ovest
  const bo = slab(E.balcone_ovest.rect);
  g.add(ringhiera(bo.x, bo.z, bo.x, bo.z + bo.d, ctx));
  g.add(ringhiera(bo.x, bo.z, bo.x + bo.w, bo.z, ctx));
  g.add(ringhiera(bo.x, bo.z + bo.d, bo.x + bo.w, bo.z + bo.d, ctx));
  // balcone sud-est (L)
  const [b1, b2] = E.balcone_sud_est.rettangoli.map((r) => slab(r));
  g.add(ringhiera(b1.x, b1.z + b1.d, b1.x + b1.w, b1.z + b1.d, ctx));
  g.add(ringhiera(b1.x, b1.z, b1.x, b1.z + b1.d, ctx));
  g.add(ringhiera(b2.x + b2.w, b2.z, b2.x + b2.w, b1.z + b1.d, ctx));
  g.add(ringhiera(b2.x, b2.z, b2.x + b2.w, b2.z, ctx));
  // pianerottolo esterno + scala a due rampe
  const P = E.pianerottolo_esterno;
  const pm = r2m(P.rect);
  const r2 = r2m(P.scala_esterna_rampa2.rect);
  const r1 = r2m(P.scala_esterna_rampa1.rect);
  const topX0 = r2.x + r2.w; // inizio pianerottolo alto
  // pianerottolo alto (quota 0)
  g.add(box(pm.x + pm.w - topX0, 0.16, pm.d, M.pietraScura, (topX0 + pm.x + pm.w) / 2, -0.08, pm.cz));
  g.add(plane(pm.x + pm.w - topX0, pm.d, M.cotto, (topX0 + pm.x + pm.w) / 2, 0.001, pm.cz, 'y+'));
  // rampa 2: scende verso ovest, 10 gradini
  const n2 = P.scala_esterna_rampa2.gradini, rise2 = 1.7 / n2, tread2 = r2.w / n2;
  for (let i = 0; i < n2; i++) {
    const yTop = -rise2 * (i + 1);
    const x = topX0 - tread2 * (i + 0.5);
    g.add(box(tread2, 0.16, pm.d, M.pietraScura, x, yTop - 0.08, pm.cz));
    g.add(plane(tread2, pm.d, M.cotto, x, yTop + 0.001, pm.cz, 'y+'));
  }
  // pianerottolo intermedio (quota -1.7)
  const midW = r2.x - pm.x;
  g.add(box(midW, 0.16, pm.d, M.pietraScura, pm.x + midW / 2, -1.7 - 0.08, pm.cz));
  g.add(plane(midW, pm.d, M.cotto, pm.x + midW / 2, -1.7 + 0.001, pm.cz, 'y+'));
  // rampa 1: scende verso sud, 12 gradini fino a -3.4
  const n1 = P.scala_esterna_rampa1.gradini, rise1 = 1.7 / n1, tread1 = r1.d / n1;
  for (let i = 0; i < n1; i++) {
    const yTop = -1.7 - rise1 * (i + 1);
    const z = r1.z + tread1 * (i + 0.5);
    g.add(box(r1.w, 0.16, tread1, M.pietraScura, r1.cx, yTop - 0.08, z));
    g.add(plane(r1.w, tread1, M.cotto, r1.cx, yTop + 0.001, z, 'y+'));
  }
  // ringhiere: pianerottolo alto (lato sud), rampa 2 (lato sud, inclinata), pianerottolo intermedio
  g.add(ringhiera(topX0, pm.z + pm.d, b1.x, pm.z + pm.d, ctx));
  const slope = new THREE.Group();
  const L2 = Math.hypot(r2.w, 1.7);
  const rail = box(L2, 0.035, 0.05, M.ferro, 0, 1.0, 0);
  slope.add(rail);
  for (let i = 0; i <= n2; i++) {
    const t = -L2 / 2 + (i / n2) * L2;
    slope.add(box(0.014, 0.95, 0.014, M.ferro, t, 0.5, 0));
  }
  slope.position.set(topX0 - r2.w / 2, -0.85, pm.z + pm.d);
  slope.rotation.z = Math.atan2(1.7, r2.w);
  g.add(slope);
  g.add(ringhiera(pm.x, pm.z + pm.d, r1.x + r1.w, pm.z + pm.d, ctx, { y: -1.7 }));
  g.add(ringhiera(pm.x, pm.z, pm.x, pm.z + pm.d, ctx, { y: -1.7 }));
  // blocca la discesa in prima persona (si resta al piano)
  ctx.addColliderBox(topX0 - 0.1, topX0, pm.z, pm.z + pm.d, 0, 1.2);
  // muro perimetrale della scala rampa1 (parapetto in muratura) e lato ovest
  g.add(box(0.2, 3.4, r1.d, M.intonacoEsterno, r1.x - 0.1, -1.7, r1.cz));
  // volume del piano terra
  const I = plan.muri.ingombro_esterno;
  const pt = box(I.larghezza_cm * C, 3.4, 9.65, M.intonacoEsterno, I.larghezza_cm * C / 2, -1.7, 9.65 / 2);
  g.add(pt);
  const pt2 = box((I.larghezza_cm - 584) * C, 3.4, 1.32, M.intonacoEsterno, (584 + (I.larghezza_cm - 584) / 2) * C, -1.7, 9.65 + 0.66);
  g.add(pt2);
  // finestre "cieche" al piano terra: semplici rientranze scure
  for (const [x, z, nx, nz] of [[2.1, 0, 0, -1], [4.5, 0, 0, -1], [7.5, 0, 0, -1], [10.51, 2.5, 1, 0], [10.51, 6, 1, 0], [0, 2.5, -1, 0], [0, 6, -1, 0]]) {
    const wnd = box(nx ? 0.04 : 1.2, 1.4, nz ? 0.04 : 1.2, M.nero, x + nx * 0.01, -1.6, z + nz * 0.01, { cast: false });
    g.add(wnd);
  }
  // terreno
  const ground = plane(60, 60, M.terreno, 5, -3.4, 5, 'y+');
  g.add(ground);
  return g;
}

// ---------- travi a vista nel soggiorno ----------
function travi(st) {
  const M = getMateriali();
  const g = new THREE.Group();
  const main = st.soggiorno.rects[0];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const z = main.z + main.d * (i + 0.5) / n;
    g.add(box(main.w + 0.02, 0.2, 0.15, M.noceScuro, main.cx, H - 0.1, z));
  }
  // trave di colmo longitudinale
  g.add(box(0.18, 0.24, main.d, M.noceScuro, main.cx, H - 0.12, main.cz));
  return g;
}

// ---------- costruzione completa ----------
export function costruisciArchitettura(ctx) {
  const M = getMateriali();
  const st = stanze();
  const aper = aperturePerMuro();
  const walls = new THREE.Group();
  const wallsLow = new THREE.Group();
  const floors = new THREE.Group();
  const ceilings = new THREE.Group();

  const segById = {};
  for (const seg of plan.muri.segmenti) {
    segById[seg.id] = seg;
    walls.add(buildMuro(seg, aper[seg.id] || [], H, ctx));
    wallsLow.add(buildMuro(seg, aper[seg.id] || [], 0.45, { addCollider() {} }, true));
  }
  // riempimento angolo nord-ovest tra muro nord e ovest già coperto dai rettangoli (i rect si sovrappongono).

  for (const p of plan.porte) walls.add(buildPorta(aper[p.muro].find((x) => x.id === p.id), segById[p.muro], ctx));
  for (const f of plan.finestre) {
    const o = aper[f.muro].find((x) => x.id === f.id);
    walls.add(buildFinestra(o, segById[f.muro], ctx));
  }
  walls.add(battiscopa(st, ctx));

  // pavimenti e soffitti
  const floorMat = { soggiorno: M.cotto, bagno: M.cementine, disimpegno: M.cotto, camera_nord: M.parquet, camera_est: M.parquet, camera_sud: M.parquet };
  const ceilMat = { disimpegno: M.salvia };
  for (const k of Object.keys(st)) {
    for (const r of st[k].rects) {
      // pavimento un po' più largo per coprire le soglie
      floors.add(plane(r.w + 0.3, r.d + 0.3, floorMat[k], r.cx, 0, r.cz, 'y+'));
      ceilings.add(plane(r.w + 0.3, r.d + 0.3, ceilMat[k] || M.intonacoSoffitto, r.cx, H, r.cz, 'y-'));
    }
  }
  ceilings.add(travi(st));
  // solaio di copertura + cornicione
  const I = plan.muri.ingombro_esterno;
  const W = I.larghezza_cm * C;
  const roof = box(W + 0.5, 0.28, 9.65 + 0.5, M.intonacoEsterno, W / 2, H + 0.14, 9.65 / 2);
  const roof2 = box((I.larghezza_cm - 584) * C + 0.5, 0.28, 1.32 + 0.25, M.intonacoEsterno, (584 + (I.larghezza_cm - 584) / 2) * C + 0.125, H + 0.14, 9.65 + 0.66 + 0.125);
  ceilings.add(roof, roof2);
  const cottoRoof = plane(W + 0.5, 9.65 + 0.5, M.cotto, W / 2, H + 0.281, 9.65 / 2, 'y+');
  ceilings.add(cottoRoof);

  const exterior = esterni(ctx);
  return { walls, wallsLow, floors, ceilings, exterior, stanze: st };
}
