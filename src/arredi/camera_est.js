// Camera est: vano della scala a chiocciola che sale al secondo piano, con angolo
// studio e colonna lavanderia. Dettaglio: parete nord in terracotta bruciata, su cui
// si staglia la scala bianca.
import * as THREE from 'three';
import { box, cyl, plane, place, tappeto, quadro, pendente, applique, lampadaTavolo, tende, pianta, libri, manigliaOttone, MAT } from './comune.js';
import { scrittoio } from './camera_sud.js';
import { libreria } from './soggiorno.js';
import { scalaChiocciola } from './scala.js';

// ---- colonna lavanderia in noce: lavatrice nel vano basso, vano alto predisposto
// per una futura asciugatrice (attacchi a vista, ripiano e tenda in lino) ----
export function colonnaLavatrice(ctx, { x, z, w = 0.68, d = 0.64, ry = 0 }) {
  const M = MAT();
  const g = new THREE.Group();
  const sp = 0.022, zoc = 0.07, hVano = 0.88;
  const hTot = zoc + hVano * 2 + sp * 2;
  const bianco = new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: 0.35 });
  const acciaio = new THREE.MeshStandardMaterial({ color: '#8d9095', metalness: 0.75, roughness: 0.35 });
  const oblo = new THREE.MeshStandardMaterial({ color: '#23272a', roughness: 0.2, metalness: 0.4 });

  // carcassa: zoccolo, fianchi, schienale, ripiano intermedio, cielo
  g.add(box(w - 0.06, zoc, d - 0.05, M.noceScuro, 0, zoc / 2, -0.02));
  for (const sx of [-1, 1]) g.add(box(sp, hTot - zoc, d, M.noce, sx * (w / 2 - sp / 2), zoc + (hTot - zoc) / 2, 0));
  g.add(box(w, hTot - zoc, 0.014, M.noce, 0, zoc + (hTot - zoc) / 2, -d / 2 + 0.007));
  const yRip = zoc + hVano + sp / 2;
  g.add(box(w - 2 * sp, sp, d - 0.02, M.noce, 0, yRip, 0.01));
  g.add(box(w - 2 * sp, sp, d, M.noce, 0, hTot - sp / 2, 0));
  g.add(box(w + 0.04, 0.035, d + 0.03, M.pietra, 0, hTot + 0.0175, 0)); // top in pietra

  // lavatrice nel vano basso
  const yL = zoc + 0.425;
  g.add(box(0.6, 0.85, 0.6, bianco, 0, yL, 0.005));
  g.add(box(0.6, 0.1, 0.015, acciaio, 0, yL + 0.375, 0.31));          // pannello comandi
  g.add(cyl(0.017, 0.017, 0.02, acciaio, -0.21, yL + 0.375, 0.32, 14).rotateX(Math.PI / 2));
  g.add(box(0.16, 0.035, 0.008, oblo, 0.08, yL + 0.375, 0.32));        // display
  g.add(cyl(0.2, 0.2, 0.03, acciaio, 0, yL - 0.06, 0.305, 28).rotateX(Math.PI / 2));
  g.add(cyl(0.165, 0.165, 0.035, oblo, 0, yL - 0.06, 0.31, 28).rotateX(Math.PI / 2));
  g.add(box(0.03, 0.09, 0.02, acciaio, 0.2, yL - 0.06, 0.315));        // maniglia dell'oblo

  // vano alto lasciato libero: attacchi a vista, così l'asciugatrice si appoggia e si collega
  const yV = yRip + hVano / 2;
  g.add(box(0.1, 0.1, 0.02, bianco, -0.16, yV + 0.3, -d / 2 + 0.02));  // presa
  for (const dx of [-0.02, 0.02]) g.add(cyl(0.005, 0.005, 0.03, M.ottone, -0.16 + dx, yV + 0.3, -d / 2 + 0.035, 8).rotateX(Math.PI / 2));
  g.add(cyl(0.02, 0.02, 0.05, M.ottoneScuro, 0.14, yV + 0.3, -d / 2 + 0.035, 12).rotateX(Math.PI / 2)); // attacco acqua
  g.add(box(0.05, 0.012, 0.012, M.ottoneScuro, 0.14, yV + 0.34, -d / 2 + 0.03));
  for (const sx of [-1, 1]) for (const dz of [-0.18, 0.18]) {         // perni del ripiano, predisposizione
    g.add(cyl(0.005, 0.005, 0.016, M.ottone, sx * (w / 2 - sp - 0.008), yRip + hVano - 0.16, dz, 8).rotateZ(Math.PI / 2));
  }
  // cesta di panni piegati nel vano alto, in attesa dell'asciugatrice
  g.add(box(0.42, 0.24, 0.32, M.lino, 0, yRip + 0.14, 0.06));
  g.add(box(0.38, 0.06, 0.28, M.linoBianco, 0, yRip + 0.29, 0.06));

  // tenda in lino su asta d'ottone, tirata da un lato
  g.add(cyl(0.01, 0.01, w + 0.06, M.ottone, 0, hTot - 0.02, d / 2 + 0.03, 8).rotateZ(Math.PI / 2));
  const telo = new THREE.Mesh(new THREE.BoxGeometry(0.2, hTot - 0.12, 0.07, 3, 1, 1), M.linoBianco);
  const pos = telo.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + Math.sin(pos.getX(i) * 50) * 0.02);
  telo.position.set(-w / 2 + 0.12, (hTot - 0.12) / 2 + 0.06, d / 2 + 0.03);
  telo.castShadow = true;
  g.add(telo);

  // detersivi e cesto sul top
  g.add(cyl(0.05, 0.045, 0.16, M.ceramicaSalvia, -0.18, hTot + 0.115, 0, 14));
  g.add(cyl(0.04, 0.04, 0.12, M.ceramica, -0.07, hTot + 0.095, 0.05, 14));
  g.add(box(0.28, 0.18, 0.24, M.linoTortora, 0.14, hTot + 0.125, 0));
  place(g, x, z, ry);
  ctx.solid(g);
  return g;
}

export function arredaCameraEst(ctx, stanze) {
  const M = MAT();
  const g = new THREE.Group();
  const R = stanze.camera_est.rects[0]; // x 6.14-10.26, z 4.22-6.51
  const zS = R.z + R.d;
  // parete nord in terracotta bruciata: fondo per la scala bianca
  ctx.pareti.add(plane(R.w, ctx.H, M.terracottaPittura, R.cx, ctx.H / 2, R.z + 0.02, 'z+'));
  // scala a chiocciola bianca addossata al muro nord, vicino alla porta
  g.add(scalaChiocciola(ctx, { cx: 7.6, cz: 5.01, r: 0.75, partenza: 250 }));
  // colonna lavanderia sulla parete nord, subito a est della scala
  g.add(colonnaLavatrice(ctx, { x: 8.92, z: R.z + 0.34 }));
  // angolo studio sotto la finestra a est
  g.add(scrittoio(ctx, R.x + R.w - 0.3, R.z + 1.37, -Math.PI / 2, 1.0));
  g.add(lampadaTavolo(ctx, R.x + R.w - 0.3, 0.77, R.z + 1.75, { colore: 'salvia', intensita: 4, h: 0.42 }));
  ctx.pareti.add(tende(1.14, 1.5, R.x + R.w - 0.03, 1.62, 5.37, 'x-'));
  // libreria bassa sulla parete sud e tappeto nella zona libera a est
  g.add(libreria(ctx, { w: 1.2, h: 1.6, x: 8.75, z: zS - 0.18, ry: Math.PI }));
  g.add(tappeto(1.3, 1.1, M.linoTortora, 9.25, 5.45));
  g.add(pianta(R.x + R.w - 0.35, R.z + 0.45, { h: 0.85, vaso: 0.15 }));
  ctx.pareti.add(quadro(0.5, 0.4, M.cartaBotanica, 7.05, 1.75, zS - 0.02, 'z-'));
  ctx.pareti.add(applique(ctx, 9.95, 1.6, zS - 0.02, 'z-', { intensita: 4 }));
  g.add(pendente(ctx, 9.3, 5.1, { yTop: ctx.H, calata: 0.4, raggio: 0.18, intensita: 12 }));
  return g;
}
