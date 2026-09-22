# Casa mia — piano primo in 3D

Modello 3D navigabile nel browser dell'appartamento al piano primo descritto in `piantina.png`,
completo di arredamento. Tutto è procedurale: nessun asset 3D esterno, texture generate via canvas.

Stile: **antico in chiave moderna** — volumi puliti, materiali d'epoca (noce, ottone brunito,
ceramica smaltata, pietra, ferro battuto sottile, cotto, boiserie). Finiture opache.

## Avvio

```bash
npm install
npm run dev        # apre http://localhost:5173
npm run build      # produzione in dist/
npm run preview    # anteprima della build
```

Requisiti: Node 18+ e un browser con WebGL 2.

## Comandi

- **Orbita** (default): trascina per ruotare, rotella per zoom, tasto destro per traslare.
- **Prima persona**: clic sulla scena per catturare il mouse; `W A S D` o frecce per muoversi,
  `Shift` per correre, `Esc` per uscire. Altezza occhio 165 cm, collisioni con muri, ringhiere e arredi.
- **Pannello laterale**: scelta della versione (V1/V2), salto rapido a ogni stanza,
  toggle tetto/soffitti, toggle pareti intere (pareti a 45 cm per la vista dall'alto),
  toggle luce del giorno / luce della sera, piantina quotata.

## Le due versioni

Il modello e' uno solo: cambia l'arredo della zona giorno, con il selettore in cima al pannello.

| | V1 · originale | V2 · quinta TV |
|---|---|---|
| Isola | 2,10 m, tre sgabelli | 1,30 m, due sgabelli |
| Tavolo | 2,20 x 1,00 m, sei posti comodi | 2,40 x 1,10 m, otto posti, piu' centrale |
| TV | mobiletto in noce e rete d'ottone, una TV verso il divano | quinta in cartongesso alta 1,70 m con una nicchia per lato: una TV verso il divano e una verso il tavolo e la cucina |
| Passaggio isola-tavolo | 75 cm | 130 cm |

La quinta della V2 e' un setto autoportante da 20 cm: corpo intonacato, nicchie con fondo in
salvia e TV incassata a filo, mensola in noce su reggimensola in ottone, zoccolo in noce e
copertina in pietra. Resta alta 1,70 m per non chiudere la vista fra cucina e soggiorno.

Le due versioni convivono in scena in due gruppi distinti: si accende solo quella scelta, e
ingombri per le collisioni e punti luce sono marchiati con la versione, cosi' la V2 non lascia
muri invisibili quando si guarda la V1 (e viceversa).

## Struttura

```
piantina.png                 riferimento
piantina-terrazzo.jpg        piantina aggiornata, con il terrazzo nord
src/data/planimetria.json    misure in cm (rilevate dalla piantina, scala 0,5922 cm/px)
src/data/stile.js            palette, texture procedurali, materiali condivisi
src/architettura.js          muri con aperture, pavimenti, soffitti, porte, finestre con scuri,
                             battiscopa, travi, balconi, pianerottolo e scala esterna
src/arredi/comune.js         helper geometrici e oggetti ricorrenti (lampade, tende, quadri…)
src/arredi/<stanza>.js       una funzione per mobile, ognuna ritorna un THREE.Group
src/arredi/index.js          registro delle stanze e delle due versioni (V1 / V2)
src/main.js                  scena, luci, controlli, pannello, ottimizzazione
```

## Misure

Le misure sono in `src/data/planimetria.json`. I muri sono stati rilevati sui pixel della piantina
e la scala calibrata ai minimi quadrati sulle superfici quotate (soggiorno calcolato 43,9 mq
contro "circa 44"). Altezza soffitto **270 cm (assunta)**, muri esterni 25 cm, interni 15 cm.

| Stanza | Interno (cm) | Calcolata | Quotata |
|---|---|---|---|
| Soggiorno pranzo-cucina (a L) | 391 × 912 + appendici | 43,9 mq | ~44 |
| Bagno | 168 × 256 | 4,30 | 4,56 |
| Disimpegno | 132 × 224 | 2,96 | — |
| Camera nord-est | 412 × 378 | 15,57 | 15,43 |
| Camera est | 412 × 229 | 9,43 | 9,74 |
| Camera sud-est | 412 × 412 | 16,97 | 16,52 |
| Terrazzo nord (con risega) | 634×684 + 594×384 | 66,18 | 67,12 |

## Il dettaglio di carattere di ogni stanza

- **Cucina**: maioliche blu cobalto/bianco dipinte (pattern generato) dietro il piano cottura, sotto
  la cappa in muratura, e sul frontale e le testate dell'isola con top in pietra a spessore.
- **Soggiorno**: parete sud in verde salvia profondo con boiserie a riquadri.
- **Bagno**: cementine a terra con motivo a stella terracotta, salvia, nero e crema.
- **Camera nord** (matrimoniale principale): testiera imbottita in velluto senape a tutta parete.
- **Camera sud** (seconda matrimoniale): carta da parati botanica verde bottiglia.
- **Camera est** (studio e lavanderia): parete in terracotta bruciata con lavanderia in noce.
- **Disimpegno**: soffitto in verde salvia.

## Prestazioni

Le mesh statiche vengono fuse per materiale dopo la costruzione (circa 750 draw call incluse le
ombre, 100k triangoli). Le ombre sono proiettate solo dal sole; le luci artificiali sono luci
puntiformi senza ombre, attive nella modalità sera. Pixel ratio limitato a 1,5.
