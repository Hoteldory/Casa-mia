// Piano terra (cognata): arredi. Misure in metri, pavimento a quota 0 (main.js sposta tutto
// alla quota del piano). Riusa i mobili del piano primo dove la piantina li disegna uguali.
// Dettagli di carattere, uno per stanza:
//   cucina      camino con cappa in piastrelle smaltate verde bottiglia
//   soggiorno   parete est in blu petrolio, con la finestra nuova sopra il divano
//   camera 16   testiera in velluto ruggine
//   camera 10,99  carta da parati a righe salvia sulla parete del letto
//   camera 10,48  armadio a tre moduli laccato blu polvere
//   bagno       rivestimento a meta' parete in piastrelle smaltate verde bottiglia
import * as THREE from 'three';
import { box, cyl, sphere, plane, place, pendente, applique, lampadaTavolo, lampadaTerra, tappeto, quadro, pianta, libri, cuscino, tende, MAT } from './comune.js';
import { baseCucina, cappaMuratura, mensole, tavolo, sedia } from './cucina.js';
import { divano, mobileTv, tvOled, libreria } from './soggiorno.js';
import { lettoMatrimoniale, comodino, armadio } from './camera_nord.js';
import { lavaboCatino, specchio, wc, bidet, scaldasalviette } from './bagno.js';
import { appendiabiti, panchetta } from './disimpegno.js';

// Costruisce dentro un gruppo ruotato: gli ingombri dei pezzi costruiti in coordinate locali
// (box nascosti non agganciati alla scena) vanno trasformati con la cornice.
export function inCornice(ctx, cornice, build) {
  const prima = ctx.cornice;
  ctx.cornice = cornice;
  build(cornice);
  ctx.cornice = prima;
  return cornice;
}

// ---- letto singolo 90 x 200, testiera in noce con pannello imbottito ----
export function lettoSingolo(ctx, { x, z, ry = 0, matTestiera, matCoperta }) {
  const M = MAT();
  const g = new THREE.Group();
  const W = 0.9, L = 2.0;
  g.add(box(W + 0.1, 1.0, 0.05, M.noce, 0, 0.5, -L / 2 - 0.06));
  g.add(box(W - 0.1, 0.5, 0.06, matTestiera || M.linoTortora, 0, 0.68, -L / 2 - 0.02));
  g.add(box(W + 0.08, 0.2, L + 0.06, M.noce, 0, 0.22, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.03, 0.12, M.noceScuro, sx * (W / 2 - 0.03), 0.06, sz * (L / 2 - 0.04), 10));
  g.add(box(W, 0.2, L, M.linoBianco, 0, 0.42, 0));
  g.add(box(W + 0.05, 0.07, L * 0.6, matCoperta || M.vellutoSalvia, 0, 0.555, L * 0.2));
  g.add(box(W + 0.02, 0.05, 0.4, M.linoTortora, 0, 0.57, L / 2 - 0.25));
  g.add(cuscino(0.62, 0.28, 0.2, M.linoBianco, 0, 0.62, -L / 2 + 0.2));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- camino in pietra con cappa rivestita di piastrelle verdi, legna e brace ----
export function camino(ctx, { x0, x1, zMuro, prof = 0.57 }) {
  const M = MAT();
  const H = ctx.H;
  const g = new THREE.Group();
  const w = x1 - x0, cx = (x0 + x1) / 2, zf = zMuro - prof, cz = zMuro - prof / 2;
  // focolare rialzato
  g.add(box(w, 0.3, prof, M.pietra, cx, 0.15, cz));
  // stipiti in pietra e fondo annerito
  const sp = 0.16;
  for (const s of [-1, 1]) g.add(box(sp, 0.95, prof, M.pietra, cx + s * (w / 2 - sp / 2), 0.3 + 0.475, cz));
  g.add(box(w - 2 * sp, 0.95, 0.06, M.nero, cx, 0.775, zMuro - 0.03));
  g.add(box(w - 2 * sp, 0.02, prof - 0.08, M.pietraScura, cx, 0.31, cz + 0.02));
  // architrave in noce scuro
  g.add(box(w + 0.1, 0.15, prof + 0.05, M.noceScuro, cx, 1.325, cz - 0.025));
  // cappa: due volumi rastremati, fronte e fianchi in piastrelle smaltate verdi
  // facce del box: +x -x +y -y +z -z; il fronte guarda la stanza (-z, a nord)
  const matCappa = [M.piastrelleVerdi, M.piastrelleVerdi, M.intonaco, M.intonaco, M.intonaco, M.piastrelleVerdi];
  const pb = prof - 0.07;
  g.add(box(w - 0.04, 0.6, pb, matCappa, cx, 1.7, zMuro - pb / 2));
  const ps = prof - 0.17;
  g.add(box(w - 0.3, H - 2.0, ps, matCappa, cx, (2.0 + H) / 2, zMuro - ps / 2));
  g.add(box(w, 0.04, pb + 0.03, M.pietra, cx, 2.02, zMuro - (pb + 0.03) / 2)); // cornice fra i due volumi
  // legna sugli alari e brace che si accende di sera
  for (const [dx, dy, r] of [[-0.12, 0.37, 0.045], [0.1, 0.37, 0.05], [-0.01, 0.44, 0.04]]) {
    const t = cyl(r, r, 0.46, M.noceScuro, cx + dx, dy, cz + 0.05, 10);
    t.rotation.z = Math.PI / 2; g.add(t);
  }
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: '#3a1a0c', emissive: '#ff6a1f', emissiveIntensity: 0, roughness: 0.9 }));
  brace.position.set(cx, 0.335, cz + 0.05);
  g.add(brace);
  const fuoco = new THREE.PointLight('#ff8a3d', 5, 4.5, 2);
  fuoco.position.set(cx, 0.55, zf + 0.1);
  g.add(fuoco);
  ctx.addLight(fuoco, brace, null);
  // candele e brocca sull'architrave
  g.add(cyl(0.05, 0.04, 0.2, M.ceramicaSalvia, cx - 0.3, 1.5, cz, 14));
  for (const dx of [0.2, 0.32]) g.add(cyl(0.022, 0.022, 0.22, M.carta, cx + dx, 1.51, cz, 10));
  ctx.addColliderBox(x0, x1, zf, zMuro, 0, 2.0);
  return g;
}

// ---- panca in muratura lungo la parete, con top in pietra, nicchia per la legna e cuscini ----
export function panca(ctx, { x0, x1, zMuro, prof = 0.6, h = 0.45, legnaia = 0.65 }) {
  const M = MAT();
  const g = new THREE.Group();
  const cz = zMuro - prof / 2, zf = zMuro - prof;
  const xl = x0 + 0.08, xr = xl + legnaia;
  // corpo intonacato, interrotto dalla nicchia della legnaia
  g.add(box(xl - x0, h - 0.05, prof, M.intonaco, (x0 + xl) / 2, (h - 0.05) / 2, cz));
  g.add(box(x1 - xr, h - 0.05, prof, M.intonaco, (xr + x1) / 2, (h - 0.05) / 2, cz));
  g.add(box(legnaia, h - 0.05, 0.05, M.intonaco, (xl + xr) / 2, (h - 0.05) / 2, zMuro - 0.025));
  g.add(box(legnaia, 0.04, prof, M.intonaco, (xl + xr) / 2, 0.02, cz));
  for (let i = 0; i < 9; i++) {
    const t = cyl(0.045, 0.045, prof - 0.1, i % 3 ? M.noce : M.noceScuro, xl + 0.08 + (i % 4) * 0.15, 0.09 + Math.floor(i / 4) * 0.09, cz, 8);
    t.rotation.x = Math.PI / 2; g.add(t);
  }
  g.add(box(x1 - x0 + 0.02, 0.05, prof + 0.03, M.pietra, (x0 + x1) / 2, h - 0.025, cz - 0.015));
  // cuscini di seduta e da schienale
  const cx0 = xr + 0.1, cx1 = x1 - 0.08;
  g.add(box(cx1 - cx0, 0.08, prof - 0.1, M.linoTortora, (cx0 + cx1) / 2, h + 0.04, cz + 0.02));
  for (let i = 0; i < 3; i++) g.add(cuscino(0.45, 0.4, 0.14, i === 1 ? M.velluto : M.lino, cx0 + 0.35 + i * ((cx1 - cx0 - 0.7) / 2), h + 0.28, zMuro - 0.1, 0));
  ctx.addColliderBox(x0, x1, zf, zMuro, 0, h + 0.1);
  return g;
}

// ---- scaffale in ferro e noce per il ripostiglio, con cesti e barattoli ----
export function scaffale(ctx, { w = 1.2, h = 2.2, d = 0.4, x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const n = 5;
  for (let i = 0; i < n; i++) g.add(box(w, 0.03, d, M.noce, 0, 0.12 + i * ((h - 0.2) / (n - 1)), 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.025, h, 0.025, M.ferro, sx * (w / 2 - 0.012), h / 2, sz * (d / 2 - 0.012)));
  for (let i = 0; i < n; i++) {
    const y = 0.135 + i * ((h - 0.2) / (n - 1));
    if (i % 2 === 0) for (let k = 0; k < 3; k++) g.add(box(w / 3 - 0.05, 0.24, d - 0.06, k % 2 ? M.linoTortora : M.lino, -w / 3 + k * (w / 3), y + 0.12, 0));
    else for (let k = 0; k < 5; k++) g.add(cyl(0.06, 0.055, 0.16 + (k % 2) * 0.06, k % 3 ? M.ceramica : M.ceramicaSalvia, -w / 2 + 0.12 + k * ((w - 0.24) / 4), y + 0.08 + (k % 2) * 0.03, 0, 12));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- doccia d'angolo: piatto in pietra, vetro sul lato ovest, colonna in ottone a muro ----
export function docciaAngolo(ctx, { x0, x1, z0, z1 }) {
  const M = MAT();
  const g = new THREE.Group();
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  g.add(box(w, 0.05, d, M.pietraScura, cx, 0.025, cz));
  g.add(box(w - 0.08, 0.01, d - 0.08, M.pietra, cx, 0.052, cz, { cast: false }));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(d, 2.0), M.vetro);
  glass.rotation.y = Math.PI / 2; glass.position.set(x0, 1.05, cz); g.add(glass);
  g.add(box(0.02, 2.0, 0.02, M.ottone, x0, 1.05, z1));
  g.add(box(0.02, 0.02, d, M.ottone, x0, 2.05, cz));
  g.add(cyl(0.012, 0.012, 1.1, M.ottoneScuro, x1 - 0.06, 1.6, cz, 8));
  g.add(cyl(0.11, 0.11, 0.015, M.ottoneScuro, x1 - 0.2, 2.15, cz, 20));
  g.add(cyl(0.01, 0.01, 0.3, M.ottoneScuro, x1 - 0.14, 2.15, cz, 8).rotateZ(Math.PI / 2));
  g.add(box(0.05, 0.04, 0.16, M.ottoneScuro, x1 - 0.06, 1.05, cz));
  g.add(box(0.2, 0.02, 0.2, M.pietra, x1 - 0.1, 1.3, z0 + 0.1));
  g.add(cyl(0.025, 0.025, 0.14, M.ceramicaSalvia, x1 - 0.08, 1.38, z0 + 0.08, 10));
  ctx.addColliderBox(x0 - 0.03, x0 + 0.03, z0, z1, 0, 2);
  return g;
}

// ---- rivestimento di un tratto di parete (piano a 1,5 cm dal muro) con listello in ottone ----
export function fascia(g, mat, { asse, a, b, at, y0 = 0, y1 = 1.2, verso, listello = true }) {
  const M = MAT();
  const L = b - a, h = y1 - y0, pos = (a + b) / 2, y = (y0 + y1) / 2;
  if (L < 0.02 || h < 0.02) return;
  if (asse === 'x') g.add(plane(L, h, mat, pos, y, at + verso * 0.015, verso > 0 ? 'z+' : 'z-'));
  else g.add(plane(L, h, mat, at + verso * 0.015, y, pos, verso > 0 ? 'x+' : 'x-'));
  if (!listello) return;
  if (asse === 'x') g.add(box(L, 0.02, 0.012, M.ottone, pos, y1 + 0.01, at + verso * 0.02, { cast: false }));
  else g.add(box(0.012, 0.02, L, M.ottone, at + verso * 0.02, y1 + 0.01, pos, { cast: false }));
}

// ======================= assemblaggio per stanza =======================

function cucinaPranzo(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H;
  // cucina lineare sulla parete nord (z 5,87), da x 0,25 a 4,20, rivolta a sud.
  // I mobili del piano primo corrono lungo Z: qui si costruiscono in una cornice ruotata.
  const cornice = new THREE.Group();
  cornice.position.set(4.2, 0, 5.87);
  cornice.rotation.y = -Math.PI / 2; // x locale -> sud, z locale -> ovest
  g.add(cornice);
  inCornice(ctx, cornice, (c) => {
    c.add(baseCucina(ctx, { x0: 0, z0: 0, z1: 3.95, hobZ: 4.2 - 3.55, sinkZ: 4.2 - 1.95 }));
    c.add(cappaMuratura(ctx, { x: 0, z: 4.2 - 3.55 }));
    c.add(mensole(ctx, { x: 0, z0: 1.35, z1: 3.1 }));
  });
  // paraspruzzi in piastrelle crema con listello in pietra
  g.add(plane(3.95, 0.62, M.piastrelleCrema, 2.225, 1.21, 5.87 + 0.015, 'z+'));
  g.add(box(3.95, 0.04, 0.05, M.pietra, 2.225, 1.54, 5.87 + 0.025));
  // camino all'estremita' ovest della parete sud, panca in muratura sul resto
  g.add(camino(ctx, { x0: 0.25, x1: 1.33, zMuro: 9.42 }));
  g.add(panca(ctx, { x0: 1.33, x1: 4.2, zMuro: 9.42 }));
  // tavolo per sei, al centro della fascia libera fra cucina e panca
  const tx = 2.25, tz = 7.64, L = 1.5, W = 0.8, dz = W / 2 + 0.22;
  g.add(tavolo(ctx, { cx: tx, cz: tz, L, W, ry: Math.PI / 2 }));
  for (const dx of [-0.38, 0.38]) {
    g.add(sedia(ctx, tx + dx, tz - dz, 0));
    g.add(sedia(ctx, tx + dx, tz + dz, Math.PI));
  }
  g.add(sedia(ctx, tx - L / 2 - 0.28, tz, Math.PI / 2));
  g.add(sedia(ctx, tx + L / 2 + 0.28, tz, -Math.PI / 2));
  for (const dx of [-0.4, 0.4]) g.add(pendente(ctx, tx + dx, tz, { yTop: H, calata: 1.05, raggio: 0.19, paralume: 'salvia' }));
  // tenda alla finestra ovest
  ctx.pareti.add(tende(1.2, 1.55, 0.25 + 0.03, 1.65, 7.2, 'x+'));
  return g;
}

function ingresso(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  // appendiabiti e panchetta sul setto fra cucina e ingresso
  ctx.pareti.add(appendiabiti(ctx, 4.34 + 0.005, 1.75, 8.95, 'x+', 0.8));
  g.add(panchetta(ctx, 4.34 + 0.17, 8.95, Math.PI / 2, 0.8));
  g.add(tappeto(1.4, 0.9, M.linoTortora, 5.12, 8.8, M.noceScuro));
  g.add(pendente(ctx, 5.2, 7.9, { yTop: ctx.H, calata: 0.7, raggio: 0.16, paralume: 'ottone' }));
  // armadio a muro 60 x 109 nel passaggio verso il disimpegno, a tutta altezza
  g.add(armadio(ctx, { w: 1.09, h: 2.9, d: 0.6, x: 5.8, z: 5.915, ry: -Math.PI / 2, mat: M.tortora, ante: 2 }));
  return g;
}

function soggiorno(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const H = ctx.H;
  const xE = 10.28, z0 = 6.35, z1 = 10.77;
  // parete est in blu petrolio, attorno alla finestra nuova (z 7,15-8,65, davanzale 0,90, h 1,50)
  const wz0 = 7.15, wz1 = 8.65, wy0 = 0.9, wy1 = 2.4;
  for (const [a, b, y0, y1] of [[z0, wz0, 0.08, H], [wz1, z1, 0.08, H], [wz0, wz1, 0.08, wy0], [wz0, wz1, wy1, H]]) {
    fascia(ctx.pareti, M.bluPetrolio, { asse: 'z', a, b, at: xE, y0, y1, verso: -1, listello: false });
  }
  // divano a due posti contro la parete est, sotto la finestra; divano a tre posti davanti alla portafinestra
  g.add(divano(ctx, xE - 0.48, 7.9, -Math.PI / 2, 1.8));
  g.add(divano(ctx, 7.97, 9.575, Math.PI, 2.3));
  g.add(tappeto(2.6, 1.9, M.lino, 8.1, 8.35, M.linoTortora));
  // TV sulla parete nord, in asse con il divano grande
  g.add(mobileTv(ctx, { x: 7.97, z: z0 + 0.24, w: 1.8, d: 0.46, h: 0.46 }));
  g.add(tvOled(ctx, { x: 7.97, y: 0.495, z: z0 + 0.21 }));
  // applique ai lati della finestra, lampada da terra nell'angolo, libreria sul fianco ovest
  ctx.pareti.add(applique(ctx, xE - 0.02, 1.95, wz0 - 0.25, 'x-'));
  ctx.pareti.add(applique(ctx, xE - 0.02, 1.95, wz1 + 0.25, 'x-'));
  g.add(lampadaTerra(ctx, 9.85, 10.35));
  g.add(libreria(ctx, { w: 1.1, h: 2.2, d: 0.35, x: 6.24 + 0.19, z: 10.1, ry: Math.PI / 2 }));
  g.add(pianta(9.8, 6.75, { h: 1.2, vaso: 0.2 }));
  ctx.pareti.add(tende(2.4, 2.45, 8.28, 1.27, z1 - 0.03, 'z-'));
  g.add(pendente(ctx, 8.1, 8.35, { yTop: H, calata: 0.8, raggio: 0.24, paralume: 'ottone' }));
  return g;
}

function camera1(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  // carta a righe sulla parete nord, dietro al letto
  ctx.pareti.add(plane(3.95, ctx.H - 0.08, M.cartaRighe, 2.225, 0.08 + (ctx.H - 0.08) / 2, 0.25 + 0.015, 'z+'));
  // letto singolo lungo la parete nord, testata a est
  g.add(lettoSingolo(ctx, { x: 4.2 - 1.09, z: 0.73, ry: -Math.PI / 2, matCoperta: M.vellutoSalvia }));
  g.add(comodino(ctx, 3.95, 1.45, -Math.PI / 2));
  g.add(lampadaTavolo(ctx, 3.95, 0.62, 1.45, { colore: 'salvia', intensita: 4 }));
  // armadio a due moduli contro la parete sud
  g.add(armadio(ctx, { w: 1.84, h: 2.4, d: 0.6, x: 1.94, z: 2.45, ry: Math.PI, ante: 4, mat: M.crema }));
  g.add(tappeto(1.4, 0.8, M.linoTortora, 3.1, 1.6));
  ctx.pareti.add(quadro(0.45, 0.6, M.cartaBotanica, 2.0, 1.55, 0.25 + 0.035, 'z+'));
  ctx.pareti.add(tende(1.2, 1.55, 0.25 + 0.03, 1.65, 1.87, 'x+'));
  g.add(pendente(ctx, 2.2, 1.4, { yTop: ctx.H, calata: 0.8, raggio: 0.18 }));
  return g;
}

function camera2(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  // letto singolo contro il tramezzo nord, testata contro il muro della rientranza
  g.add(lettoSingolo(ctx, { x: 3.12 - 1.09, z: 2.83 + 0.48, ry: -Math.PI / 2, matCoperta: M.linoTortora, matTestiera: M.bluPolvere }));
  g.add(comodino(ctx, 2.87, 4.05, -Math.PI / 2));
  g.add(lampadaTavolo(ctx, 2.87, 0.62, 4.05, { colore: 'salvia', intensita: 4 }));
  // armadio a tre moduli laccato blu polvere contro la parete sud
  g.add(armadio(ctx, { w: 2.79, h: 2.4, d: 0.6, x: 2.775, z: 5.49, ry: Math.PI, ante: 6, mat: M.bluPolvere }));
  g.add(tappeto(1.3, 0.8, M.lino, 1.7, 4.3));
  ctx.pareti.add(tende(1.2, 1.55, 0.25 + 0.03, 1.65, 5.0, 'x+'));
  g.add(pendente(ctx, 2.0, 4.1, { yTop: ctx.H, calata: 0.8, raggio: 0.18 }));
  return g;
}

function camera3(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  // letto matrimoniale con testata a sud, testiera in velluto ruggine
  g.add(lettoMatrimoniale(ctx, { x: 8.45, z: 3.105, ry: Math.PI, testieraW: 2.2, testieraH: 1.3, matTestiera: M.vellutoRuggine }));
  for (const x of [7.25, 9.65]) {
    g.add(comodino(ctx, x, 3.98, Math.PI));
    g.add(lampadaTavolo(ctx, x, 0.62, 3.98, { colore: 'salvia', intensita: 4 }));
  }
  // armadio a tre moduli contro la parete nord
  g.add(armadio(ctx, { w: 2.67, h: 2.4, d: 0.6, x: 8.695, z: 0.55, ry: 0, ante: 6 }));
  g.add(tappeto(2.2, 1.2, M.linoTortora, 8.45, 1.6, M.noceScuro));
  ctx.pareti.add(tende(1.5, 1.55, 10.28 - 0.03, 1.65, 2.24, 'x-'));
  g.add(pendente(ctx, 8.45, 2.2, { yTop: ctx.H, calata: 0.75, raggio: 0.2 }));
  return g;
}

function bagno(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  const x0 = 6.24, x1 = 10.28, z0 = 4.31, z1 = 6.21;
  // rivestimento a 1,20 m in piastrelle verdi, a tutta altezza nella doccia
  const p = ctx.pareti, V = M.piastrelleVerdi;
  fascia(p, V, { asse: 'x', a: x0, b: x1, at: z1, verso: -1 });
  fascia(p, V, { asse: 'x', a: x0, b: 9.48, at: z0, verso: 1 });
  fascia(p, V, { asse: 'x', a: 9.48, b: x1, at: z0, verso: 1, y1: 2.1 });
  fascia(p, V, { asse: 'z', a: z0, b: 5.11, at: x1, verso: -1, y1: 2.1 });
  fascia(p, V, { asse: 'z', a: 5.11, b: 5.18, at: x1, verso: -1 });
  fascia(p, V, { asse: 'z', a: 5.18, b: 5.78, at: x1, verso: -1, y1: 0.88, listello: false });
  fascia(p, V, { asse: 'z', a: 5.78, b: z1, at: x1, verso: -1 });
  fascia(p, V, { asse: 'z', a: 5.25, b: z1, at: x0, verso: 1 });
  // sanitari e lavabo contro la parete sud, doccia nell'angolo nord-est
  g.add(lavaboCatino(ctx, { x: 7.0, z: z1 - 0.275, ry: Math.PI }));
  p.add(specchio(ctx, 0.7, 0.9, 7.0, 1.75, z1 - 0.02, 'z-'));
  p.add(applique(ctx, 6.5, 2.05, z1 - 0.02, 'z-', { intensita: 4 }));
  p.add(applique(ctx, 7.5, 2.05, z1 - 0.02, 'z-', { intensita: 4 }));
  g.add(wc(ctx, 8.0, z1 - 0.28, Math.PI));
  g.add(bidet(ctx, 8.8, z1 - 0.22, Math.PI));
  g.add(docciaAngolo(ctx, { x0: 9.48, x1, z0, z1: 5.11 }));
  p.add(scaldasalviette(ctx, x0 + 0.02, 1.2, 5.72, 'x+'));
  g.add(pianta(9.95, 5.95, { h: 0.5, vaso: 0.1 }));
  g.add(pendente(ctx, 8.2, 5.1, { yTop: ctx.H, calata: 0.5, raggio: 0.14, intensita: 10 }));
  return g;
}

function ripostiglio(ctx) {
  const g = new THREE.Group();
  // la parete nord ha il passaggio verso la lavanderia dei suoceri: scaffale sulla parete ovest
  g.add(scaffale(ctx, { w: 1.2, h: 2.3, d: 0.4, x: 4.34 + 0.21, z: 1.95, ry: Math.PI / 2 }));
  g.add(scaffale(ctx, { w: 1.4, h: 2.3, d: 0.4, x: 6.1 - 0.21, z: 1.75, ry: -Math.PI / 2 }));
  g.add(pendente(ctx, 5.1, 1.6, { yTop: ctx.H, calata: 0.4, raggio: 0.12, intensita: 8 }));
  return g;
}

function disimpegno(ctx) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(tappeto(0.8, 1.9, M.linoTortora, 5.22, 4.06, M.noceScuro));
  g.add(pendente(ctx, 5.22, 4.06, { yTop: ctx.H, calata: 0.5, raggio: 0.14, intensita: 10, paralume: 'ottone' }));
  return g;
}

export function arredaPianoTerra(ctx) {
  return [cucinaPranzo(ctx), ingresso(ctx), soggiorno(ctx), camera1(ctx), camera2(ctx), camera3(ctx), bagno(ctx), ripostiglio(ctx), disimpegno(ctx)];
}
