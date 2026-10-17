// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
// Le due versioni del piano primo cambiano solo il soggiorno (cucina, tavolo, salotto); la camera
// sud e' in tutte e due l'open space gaming e allenamento. Il tavolo da pranzo esiste chiuso e
// aperto in ogni versione: gruppi marcati 'chiuso.v1', 'aperto.v2'..., si accende solo quello scelto.
import * as THREE from 'three';
import { arredaCucina, arredaCucinaV2, tavoloPranzo, tavoloPranzoV2 } from './cucina.js';
import { arredaBagno } from './bagno.js';
import { arredaSoggiorno, salottoV1, salottoV2 } from './soggiorno.js';
import { arredaDisimpegno } from './disimpegno.js';
import { arredaCameraNord } from './camera_nord.js';
import { arredaCameraSudV2 } from './camera_sud_v2.js';
import { arredaCameraEst } from './camera_est.js';
import { arredaTerrazzo } from './terrazzo.js';

export const TAVOLO_STATI = {
  chiuso: { nome: 'Chiuso · 4 posti', nota: 'Tavolo 140 x 100 cm, quattro posti.' },
  aperto: { nome: 'Aperto · 8 posti', nota: 'Tavolo allungato a 220 x 100 cm, otto posti.' },
};

// Le due versioni del soggiorno
export const VERSIONI = {
  v1: { nome: 'Versione 1 · cucina a nord', nota: 'Cucina sulla parete ovest, tavolo al centro, salotto a sud. Camera sud aperta: gaming e allenamento, con la porta telescopica.' },
  v2: { nome: 'Versione 2 · cucina a sud', nota: "Cucina con l'isola sul muro sud, vicino all'ingresso; tavolo al centro, salotto verso il terrazzo. Camera sud aperta: gaming e allenamento, con la porta telescopica." },
};

// ogni gruppo marcato e i pezzi che contiene: il soggiorno nelle due versioni, il tavolo chiuso o
// aperto in ognuna
const PARTI = {
  v1: (ctx, stanze) => [arredaCucina(ctx, stanze), salottoV1(ctx, stanze)],
  v2: (ctx, stanze) => [arredaCucinaV2(ctx, stanze), salottoV2(ctx, stanze)],
  'chiuso.v1': (ctx) => [tavoloPranzo(ctx, false)],
  'aperto.v1': (ctx) => [tavoloPranzo(ctx, true)],
  'chiuso.v2': (ctx) => [tavoloPranzoV2(ctx, false)],
  'aperto.v2': (ctx) => [tavoloPranzoV2(ctx, true)],
};

// paretiVersione: per ogni versione, il gruppo dove appendere ai muri (pitture, quadri, tende) i
// suoi pezzi; sta con i muri e si accende con lei
export function arredi(ctx, stanze, paretiVersione = {}) {
  const paretiComuni = ctx.pareti;
  const comuni = [
    arredaBagno(ctx, stanze),
    arredaSoggiorno(ctx, stanze),
    arredaDisimpegno(ctx, stanze),
    arredaCameraNord(ctx, stanze),
    arredaCameraEst(ctx, stanze),
    arredaCameraSudV2(ctx, stanze),
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
