<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  // Références aux éléments DOM
  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let errorMessage = '';
  
  // Fonction pour initialiser la caméra
  async function initCamera() {
    try {
      // Réinitialiser les erreurs
      errorMessage = '';
      
      // Demander accès à la caméra arrière en HD si possible
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      // Assigner le flux à l'élément vidéo
      if (videoElement) {
        videoElement.srcObject = stream;
        console.log('Caméra initialisée avec succès');
      }
    } catch (error) {
      // Capturer et afficher l'erreur
      console.error('Erreur d\'accès à la caméra:', error);
      errorMessage = `Erreur d'accès à la caméra: ${error.message || error}`;
    }
  }
  
  // Arrêter la caméra et libérer les ressources
  function stopCamera() {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      stream = null;
      
      if (videoElement) {
        videoElement.srcObject = null;
      }
      
      console.log('Caméra arrêtée');
    }
  }
  
  // Initialiser la caméra au montage du composant
  onMount(() => {
    console.log('Composant monté, initialisation de la caméra...');
    initCamera();
  });
  
  // Nettoyer les ressources au démontage
  onDestroy(() => {
    console.log('Composant démonté, arrêt de la caméra...');
    stopCamera();
  });
</script>

<div class="camera-container">
  <!-- Vidéo en plein écran -->
  <video 
    bind:this={videoElement} 
    autoplay 
    playsinline 
    muted
    on:canplay={() => videoElement.play()}
  ></video>
  
  <!-- Affichage des erreurs éventuelles -->
  {#if errorMessage}
    <div class="error-message">
      {errorMessage}
    </div>
  {/if}
  
  <!-- Bouton pour réinitialiser la caméra en cas de problème -->
  <button class="reset-button" on:click={initCamera}>
    Réinitialiser la caméra
  </button>
</div>

<style>
  .camera-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    overflow: hidden;
  }
  
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .error-message {
    position: absolute;
    bottom: 80px;
    left: 0;
    width: 100%;
    background-color: rgba(255, 0, 0, 0.7);
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 10;
  }
  
  .reset-button {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border: 1px solid white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10;
  }
</style>