// Piano terra (casa della cognata): stesso perimetro del piano primo, un interpiano piu' sotto.
// Misure in src/data/piano-terra.json. Il gruppo e' costruito con il pavimento a quota 0:
// main.js lo sposta a altezze.quota_pavimento_m.
import * as THREE from 'three';
import PT from './data/piano-terra.json';
import PS from './data/piano-suoceri.json';
import { costruisciPiano } from './architettura.js';
import { getMateriali } from './data/stile.js';
import { box, lanterna } from './arredi/comune.js';

const C = 0.01;
export const PIANO_TERRA = PT;
export const PIANO_SUOCERI = PS;
export const QUOTA_TERRA = PT.altezze.quota_pavimento_m;
// l'edificio dei suoceri e' descritto dal suo angolo nord-ovest: qui sta nella casa (in metri)
export const ORIGINE_SUOCERI = [PS._meta.origine_nella_casa_cm.x * C, PS._meta.origine_nella_casa_cm.y * C];

export function costruisciPianoTerra(ctx) {
  const M = getMateriali();
  const floorMat = {
    zona_giorno: M.lastre, bagno: M.lastre, disimpegno: M.lastre, ripostiglio: M.lastre,
    camera_1: M.parquet, camera_2: M.parquet, camera_3: M.parquet,
  };
  const p = costruisciPiano(PT, ctx, { floorMat });

  // solaio fra i due piani: si vede solo quando il piano primo e' nascosto e il tetto e' acceso.
  // Sta dentro i muri esterni (che salgono fino a quota 0) e sopra i soffitti, mai complanare.
  const soletta = new THREE.Group();
  const top = PT.altezze.interpiano_cm * C, bot = p.H + 0.02;
  const matSoletta = [M.intonacoEsterno, M.intonacoEsterno, M.lastre, M.intonacoSoffitto, M.intonacoEsterno, M.intonacoEsterno];
  for (const [x0, z0, x1, z1] of [[0.25, 0.25, 10.28, 9.42], [6.24, 9.42, 10.28, 10.77]]) {
    soletta.add(box(x1 - x0, top - bot, z1 - z0, matSoletta, (x0 + x1) / 2, (top + bot) / 2, (z0 + z1) / 2));
  }

  // appartamento dei suoceri, addossato a nord: stesso piano, sotto il terrazzo del piano primo.
  // Il suo tetto e' il terrazzo (architettura.js), che poggia sulla testa dei suoi muri.
  const s = costruisciPiano(PS, ctx, {
    floorMat: {
      soggiorno_cucina: M.cotto, bagno: M.cementine, disimpegno: M.cotto,
      camera_1: M.parquet, camera_2: M.parquet, cabina: M.parquet,
      lavanderia: M.lastre, bagno_cognata: M.lastre,
    },
  });
  for (const k of ['walls', 'wallsLow', 'floors', 'ceilings']) {
    s[k].position.set(ORIGINE_SUOCERI[0], 0, ORIGINE_SUOCERI[1]);
    p[k].add(s[k]);
  }

  // lanterne in ottone: portoncino della cognata, ingresso e porta di servizio dei suoceri,
  // portafinestra della camera dei suoceri sul lato est
  const esterno = new THREE.Group();
  esterno.add(lanterna(ctx, 5.72, 2.25, 9.66, 'z+', { intensita: 12 }));
  esterno.add(lanterna(ctx, 0.69, 2.25, -10.12, 'x-', { intensita: 12 }));
  esterno.add(lanterna(ctx, 0.69, 2.25, -2.05, 'x-', { intensita: 8 }));
  esterno.add(lanterna(ctx, 9.25, 2.45, -4.4, 'x+', { intensita: 10 }));
  return { ...p, soletta, esterno, stanzeSuoceri: s.stanze };
}
