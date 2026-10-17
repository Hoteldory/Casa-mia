// Posizione del sole (altezza e azimut) per luogo, giorno e ora: formule semplificate
// dell'almanacco (errore di qualche decimo di grado, piu' che sufficiente per luci e ombre).
// Ora locale italiana: +1 d'inverno, +2 con l'ora legale (dall'ultima domenica di marzo
// all'ultima di ottobre).
import LUOGO from './data/luogo.json';

const RAD = Math.PI / 180;

function ultimaDomenica(anno, mese0) {
  const d = new Date(Date.UTC(anno, mese0 + 1, 0));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getUTCDate();
}
// ore di differenza fra l'ora italiana e UTC in quel giorno
export function fusoItalia(anno, mese0, giorno) {
  const inizio = Date.UTC(anno, 2, ultimaDomenica(anno, 2));
  const fine = Date.UTC(anno, 9, ultimaDomenica(anno, 9));
  const t = Date.UTC(anno, mese0, giorno);
  return t >= inizio && t < fine ? 2 : 1;
}

// mese0 0-11, giorno del mese, ora locale decimale (es. 18.5 = 18:30)
export function posizioneSole({ mese0, giorno = 21, ora, anno = new Date().getFullYear(), lat = LUOGO.lat, lon = LUOGO.lon }) {
  const utc = Date.UTC(anno, mese0, giorno) + (ora - fusoItalia(anno, mese0, giorno)) * 3600000;
  const d = utc / 86400000 + 2440587.5 - 2451545.0;          // giorni dal 1 gennaio 2000, 12:00 UTC
  const g = (357.529 + 0.98560028 * d) * RAD;               // anomalia media
  const L = 280.459 + 0.98564736 * d;                        // longitudine media
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.00000036 * d) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const H = ((gmst * 15 + lon) * RAD - ra);                  // angolo orario
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  // azimut dal nord, in senso orario (est = 90)
  let az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H));
  if (az < 0) az += 2 * Math.PI;
  return { altezza: alt / RAD, azimut: az / RAD };
}

// direzione verso il sole nelle coordinate della scena: x = est della piantina, z = sud
// della piantina, y = alto; nord_gradi ruota la piantina rispetto al nord vero
export function direzioneSole({ altezza, azimut }) {
  const a = (azimut + LUOGO.nord_gradi) * RAD, h = altezza * RAD;
  return { x: Math.sin(a) * Math.cos(h), y: Math.sin(h), z: -Math.cos(a) * Math.cos(h) };
}
