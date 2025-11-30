<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { HitboxManager } from '../../ar/HitboxManager';
    import { sortPointsClockwise, simplifyPolygon } from '../../geometry';
    import { DEBUG, CONTOUR_CONFIG, ASSET_CONFIG } from '../../config/constants';
    import type { Point2D } from '../../ar/types';

    interface TrackAsset {
        name: string;
        z: number;
        ratio?: number;
        clickHandler?: () => void;
    }

    interface Props {
        images: TrackAsset[];
        assetRatio?: number;
        debug?: boolean;
    }

    let {
        images,
        assetRatio = ASSET_CONFIG.RATIO_DEFAULT,
        debug = DEBUG
    }: Props = $props();

    const dispatch = createEventDispatcher<{
        hitboxClick: { imageId: string; z: number; clickHandler?: () => void };
    }>();

    // Logger conditionnel
    const logger = {
        log: (...args: unknown[]) => debug && console.log(...args),
        warn: (...args: unknown[]) => debug && console.warn(...args),
        error: (...args: unknown[]) => console.error(...args)
    };

    // Manager de hitbox
    const hitboxManager = new HitboxManager();

    // Variables pour les hitbox
    let hitboxes = $state([] as {
        imageId: string;
        path: Path2D;
        z: number;
        aframeEl: Element;
    }[]);

    // Canvas pour la visualisation et détection
    let canvas: HTMLCanvasElement | undefined = undefined;
    let ctx: CanvasRenderingContext2D | undefined = undefined;

    // ID de l'animation
    let animationFrameId: number | null = null;

    // Debounce pour le resize
    let resizeTimeout: NodeJS.Timeout | null = null;

    // Objets réutilisables
    const tempVector3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
    const screenPointsCache: Point2D[] = [];

    /**
     * Calculer la largeur d'un asset
     */
    function getAssetWidth(ratio: number): number {
        return ratio;
    }

    /**
     * Calculer la hauteur d'un asset
     */
    function getAssetHeight(ratio: number): number {
        return ASSET_CONFIG.A4_RATIO * ratio;
    }

    /**
     * Handler de resize avec debounce
     */
    const resizeHandler = () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                updateHitboxes();
            }
        }, 150);
    };

    /**
     * Convertir les points de contour en coordonnées écran
     */
    function convertContourToScreenCoordinates(
        contourPoints: Point2D[],
        aframeEl: Element,
        imgWidth: number,
        imgHeight: number,
        ratio: number
    ): Point2D[] {
        if (!canvas || !tempVector3) return [];

        screenPointsCache.length = 0;
        const object3D = (aframeEl as AFrameElement).object3D;
        const cameraEl = document.querySelector('a-camera');
        if (!cameraEl) return [];

        const camera = (cameraEl as AFrameElement).object3D.children[0] as unknown as THREE.Camera;

        for (const point of contourPoints) {
            const normalizedX = (point.x / imgWidth - 0.5) * getAssetWidth(ratio);
            const normalizedY = (0.5 - point.y / imgHeight) * getAssetHeight(ratio);
            tempVector3.set(normalizedX, normalizedY, 0);
            tempVector3.applyMatrix4(object3D.matrixWorld);
            const screenPos = tempVector3.project(camera);
            const screenX = (screenPos.x + 1) / 2 * canvas.width;
            const screenY = (-screenPos.y + 1) / 2 * canvas.height;
            screenPointsCache.push({ x: screenX, y: screenY });
        }
        return [...screenPointsCache];
    }

    /**
     * Détecter le contour d'une image
     */
    function detectContour(imageData: ImageData): Point2D[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const outlinePoints: Point2D[] = [];
        let centerX = Math.floor(width / 2);
        let centerY = Math.floor(height / 2);
        let found = false;
        const radius = Math.min(width, height) / 4;

        for (let r = 0; r < radius && !found; r++) {
            for (let angle = 0; angle < Math.PI * 2 && !found; angle += Math.PI / 8) {
                const testX = Math.floor(centerX + r * Math.cos(angle));
                const testY = Math.floor(centerY + r * Math.sin(angle));
                if (testX >= 0 && testX < width && testY >= 0 && testY < height) {
                    const idx = (testY * width + testX) * 4;
                    if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                        centerX = testX;
                        centerY = testY;
                        found = true;
                    }
                }
            }
        }

        if (!found) {
            let minX = width, minY = height, maxX = 0, maxY = 0;
            for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
                for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
                    const idx = (y * width + x) * 4;
                    if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                        minX = Math.min(minX, x); minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                    }
                }
            }
            if (minX <= maxX && minY <= maxY) {
                return [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
            }
            return [];
        }

        for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / CONTOUR_CONFIG.NUM_RAYS) {
            let x = centerX, y = centerY, lastOpaque = true;
            const maxDistance = Math.max(width, height);
            for (let dist = 0; dist < maxDistance; dist++) {
                x = Math.floor(centerX + Math.cos(angle) * dist);
                y = Math.floor(centerY + Math.sin(angle) * dist);
                if (x < 0 || x >= width || y < 0 || y >= height) {
                    if (lastOpaque) outlinePoints.push({ x, y });
                    break;
                }
                const idx = (y * width + x) * 4;
                const isOpaque = data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD;
                if (lastOpaque && !isOpaque) {
                    outlinePoints.push({ x, y });
                    break;
                }
                lastOpaque = isOpaque;
            }
        }

        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = 0; y < height; y += 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y }); break;
                }
            }
        }
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = height - 1; y >= 0; y -= 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y }); break;
                }
            }
        }
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = 0; x < width; x += 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y }); break;
                }
            }
        }
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = width - 1; x >= 0; x -= 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y }); break;
                }
            }
        }

        if (outlinePoints.length < 6) {
            let minX = width, minY = height, maxX = 0, maxY = 0;
            for (const point of outlinePoints) {
                minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
            }
            return [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
        }

        const sortedPoints = sortPointsClockwise(outlinePoints, centerX, centerY);
        return simplifyPolygon(sortedPoints, CONTOUR_CONFIG.SIMPLIFY_TOLERANCE);
    }

    /**
     * Créer une hitbox depuis une image
     */
    async function createHitboxFromImage(image: TrackAsset): Promise<{
        imageId: string;
        path: Path2D;
        z: number;
        aframeEl: Element;
    } | null> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                tempCtx.drawImage(img, 0, 0);
                try {
                    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
                    const contourPoints = detectContour(imageData);
                    if (contourPoints.length > 0) {
                        const aframeEl = document.querySelector(`a-image[src="/track_assets/${image.name}.png"]`);
                        if (!aframeEl) {
                            logger.warn(`A-Frame element for ${image.name} not found`);
                            resolve(null);
                            return;
                        }
                        aframeEl.setAttribute('data-contour', JSON.stringify(contourPoints));
                        aframeEl.setAttribute('data-img-width', img.width.toString());
                        aframeEl.setAttribute('data-img-height', img.height.toString());
                        aframeEl.setAttribute('data-ratio', (image.ratio ?? assetRatio).toString());
                        const screenContourPoints = convertContourToScreenCoordinates(
                            contourPoints, aframeEl, img.width, img.height, image.ratio ?? assetRatio
                        );
                        const path = new Path2D();
                        if (screenContourPoints.length > 0) {
                            path.moveTo(screenContourPoints[0].x, screenContourPoints[0].y);
                            for (let i = 1; i < screenContourPoints.length; i++) {
                                path.lineTo(screenContourPoints[i].x, screenContourPoints[i].y);
                            }
                            path.closePath();
                            resolve({ imageId: image.name, path, z: image.z, aframeEl });
                        } else {
                            logger.warn(`No valid screen points for ${image.name}`);
                            resolve(null);
                        }
                    } else {
                        logger.warn(`No contour points detected for ${image.name}`);
                        resolve(null);
                    }
                } catch (error) {
                    logger.error(`Error generating hitbox for ${image.name}:`, error);
                    resolve(null);
                }
            };
            img.onerror = () => {
                logger.error(`Failed to load image: ${image.name}`);
                resolve(null);
            };
            img.src = `/track_assets/${image.name}.png`;
        });
    }

    /**
     * Générer toutes les hitboxes
     */
    async function generateHitboxes() {
        hitboxes = [];
        for (const image of images) {
            const hitbox = await createHitboxFromImage(image);
            if (hitbox) {
                hitboxes.push(hitbox);
            }
        }
        hitboxes.sort((a, b) => b.z - a.z);
    }

    /**
     * Mettre à jour toutes les hitboxes
     */
    function updateHitboxes() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const hitbox of hitboxes) {
            try {
                const isVisible = (hitbox.aframeEl as AFrameElement).object3D.visible;
                if (isVisible) {
                    const contourPointsString = hitbox.aframeEl.getAttribute('data-contour');
                    if (contourPointsString) {
                        const contourPoints = JSON.parse(contourPointsString);
                        const imgWidth = parseFloat(hitbox.aframeEl.getAttribute('data-img-width') || '0');
                        const imgHeight = parseFloat(hitbox.aframeEl.getAttribute('data-img-height') || '0');
                        const ratio = parseFloat(hitbox.aframeEl.getAttribute('data-ratio') || '1');
                        const screenPoints = convertContourToScreenCoordinates(
                            contourPoints, hitbox.aframeEl, imgWidth, imgHeight, ratio
                        );
                        const path = new Path2D();
                        if (screenPoints.length > 0) {
                            path.moveTo(screenPoints[0].x, screenPoints[0].y);
                            for (let i = 1; i < screenPoints.length; i++) {
                                path.lineTo(screenPoints[i].x, screenPoints[i].y);
                            }
                            path.closePath();
                            hitbox.path = path;
                            if (debug) {
                                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                                ctx.lineWidth = 2;
                                ctx.stroke(path);
                            }
                        }
                    }
                }
            } catch (error) {
                logger.error(`Error updating hitbox for ${hitbox.imageId}:`, error);
            }
        }
    }

    /**
     * Boucle d'animation pour mettre à jour les hitboxes
     */
    function startHitboxUpdateLoop() {
        const updateLoop = () => {
            updateHitboxes();
            animationFrameId = requestAnimationFrame(updateLoop);
        };
        animationFrameId = requestAnimationFrame(updateLoop);
    }

    /**
     * Gérer les clics sur la scène
     */
    function handleSceneClick(event: MouseEvent) {
        if (!ctx) return;
        const x = event.clientX;
        const y = event.clientY;
        for (const hitbox of hitboxes) {
            if (ctx.isPointInPath(hitbox.path, x, y)) {
                const clickedImage = images.find(img => img.name === hitbox.imageId);
                if (clickedImage) {
                    // Émettre l'événement
                    dispatch('hitboxClick', {
                        imageId: hitbox.imageId,
                        z: hitbox.z,
                        clickHandler: clickedImage.clickHandler
                    });

                    // Exécuter le handler si présent
                    if (clickedImage.clickHandler) {
                        clickedImage.clickHandler();
                    }

                    if (debug) {
                        logger.log(`Clicked on ${hitbox.imageId} at depth ${hitbox.z}`);
                        const originalStrokeStyle = ctx.strokeStyle;
                        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                        ctx.lineWidth = 4;
                        ctx.stroke(hitbox.path);
                        setTimeout(() => {
                            if (ctx) {
                                ctx.strokeStyle = originalStrokeStyle;
                                ctx.lineWidth = 2;
                            }
                        }, 500);
                    }
                }
                break;
            }
        }
    }

    /**
     * Initialiser le système de détection de clics
     */
    function setupClickDetection() {
        canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';
        if (debug) {
            canvas.style.display = 'block';
        }
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d')!;

        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.addEventListener('click', handleSceneClick as EventListener);
        }
        window.addEventListener('resize', resizeHandler);
    }

    /**
     * Nettoyer le système
     */
    function cleanup() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.removeEventListener('click', handleSceneClick as EventListener);
        }
        window.removeEventListener('resize', resizeHandler);

        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    }

    onMount(async () => {
        setupClickDetection();

        setTimeout(async () => {
            await generateHitboxes();
            if (debug) {
                logger.log('Initial hitboxes generated:', hitboxes.length);
            }
            startHitboxUpdateLoop();
        }, 2000);
    });

    onDestroy(() => {
        cleanup();
    });
</script>

<!-- Ce composant ne rend rien directement, il manipule le DOM -->
