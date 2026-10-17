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

- **Orbita**: trascina per ruotare, rotella per zoom, tasto destro per traslare (su telefono:
  un dito per ruotare, due dita per zoom e spostamento).
- **Pannello laterale**: piano primo o piano terra, versione 1 o 2 del soggiorno (cucina a nord
  o cucina a sud con l'isola), porta telescopica della camera sud, tavolo chiuso o aperto, toggle tetto/soffitti, toggle pareti intere
  (pareti a 45 cm per la vista dall'alto), toggle luce del giorno / luce della sera, qualità,
  piantina quotata, link alla vista.

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
  terrazzo, che e' il tetto dei suoceri, solo con il tetto acceso), "Tetto e soffitti" mette o toglie il solaio,
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

Le luci del giardino restano accese di sera qualunque piano sia in vista.

## Nuovo stile del piano primo: country chiaro (dalle foto di riferimento)

Dalle foto scelte: pareti chiare, travi e pavimenti in legno naturale, cucina a riquadri
colorata con piastrelle metro e mensole aperte, tavolo da fattoria con sedie Windsor, lino,
juta, tappeto persiano, ottone e vetro. Scelte confermate: cucina **azzurro polvere**,
pavimento in **rovere a listoni**, **ottone** protagonista.

Tappa 1 (fatta): base comune e zona giorno.
- Pavimento in rovere a listoni larghi (20 cm, fino a 2,40 m) in tutto il piano tranne il bagno;
  travi del soggiorno in rovere miele; porte interne bianco latte a riquadri.
- Cucina: ante a riquadro azzurro polvere con maniglie in ottone, piano in marmo bianco,
  piastrelle metro bianche, cappa intonacata con trave in rovere, mensole in rovere su staffe
  d'ottone, lavello in ceramica con rubinetto in ottone, due globi di vetro; colonne e piano
  d'appoggio azzurri, con top in rovere massello.
- Pranzo: tavolo da fattoria in rovere a tre assi con gambe tornite (sempre 4 o 8 posti),
  sedie Windsor nere e due in rovere a capotavola, lampadario a tamburo in lino e ottone,
  tappeto in juta.
- Salotto: boiserie bianco latte, divano profondo in lino avena con cuscini azzurri, a
  fiorellini e a righe, tappeto persiano panna e blu, mobile TV in rovere con top in marmo,
  stampe botaniche in cornici di rovere, tende in lino azzurro e a pacchetto in bambu'.
- Stufa a legna nell'appendice est del soggiorno, in tutte e due le versioni:
  - ghisa nera, alta 1,60 m, su lastra di ardesia, appoggiata alla parete est;
  - sopra la porta del fuoco con un vetro stretto e alto, sotto il vano per i ciocchi e il cassetto della cenere;
  - canna fumaria nera fino al soffitto, cesta di ciocchi accanto;
  - di sera il fuoco si accende e scalda la stanza di arancio.
  Dove c'era la libreria c'è uno specchio lungo con cornice in ottone; poltrona, tavolino e
  lampada da terra sono stati tolti.

Tappa 2 (fatta): il resto del piano.
- Camera matrimoniale: rifatta dalla foto di riferimento (vedi sotto, "Camera matrimoniale blu avio").
- Camera sud: era la seconda camera da letto; ora e' l'open space gaming e allenamento (vedi sotto).
- Camera est (studio e lavanderia): parete azzurro polvere con perlinato bianco latte, colonna
  lavanderia salvia con ceste, scrittoio in rovere con sedia Windsor.
- Bagno: rifatto dalle due foto di riferimento (vedi sotto, "Bagno con doccia blu").
- Disimpegno: perlinato a mezza parete, passatoia persiana, lanterna in ottone e vetro.
- Terrazzo: tavolo da fattoria con sedie Windsor sotto il gazebo, festoni di lampadine,
  lanterne a pavimento, ulivi in vasi di cotto.
- Telai delle porte in rovere miele.

## Camera matrimoniale blu avio (dalla foto di riferimento)

La camera nord-est del piano primo segue una foto scelta: pareti blu, velluto verde oliva,
noce anni '60 e ottone.

- Pareti in **blu avio** su tutti e quattro i lati, cornice modanata a soffitto dello stesso blu,
  soffitto bianco. L'armadio a muro sulla parete nord è verniciato blu come le pareti, con
  maniglie in ottone.
- **Tende in velluto oliva** a tutta altezza, su bastone d'ottone, alla portafinestra e alla
  finestra est.
- **Letto in noce** con testiera a pannello e gambe affusolate, piumone bianco, plaid in maglia
  panna, cuscini azzurri e oliva in velluto.
- Due **comodini in noce** con cassetto e vano a giorno. A est: lampada in ceramica bianca e
  applique a braccio in ottone. A ovest: lampada d'ottone, una piantina, libri nel vano.
- **Parete di quadri** sopra il letto: una stampa astratta in cornice d'ottone al centro e cinque
  stampe botaniche in cornici di rovere.
- **Lampadario sputnik** in ottone sopra il letto.
- Parete ovest: **cassettiera in noce** a sei cassetti con **specchio tondo** in ottone, vaso
  oliva con eucalipto, libri e candela.
- Angolo lettura vicino alla portafinestra: **poltrona in velluto oliva** e tavolino in ottone
  su tre gambe.
- **Tappeto persiano sbiadito**, azzurro e panna, sotto il letto.
- Rispetto a prima: niente parete a doghe, niente panca ai piedi del letto, e l'armadio in
  rovere della parete ovest lascia il posto alla cassettiera.

## Bagno con doccia blu (dalle due foto di riferimento)

Il bagno del piano primo segue due foto: perlinato panna, doccia in piastrelle blu lucide,
ottone, rovere e un tocco di salvia.

- **Perlinato bianco latte a tutta altezza** sulle pareti, con la cimasa a fare da cornice.
- **Pavimento a ottagonette** bianche con tozzetti neri, anche dentro la doccia.
- **Soffitto a doghe di rovere** con tre travetti e due faretti incassati in ottone.
- **Doccia 80 x 110** nell'angolo sud-ovest, a filo pavimento:
  - piastrelle blu lucide 7,5 x 30 in verticale, fatte a mano, su tutte e due le pareti;
  - controparete sul fondo con la **nicchia illuminata** e i flaconi;
  - soffione a pioggia, miscelatore a incasso e doccetta col flessibile, tutto in ottone;
  - scarico a canalina, vetro fisso a nord e porta a battente a est, con profili, cerniere e
    maniglione in ottone.
- **Mobile lavabo in rovere** sulla parete ovest: cassetto con maniglia in ottone, due ripiani a
  giorno con spugne salvia e una cesta, piano in marmo, **lavabo d'appoggio smerlato** e
  rubinetto a muro in ottone con manopole a croce, flaconi in vetro ambrato.
- **Specchio laccato azzurro** con cornice a tubo e angoli arrotondati, **applique a collo di
  cigno** in ottone con paralume in rattan.
- **Vaso e bidet sospesi** su una controparete bassa sotto la finestra, rivestita a doghe con
  piano in marmo; placca di scarico e scopino in ottone, una piantina sul davanzale.
- Parete est: scaldasalviette in ottone con spugna azzurra, **sgabello in noce tornito**,
  stampa botanica. Tappeto da bagno blu davanti alla doccia.

## Camera sud: open space gaming e allenamento

La camera sud non e' piu' una camera da letto: si apre sul soggiorno con un varco, ha l'angolo
gaming e lo spazio per allenarsi, e una porta telescopica in legno la chiude quando serve. E'
cosi' in tutte e due le versioni del piano primo.

Il varco:

- È largo 2,40 m (da z 6,85 a 9,25) e alto 2,50 m.
- Sta nel muro di spina fra l'appendice est del soggiorno e la camera, al posto della porta.
  In `planimetria.json` le porte restano quelle del disegno originale; il varco e la porta
  telescopica stanno in `versioni.v2` (il progetto), da cui li prendono sia il modello 3D sia la
  piantina quotata.
- Ha telaio e soglia in rovere, perché il pavimento continua senza stacchi.
- **Il muro di spina potrebbe essere portante.** Prima di aprire va sentito un ingegnere: può
  servire una cerchiatura, con le relative pratiche.

La porta telescopica:

- Ha tre ante piene in legno tinto cognac, un colore caldo da porta modern farmhouse americana.
  Ogni anta ha telaio, traverso a metà e riempimento a doghe verticali; quella che apre ha un
  maniglione in ottone.
- Le ante corrono su tre binari nascosti in un cassonetto di rovere al soffitto, dal lato
  della camera.
- Aperta, le ante stanno impacchettate a sud del varco, davanti al muro del vano scala.
  Chiusa, coprono tutto il varco.
- Il pulsante "Chiudi/Apri la porta" le fa scorrere insieme.

Gli arredi:

- Angolo gaming:
  - parete est in azzurro polvere, che si vede dal soggiorno attraverso il varco;
  - scrivania in rovere da 160 cm, schermo da 48", PS5 in piedi e controller;
  - poltroncina in tessuto grafite su un tappeto in juta;
  - mensola con libri e una pianta, sospensione a globo.
- Allenamento a corpo libero:
  - pavimento in gomma 1,70 x 2,10 m con tappetino salvia e rullo;
  - spalliera in rovere con sbarra per le trazioni;
  - specchio alto con cornice in ottone sulla parete nord.
- Cyclette con telaio in rovere, volano nero e sella in cuoio, nell'angolo sud-est.
- Rastrelliera con tre coppie di manubri e tre kettlebell.
- Mobile basso bianco latte con asciugamani e corda.
- Lampadario a tamburo alto, tende in lino avena e tenda a pacchetto in bambù.

Nell'appendice del soggiorno la pianta grande sta dalla parte dell'ingresso, così il varco resta libero.

## Le due versioni del soggiorno

Nel menu, sezione "Versione", si sceglie come disporre cucina, tavolo e salotto. Il resto del
piano (camere, bagno, camera sud open space, stufa nell'appendice) e' uguale.

**Versione 1 · cucina a nord.** La cucina lineare sta sulla parete ovest, a nord, con il lavello
sotto la finestra; le colonne dispensa sono sul muro del bagno.
- Il tavolo da pranzo sta in verticale (lato lungo nord-sud), spostato verso est per lasciare un
  corridoio di circa 1 m davanti alla cucina, e da aperto entra nella zona cucina.
- Sulla parete est, accanto alle colonne dispensa, un piano di appoggio da 130 cm con
  planetaria, macchina del caffe' e microonde, maiolica alle spalle e mensola in noce.
- Il salotto e' a sud: divano sotto la finestra, mobile TV che fa da separazione con il pranzo,
  boiserie bianco latte sulla parete sud, consolle sulla parete ovest.

**Versione 2 · cucina a sud, con l'isola.** La cucina va sul muro sud, vicino all'ingresso, e il
salotto va a nord, verso il terrazzo.
- Cucina: piano di lavoro lungo il muro sud con il lavello sotto la finestra (si interrompe il
  paraspruzzi in piastrelle metro), piano cottura in fondo verso est con la cappa in muratura e
  la trave in rovere, colonne frigo e forno nell'angolo sud-ovest. Sul piano, macchina del caffe'
  e planetaria. Acqua, scarico e uscita della cappa sono da portare nuovi.
- Isola 200 x 100 parallela al piano di lavoro, a 1,10 m: ante azzurre con maniglie in ottone
  verso la cucina, riquadri verso il pranzo, piano in marmo che sporge 10 cm; due globi di vetro
  sopra.
- Tavolo al centro, lato lungo est-ovest: chiuso quattro posti, aperto otto (una sedia in rovere
  per testa). Il lampadario a tamburo e' appeso alla trave che gli passa sopra.
- Salotto a nord: divano contro la parete ovest rivolto a est, TV sul muro del bagno, tavolino
  ovale, tappeto persiano, lampada da terra e stampe botaniche sopra il divano. La portafinestra
  del terrazzo da' luce di lato, senza riflessi sullo schermo.
- La finestra della parete ovest, che in V1 sta sopra il lavello, qui ha il suo davanzale interno.
- Passaggi liberi: 1,10 m fra cucina e isola, circa 85 cm fra le sedie e l'isola, la zona davanti
  alla porta del disimpegno e le portafinestre del balcone e del terrazzo.

Il selettore "Tavolo" mostra il tavolo chiuso (140 x 100, quattro posti) o aperto (220 x 100, otto
posti, con le linee delle prolunghe sul piano) nella versione in vista.

Come funziona nel codice:

- Arredi e lampade di ogni versione sono gruppi marcati `v1` o `v2`; il tavolo e' marcato con
  stato e versione (`chiuso.v1`, `aperto.v2`...). Si accende solo quello scelto.
- I pezzi appesi ai muri (boiserie, quadri, tende) di ogni versione stanno in un gruppo che si
  accende con lei.
- La versione e lo stato della porta finiscono nel link alla vista (`versione=2&porta=chiusa`).

## Skill per Claude Code (Three.js)

In `.claude/skills/` ci sono 13 skill del [Three.js Claude Skill Package](https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package)
(licenza MIT, testo in ogni cartella): renderer, scene graph, matematica, prestazioni, errori di
resa, ombre, luci, post-processing, materiali, geometrie, loader, controlli e ottimizzazione dei
modelli glTF. Sono solo istruzioni in markdown, niente script. Le altre 11 del pacchetto (React
Three Fiber, Drei, fisica, WebXR, IFC, audio, WebGPU, animazioni, shader, raycaster, scene
builder) non servono a questo progetto e non sono installate.

Il pacchetto e' scritto per Three.js r160+; il progetto usa la r186. Nelle skill di renderer e
ombre c'e' una nota: `PCFSoftShadowMap` nella r186 non esiste piu', si usa `PCFShadowMap` (che
ora tiene conto di `shadow.radius`).

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
src/arredi/index.js          registro delle stanze, delle due versioni del soggiorno e del tavolo
src/arredi/camera_sud_v2.js  camera sud open space: angolo gaming e allenamento
src/arredi/porta_telescopica.js  porta telescopica a tre ante sul varco della camera sud
piantina-terra.jpg           piantina del piano terra
src/data/piano-terra.json    misure del piano terra in cm
src/pianoTerra.js            involucro del piano terra (cognata e suoceri), solaio, lanterne
src/arredi/piano_terra.js    arredi del piano terra (camino, panca, letti singoli, doccia...)
piantina-suoceri.jpg         piantina della casa dei suoceri
src/data/piano-suoceri.json  misure della casa dei suoceri in cm
src/arredi/suoceri.js        arredi della casa dei suoceri
src/arredi/giardino.js       giardino, recinzioni e orto
src/main.js                  scena, luci, controlli, pannello
src/ottimizza.js             materiali uniti, mesh fuse per materiale, sagome d'ombra
src/sole.js                  posizione del sole (luogo in src/data/luogo.json)
```

## Misure

Le misure sono in `src/data/planimetria.json`. I muri sono stati rilevati sui pixel della piantina
e la scala calibrata ai minimi quadrati sulle superfici quotate. Altezza soffitto **270 cm
(assunta)**, muri esterni 25 cm, interni 15 cm.

**Verifica** (`python3 tools/verifica_misure.py`): rasterizza la pianta al centimetro e controlla
che ogni stanza chiuda sui suoi muri, che non ci siano buchi o sovrapposizioni, che ogni apertura
stia nel suo muro fra due ambienti, il varco della camera sud e tutte le superfici.
- Muri e aperture coincidono con il disegno originale entro 3 cm.
- Il disegno originale e' schematico: le superfici scritte delle singole stanze non stanno tutte
  nella stessa scala (scarti da -5% a +3%), ma il totale torna (93,11 contro 93,21 mq). Le misure
  vanno confermate con il rilievo sul posto.

| Stanza | Interno (cm) | Calcolata (mq) | Sul disegno (mq) |
|---|---|---|---|
| Soggiorno pranzo-cucina (a L) | 391 × 912 + 36 × 640 + 147 × 401 | 43,86 | circa 44 |
| Bagno | 168 × 257 | 4,32 | 4,56 |
| Disimpegno | 132 × 224 | 2,96 | — |
| Camera nord-est | 412 × 379 | 15,61 | 15,43 |
| Camera est | 412 × 228 | 9,39 | 9,74 |
| Camera sud-est (open space) | 412 × 412 | 16,97 | 16,52 |
| **Calpestabile** | | **93,11** | 93,21 |
| Lorda, al filo esterno dei muri | 1051 × 965 + 467 × 132 | 107,59 | — |
| Open space (soggiorno + camera + soglia del varco) | | 61,19 | — |
| Terrazzo nord (con risega) | 634 × 684 + 594 × 384 | 66,18 | 67,12 |

### Piantina quotata per il geometra

La piantina quotata del piano primo disegna il progetto, con il varco e la porta telescopica: e'
la stessa per le due versioni del soggiorno, perche' non disegna gli arredi. E' anche in
`piantina-quotata-progetto.pdf` (A4, tre pagine; si rigenera stampando la piantina dal browser):
- **Pianta**: varco 240 x 250 con le sue quote, porta telescopica (ante aperte e chiuse, cassonetto)
  e la finestra tamponata a retino.
- **Bolli neri**: le aperture nuove, modificate o tamponate rispetto al disegno originale.
- **Modifiche rispetto al disegno originale**: prima e dopo, con la posizione.
- **Abaco delle aperture**: con stato, misure e posizione in cm dall'angolo esterno nord-ovest.
- **Superfici**: confrontate con quelle del disegno, con calpestabile, lorda e open space.
- **Impianti e sanitari da riportare** (bagno nuovo, attacco lavatrice) e l'avviso sul muro di
  spina, forse portante.

Le finestre di entrambi i piani hanno scuri esterni in legno verniciato verde salvia chiaro.

## Il dettaglio di carattere di ogni stanza

- **Cucina**: maioliche blu cobalto/bianco dipinte (pattern generato) dietro il piano cottura, sotto
  la cappa in muratura, e dietro il piano di appoggio sulla parete est.
- **Soggiorno**: parete sud in verde salvia profondo con boiserie a riquadri.
- **Bagno**: doccia in piastrelle blu lucide, pavimento a ottagonette bianche e nere.
- **Camera nord** (matrimoniale principale): pareti e cornice in blu avio, tende in velluto oliva.
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

## Materiali fotografici, compressi in KTX2

- **Texture fotografiche** da [Poly Haven](https://polyhaven.com) (licenza CC0, uso libero):
  - parquet in rovere, intonaci, pitture, legni dei mobili, lino, velluto e cuoio;
  - cotto, pietra, coppi, juta, ghiaia, prato e la terra dei vasi sul terrazzo.
  - Ogni materiale ha la sua normal map (il rilievo vero della foto) e, dove serve, la mappa di
    ruvidità.
- **I colori della casa non cambiano**: per la maggior parte dei materiali dalla foto si prende
  solo la trama (in grigio) e la tinta resta quella scelta. Coppi, juta, ghiaia e terra
  tengono i colori della foto.
- **In KTX2 (Basis Universal)**: sulla scheda grafica le texture restano compresse, nel formato
  che la scheda sa leggere (BC7 sui computer, ASTC o ETC sui telefoni), con le mipmap già fatte.
  - In memoria video passano da circa 127 MB (webp scompattati) a circa 32 MB, 16 sui telefoni.
  - Da scaricare sono 4,4 MB contro i 5,3 dei webp.
  - Tutte in ETC1S: le trame grigie, le ruvidità e le normal map lineari, le foto a colori in sRGB.
    Le normal map in UASTC sarebbero più fedeli ma 4-5 volte più pesanti.
  - Il traduttore arriva dal pacchetto di three, alla stessa versione del caricatore: Vite lo
    mette da solo nella build (`assets/basis_transcoder-*.js` e `.wasm`).
- **Come si rigenerano**:
  - `python3 tools/texture_foto.py` scarica le foto e scrive i webp sorgenti in
    `tools/sorgenti/tex/` (serve accesso a dl.polyhaven.org);
  - `npm run texture` (`tools/texture_ktx2.mjs`) li converte in `public/tex/*.ktx2` con l'encoder
    Basis Universal in WebAssembly del pacchetto `ktx2-encoder` (serve Python con Pillow).

## Sfondo e terreno

Niente cielo fotografico e niente campagna: fuori dalla recinzione non c'è nulla, come in un
plastico.
- Di giorno lo sfondo è a tinta unita, caldo all'alba e al tramonto e azzurrino di giorno; di sera
  è blu notte. Niente foschia.
- La luce riflessa viene dallo studio luminoso (RoomEnvironment), come per i materiali lucidi.
- Il lotto poggia su uno zoccolo di terra alto 60 cm, a filo della recinzione.

## Modelli 3D veri

- Le **piante in vaso** di tutta la casa sono modelli 3D veri di Poly Haven (CC0):
  - una pianta alta (circa 1,35 m) e una media, entrambe in vaso di cotto;
  - una piccola grassa in vaso bianco, per mensole e mobili.
  Si sceglie il modello in base all'altezza, e la pianta non è mai più larga del posto che aveva.
- **Alleggeriti per il web** con gltf-transform (meshoptimizer): meno triangoli, texture webp a
  512 px, geometria compressa. 6,3 MB diventano 330 KB per la pianta grande. File in
  `public/modelli/`, rigenerabili con `bash tools/modelli_3d.sh`.
- Ogni pianta è una copia che condivide geometria e materiali: non si fonde con la stanza
  (flag `userData.aParte`, come le ante della porta telescopica).

## Esperienza di visita

- **Sole vero**: il 21 del mese corrente alle 11, ora italiana. La posizione del sole e'
  calcolata per luogo, data e ora (con l'ora legale); non si cambia dal menu. Il luogo e
  l'orientamento stanno in `src/data/luogo.json` (per ora Riccione, provvisorio, con il nord in
  alto nella piantina).
- **Voli di camera** al posto dei salti nel cambio di piano.
- **Schermata di caricamento** con le tappe della costruzione; tipografia Cormorant Garamond e
  Jost, menu rifinito.
- **Copia il link di questa vista**: il link riapre piano, camera, luce, tavolo,
  versione e porta.

## Prestazioni

**Disegno a richiesta.** La scena si disegna solo quando la vista cambia: la camera si muove
(anche per inerzia, dopo il trascinamento), c'è un volo di camera, la porta telescopica scorre, o
dal menu cambia qualcosa (versione, tavolo, piano, luce, tetto, pareti, qualità, finestra
ridimensionata). Da ferma non disegna nulla: sul telefono niente batteria e calore sprecati.
Il contatore in basso a destra lo mostra: "fermo" quando la scena non si ridisegna. Nel codice:
`ridisegna()` in `main.js`, chiamata da `applicaLuce`, `applicaAllestimento`, `applicaQualita`,
dal ridimensionamento e dall'evento `change` dei controlli della camera.


**Avvio più veloce.** Misurato con un profilo della CPU durante il caricamento (Chromium senza
scheda grafica, quindi tempi assoluti gonfiati: contano le proporzioni), da 51,7 a 12,4 secondi:
- *Tele disegnate in memoria normale*: le texture disegnate (canvas) nascono con
  `willReadFrequently`, cosi' si disegnano subito e si rileggono senza fermare il browser. Prima
  il colore medio di ogni materiale coperto da una foto (`mediaColore`) costava da solo 25 secondi:
  ogni lettura obbligava a rasterizzare la tela sulla scheda grafica e a riportarla indietro. Ora
  la media e' quella vera, su tutti i pixel (prima su 16 campioni): i colori cambiano di meno di
  un terzo di livello su 255.
- *Niente copie inutili*: `ottimizza` trasforma sul posto le geometrie usate da una mesh sola e
  copia solo quelle condivise (`contaUtenti`); l'ultima tappa passa da 3,6 a 1,5 secondi.
- *Shader compilati durante il caricamento* (`renderer.compileAsync`, tappa "Gli shader"): dove
  il browser lo permette si compilano in parallelo, e non c'e' lo scatto al primo movimento.

**Meno draw call** (`src/ottimizza.js`), dopo la costruzione:
- *Materiali uniti*: i materiali con gli stessi parametri, nati uno per oggetto (paralumi,
  lampadine, vetri...), diventano uno solo: da 290 a 212. I paralumi che di sera si accendono
  si uniscono solo fra loro.
- *Gruppi uniti*: le stanze del piano primo, che si accendono e si spengono insieme, stanno in un
  gruppo solo; lo stesso per le stanze del piano terra (cognata e suoceri). Cosi' lo stesso
  materiale in stanze diverse diventa una draw call sola.
- *Fusione per materiale*: in ogni gruppo le mesh statiche si fondono per materiale; quelle con
  un materiale per faccia (muri esterni, solette, falde del tetto) vengono prima divise per
  gruppo di facce.
- *Sagome d'ombra*: le forme che fanno ombra si fondono anche tutte insieme, senza materiale, in
  una sagoma per gruppo (una per verso delle facce). La mappa d'ombra del sole disegna le sagome
  invece di ogni mesh. Le sagome stanno sul livello 1, che la camera accende solo mentre si
  disegna la mappa d'ombra: nell'immagine non compaiono.
- *Una mappa d'ombra per fotogramma*: prima, in qualità alta, si ridisegnava anche durante le
  ombre di contatto (GTAO), che ridisegnano la scena.

Risultato, vista esterna completa (due piani, tetto e giardino), ombre incluse: da circa 1.290 a
circa 510 draw call; in qualità alta da circa 2.550 (calcolate sommando i passaggi) a 965
(misurate) per fotogramma. Le immagini
restano le stesse (confrontate pixel per pixel prima e dopo: cambia solo il rumore delle ombre
di contatto lungo i bordi).

Le ombre sono proiettate solo dal sole; le luci artificiali sono luci
puntiformi senza ombre, attive nella modalità sera; di sera si accendono solo quelle del piano
in vista, e al piano terra (due appartamenti) quelle entro 2,4 m si fondono in una sola, cosi'
restano circa venti. Pixel ratio limitato a 1,5.
