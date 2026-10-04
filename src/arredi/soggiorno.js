// Soggiorno (zona sud del soggiorno-pranzo-cucina e appendice est), stile country chiaro:
// boiserie bianco latte, divano in lino avena con cuscini azzurri e a fiorellini, tappeto
// persiano panna e blu, rovere e ottone, tende in lino azzurro e a pacchetto in bambu'.
import * as THREE from 'three';
import { specchio } from './bagno.js';
import { box, cyl, sphere, plane, group, place, matColore, pomolo, cuscino, tappeto, tappetoPersiano, tendaBambu, stampaBotanica, quadro, pianta, libri, lampadaTavolo, applique, tende, manigliaOttone, antaTelaio, MAT } from './comune.js';

// ---- boiserie a riquadri su una parete (piano XY locale, normale +Z verso la stanza) ----
export function boiserie(ctx, { w, h, righe = 2, colonne = 3, finestra = null, mat }) {
  const M = MAT();
  const m = mat || M.salvia;
  const g = new THREE.Group();
  // fondo (a pezzi se c'è una finestra: [x0,x1,y0,y1] locali)
  if (finestra) {
    const [fx0, fx1, fy0, fy1] = finestra;
    const pieces = [[-w / 2, fx0, 0, h], [fx1, w / 2, 0, h], [fx0, fx1, 0, fy0], [fx0, fx1, fy1, h]];
    for (const [a, b, c, d] of pieces) if (b - a > 0.01 && d - c > 0.01) g.add(plane(b - a, d - c, m, (a + b) / 2, (c + d) / 2, 0.02, 'z+'));
  } else g.add(plane(w, h, m, 0, h / 2, 0.02, 'z+'));
  // zoccolo alto e cornice sommitale
  g.add(box(w, 0.16, 0.03, m, 0, 0.08, 0.035));
  g.add(box(w, 0.06, 0.04, m, 0, h - 0.03, 0.04));
  g.add(box(w, 0.025, 0.05, m, 0, 1.0, 0.045)); // fascia a mezza altezza (dado)
  // riquadri con cornice modanata
  const frame = (x0, x1, y0, y1) => {
    const t = 0.035, d = 0.02;
    g.add(box(x1 - x0, t, d, m, (x0 + x1) / 2, y1 - t / 2, 0.03));
    g.add(box(x1 - x0, t, d, m, (x0 + x1) / 2, y0 + t / 2, 0.03));
    g.add(box(t, y1 - y0, d, m, x0 + t / 2, (y0 + y1) / 2, 0.03));
    g.add(box(t, y1 - y0, d, m, x1 - t / 2, (y0 + y1) / 2, 0.03));
  };
  const gap = 0.12;
  const cw = (w - gap * (colonne + 1)) / colonne;
  for (let c = 0; c < colonne; c++) {
    const x0 = -w / 2 + gap + c * (cw + gap), x1 = x0 + cw;
    const bands = [[0.24, 0.92], [1.1, h - 0.14]];
    for (const [y0, y1] of bands) {
      if (finestra) {
        const [fx0, fx1, fy0, fy1] = finestra;
        if (x1 > fx0 - 0.05 && x0 < fx1 + 0.05 && y1 > fy0 - 0.05 && y0 < fy1 + 0.05) {
          // sotto o sopra la finestra: riquadro ridotto
          if (y0 < fy0 - 0.2) frame(x0, x1, y0, Math.min(y1, fy0 - 0.1));
          if (y1 > fy1 + 0.2) frame(x0, x1, Math.max(y0, fy1 + 0.1), y1);
          continue;
        }
      }
      frame(x0, x1, y0, y1);
    }
  }
  return g;
}

// ---- divano 3 posti in lino tortora con cuscini in velluto ----
// opz.mat: tessuto; opz.cuscini: materiali dei cuscini decorativi; opz.plaid: materiale del plaid
export function divano(ctx, x, z, ry = 0, L = 2.3, opz = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const D = opz.profondo ? 1.02 : 0.95;
  const T = opz.mat || M.linoTortora;
  g.add(box(L, 0.12, D - 0.1, T, 0, 0.26, 0.05)); // telaio
  g.add(box(L - 0.4, 0.16, D - 0.3, T, 0, 0.4, 0.1)); // cuscini seduta
  g.add(box(L, 0.5, 0.18, T, 0, 0.57, -D / 2 + 0.1)); // schienale
  for (const s of [-1, 1]) g.add(box(0.2, 0.42, D - 0.1, T, s * (L / 2 - 0.1), 0.53, 0.05)); // braccioli
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.035, 0.2, M.noce, sx * (L / 2 - 0.15), 0.1, sz * (D / 2 - 0.15), 10));
  const n = Math.floor(L / 0.7);
  for (let i = 0; i < n; i++) g.add(box(0.55, 0.42, 0.14, T, -L / 2 + 0.25 + 0.05 + i * ((L - 0.6) / (n - 1 || 1)) + 0.0 - 0.0, 0.63, -D / 2 + 0.24));
  const cuscini = opz.cuscini || [M.velluto, M.vellutoSalvia];
  cuscini.forEach((c, i) => {
    const t = cuscini.length === 1 ? 0.5 : i / (cuscini.length - 1);
    const xx = -L / 2 + 0.45 + t * (L - 0.9), ang = (0.5 - t) * 0.6;
    g.add(cuscino(i % 2 ? 0.42 : 0.47, i % 2 ? 0.4 : 0.44, 0.16, c, xx, 0.68 - (i % 2) * 0.02, -D / 2 + 0.36 + (i % 2) * 0.05, ang));
  });
  g.add(box(0.5, 0.06, 0.6, opz.plaid || M.vellutoSalvia, L / 2 - 0.7, 0.51, 0.15)); // plaid piegato
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- poltrona in velluto salvia con struttura in noce ----
export function poltrona(ctx, x, z, ry = 0, mat) {
  const M = MAT();
  const m = mat || M.vellutoSalvia;
  const g = new THREE.Group();
  g.add(box(0.7, 0.14, 0.7, m, 0, 0.35, 0.05));
  g.add(box(0.7, 0.12, 0.65, m, 0, 0.47, 0.06));
  g.add(box(0.7, 0.55, 0.16, m, 0, 0.62, -0.32));
  for (const s of [-1, 1]) g.add(box(0.14, 0.3, 0.7, M.noce, s * 0.36, 0.5, 0.05));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.035, 0.28, M.noce, sx * 0.3, 0.14, sz * 0.3, 10));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- tavolino ovale in noce con bordo in ottone ----
export function tavolino(ctx, x, z) {
  const M = MAT();
  const g = new THREE.Group();
  const top = cyl(0.45, 0.45, 0.04, M.noce, 0, 0.42, 0, 32); top.scale.z = 0.65; g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.008, 6, 40), M.ottone); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.65; rim.position.y = 0.44; g.add(rim);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cyl(0.012, 0.012, 0.42, M.ferro, Math.cos(a) * 0.3, 0.21, Math.sin(a) * 0.2, 8);
    leg.rotation.z = -Math.cos(a) * 0.15; leg.rotation.x = Math.sin(a) * 0.15; g.add(leg);
  }
  // libri e ciotola
  g.add(libri(0.3, -0.1, 0.44, 0.05, 2).rotateX(Math.PI / 2).rotateZ(Math.PI / 2));
  g.add(cyl(0.1, 0.07, 0.05, M.ceramicaSalvia, 0.2, 0.465, -0.05, 16));
  place(g, x, z);
  ctx.solid(g);
  return g;
}

// ---- libreria a giorno in ferro e noce ----
export function libreria(ctx, { w = 1.4, h = 2.3, d = 0.35, x, z, ry = 0, legno, metallo }) {
  const M = MAT();
  const Lg = legno || M.noce, Me = metallo || M.ferro;
  const g = new THREE.Group();
  const n = 5;
  for (let i = 0; i <= n; i++) g.add(box(w, 0.035, d, Lg, 0, 0.1 + i * ((h - 0.1) / n), 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.02, h, 0.02, Me, sx * (w / 2 - 0.01), h / 2, sz * (d / 2 - 0.01)));
  for (let i = 0; i < n; i++) {
    const y = 0.1 + i * ((h - 0.1) / n) + 0.018;
    if (i % 2 === 0) g.add(libri(w * 0.8, -w * 0.05, y, 0, i * 3 + 1));
    else {
      g.add(libri(w * 0.4, -w / 2 + w * 0.25, y, 0, i * 5 + 2));
      g.add(cyl(0.06, 0.05, 0.18, i % 4 ? M.ceramicaSalvia : M.cotto, w * 0.25, y + 0.09, 0, 14));
      g.add(box(0.14, 0.18, 0.02, M.carta, w * 0.4, y + 0.09, 0));
    }
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- credenza bassa in noce con ante a telaio e ottone ----
export function credenza(ctx, { w = 1.3, x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const h = 0.82, d = 0.45;
  g.add(box(w, h - 0.12, d, M.noce, 0, 0.12 + (h - 0.12) / 2, 0));
  g.add(box(w + 0.04, 0.03, d + 0.03, M.pietraScura, 0, h + 0.015, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.03, 0.12, M.noceScuro, sx * (w / 2 - 0.08), 0.06, sz * (d / 2 - 0.08), 10));
  const n = 3, aw = w / n;
  for (let i = 0; i < n; i++) {
    const a = antaTelaio(aw - 0.02, h - 0.18, M.noce, 0.05);
    a.position.set(-w / 2 + aw * (i + 0.5), 0.12 + (h - 0.18) / 2, d / 2 + 0.005); g.add(a);
    g.add(manigliaOttone(0.1, -w / 2 + aw * (i + 0.5), 0.5, d / 2 + 0.02, true));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- consolle sottile in noce e ferro ----
export function consolle(ctx, { w = 0.9, x, z, ry = 0, legno, metallo }) {
  const M = MAT();
  const Lg = legno || M.noce, Me = metallo || M.ferro;
  const g = new THREE.Group();
  g.add(box(w, 0.035, 0.32, Lg, 0, 0.8, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.02, 0.8, 0.02, Me, sx * (w / 2 - 0.02), 0.4, sz * 0.13));
  g.add(box(w - 0.04, 0.02, 0.28, Me, 0, 0.15, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- mobile TV: bassa credenza in noce con ante a rete d'ottone, vano a giorno
// centrale, top in pietra e gambe in ferro battuto ----
export function mobileTv(ctx, { x, z, w = 1.6, d = 0.46, h = 0.46, ry = 0, legno, top }) {
  const M = MAT();
  const Lg = legno || M.noce;
  const g = new THREE.Group();
  const hG = 0.16, hC = h - hG, yC = hG + hC / 2, sp = 0.022;
  // gambe in ferro leggermente svasate, con traversine
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = box(0.022, hG + 0.05, 0.022, M.ferro, sx * (w / 2 - 0.08), (hG + 0.05) / 2, sz * (d / 2 - 0.08));
    leg.rotation.z = -sx * 0.07; leg.rotation.x = sz * 0.07;
    g.add(leg);
  }
  for (const sz of [-1, 1]) g.add(box(w - 0.18, 0.012, 0.012, M.ferro, 0, 0.055, sz * (d / 2 - 0.08)));
  // cassa: cielo, fondo, fianchi, schienale e due setti che delimitano il vano a giorno
  const vano = 0.5;
  g.add(box(w, sp, d, Lg, 0, hG + hC - sp / 2, 0));
  g.add(box(w, sp, d, Lg, 0, hG + sp / 2, 0));
  for (const sx of [-1, 1]) g.add(box(sp, hC, d, Lg, sx * (w / 2 - sp / 2), yC, 0));
  for (const sx of [-1, 1]) g.add(box(0.02, hC, d - 0.02, Lg, sx * vano / 2, yC, 0.01));
  g.add(box(w, hC, 0.014, M.noceScuro, 0, yC, -d / 2 + 0.007));
  // top in pietra con leggero aggetto
  g.add(box(w + 0.05, 0.035, d + 0.04, top || M.pietra, 0, h + 0.0175, 0));
  // ante laterali: cornice in noce e pannello a rete d'ottone
  const aw = (w - vano) / 2 - 0.02, dh = hC - 0.04, ft = 0.055, fd = 0.022;
  for (const s of [-1, 1]) {
    const cx = s * (vano / 2 + (w - vano) / 4);
    g.add(box(aw, ft, fd, Lg, cx, yC + dh / 2 - ft / 2, d / 2 + fd / 2));
    g.add(box(aw, ft, fd, Lg, cx, yC - dh / 2 + ft / 2, d / 2 + fd / 2));
    g.add(box(ft, dh - 2 * ft, fd, Lg, cx - aw / 2 + ft / 2, yC, d / 2 + fd / 2));
    g.add(box(ft, dh - 2 * ft, fd, Lg, cx + aw / 2 - ft / 2, yC, d / 2 + fd / 2));
    g.add(plane(aw - 2 * ft, dh - 2 * ft, M.reteOttone, cx, yC, d / 2 + 0.008, 'z+'));
    g.add(pomolo(cx + s * (aw / 2 - 0.05), yC, d / 2 + fd));
  }
  // vano a giorno: ripiano e oggetti (libri coricati, scatola in ceramica)
  g.add(box(vano - 0.02, 0.018, d - 0.06, Lg, 0, yC, 0.01));
  for (let i = 0; i < 3; i++) g.add(box(0.24, 0.028, 0.17, i % 2 ? M.linoTortora : M.cuoio, -0.11, yC + 0.024 + i * 0.03, 0.02));
  g.add(box(0.15, 0.1, 0.12, M.ceramicaSalvia, 0.13, yC + 0.06, 0.02));
  g.add(box(0.15, 0.012, 0.12, M.ottone, 0.13, yC + 0.116, 0.02));
  for (let i = 0; i < 4; i++) g.add(box(0.012, 0.1, 0.14, i % 2 ? M.noceScuro : M.cuoio, -0.18 + i * 0.016, hG + 0.072, 0.02));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- televisore OLED 55 pollici (schermo spento, scocca sottile) ----
const SCOCCA = new THREE.MeshStandardMaterial({ color: '#2b2e30', roughness: 0.5, metalness: 0.4 });
const SCHERMO = new THREE.MeshStandardMaterial({ color: '#0a0c0d', roughness: 0.14, metalness: 0.55 });
export function tvOled(ctx, { x, y, z, ry = 0, w = 1.228, h = 0.695 }) {
  const scocca = SCOCCA, schermo = SCHERMO;
  const g = new THREE.Group();
  g.add(box(0.36, 0.014, 0.19, scocca, 0, 0.007, 0));       // piastra di appoggio
  g.add(box(0.09, 0.08, 0.035, scocca, 0, 0.054, 0));        // collo
  const y0 = 0.09;
  g.add(box(w, h, 0.011, scocca, 0, y0 + h / 2, -0.004));    // pannello
  g.add(box(w - 0.016, h - 0.016, 0.004, schermo, 0, y0 + h / 2, 0.004));
  g.add(box(w - 0.14, h * 0.33, 0.028, scocca, 0, y0 + h * 0.18, -0.023)); // elettronica
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}

// ---- stufa a legna in ghisa nera, alta 1,60 m, su una lastra di ardesia, piastrelle metro alle spalle ----
// Sopra la porta del fuoco con il vetro, sotto il vano per i ciocchi, in basso il cassetto della cenere.
// xMuro: filo della parete a cui si appoggia (la stufa sta a ovest); z: asse della stufa
function stufaLegna(ctx, { xMuro, z }) {
  const M = MAT();
  const g = new THREE.Group();
  const ghisa = matColore('#1d1c1b', 0.55);
  const scuro = matColore('#0d0c0b', 0.9);
  const d = 0.42, w = 0.52, x = xMuro - 0.22 - d / 2; // 22 cm dal muro
  const hTop = 1.6;
  // lastra di ardesia a pavimento e rivestimento in piastrelle metro sulla parete, con cimasa in rovere
  g.add(box(0.95, 0.025, 1.0, M.ardesia, xMuro - 0.475, 0.0125, z, { cast: false }));
  g.add(box(0.012, 2.2, 1.0, M.metro, xMuro - 0.006, 1.1, z, { cast: false }));
  g.add(box(0.05, 0.04, 1.04, M.rovereMiele, xMuro - 0.025, 2.22, z));
  // corpo su quattro piedini, zoccolo e piano superiore sporgenti
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.14, 0.05, ghisa, x + sx * (d / 2 - 0.05), 0.095, z + sz * (w / 2 - 0.05)));
  g.add(box(d, hTop - 0.2, w, ghisa, x, 0.17 + (hTop - 0.2) / 2, z));
  g.add(box(d + 0.03, 0.04, w + 0.03, ghisa, x, 0.19, z));
  g.add(box(d + 0.04, 0.035, w + 0.04, ghisa, x, hTop - 0.012, z));
  g.add(box(d + 0.02, 0.025, w + 0.02, ghisa, x, hTop - 0.31, z));            // cornice sopra la porta
  const xF = x - d / 2;
  // anello sporgente (profondo 5 cm) intorno a un'apertura sul fronte
  const anello = (yc, h, wa) => {
    for (const dy of [-1, 1]) g.add(box(0.05, 0.04, wa, ghisa, xF - 0.025, yc + dy * (h / 2 - 0.02), z));
    for (const dz of [-1, 1]) g.add(box(0.05, h, 0.04, ghisa, xF - 0.025, yc, z + dz * (wa / 2 - 0.02)));
  };
  // cassetto della cenere con pomolo in ottone
  g.add(box(0.02, 0.08, w - 0.08, ghisa, xF - 0.01, 0.28, z));
  g.add(cyl(0.012, 0.012, 0.03, M.ottone, xF - 0.035, 0.28, z, 8).rotateZ(Math.PI / 2));
  // vano dei ciocchi: fondo scuro e una catasta di legna
  const yL = 0.55, hL = 0.36;
  anello(yL, hL + 0.08, 0.46);
  g.add(box(0.006, hL, 0.38, scuro, xF - 0.003, yL, z, { cast: false }));
  const legna = [matColore('#6b4a30', 0.9), matColore('#8a6a48', 0.9), matColore('#5a3e28', 0.9)];
  [[-0.11, -0.12], [-0.11, 0], [-0.11, 0.12], [-0.02, -0.06], [-0.02, 0.06], [0.07, 0]].forEach(([dy, dz], k) => {
    const c = cyl(0.045, 0.045, 0.06, legna[k % 3], xF - 0.03, yL + dy, z + dz, 10);
    c.rotation.z = Math.PI / 2; g.add(c);
  });
  // porta del fuoco con vetro: dietro, il fuoco (si accende di sera) e due ciocchi
  const yF = 1.03, hF = 0.5;
  anello(yF, hF + 0.08, 0.46);
  const fuoco = new THREE.MeshStandardMaterial({ color: '#3a1a0a', emissive: '#ff7a2a', emissiveIntensity: 0 });
  g.add(box(0.006, hF, 0.38, fuoco, xF - 0.003, yF, z, { cast: false }));
  for (const [dy, dz] of [[-0.19, -0.03], [-0.16, 0.05]]) {
    const c = cyl(0.02, 0.02, 0.28, matColore('#4a2f1c', 0.9), xF - 0.024, yF + dy, z + dz, 8);
    c.rotation.x = Math.PI / 2; c.rotation.y = dz * 3; g.add(c);
  }
  const vetro = new THREE.Mesh(new THREE.PlaneGeometry(0.38, hF), M.vetro);
  vetro.rotation.y = -Math.PI / 2; vetro.position.set(xF - 0.045, yF, z);
  g.add(vetro);
  g.add(cyl(0.008, 0.008, 0.14, M.ottone, xF - 0.065, yF, z + 0.19, 8));
  // canna fumaria nera fino al soffitto, con rosone
  g.add(cyl(0.08, 0.08, 0.06, ghisa, x, hTop + 0.03, z, 20));
  g.add(cyl(0.075, 0.075, ctx.H - hTop - 0.06, ghisa, x, (ctx.H + hTop + 0.06) / 2, z, 20));
  g.add(cyl(0.085, 0.085, 0.03, ghisa, x, 2.15, z, 20));
  g.add(cyl(0.13, 0.13, 0.015, ghisa, x, ctx.H - 0.02, z, 24));
  // il fuoco scalda di arancio la stanza, di sera
  const luce = new THREE.PointLight('#ff9a4a', 8, 5, 2);
  luce.position.set(xF - 0.25, yF, z);
  g.add(luce);
  ctx.addLight(luce, g.children.find((m) => m.material === fuoco), null);
  ctx.solid(g);
  return g;
}

// ---- cesta di ciocchi accanto alla stufa ----
function cestaLegna(x, z) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.22, 0.2, 0.32, M.juta, 0, 0.16, 0, 20));
  const legno = [matColore('#6b4a30', 0.9), matColore('#8a6a48', 0.9), matColore('#5a3e28', 0.9)];
  for (let i = 0; i < 7; i++) {
    const c = cyl(0.045, 0.045, 0.42, legno[i % 3], -0.12 + (i % 4) * 0.08, 0.34 + Math.floor(i / 4) * 0.08, (i % 2) * 0.04 - 0.02, 8);
    c.rotation.x = Math.PI / 2; c.rotation.y = 0.15 * ((i % 3) - 1); g.add(c);
  }
  g.position.set(x, 0, z);
  return g;
}

export function arredaSoggiorno(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const [R, A, B] = stanze.soggiorno.rects; // R x 0.25-4.16 z 0.28-9.40 | B x 4.52-5.99 z 5.38-9.40
  const zS = R.z + R.d; // parete sud
  // parete sud con boiserie bianco latte (finestra F-soggiorno-sud x 1.45-2.87, y 0.9-2.3)
  const bw = R.w;
  const bo = boiserie(ctx, { w: bw, h: ctx.H, colonne: 4, finestra: [1.45 - R.cx, 2.87 - R.cx, 0.9, 2.3], mat: M.biancoLatte });
  bo.position.set(R.cx, 0, zS); bo.rotation.y = Math.PI;
  ctx.pareti.add(bo);
  // divano profondo in lino avena sotto la finestra sud, cuscini azzurri, a fiorellini e a righe
  g.add(divano(ctx, 2.16, zS - 0.52, Math.PI, 2.3, {
    mat: M.linoAvena, profondo: true, plaid: M.linoAzzurro,
    cuscini: [M.floreale, M.linoAzzurro, M.righeAzzurre, M.linoBianco, M.floreale],
  }));
  g.add(tappetoPersiano(3.0, 2.0, 2.16, zS - 1.25));
  // mobile TV in rovere davanti al divano: fa anche da separazione con la zona pranzo
  const tvZ = 6.95;
  g.add(mobileTv(ctx, { x: 2.16, z: tvZ, w: 1.6, d: 0.46, h: 0.46, legno: M.rovereMiele, top: M.marmo }));
  g.add(tvOled(ctx, { x: 2.16, y: 0.495, z: tvZ - 0.03 }));
  g.add(pianta(3.35, tvZ + 0.05, { h: 1.0, vaso: 0.16, matVaso: M.ceramica }));
  // consolle in rovere e ottone sulla parete ovest, lampada in ceramica, piccola galleria botanica sopra
  g.add(consolle(ctx, { w: 0.9, x: R.x + 0.17, z: 8.4, ry: Math.PI / 2, legno: M.rovereMiele, metallo: M.ottone }));
  g.add(lampadaTavolo(ctx, R.x + 0.17, 0.82, 8.15, { colore: 'bianca', intensita: 5 }));
  g.add(pianta(R.x + 0.35, 7.75, { h: 1.1, vaso: 0.18, matVaso: M.ceramica }));
  [[1.6, 8.2, 0.32, 0.42], [1.62, 8.66, 0.32, 0.42], [2.12, 8.2, 0.32, 0.42], [2.14, 8.66, 0.32, 0.42]].forEach(([y, z, w, h], i) => {
    ctx.pareti.add(stampaBotanica(w, h, R.x + 0.03, y, z, 'x+', 91 + i, M.rovereMiele));
  });
  // applique in ottone ai lati della finestra sud, quadri sulla boiserie
  ctx.pareti.add(applique(ctx, 1.0, 1.9, zS - 0.02, 'z-'));
  ctx.pareti.add(applique(ctx, 3.3, 1.9, zS - 0.02, 'z-'));
  ctx.pareti.add(stampaBotanica(0.5, 0.65, 0.8, 1.75, zS - 0.03, 'z-', 97, M.rovereMiele));
  ctx.pareti.add(stampaBotanica(0.5, 0.65, 3.5, 1.75, zS - 0.03, 'z-', 98, M.rovereMiele));
  // appendice est: stufa a legna contro la parete est, specchio lungo sulla parete nord
  g.add(stufaLegna(ctx, { xMuro: B.x + B.w, z: 6.1 }));
  ctx.pareti.add(specchio(ctx, 0.8, 1.9, B.cx, 1.22, B.z + 0.01, 'z+', M.ottone));
  g.add(cestaLegna(B.x + 0.3, B.z + 0.4));
  g.add(tappeto(1.3, 1.5, M.juta, B.cx, B.z + 1.95));
  // tende in lino azzurro; tende a pacchetto in bambu' sulla finestra sud e su quella del lavello
  ctx.pareti.add(tende(1.21, 2.2, R.x + 0.03, 1.15, 6.9, 'x+', M.linoAzzurro));
  ctx.pareti.add(tende(1.42, 1.5, 2.16, 1.62, zS - 0.03, 'z-', M.linoAzzurro));
  ctx.pareti.add(tendaBambu(1.42, 2.16, 2.32, zS - 0.04, 'z-'));
  ctx.pareti.add(tendaBambu(1.24, R.x + 0.04, 2.22, 3.55, 'x+'));
  return g;
}

// La pianta grande dell'appendice: in V1 nell'angolo verso la porta della camera, in V2 si
// sposta dall'altra parte e lascia libero il varco verso l'open space
export function piantaAppendice(stanze, versione) {
  const M = MAT();
  const B = stanze.soggiorno.rects[2];
  const x = versione === 'v2' ? B.x + 0.3 : B.x + B.w - 0.3;
  return pianta(x, B.z + B.d - 0.35, { h: 1.4, vaso: 0.2, matVaso: M.ceramica });
}
