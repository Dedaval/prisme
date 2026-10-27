// ---------- Éléments de la page ----------
const ecran = document.getElementById('ecran');
const ctx = ecran.getContext('2d', { willReadFrequently: true });
const boutonPhoto = document.getElementById('photo');
const divFiltres = document.getElementById('filtres');
const imgResultat = document.getElementById('resultat');
const erreur = document.getElementById('erreur');

// La vidéo n'est pas affichée : on la dessine dans le canvas à chaque image
const video = document.createElement('video');
video.playsInline = true;
video.muted = true;

let filtreActuel = 'aucun';

// ---------- 1. Démarrer la caméra avec getUserMedia ----------
async function demarrerCamera() {
  try {
    const flux = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });
    video.srcObject = flux;
    await video.play();
    requestAnimationFrame(dessiner);
  } catch (e) {
    erreur.hidden = false;
    erreur.textContent = 'Caméra inaccessible : ' + e.name + ' (HTTPS requis).';
  }
}

// ---------- 2. Les filtres : chacun modifie les pixels d'une image ----------
// "pixels" est un grand tableau : [r, g, b, a, r, g, b, a, ...]
const filtres = {
  aucun: null,

  'noir et blanc': (pixels) => {
    for (let i = 0; i < pixels.length; i += 4) {
      const gris = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = gris;
    }
  },

  'sépia': (pixels) => {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      pixels[i]     = r * 0.393 + g * 0.769 + b * 0.189;
      pixels[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
      pixels[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
    }
  },

  'négatif': (pixels) => {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i]     = 255 - pixels[i];
      pixels[i + 1] = 255 - pixels[i + 1];
      pixels[i + 2] = 255 - pixels[i + 2];
    }
  },

  'rouge': (pixels) => {
    // On garde seulement le canal rouge
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
    }
  }
};

// ---------- 3. Boucle d'affichage ----------
function dessiner() {
  // Le canvas prend la taille de la vidéo
  if (ecran.width !== video.videoWidth) {
    ecran.width = video.videoWidth;
    ecran.height = video.videoHeight;
  }

  // Image de la caméra, retournée comme un miroir
  ctx.save();
  ctx.translate(ecran.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  ctx.restore();

  // Application du filtre choisi
  const filtre = filtres[filtreActuel];
  if (filtre) {
    const image = ctx.getImageData(0, 0, ecran.width, ecran.height);
    filtre(image.data);
    ctx.putImageData(image, 0, 0);
  }

  requestAnimationFrame(dessiner);
}

// ---------- 4. Boutons ----------
for (const nom in filtres) {
  const bouton = document.createElement('button');
  bouton.textContent = nom;
  if (nom === filtreActuel) bouton.className = 'actif';

  bouton.onclick = () => {
    filtreActuel = nom;
    for (const b of divFiltres.children) b.className = '';
    bouton.className = 'actif';
  };
  divFiltres.appendChild(bouton);
}

boutonPhoto.onclick = () => {
  // On fige l'image du canvas, on l'affiche et on la télécharge
  const url = ecran.toDataURL('image/png');
  imgResultat.src = url;
  imgResultat.hidden = false;

  const lien = document.createElement('a');
  lien.href = url;
  lien.download = 'photo.png';
  lien.click();
};

// ---------- 5. PWA : service worker ----------
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}

demarrerCamera();
