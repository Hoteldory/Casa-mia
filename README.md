# Casa mia in 3D — piano primo, piano terra e casa dei suoceri

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
- In vista del piano terra il piano primo sparisce (restano scala, pianerottolo e balconi; il
  terrazzo, che e' il tetto dei suoceri, solo con il tetto acceso), "Tetto e soffitti" mette o toglie il solaio, la prima persona cammina a quota -3,40,
  la piantina quotata disegna il piano terra.

| Ambiente | Dettaglio di carattere |
|---|---|
| Cucina-pranzo | camino in pietra con cappa in piastrelle smaltate verde bottiglia, brace accesa di sera |
| Soggiorno | parete est in blu petrolio, con la finestra nuova sopra il divano |
| Camera 16,00 | testiera in velluto ruggine |
| Camera 10,99 | carta da parati a righe salvia sulla parete del letto |
| Camera 10,48 | armadio a tre moduli laccato blu polvere |
| Bagno | rivestimento a 120 cm in piastrelle verdi, a tutta altezza nella doccia |

Due passaggi nel muro nord portano nell'edificio dei suoceri: dal ripostiglio alla loro
lavanderia e dalla camera 16,00 al secondo bagno (5,31), che e' della cognata.

## Piano terra (casa dei suoceri)

Subito a nord della casa della cognata, sotto il terrazzo del piano primo: stesso piano,
stessa quota. Misure in `src/data/piano-suoceri.json` (riferimento proprio con origine
nell'angolo nord-ovest, messo nella casa a x 70, z -1178), ricavate dalle quote scritte in
`piantina-suoceri.jpg`: le catene tornano da sole (349 + 180 + 339 + 200 a ovest e
374 + 344 + 150 + 200 a est fanno entrambe 1098 con tramezzi da 10; 390 + 364 e 489 + 265
fanno 764 = 854 - 2 x 45).

**Il tetto dei suoceri e' il nostro terrazzo, e coincide.** Il terrazzo ha muretto da 40 cm
e, oltre il muretto, falde in coppi da 70 cm su ovest, nord ed est:
594 + 2 x (40 + 70) = 814 (tratto nord), 634 + 2 x 110 = 854 (tratto sud),
1068 + 40 + 70 = 1178 in profondita', e il gradino sul lato est cade a 384 dal fronte nord
come la risega del terrazzo. Il solaio del terrazzo poggia sulla testa dei muri dei suoceri
(310 cm), le falde arrivano a filo dei loro muri esterni con grondaie e pluviali in rame.
In vista del piano terra il terrazzo c'e' solo con "Tetto e soffitti" acceso.

- Soggiorno con cucina-pranzo 25,98, bagno 5,04, disimpegno, camera 13,22, camera 12,47 con
  cabina armadio 5,47, lavanderia e C.T. 9,74 con porta di servizio sul giardino; il bagno
  5,31 in basso a destra e' della cognata (ci si entra solo dalla sua camera 16,00).
- Assunti: altezza interna 300, davanzali a 90, porte interne 80 x 210, scorrevoli a scomparsa
  per disimpegno, cabina e passaggio camera-lavanderia (vano senza anta in piantina).
- La piantina quotata del piano terra ha due fogli: cognata e suoceri.

| Ambiente | Dettaglio di carattere |
|---|---|
| Soggiorno | parete nord in terracotta dietro al divano, sotto la finestra |
| Cucina ad L | ante crema, paraspruzzi in piastrelle smaltate ocra, cappa in muratura |
| Bagno 5,04 | cementine a terra, rivestimento a 120 cm in piastrelle crema |
| Camera 13,22 | parete del letto in blu polvere |
| Camera 12,47 | testiera in velluto salvia, poltrona in velluto senape |
| Lavanderia | lavatoio in pietra, colonna lavatrice, caldaia murale |
| Bagno 5,31 | piastrelle verde bottiglia come il bagno della cognata |

## Tetto e giardino

**Tetto a capanna** sopra il piano primo: colmo est-ovest a meta' profondita', pendenza 32%,
falde in coppi con sporto di 45 cm e travetti in legno a vista, timpani intonacati sulle
facciate est e ovest, grondaie e pluviali in rame, comignolo sopra il camino del piano terra.
La falda sud copre anche il pianerottolo d'ingresso, che diventa una loggia con trave in legno.
Il foro della scala a chiocciola porta al sottotetto. "Tetto e soffitti" lo mostra o lo toglie.

**Giardino** (lotto 17,50 x 41,00 m, recintato):
- davanti (sud): muretto intonacato con cancellata in ferro, cancelletto con pilastri e lanterne,
  vialetto in lastre verso i due ingressi e la scala, patio con tavolino davanti alla portafinestra
  del piano terra, aiuole fiorite lungo il muretto, lavanda, un olivo e un albero da ombra;
- due posti auto in lastre (2,90 x 5,10) ai capi del fronte, contro le recinzioni laterali:
  a ovest quello del piano primo, accanto al piede della scala esterna; a est quello del piano
  terra. Ognuno ha il suo cancello carrabile scorrevole in ferro: varco 300 cm, anta 330,
  pilastro di battuta da 40 cm verso il confine e pilastro di guida verso il centro, con motore,
  lampeggiante e binario. L'anta si apre verso il centro del fronte, dietro la recinzione, che
  deve restare dritta per anta + 20 cm di fine corsa = 350 cm: a ovest fino al cancelletto ce ne
  sono 420, a est 450. Aprendo verso il centro, dalla parte del confine basta il pilastro;
- lati: sentieri in ghiaia, cipressi a ovest, arancio, melo e aiuola lungo la casa a est;
- attorno alla casa dei suoceri: lastre davanti all'ingresso e alla porta della lavanderia,
  patio con tavolino davanti alla portafinestra della camera a est;
- dietro (nord), piu' profondo: prato fra la casa dei suoceri e l'orto, limone, fico, panchina, e l'orto
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
src/pianoTerra.js            involucro del piano terra (cognata e suoceri), solaio, lanterne
src/arredi/piano_terra.js    arredi del piano terra (camino, panca, letti singoli, doccia...)
piantina-suoceri.jpg         piantina della casa dei suoceri
src/data/piano-suoceri.json  misure della casa dei suoceri in cm
src/arredi/suoceri.js        arredi della casa dei suoceri
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

## Resa: luce, materiali, spigoli

- **Riflessi**: uno studio luminoso (RoomEnvironment) fa da ambiente riflesso. I materiali lucidi
  o metallici (ottone, ferro, vetri, ceramiche, smalti, pietra lucida, carrozzerie) lo riflettono
  pieno; su intonaci, legni e tessuti arriva appena, per non sbiancarli. Di sera si abbassa.
- **Rilievo**: ogni texture fa anche da mappa di rilievo (bump map) calcolata dalla scheda
  grafica: fughe del cotto e delle piastrelle, venature, coppi, trama di lino e velluto,
  grana degli intonaci. Le piastrelle smaltate con fuga chiara hanno il rilievo invertito.
- **Ombre di contatto** (GTAO): angoli, piedi dei mobili, sotto mensole e pensili.
- **Ombre del sole** con i bordi morbidi.
- **Di sera** un bagliore leggero (bloom) solo su lampadine, brace e lanterne.
- **Spigoli arrotondati** (raggio 1,2 cm) su arredi, porte, finestre, scuri e giardino; i muri
  restano a spigolo vivo perche' si accostano fra loro.
- Pulsante **Qualità** nel pannello: "alta" con ombre di contatto e bagliore, "leggera" senza.
  Su telefono si parte leggeri e senza spigoli arrotondati.

## Prestazioni

Le mesh statiche vengono fuse per materiale dopo la costruzione; quelle con un materiale per
faccia (muri esterni, solette, falde del tetto) vengono prima divise per gruppo di facce, cosi'
si fondono anche loro: la vista esterna completa (due piani, tetto e giardino) passa da circa
2000 a circa 950 draw call, ombre incluse, e circa 370k triangoli. Le ombre sono proiettate solo dal sole; le luci artificiali sono luci
puntiformi senza ombre, attive nella modalità sera; di sera si accendono solo quelle del piano
in vista, e al piano terra (due appartamenti) quelle entro 2,4 m si fondono in una sola, cosi'
restano circa venti. Pixel ratio limitato a 1,5.
