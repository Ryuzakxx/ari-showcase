// ============================================================================
//  Cronologia di Ari per il grafico della pagina «Versioni».
//  DATI DI ESEMPIO: messaggi e branch sono segnaposto da sostituire.
// ============================================================================
//
//  Scrivi i commit in ordine cronologico, dal più vecchio al più nuovo
//  (per aggiungerne uno nuovo, mettilo in fondo). La pagina li mostra al
//  contrario, come `git log --graph`.
//
//  Campi di ogni commit:
//    branch   nome del branch (obbligatorio)
//    message  messaggio del commit (obbligatorio)
//    from     solo per il primo commit di un branch: il branch da cui parte
//             (se manca, 'main')
//    merge    nome del branch che questo commit unisce (commit di merge)
//    tag      versione, es. 'v1.5.0': il commit diventa un rilascio
//    notes    elenco delle novità mostrato sotto i rilasci
//    hash     facoltativo: se manca ne viene generato uno finto
//
//  Le corsie (colonne) e i colori dei branch vengono assegnati da soli.
//  Per forzare una corsia: aggiungi il branch in `branchLanes` qui sotto.

window.ARI_VERSIONS = {
  mainBranch: 'main',

  // Facoltativo, es. { 'feat/timer': 2 }
  branchLanes: {},

  commits: [
    // ---- 1.0 -----------------------------------------------------------------
    { branch: 'main', message: 'Primo commit: widget Electron e avatar robottino' },
    { branch: 'main', message: 'Scorciatoia globale Ctrl + Alt + Spazio e rilevamento della voce' },
    { branch: 'feat/voce', message: 'Voci neurali Edge TTS, risposta frase per frase' },
    { branch: 'main', message: 'Cervello: Groq e Ollama con streaming' },
    { branch: 'feat/voce', message: 'Riconoscimento automatico italiano / inglese' },
    { branch: 'main', message: 'Merge branch feat/voce', merge: 'feat/voce' },
    {
      branch: 'main',
     
      message: 'Installer per Windows, ricerca web e memoria locale',
      tag: 'v1.0.0',
      notes: [
        'Avatar robottino in un angolo dello schermo',
        'Scorciatoia globale Ctrl + Alt + Spazio',
        'Voci neurali Microsoft in italiano e in inglese',
        'Cervello Groq oppure Ollama sul PC',
        'Ricerca web e memoria locale',
      ],
    },

    // ---- 1.1 -----------------------------------------------------------------
    { branch: 'feat/fallback', message: 'Router con fallback: Gemini, Cerebras, Mistral, OpenRouter' },
    { branch: 'feat/memoria-nas', message: 'Memoria portabile in una cartella e sincronizzazione NAS' },
    { branch: 'feat/fallback', message: 'Passaggio automatico quando finiscono i limiti gratuiti' },
    { branch: 'feat/memoria-nas', message: 'Esporta e importa in un file .aribrain' },
    { branch: 'main', message: 'Merge branch feat/fallback', merge: 'feat/fallback' },
    {
      branch: 'main',
     
      message: 'Merge branch feat/memoria-nas',
      merge: 'feat/memoria-nas',
      tag: 'v1.1.0',
      notes: [
        'Fallback automatico tra cinque provider gratuiti',
        'Memoria sul NAS con copia locale quando è spento',
        'Esportazione e importazione in un file .aribrain',
      ],
    },

    // ---- 1.2 -----------------------------------------------------------------
    { branch: 'feat/wake-word', message: 'Parola di attivazione «Ehi Ari» con Whisper locale' },
    { branch: 'main', message: 'Spotify e YouTube: canzoni, video e canali' },
    { branch: 'feat/wake-word', message: 'Whisper sul PC accelerato con WebGPU' },
    {
      branch: 'main',
     
      message: 'Merge branch feat/wake-word',
      merge: 'feat/wake-word',
      tag: 'v1.2.0',
      notes: [
        'Parola di attivazione «Ehi Ari»',
        'Trascrizione sul PC con WebGPU, senza chiavi',
        'Musica e video su Spotify e YouTube',
      ],
    },

    // ---- 1.3 -----------------------------------------------------------------
    { branch: 'fix/conversazione', message: '«ciao» all\'inizio è un saluto, non una chiusura' },
    { branch: 'feat/memory-filter', message: 'Memoria: salva solo i fatti importanti e duraturi' },
    { branch: 'fix/conversazione', message: 'Riconosce «no grazie, non mi serve altro»' },
    { branch: 'main', message: 'Merge branch fix/conversazione', merge: 'fix/conversazione' },
    { branch: 'feat/memory-filter', message: 'Pulsante «Togli i ricordi superflui»' },
    {
      branch: 'main',
     
      message: 'Merge branch feat/memory-filter',
      merge: 'feat/memory-filter',
      tag: 'v1.3.0',
      notes: [
        '«ciao» all\'inizio è un saluto e Ari risponde',
        'In memoria solo i fatti importanti e duraturi',
        '«No grazie, non mi serve altro» chiude la conversazione',
      ],
    },

    // ---- 1.4 -----------------------------------------------------------------
    { branch: 'feat/bloub', message: 'Avatar bloub: motore di animazione (MIT)' },
    { branch: 'main', message: 'Sottotitoli anche per la tua trascrizione' },
    { branch: 'feat/bloub', message: 'Segue il mouse con lo sguardo, 8 forme e 16 espressioni' },
    { branch: 'main', message: 'Avatar con le tue immagini, stile PNGtuber' },
    {
      branch: 'main',
     
      message: 'Merge branch feat/bloub',
      merge: 'feat/bloub',
      tag: 'v1.4.0',
      notes: [
        'Avatar bloub, con 8 forme e 16 espressioni',
        'Avatar con le tue immagini (PNG e GIF)',
        'Sottotitoli della tua trascrizione',
        'Circa 190 MB di RAM a riposo',
      ],
    },

    // ---- 1.5 -----------------------------------------------------------------
    { branch: 'perf/ram', message: 'Avatar a riposo a 20 fps, fermo quando è nascosto' },
    { branch: 'feat/timer', message: 'Timer multipli e sveglie che si ripetono' },
    { branch: 'feat/permessi', message: 'Permessi: schermo e appunti, spenti di serie' },
    { branch: 'perf/ram', message: 'Whisper locale in un worker che si chiude dopo 10 minuti' },
    { branch: 'feat/timer', message: '«Rimandala di 10 minuti» e conti alla rovescia sul widget' },
    { branch: 'main', message: 'Merge branch perf/ram', merge: 'perf/ram' },
    { branch: 'feat/permessi', message: 'Dettatura e file nelle cartelle scelte' },
    { branch: 'main', message: 'Merge branch feat/timer', merge: 'feat/timer' },
    { branch: 'feat/permessi', message: 'Contenuti non fidati e indirizzi web solo pubblici' },
    { branch: 'main', message: 'Rimosse le voci locali Chatterbox e Kokoro' },
    { branch: 'main', message: 'Merge branch feat/permessi', merge: 'feat/permessi' },
    { branch: 'main', message: 'Modalità gioco e supporto Linux' },
    {
      branch: 'main',
     
      message: 'Ari 1.5.0',
      tag: 'v1.5.0',
      notes: [
        'Timer e sveglie',
        'Permessi: schermo, appunti, dettatura e file',
        'Modalità gioco e circa 110 MB di RAM a riposo',
        'Funziona anche su Linux',
      ],
    },
  ],
};
