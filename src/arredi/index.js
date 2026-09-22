// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
// Alcuni pezzi della zona giorno esistono in piu' allestimenti: stanno in gruppi marcati
// ('v1', 'v2', 'v1-aperto', ...) e in scena si accende solo la combinazione scelta.
import * as THREE from 'three';
import { arredaCucina, zonaCucinaV1, zonaCucinaV2, tavoloPranzo } from './cucina.js';
import { arredaBagno } from './bagno.js';
import { arredaSoggiorno, tvV1, tvV2 } from './soggiorno.js';
import { arredaDisimpegno } from './disimpegno.js';
import { arredaCameraNord } from './camera_nord.js';
import { arredaCameraSud } from './camera_sud.js';
import { arredaCameraEst } from './camera_est.js';
import { arredaTerrazzo } from './terrazzo.js';

export const VERSIONI = {
  v1: { nome: 'V1 · originale', nota: 'Isola da 2,10 m con tre sgabelli, mobile TV in noce davanti al divano.' },
  v2: { nome: 'V2 · quinta TV', nota: 'Quinta in cartongesso da 12 cm con una TV a staffa per lato, isola ridotta a 1,30 m.' },
};

export const TAVOLO_STATI = {
  chiuso: { nome: 'Chiuso · 4 posti', nota: (v) => v === 'v1' ? 'Tavolo 140 x 100 cm, quattro posti.' : 'Tavolo 160 x 110 cm, quattro posti.' },
  aperto: { nome: 'Aperto · 8 posti', nota: (v) => v === 'v1' ? 'Tavolo allungato a 220 x 100 cm, otto posti.' : 'Tavolo allungato a 240 x 110 cm, otto posti.' },
};

// ogni gruppo marcato e i pezzi che contiene
const PARTI = {
  v1: (ctx) => [zonaCucinaV1(ctx), tvV1(ctx)],
  v2: (ctx) => [zonaCucinaV2(ctx), tvV2(ctx)],
  'v1-chiuso': (ctx) => [tavoloPranzo(ctx, 'v1', false)],
  'v1-aperto': (ctx) => [tavoloPranzo(ctx, 'v1', true)],
  'v2-chiuso': (ctx) => [tavoloPranzo(ctx, 'v2', false)],
  'v2-aperto': (ctx) => [tavoloPranzo(ctx, 'v2', true)],
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
