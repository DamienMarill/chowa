<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import 'aframe';
    import 'mind-ar/dist/mindar-image-aframe.prod.js';
    let debug = false;

    // Extension de l'interface trackAsset pour inclure les handlers de clic
    interface trackAsset {
        name: string,
        z: number,
        ratio?: number,
        clickHandler?: () => void
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

    // Variables pour la gestion des hitbox
    let hitboxes: {
        imageId: string;
        path: Path2D;
        z: number;
    }[] = [];
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let images: trackAsset[] = [
        { 
            name: 'background', 
            z: 0, 
            ratio: 1.5,
            clickHandler: () => console.log('Background clicked!')
        },
        { 
            name: 'girl', 
            z: 0.4,
            clickHandler: () => console.log('Girl clicked!')
        },
        { 
            name: 'scandal', 
            z: 0.5,
            clickHandler: () => console.log('Scandal clicked!')
        },

        //paper - tu peux personnaliser les actions pour chaque papier ici
        { name: 'paper_1', z: 0.5, clickHandler: () => console.log('Paper 1 clicked!') },
        { name: 'paper_2', z: 0.3, clickHandler: () => console.log('Paper 2 clicked!') },
        { name: 'paper_3', z: 0.6, clickHandler: () => console.log('Paper 3 clicked!') },
        { name: 'paper_4', z: 0.5, clickHandler: () => console.log('Paper 4 clicked!') },
        { name: 'paper_5', z: 0.6, clickHandler: () => console.log('Paper 5 clicked!') },
        { name: 'paper_6', z: 0.3, clickHandler: () => console.log('Paper 6 clicked!') },
        { name: 'paper_7', z: 0.5, clickHandler: () => console.log('Paper 7 clicked!') },
        { name: 'paper_8', z: 0.4, clickHandler: () => console.log('Paper 8 clicked!') },
    ];

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

        // Initialiser le système de détection de clics
        setupClickDetection();
        
        // Générer les hitbox après que les images AR sont chargées
        // Note: Nous utilisons un délai pour s'assurer que les images sont chargées
        setTimeout(async () => {
            await generateHitboxes();
            console.log('Hitboxes generated:', hitboxes.length);
        }, 2000);
    });

    // Configuration du système de détection de clics
    function setupClickDetection() {
        // Créer un canvas invisible qui servira à la détection
        canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';
        document.body.appendChild(canvas);
        
        ctx = canvas.getContext('2d')!;
        
        // Ajouter un gestionnaire de clic sur la scène
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.addEventListener('click', handleSceneClick);
            
            // Si tu veux voir les hitbox en mode debug
            if (debug) {
                scene.addEventListener('loaded', () => {
                    // We'll add debug visualization in the update loop
                    scene.addEventListener('renderstart', () => {
                        // Clear the canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw hitboxes if they exist
                        if (hitboxes.length > 0 && debug) {
                            hitboxes.forEach(hitbox => {
                                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                                ctx.lineWidth = 2;
                                ctx.stroke(hitbox.path);
                            });
                        }
                    });
                });
            }
        }
        
        // Gérer le redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Nous devrons régénérer les hitbox car leurs positions peuvent avoir changé
            generateHitboxes();
        });
    }

    // Génération des hitbox à partir des images
    async function generateHitboxes() {
        hitboxes = []; // Réinitialiser les hitbox existantes
        
        for (const image of images) {
            const hitbox = await createHitboxFromImage(image);
            if (hitbox) {
                hitboxes.push(hitbox);
            }
        }
        
        // Trier les hitbox par profondeur (z) pour la détection correcte
        // Plus le z est grand, plus l'image est au premier plan
        hitboxes.sort((a, b) => b.z - a.z);
    }

    // Création d'une hitbox à partir d'une image
    async function createHitboxFromImage(image: trackAsset): Promise<{imageId: string, path: Path2D, z: number} | null> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Important pour éviter les erreurs CORS
            
            img.onload = () => {
                // Créer un canvas temporaire pour analyser l'image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                
                // Dessiner l'image sur le canvas
                tempCtx.drawImage(img, 0, 0);
                
                try {
                    // Obtenir les données de l'image
                    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
                    
                    // Détecter les contours
                    const contourPoints = detectContour(imageData);
                    
                    if (contourPoints.length > 0) {
                        // Obtenir la position et les dimensions de l'élément A-Frame
                        const aframeEl = document.querySelector(`a-image[src="/track_assets/${image.name}.png"]`);
                        if (!aframeEl) {
                            console.warn(`A-Frame element for ${image.name} not found`);
                            resolve(null);
                            return;
                        }
                        
                        // Convertir les points de contour aux coordonnées screen
                        const screenContourPoints = convertContourToScreenCoordinates(
                            contourPoints, 
                            aframeEl, 
                            img.width, 
                            img.height,
                            image.ratio ?? assetRatio
                        );
                        
                        // Créer le Path2D pour la hitbox
                        const path = new Path2D();
                        if (screenContourPoints.length > 0) {
                            path.moveTo(screenContourPoints[0].x, screenContourPoints[0].y);
                            for (let i = 1; i < screenContourPoints.length; i++) {
                                path.lineTo(screenContourPoints[i].x, screenContourPoints[i].y);
                            }
                            path.closePath();
                            
                            resolve({
                                imageId: image.name,
                                path,
                                z: image.z
                            });
                        } else {
                            console.warn(`No valid screen points for ${image.name}`);
                            resolve(null);
                        }
                    } else {
                        console.warn(`No contour points detected for ${image.name}`);
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`Error generating hitbox for ${image.name}:`, error);
                    resolve(null);
                }
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${image.name}`);
                resolve(null);
            };
            
            img.src = `/track_assets/${image.name}.png`;
        });
    }

    // Fonction de détection de contour
    function detectContour(imageData: ImageData): {x: number, y: number}[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const points: {x: number, y: number}[] = [];
        
        // Pour plus de simplicité, nous créons un contour rectangulaire 
        // qui englobe tous les pixels non transparents
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        
        // Chercher les limites des pixels non transparents
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = data[idx + 3];
                
                if (alpha > 127) { // Pixel non transparent
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // Si nous avons trouvé des pixels non transparents
        if (minX <= maxX && minY <= maxY) {
            // Créer un rectangle qui englobe la partie visible
            points.push({x: minX, y: minY});
            points.push({x: maxX, y: minY});
            points.push({x: maxX, y: maxY});
            points.push({x: minX, y: maxY});
        }
        
        return points;
    }

    // Convertir les coordonnées de contour de l'image aux coordonnées d'écran
    function convertContourToScreenCoordinates(
        contourPoints: {x: number, y: number}[],
        aframeEl: Element,
        imgWidth: number,
        imgHeight: number,
        ratio: number
    ): {x: number, y: number}[] {
        const screenPoints: {x: number, y: number}[] = [];
        
        // Obtenir les coordonnées 3D de l'élément A-Frame
        const object3D = (aframeEl as any).object3D;
        const camera = document.querySelector('a-camera')!.object3D.children[0] as THREE.Camera;
        const scene = document.querySelector('a-scene')!.object3D;
        
        // Pour chaque point du contour
        for (const point of contourPoints) {
            // Convertir les coordonnées du point de l'image (en pixels) en coordonnées normalisées (-0.5 à 0.5)
            const normalizedX = (point.x / imgWidth - 0.5) * getAssetWidth(ratio);
            const normalizedY = (0.5 - point.y / imgHeight) * getAssetHeight(ratio);
            
            // Créer un vecteur 3D temporaire pour ce point
            const worldPos = new THREE.Vector3(normalizedX, normalizedY, 0);
            object3D.localToWorld(worldPos); // Convertir en coordonnées mondiales
            
            // Projeter les coordonnées 3D en coordonnées d'écran 2D
            const screenPos = worldPos.project(camera);
            
            // Convertir les coordonnées normalisées (-1 à 1) en pixels
            const screenX = (screenPos.x + 1) / 2 * canvas.width;
            const screenY = (-screenPos.y + 1) / 2 * canvas.height;
            
            screenPoints.push({x: screenX, y: screenY});
        }
        
        return screenPoints;
    }

    // Gestionnaire de clic sur la scène
    function handleSceneClick(event: MouseEvent) {
        // Coordonnées du clic
        const x = event.clientX;
        const y = event.clientY;
        
        // Vérifier quelle hitbox a été cliquée (en commençant par celle au premier plan)
        for (const hitbox of hitboxes) {
            if (ctx.isPointInPath(hitbox.path, x, y)) {
                // Trouver l'image correspondante
                const clickedImage = images.find(img => img.name === hitbox.imageId);
                if (clickedImage && clickedImage.clickHandler) {
                    clickedImage.clickHandler();
                    console.log(`Clicked on ${hitbox.imageId} at depth ${hitbox.z}`);
                    
                    // En mode debug, mettre en évidence la hitbox cliquée
                    if (debug) {
                        const originalStrokeStyle = ctx.strokeStyle;
                        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                        ctx.lineWidth = 4;
                        ctx.stroke(hitbox.path);
                        setTimeout(() => {
                            ctx.strokeStyle = originalStrokeStyle;
                            ctx.lineWidth = 2;
                        }, 500);
                    }
                }
                // Important: arrêter après avoir trouvé la première hitbox (la plus proche de l'utilisateur)
                break;
            }
        }
    }

    onDestroy(() => {
        // Nettoyage
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.removeEventListener('click', handleSceneClick);
        }
        
        window.removeEventListener('resize', () => {});
        
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
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
