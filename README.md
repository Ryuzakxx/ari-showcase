# Sito di Ari

Sito vetrina di **Ari**, l'assistente IA per il desktop. Quattro pagine statiche in HTML, CSS e JavaScript, con lo
scorrimento morbido di [Lenis](https://github.com/darkroomengineering/lenis). Niente build e niente dipendenze da
installare.

| Pagina | File | Cosa contiene |
|---|---|---|
| Home | `index.html` | Titolo, Ari animata su uno schermo d'esempio, funzionalità, perché Ari, come si inizia, esempi |
| Funzionalità | `funzionalita.html` | 8 argomenti con una barra per saltare da uno all'altro, avatar, grafico della RAM, privacy |
| Versioni | `versioni.html` | Rilasci e grafico git dei commit, generato da `assets/data/versions.js` |
| Video | `video.html` | Player con l'elenco dei video accanto, letti da `assets/data/videos.js` |

## Come aprirlo

- **Doppio clic** su `index.html`: funziona anche così, direttamente da disco.
- Oppure con **Live Server** in VS Code (clic destro su `index.html` › *Open with Live Server*).
- Oppure con qualsiasi server statico, per esempio `python -m http.server` nella cartella del sito.

Per pubblicarlo basta caricare la cartella così com'è su un hosting statico (GitHub Pages, Netlify, Vercel,
Cloudflare Pages…). Tutti i percorsi sono relativi, quindi funziona anche in una sottocartella.

## Cosa modificare

### Versione e stato «beta»
- Il numero di versione mostrato nelle pagine è in [assets/js/config.js](assets/js/config.js) (`version`).
- Ari è presentata come progetto personale in beta, senza pulsanti di download: l'etichetta «Beta» è accanto al
  logo e nel piè di pagina di ogni pagina, sopra il titolo della home e nel riquadro finale di Home e Video.
  Quando vorrai pubblicarla, basta aggiungere un pulsante (per esempio
  `<a class="btn btn--primary" href="…">Scarica</a>`) dove serve.

### Cronologia delle versioni
In [assets/data/versions.js](assets/data/versions.js). **I commit presenti sono di esempio.** Si scrivono in
ordine cronologico (il nuovo va in fondo) e il grafico li mostra al contrario, come `git log --graph`:

```js
{ branch: 'feat/timer', message: 'Timer multipli' },             // primo commit: parte da main
{ branch: 'main', message: 'Merge branch feat/timer', merge: 'feat/timer' },
{ branch: 'main', message: 'Ari 1.5.0', tag: 'v1.5.0', notes: ['Timer e sveglie'] },
```

Collegamenti, corsie, colori, etichette dei branch e hash (se mancano) vengono calcolati da soli. Per un branch che
parte da un altro branch usa `from: 'nome-branch'`.

### Video
I video stanno nella cartella `videos/` e l'elenco (titolo, descrizione, file) è in
[assets/data/videos.js](assets/data/videos.js). Ora ce ne sono due:

```
1.mp4    un video su YouTube (canale di Netflix Italia, teaser di Cyberpunk: Edgerunners 2)
2.mp4    una canzone su Spotify («Drain You» dei Nirvana)
```

Per aggiungerne uno, copia il file in `videos/` e aggiungi una voce in `videos.js`. Se un file manca, al suo posto
compare «Video in arrivo». L'anteprima nell'elenco è un fotogramma del video stesso: scegli il secondo con `thumb: 50`, oppure usa
un'immagine con `poster: 'videos/1.jpg'`. La durata viene letta dal file. Meglio MP4 con H.264, che funziona in tutti i browser.

### Colori e forme
In cima a [assets/css/style.css](assets/css/style.css):

- `--blue` e `--purple` per pulsanti e superfici piene, `--blue-2` e `--purple-2` per testi e linee;
- `--grad` è la sfumatura delle parole evidenziate nei titoli;
- `--r`, `--r-sm`, `--r-lg` sono gli arrotondamenti delle card (i pulsanti sono a pillola, `border-radius: 999px`
  in `.btn`).

### Testi
Sono direttamente nei file HTML. Barra di navigazione e piè di pagina sono ripetuti in ognuna delle quattro pagine:
se li cambi, cambiali in tutte.

## Struttura

```
index.html, funzionalita.html, versioni.html, video.html
favicon.svg
videos/                    i tuoi video
assets/
  css/style.css            colori, tipografia, pulsanti, card, barra di navigazione, piè di pagina
  css/home.css …           uno per pagina
  js/config.js             numero di versione
  js/site.js               comune a tutte le pagine: Lenis, link interni, comparsa, menu mobile, torna su
  js/home.js               avatar animato, schermo che si raddrizza, timer
  js/features.js           barra degli argomenti, avatar, grafico della RAM
  js/gitgraph.js           disegno del grafico git (SVG)
  js/versions.js, videos.js
  data/versions.js         cronologia (da modificare)
  data/videos.js           elenco dei video (da modificare)
  vendor/lenis/            Lenis 1.3.26 (licenza MIT), incluso così il sito funziona anche offline
```

### Note su Lenis
- È caricato con un tag `<script>` come indicato nella [guida di installazione](https://github.com/darkroomengineering/lenis#installation),
  da una copia locale in `assets/vendor/lenis/` invece che dalla CDN, così funziona anche senza internet e aprendo
  i file da disco. Il CSS consigliato è `assets/vendor/lenis/lenis.css`.
- L'istanza è in [assets/js/site.js](assets/js/site.js) con `autoRaf: true`. Se Lenis non si carica, il sito usa lo
  scorrimento normale del browser.
- I link `#sezione` li anima Lenis, lasciando spazio alla barra di navigazione e alle barre con `data-sticky`.
- Lo schermo della home che si raddrizza, l'anello di avanzamento del pulsante «torna su», l'argomento attivo nella
  pagina Funzionalità e la versione attiva nella pagina Versioni seguono lo scroll di Lenis.
- Le animazioni di comparsa nascondono gli elementi solo dopo che gli script sono partiti: se il JavaScript non va,
  i contenuti restano comunque visibili.
