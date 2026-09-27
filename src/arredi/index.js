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
import { arredaCameraEst } from './camera_est.js';
import { arredaTerrazzo } from './terrazzo.js';

export const TAVOLO_STATI = {
  chiuso: { nome: 'Chiuso · 4 posti', nota: 'Tavolo 140 x 100 cm, quattro posti.' },
  aperto: { nome: 'Aperto · 8 posti', nota: 'Tavolo allungato a 220 x 100 cm, otto posti.' },
};

// ogni gruppo marcato e i pezzi che contiene: il tavolo chiuso o aperto
const PARTI = {
  chiuso: (ctx) => [tavoloPranzo(ctx, false)],
  aperto: (ctx) => [tavoloPranzo(ctx, true)],
};

export function arredi(ctx, stanze) {
  const comuni = [
    arredaCucina(ctx, stanze),
    arredaBagno(ctx, stanze),
    arredaSoggiorno(ctx, stanze),
    arredaDisimpegno(ctx, stanze),
    arredaCameraNord(ctx, stanze),
    arredaCameraSud(ctx, stanze),
    arredaCameraEst(ctx, stanze),
    arredaTerrazzo(ctx),
  ];
  comuni[comuni.length - 1].userData.esterno = true; // il terrazzo resta visibile anche in vista del piano terra
  const varianti = {};
  for (const [tag, build] of Object.entries(PARTI)) {
    ctx.variante = tag; // ingombri e punti luce nascono marchiati con l'allestimento
    const g = new THREE.Group();
    for (const parte of build(ctx, stanze)) g.add(parte);
    g.userData.variante = tag;
    varianti[tag] = g;
  }
  ctx.variante = null;
  return { comuni, varianti };
}
