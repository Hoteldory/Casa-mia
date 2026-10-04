// Veranda della versione 2 sul terrazzo nord, al posto del gazebo: attaccata alla casa per tutta la
// larghezza del terrazzo (6,34 m) e profonda 4 m, per mangiare fuori anche d'inverno.
// - Fronte: otto porte a libro in alluminio a taglio termico color salvia, vetrocamera; si
//   ripiegano verso l'esterno, quattro per parte, e lasciano il fronte quasi tutto libero.
// - Fianchi: sul muretto del terrazzo, cinque ante a libro per lato che si ripiegano verso
//   l'interno, contro i pilastri d'angolo.
// - Tetto coibentato poco inclinato (lamiera aggraffata sopra), sotto perlinato bianco latte con
//   travi in rovere a vista, due lucernari sopra il tavolo, due pannelli radianti a infrarossi.
// - Dentro: tavolo da fattoria da otto con sedie Windsor e un lampadario lineare in rovere e
//   ottone davanti alla cucina; angolo divano davanti alla camera.
// Ritorna il gruppo; userData.ante sono le ante (da fondere una per una, restano mobili),
// userData.tetto il tetto (si spegne con "Tetto e soffitti"), userData.imposta(k): 0 chiusa, 1 aperta.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cyl, sphere, plane, place, tappeto, pianta, cuscino, matColore, MAT } from './comune.js';
import { tavoloFattoria, sediaWindsor } from './cucina.js';
import { divano, poltrona, tavolinoTondo } from './soggiorno.js';

// pianta della veranda (m, coordinate mondo del piano primo)
export const VERANDA = {
  x0: 1.80, x1: 8.14,    // fili interni dei muretti del terrazzo
  zCasa: 0, zFronte: -4.0,
  yMuretto: 0.95,        // sopra la copertina in pietra del muretto
  yCasa: 2.5, yFronte: 2.36, // intradosso del tetto contro la casa e sul fronte
  spTetto: 0.2,
};
const PROF = 0.065, SPESS = 0.06; // profilo delle ante: larghezza in vista e spessore
const APERTA = 1.48;             // angolo delle ante ripiegate (circa 85 gradi)

// un'anta: telaio salvia e vetrocamera; in locale va da x = 0 (cerniera) a x = w, y da 0 a h
function anta(w, h, { zoccolo = 0.06, maniglia = false } = {}) {
  const M = MAT();
  const S = M.salvia;
  const g = new THREE.Group();
  g.add(box(PROF, h, SPESS, S, PROF / 2, h / 2, 0));
  g.add(box(PROF, h, SPESS, S, w - PROF / 2, h / 2, 0));
  g.add(box(w - 2 * PROF, PROF, SPESS, S, w / 2, h - PROF / 2, 0));
  g.add(box(w - 2 * PROF, zoccolo, SPESS, S, w / 2, zoccolo / 2, 0));
  const hv = h - PROF - zoccolo;
  const vetro = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * PROF, hv), M.vetro);
  vetro.position.set(w / 2, zoccolo + hv / 2, 0);
  g.add(vetro);
  if (maniglia) {
    for (const s of [-1, 1]) {
      const m = cyl(0.01, 0.01, 0.3, M.ottone, w - PROF / 2, 1.05, s * (SPESS / 2 + 0.03), 10);
      g.add(m);
      for (const dy of [-0.12, 0.12]) {
        const p = cyl(0.006, 0.006, 0.03, M.ottone, w - PROF / 2, 1.05 + dy, s * (SPESS / 2 + 0.015), 8);
        p.rotation.x = Math.PI / 2; g.add(p);
      }
    }
  }
  return g;
}

// Catena di ante a libro lungo un binario. origine: punto della prima cerniera; lungo: versore del
// binario (verso la chiusura); fuori: versore verso cui si ripiegano. Ritorna imposta(theta).
function catena(g, ante, n, w, h, { origine, lungo, fuori, y = 0, zoccolo, maniglia }) {
  const pezzi = [];
  for (let i = 0; i < n; i++) {
    const a = anta(w, h, { zoccolo, maniglia: maniglia && i === n - 1 });
    a.userData.aParte = true;
    g.add(a); ante.push(a);
    pezzi.push(a);
  }
  return (theta) => {
    const c = Math.cos(theta), s = Math.sin(theta);
    pezzi.forEach((a, i) => {
      const u0 = i * w * c, v0 = i % 2 ? w * s : 0;
      const u1 = (i + 1) * w * c, v1 = i % 2 ? 0 : w * s;
      const p0x = origine[0] + lungo[0] * u0 + fuori[0] * v0, p0z = origine[1] + lungo[1] * u0 + fuori[1] * v0;
      const p1x = origine[0] + lungo[0] * u1 + fuori[0] * v1, p1z = origine[1] + lungo[1] * u1 + fuori[1] * v1;
      a.position.set(p0x, y, p0z);
      a.rotation.y = Math.atan2(-(p1z - p0z), p1x - p0x);
    });
  };
}

// lampadario lineare: asta in rovere appesa a due steli in ottone, quattro globi
function lampadarioLineare(ctx, x, z, { yTop, y = 1.88, L = 1.6 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(L, 0.06, 0.08, M.rovereMiele, x, y, z));
  for (const s of [-1, 1]) {
    g.add(cyl(0.005, 0.005, yTop - y, M.ottone, x + s * L * 0.38, (yTop + y) / 2, z, 6));
    g.add(cyl(0.03, 0.03, 0.015, M.ottone, x + s * L * 0.38, yTop - 0.008, z, 12));
  }
  const vetro = M.vetroGlobo.clone();
  vetro.emissive = new THREE.Color('#ffd9a8'); vetro.emissiveIntensity = 0;
  let bulb = null;
  for (let i = 0; i < 4; i++) {
    const xx = x - L * 0.36 + (i * L * 0.72) / 3;
    g.add(cyl(0.02, 0.025, 0.04, M.ottone, xx, y - 0.05, z, 10));
    g.add(sphere(0.075, vetro, xx, y - 0.13, z, 18));
    bulb = sphere(0.022, M.lampadina, xx, y - 0.13, z, 10);
    g.add(bulb);
  }
  const luce = new THREE.PointLight('#ffd9a8', 16, 7, 2);
  luce.position.set(x, y - 0.25, z);
  g.add(luce);
  ctx.addLight(luce, bulb, vetro);
  return g;
}

// tetto: costruito piano (y = 0 intradosso, z verso il fronte negativo) e poi inclinato
function tetto(V) {
  const M = MAT();
  const g = new THREE.Group();
  const Lz = Math.hypot(V.zFronte - V.zCasa, V.yCasa - V.yFronte);
  const fine = -(Lz + 0.15);                         // sporto di 15 cm sul fronte
  const xa = V.x0 - 0.5, xb = V.x1 + 0.5;            // fino oltre i muretti (40 cm) di 10 cm
  const lamiera = matColore('#767c78', 0.55);
  const fascia = M.salvia;
  const matTetto = [fascia, fascia, lamiera, M.biancoLatte, fascia, fascia];
  // due lucernari sopra il tavolo, fra le travi
  const fori = [{ x0: 2.65, x1: 3.5 }, { x0: 3.8, x1: 4.65 }];
  const fz0 = -1.6, fz1 = -2.5;
  const pezzo = (a, b, c, d) => g.add(box(b - a, V.spTetto, c - d, matTetto, (a + b) / 2, V.spTetto / 2, (c + d) / 2));
  pezzo(xa, xb, 0, fz0);
  pezzo(xa, xb, fz1, fine);
  let x = xa;
  for (const f of fori) { pezzo(x, f.x0, fz0, fz1); x = f.x1; }
  pezzo(x, xb, fz0, fz1);
  // aggraffature della lamiera, lungo la pendenza
  for (let xx = xa + 0.25; xx < xb; xx += 0.5) g.add(box(0.025, 0.03, -fine, lamiera, xx, V.spTetto + 0.015, fine / 2, { cast: false }));
  // lucernari: imbotte bianca, telaio salvia sopra il tetto, vetro
  for (const f of fori) {
    const cx = (f.x0 + f.x1) / 2, cz = (fz0 + fz1) / 2, w = f.x1 - f.x0, d = fz0 - fz1;
    for (const s of [-1, 1]) {
      g.add(box(0.02, V.spTetto, d, M.biancoLatte, cx + s * (w / 2 - 0.01), V.spTetto / 2, cz, { cast: false }));
      g.add(box(w, V.spTetto, 0.02, M.biancoLatte, cx, V.spTetto / 2, cz + s * (d / 2 - 0.01), { cast: false }));
      g.add(box(0.07, 0.14, d + 0.14, fascia, cx + s * (w / 2 + 0.035), V.spTetto + 0.07, cz));
      g.add(box(w, 0.14, 0.07, fascia, cx, V.spTetto + 0.07, cz + s * (d / 2 + 0.035)));
    }
    const vetro = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.vetro);
    vetro.rotation.x = -Math.PI / 2;
    vetro.position.set(cx, V.spTetto + 0.13, cz);
    g.add(vetro);
  }
  // soffitto a perlinato: fughe sottili lungo la pendenza
  const fuga = matColore('#d9d1c2', 0.9);
  for (let xx = V.x0 + 0.12; xx < V.x1; xx += 0.12) {
    if (fori.some((f) => xx > f.x0 - 0.01 && xx < f.x1 + 0.01)) {
      g.add(box(0.006, 0.002, -fz0, fuga, xx, -0.001, fz0 / 2, { cast: false }));
      g.add(box(0.006, 0.002, fz1 - fine, fuga, xx, -0.001, (fz1 + fine) / 2, { cast: false }));
    } else g.add(box(0.006, 0.002, -fine, fuga, xx, -0.001, fine / 2, { cast: false }));
  }
  // travi in rovere a vista: dormiente contro la casa, travetti lungo la pendenza
  g.add(box(V.x1 - V.x0, 0.2, 0.16, M.rovereMiele, (V.x0 + V.x1) / 2, -0.1, -0.08));
  for (const xx of [1.86, 2.5, 3.65, 4.8, 6.0, 7.2, 8.08]) {
    g.add(box(0.1, 0.16, Lz - 0.16, M.rovereMiele, xx, -0.08, -(Lz + 0.16) / 2));
  }
  // pannelli radianti a infrarossi fra le travi
  for (const [xx, zz] of [[3.07, -0.85], [5.4, -2.3]]) {
    g.add(box(0.5, 0.025, 0.9, matColore('#f4f1ea', 0.6), xx, -0.013, zz, { cast: false }));
    for (let k = -3; k <= 3; k++) g.add(box(0.44, 0.003, 0.006, matColore('#d6d1c6', 0.6), xx, -0.027, zz + k * 0.11, { cast: false }));
  }
  g.position.set(0, V.yCasa, V.zCasa);
  g.rotation.x = -Math.atan2(V.yCasa - V.yFronte, V.zCasa - V.zFronte);
  return g;
}

export function veranda(ctx) {
  const M = MAT();
  const V = VERANDA;
  const g = new THREE.Group();
  const S = M.salvia;
  const sotto = (z) => V.yCasa + (V.yFronte - V.yCasa) * ((z - V.zCasa) / (V.zFronte - V.zCasa)); // intradosso
  const zF = V.zFronte;
  const ante = [];

  // ---- struttura: pilastri d'angolo sul muretto, architrave del fronte, telai dei fianchi ----
  const hTr = 0.16;                        // architrave: da 2,20 all'intradosso
  const yPorte = V.yFronte - hTr;
  for (const [x0, x1] of [[V.x0 - 0.12, V.x0], [V.x1, V.x1 + 0.12]]) {
    g.add(box(x1 - x0, V.yFronte - V.yMuretto, 0.12, S, (x0 + x1) / 2, (V.yFronte + V.yMuretto) / 2, zF + 0.06));
  }
  g.add(box(V.x1 - V.x0 + 0.24, hTr, 0.14, S, (V.x0 + V.x1) / 2, yPorte + hTr / 2, zF + 0.07));
  g.add(box(V.x1 - V.x0, 0.02, 0.14, M.pietra, (V.x0 + V.x1) / 2, 0.01, zF + 0.07)); // soglia a filo
  // fianchi: davanzale sul muretto, montante contro la casa, traverso alto inclinato
  const yTesta = 2.3;
  for (const xL of [V.x0 - 0.06, V.x1 + 0.06]) {
    g.add(box(0.1, 0.05, -zF, S, xL, V.yMuretto + 0.025, zF / 2));
    g.add(box(0.1, V.yCasa - V.yMuretto, 0.07, S, xL, (V.yCasa + V.yMuretto) / 2, V.zCasa - 0.035));
    const sh = new THREE.Shape();
    sh.moveTo(V.zCasa, yTesta); sh.lineTo(zF + 0.12, yTesta); sh.lineTo(zF + 0.12, sotto(zF + 0.12)); sh.lineTo(V.zCasa, V.yCasa); sh.closePath();
    const gm = mergeVertices(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false })); // indicizzata: si fonde con le altre
    gm.rotateY(-Math.PI / 2);
    const testa = new THREE.Mesh(gm, S);
    testa.position.x = xL + 0.05;
    testa.castShadow = true; testa.receiveShadow = true;
    g.add(testa);
  }

  // ---- ante a libro ----
  const hP = yPorte - 0.01;
  const wF = (V.x1 - V.x0 - 0.04) / 8;
  const fronte = [
    catena(g, ante, 4, wF, hP, { origine: [V.x0 + 0.02, zF + 0.07], lungo: [1, 0], fuori: [0, -1], zoccolo: 0.11, maniglia: true }),
    catena(g, ante, 4, wF, hP, { origine: [V.x1 - 0.02, zF + 0.07], lungo: [-1, 0], fuori: [0, -1], zoccolo: 0.11, maniglia: true }),
  ];
  const yA = V.yMuretto + 0.05, hA = yTesta - yA;
  const lF = (V.zCasa - 0.07) - (zF + 0.12);
  const wA = lF / 5;
  const fianchi = [
    catena(g, ante, 5, wA, hA, { origine: [V.x0 - 0.06, zF + 0.12], lungo: [0, 1], fuori: [1, 0], y: yA }),
    catena(g, ante, 5, wA, hA, { origine: [V.x1 + 0.06, zF + 0.12], lungo: [0, 1], fuori: [-1, 0], y: yA }),
  ];
  const imposta = (k) => { for (const f of [...fronte, ...fianchi]) f(k * APERTA); };
  imposta(0);

  // ---- tetto ----
  const t = tetto(V);
  t.userData.aParte = true;
  g.add(t);

  // ---- pranzo davanti alla cucina: tavolo da otto, sedie Windsor, lampadario lineare ----
  const cx = 3.65, cz = -2.05;
  g.add(tavoloFattoria(ctx, { cx, cz, L: 2.2, W: 1.0, ry: Math.PI / 2 }));
  for (let i = 0; i < 3; i++) {
    g.add(sediaWindsor(ctx, cx - 0.8 + i * 0.8, cz + 0.78, Math.PI));
    g.add(sediaWindsor(ctx, cx - 0.8 + i * 0.8, cz - 0.78, 0));
  }
  g.add(sediaWindsor(ctx, cx - 1.5, cz, Math.PI / 2, M.rovereMiele));
  g.add(sediaWindsor(ctx, cx + 1.5, cz, -Math.PI / 2, M.rovereMiele));
  g.add(lampadarioLineare(ctx, cx, cz, { yTop: sotto(cz) - 0.16 }));
  g.add(tappeto(3.2, 2.3, M.juta, cx, cz));

  // ---- angolo divano davanti alla camera ----
  g.add(divano(ctx, V.x1 - 0.48, -2.2, -Math.PI / 2, 2.0, { mat: M.linoAvena, cuscini: [M.linoAzzurro, M.floreale, M.righeAzzurre], plaid: M.linoRuggine }));
  g.add(poltrona(ctx, 6.0, -2.2, Math.PI / 2, M.linoAzzurro));
  g.add(tavolinoTondo(ctx, V.x1 - 0.35, -3.55));
  g.add(tappeto(1.7, 2.2, M.juta, 6.85, -2.2));
  g.add(place(pianta(0, 0, { h: 1.5, vaso: 0.2, matVaso: M.ceramica }), 6.15, -0.42));
  g.add(place(pianta(0, 0, { h: 1.1, vaso: 0.17 }), V.x0 + 0.35, -3.05));

  g.userData.ante = ante;
  g.userData.tetto = t;
  g.userData.imposta = imposta;
  return g;
}
