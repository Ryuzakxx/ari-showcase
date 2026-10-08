// ============================================================================
//  Video della pagina «Video».
// ============================================================================
//
//  I file stanno nella cartella  videos/  (accanto a index.html):
//    'videos/1.mp4'  →  videos/1.mp4
//
//  Campi:
//    src          file del video, .mp4 (H.264) o .webm         obbligatorio
//    title        titolo                                       obbligatorio
//    description  una o due frasi
//    category     etichetta mostrata sopra il titolo
//    thumb        secondo del video da usare come anteprima    facoltativo
//                 nell'elenco (se manca, l'inizio del video)
//    poster       immagine di anteprima (.jpg/.png/.webp)      facoltativo:
//                 se c'è, si usa al posto del fotogramma
//    duration     es. '1:24'                                   facoltativo:
//                 se manca viene letta dal file
//
//  Finché un file non c'è, al suo posto compare «Video in arrivo».

window.ARI_VIDEOS = [
  {
    src: 'videos/1.mp4',
    thumb: 35,
    poster: '',
    title: 'Un video su YouTube',
    description:
      "Le chiedi un video e Ari apre il canale di Netflix Italia su YouTube, poi il teaser di Cyberpunk: Edgerunners 2.",
    category: 'YouTube',
  },
  {
    src: 'videos/2.mp4',
    thumb: 38,
    poster: '',
    title: 'Una canzone su Spotify',
    description: 'Le chiedi una canzone: Ari ascolta, ci pensa un attimo, apre Spotify e mette «Drain You» dei Nirvana.',
    category: 'Spotify',
  },
];
