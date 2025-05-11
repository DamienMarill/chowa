<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let showAR: boolean = false;
  let isSceneInitialized: boolean = false;
  
  // Pour stocker la référence à la div contenant la scène AR
  let arSceneContainer: HTMLElement;
  
  // Variable pour suivre si le marqueur est actuellement visible
  let isMarkerVisible = false;
  
  // Pour stocker les timelines d'animation GSAP
  let animations = {
    appearing: null,
    floating: null,
    rotating: null
  };
  
  function initARScene() {
    if (!arSceneContainer || isSceneInitialized) return;
    
    // Création de la scène A-Frame
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;');
    
    // Configuration de la scène pour qu'elle prenne tout l'écran
    scene.style.position = 'absolute';
    scene.style.top = '0';
    scene.style.left = '0';
    scene.style.width = '100%';
    scene.style.height = '100%';
    
    // Création du marqueur
    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('emitevents', 'true');
    
    // Image 2D à animer
    const image1 = document.createElement('a-image');
    image1.setAttribute('src', '/assets/image1.svg');
    image1.setAttribute('position', '0 0.5 0');
    image1.setAttribute('rotation', '0 0 0');
    image1.setAttribute('scale', '0 0 0');  // Initialement invisible
    image1.setAttribute('opacity', '0');
    image1.setAttribute('class', 'ar-element animate-appearing animate-floating');
    
    // Une autre image 2D
    const image2 = document.createElement('a-image');
    image2.setAttribute('src', '/assets/image2.svg');
    image2.setAttribute('position', '-0.5 0 0');
    image2.setAttribute('rotation', '0 0 0');
    image2.setAttribute('scale', '0 0 0');  // Initialement invisible
    image2.setAttribute('opacity', '0');
    image2.setAttribute('class', 'ar-element animate-appearing animate-rotating');
    
    // Création de la caméra
    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    
    // Ajout des éléments à la scène
    marker.appendChild(image1);
    marker.appendChild(image2);
    scene.appendChild(marker);
    scene.appendChild(camera);
    
    // Ajout de la scène au conteneur
    arSceneContainer.innerHTML = '';
    arSceneContainer.appendChild(scene);
    
    // Écoute des événements de marqueur
    marker.addEventListener('markerFound', handleMarkerFound);
    marker.addEventListener('markerLost', handleMarkerLost);
    
    isSceneInitialized = true;
  }
  
  function handleMarkerFound() {
    console.log('Marqueur trouvé!');
    isMarkerVisible = true;
    startAnimations();
  }
  
  function handleMarkerLost() {
    console.log('Marqueur perdu');
    isMarkerVisible = false;
    stopAnimations();
  }
  
  function startAnimations() {
    // Si GSAP est disponible, on l'utilise pour les animations
    if (window.gsap) {
      // Animation d'apparition
      animations.appearing = window.gsap.to('.animate-appearing', {
        opacity: 1,
        scale: '1 1 1',
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });
      
      // Animation de flottement
      animations.floating = window.gsap.to('.animate-floating', {
        y: '+=0.1',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      
      // Animation de rotation
      animations.rotating = window.gsap.to('.animate-rotating', {
        rotation: '0 360 0',
        duration: 8,
        repeat: -1,
        ease: 'none'
      });
    }
  }
  
  function stopAnimations() {
    // Arrêt des animations avec GSAP
    if (window.gsap) {
      Object.values(animations).forEach(animation => {
        if (animation) {
          animation.kill();
        }
      });
      
      // Animation de disparition
      window.gsap.to('.ar-element', {
        opacity: 0,
        scale: '0 0 0',
        duration: 0.3,
        stagger: 0.05
      });
    }
  }
  
  // Initialisation au montage du composant
  onMount(() => {
    console.log('Composant AR monté');
    
    // On attend un peu pour s'assurer que les bibliothèques sont chargées
    setTimeout(() => {
      if (showAR) {
        initARScene();
      }
    }, 500);
  });
  
  // Mise à jour quand showAR change
  $: if (showAR && arSceneContainer && !isSceneInitialized) {
    initARScene();
  }
  
  // Nettoyage au démontage du composant
  onDestroy(() => {
    console.log('Composant AR détruit');
    stopAnimations();
  });
</script>

{#if showAR}
  <!-- Container AR, prend tout l'écran -->
  <div class="ar-container">
    <div bind:this={arSceneContainer}></div>
    
    <!-- Instructions AR en surimpression -->
    <div class="ar-overlay">
      <div class="ar-instructions">
        <p>Pointez votre caméra vers un marqueur Hiro</p>
        <a href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" target="_blank" class="ar-marker-link">
          Voir le marqueur (à imprimer ou afficher sur un autre écran)
        </a>
      </div>
    </div>
  </div>
{:else}
  <div class="ar-instructions">
    <p>Préparation de l'expérience AR...</p>
  </div>
{/if}

<style>
  .ar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    overflow: hidden;
  }

  .ar-overlay {
    position: absolute;
    bottom: 20px;
    left: 0;
    width: 100%;
    pointer-events: none;
    z-index: 2000;
    display: flex;
    justify-content: center;
  }

  .ar-instructions {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    text-align: center;
    pointer-events: auto;
    max-width: 80%;
    backdrop-filter: blur(5px);
  }

  .ar-marker-link {
    display: inline-block;
    margin-top: 10px;
    color: #4ECCA3;
    text-decoration: underline;
  }

  /* Cachons les contrôles de debugging d'AR.js */
  :global(.a-enter-vr),
  :global(.a-orientation-modal) {
    display: none !important;
  }

  /* Pour s'assurer que la scène A-Frame prend tout l'espace */
  :global(a-scene) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
