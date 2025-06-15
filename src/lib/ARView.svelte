<script lang="ts">
</script>
<!-- a-frame scene -->
<a-scene
        vr-mode-ui="enabled: false;"
        renderer="logarithmicDepthBuffer: true;"
        embedded
        arjs="trackingMethod: best; sourceType: webcam;debugUIEnabled: false;"
>
  <!-- a-nft is the anchor that defines an Image Tracking entity -->
  <!-- on 'url' use the path to the Image Descriptors created before. -->
  <!-- the path should end with the name without the extension e.g. if file is 'pinball.fset' the path should end with 'pinball' -->
  <a-nft
          type="nft"
        url="/chowa"
          smooth="true"
          smoothCount="10"
          smoothTolerance=".01"
          smoothThreshold="5"
  >
    <!-- as a child of the a-nft entity, you can define the content to show. here's a GLTF model entity -->
  <!-- TODO: The 'gltf-model' path below is incorrect.
       It currently points to an .iset file, which is an image descriptor.
       This needs to be replaced with the path to a valid 3D model file (e.g., /my-model.gltf).
       Place the 3D model in the 'public' directory. -->
    <a-entity
          gltf-model="/chowa.iset"
            scale="5 5 5"
            position="50 150 0"
    >
    </a-entity>
  </a-nft>
  <!-- static camera that moves according to the device movemenents -->
  <a-entity camera></a-entity>
</a-scene>

