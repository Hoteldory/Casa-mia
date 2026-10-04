// Involucro architettonico: muri con aperture, pavimenti, soffitti, porte, finestre con scuri,
// balconi, pianerottolo e scala esterna. Tutte le misure derivano da planimetria.json (cm).
import * as THREE from 'three';
import plan from './data/planimetria.json';
import { getMateriali, uvMetri, PALETTE, texVernice } from './data/stile.js';
import { box, cyl, plane, group, lanterna, conSmusso } from './arredi/comune.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const C = 0.01; // cm -> m
export const H = plan.altezze.soffitto_cm * C;
const A = plan.altezze;
const ESTERNO_NORMALE = {
  'E-nord': [0, -1], 'E-ovest': [-1, 0], 'E-est': [1, 0],
  'E-sud-soggiorno': [0, 1], 'E-sud-camera-sud': [0, 1], 'E-vano-scala-est': [-1, 0],
};

// normali delle facce esterne di un muro: dal JSON del piano ("esterno": [[nx, nz], ...])
// o, per il piano primo, dalla tabella qui sopra
function normaliEsterne(seg) {
  if (seg.esterno) return seg.esterno;
  return ESTERNO_NORMALE[seg.id] ? [ESTERNO_NORMALE[seg.id]] : null;
}

const r2m = (r) => ({ x: r.x * C, z: r.y * C, w: r.w * C, d: r.d * C, cx: (r.x + r.w / 2) * C, cz: (r.y + r.d / 2) * C });

// Foro del vano scala nella camera est: attraversa soffitto e solaio di copertura
export const VANO_SCALA = { x0: 6.75, x1: 8.45, z0: 4.22, z1: 5.85 };

// Spezza un rettangolo attorno a un foro rettangolare (fino a 4 pezzi)
function pezziConForo(rx0, rz0, rx1, rz1, h) {
  const out = [];
  const push = (a, c, b, d) => {
    if (b - a > 0.01 && d - c > 0.01) out.push({ cx: (a + b) / 2, cz: (c + d) / 2, w: b - a, d: d - c });
  };
  const hx0 = Math.max(rx0, h.x0), hx1 = Math.min(rx1, h.x1);
  push(rx0, rz0, hx0, rz1);
  push(hx1, rz0, rx1, rz1);
  push(hx0, rz0, hx1, Math.max(rz0, h.z0));
  push(hx0, Math.min(rz1, h.z1), hx1, rz1);
  return out;
}

// Stanze con rettangoli in metri (per pavimenti, soffitti, UI)
export function stanzeDi(P) {
  const S = P.stanze;
  const out = {};
  for (const k of Object.keys(S)) {
    const rects = (S[k].rettangoli || [S[k].rect]).map(r2m);
    const main = rects[0];
    out[k] = { id: k, nome: S[k].nome, rects, centro: [main.cx, main.cz] };
  }
  return out;
}
export function stanze() {
  const out = stanzeDi(plan);
  out.soggiorno.centro = [2.2, 5.6];
  return out;
}

// Aperture per muro
function aperturePerMuro(P = plan) {
  const A = P.altezze;
  const map = {};
  const push = (id, o) => (map[id] = map[id] || []).push(o);
  for (const p of P.porte) {
    const top = p.h_cm ?? (p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm);
    push(p.muro, { ...p, a: p.x_da ?? p.y_da, b: p.x_a ?? p.y_a, bottom: 0, top, kind: 'porta' });
  }
  for (const f of P.finestre) {
    const pf = f.tipo === 'portafinestra';
    // davanzale e altezza si possono sovrascrivere per singola finestra (es. sopra il piano cucina)
    const dav = f.davanzale_cm ?? A.finestra_davanzale_cm;
    const alt = f.altezza_cm ?? A.finestra_h_cm;
    push(f.muro, { ...f, a: f.x_da ?? f.y_da, b: f.x_a ?? f.y_a, bottom: pf ? 0 : dav, top: pf ? (f.altezza_cm ?? A.portafinestra_h_cm) : dav + alt, kind: pf ? 'portafinestra' : 'finestra' });
  }
  for (const k in map) map[k].sort((p, q) => p.a - q.a);
  return map;
}

// Costruisce i pezzi di un muro (in cm) intorno alle aperture, altezza massima hMax (m)
function buildMuro(seg, aperture, hMax, ctx, low = false, precedenti = []) {
  const M = getMateriali();
  const r = seg.rect;
  const horiz = r.w >= r.d;
  const start = horiz ? r.x : r.y, len = horiz ? r.w : r.d, thick = horiz ? r.d : r.w;
  // tratti già occupati da muri costruiti prima (incroci e angoli): si saltano, così nessuna faccia è complanare
  const tagli = [];
  for (const o of precedenti) {
    const q = o.rect;
    const ox0 = Math.max(r.x, q.x), ox1 = Math.min(r.x + r.w, q.x + q.w);
    const oy0 = Math.max(r.y, q.y), oy1 = Math.min(r.y + r.d, q.y + q.d);
    if (ox1 - ox0 <= 0 || oy1 - oy0 <= 0) continue;
    tagli.push(horiz ? { a: ox0, b: ox1, bottom: 0, top: 1e9, taglio: true } : { a: oy0, b: oy1, bottom: 0, top: 1e9, taglio: true });
  }
  aperture = [...aperture, ...tagli].sort((p, q) => p.a - q.a);
  const cross = (horiz ? r.y : r.x) + thick / 2;
  const g = new THREE.Group();
  const normali = normaliEsterne(seg);
  const matFor = () => {
    if (!normali) return M.intonaco;
    // BoxGeometry: facce +x -x +y -y +z -z
    const mats = new Array(6).fill(M.intonaco);
    mats[2] = M.intonacoEsterno;
    for (const nrm of normali) {
      if (nrm[0] === 1) mats[0] = M.intonacoEsterno;
      if (nrm[0] === -1) mats[1] = M.intonacoEsterno;
      if (nrm[1] === 1) mats[4] = M.intonacoEsterno;
      if (nrm[1] === -1) mats[5] = M.intonacoEsterno;
    }
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
function centroStanza(nome, P = plan) {
  const s = P.stanze[nome];
  if (!s) return null;
  const r = (s.rettangoli || [s.rect])[0];
  return [(r.x + r.w / 2) * C, (r.y + r.d / 2) * C];
}

function buildPorta(p, seg, ctx, P = plan) {
  const M = getMateriali();
  const A = P.altezze;
  const r = seg.rect;
  const horiz = r.w >= r.d;
  const thick = (horiz ? r.d : r.w) * C;
  const w = (p.b - p.a) * C;
  const h = (p.h_cm ?? (p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm)) * C;
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
  // vano: passaggio senza anta (la porta, se c'e', e' nel muro accostato dell'altro edificio)
  if (p.tipo === 'vano') return g;
  // scorrevole a scomparsa: l'anta e' quasi tutta nella tasca del muro; se ne vede il bordo
  // con la maniglia a incasso in ottone, dal lato della tasca (p.tasca, di default sud/est)
  if (p.tipo === 'scorrevole') {
    const dopo = !p.tasca || p.tasca === 'sud' || p.tasca === 'est';
    const hl = h - 0.02, sporge = 0.07;
    const pos = dopo ? p.b * C - s + 0.02 - sporge / 2 : p.a * C + s - 0.02 + sporge / 2;
    const bordo = horiz ? box(sporge, hl, 0.04, M.salvia, pos, hl / 2 + 0.01, cross) : box(0.04, hl, sporge, M.salvia, cross, hl / 2 + 0.01, pos);
    g.add(bordo);
    const bpos = dopo ? pos - sporge / 2 + 0.004 : pos + sporge / 2 - 0.004;
    g.add(horiz ? box(0.008, 0.16, 0.05, M.ottone, bpos, 1.05, cross) : box(0.05, 0.16, 0.008, M.ottone, cross, 1.05, bpos));
    return g;
  }

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
  const dest = P.porte.find((q) => q.id === p.id);
  const cTo = centroStanza(dest.a, P);
  n = horiz ? new THREE.Vector3(0, 0, Math.sign(cTo[1] - cross) || 1) : new THREE.Vector3(Math.sign(cTo[0] - cross) || 1, 0, 0);
  const ang = p.aperta_rad ?? (p.tipo === 'portoncino' ? 0 : (p.id === 'P-bagno' ? 0.35 : 1.15));
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
  // la normale che conta e' quella della faccia lunga del muro
  const nrm = normaliEsterne(seg).find((n) => (horiz ? n[1] !== 0 : n[0] !== 0));
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
    if (f.davanzale === 'esterno') {
      // davanzale solo verso l'esterno: all'interno la soglia è il piano di lavoro della cucina
      const dep = thick + 0.08;
      g.add(box(w + 0.16, 0.035, dep, M.pietra, 0, y0 - 0.017, dep / 2 - thick / 2));
    } else {
      g.add(box(w + 0.16, 0.035, thick + 0.16, M.pietra, 0, y0 - 0.017, 0));
    }
  } else {
    g.add(box(w + 0.1, 0.02, thick + 0.1, M.pietra, 0, 0.01, 0));
  }
  // scuri esterni in legno, aperti e appoggiati alla facciata; "a libro" = due ante ripiegate
  // per lato, per le aperture larghe che altrimenti sporgerebbero oltre lo spigolo
  const libro = f.scuri === 'a libro';
  const sh = h + 0.06, sw = (w / 2 + 0.03) / (libro ? 2 : 1);
  const matS = M.scuri; // verniciati chiari su entrambi i piani
  for (const side of [-1, 1]) for (let k = 0; k < (libro ? 2 : 1); k++) {
    const sg = new THREE.Group();
    const leafB = box(sw, sh, 0.04, matS, side * sw / 2, 0, 0);
    sg.add(leafB);
    for (const yy of [-sh / 2 + 0.2, 0, sh / 2 - 0.2]) sg.add(box(sw - 0.08, 0.1, 0.06, matS, side * sw / 2, yy, 0));
    // cardini in ferro
    for (const yy of [-sh / 2 + 0.25, sh / 2 - 0.25]) sg.add(cyl(0.012, 0.012, 0.05, M.ferro, side * 0.03, yy, -0.02, 8));
    sg.position.set(side * (w / 2 + 0.02), y0 + h / 2, thick / 2 + 0.045 + k * 0.045);
    g.add(sg);
  }
  return g;
}

// ---------- battiscopa ----------
function battiscopa(st, ctx, P = plan) {
  const M = getMateriali();
  const g = new THREE.Group();
  const segs = P.muri.segmenti;
  const aper = aperturePerMuro(P);
  const inWall = (x, y) => segs.find((s) => x >= s.rect.x && x <= s.rect.x + s.rect.w && y >= s.rect.y && y <= s.rect.y + s.rect.d);
  for (const k of Object.keys(st)) {
    for (const rc of P.stanze[k].rettangoli || [P.stanze[k].rect]) {
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
function esterni(ctx, walls) {
  const M = getMateriali();
  const g = new THREE.Group();
  const E = plan.esterni;
  const matSoletta = [M.pietraScura, M.pietraScura, M.cotto, M.pietraScura, M.pietraScura, M.pietraScura];
  const slab = (r, y = -0.16, t = 0.16) => {
    const m = r2m(r);
    g.add(box(m.w, t, m.d, matSoletta, m.cx, y + t / 2, m.cz)); // soletta con faccia superiore in cotto
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
  g.add(box(pm.x + pm.w - topX0, 0.16, pm.d, matSoletta, (topX0 + pm.x + pm.w) / 2, -0.08, pm.cz));
  // rampa 2: scende verso ovest, 10 gradini
  const n2 = P.scala_esterna_rampa2.gradini, rise2 = 1.7 / n2, tread2 = r2.w / n2;
  for (let i = 0; i < n2; i++) {
    const yTop = -rise2 * (i + 1);
    const x = topX0 - tread2 * (i + 0.5);
    g.add(box(tread2, 0.16, pm.d, matSoletta, x, yTop - 0.08, pm.cz));
  }
  // muro di sinistra della scala (definito qui perche' il pianerottolo ci si appoggia)
  const mx0 = -0.25, mx1 = 0.03;                      // sovrapposto di 3 cm al filo della casa
  // pianerottolo intermedio (quota -1.7): arriva fino al filo interno del muro
  const midX0 = mx1, midW = r2.x - midX0;
  g.add(box(midW, 0.16, pm.d, matSoletta, midX0 + midW / 2, -1.7 - 0.08, pm.cz));
  // rampa 1: scende verso sud, 12 gradini fino a -3.4
  const n1 = P.scala_esterna_rampa1.gradini, rise1 = 1.7 / n1, tread1 = r1.d / n1;
  for (let i = 0; i < n1; i++) {
    const yTop = -1.7 - rise1 * (i + 1);
    const z = r1.z + tread1 * (i + 0.5);
    const gx0 = Math.min(r1.x, mx1), gw = r1.x + r1.w - gx0;
    g.add(box(gw, 0.16, tread1, matSoletta, gx0 + gw / 2, yTop - 0.08, z));
  }
  // ringhiere: pianerottolo alto (lato sud), rampa 2 (lato sud, inclinata), pianerottolo intermedio
  g.add(ringhiera(topX0, pm.z + pm.d, b1.x, pm.z + pm.d, ctx));
  // blocca la discesa in prima persona (si resta al piano)
  ctx.addColliderBox(topX0 - 0.1, topX0, pm.z, pm.z + pm.d, 0, 1.2);

  // ---- salendo: muro pieno a sinistra, ringhiera a destra ----
  // muro unico: tratto orizzontale sul pianerottolo, poi rampante liscio (nessun gradone)
  const cima = (yPiano) => yPiano + 1.05;
  {
    const zA = pm.z - 0.05, zB = r1.z, zC = r1.z + r1.d;
    const yBase = -3.6;
    const sh = new THREE.Shape();
    sh.moveTo(zA, yBase);
    sh.lineTo(zA, cima(-1.7));
    sh.lineTo(zB, cima(-1.7));
    sh.lineTo(zC, cima(-3.4));
    sh.lineTo(zC, yBase);
    sh.closePath();
    const sp = mx1 - mx0;
    const gm = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: sp, bevelEnabled: false, curveSegments: 1 }));
    gm.rotateY(-Math.PI / 2);                          // x della forma -> Z mondo, estrusione -> -X
    const muro = new THREE.Mesh(gm, M.intonacoEsterno);
    muro.position.x = mx1;
    muro.castShadow = true; muro.receiveShadow = true;
    g.add(muro);
    ctx.addColliderBox(mx0, mx1, zA, zC, -3.4, cima(-1.7));
  }
  // ringhiera che segue una rampa, costruita lungo X e poi inclinata e orientata
  const ringhieraRampa = (xa, za, ya, xb, zb, yb, n) => {
    const dx = xb - xa, dz = zb - za, dy = yb - ya;
    const L = Math.hypot(dx, dz), Ls = Math.hypot(L, dy);
    const dentro = new THREE.Group();
    dentro.add(box(Ls, 0.035, 0.05, M.ferro, 0, 1.0, 0));
    dentro.add(box(Ls, 0.02, 0.02, M.ferro, 0, 0.1, 0));
    for (let i = 0; i <= n; i++) {
      const t = -Ls / 2 + (i / n) * Ls;
      dentro.add(box(0.014, 0.9, 0.014, M.ferro, t, 0.55, 0));
      if (i % 3 === 1) dentro.add(box(0.05, 0.05, 0.02, M.ferro, t, 0.6, 0).rotateX(Math.PI / 4));
    }
    dentro.rotation.z = Math.atan2(dy, L);
    const fuori = new THREE.Group();
    fuori.add(dentro);
    fuori.position.set((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2);
    fuori.rotation.y = Math.atan2(-dz, dx);
    g.add(fuori);
    ctx.addColliderBox(Math.min(xa, xb) - 0.05, Math.max(xa, xb) + 0.05,
      Math.min(za, zb) - 0.05, Math.max(za, zb) + 0.05, Math.min(ya, yb), Math.max(ya, yb) + 1.05);
  };
  // rampa alta: salendo verso est, la destra e' il lato sud
  ringhieraRampa(r2.x, pm.z + pm.d, -1.7, topX0, pm.z + pm.d, 0, n2);
  // raccordo piano sul pianerottolo intermedio
  g.add(ringhiera(r1.x + r1.w, pm.z + pm.d, r2.x, pm.z + pm.d, ctx, { y: -1.7 }));
  // rampa bassa: salendo verso nord, la destra e' il lato est
  ringhieraRampa(r1.x + r1.w, r1.z + r1.d, -3.4, r1.x + r1.w, r1.z, -1.7, n1);
  // il piano terra (casa della cognata) e' costruito a parte, vedi pianoTerra.js
  // il terrazzo (tetto dei suoceri) e' un gruppo a parte: vedi costruisciArchitettura
  // lanterne in ottone: ingresso, balcone a ovest e balcone a sud-est
  // sono appese ai muri del piano primo: stanno con i muri, cosi' spariscono insieme a loro
  // (vista del piano terra, pareti basse) invece di restare sospese nel vuoto
  walls.add(lanterna(ctx, 5.78, 2.15, 9.66, 'z+', { intensita: 16 }));
  walls.add(lanterna(ctx, -0.01, 2.15, 7.85, 'x-', { intensita: 12 }));
  walls.add(lanterna(ctx, 9.35, 2.15, 10.98, 'z+', { intensita: 12 }));
  // terreno
  const ground = plane(70, 70, M.terreno, 5, -3.4, 0, 'y+');
  g.add(ground);
  return g;
}

// ---------- terrazzo a nord ----------
// E' il tetto dell'edificio dei suoceri: solaio, pavimento in cotto, recinzione a muro pieno
// da 40 cm e, oltre il muretto, falde in coppi da 70 cm su ovest, nord ed est che arrivano a filo
// dei loro muri esterni (594 + 2 x (40 + 70) = 814, vedi piano-suoceri.json).
const Y_TESTA_SUOCERI = -0.30; // testa dei muri dei suoceri: 3,40 - 3,10
function falda(L, f, { yB = Y_TESTA_SUOCERI, yI = 0, yO = -0.21 } = {}) {
  // falda lungo x (lunghezza L, centrata), in pendenza verso -z: interno a z = 0, gronda a z = -f
  const M = getMateriali();
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(0, yB); sh.lineTo(f, yB); sh.lineTo(f, yO); sh.lineTo(0, yI); sh.closePath();
  const gm = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false, curveSegments: 1 }));
  gm.rotateY(Math.PI / 2);               // s della sezione -> -z, estrusione -> +x
  gm.translate(-L / 2, 0, 0);
  const corpo = new THREE.Mesh(gm, M.intonacoEsterno);
  corpo.castShadow = true; corpo.receiveShadow = true;
  g.add(corpo);
  // manto in coppi appoggiato sulla pendenza
  const a = Math.atan2(yI - yO, f), w = Math.hypot(f, yI - yO), t = 0.03;
  const cop = box(L, t, w, M.coppi, 0, 0, 0);
  cop.rotation.x = -a;
  cop.position.set(0, (yI + yO) / 2 + (t / 2) * Math.cos(a), -f / 2 - (t / 2) * Math.sin(a));
  g.add(cop);
  // grondaia in rame lungo la gronda
  const gr = cyl(0.055, 0.055, L, M.rame, 0, yO - 0.02, -f - 0.05, 12);
  gr.rotation.z = Math.PI / 2;
  g.add(gr);
  return g;
}
function terrazzoNord(ctx) {
  const M = getMateriali();
  const g = new THREE.Group();
  const T = plan.esterni.terrazzo_nord;
  const I = T.interno_cm;
  const xO = I.x_ovest * C, zS = I.z_sud * C, zN = I.z_nord * C, zR = I.z_risega * C;
  const xEs = I.x_est_tratto_sud * C, xEn = I.x_est_tratto_nord * C;
  const sp = T.recinzione.spessore_cm * C, hm = T.recinzione.altezza_cm * C;
  const f = (T.falde_cm ?? 0) * C;
  // solaio: poggia sulla testa dei muri dei suoceri, nei due tratti di larghezza diversa
  const yB = Y_TESTA_SUOCERI;
  for (const [x0, z0, x1, z1] of [[xO - sp, zR - sp, xEs + sp, zS], [xO - sp, zN - sp, xEn + sp, zR - sp]]) {
    g.add(box(x1 - x0, -yB, z1 - z0, M.intonacoEsterno, (x0 + x1) / 2, yB / 2, (z0 + z1) / 2));
  }
  // pavimento in cotto
  g.add(plane(xEs - xO, zS - zR, M.cotto, (xO + xEs) / 2, 0.002, (zR + zS) / 2, 'y+'));
  g.add(plane(xEn - xO, zR - zN, M.cotto, (xO + xEn) / 2, 0.002, (zN + zR) / 2, 'y+'));
  // recinzione: anello di muri pieni, tratti adiacenti e mai sovrapposti
  const muro = (a, c, b, d, cop) => {
    g.add(box(b - a, hm, d - c, M.intonacoEsterno, (a + b) / 2, hm / 2, (c + d) / 2));
    const [ca, cc, cb, cd] = cop; // copertina in pietra, aggetto solo verso l'esterno
    g.add(box(cb - ca, 0.05, cd - cc, M.pietra, (ca + cb) / 2, hm + 0.025, (cc + cd) / 2));
    ctx.addColliderBox(a, b, c, d, 0, hm);
  };
  const ag = 0.045;
  muro(xO - sp, zN - sp, xO, zS, [xO - sp - ag, zN - sp, xO, zS]);         // ovest
  muro(xO, zN - sp, xEn + sp, zN, [xO, zN - sp - ag, xEn + sp, zN]);       // nord
  muro(xEn, zN, xEn + sp, zR - sp, [xEn, zN, xEn + sp + ag, zR - sp]);     // est, tratto nord
  muro(xEn, zR - sp, xEs + sp, zR, [xEn, zR - sp, xEs + sp + ag, zR]);     // risega di 40 cm
  muro(xEs, zR, xEs + sp, zS, [xEs, zR, xEs + sp + ag, zS]);               // est, tratto sud
  if (!f) return g;
  // falde oltre il muretto: ogni falda corre per tutto il lato, negli angoli si incrociano
  const xW = xO - sp, zNo = zN - sp, xEn2 = xEn + sp, xEs2 = xEs + sp, zR2 = zR - sp;
  const metti = (fa, x, z, ry) => { fa.position.set(x, 0, z); fa.rotation.y = ry; g.add(fa); };
  metti(falda(zS - (zNo - f), f), xW, (zNo - f + zS) / 2, Math.PI / 2);                    // ovest
  metti(falda(xEn2 + f - (xW - f), f), (xW - f + xEn2 + f) / 2, zNo, 0);                   // nord
  metti(falda(zR2 - (zNo - f), f), xEn2, (zNo - f + zR2) / 2, -Math.PI / 2);              // est, tratto nord
  metti(falda(xEs2 + f - xEn2, f), (xEn2 + xEs2 + f) / 2, zR2, 0);                         // sopra il gradino
  metti(falda(zS - (zR2 - f), f), xEs2, (zR2 - f + zS) / 2, -Math.PI / 2);                // est, tratto sud
  // pluviali in rame agli angoli esterni
  for (const [x, z] of [[xW - f - 0.05, zNo - f - 0.05], [xEn2 + f + 0.05, zNo - f - 0.05], [xEs2 + f + 0.05, zS - 0.12], [xW - f - 0.05, zS - 0.12]]) {
    g.add(cyl(0.04, 0.04, 3.4 + yB, M.rame, x, (yB - 3.4) / 2 - 0.02, z, 10));
  }
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

// ---------- involucro di un piano: muri con aperture, porte, finestre, battiscopa ----------
// hMuro(seg) = altezza del muro in metri (i muri esterni del piano terra salgono fino al piano primo)
function involucro(P, st, ctx, walls, wallsLow, hMuro) {
  const aper = aperturePerMuro(P);
  const segById = {};
  const precedenti = [];
  for (const seg of P.muri.segmenti) {
    segById[seg.id] = seg;
    walls.add(buildMuro(seg, aper[seg.id] || [], hMuro(seg), ctx, false, precedenti));
    wallsLow.add(buildMuro(seg, aper[seg.id] || [], 0.45, { addCollider() {} }, true, precedenti));
    precedenti.push(seg);
  }
  // porte e finestre con gli spigoli arrotondati (telai, ante, scuri), come gli arredi
  conSmusso(() => {
    for (const p of P.porte) walls.add(buildPorta(aper[p.muro].find((x) => x.id === p.id), segById[p.muro], ctx, P));
    for (const f of P.finestre) {
      const o = aper[f.muro].find((x) => x.id === f.id);
      walls.add(buildFinestra(o, segById[f.muro], ctx));
    }
  });
  walls.add(battiscopa(st, ctx, P));
}

// ---------- un piano generico (piano terra): involucro, pavimenti e soffitti ----------
// Tutto e' costruito con il pavimento a quota 0: chi lo usa sposta il gruppo alla quota del piano.
export function costruisciPiano(P, ctx, { floorMat = {}, ceilMat = {} } = {}) {
  const M = getMateriali();
  const Hp = P.altezze.soffitto_cm * C;
  const st = stanzeDi(P);
  const walls = new THREE.Group();
  const wallsLow = new THREE.Group();
  const floors = new THREE.Group();
  const ceilings = new THREE.Group();
  involucro(P, st, ctx, walls, wallsLow, (seg) => (seg.h_cm ? seg.h_cm * C : Hp));
  for (const k of Object.keys(st)) {
    for (const r of st[k].rects) {
      floors.add(plane(r.w, r.d, floorMat[k] || M.cotto, r.cx, 0.005, r.cz, 'y+'));
      ceilings.add(plane(r.w, r.d, ceilMat[k] || M.intonacoSoffitto, r.cx, Hp - 0.012, r.cz, 'y-'));
    }
  }
  return { walls, wallsLow, floors, ceilings, stanze: st, H: Hp };
}

// ---------- tetto a capanna ----------
// Colmo est-ovest a meta' profondita', falde a nord e a sud in coppi, timpani sulle facciate
// est e ovest. Il perimetro del piano primo e' un rettangolo pieno (1051 x 1097) con la loggia
// d'ingresso rientrata a sud-ovest: la falda sud la copre, retta da una trave in legno.
const PENDENZA = 0.32;
function prisma(punti, sp, mat, xFilo) {
  // sagoma nel piano (z, y) estrusa verso -x di sp, con la faccia esterna a x = xFilo
  const sh = new THREE.Shape();
  punti.forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
  sh.closePath();
  const gm = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: sp, bevelEnabled: false, curveSegments: 1 }));
  gm.rotateY(-Math.PI / 2);
  const m = new THREE.Mesh(gm, getMateriali().intonacoEsterno);
  m.position.x = xFilo;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function tettoCapanna() {
  const M = getMateriali();
  const g = new THREE.Group();
  const I = plan.muri.ingombro_esterno;
  const W = I.larghezza_cm * C, D = I.profondita_cm * C;
  const p = PENDENZA, a = Math.atan(p);
  const y0 = H + 0.3;                       // intradosso della falda sul filo dei muri
  const zc = D / 2, yc = y0 + zc * p;       // colmo (intradosso)
  const sporto = 0.45, sportoT = 0.35, t = 0.18;
  const yFalda = (z) => y0 + (zc - Math.abs(z - zc)) * p; // intradosso in ogni punto
  // falde: sopra coppi, sotto tavolato in legno, bordi in cotto
  const matFalda = [M.cotto, M.cotto, M.coppi, M.rovere, M.cotto, M.cotto];
  const Lx = W + 2 * sportoT;
  for (const verso of [1, -1]) {           // 1 = falda nord (sale verso sud), -1 = falda sud
    const zGronda = verso > 0 ? -sporto : D + sporto;
    const run = zc - zGronda;
    const Ls = Math.hypot(run, run * p);
    const zm = (zGronda + zc) / 2, ym = yFalda(zm);
    const f = box(Lx, t, Math.abs(Ls), matFalda, W / 2, 0, 0);
    f.rotation.x = -verso * a;
    const nY = Math.cos(a), nZ = -verso * Math.sin(a);
    f.position.set(W / 2, ym + (t / 2) * nY, zm + (t / 2) * nZ);
    g.add(f);
    // travetti a vista sotto lo sporto (e sotto tutta la loggia, a sud-ovest)
    for (let x = -0.2; x <= W + 0.2; x += 0.6) {
      const zIn = verso > 0 ? 0 : (x < 5.84 ? 9.65 : D);
      const za = Math.min(zIn, zGronda), zb = Math.max(zIn, zGronda);
      const L = (zb - za) / Math.cos(a);
      const tr = box(0.08, 0.12, L, M.noceScuro, x, 0, 0, { cast: false });
      tr.rotation.x = -verso * a;
      const zt = (za + zb) / 2;
      tr.position.set(x, yFalda(zt) - 0.06 / Math.cos(a), zt);
      g.add(tr);
    }
    // grondaia in rame
    const gr = cyl(0.06, 0.06, Lx, M.rame, W / 2, yFalda(zGronda) - 0.02, zGronda - verso * 0.05, 12);
    gr.rotation.z = Math.PI / 2;
    g.add(gr);
  }
  // coppi di colmo
  const colmo = cyl(0.12, 0.12, Lx + 0.04, M.coppi, W / 2, yc + t / Math.cos(a), zc, 12);
  colmo.rotation.z = Math.PI / 2;
  g.add(colmo);
  // timpani est e ovest, dalla testa dei muri fino all'intradosso delle falde
  const tri = [[0, H], [D, H], [D, y0], [zc, yc], [0, y0]];
  g.add(prisma(tri, 0.25, M.intonacoEsterno, 0.25));
  g.add(prisma(tri, 0.25, M.intonacoEsterno, W));
  // chiusure del sottotetto sopra la loggia: muro sud del soggiorno e fianco verso la camera sud
  g.add(box(5.84 - 0.25, yFalda(9.40) + 0.06 - (H + 0.28), 0.25, M.intonacoEsterno, (0.25 + 5.84) / 2, (yFalda(9.40) + 0.06 + H + 0.28) / 2, 9.525));
  g.add(prisma([[9.65, H + 0.28], [D, H + 0.28], [D, yFalda(D) + 0.05], [9.65, yFalda(9.65) + 0.05]], 0.3, M.intonacoEsterno, 6.14));
  // trave in legno sul fronte della loggia
  g.add(box(5.84 - 0.25, yFalda(D - 0.15) + 0.01 - H, 0.15, M.noceScuro, (0.25 + 5.84) / 2, (H + yFalda(D - 0.15) + 0.01) / 2, D - 0.075));
  // pluviali in rame agli angoli nord, lontani dal terrazzo
  for (const x of [0.4, W - 0.4]) {
    g.add(cyl(0.045, 0.045, yFalda(-sporto) + 3.4, M.rame, x, (yFalda(-sporto) - 3.4) / 2, -sporto + 0.02, 10));
  }
  // comignolo sopra il camino del piano terra
  const cx = 0.8, cz = 9.0, yTop = yFalda(cz) + t + 0.95;
  g.add(box(0.55, yTop - (H + 0.28), 0.55, M.intonacoEsterno, cx, (yTop + H + 0.28) / 2, cz));
  g.add(box(0.7, 0.05, 0.7, M.pietra, cx, yTop + 0.025, cz));
  for (const s of [-1, 1]) g.add(box(0.1, 0.22, 0.1, M.pietra, cx + s * 0.22, yTop + 0.16, cz));
  const cap = cyl(0.02, 0.5, 0.22, M.coppi, cx, yTop + 0.38, cz, 4);
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  return g;
}

// ---------- costruzione completa del piano primo ----------
export function costruisciArchitettura(ctx) {
  const M = getMateriali();
  const st = stanze();
  const walls = new THREE.Group();
  const wallsLow = new THREE.Group();
  const floors = new THREE.Group();
  const ceilings = new THREE.Group();
  involucro(plan, st, ctx, walls, wallsLow, () => H);

  // pavimenti e soffitti
  const floorMat = { soggiorno: M.cotto, bagno: M.cementine, disimpegno: M.cotto, camera_nord: M.parquet, camera_est: M.parquet, camera_sud: M.parquet };
  const ceilMat = { disimpegno: M.salvia };
  for (const k of Object.keys(st)) {
    for (const r of st[k].rects) {
      floors.add(plane(r.w, r.d, floorMat[k], r.cx, 0.005, r.cz, 'y+'));
      // soffitto 1 cm sotto la sommità dei muri: mai complanare con solaio o teste dei muri
      const matSoff = ceilMat[k] || M.intonacoSoffitto;
      if (k === 'camera_est') {
        for (const p of pezziConForo(r.x, r.z, r.x + r.w, r.z + r.d, VANO_SCALA)) {
          ceilings.add(plane(p.w, p.d, matSoff, p.cx, H - 0.012, p.cz, 'y-'));
        }
      } else {
        ceilings.add(plane(r.w, r.d, matSoff, r.cx, H - 0.012, r.cz, 'y-'));
      }
    }
  }
  ceilings.add(travi(st));
  // solaio di copertura + cornicione
  const I = plan.muri.ingombro_esterno;
  const W = I.larghezza_cm * C;
  // solaio: faccia superiore in cotto tramite materiale per faccia (niente piano sovrapposto)
  const matTetto = [M.intonacoEsterno, M.intonacoEsterno, M.cotto, M.intonacoEsterno, M.intonacoEsterno, M.intonacoEsterno];
  for (const p of pezziConForo(-0.25, -0.25, W + 0.25, 9.9, VANO_SCALA)) {
    ceilings.add(box(p.w, 0.26, p.d, matTetto, p.cx, H + 0.15, p.cz));
  }
  // tetto a capanna sopra il solaio: il foro della scala porta al sottotetto
  ceilings.add(tettoCapanna());
  const roof = box(0.001, 0.001, 0.001, matTetto, -50, -50, -50);
  const roof2 = box((I.larghezza_cm - 584) * C + 0.5, 0.26, 1.32 + 0.25, matTetto, (584 + (I.larghezza_cm - 584) / 2) * C + 0.125, H + 0.15, 9.65 + 0.66 + 0.125);
  ceilings.add(roof2);

  const exterior = esterni(ctx, walls);
  const terrazzo = terrazzoNord(ctx);
  return { walls, wallsLow, floors, ceilings, exterior, terrazzo, stanze: st };
}
