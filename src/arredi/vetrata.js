// Vetrata telescopica della versione 2: chiude a richiesta il varco fra soggiorno e open space.
// Tre ante in legno bianco latte, zoccolo pieno e vetro cannettato sopra (luce si', sguardi no),
// su tre binari paralleli nascosti in un cassonetto di rovere al soffitto. Le ante scorrono
// insieme: aperte stanno impacchettate a sud del varco, chiuse lo coprono tutto.
// Ritorna il gruppo; userData.ante sono le tre ante (gruppi da fondere uno per uno, restano
// mobili) e userData.imposta(k) le mette in posizione: k = 0 aperta, 1 chiusa.
import * as THREE from 'three';
import { box, cyl, MAT } from './comune.js';

const SP = 0.035;   // spessore di un'anta
const PASSO = 0.045; // distanza fra i binari
const SOV = 0.04;   // sormonto fra due ante vicine

function anta(W, Hp, maniglia) {
  const M = MAT();
  const L = M.biancoLatte;
  const g = new THREE.Group();
  // in locale: X = spessore, Y = altezza, Z = larghezza dell'anta
  const m = 0.055, zoccolo = 0.9, traversa = 0.06, base = 0.12;
  g.add(box(SP, Hp, m, L, 0, Hp / 2, -W / 2 + m / 2));             // montanti
  g.add(box(SP, Hp, m, L, 0, Hp / 2, W / 2 - m / 2));
  g.add(box(SP, m, W - 2 * m, L, 0, Hp - m / 2, 0));                 // traverso alto
  g.add(box(SP, base, W - 2 * m, L, 0, base / 2, 0));                // traverso basso
  g.add(box(SP, traversa, W - 2 * m, L, 0, zoccolo + traversa / 2, 0)); // traverso a meta'
  // zoccolo pieno con riquadro a rilievo su entrambe le facce
  const hz = zoccolo - base;
  g.add(box(SP * 0.6, hz, W - 2 * m, L, 0, base + hz / 2, 0));
  g.add(box(SP + 0.01, hz - 0.12, W - 2 * m - 0.12, L, 0, base + hz / 2, 0));
  // vetro cannettato in due bacchette orizzontali (tre specchiature)
  const y0 = zoccolo + traversa, y1 = Hp - m, hv = y1 - y0;
  const vetro = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * m, hv), M.vetroCannettato);
  vetro.rotation.y = Math.PI / 2;
  vetro.position.set(0, y0 + hv / 2, 0);
  vetro.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * hv : v * (W - 2 * m); });
  g.add(vetro);
  for (const k of [1, 2]) g.add(box(SP * 0.7, 0.025, W - 2 * m, L, 0, y0 + (hv * k) / 3, 0, { cast: false }));
  // maniglione verticale in ottone sul bordo nord dell'anta che apre, sui due lati
  if (maniglia) {
    for (const s of [-1, 1]) {
      const z = -W / 2 + 0.03;
      g.add(cyl(0.011, 0.011, 0.4, M.ottone, s * (SP / 2 + 0.035), 1.05, z, 10));
      for (const dy of [-0.17, 0.17]) {
        const p = cyl(0.007, 0.007, 0.035, M.ottone, s * (SP / 2 + 0.017), 1.05 + dy, z, 8);
        p.rotation.z = Math.PI / 2; g.add(p);
      }
    }
  }
  return g;
}

export function vetrataTelescopica(ctx, { xMuro, z0, z1, h, ante = 3 }) {
  const M = MAT();
  const g = new THREE.Group();
  const W = (z1 - z0 + (ante - 1) * SOV) / ante + 0.01; // ogni anta copre la sua parte, con sormonto
  const Hp = h - 0.03;
  // cassonetto in rovere al soffitto, dal varco fino in fondo al pacco delle ante
  const zFine = z1 + W + 0.06;
  const xC = xMuro + 0.012 + ante * PASSO;
  const hC = ctx.H - h;
  g.add(box(xC - xMuro, hC, zFine - z0 + 0.05, M.rovereMiele, (xMuro + xC) / 2, h + hC / 2 - 0.006, (z0 - 0.05 + zFine) / 2));
  // le ante: binario 0 vicino al muro (la parte sud del varco), l'ultima e' quella con la maniglia
  const pezzi = [];
  for (let i = 0; i < ante; i++) {
    const a = anta(W, Hp, i === ante - 1);
    a.position.x = xMuro + 0.012 + PASSO * (i + 0.5);
    a.position.y = 0.012;
    a.userData.mobile = true;
    const chiusa = z1 + 0.02 - W / 2 - i * (W - SOV);
    const aperta = z1 + 0.04 + W / 2;
    pezzi.push({ a, chiusa, aperta });
    g.add(a);
  }
  // ingombro del varco a vetrata chiusa
  ctx.addColliderBox(xMuro, xC, z0, z1, 0, 2.2);
  const imposta = (k) => { for (const p of pezzi) p.a.position.z = p.aperta + (p.chiusa - p.aperta) * k; };
  imposta(0);
  g.userData.ante = pezzi.map((p) => p.a);
  g.userData.imposta = imposta;
  return g;
}
