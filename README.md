# Casa mia in 3D — piano primo e piano terra

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
- **Pannello laterale**: piano primo o piano terra, tavolo chiuso o aperto per il piano primo, orbita o prima persona, toggle tetto/soffitti, toggle pareti intere
  (pareti a 45 cm per la vista dall'alto), toggle luce del giorno / luce della sera, piantina
  quotata. La prima persona parte dal soggiorno del piano in vista.

## Piano terra (casa della cognata)

Il selettore **Piano** in cima al pannello passa dal piano primo al piano terra. Il piano terra e'
lo stesso edificio, un interpiano (340 cm) piu' sotto: la piantina riporta 1053 x 1105 contro i
1051 x 1097 del piano primo, quindi le facce esterne sono allineate a quelle di sopra e la
facciata resta continua. Al posto del volume pieno che c'era prima ora ci sono muri, finestre,
portoncino e stanze vere.

- Misure in `src/data/piano-terra.json`, ricavate dalle quote scritte (la foto e' in prospettiva,
  la scala varia da 1,64 a 2,26 cm/px). Le superfici tornano con le quote: camera 10,99 =
  395 x 250 + nicchia d'ingresso 100 x 111; camera 10,48 = 395 x 296 meno la rientranza.
- Aggiunta su richiesta: finestra 150 x 150 sulla parete est del soggiorno, sopra il divano.
- Assunti: altezza interna 300 cm (interpiano 340 meno solaio 40), davanzali a 90, porte interne
  80 x 210, porte scorrevoli a scomparsa per ripostiglio e disimpegno, doccia 80 x 80 nel
  rettangolo disegnato nell'angolo del bagno, armadio a muro nel rettangolo 60 x 109.
- In vista del piano terra il piano primo sparisce (restano scala, pianerottolo, balconi e
  terrazzo), "Tetto e soffitti" mette o toglie il solaio, la prima persona cammina a quota -3,40,
  la piantina quotata disegna il piano terra.

| Ambiente | Dettaglio di carattere |
|---|---|
| Cucina-pranzo | camino in pietra con cappa in piastrelle smaltate verde bottiglia, brace accesa di sera |
| Soggiorno | parete est in blu petrolio, con la finestra nuova sopra il divano |
| Camera 16,00 | testiera in velluto ruggine |
| Camera 10,99 | carta da parati a righe salvia sulla parete del letto |
| Camera 10,48 | armadio a tre moduli laccato blu polvere |
| Bagno | rivestimento a 120 cm in piastrelle verdi, a tutta altezza nella doccia |

## Tetto e giardino

**Tetto a capanna** sopra il piano primo: colmo est-ovest a meta' profondita', pendenza 32%,
falde in coppi con sporto di 45 cm e travetti in legno a vista, timpani intonacati sulle
facciate est e ovest, grondaie e pluviali in rame, comignolo sopra il camino del piano terra.
La falda sud copre anche il pianerottolo d'ingresso, che diventa una loggia con trave in legno.
Il foro della scala a chiocciola porta al sottotetto. "Tetto e soffitti" lo mostra o lo toglie.

**Giardino** (lotto 17,50 x 38,50 m, recintato):
- davanti (sud): muretto intonacato con cancellata in ferro, cancelletto con pilastri e lanterne,
  vialetto in lastre verso i due ingressi e la scala, patio con tavolino davanti alla portafinestra
  del piano terra, aiuole fiorite lungo il muretto, lavanda, un olivo e un albero da ombra;
- lati: sentieri in ghiaia, cipressi a ovest, arancio, melo e aiuola lungo la casa a est;
- dietro (nord), piu' profondo: prato fra il terrazzo e l'orto, limone, fico, panchina, e l'orto
  in ghiaia con sei cassoni rialzati 1,20 x 3,40 (pomodori, insalata, zucchine, cavoli,
  fagiolini, erbe e fragole) e la casetta degli attrezzi con la botte per l'acqua piovana;
- staccionata in castagno a doghe sui lati e dietro.

Le luci del giardino restano accese di sera qualunque piano sia in vista; recinzioni, alberi,
cassoni e casetta sono ostacoli per la prima persona.

## Zona pranzo e cucina del piano primo

Niente isola: il tavolo da pranzo sta in verticale (lato lungo nord-sud), spostato verso est
per lasciare un corridoio di circa 1 m davanti alla cucina, e da aperto entra nella zona
cucina. Il selettore "Tavolo" lo mostra chiuso (140 x 100, quattro posti) o aperto
(220 x 100, otto posti, con le linee delle prolunghe sul piano); i due pendenti restano fissi.
Sulla parete est, accanto alle colonne dispensa, un piano di appoggio da 130 cm con
planetaria, macchina del caffe' e microonde, maiolica alle spalle e mensola in noce.

I due stati del tavolo sono gruppi marcati ('chiuso', 'aperto'): si accende solo quello
scelto, e i suoi ingombri contano per la prima persona solo quando e' acceso.

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
src/arredi/index.js          registro delle stanze e del tavolo chiuso/aperto
piantina-terra.jpg           piantina del piano terra
src/data/piano-terra.json    misure del piano terra in cm
src/pianoTerra.js            involucro del piano terra, solaio, lanterna d'ingresso
src/arredi/piano_terra.js    arredi del piano terra (camino, panca, letti singoli, doccia...)
src/arredi/giardino.js       giardino, recinzioni e orto
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

Le finestre di entrambi i piani hanno scuri esterni in legno verniciato verde salvia chiaro.

## Il dettaglio di carattere di ogni stanza

- **Cucina**: maioliche blu cobalto/bianco dipinte (pattern generato) dietro il piano cottura, sotto
  la cappa in muratura, e dietro il piano di appoggio sulla parete est.
- **Soggiorno**: parete sud in verde salvia profondo con boiserie a riquadri.
- **Bagno**: cementine a terra con motivo a stella terracotta, salvia, nero e crema.
- **Camera nord** (matrimoniale principale): testiera imbottita in velluto senape a tutta parete.
- **Camera sud** (seconda matrimoniale): carta da parati botanica verde bottiglia.
- **Camera est** (studio e lavanderia): parete in terracotta bruciata con lavanderia in noce.
- **Disimpegno**: soffitto in verde salvia.

## Prestazioni

Le mesh statiche vengono fuse per materiale dopo la costruzione; quelle con un materiale per
faccia (muri esterni, solette, falde del tetto) vengono prima divise per gruppo di facce, cosi'
si fondono anche loro: la vista esterna completa (due piani, tetto e giardino) passa da circa
2000 a circa 950 draw call, ombre incluse, e circa 370k triangoli. Le ombre sono proiettate solo dal sole; le luci artificiali sono luci
puntiformi senza ombre, attive nella modalità sera. Pixel ratio limitato a 1,5.
