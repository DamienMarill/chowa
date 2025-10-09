<script lang="ts">
    /**
     * Modal d'affichage d'un paper collecté
     */

    import Modal from './Modal.svelte';
    import { gameState } from '../stores/gameState.svelte';

    interface Props {
        isOpen?: boolean;
        onClose: () => void;
    }

    let { isOpen = $bindable(false), onClose }: Props = $props();

    const paperName = $derived(gameState.selectedPaper);
    const paperImage = $derived(paperName ? `/divers/${paperName}.png` : '');
</script>

<Modal bind:isOpen {onClose} maxWidth="500px">
    {#if paperName}
        <div class="paper-content">
            <img src={paperImage} alt="Paper collecté: {paperName}" />
        </div>
    {/if}
</Modal>

<style>
    .paper-content {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
    }
</style>
