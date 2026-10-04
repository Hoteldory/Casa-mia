// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
// Il tavolo da pranzo esiste chiuso e aperto: due gruppi marcati ('chiuso', 'aperto'),
// in scena si accende solo quello scelto.
import * as THREE from 'three';
import { arredaCucina, tavoloPranzo } from './cucina.js';
import { arredaBagno } from './bagno.js';
import { arredaSoggiorno } from './soggiorno.js';
import { arredaDisimpegno } from './disimpegno.js';
import { arredaCameraNord } from './camera_nord.js';
import { arredaCameraSud } from './camera_sud.js';
import { arredaCameraSudV2 } from './camera_sud_v2.js';
import { piantaAppendice } from './soggiorno.js';
import { arredaCameraEst } from './camera_est.js';
import { arredaTerrazzo } from './terrazzo.js';

export const TAVOLO_STATI = {
  chiuso: { nome: 'Chiuso · 4 posti', nota: 'Tavolo 140 x 100 cm, quattro posti.' },
  aperto: { nome: 'Aperto · 8 posti', nota: 'Tavolo allungato a 220 x 100 cm, otto posti.' },
};

// Le due versioni del piano primo: V1 con la seconda camera, V2 con l'open space gaming e allenamento
export const VERSIONI = {
  v1: { nome: 'Versione 1 · camera', nota: 'La seconda camera da letto, con la sua porta.' },
  v2: { nome: 'Versione 2 · open space', nota: 'Varco di 2,40 m sul soggiorno: angolo gaming e zona allenamento, chiudibili con la porta telescopica in legno.' },
};

// ogni gruppo marcato e i pezzi che contiene: il tavolo chiuso o aperto, la seconda camera nelle due versioni
const PARTI = {
  chiuso: (ctx) => [tavoloPranzo(ctx, false)],
  aperto: (ctx) => [tavoloPranzo(ctx, true)],
  v1: (ctx, stanze) => [arredaCameraSud(ctx, stanze), piantaAppendice(stanze, 'v1')],
  v2: (ctx, stanze) => [arredaCameraSudV2(ctx, stanze), piantaAppendice(stanze, 'v2')],
};

// paretiVersione: per ogni tag, il gruppo dove appendere ai muri (pitture, quadri, tende) i pezzi
// di quella versione; sta con i muri e si accende con loro
export function arredi(ctx, stanze, paretiVersione = {}) {
  const paretiComuni = ctx.pareti;
  const comuni = [
    arredaCucina(ctx, stanze),
    arredaBagno(ctx, stanze),
    arredaSoggiorno(ctx, stanze),
    arredaDisimpegno(ctx, stanze),
    arredaCameraNord(ctx, stanze),
    arredaCameraEst(ctx, stanze),
    arredaTerrazzo(ctx),
  ];
  comuni[comuni.length - 1].userData.esterno = true; // il terrazzo e' il tetto dei suoceri: resta in vista del piano terra (con il tetto acceso)
  const varianti = {};
  for (const [tag, build] of Object.entries(PARTI)) {
    ctx.variante = tag; // ingombri e punti luce nascono marchiati con l'allestimento
    ctx.pareti = paretiVersione[tag] || paretiComuni;
    const g = new THREE.Group();
    for (const parte of build(ctx, stanze)) g.add(parte);
    g.userData.variante = tag;
    varianti[tag] = g;
  }
  ctx.variante = null;
  ctx.pareti = paretiComuni;
  return { comuni, varianti };
}
