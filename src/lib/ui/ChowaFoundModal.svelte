<script lang="ts">
    import Modal from './Modal.svelte';

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose }: Props = $props();
</script>

<Modal bind:isOpen={isOpen} onClose={onClose} title="intéragissez !" maxWidth="900px">
    <div class="flex flex-col space-y-4">
        <div class="flex flex-col gap-4">
            <div>
                <div class="w-52 mx-auto relative">
                    <img src="/divers/mimiqui.png" class="w-52 mx-auto" alt="Chowa found"/>
                    <span class="text-[6rem] absolute -rotate-45 bottom-0 left-28">👆</span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <p class="text-lg">Vous pouvez appuyer sur les éléments du dessin pour que des choses ce passent.</p>
            </div>
        </div>
    </div>
</Modal>
