<script lang="ts">
    import Modal from './Modal.svelte';

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose }: Props = $props();
</script>

<Modal bind:isOpen={isOpen} onClose={onClose} maxWidth="400px">
    <div class="flex justify-center flex-col gap-4 items-center">
        <img src="/divers/Scandal_hello.jpg" class="w-44 rounded" alt="scandal collected">
        <audio controls>
            <source src="/divers/departure.mp3" type="audio/mpeg">
        </audio>
    </div>
</Modal>
