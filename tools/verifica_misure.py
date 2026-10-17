#!/usr/bin/env python3
"""Verifica delle misure del piano primo (src/data/planimetria.json).

Rasterizza la pianta al centimetro e controlla che:
- nessuna stanza si sovrapponga a un muro o a un'altra stanza;
- dentro il perimetro dell'appartamento ogni centimetro sia muro o stanza (niente buchi);
- ogni apertura stia nel suo muro, fra due ambienti;
- il varco della versione 2 apra davvero fra soggiorno e camera sud;
- le superfici scritte nel file siano quelle che risultano dalle misure.

Stampa le superfici (per stanza, calpestabile totale, lorda) e le confronta con quelle scritte
sul disegno originale. Esce con codice 1 se trova un errore.

Uso: python3 tools/verifica_misure.py
"""
import json
import sys
from pathlib import Path

import numpy as np

P = json.loads((Path(__file__).resolve().parent.parent / 'src/data/planimetria.json').read_text())
errori = []


def rett(r):
    return r['x'], r['y'], r['x'] + r['w'], r['y'] + r['d']


# ---------- griglia al centimetro ----------
O = 20  # margine: la griglia parte da -20 cm
I = P['muri']['ingombro_esterno']
W, D = I['larghezza_cm'], I['profondita_cm']
muri = np.zeros((D + 2 * O, W + 2 * O), dtype=np.int16)
stanze = np.zeros_like(muri)
quale = np.full(muri.shape, '', dtype=object)


def segna(g, r, v=1):
    x0, y0, x1, y1 = rett(r)
    g[y0 + O:y1 + O, x0 + O:x1 + O] += v


for s in P['muri']['segmenti']:
    segna(muri, s['rect'])
for k, s in P['stanze'].items():
    for r in s.get('rettangoli') or [s['rect']]:
        segna(stanze, r)
        x0, y0, x1, y1 = rett(r)
        quale[y0 + O:y1 + O, x0 + O:x1 + O] = k

# perimetro: corpo ovest fino al muro sud del soggiorno, corpo est fino al muro sud della camera
fuori = np.ones_like(muri, dtype=bool)
sud_ovest = P['muri']['segmenti'][[s['id'] for s in P['muri']['segmenti']].index('E-sud-soggiorno')]['rect']
x_corpo_est = P['muri']['segmenti'][[s['id'] for s in P['muri']['segmenti']].index('E-vano-scala-est')]['rect']['x']
fuori[O:sud_ovest['y'] + sud_ovest['d'] + O, O:W + O] = False
fuori[O:D + O, x_corpo_est + O:W + O] = False
dentro = ~fuori

sovr = (muri > 0) & (stanze > 0)
if sovr.any():
    ys, xs = np.nonzero(sovr)
    for k in sorted(set(quale[sovr])):
        m = sovr & (quale == k)
        ys, xs = np.nonzero(m)
        errori.append(f'{k}: {m.sum()} cmq sovrapposti a un muro (x {xs.min() - O}-{xs.max() - O + 1}, y {ys.min() - O}-{ys.max() - O + 1})')
if (stanze > 1).any():
    errori.append(f'stanze sovrapposte fra loro: {(stanze > 1).sum()} cmq')
buchi = dentro & (muri == 0) & (stanze == 0)
if buchi.any():
    ys, xs = np.nonzero(buchi)
    errori.append(f'{buchi.sum()} cmq dentro il perimetro che non sono ne\' muro ne\' stanza (x {xs.min() - O}-{xs.max() - O + 1}, y {ys.min() - O}-{ys.max() - O + 1})')
note = []
if ((muri > 0) & fuori).any():
    ys, xs = np.nonzero((muri > 0) & fuori)
    note.append(f'muro fuori dall\'appartamento (x {xs.min() - O}-{xs.max() - O + 1}, y {ys.min() - O}-{ys.max() - O + 1}): '
                'e\' il muro ovest che chiude il pianerottolo d\'ingresso, escluso dalla superficie lorda')

# ---------- superfici scritte nel file ----------
area = {}
for k, s in P['stanze'].items():
    rs = s.get('rettangoli') or [s['rect']]
    a = sum(r['w'] * r['d'] for r in rs) / 1e4
    area[k] = a
    if abs(round(a, 2) - s['superficie_calcolata_mq']) > 0.005:
        errori.append(f'{k}: superficie scritta {s["superficie_calcolata_mq"]}, dalle misure {a:.2f}')
    if 'rect' in s and (s.get('larghezza_cm'), s.get('profondita_cm')) != (s['rect']['w'], s['rect']['d']):
        errori.append(f'{k}: larghezza/profondita scritte diverse dal rettangolo')
calpestabile = (stanze > 0).sum() / 1e4
lorda = dentro.sum() / 1e4
muri_mq = (dentro & (muri > 0)).sum() / 1e4


# ---------- aperture ----------
def ambiente(x, y):
    """stanza o esterno nel punto (cm)"""
    if 0 <= y + O < quale.shape[0] and 0 <= x + O < quale.shape[1] and quale[y + O, x + O]:
        return quale[y + O, x + O]
    return 'esterno' if not (0 <= y + O < quale.shape[0] and 0 <= x + O < quale.shape[1]) or fuori[y + O, x + O] else '?'


segs = {s['id']: s['rect'] for s in P['muri']['segmenti']}


def controlla_apertura(o):
    r = segs[o['muro']]
    a, b = o.get('x_da', o.get('y_da')), o.get('x_a', o.get('y_a'))
    orizz = r['w'] >= r['d']
    lati = []
    for t in (0.25, 0.5, 0.75):
        u = round(a + (b - a) * t)
        if orizz:
            lati.append((ambiente(u, r['y'] - 2), ambiente(u, r['y'] + r['d'] + 1)))
        else:
            lati.append((ambiente(r['x'] - 2, u), ambiente(r['x'] + r['w'] + 1, u)))
    if '?' in {x for l in lati for x in l} or len(set(lati)) > 1:
        errori.append(f'{o["id"]}: non apre fra due ambienti netti {lati}')
    if 'luce_cm' in o and o['luce_cm'] != b - a:
        errori.append(f'{o["id"]}: luce {o["luce_cm"]} ma da-a fa {b - a}')
    if 'larghezza_cm' in o and o['larghezza_cm'] != b - a:
        errori.append(f'{o["id"]}: larghezza {o["larghezza_cm"]} ma da-a fa {b - a}')
    return lati[0]


print('APERTURE')
v2 = P['versioni']['v2']
for o in P['porte'] + P['finestre'] + v2['porte_nuove']:
    lati = controlla_apertura(o)
    a, b = o.get('x_da', o.get('y_da')), o.get('x_a', o.get('y_a'))
    print(f'  {o["id"]:22s} {o["muro"]:18s} {a:4d}-{b:4d}  luce {b - a:3d}  {lati[0]} | {lati[1]}')
for o in P.get('aperture_chiuse', []):
    lati = controlla_apertura(o)
    print(f'  {o["id"]:22s} tamponata, {o["y_da"]}-{o["y_a"]}')

# versione 2: il varco sostituisce la porta della camera sud, la porta telescopica lo copre
varco = v2['porte_nuove'][0]
tolta = next(p for p in P['porte'] if p['id'] in v2['porte_tolte'])
pt = v2['porta_telescopica']
if (pt['y_da'], pt['y_a']) != (varco['y_da'], varco['y_a']):
    errori.append('porta telescopica e varco non coincidono')
if not (varco['y_da'] <= tolta['y_da'] and tolta['y_a'] <= varco['y_a'] + 1):
    errori.append('il varco non comprende la porta che sostituisce')
anta = (varco['luce_cm'] + (pt['ante'] - 1) * 4) / pt['ante'] + 1
if abs(anta - pt['anta_cm']) > 1:
    errori.append(f'anta della porta telescopica: {anta:.1f} cm, scritto {pt["anta_cm"]}')
cam = P['stanze']['camera_sud']['rect']
if pt['pacco_aperto_y_a'] > cam['y'] + cam['d']:
    errori.append('il pacco delle ante aperte esce dalla camera')
print(f'  varco V2: {varco["y_da"]}-{varco["y_a"]} (luce {varco["luce_cm"]}, h {varco["h_cm"]}); '
      f'sostituisce {tolta["id"]} {tolta["y_da"]}-{tolta["y_a"]}; stipite nord a {varco["y_da"] - cam["y"]} cm dal muro della camera, '
      f'stipite sud a {P["muri"]["segmenti"][3]["rect"]["y"] - varco["y_a"]} cm dal muro sud del soggiorno')
print(f'  porta telescopica: {pt["ante"]} ante da {anta:.1f} cm, pacco aperto {pt["pacco_aperto_y_da"]}-{pt["pacco_aperto_y_a"]} '
      f'(la camera arriva a {cam["y"] + cam["d"]})')

# ---------- superfici ----------
print('\nSUPERFICI (mq)              dalle misure   sul disegno   differenza')
quot_tot = 0
for k, s in P['stanze'].items():
    q = s.get('superficie_quotata_mq')
    d = f'{area[k] - q:+.2f} ({(area[k] - q) / q * 100:+.1f}%)' if q else '-'
    quot_tot += q or area[k]
    print(f'  {s["nome"][:26]:26s} {area[k]:8.2f}   {q if q else "-":>11}   {d}')
somma_righe = sum(round(a, 2) for a in area.values())
print(f'  {"somma delle righe":26s} {somma_righe:8.2f}   (totale scritto in piantina: somma dei valori arrotondati)')
print(f'  {"calpestabile esatta":26s} {calpestabile:8.3f}   {quot_tot:11.2f}   {calpestabile - quot_tot:+.2f}  (disimpegno non quotato: contato con la misura)')
print(f'  muri interni ed esterni    {muri_mq:8.2f}')
print(f'  superficie lorda           {lorda:8.2f}   (al filo esterno dei muri)')
print(f'  versione 2, open space soggiorno + camera sud + soglia del varco: '
      f'{area["soggiorno"] + area["camera_sud"] + varco["luce_cm"] * segs["I-spina-camere"]["w"] / 1e4:.2f}')
if abs(round(lorda, 2) - I['superficie_lorda_mq']) > 0.005:
    errori.append(f'superficie lorda scritta {I["superficie_lorda_mq"]}, dalle misure {lorda:.2f}')
if abs(calpestabile + muri_mq - lorda) > 0.001:
    errori.append('calpestabile + muri diverso dalla lorda')

E = P['esterni']
T = E['terrazzo_nord']['quote_piantina']
t_mq = (T['larghezza_tratto_sud'] * T['tratto_sud'] + T['larghezza_tratto_nord'] * T['tratto_nord']) / 1e4
bo = E['balcone_ovest']['rect']
bse = sum(r['w'] * r['d'] for r in E['balcone_sud_est']['rettangoli']) / 1e4
print(f'  terrazzo nord              {t_mq:8.2f}   {E["terrazzo_nord"]["quota_piantina_mq"]:11}')
print(f'  balcone ovest              {bo["w"] * bo["d"] / 1e4:8.2f}   {E["balcone_ovest"]["quota_piantina_mq"]:11}')
print(f'  balcone sud-est            {bse:8.2f}   {E["balcone_sud_est"]["quota_piantina_mq"]:11}')
for k, v in (('terrazzo_nord', t_mq), ('balcone_ovest', bo['w'] * bo['d'] / 1e4), ('balcone_sud_est', bse)):
    if abs(round(v, 2) - E[k]['superficie_calcolata_mq']) > 0.005:
        errori.append(f'{k}: superficie scritta {E[k]["superficie_calcolata_mq"]}, dalle misure {v:.2f}')

for n in note:
    print('\nnota: ' + n)
print('\n' + ('TUTTO TORNA' if not errori else 'ERRORI:\n  ' + '\n  '.join(errori)))
sys.exit(1 if errori else 0)
