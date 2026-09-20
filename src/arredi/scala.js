// Scala a chiocciola bianca che sale al secondo piano.
// Colonna centrale, pedate a ventaglio, balaustra e corrimano elicoidale.
import * as THREE from 'three';
import { cyl, box, MAT } from './comune.js';

const BIANCO = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.42 });
const BIANCO_PEDATA = new THREE.MeshStandardMaterial({ color: '#ece7dc', roughness: 0.55 });

// settore circolare (pedata) di spessore h, dall'asse fino al raggio r
function pedata(r, h, thetaStart, thetaLength, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14, 1, false, thetaStart, thetaLength), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// tratto di corrimano fra due punti
function tratto(p1, p2, raggio, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(raggio, raggio, dir.length(), 10), mat);
  m.position.copy(p1).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.castShadow = true;
  return m;
}

export function scalaChiocciola(ctx, {
  cx, cz,
  r = 0.75,              // raggio della pedata
  interpiano = 2.96,     // dislivello fra i due piani (soffitto 270 + solaio 26)
  alzate = 16,
  passo = 22,            // gradi per pedata
  partenza = 260,        // orientamento della prima pedata (gradi: 0 = sud, 90 = est)
  hMax = 2.98,           // quota del piano di arrivo: balaustra e colonna si fermano qui
} = {}) {
  const M = MAT();
  const g = new THREE.Group();
  const rise = interpiano / alzate;
  const rCol = 0.075;
  const rBal = r - 0.055;         // raggio della balaustra
  const hBal = 0.95;              // altezza del corrimano sopra la pedata
  const rad = THREE.MathUtils.degToRad;

  // colonna centrale e base
  g.add(cyl(rCol, rCol, hMax, BIANCO, 0, hMax / 2, 0, 20));
  g.add(cyl(0.17, 0.19, 0.045, BIANCO, 0, 0.022, 0, 28));
  g.add(cyl(0.1, 0.1, 0.02, BIANCO, 0, hMax - 0.01, 0, 20));

  const cime = [];
  for (let i = 0; i < alzate - 1; i++) {
    const a0 = rad(partenza + passo * i);
    const y = rise * (i + 1);
    // pedata a ventaglio, con una leggera sovrapposizione fra una e l'altra
    const p = pedata(r, 0.042, a0, rad(passo * 1.04), BIANCO_PEDATA);
    p.position.y = y - 0.021;
    g.add(p);
    // alzata: sottile fascia verticale sul bordo posteriore
    const alz = box(r - rCol, rise - 0.042, 0.018, BIANCO, 0, 0, 0);
    alz.position.set(Math.sin(a0) * (r + rCol) / 2, y - rise / 2 - 0.021, Math.cos(a0) * (r + rCol) / 2);
    alz.rotation.y = Math.PI / 2 - a0; // la fascia va disposta in senso radiale
    g.add(alz);
    // due montanti della balaustra sul bordo esterno
    for (const f of [0.18, 0.82]) {
      const a = a0 + rad(passo * f);
      const x = Math.sin(a) * rBal, z = Math.cos(a) * rBal;
      // oltre il piano di arrivo la balaustra appartiene al secondo piano: qui si ferma
      const h = Math.min(hBal, hMax - y);
      if (h < 0.15) continue;
      g.add(cyl(0.013, 0.013, h, BIANCO, x, y + h / 2, z, 8));
      if (f === 0.82 && h > hBal - 0.02) cime.push(new THREE.Vector3(x, y + h, z));
    }
  }
  // corrimano elicoidale che unisce le cime dei montanti
  for (let i = 0; i < cime.length - 1; i++) g.add(tratto(cime[i], cime[i + 1], 0.021, BIANCO));
  for (const c of cime) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.021, 10, 8), BIANCO).translateX(c.x).translateY(c.y).translateZ(c.z));

  g.position.set(cx, 0, cz);
  // ingombro: in prima persona non si sale, quindi la scala si comporta da volume pieno
  ctx.addColliderBox(cx - r, cx + r, cz - r, cz + r, 0, 2.2);
  return g;
}
