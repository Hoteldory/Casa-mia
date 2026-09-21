// Piantina quotata in bianco e nero, generata dagli stessi dati del modello 3D
// (src/data/planimetria.json). Non tocca la scena: e' un pannello SVG a parte.
import plan from './data/planimetria.json';

const A = plan.altezze;
const SP_EST = plan.muri.esterno_spessore_cm;
const SP_INT = plan.muri.interno_spessore_cm;

// ---------- aperture indicizzate per muro, con sigla progressiva ----------
function aperture() {
  const map = {};
  const elenco = [];
  const push = (muro, o) => { (map[muro] = map[muro] || []).push(o); elenco.push(o); };
  plan.porte.forEach((p, i) => push(p.muro, {
    ...p, verso: p.a, provenienza: p.da,
    a: p.x_da ?? p.y_da, b: p.x_a ?? p.y_a, larghezza: p.luce_cm,
    altezza: p.tipo === 'portoncino' ? A.portoncino_h_cm : A.porta_interna_h_cm,
    davanzale: 0, kind: 'porta', sigla: 'P' + (i + 1),
  }));
  plan.finestre.forEach((f, i) => {
    const pf = f.tipo === 'portafinestra';
    const dav = pf ? 0 : (f.davanzale_cm ?? A.finestra_davanzale_cm);
    const alt = pf ? A.portafinestra_h_cm : (f.altezza_cm ?? A.finestra_h_cm);
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
  return Math.max(10, Math.min(maxFont, (maxW * 0.92 - 2 * n) / (0.66 * n)));
};
const fitMono = (t, maxW, maxFont) => Math.max(10, Math.min(maxFont, (maxW * 0.92) / (0.605 * String(t).length)));

function centroStanza(nome) {
  const st = plan.stanze[nome];
  if (st) {
    const r = (st.rettangoli || [st.rect])[0];
    return [r.x + r.w / 2, r.y + r.d / 2];
  }
  const e = plan.esterni[nome];
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
    out += txt(0, y, t, cls, `text-anchor="middle" font-size="${dim[i].toFixed(1)}"`);
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
    if (o.kind === 'finestra' || o.kind === 'portafinestra') {
      // tre linee sottili nel vano, come da convenzione
      out += horiz ? rect(o.a, c0, L, t, 'vano') : rect(c0, o.a, t, L, 'vano');
      for (const f of [0.34, 0.66]) {
        out += horiz ? line(o.a, c0 + t * f, o.b, c0 + t * f, 'serr')
                     : line(c0 + t * f, o.a, c0 + t * f, o.b, 'serr');
      }
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
    out += `<circle cx="${mx}" cy="${my}" r="17" class="bollo"/>` + txt(mx, my + 6, o.sigla, 'bolloTxt', 'text-anchor="middle"');
  }
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
    const nome = s.nome.replace(/\s*\(.*\)$/, '').toUpperCase();
    const mis = `${big.w} x ${big.d} cm`;
    const stretta = Math.min(big.w, big.d) < 200;
    const sup = `${area.toFixed(2)} mq` + (!stretta && s.superficie_quotata_mq ? ` (quot. ${s.superficie_quotata_mq})` : '');
    out += blocco(cx, cy, big.w, big.d, [[nome, 'nome', 30], [mis, 'mis', 24], [sup, 'mis', 24]]);
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
  out += txt(tcx, tcy + 2, `${T.superficie_calcolata_mq} mq  (quotato ${T.quota_piantina_mq})`, 'mis', 'text-anchor="middle"');
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
    if (p.mq) righe.push([`${p.mq} mq`, 'mis', 22]);
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
  const pick = (id) => (aper.map[id] || []);
  // nord
  let p = [0]; pick('E-nord').forEach((o) => p.push(o.a, o.b)); p.push(W);
  out += catena(p, -120, 'x', null, true);
  out += quota(0, -210, W, -210, W, true);
  // sud (due muri)
  p = [0]; [...pick('E-sud-soggiorno'), ...pick('E-sud-camera-sud')].forEach((o) => p.push(o.a, o.b)); p.push(W);
  out += catena(p, D + 120, 'x', null, false);
  // ovest
  p = [0]; pick('E-ovest').forEach((o) => p.push(o.a, o.b)); p.push(D);
  out += catena(p, -120, 'y', null, true);
  out += quota(-210, 0, -210, D, D, true);
  // est
  p = [0]; pick('E-est').forEach((o) => p.push(o.a, o.b)); p.push(D);
  out += catena(p, W + 120, 'y', null, false);
  return out;
}

// ---------- tabelle ----------
function tabelle(aper) {
  const righe = aper.elenco.map((o) => `<tr><td>${o.sigla}</td><td>${o.kind}</td>
    <td>${o.larghezza}</td><td>${o.altezza}</td><td>${o.davanzale || '-'}</td>
    <td>${esc(o.muro)}</td><td>${esc(o.stanza || (o.provenienza ? o.provenienza + ' / ' + o.verso : o.verso) || '')}</td></tr>`).join('');
  const stanzeR = Object.keys(plan.stanze).map((k) => {
    const s = plan.stanze[k];
    const rs = s.rettangoli || [s.rect];
    const area = rs.reduce((a, r) => a + r.w * r.d, 0) / 1e4;
    const big = rs.reduce((a, b) => (a.w * a.d > b.w * b.d ? a : b));
    return `<tr><td>${esc(s.nome)}</td><td>${big.w} x ${big.d}</td><td>${area.toFixed(2)}</td><td>${s.superficie_quotata_mq ?? '-'}</td></tr>`;
  }).join('');
  const T = plan.esterni.terrazzo_nord;
  return `
  <h3>Abaco delle aperture</h3>
  <div class="pg-tab"><table><thead><tr><th>Sigla</th><th>Tipo</th><th>Luce (cm)</th><th>Altezza (cm)</th><th>Davanzale (cm)</th><th>Muro</th><th>Riferimento</th></tr></thead><tbody>${righe}</tbody></table></div>
  <h3>Superfici</h3>
  <div class="pg-tab"><table><thead><tr><th>Ambiente</th><th>Interno (cm)</th><th>Calcolata (mq)</th><th>Quotata (mq)</th></tr></thead><tbody>${stanzeR}
    <tr><td>Terrazzo nord</td><td>${T.quote_piantina.larghezza_tratto_sud} x ${T.quote_piantina.tratto_sud} + ${T.quote_piantina.larghezza_tratto_nord} x ${T.quote_piantina.tratto_nord}</td><td>${T.superficie_calcolata_mq}</td><td>${T.quota_piantina_mq}</td></tr>
  </tbody></table></div>
  <h3>Spessori e altezze</h3>
  <div class="pg-tab"><table><tbody>
    <tr><td>Muri esterni</td><td>${SP_EST} cm</td></tr>
    <tr><td>Muri interni</td><td>${SP_INT} cm</td></tr>
    <tr><td>Altezza interna</td><td>${A.soffitto_cm} cm${A.soffitto_assunto ? ' (assunta)' : ''}</td></tr>
    <tr><td>Porte interne</td><td>h ${A.porta_interna_h_cm} cm (assunta)</td></tr>
    <tr><td>Portefinestre</td><td>h ${A.portafinestra_h_cm} cm (assunta)</td></tr>
    <tr><td>Muro del terrazzo</td><td>${T.recinzione.spessore_cm} cm, h ${T.recinzione.altezza_cm} cm (assunti)</td></tr>
  </tbody></table></div>`;
}

// ---------- assemblaggio ----------
export function creaPiantina() {
  const aper = aperture();
  const I = plan.muri.ingombro_esterno;
  const E = plan.esterni;
  const T = E.terrazzo_nord.interno_cm, spT = E.terrazzo_nord.recinzione.spessore_cm;
  const minX = Math.min(E.balcone_ovest.rect.x, T.x_ovest - spT) - 300;
  const maxX = Math.max(...E.balcone_sud_est.rettangoli.map((r) => r.x + r.w), I.larghezza_cm) + 300;
  const minY = T.z_nord - spT - 300;
  const maxY = Math.max(...E.balcone_sud_est.rettangoli.map((r) => r.y + r.d),
    E.pianerottolo_esterno.scala_esterna_rampa1.rect.y + E.pianerottolo_esterno.scala_esterna_rampa1.rect.d) + 300;

  const svg = `<svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#fff"/>
    ${esterni()}
    ${stanze()}
    ${muri(aper)}
    ${simboli(aper)}
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
    ${txt((minX + maxX) / 2, maxY - 110, 'PIANO PRIMO', 'titolo', 'text-anchor="middle"')}
    ${txt((minX + maxX) / 2, maxY - 55, 'misure in centimetri', 'mis', 'text-anchor="middle"')}
  </svg>`;

  const el = document.createElement('div');
  el.id = 'piantina';
  el.innerHTML = `
    <div class="pg-barra">
      <strong>Piantina quotata</strong>
      <span class="pg-nota">Misure in cm ricavate dal rilievo della piantina. I valori marcati "assunto" non sono quotati sul disegno.</span>
      <button id="pg-stampa">Stampa</button>
      <button id="pg-chiudi">Torna al 3D</button>
    </div>
    <div class="pg-foglio">${svg}${tabelle(aper)}</div>`;
  return el;
}
