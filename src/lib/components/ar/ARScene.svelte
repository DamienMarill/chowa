<script lang="ts">
    import { onMount } from 'svelte';
    import ARAssets from './ARAssets.svelte';
    import ARMarker from './ARMarker.svelte';

    interface TrackAsset {
        name: string;
        z: number;
        ratio?: number;
        clickHandler?: () => void;
    }

    interface Props {
        images: TrackAsset[];
        sakuraImages: string[];
        assetRatio?: number;
        onTargetFound?: () => void;
        onSceneLoaded?: (arEntity: Element | null) => void;
    }

    let {
        images,
        sakuraImages,
        assetRatio,
        onTargetFound,
        onSceneLoaded
    }: Props = $props();

    onMount(() => {
        const sceneEl = document.querySelector('a-scene');
        if (sceneEl) {
            sceneEl.addEventListener('loaded', () => {
                const renderer = (sceneEl as AFrameElement).renderer;
                if (renderer) {
                    renderer.autoClear = false;
                }
                const camera = document.querySelector('a-camera');
                if (camera) {
                    camera.setAttribute('far', '10000');
                    camera.setAttribute('near', '0.01');
                }

                // Notifier que la scène est chargée et fournir l'entité AR
                if (onSceneLoaded) {
                    const arEntity = document.querySelector('a-entity[mindar-image-target]');
                    onSceneLoaded(arEntity);
                }
            });
        }
    });
</script>

<a-scene
    mindar-image="imageTargetSrc: /chowa.mind; uiScanning: #scanOverlay"
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: true"
    renderer="logarithmicDepthBuffer: true; colorManagement: true; highPerformance: true; physicallyCorrectLights: true; antialias: false; powerPreference: high-performance;"
    stats="false"
>
    <ARAssets {sakuraImages} />

    <a-camera position="0 0 0" look-controls="enabled: false" near="0.01" far="10000"></a-camera>

    <ARMarker {images} {assetRatio} {onTargetFound} />
</a-scene>
