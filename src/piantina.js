// Piantina quotata in bianco e nero, generata dagli stessi dati del modello 3D
// (src/data/planimetria.json per il piano primo; per il piano terra src/data/piano-terra.json,
// la cognata, e src/data/piano-suoceri.json, i suoceri: un foglio per appartamento).
// Non tocca la scena: e' un pannello SVG a parte.
import planPrimo from './data/planimetria.json';

// piano in disegno: impostato da creaPiantina(); VER = la versione del piano primo in disegno
// (planimetria.json, versioni), o null per il disegno di base
let plan = planPrimo, A, SP_EST, SP_INT, VER = null;
function usaPiano(P, versione) {
  plan = P;
  A = P.altezze;
  SP_EST = P.muri.esterno_spessore_cm;
  SP_INT = P.muri.interno_spessore_cm;
  VER = (versione && P.versioni?.[versione]) || null;
}

// superfici con la virgola, come sui disegni
const mq = (n) => n.toFixed(2).replace('.', ',');
const areaStanza = (s) => (s.rettangoli || [s.rect]).reduce((a, r) => a + r.w * r.d, 0) / 1e4;
const nomeStanza = (k) => (k === 'camera_sud' && VER?.camera_sud_nome) || plan.stanze[k].nome_breve
  || plan.stanze[k].nome.replace(/\s*\(.*\)$/, '');

// ---------- aperture indicizzate per muro, con sigla progressiva ----------
// sigle stabili: le porte nuove di una versione si numerano dopo quelle del disegno di base,
// quelle tolte lasciano il loro numero libero; le aperture tamponate (C) restano muro pieno
function aperture() {
  const map = {};
  const elenco = [];
  const push = (muro, o, nelMuro = true) => {
    if (nelMuro) (map[muro] = map[muro] || []).push(o);
    elenco.push({ stato: 'esistente', asse: o.x_da !== undefined ? 'x' : 'y', ...o });
  };
  [...plan.porte, ...(VER?.porte_nuove || [])].forEach((p, i) => {
    if (VER?.porte_tolte?.includes(p.id)) return;
    push(p.muro, {
      ...p, verso: p.a, provenienza: p.da,
      a: p.x_da ?? p.y_da, b: p.x_a ?? p.y_a, larghezza: p.luce_cm,
      altezza: p.h_cm ?? (p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm),
      davanzale: 0, kind: p.tipo === 'vano' ? 'vano' : 'porta', sigla: (p.tipo === 'vano' ? 'V' : 'P') + (i + 1),
    });
  });
  (plan.aperture_chiuse || []).forEach((c, i) => push(c.muro, {
    ...c, a: c.x_da ?? c.y_da, b: c.x_a ?? c.y_a, larghezza: c.larghezza_cm, altezza: '-', davanzale: 0,
    kind: 'chiusa', sigla: 'C' + (i + 1),
  }, false));
  plan.finestre.forEach((f, i) => {
    const pf = f.tipo === 'portafinestra';
    const dav = pf ? 0 : (f.davanzale_cm ?? A.finestra_davanzale_cm);
    const alt = pf ? (f.altezza_cm ?? A.portafinestra_h_cm) : (f.altezza_cm ?? A.finestra_h_cm);
    push(f.muro, { ...f, a: f.x_da ?? f.y_da, b: f.x_a ?? f.y_a, larghezza: f.larghezza_cm,
      altezza: alt, davanzale: dav, kind: pf ? 'portafinestra' : 'finestra',
      sigla: (pf ? 'PF' : 'F') + (i + 1) });
  });
  for (const k in map) map[k].sort((p, q) => p.a - q.a);
  return { map, elenco };
}

// font che sta dentro la larghezza disponibile, distinto per i due caratteri usati
// (il serif dei nomi ha anche 2 unita' di spaziatura per lettera)
const fitSerif = (t, maxW, maxFont) => {
  const n = String(t).length;
  return Math.max(10, Math.min(maxFont, (maxW * 0.9 - 2 * n) / (0.72 * n)));
};
const fitMono = (t, maxW, maxFont) => Math.max(10, Math.min(maxFont, (maxW * 0.92) / (0.605 * String(t).length)));

function centroStanza(nome) {
  const st = plan.stanze[nome];
  if (st) {
    const r = (st.rettangoli || [st.rect])[0];
    return [r.x + r.w / 2, r.y + r.d / 2];
  }
  const e = plan.esterni?.[nome];
  if (e) {
    const r = e.rect || e.rettangoli[0];
    return [r.x + r.w / 2, r.y + r.d / 2];
  }
  return null;
}

// ---------- primitive SVG ----------
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rect = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const line = (x1, y1, x2, y2, cls) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const txt = (x, y, t, cls = 'lbl', extra = '') => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(t)}</text>`;

// quota singola con trattini a 45 gradi alle estremita'
function quota(x1, y1, x2, y2, testo, sopra = true) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1) return '';
  const ux = dx / L, uy = dy / L, t = 9;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = -uy, ny = ux;
  const off = sopra ? -10 : 16;
  return line(x1, y1, x2, y2, 'quota')
    + line(x1 - (ux - nx) * t, y1 - (uy - ny) * t, x1 + (ux - nx) * t, y1 + (uy - ny) * t, 'quota')
    + line(x2 - (ux - nx) * t, y2 - (uy - ny) * t, x2 + (ux - nx) * t, y2 + (uy - ny) * t, 'quota')
    + txt(mx + nx * off, my + ny * off, testo, 'quotaTxt',
      `text-anchor="middle" transform="rotate(${Math.abs(dy) > Math.abs(dx) ? -90 : 0} ${mx + nx * off} ${my + ny * off})"`);
}

// catena di quote lungo un asse
function catena(punti, fisso, asse, testi, sopra = true) {
  let out = '';
  for (let i = 0; i < punti.length - 1; i++) {
    const t = testi ? testi[i] : Math.round(punti[i + 1] - punti[i]);
    if (punti[i + 1] - punti[i] < 2) continue;
    out += asse === 'x'
      ? quota(punti[i], fisso, punti[i + 1], fisso, t, sopra)
      : quota(fisso, punti[i], fisso, punti[i + 1], t, sopra);
  }
  return out;
}

// blocco di righe centrato in uno spazio; se lo spazio e' allungato in verticale il testo ruota
function blocco(cx, cy, w, d, righe) {
  const ruota = d > w * 1.5;
  const maxW = ruota ? d : w;
  const dim = righe.map(([t, cls, max]) => (cls === 'mis' ? fitMono(t, maxW, max) : fitSerif(t, maxW, max)));
  const tot = dim.reduce((a, f, i) => a + f * (i ? 1.3 : 1.25), 0);
  let y = -tot / 2 + dim[0];
  let out = '';
  righe.forEach(([t, cls], i) => {
    // style e non attributo: il font-size delle classi CSS vincerebbe sull'attributo
    out += txt(0, y, t, cls, `text-anchor="middle" style="font-size:${dim[i].toFixed(1)}px"`);
    if (i < dim.length - 1) y += dim[i + 1] * 1.3;
  });
  return `<g transform="translate(${cx} ${cy})${ruota ? ' rotate(-90)' : ''}">${out}</g>`;
}

// ---------- muri con i vuoti delle aperture ----------
function muri(aper) {
  let out = '';
  for (const seg of plan.muri.segmenti) {
    const r = seg.rect;
    const horiz = r.w >= r.d;
    const start = horiz ? r.x : r.y, len = horiz ? r.w : r.d;
    const cls = seg.tipo === 'esterno' ? 'muroE' : 'muroI';
    let cur = start;
    const ops = aper.map[seg.id] || [];
    const pezzo = (a, b) => {
      if (b - a < 0.5) return;
      out += horiz ? rect(a, r.y, b - a, r.d, cls) : rect(r.x, a, r.w, b - a, cls);
    };
    for (const o of ops) { pezzo(cur, o.a); cur = o.b; }
    pezzo(cur, start + len);
  }
  return out;
}

// ---------- simboli di porte e finestre ----------
function simboli(aper) {
  let out = '';
  const segs = Object.fromEntries(plan.muri.segmenti.map((s) => [s.id, s]));
  for (const o of aper.elenco) {
    const r = segs[o.muro].rect;
    const horiz = r.w >= r.d;
    const t = horiz ? r.d : r.w;
    const c0 = horiz ? r.y : r.x, c1 = c0 + t;
    const L = o.b - o.a;
    if (o.kind === 'chiusa') {
      // apertura tamponata: muro nuovo, tratteggiato
      out += horiz ? rect(o.a, c0, L, t, 'tamp') : rect(c0, o.a, t, L, 'tamp');
    } else if (o.kind === 'finestra' || o.kind === 'portafinestra') {
      // tre linee sottili nel vano, come da convenzione
      out += horiz ? rect(o.a, c0, L, t, 'vano') : rect(c0, o.a, t, L, 'vano');
      for (const f of [0.34, 0.66]) {
        out += horiz ? line(o.a, c0 + t * f, o.b, c0 + t * f, 'serr')
                     : line(c0 + t * f, o.a, c0 + t * f, o.b, 'serr');
      }
    } else if (o.tipo === 'vano') {
      // passaggio senza anta: la porta e' nel muro accostato dell'altro appartamento
      out += horiz ? rect(o.a, c0, L, t, 'vuoto') : rect(c0, o.a, t, L, 'vuoto');
    } else if (o.tipo === 'scorrevole') {
      // scorrevole a scomparsa: vano vuoto e anta tratteggiata dentro la tasca del muro
      out += horiz ? rect(o.a, c0, L, t, 'vuoto') : rect(c0, o.a, t, L, 'vuoto');
      const cm = (c0 + c1) / 2;
      const dopo = !o.tasca || o.tasca === 'sud' || o.tasca === 'est';
      const [t0, t1] = dopo ? [o.b, o.b + L] : [o.a - L, o.a];
      out += horiz ? line(t0, cm, t1, cm, 'battente tasca') : line(cm, t0, cm, t1, 'battente tasca');
    } else {
      // porta: vano vuoto, battente aperto a 90 gradi e arco di apertura
      out += horiz ? rect(o.a, c0, L, t, 'vuoto') : rect(c0, o.a, t, L, 'vuoto');
      const cern = /cerniera a (nord|sud|est|ovest)/.exec(o.battente || '')?.[1];
      const cm = (c0 + c1) / 2;
      const dest = centroStanza(o.verso) || [0, 0];
      if (horiz) {
        const hx = cern === 'ovest' ? o.a : o.b;         // cardine
        const ax = cern === 'ovest' ? o.b : o.a;         // altro stipite
        const sv = Math.sign(dest[1] - cm) || 1;          // verso di apertura
        out += line(hx, cm, hx, cm + sv * L, 'battente');
        out += `<path d="M ${hx} ${cm + sv * L} A ${L} ${L} 0 0 ${((hx < ax) === (sv > 0)) ? 0 : 1} ${ax} ${cm}" class="arco"/>`;
      } else {
        const hy = cern === 'nord' ? o.a : o.b;
        const ay = cern === 'nord' ? o.b : o.a;
        const sv = Math.sign(dest[0] - cm) || 1;
        out += line(cm, hy, cm + sv * L, hy, 'battente');
        out += `<path d="M ${cm + sv * L} ${hy} A ${L} ${L} 0 0 ${((hy < ay) === (sv > 0)) ? 1 : 0} ${cm} ${ay}" class="arco"/>`;
      }
    }
    // sigla dell'apertura
    const mx = horiz ? (o.a + o.b) / 2 : (c0 + c1) / 2;
    const my = horiz ? (c0 + c1) / 2 : (o.a + o.b) / 2;
    // bollo pieno: apertura nuova, modificata o tamponata rispetto al disegno originale
    const nuova = o.stato !== 'esistente';
    out += `<circle cx="${mx}" cy="${my}" r="${nuova ? 20 : 17}" class="bollo${nuova ? ' pieno' : ''}"/>`
      + txt(mx, my + 6, o.sigla, `bolloTxt${nuova ? ' chiaro' : ''}`, 'text-anchor="middle"');
  }
  return out;
}

// ---------- versione 2: porta telescopica e quote del varco ----------
function portaTelescopica() {
  const T = VER?.porta_telescopica;
  if (!T) return '';
  const x0 = T.x_muro_cm, passo = (T.cassonetto_cm - 1.5) / T.ante;
  let out = rect(x0, T.y_da - 5, T.cassonetto_cm, T.pacco_aperto_y_a + 2 - (T.y_da - 5), 'cassonetto');
  for (let i = 0; i < T.ante; i++) {
    const x = x0 + 1.2 + passo * i;
    // aperta: le ante impacchettate a sud del varco; chiusa: tratteggiate sul varco
    out += rect(x, T.pacco_aperto_y_da, passo * 0.75, T.anta_cm, 'anta');
    const fine = T.y_a + 2 - i * (T.anta_cm - 4);
    out += line(x + passo * 0.37, fine - T.anta_cm, x + passo * 0.37, fine, 'anta chiusa');
  }
  const xt = x0 + T.cassonetto_cm + 16, yt = (T.y_da + T.pacco_aperto_y_a) / 2;
  out += txt(xt, yt, `porta telescopica, ${T.ante} ante`, 'misP',
    `text-anchor="middle" transform="rotate(-90 ${xt} ${yt})"`);
  // quote del varco lungo il muro, dal lato del soggiorno
  const varco = VER.porte_nuove[0];
  const seg = plan.muri.segmenti;
  const yN = seg.find((s) => s.id === 'I-dis-sud').rect;
  const xq = seg.find((s) => s.id === varco.muro).rect.x - 22; // fra il muro e l'arco del portoncino
  out += catena([yN.y + yN.d, varco.y_da, varco.y_a], xq, 'y', null, true);
  return out;
}

// ---------- stanze: nome, misure interne, superficie ----------
function stanze() {
  let out = '';
  for (const k of Object.keys(plan.stanze)) {
    const s = plan.stanze[k];
    const rs = s.rettangoli || [s.rect];
    const area = rs.reduce((a, r) => a + r.w * r.d, 0) / 1e4;
    const big = rs.reduce((a, b) => (a.w * a.d > b.w * b.d ? a : b));
    const cx = big.x + big.w / 2, cy = big.y + big.d / 2;
    for (const r of rs) out += rect(r.x, r.y, r.w, r.d, 'stanza');
    const quot = s.superficie_quotata_mq ? ` (disegno ${s.superficie_quotata_circa ? 'circa ' : ''}${s.superficie_quotata_circa ? s.superficie_quotata_mq : mq(s.superficie_quotata_mq)})` : '';
    if (rs.some((r) => r.parte)) {
      // ambiente aperto diviso in parti: ogni parte ampia ha il suo nome e le sue misure,
      // il totale va sulla parte piu' grande
      for (const r of rs) {
        if (r.w < 150 || r.d < 150) continue;
        const righe = [[r.parte.toUpperCase(), 'nome', 30], [`${r.w} x ${r.d} cm`, 'mis', 24]];
        if (r === big) righe.push([`totale ${mq(area)} mq${quot}`, 'mis', 24]);
        out += blocco(r.x + r.w / 2, r.y + r.d / 2, r.w, r.d, righe);
      }
      continue;
    }
    const nome = nomeStanza(k).toUpperCase();
    const mis = `${big.w} x ${big.d} cm`;
    const stretta = Math.min(big.w, big.d) < 200;
    const sup = `${mq(area)} mq` + (!stretta ? quot : '');
    const righe = [[nome, 'nome', 30], [mis, 'mis', 24], [sup, 'mis', 24]];
    if (k === 'camera_sud' && VER?.camera_sud_uso) righe.splice(1, 0, [VER.camera_sud_uso, 'mis', 22]);
    out += blocco(cx, cy, big.w, big.d, righe);
  }
  return out;
}

// ---------- terrazzo, balconi, pianerottolo ----------
function esterni() {
  const E = plan.esterni;
  const T = E.terrazzo_nord, I = T.interno_cm, sp = T.recinzione.spessore_cm;
  let out = '';
  // muro di recinzione del terrazzo
  out += rect(I.x_ovest - sp, I.z_nord - sp, sp, I.z_sud - I.z_nord + sp, 'muroE');
  out += rect(I.x_ovest, I.z_nord - sp, I.x_est_tratto_nord - I.x_ovest + sp, sp, 'muroE');
  out += rect(I.x_est_tratto_nord, I.z_nord, sp, I.z_risega - sp - I.z_nord, 'muroE');
  out += rect(I.x_est_tratto_nord, I.z_risega - sp, I.x_est_tratto_sud + sp - I.x_est_tratto_nord, sp, 'muroE');
  out += rect(I.x_est_tratto_sud, I.z_risega, sp, I.z_sud - I.z_risega, 'muroE');
  out += rect(I.x_ovest, I.z_risega, I.x_est_tratto_sud - I.x_ovest, I.z_sud - I.z_risega, 'stanza');
  out += rect(I.x_ovest, I.z_nord, I.x_est_tratto_nord - I.x_ovest, I.z_risega - I.z_nord, 'stanza');
  const tcx = (I.x_ovest + I.x_est_tratto_sud) / 2, tcy = (I.z_nord + I.z_sud) / 2;
  out += txt(tcx, tcy - 30, 'TERRAZZO', 'nome', 'text-anchor="middle"');
  out += txt(tcx, tcy + 2, `${mq(T.superficie_calcolata_mq)} mq  (disegno ${mq(T.quota_piantina_mq)})`, 'mis', 'text-anchor="middle"');
  out += txt(tcx, tcy + 32, `muro ${sp} cm, h ${T.recinzione.altezza_cm} cm`, 'mis', 'text-anchor="middle"');
  // quote del terrazzo
  out += catena([I.x_ovest, I.x_est_tratto_nord], I.z_nord - sp - 60, 'x', [I.x_est_tratto_nord - I.x_ovest]);
  out += catena([I.x_ovest, I.x_est_tratto_sud], I.z_sud - 60, 'x', [I.x_est_tratto_sud - I.x_ovest], false);
  out += catena([I.z_nord, I.z_risega, I.z_sud], I.x_est_tratto_sud + sp + 70, 'y',
    [I.z_risega - I.z_nord, I.z_sud - I.z_risega], false);
  out += quota(I.x_ovest - sp - 70, I.z_nord, I.x_ovest - sp - 70, I.z_sud, I.z_sud - I.z_nord);
  out += quota(I.x_est_tratto_nord, I.z_risega - sp - 22, I.x_est_tratto_sud, I.z_risega - sp - 22, I.x_est_tratto_sud - I.x_est_tratto_nord);
  // balconi e pianerottolo, solo profilo e superficie
  const poli = [];
  const aggiungi = (r, nome, mq) => poli.push({ r, nome, mq });
  aggiungi(E.balcone_ovest.rect, 'BALCONE OVEST', E.balcone_ovest.quota_piantina_mq);
  E.balcone_sud_est.rettangoli.forEach((r, i) => aggiungi(r, i ? '' : 'BALCONE SUD-EST', i ? null : E.balcone_sud_est.quota_piantina_mq));
  aggiungi(E.pianerottolo_esterno.rect, 'PIANEROTTOLO', null);
  aggiungi(E.pianerottolo_esterno.scala_esterna_rampa1.rect, 'SCALA', null);
  for (const p of poli) {
    out += rect(p.r.x, p.r.y, p.r.w, p.r.d, 'esterno');
    if (!p.nome) continue;
    const righe = [[p.nome, 'nomeS', 25]];
    if (p.mq) righe.push([`disegno ${mq(p.mq)} mq`, 'mis', 22]);
    righe.push([`${p.r.w} x ${p.r.d} cm`, 'mis', 22]);
    out += blocco(p.r.x + p.r.w / 2, p.r.y + p.r.d / 2, p.r.w, p.r.d, righe);
  }
  return out;
}

// ---------- quote perimetrali dell'appartamento ----------
function quotePerimetro(aper) {
  const I = plan.muri.ingombro_esterno;
  const W = I.larghezza_cm, D = I.profondita_cm;
  let out = '';
  const per = plan.muri.perimetro || { nord: ['E-nord'], sud: ['E-sud-soggiorno', 'E-sud-camera-sud'], ovest: ['E-ovest'], est: ['E-est'] };
  // le catene stanno oltre balconi, scala e pianerottolo, cosi' non ci passano sopra
  const est = [];
  for (const e of Object.values(plan.esterni || {})) {
    for (const r of [e.rect, ...(e.rettangoli || []), e.scala_esterna_rampa1?.rect, e.scala_esterna_rampa2?.rect]) if (r) est.push(r);
  }
  const fuoriO = Math.min(0, ...est.filter((r) => r.y > 0).map((r) => r.x));
  const fuoriE = Math.max(W, ...est.filter((r) => r.y > 0).map((r) => r.x + r.w));
  const fuoriS = Math.max(D, ...est.map((r) => r.y + r.d));
  const qO = fuoriO - 120, qE = fuoriE + 120, qS = fuoriS + 120;
  const pick = (ids) => ids.flatMap((id) => aper.map[id] || []).sort((a, b) => a.a - b.a);
  // nord (puo' essere piu' corto del lato sud: edificio dei suoceri)
  const Wn = per.lunghezza_nord ?? W;
  let p = [0]; pick(per.nord).forEach((o) => p.push(o.a, o.b)); p.push(Wn);
  if (p.length > 2) out += catena(p, -120, 'x', null, true); // senza aperture basta la quota totale
  out += quota(0, -210, Wn, -210, Wn, true);
  // sud
  p = [0]; pick(per.sud).forEach((o) => p.push(o.a, o.b)); p.push(W);
  out += catena(p, qS, 'x', null, false);
  // ovest
  p = [0]; pick(per.ovest).forEach((o) => p.push(o.a, o.b)); p.push(D);
  out += catena(p, qO, 'y', null, true);
  out += quota(qO - 90, 0, qO - 90, D, D, true);
  // est
  p = [0]; pick(per.est).forEach((o) => p.push(o.a, o.b)); p.push(D);
  out += catena(p, qE, 'y', null, false);
  return out;
}

// ---------- tabelle ----------
const TIPI = { porta: 'porta a battente', vano: 'varco', chiusa: 'tamponata', finestra: 'finestra', portafinestra: 'portafinestra' };
function tipoApertura(o) {
  if (o.kind === 'porta' && o.tipo === 'scorrevole') return 'porta scorrevole a scomparsa';
  if (o.kind === 'porta' && o.tipo === 'portoncino') return 'portoncino';
  if (o.kind === 'vano' && !VER?.porte_nuove?.some((p) => p.id === o.id)) return 'passaggio senza anta';
  return TIPI[o.kind];
}
const nomeAmbiente = (k) => (plan.stanze[k] ? nomeStanza(k) : String(k).replace(/_/g, ' '));

function tabelle(aper) {
  const sigla = Object.fromEntries(aper.elenco.map((o) => [o.id, o.sigla]));
  const righe = aper.elenco.map((o) => `<tr${o.stato !== 'esistente' ? ' class="mod"' : ''}><td>${o.sigla}</td><td>${tipoApertura(o)}</td>
    <td>${o.stato}</td><td>${o.larghezza}</td><td>${o.altezza}</td><td>${o.davanzale || '-'}</td>
    <td>${o.asse} ${o.a}-${o.b}</td><td>${esc(o.muro)}</td>
    <td>${esc(o.stanza ? nomeAmbiente(o.stanza) : [o.provenienza, o.verso].filter(Boolean).map(nomeAmbiente).join(' / '))}</td></tr>`).join('');

  // superfici: misurate, confronto con quelle scritte sul disegno originale, totali
  let calp = 0, quotTot = 0, tutteQuotate = true;
  const stanzeR = Object.keys(plan.stanze).map((k) => {
    const s = plan.stanze[k];
    const rs = s.rettangoli || [s.rect];
    const area = Math.round(areaStanza(s) * 100) / 100; // come in tabella: il totale e' la somma delle righe
    calp += area;
    const q = s.superficie_quotata_mq;
    if (q) quotTot += q; else { tutteQuotate = false; quotTot += area; }
    const big = rs.reduce((x, y) => (x.w * x.d > y.w * y.d ? x : y));
    const misure = rs.length > 1 ? rs.map((r) => `${r.w} x ${r.d}`).join(' + ') : `${big.w} x ${big.d}`;
    const diff = q ? `${area - q >= 0 ? '+' : ''}${mq(area - q)}` : '-';
    const nome = nomeStanza(k) + (nomeStanza(k) !== s.nome_breve && s.nome_breve ? ` (ex ${s.nome_breve.toLowerCase()})` : '');
    return `<tr><td>${esc(nome)}</td><td>${misure}</td><td>${mq(area)}</td><td>${q ? (s.superficie_quotata_circa ? 'circa ' + q : mq(q)) : 'non scritta'}</td><td>${diff}</td></tr>`;
  }).join('');
  const I = plan.muri.ingombro_esterno;
  const T = plan.esterni?.terrazzo_nord, E = plan.esterni;
  const varco = VER?.porte_nuove?.[0];
  const openSpace = VER && varco
    ? areaStanza(plan.stanze.soggiorno) + areaStanza(plan.stanze.camera_sud) + varco.luce_cm * plan.muri.segmenti.find((x) => x.id === varco.muro).rect.w / 1e4 : 0;
  const esterniR = E?.balcone_ovest ? [
    ['Terrazzo nord', `${T.quote_piantina.larghezza_tratto_sud} x ${T.quote_piantina.tratto_sud} + ${T.quote_piantina.larghezza_tratto_nord} x ${T.quote_piantina.tratto_nord}`, T.superficie_calcolata_mq, T.quota_piantina_mq],
    ['Balcone ovest', `${E.balcone_ovest.rect.w} x ${E.balcone_ovest.rect.d}`, E.balcone_ovest.superficie_calcolata_mq, E.balcone_ovest.quota_piantina_mq],
    ['Balcone sud-est', E.balcone_sud_est.rettangoli.map((r) => `${r.w} x ${r.d}`).join(' + '), E.balcone_sud_est.superficie_calcolata_mq, E.balcone_sud_est.quota_piantina_mq],
  ].map(([n, m, c, q]) => `<tr><td>${n}</td><td>${m}</td><td>${mq(c)}</td><td>${mq(q)}</td><td>${c - q >= 0 ? '+' : ''}${mq(c - q)}</td></tr>`).join('') : '';

  const modifiche = (plan.modifiche || []).filter((m) => !m.versione || VER).map((m, i) => `<tr><td>${i + 1}</td>
    <td>${m.apertura ? sigla[m.apertura] || '-' : '-'}</td><td>${esc(m.dove)}</td><td>${esc(m.prima)}</td><td>${esc(m.dopo)}</td><td>${esc(m.posizione)}</td></tr>`).join('');
  const impianti = (plan.impianti || []).map((x) => `<li><strong>${esc(nomeAmbiente(x.stanza))}</strong>: ${esc(x.testo)}</li>`).join('');
  const fonte = (nota, assunto = true) => (nota ? ' (da piantina)' : assunto ? ' (assunta)' : '');

  return `
  ${plan._meta.origine ? `<p class="pg-nota">Posizioni in cm dall'angolo esterno nord-ovest dell'edificio: x verso est, y verso sud. Bollo nero: apertura nuova, modificata o tamponata rispetto al disegno originale.</p>` : ''}
  ${VER?.strutturale ? `<p class="pg-avviso">${esc(VER.strutturale)}</p>` : ''}
  ${modifiche ? `<h3>Modifiche rispetto al disegno originale</h3>
  <div class="pg-tab"><table><thead><tr><th>N.</th><th>Sigla</th><th>Dove</th><th>Prima</th><th>Dopo</th><th>Posizione (cm)</th></tr></thead><tbody>${modifiche}</tbody></table></div>` : ''}
  <h3>Abaco delle aperture</h3>
  <div class="pg-tab"><table><thead><tr><th>Sigla</th><th>Tipo</th><th>Stato</th><th>Luce (cm)</th><th>Altezza (cm)</th><th>Davanzale (cm)</th><th>Posizione (cm)</th><th>Muro</th><th>Ambienti</th></tr></thead><tbody>${righe}</tbody></table></div>
  <h3>Superfici</h3>
  <div class="pg-tab"><table><thead><tr><th>Ambiente</th><th>Interno (cm)</th><th>Superficie (mq)</th><th>Sul disegno originale (mq)</th><th>Differenza (mq)</th></tr></thead><tbody>${stanzeR}
    <tr class="tot"><td>Superficie calpestabile</td><td>somma degli ambienti</td><td>${mq(calp)}</td><td>${mq(quotTot)}${tutteQuotate ? '' : ' *'}</td><td>${calp - quotTot >= 0 ? '+' : ''}${mq(calp - quotTot)}</td></tr>
    ${I.superficie_lorda_mq ? `<tr class="tot"><td>Superficie lorda</td><td>al filo esterno dei muri</td><td>${mq(I.superficie_lorda_mq)}</td><td>-</td><td>-</td></tr>` : ''}
    ${openSpace ? `<tr class="mod"><td>Open space (versione 2)</td><td>soggiorno + ${esc((plan.stanze.camera_sud.nome_breve || '').toLowerCase())} + soglia del varco</td><td>${mq(openSpace)}</td><td>-</td><td>-</td></tr>` : ''}
    ${esterniR}
  </tbody></table></div>
  ${plan._meta.verifica_misure ? `<p class="pg-nota">Superfici dalle misure del rilievo, ogni stanza chiusa sui suoi muri.${tutteQuotate ? '' : ' * Il disimpegno non e\' scritto sul disegno: e\' contato con la sua misura.'}
    Sul disegno originale le superfici delle singole stanze non stanno tutte nella stessa scala (scarti da -5% a +3%), ma il totale torna:
    il disegno e' schematico e le misure vanno confermate con il rilievo sul posto. Il terrazzo arriva a 67,12 contando il lato sud fino all'asse del muro.</p>` : ''}
  ${impianti ? `<h3>Impianti e sanitari da riportare</h3><ul class="pg-lista">${impianti}</ul>` : ''}
  <h3>Spessori e altezze</h3>
  <div class="pg-tab"><table><tbody>
    <tr><td>Muri esterni</td><td>${SP_EST} cm</td></tr>
    <tr><td>Muri interni</td><td>${SP_INT} cm</td></tr>
    <tr><td>Altezza interna</td><td>${A.soffitto_cm} cm${A.soffitto_assunto || A.soffitto_nota ? ' (assunta)' : ''}</td></tr>
    <tr><td>Porte interne</td><td>h ${A.porta_interna_h_cm} cm (assunta)</td></tr>
    ${varco ? `<tr><td>Varco versione 2</td><td>h ${varco.h_cm} cm</td></tr>` : ''}
    <tr><td>Portoncino</td><td>h ${A.portoncino_h_cm} cm${fonte(A.portoncino_nota)}</td></tr>
    <tr><td>Portefinestre</td><td>h ${A.portafinestra_h_cm} cm${fonte(A.portafinestra_nota)}</td></tr>
    <tr><td>Finestre</td><td>davanzale ${A.finestra_davanzale_cm} cm (assunto), h ${A.finestra_h_cm} cm${fonte(A.finestra_h_nota)}</td></tr>
    ${T ? `<tr><td>Muro del terrazzo</td><td>${T.recinzione.spessore_cm} cm${T.recinzione.assunto ? ' (assunto)' : ''}, h ${T.recinzione.altezza_cm} cm (assunta)</td></tr>` : ''}
    ${T?.falde_cm ? `<tr><td>Falde oltre il muretto</td><td>${T.falde_cm} cm su ovest, nord ed est (tetto dei suoceri)</td></tr>` : ''}
  </tbody></table></div>`;
}

// ---------- assemblaggio ----------
// P: un piano o un elenco di piani (il piano terra ha due appartamenti, un foglio ciascuno)
// versione: 'v1' | 'v2' per il piano primo (v2 = open space con varco e porta telescopica)
export function creaPiantina(P = planPrimo, { versione = null } = {}) {
  const piani = Array.isArray(P) ? P : [P];
  const fogli = piani.map((x) => foglio(x, versione));
  const v = versione && piani[0].versioni?.[versione];
  const titolo = (piani.length > 1 || piani[0]._meta.piano === 'terra' ? 'piano terra' : 'piano primo') + (v ? ' · ' + v.nome.toLowerCase() : '');
  const el = document.createElement('div');
  el.id = 'piantina';
  el.innerHTML = `
    <div class="pg-barra">
      <strong>Piantina quotata · ${titolo}</strong>
      <span class="pg-nota">Misure in cm ricavate dal rilievo del disegno originale, da confermare sul posto. I valori marcati "assunto" non sono leggibili sul disegno.</span>
      <button id="pg-stampa">Stampa</button>
      <button id="pg-chiudi">Torna al 3D</button>
    </div>
    ${fogli.map((f) => `<div class="pg-foglio">${f}</div>`).join('')}`;
  return el;
}

function foglio(P, versione) {
  usaPiano(P, versione);
  const aper = aperture();
  const I = plan.muri.ingombro_esterno;
  const E = plan.esterni;
  let minX = -300, maxX = I.larghezza_cm + 300, minY = -300, maxY = I.profondita_cm + 300;
  if (E?.terrazzo_nord) {
    const T = E.terrazzo_nord.interno_cm, spT = E.terrazzo_nord.recinzione.spessore_cm;
    minX = Math.min(E.balcone_ovest.rect.x, T.x_ovest - spT) - 300;
    maxX = Math.max(...E.balcone_sud_est.rettangoli.map((r) => r.x + r.w), I.larghezza_cm) + 300;
    minY = T.z_nord - spT - 300;
    maxY = Math.max(...E.balcone_sud_est.rettangoli.map((r) => r.y + r.d),
      E.pianerottolo_esterno.scala_esterna_rampa1.rect.y + E.pianerottolo_esterno.scala_esterna_rampa1.rect.d) + 520; // quote sud, scala grafica e titolo
  } else {
    maxY += 250; // spazio per titolo e scala grafica sotto la pianta
  }
  const titolo = (plan._meta.titolo ?? (plan._meta.piano === 'terra' ? 'PIANO TERRA' : 'PIANO PRIMO'))
    + (VER ? ' · ' + VER.nome.replace(/\s*·.*$/, '').toUpperCase() : '');

  const svg = `<svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="tratteggio" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="12" fill="#fff"/><line x1="0" y1="0" x2="0" y2="12" stroke="#141414" stroke-width="4"/></pattern></defs>
    <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#fff"/>
    ${E?.terrazzo_nord ? esterni() : ''}
    ${stanze()}
    ${muri(aper)}
    ${simboli(aper)}
    ${portaTelescopica()}
    ${quotePerimetro(aper)}
    <g>
      ${line(minX + 260, minY + 470, minX + 260, minY + 200, 'quota')}
      <path d="M ${minX + 260} ${minY + 180} l -34 70 l 34 -22 l 34 22 z" fill="#141414"/>
      ${txt(minX + 260, minY + 540, 'N', 'nome', 'text-anchor="middle"')}
    </g>
    <g>
      ${rect(minX + 180, maxY - 330, 100, 22, 'muroE')}${rect(minX + 280, maxY - 330, 100, 22, 'vano')}
      ${rect(minX + 380, maxY - 330, 100, 22, 'muroE')}${rect(minX + 480, maxY - 330, 100, 22, 'vano')}
      ${txt(minX + 180, maxY - 350, '0', 'mis', 'text-anchor="middle"')}
      ${txt(minX + 380, maxY - 350, '2 m', 'mis', 'text-anchor="middle"')}
      ${txt(minX + 580, maxY - 350, '4 m', 'mis', 'text-anchor="middle"')}
    </g>
    ${txt((minX + maxX) / 2, maxY - 110, titolo, 'titolo', 'text-anchor="middle"')}
    ${txt((minX + maxX) / 2, maxY - 55, VER ? `${VER.nome.replace(/^.*·\s*/, '')} · misure in centimetri` : 'misure in centimetri', 'mis', 'text-anchor="middle"')}
  </svg>`;

  const nota = plan._meta.coincidenza_terrazzo ? `<p class="pg-nota">${esc(plan._meta.coincidenza_terrazzo)}</p>` : '';
  return svg + nota + tabelle(aper);
}
