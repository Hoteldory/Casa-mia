// Versione 2 della seconda camera: open space verso il soggiorno, chiudibile con la vetrata.
// Angolo gaming a nord-est (scrivania in rovere, schermo, PS5, poltroncina), zona allenamento
// a corpo libero al centro (pavimento in gomma, tappetino, spalliera, specchio), cyclette in
// rovere a sud-est, attrezzi a portata di mano. Parete dello schermo in azzurro polvere.
import * as THREE from 'three';
import { box, cyl, sphere, plane, place, tappeto, stampaBotanica, pendenteGlobo, lampadarioTamburo,
  tende, tendaBambu, pianta, libri, cesta, antaTelaio, manigliaOttone, matColore, MAT } from './comune.js';
import { tvOled } from './soggiorno.js';
import { specchio } from './bagno.js';

// ---- scrivania in rovere a gambe squadrate, con cassetto ----
function scrivania(ctx, { x, z, ry = 0, w = 1.6, d = 0.7 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, 0.04, d, M.rovereMiele, 0, 0.74, 0));
  g.add(box(w - 0.1, 0.09, d - 0.08, M.rovereMiele, 0, 0.675, 0));
  g.add(box(0.5, 0.06, 0.012, M.rovereMiele, 0.2, 0.675, d / 2 - 0.035));
  g.add(manigliaOttone(0.1, 0.2, 0.675, d / 2 - 0.03));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.63, 0.05, M.rovereMiele, sx * (w / 2 - 0.05), 0.315, sz * (d / 2 - 0.05)));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- PS5 in piedi: due gusci bianchi ai lati del corpo nero, sulla base rotonda ----
// in locale: frontale verso +z, spessore lungo x
function ps5() {
  const M = MAT();
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 0.012, M.plasticaNera, 0, 0.006, 0, 16));
  g.add(box(0.07, 0.37, 0.25, M.plasticaNera, 0, 0.2, 0));
  for (const s of [-1, 1]) {
    const guscio = box(0.016, 0.39, 0.26, M.plasticaBianca, s * 0.043, 0.205, 0.005);
    guscio.rotation.z = s * 0.025; // le "ali" si aprono appena verso l'alto
    g.add(guscio);
  }
  g.add(box(0.072, 0.012, 0.004, matColore('#5b8cff', 0.3), 0, 0.33, 0.126)); // striscia luminosa
  return g;
}

// ---- controller appoggiato sul piano ----
function controller(x, y, z, ry) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(0.12, 0.035, 0.07, M.plasticaBianca, 0, 0.018, 0));
  g.add(box(0.06, 0.006, 0.04, M.plasticaNera, 0, 0.037, -0.005));
  for (const s of [-1, 1]) {
    const imp = cyl(0.025, 0.02, 0.09, M.plasticaBianca, s * 0.055, 0.02, 0.035, 12);
    imp.rotation.x = Math.PI / 2 - 0.3; g.add(imp);
    g.add(cyl(0.011, 0.011, 0.012, M.plasticaNera, s * 0.025, 0.042, 0.012, 10));
  }
  place(g, x, z, ry, y);
  return g;
}

// ---- poltroncina da gaming in tessuto grafite, base a cinque razze ----
function poltroncina(ctx, x, z, ry) {
  const M = MAT();
  const T = M.tessutoGrafite;
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const r = box(0.3, 0.035, 0.05, M.plasticaNera, Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15);
    r.rotation.y = -a; g.add(r);
    g.add(cyl(0.025, 0.025, 0.05, M.plasticaNera, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29, 10));
  }
  g.add(cyl(0.025, 0.03, 0.34, M.ferro, 0, 0.25, 0, 12));
  g.add(box(0.52, 0.09, 0.5, T, 0, 0.47, 0.02));                       // seduta
  const schienale = new THREE.Group();
  schienale.add(box(0.5, 0.72, 0.09, T, 0, 0.36, 0));
  schienale.add(box(0.3, 0.16, 0.08, T, 0, 0.82, 0));                  // poggiatesta
  schienale.add(box(0.36, 0.14, 0.04, M.linoAvena, 0, 0.18, 0.06));    // cuscino lombare
  schienale.position.set(0, 0.52, -0.24);
  schienale.rotation.x = -0.12;
  g.add(schienale);
  for (const s of [-1, 1]) {
    g.add(box(0.03, 0.2, 0.03, M.plasticaNera, s * 0.28, 0.6, -0.02));
    g.add(box(0.07, 0.03, 0.26, M.plasticaNera, s * 0.28, 0.71, 0.0));
  }
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- spalliera in rovere: due montanti e pioli tondi, staccata 12 cm dal muro ----
// in locale: muro a z = 0, la spalliera sporge verso +z
function spalliera(ctx, { x, z, ry = 0, w = 0.9, h = 2.4 }) {
  const M = MAT();
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(box(0.07, h, 0.12, M.rovereMiele, s * (w / 2 - 0.035), h / 2, 0.07));
    for (const y of [0.3, h - 0.3]) g.add(box(0.05, 0.05, 0.03, M.ottone, s * (w / 2 - 0.035), y, 0.015));
  }
  for (let y = 0.15; y < h - 0.05; y += 0.16) {
    const p = cyl(0.017, 0.017, w - 0.07, M.rovereMiele, 0, y, 0.08, 12);
    p.rotation.z = Math.PI / 2; g.add(p);
  }
  // barra per le trazioni in cima, piu' sporgente
  for (const s of [-1, 1]) g.add(box(0.04, 0.04, 0.3, M.ferro, s * (w / 2 - 0.035), h - 0.1, 0.27));
  const barra = cyl(0.016, 0.016, w, M.ferro, 0, h - 0.1, 0.4, 12); barra.rotation.z = Math.PI / 2; g.add(barra);
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- cyclette con telaio in rovere, volano nero, sella in cuoio ----
// in locale: manubrio verso +z
function cyclette(ctx, x, z, ry) {
  const M = MAT();
  const L = M.rovereMiele;
  const g = new THREE.Group();
  for (const zz of [-0.45, 0.42]) g.add(box(0.5, 0.05, 0.07, L, 0, 0.025, zz));          // piedi
  g.add(box(0.07, 0.06, 0.95, L, 0, 0.07, -0.01));                                      // longherone
  const montante = (y0, y1, z0, z1, sez = 0.07) => {
    const len = Math.hypot(y1 - y0, z1 - z0);
    const m = box(sez, len, sez, L, 0, (y0 + y1) / 2, (z0 + z1) / 2);
    m.rotation.x = Math.atan2(z1 - z0, y1 - y0);
    g.add(m);
  };
  montante(0.08, 0.78, -0.3, -0.18);   // sotto la sella
  montante(0.08, 0.95, 0.32, 0.22);    // sotto il manubrio
  montante(0.32, 0.4, -0.22, 0.25, 0.06); // traverso
  // volano davanti, nero con bordo in ottone
  const vol = cyl(0.23, 0.23, 0.05, M.plasticaNera, 0, 0.33, 0.28, 32); vol.rotation.z = Math.PI / 2; g.add(vol);
  const bordo = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.008, 6, 40), M.ottone);
  bordo.rotation.y = Math.PI / 2; bordo.position.set(0, 0.33, 0.28); g.add(bordo);
  // pedivelle e pedali
  const mozzo = cyl(0.05, 0.05, 0.12, M.ferro, 0, 0.36, -0.02, 16); mozzo.rotation.z = Math.PI / 2; g.add(mozzo);
  for (const s of [-1, 1]) {
    const ped = box(0.025, 0.17, 0.03, M.ferro, s * 0.07, 0.36 + s * 0.07, -0.02 + s * 0.04); ped.rotation.x = s * 0.5; g.add(ped);
    g.add(box(0.1, 0.025, 0.06, M.plasticaNera, s * 0.12, 0.36 + s * 0.15, -0.02 + s * 0.08));
  }
  // sella in cuoio e manubrio in ferro con manopole in cuoio
  g.add(box(0.16, 0.06, 0.26, M.cuoio, 0, 0.83, -0.17));
  g.add(cyl(0.012, 0.012, 0.45, M.ferro, 0, 1.0, 0.23, 8).rotateZ(Math.PI / 2));
  for (const s of [-1, 1]) g.add(cyl(0.018, 0.018, 0.1, M.cuoio, s * 0.2, 1.0, 0.23, 10).rotateZ(Math.PI / 2));
  g.add(box(0.12, 0.08, 0.02, M.plasticaNera, 0, 1.06, 0.28).rotateX(-0.5));          // display
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

// ---- rastrelliera con manubri esagonali e due kettlebell a terra ----
function rastrelliera(ctx, { x, z, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const w = 0.62, d = 0.32;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.04, 0.62, 0.04, M.rovereMiele, sx * (w / 2 - 0.02), 0.31, sz * (d / 2 - 0.02)));
  for (const y of [0.25, 0.58]) g.add(box(w, 0.025, d, M.rovereMiele, 0, y, 0));
  // tre coppie di manubri, dal piu' leggero
  const pesi = [[0.036, 0.6], [0.045, 0.43], [0.052, 0.27]];
  [[0.6, 0], [0.27, 1], [0.27, 2]].forEach(([y, k], i) => {
    const [r] = pesi[k];
    for (const s of [-1, 1]) {
      const zz = y > 0.5 ? s * 0.07 : s * 0.07, xx = (i === 0 ? 0 : i === 1 ? -0.15 : 0.15);
      const man = new THREE.Group();
      man.add(cyl(0.012, 0.012, 0.13, M.ferro, 0, 0, 0, 8));
      for (const e of [-1, 1]) man.add(cyl(r, r, 0.045, M.plasticaNera, 0, e * 0.085, 0, 6));
      man.rotation.z = Math.PI / 2;
      man.position.set(xx, y + 0.012 + r, zz);
      g.add(man);
    }
  });
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}
function kettlebell(x, z, r = 0.09) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(sphere(r, M.plasticaNera, 0, r * 0.95, 0, 18));
  g.add(cyl(r * 0.6, r * 0.6, 0.02, M.plasticaNera, 0, 0.01, 0, 14));
  const manico = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, 0.013, 8, 20, Math.PI), M.ottoneScuro);
  manico.position.y = r * 1.65; g.add(manico);
  for (const s of [-1, 1]) g.add(cyl(0.013, 0.013, r * 0.4, M.ottoneScuro, s * r * 0.6, r * 1.5, 0, 8));
  g.position.set(x, 0, z);
  return g;
}

// ---- mobile basso bianco latte con piano in rovere: asciugamani, elastici, corde ----
function mobileBasso(ctx, { x, z, ry = 0, w = 0.9, d = 0.42, h = 0.84 }) {
  const M = MAT();
  const g = new THREE.Group();
  g.add(box(w, h - 0.1, d, M.biancoLatte, 0, 0.1 + (h - 0.1) / 2, 0));
  g.add(box(w - 0.04, 0.1, d - 0.04, M.biancoLatte, 0, 0.05, -0.01));
  g.add(box(w + 0.03, 0.035, d + 0.02, M.rovereMiele, 0, h + 0.017, 0.005));
  for (const s of [-1, 1]) {
    const a = antaTelaio(w / 2 - 0.03, h - 0.2, M.biancoLatte, 0.05);
    a.position.set(s * (w / 4), 0.1 + (h - 0.1) / 2, d / 2 + 0.006); g.add(a);
    g.add(manigliaOttone(0.1, s * 0.05, 0.55, d / 2 + 0.015, true));
  }
  // sopra: asciugamani piegati, corda per saltare arrotolata
  for (let i = 0; i < 3; i++) g.add(box(0.3, 0.045, 0.22, i % 2 ? M.linoAzzurro : M.linoAvena, -0.2, h + 0.06 + i * 0.045, 0));
  const corda = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 24), M.plasticaNera);
  corda.rotation.x = Math.PI / 2; corda.position.set(0.15, h + 0.045, 0.05); g.add(corda);
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaCameraSudV2(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_sud.rects[0]; // x 6.14-10.26, z 6.65-10.77; varco a ovest z 6.85-9.25; portafinestra sud x 7.46-8.88
  const xE = R.x + R.w, zS = R.z + R.d;
  // parete dello schermo in azzurro polvere: si vede dal soggiorno, attraverso il varco
  ctx.pareti.add(plane(R.d, ctx.H, M.azzurroPolvere, xE - 0.02, ctx.H / 2, R.cz, 'x-'));

  // ---- angolo gaming: scrivania contro la parete est, schermo da 48", PS5, poltroncina ----
  const zG = 7.75;
  g.add(scrivania(ctx, { x: xE - 0.36, z: zG, ry: -Math.PI / 2 }));
  g.add(tvOled(ctx, { x: xE - 0.16, y: 0.76, z: zG - 0.05, ry: -Math.PI / 2, w: 1.07, h: 0.61 }));
  g.add(place(ps5(), xE - 0.2, zG + 0.67, -Math.PI / 2, 0.76));
  g.add(controller(xE - 0.52, 0.76, zG + 0.25, -Math.PI / 2 - 0.25));
  // luce d'atmosfera dietro lo schermo: una striscia che di sera alona la parete azzurra
  {
    const mat = new THREE.MeshStandardMaterial({ color: '#f2efe6', emissive: '#ffe2b8', emissiveIntensity: 0 });
    const striscia = box(0.012, 0.5, 0.9, mat, xE - 0.05, 1.15, zG - 0.05, { cast: false });
    g.add(striscia);
    const luce = new THREE.PointLight('#ffd9a8', 3, 2.5, 2);
    luce.position.set(xE - 0.12, 1.15, zG - 0.05);
    g.add(luce);
    ctx.addLight(luce, striscia, null);
  }
  g.add(poltroncina(ctx, xE - 1.15, zG, Math.PI / 2));
  g.add(tappeto(1.5, 1.4, M.juta, xE - 0.95, zG));
  // mensola in rovere sopra lo schermo: libri, giochi, una pianta
  g.add(box(0.2, 0.035, 1.4, M.rovereMiele, xE - 0.1, 1.78, zG));
  const fila = libri(0.5, xE - 0.11, 1.8, zG - 0.35, 31);
  fila.rotation.y = -Math.PI / 2;
  g.add(fila);
  g.add(place(pianta(0, 0, { h: 0.35, vaso: 0.07, matVaso: M.ceramica }), xE - 0.1, zG + 0.45, 0, 1.8));
  g.add(pendenteGlobo(ctx, xE - 1.1, zG, { yTop: ctx.H, calata: 0.6, raggio: 0.12, intensita: 8 }));

  // ---- zona allenamento a corpo libero ----
  g.add(tappeto(1.7, 2.1, M.gomma, 7.65, 8.95));                    // pavimento in gomma
  g.add(box(0.61, 0.006, 1.83, M.tappetinoSalvia, 7.55, 0.016, 8.95, { cast: false })); // tappetino
  const rullo = cyl(0.075, 0.075, 0.45, M.azzurroPolvere, 8.3, 0.08, 9.75, 16); rullo.rotation.z = Math.PI / 2; g.add(rullo);
  g.add(kettlebell(8.3, 8.2, 0.08));
  // spalliera e specchio alto sulla parete nord
  g.add(spalliera(ctx, { x: 7.1, z: R.z, ry: 0 }));
  ctx.pareti.add(specchio(ctx, 0.7, 1.7, 8.25, 1.15, R.z + 0.01, 'z+', M.ottone));
  // cyclette nell'angolo sud-est, rivolta verso la stanza
  g.add(cyclette(ctx, xE - 0.6, zS - 0.75, -Math.PI * 0.8));
  // attrezzi: rastrelliera con i manubri contro la parete est, kettlebell a terra
  g.add(rastrelliera(ctx, { x: xE - 0.18, z: 9.0, ry: -Math.PI / 2 }));
  g.add(kettlebell(xE - 0.48, 8.82, 0.1));
  g.add(kettlebell(xE - 0.5, 9.16, 0.085));

  // ---- parete sud: mobile basso, cesta, stampa; tende in lino e bambu' alla portafinestra ----
  g.add(mobileBasso(ctx, { x: 6.95, z: zS - 0.22, ry: Math.PI }));
  g.add(cesta(6.62, zS - 0.62, { r: 0.16, h: 0.3 }));
  g.add(place(pianta(0, 0, { h: 0.45, vaso: 0.09, matVaso: M.ceramica }), 6.62, zS - 0.22, 0, 0.875));
  ctx.pareti.add(stampaBotanica(0.42, 0.55, 6.95, 1.6, zS - 0.03, 'z-', 107, M.rovereMiele));
  ctx.pareti.add(tende(1.42, 2.2, 8.17, 1.15, zS - 0.03, 'z-', M.linoAvena));
  ctx.pareti.add(tendaBambu(1.42, 8.17, 2.42, zS - 0.04, 'z-'));
  // luce generale: lampadario a tamburo alto, sopra la zona libera
  g.add(lampadarioTamburo(ctx, 8.0, 8.6, { yTop: ctx.H, calata: 0.38, raggio: 0.3, intensita: 10 }));
  return g;
}
