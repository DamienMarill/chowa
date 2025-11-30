<script lang="ts">
    import Modal from './Modal.svelte';

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose }: Props = $props();
</script>

<Modal bind:isOpen={isOpen} onClose={onClose} title="Crédits">
    <div class="flex items-center justify-center gap-4 mb-4">
        <img src="/divers/marill.gif" class="w-24 rounded-full" alt="marill">
        <div>
            <h3 class="mb-3 text-xl">Damien Marill</h3>
            <p><a class="link" target="_blank" href="https://marill.dev">https://marill.dev</a></p>
        </div>
    </div>
    <ul>
        <li>Chanson de <a class="link" href="https://www.instagram.com/cacophonie436/" target="_blank">Laura, aka Gwen</a></li>
        <li>Sound Effect by <a class="link" target="_blank" href="https://pixabay.com/users/floraphonic-38928062/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=191453">floraphonic</a> from <a class="link" target="_blank" href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=191453">Pixabay</a></li>
        <li>Co-codé avec Meika, sur <a class="link" href="https://claude.ai">Claude</a></li>
        <li>Avec le soutien et l'encouragement <a class="link" target="_blank" href="https://www.instagram.com/anieshka__/">d'Anieshka</a></li>
    </ul>
</Modal>
