// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
import { arredaCucina } from './cucina.js';
import { arredaBagno } from './bagno.js';
import { arredaSoggiorno } from './soggiorno.js';
import { arredaDisimpegno } from './disimpegno.js';
export function arredi(ctx, stanze) {
  return [arredaCucina(ctx, stanze), arredaBagno(ctx, stanze), arredaSoggiorno(ctx, stanze), arredaDisimpegno(ctx, stanze)];
}
