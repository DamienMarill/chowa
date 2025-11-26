<script lang="ts">
    import { ASSET_CONFIG } from '../../config/constants';

    interface TrackAsset {
        name: string;
        z: number;
        ratio?: number;
        clickHandler?: () => void;
    }

    interface Props {
        images: TrackAsset[];
        assetRatio?: number;
        onTargetFound?: () => void;
    }

    let {
        images,
        assetRatio = ASSET_CONFIG.RATIO_DEFAULT,
        onTargetFound
    }: Props = $props();

    function getAssetWidth(ratio: number): number {
        return ratio;
    }

    function getAssetHeight(ratio: number): number {
        return ASSET_CONFIG.A4_RATIO * ratio;
    }
</script>

<a-entity ontargetFound={onTargetFound} mindar-image-target="targetIndex: 0">
    {#each images as image}
        <a-image
            src={`/track_assets/${image.name}.png`}
            alt="frame"
            visible="true"
            position={`0 0 ${image.z}`}
            class={image.name}
            height={getAssetHeight(image.ratio ?? assetRatio)}
            width={getAssetWidth(image.ratio ?? 1)}
            rotation="0 0 0"
            material="transparent: true; alphaTest: 0.5; depthTest: false; depthWrite: false; opacity: 1"
            loading="lazy"
        ></a-image>
    {/each}
</a-entity>
