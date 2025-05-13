<script lang="ts">
  import ARView from './lib/ARView.svelte';
  
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
    <ARView />
    
    <!-- Bouton pour quitter -->
    <button 
      class="btn btn-ghost"
      on:click={exitCameraExperience}
    >
      Quitter
    </button>
  {:else}
    <!-- Page d'accueil -->
    <div class="welcome">
      <h1>Chōwa</h1>
      <p>Test de caméra en plein écran</p>
      
      <button class="btn btn-primary" on:click={startCameraExperience}>
        Activer la caméra
      </button>
    </div>
  {/if}
</main>

<style>

</style>
