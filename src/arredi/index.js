// Registro degli arredi: una funzione per stanza, ognuna ritorna un THREE.Group.
import { arredaCucina } from './cucina.js';
export function arredi(ctx, stanze) {
  return [arredaCucina(ctx, stanze)];
}
