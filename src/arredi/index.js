// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
// Due gruppi extra contengono cio' che cambia fra le versioni V1 e V2: isola + zona pranzo
// e zona TV. Restano entrambi in scena e si accende solo quello della versione scelta.
import * as THREE from 'three';
import { arredaCucina, zonaPranzoV1, zonaPranzoV2 } from './cucina.js';
import { arredaBagno } from './bagno.js';
import { arredaSoggiorno, tvV1, tvV2 } from './soggiorno.js';
import { arredaDisimpegno } from './disimpegno.js';
import { arredaCameraNord } from './camera_nord.js';
import { arredaCameraSud } from './camera_sud.js';
import { arredaCameraEst } from './camera_est.js';
import { arredaTerrazzo } from './terrazzo.js';

export const VERSIONI = {
  v1: { nome: 'V1 · originale', nota: 'Isola da 2,10 m con tre sgabelli, mobile TV in noce davanti al divano.' },
  v2: { nome: 'V2 · quinta TV', nota: 'Quinta in cartongesso con una TV per lato, isola ridotta a 1,30 m e tavolo da otto.' },
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
  for (const [k, build] of [['v1', [zonaPranzoV1, tvV1]], ['v2', [zonaPranzoV2, tvV2]]]) {
    ctx.variante = k; // ingombri e punti luce nascono marchiati con la versione
    const g = new THREE.Group();
    for (const f of build) g.add(f(ctx, stanze));
    g.userData.variante = k;
    varianti[k] = g;
  }
  ctx.variante = null;
  return { comuni, varianti };
}
