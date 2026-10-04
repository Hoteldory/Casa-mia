// Tour guidato: una sequenza di inquadrature, ognuna un movimento lento di camera (da/a, con
// il punto guardato), legate da dissolvenze in nero. Coordinate mondo: piano primo a quota 0,
// piano terra a -3,40. Ogni scatto dice in che piano si e' e che luce c'e'.
export const SCATTI = [
  { piano: 'primo', ora: 10, durata: 9, titolo: 'Casa mia', testo: 'Antico in chiave moderna',
    da: [-15, 17, 31], mira0: [5, 0, 3], a: [-5, 9, 24], mira1: [5, -1, 6] },
  { piano: 'primo', ora: 10.5, durata: 8, titolo: 'Il giardino', testo: 'Muretto, cancellata in ferro e due posti auto',
    da: [1.5, -1.6, 23], mira0: [5, -2, 12], a: [6.2, -1.8, 19], mira1: [6, -1.2, 10] },
  { piano: 'primo', ora: 11, durata: 8, titolo: 'Il soggiorno', testo: 'Travi in rovere, lino avena e azzurro polvere',
    da: [3.9, 1.65, 6.5], mira0: [1.5, 1.0, 9.2], a: [3.6, 1.6, 7.6], mira1: [1.2, 1.0, 8.6] },
  { piano: 'primo', ora: 11, durata: 8, titolo: 'La cucina', testo: 'Azzurro polvere, marmo e il tavolo da fattoria che si allunga a otto posti',
    da: [3.9, 1.55, 3.7], mira0: [0.9, 1.1, 1.5], a: [3.8, 1.6, 2.4], mira1: [0.6, 1.1, 1.4] },
  { piano: 'primo', ora: 11.5, durata: 7, titolo: 'Il bagno', testo: 'Piastrelle metro, ardesia e ottone',
    da: [5.9, 1.6, 2.9], mira0: [4.4, 1.0, 1.0], a: [5.5, 1.6, 2.3], mira1: [4.6, 1.2, 0.6] },
  { piano: 'primo', ora: 12, durata: 8, titolo: 'La camera', testo: 'Parete a doghe verde oliva, lino e rovere',
    da: [9.8, 1.7, 1.3], mira0: [8.6, 0.9, 3.9], a: [7.6, 1.65, 1.4], mira1: [8.8, 0.9, 3.8] },
  { piano: 'primo', ora: 17, durata: 9, titolo: 'Il terrazzo', testo: 'Pergola con festoni di luci e ulivi. Sotto, la casa dei suoceri',
    da: [4.0, 1.7, -9.6], mira0: [5.0, 1.2, -3.4], a: [6.2, 1.9, -8.4], mira1: [4.9, 1.0, -3.0] },
  { piano: 'terra', ora: 11, durata: 8, titolo: 'Piano terra', testo: 'La cucina della cognata, con il camino',
    da: [3.9, -1.75, 6.6], mira0: [0.9, -2.3, 8.6], a: [3.2, -1.75, 7.3], mira1: [0.8, -2.2, 9.0] },
  { piano: 'terra', ora: 11.5, durata: 8, titolo: 'Il soggiorno blu petrolio', testo: 'Due divani e la finestra nuova sopra quello a est',
    da: [6.5, -1.75, 6.8], mira0: [9.8, -2.4, 9.9], a: [7.3, -1.75, 7.3], mira1: [9.9, -2.3, 9.0] },
  { piano: 'terra', ora: 12, durata: 8, titolo: 'La casa dei suoceri', testo: 'Cucina ad L con ante crema e piastrelle ocra',
    da: [4.8, -1.75, -10.9], mira0: [8.2, -2.6, -8.0], a: [3.9, -1.7, -9.9], mira1: [7.9, -2.5, -8.3] },
  { piano: 'primo', sera: true, durata: 11, titolo: 'Buonasera', testo: 'Casa mia, di sera',
    da: [23, 9, 23], mira0: [5, -1, 3], a: [14, 5.5, 27], mira1: [5, -1, 5] },
];

const FADE = 0.9;
const liscio = (k) => k * k * (3 - 2 * k);

// dip: { camera, orbit, prepara(scatto), fine(), velo, titolo, testo, didascalia }
export function creaTour(dip) {
  let attivo = false, i = 0, t = 0, chiusura = false;

  function mostra(scatto) {
    dip.prepara(scatto);
    dip.titolo.textContent = scatto.titolo;
    dip.testo.textContent = scatto.testo;
    dip.didascalia.classList.remove('vista');
    dip.velo.classList.remove('nero');
  }

  return {
    get attivo() { return attivo; },
    avvia() {
      attivo = true; chiusura = false; i = 0; t = 0;
      mostra(SCATTI[0]);
    },
    ferma() {
      if (!attivo) return;
      attivo = false;
      dip.didascalia.classList.remove('vista');
      dip.velo.classList.add('nero');
      setTimeout(() => { dip.fine(); dip.velo.classList.remove('nero'); }, FADE * 1000);
    },
    // muove la camera; ritorna true finche' il tour ha il controllo
    aggiorna(dt) {
      if (!attivo) return false;
      const s = SCATTI[i];
      t += dt;
      const k = liscio(Math.min(1, t / s.durata));
      const v = (a, b) => a.map((x, j) => x + (b[j] - x) * k);
      const p = v(s.da, s.a), m = v(s.mira0, s.mira1);
      dip.camera.position.set(p[0], p[1], p[2]);
      dip.orbit.target.set(m[0], m[1], m[2]);
      dip.camera.lookAt(dip.orbit.target);
      if (t > 0.7 && t < s.durata - 1.6) dip.didascalia.classList.add('vista');
      else dip.didascalia.classList.remove('vista');
      if (!chiusura && t > s.durata - FADE) { chiusura = true; dip.velo.classList.add('nero'); }
      if (t >= s.durata) {
        chiusura = false; t = 0; i++;
        if (i >= SCATTI.length) { attivo = false; dip.fine(); dip.velo.classList.remove('nero'); return false; }
        mostra(SCATTI[i]);
      }
      return true;
    },
  };
}
