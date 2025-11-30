<script lang="ts">
    /**
     * Composant pour définir les assets A-Frame (images, sons, modèles, etc.)
     */
    interface Props {
        sakuraImages: string[];
    }

    let { sakuraImages }: Props = $props();
</script>

<a-assets>
    {#each sakuraImages as image, index}
        <img id="sakura-{index+1}" src="{image}" alt="Sakura petal texture {index + 1}" />
    {/each}
</a-assets>
