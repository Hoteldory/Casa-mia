// Soggiorno (zona sud del soggiorno-pranzo-cucina e appendice est).
// Dettaglio di carattere: parete sud in verde salvia profondo con boiserie a riquadri.
import * as THREE from 'three';
import { box, cyl, sphere, plane, group, place, cuscino, tappeto, quadro, pianta, libri, lampadaTerra, lampadaTavolo, applique, tende, manigliaOttone, antaTelaio, MAT } from './comune.js';

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
export function divano(ctx, x, z, ry = 0, L = 2.3) {
  const M = MAT();
  const g = new THREE.Group();
  const D = 0.95;
  g.add(box(L, 0.12, D - 0.1, M.linoTortora, 0, 0.26, 0.05)); // telaio
  g.add(box(L - 0.4, 0.16, D - 0.3, M.linoTortora, 0, 0.4, 0.1)); // cuscini seduta
  g.add(box(L, 0.5, 0.18, M.linoTortora, 0, 0.57, -D / 2 + 0.1)); // schienale
  for (const s of [-1, 1]) g.add(box(0.2, 0.42, D - 0.1, M.linoTortora, s * (L / 2 - 0.1), 0.53, 0.05)); // braccioli
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.035, 0.2, M.noce, sx * (L / 2 - 0.15), 0.1, sz * (D / 2 - 0.15), 10));
  const n = Math.floor(L / 0.7);
  for (let i = 0; i < n; i++) g.add(box(0.55, 0.42, 0.14, M.linoTortora, -L / 2 + 0.25 + 0.05 + i * ((L - 0.6) / (n - 1 || 1)) + 0.0 - 0.0, 0.63, -D / 2 + 0.24));
  g.add(cuscino(0.45, 0.42, 0.16, M.velluto, -L / 2 + 0.5, 0.68, -D / 2 + 0.36, 0.3));
  g.add(cuscino(0.45, 0.42, 0.16, M.vellutoSalvia, L / 2 - 0.5, 0.68, -D / 2 + 0.36, -0.3));
  g.add(box(0.5, 0.06, 0.6, M.vellutoSalvia, L / 2 - 0.7, 0.51, 0.15)); // plaid piegato
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
export function libreria(ctx, { w = 1.4, h = 2.3, d = 0.35, x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const n = 5;
  for (let i = 0; i <= n; i++) g.add(box(w, 0.035, d, M.noce, 0, 0.1 + i * ((h - 0.1) / n), 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.02, h, 0.02, M.ferro, sx * (w / 2 - 0.01), h / 2, sz * (d / 2 - 0.01)));
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
export function consolle(ctx, { w = 0.9, x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, 0.035, 0.32, M.noce, 0, 0.8, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.02, 0.8, 0.02, M.ferro, sx * (w / 2 - 0.02), 0.4, sz * 0.13));
  g.add(box(w - 0.04, 0.02, 0.28, M.ferro, 0, 0.15, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaSoggiorno(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const [R, A, B] = stanze.soggiorno.rects; // R x 0.25-4.16 z 0.28-9.40 | B x 4.52-5.99 z 5.38-9.40
  const zS = R.z + R.d; // parete sud
  // parete sud in salvia con boiserie (finestra F-soggiorno-sud x 1.45-2.87, y 0.9-2.3)
  const bw = R.w;
  const bo = boiserie(ctx, { w: bw, h: ctx.H, colonne: 4, finestra: [1.45 - R.cx, 2.87 - R.cx, 0.9, 2.3] });
  bo.position.set(R.cx, 0, zS); bo.rotation.y = Math.PI;
  ctx.pareti.add(bo);
  // boiserie anche sulla parete sud dell'appendice est e lato ovest del living
  const bo2 = boiserie(ctx, { w: B.w, h: ctx.H, colonne: 2 });
  bo2.position.set(B.cx, 0, zS); bo2.rotation.y = Math.PI; ctx.pareti.add(bo2);
  // divano sotto la finestra sud, tappeto, tavolino, poltrone
  g.add(divano(ctx, 2.16, zS - 0.5, Math.PI));
  g.add(tappeto(3.0, 2.0, M.lino, 2.16, zS - 1.35, M.linoTortora));
  g.add(tavolino(ctx, 2.16, zS - 1.45));
  g.add(poltrona(ctx, 0.75, zS - 1.6, Math.PI / 2));
  g.add(poltrona(ctx, 3.6, zS - 1.6, -Math.PI / 2, M.velluto));
  // consolle sulla parete ovest tra portafinestra e angolo, con lampada e pianta
  g.add(consolle(ctx, { w: 0.9, x: R.x + 0.17, z: 8.4, ry: Math.PI / 2 }));
  g.add(lampadaTavolo(ctx, R.x + 0.17, 0.82, 8.1, { colore: 'salvia', intensita: 5 }));
  g.add(pianta(R.x + 0.35, 7.75, { h: 1.1, vaso: 0.18 }));
  // applique ai lati della finestra sud, quadri sulla boiserie
  ctx.pareti.add(applique(ctx, 1.0, 1.9, zS - 0.02, 'z-'));
  ctx.pareti.add(applique(ctx, 3.3, 1.9, zS - 0.02, 'z-'));
  ctx.pareti.add(quadro(0.5, 0.65, M.cartaBotanica, 0.8, 1.75, zS - 0.03, 'z-'));
  ctx.pareti.add(quadro(0.5, 0.65, M.cotto, 3.5, 1.75, zS - 0.03, 'z-'));
  // angolo lettura nell'appendice est: libreria contro il muro nord, poltrona, lampada da terra
  g.add(libreria(ctx, { w: 1.35, x: B.cx, z: B.z + 0.2 }));
  g.add(poltrona(ctx, B.cx + 0.1, B.z + 1.35, Math.PI * 0.9));
  g.add(lampadaTerra(ctx, B.x + 0.3, B.z + 0.9));
  g.add(tappeto(1.2, 1.4, M.linoTortora, B.cx, B.z + 1.5));
  // credenza sulla parete sud dell'appendice, con lampada e quadro
  g.add(credenza(ctx, { w: 1.2, x: B.cx - 0.05, z: zS - 0.25, ry: Math.PI }));
  g.add(lampadaTavolo(ctx, B.cx - 0.45, 0.85, zS - 0.25, { colore: 'bianco', intensita: 4, h: 0.45 }));
  g.add(cyl(0.09, 0.07, 0.3, M.ceramicaSalvia, B.cx + 0.3, 1.0, zS - 0.25, 16));
  ctx.pareti.add(quadro(0.7, 0.5, M.pietra, B.cx - 0.05, 1.7, zS - 0.03, 'z-'));
  // tenda alla portafinestra ovest e alla finestra sud
  ctx.pareti.add(tende(1.21, 2.2, R.x + 0.03, 1.15, 6.9, 'x+'));
  ctx.pareti.add(tende(1.42, 1.5, 2.16, 1.62, zS - 0.03, 'z-'));
  return g;
}
