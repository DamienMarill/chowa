<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import 'aframe';
    import 'mind-ar/dist/mindar-image-aframe.prod.js';
    let debug = true;

    interface trackAsset {
        name: string,
        z: number,
        ratio?: number
    }

    let assetRatio = 1;

    function getAssetWidth(ratio: number){
        return ratio;
    }

    function getAssetHeight(ratio: number){
        return (21/29.7)*ratio;
    }

    // Variables pour stocker les références aux objets AR
    let mindarThree: any;
    let container: HTMLElement;

    let images: (trackAsset)[] = [
        { name: 'background', z: 0, ratio: 1.5 },
        { name: 'girl', z: 0.4},
        { name: 'scandal', z: 0.5},

        //paper
        { name: 'paper_1', z: 0.5},
        { name: 'paper_2', z: 0.3},
        { name: 'paper_3', z: 0.6},
        { name: 'paper_4', z: 0.5},
        { name: 'paper_5', z: 0.6},
        { name: 'paper_6', z: 0.3},
        { name: 'paper_7', z: 0.5},
        { name: 'paper_8', z: 0.4},
    ]

    onMount(async () => {
        // Accéder au système renderer d'A-Frame pour modifier les paramètres de clipping
        const sceneEl = document.querySelector('a-scene');

        // Attendre que la scène soit chargée pour modifier les paramètres
        if (sceneEl) {
            sceneEl.addEventListener('loaded', () => {
                // Accéder au renderer et ajuster les paramètres
                const renderer = sceneEl.renderer;
                if (renderer) {
                    // Désactiver automaticClear pour éviter certains problèmes de clipping
                    renderer.autoClear = false;
                }

                // Ajuster les paramètres de caméra pour éviter le clipping
                const camera = document.querySelector('a-camera');
                if (camera) {
                    // Augmenter la distance de rendu
                    camera.setAttribute('far', '10000');
                    // Réduire la distance minimale
                    camera.setAttribute('near', '0.01');
                }
            });
        }
    });

    onDestroy(() => {
        // Nettoyage des ressources si nécessaire
    });
</script>

<main>
    <a-scene mindar-image="imageTargetSrc: /chowa.mind;" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" renderer="logarithmicDepthBuffer: true; colorManagement: true; highPerformance: true; physicallyCorrectLights: true;">
        <a-camera position="0 0 0" look-controls="enabled: false" near="0.01" far="10000"></a-camera>
        <a-entity mindar-image-target="targetIndex: 0">
            <!-- Image originale -->
            {#each images as image}
                <a-image src="{'/track_assets/'+image.name+'.png'}"
                         position="{'0 0 '+image.z}"
                         height="{getAssetHeight(image.ratio ?? assetRatio)}"
                         width="{getAssetWidth(image.ratio ?? 1)}" rotation="0 0 0"
                         material="transparent: true; alphaTest: 0.5; depthTest: false; depthWrite: false; opacity: 1"
                ></a-image>
            {/each}


            <!-- Exemple de texte 3D au-dessus des images -->
            <a-text value="AR Demo" position="0.5 0.8 0.5" color="red" width="2" align="center"></a-text>

            <!-- Exemple de forme 3D (cube) sous les images -->
            <a-box position="0.5 -0.8 0.5" width="2" height="0.2" depth="0.2" color="blue"></a-box>
        </a-entity>
    </a-scene>
</main>


<style>
    :global(body) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    main {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }
</style>
