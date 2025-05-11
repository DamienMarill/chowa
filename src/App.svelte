<script lang="ts">
  import CameraView from './lib/CameraView.svelte';
  
  let showCamera = false;
  
  function startCameraExperience() {
    showCamera = true;
  }
  
  function exitCameraExperience() {
    showCamera = false;
  }
</script>

<main>
  {#if showCamera}
    <!-- Vue caméra en plein écran -->
    <CameraView />
    
    <!-- Bouton pour quitter -->
    <button 
      class="exit-btn"
      on:click={exitCameraExperience}
    >
      Quitter
    </button>
  {:else}
    <!-- Page d'accueil -->
    <div class="welcome">
      <h1>Chōwa</h1>
      <p>Test de caméra en plein écran</p>
      
      <button on:click={startCameraExperience}>
        Activer la caméra
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
  }
  
  .welcome {
    text-align: center;
    padding: 20px;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  button {
    background-color: #4ECCA3;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .exit-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.6);
  }
</style>
