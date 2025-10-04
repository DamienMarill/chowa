<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import 'aframe';
    import 'mind-ar/dist/mindar-image-aframe.prod.js';
    import { sortPointsClockwise, simplifyPolygon } from './geometry';
    import {
        DEBUG,
        TYPING_SPEED,
        CONTOUR_CONFIG,
        ASSET_CONFIG,
        CAMERA_CONFIG
    } from './config/constants';

    // Stores
    import { gameState } from './stores/gameState.svelte';

    // Managers
    import { AudioManager } from './audio/AudioManager';

    // Composants UI
    import PaperModal from './ui/PaperModal.svelte';
    import ParticleLayer from './ui/ParticleLayer.svelte';
    import Modal from './ui/Modal.svelte';

    let debug = $state(DEBUG);

    // Logger conditionnel basé sur DEBUG
    const logger = {
        log: (...args: unknown[]) => debug && console.log(...args),
        warn: (...args: unknown[]) => debug && console.warn(...args),
        error: (...args: unknown[]) => console.error(...args) // Toujours logger les erreurs
    };

    let showPaperModal = $state(false);
    let showScandalModal = $state(false);
    let showCreditsModal = $state(false);
    let showDevModal = $state(false);

    // Variables pour l'animation SVG
    let codeContainer = $state(undefined as HTMLElement | undefined);
    let svgContainer = $state(undefined as HTMLElement | undefined);
    let typingTimeout = $state(undefined as NodeJS.Timeout | undefined);



    // Extension de l'interface trackAsset pour inclure les handlers de clic
    interface TrackAsset {
        name: string;
        z: number;
        ratio?: number;
        clickHandler?: () => void;
    }



    let assetRatio = $state(ASSET_CONFIG.RATIO_DEFAULT);

    function getAssetWidth(ratio: number){
        return ratio;
    }

    function getAssetHeight(ratio: number){
        return ASSET_CONFIG.A4_RATIO * ratio;
    }

    // Variables pour stocker les références aux objets AR
    // let container = $state(undefined as HTMLElement | undefined); // TODO: À utiliser ou supprimer

    // Variables pour la gestion des hitbox
    let hitboxes = $state([] as {
        imageId: string;
        path: Path2D;
        z: number;
        aframeEl: Element;
    }[]);
    let canvas = $state(undefined as HTMLCanvasElement | undefined);
    let ctx = $state(undefined as CanvasRenderingContext2D | undefined);

    // Debounce pour le resize handler
    let resizeTimeout: NodeJS.Timeout | null = null;
    
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
        }, 150); // Debounce de 150ms
    };



    // Variable pour la boucle d'animation hitbox
    let animationFrameId = $state(null as number | null);

    // Variables pour throttling hitbox
    let lastCameraPosition = $state({ x: 0, y: 0, z: 0 });
    let lastCameraRotation = $state({ x: 0, y: 0, z: 0 });

    // Objets réutilisables pour éviter allocations dans tick()
    const tempVector3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
    const screenPointsCache: {x: number, y: number}[] = [];

    // Tableau d'images - les fonctions clickHandler ne sont pas réactives donc pas besoin de $state
    const images: TrackAsset[] = [
        {
            name: 'background',
            z: 0,
            ratio: 1.55
        },
        { name: "pc", z: 0.2, clickHandler: () => {
            showDevModal = true;
            // Démarrer l'animation lorsque la modal s'ouvre
            setTimeout(startSvgCodeAnimation, 300); // Petit délai pour que la modal s'ouvre d'abord
        }},
        { name: 'bibi', z: 0.3, clickHandler: () => audioManager.play('cafe.mp3', {volume: 0.3}) },
        { name: 'whale', z: 0.3, clickHandler: () => audioManager.play('trivia.mp3')},
        { name: 'paper_2', z: 0.3, clickHandler: () => collectPaper('paper_2', 'angular')  },
        { name: 'paper_6', z: 0.3, clickHandler: () => collectPaper('paper_6', 'angular') },
        { name: 'phone', z: 0.35, clickHandler: () => showCreditsModal = true },
        { name: 'book_2', z: 0.35, clickHandler: () => tookBook()},
        {
            name: 'girl',
            z: 0.4,
            clickHandler: () => audioManager.play('Million-dreams.mp3'),
        },
        { name: 'paper_8', z: 0.4, clickHandler: () => collectPaper('paper_8', 'laravel') },
        {
            name: 'scandal',
            z: 0.45,
            clickHandler: () => showScandalModal = true,
        },
        { name: 'book_1', z: 0.45, clickHandler: () => tookBook()},
        { name: 'book_3', z: 0.5, clickHandler: () => tookBook()},
        { name: 'mimiqui', z: 0.5, clickHandler: () => {
            audioManager.play('mimiqui.mp3', {volume: 0.3});
        }},

        //paper - tu peux personnaliser les actions pour chaque papier ici
        { name: 'paper_1', z: 0.5, clickHandler: () => collectPaper('paper_1', 'tailwind') },
        { name: 'paper_4', z: 0.5, clickHandler: () => collectPaper('paper_4', 'tailwind')},
        { name: 'paper_7', z: 0.5, clickHandler: () => collectPaper('paper_7', 'angular') },
        { name: 'paper_3', z: 0.6, clickHandler: () => collectPaper('paper_3', 'laravel') },
        { name: 'paper_5', z: 0.6, clickHandler: () => collectPaper('paper_5', 'laravel') },
    ];

    // Code SVG de l'oiseau kawaii
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <!-- Corps principal -->
    <ellipse cx="200" cy="220" rx="100" ry="80" fill="#fff4d6"/>
    <!-- Aile -->
    <path d="M220 200 C250 180 240 160 210 190" fill="#ffeba3" stroke="#ffeba3" stroke-width="15" stroke-linecap="round"/>
    <!-- Petite queue -->
    <path d="M290 200 C310 220 300 240 280 230" fill="#ffeba3"/>
    <!-- Tête -->
    <circle cx="140" cy="160" r="60" fill="#fff4d6"/>
    <!-- Bec -->
    <path d="M100 160 L80 165 L100 170 Z" fill="#ffb347"/>
    <!-- Œil -->
    <circle cx="120" cy="150" r="10" fill="#333"/>
    <!-- Reflet de l'œil -->
    <circle cx="125" cy="145" r="3" fill="white"/>
    <!-- Joue rose -->
    <circle cx="130" cy="165" r="10" fill="#ffcece" opacity="0.6"/>
    <!-- Pattes -->
    <path d="M180 290 L200 310" stroke="#ffb347" stroke-width="8" stroke-linecap="round"/>
    <path d="M200 290 L220 310" stroke="#ffb347" stroke-width="8" stroke-linecap="round"/>
    <!-- Petites bulles décoratives -->
    <circle cx="90" cy="120" r="4" fill="#fff4d6"/>
    <circle cx="100" cy="100" r="3" fill="#fff4d6"/>
    <circle cx="80" cy="140" r="3" fill="#fff4d6"/>
    <!-- Effet brillant -->
    <path d="M180 100 L190 90 M185 85 L195 95" stroke="#fffae5" stroke-width="3" stroke-linecap="round"/>
</svg>`;

    // Fonction pour démarrer l'animation d'écriture
    function startSvgCodeAnimation() {
        // Réinitialiser le conteneur de code et SVG
        if (codeContainer) codeContainer.textContent = '';
        if (svgContainer) svgContainer.innerHTML = '';

        // Nettoyer tout timeout existant
        if (typingTimeout) clearTimeout(typingTimeout);

        // Animation d'écriture caractère par caractère
        let charIndex = 0;

        function typeNextChar() {
            if (charIndex < svgCode.length && codeContainer) {
                // Ajouter le caractère suivant
                codeContainer.textContent += svgCode.charAt(charIndex);
                // Faire défiler vers le bas pour rester au courant du texte
                codeContainer.scrollTop = codeContainer.scrollHeight;
                charIndex++;
                // Programmer le prochain caractère
                typingTimeout = setTimeout(typeNextChar, TYPING_SPEED);
            } else if (svgContainer) {
                // Animation terminée, afficher le SVG
                svgContainer.innerHTML = svgCode;
                // Ajouter une classe d'animation pour faire apparaître le SVG avec un effet
                const svgElement = svgContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('appear-animation');
                }
            }
        }

        // Démarrer l'animation
        typeNextChar();
    }

    onMount(async () => {
        // Accéder au système renderer d'A-Frame pour modifier les paramètres de clipping
        const sceneEl = document.querySelector('a-scene');

        // Attendre que la scène soit chargée pour modifier les paramètres
        if (sceneEl) {
            sceneEl.addEventListener('loaded', () => {
                // Accéder au renderer et ajuster les paramètres
                const renderer = (sceneEl as AFrameElement).renderer;
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

        // Générer les hitbox initiales après que les images AR sont chargées
        // Note: Nous utilisons un délai pour s'assurer que les images sont chargées
        setTimeout(async () => {
            await generateHitboxes();
            if (debug) {
                logger.log('Initial hitboxes generated:', hitboxes.length);
            }

            // Démarrer la boucle d'animation pour mettre à jour les hitbox
            startHitboxUpdateLoop();
        }, 2000);
    });

    function collectPaper(name: string, framework: string){
        let element = document.querySelector('.'+name);
        if (debug) {
            logger.log(element);
        }
        if (element?.getAttribute('visible')){
            element?.setAttribute('visible', 'false');
            gameState.collectPaper(framework);
            audioManager.play('paper.mp3');
            if (gameState.papers[framework] === 0){
                gameState.selectPaper(framework);
                showPaperModal = true;
            }
        }
    }

    function tookBook(){
        let sounds = ['book1.mp3', 'book2.mp3', 'book3.mp3'];
        let randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        audioManager.play(randomSound);
    }



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
            scene.addEventListener('click', handleSceneClick as EventListener);
        }

        // Gérer le redimensionnement de la fenêtre
        window.addEventListener('resize', resizeHandler);
    }

    /**
     * Boucle d'animation optimisée avec throttling basé sur le mouvement de la caméra
     * Ne met à jour les hitbox que si la caméra a bougé significativement
     */
    function startHitboxUpdateLoop() {
        let cameraCache: AFrameElement | null = null;
        
        const updateLoop = () => {
            // Cache de la caméra pour éviter querySelector répété
            if (!cameraCache) {
                cameraCache = document.querySelector('a-camera') as AFrameElement;
            }

            if (cameraCache) {
                const cameraObj = cameraCache.object3D;
                const pos = cameraObj.position;
                const rot = cameraObj.rotation;

                // Calculer la distance de mouvement
                const dx = pos.x - lastCameraPosition.x;
                const dy = pos.y - lastCameraPosition.y;
                const dz = pos.z - lastCameraPosition.z;
                const dr = Math.abs(rot.y - lastCameraRotation.y); // Rotation Y principalement

                const moved = Math.sqrt(dx * dx + dy * dy + dz * dz) > CAMERA_CONFIG.MOVE_THRESHOLD || dr > 0.01;

                if (moved) {
                    updateHitboxes();
                    lastCameraPosition = { x: pos.x, y: pos.y, z: pos.z };
                    lastCameraRotation = { x: rot.x, y: rot.y, z: rot.z };
                }
            }

            animationFrameId = requestAnimationFrame(updateLoop);
        };

        animationFrameId = requestAnimationFrame(updateLoop);
    }

    // Génération initiale des hitbox à partir des images
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

    // Mise à jour des positions des hitbox existantes
    function updateHitboxes() {
        if (!ctx || !canvas) return;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pour chaque hitbox existante
        for (const hitbox of hitboxes) {
            // Récupérer les contours à partir de l'élément a-frame
            try {
                // Vérifier si l'élément a-frame est toujours visible
                const isVisible = (hitbox.aframeEl as AFrameElement).object3D.visible;

                if (isVisible) {
                    // Obtenir les contours de base (stockés comme attribut de données)
                    const contourPointsString = hitbox.aframeEl.getAttribute('data-contour');
                    if (contourPointsString) {
                        const contourPoints = JSON.parse(contourPointsString);

                        // Récupérer les dimensions de l'image
                        const imgWidth = parseFloat(hitbox.aframeEl.getAttribute('data-img-width') || '0');
                        const imgHeight = parseFloat(hitbox.aframeEl.getAttribute('data-img-height') || '0');
                        const ratio = parseFloat(hitbox.aframeEl.getAttribute('data-ratio') || '1');

                        // Convertir les contours en coordonnées d'écran
                        const screenPoints = convertContourToScreenCoordinates(
                            contourPoints,
                            hitbox.aframeEl,
                            imgWidth,
                            imgHeight,
                            ratio
                        );

                        // Créer un nouveau Path2D
                        const path = new Path2D();
                        if (screenPoints.length > 0) {
                            path.moveTo(screenPoints[0].x, screenPoints[0].y);
                            for (let i = 1; i < screenPoints.length; i++) {
                                path.lineTo(screenPoints[i].x, screenPoints[i].y);
                            }
                            path.closePath();

                            // Mettre à jour le chemin de la hitbox
                            hitbox.path = path;

                            // Dessiner la hitbox si en mode debug
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
     * Crée une hitbox interactive à partir d'une image en détectant ses contours
     * @param image - Asset à transformer en hitbox cliquable
     * @returns Hitbox avec son chemin 2D, profondeur z et référence A-Frame, ou null si erreur
     */
    async function createHitboxFromImage(image: TrackAsset): Promise<{imageId: string, path: Path2D, z: number, aframeEl: Element} | null> {
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
                            logger.warn(`A-Frame element for ${image.name} not found`);
                            resolve(null);
                            return;
                        }

                        // Stocker les contours originaux et les dimensions de l'image comme attributs de données
                        aframeEl.setAttribute('data-contour', JSON.stringify(contourPoints));
                        aframeEl.setAttribute('data-img-width', img.width.toString());
                        aframeEl.setAttribute('data-img-height', img.height.toString());
                        aframeEl.setAttribute('data-ratio', (image.ratio ?? assetRatio).toString());

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
                                z: image.z,
                                aframeEl
                            });
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
     * Détecte le contour d'une image en utilisant ray casting et border scanning
     * @param imageData - Données de l'image à analyser
     * @returns Points du contour simplifiés avec Douglas-Peucker
     * @complexity O(n × m) où n = largeur, m = hauteur de l'image
     */
    function detectContour(imageData: ImageData): {x: number, y: number}[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // Paramètres pour un contour plus précis
        const outlinePoints: {x: number, y: number}[] = [];

        // 1. Trouver les contours par balayage en croix depuis le centre
        // const directions = [ // TODO: Implémenter balayage directionnel ou supprimer
        //     { dx: 1, dy: 0 },   // droite
        //     { dx: 0, dy: 1 },   // bas
        //     { dx: -1, dy: 0 },  // gauche
        //     { dx: 0, dy: -1 },  // haut
        //     { dx: 1, dy: 1 },   // diagonale bas-droite
        //     { dx: -1, dy: 1 },  // diagonale bas-gauche
        //     { dx: -1, dy: -1 }, // diagonale haut-gauche
        //     { dx: 1, dy: -1 }   // diagonale haut-droite
        // ];

        // 2. Trouver le centre de l'image approximativement
        let centerX = Math.floor(width / 2);
        let centerY = Math.floor(height / 2);

        // Ajuster le centre si besoin pour être sur un pixel non transparent
        let found = false;
        const radius = Math.min(width, height) / 4;

        // Chercher autour du centre un pixel non transparent
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

        // Si on n'a pas trouvé de pixel non transparent, retourner un rectangle englobant de base
        if (!found) {
            let minX = width;
            let minY = height;
            let maxX = 0;
            let maxY = 0;

            // Chercher les limites des pixels non transparents
            for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
                for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
                    const idx = (y * width + x) * 4;
                    const alpha = data[idx + 3];

                    if (alpha > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
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
                return [
                    {x: minX, y: minY},
                    {x: maxX, y: minY},
                    {x: maxX, y: maxY},
                    {x: minX, y: maxY}
                ];
            }

            return [];
        }

        // 3. Pour chaque direction, lancer des rayons depuis le centre
        for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / CONTOUR_CONFIG.NUM_RAYS) {
            let x = centerX;
            let y = centerY;
            let lastOpaque = true;

            // Étendre le rayon jusqu'à atteindre la bordure ou un pixel transparent
            const maxDistance = Math.max(width, height);
            for (let dist = 0; dist < maxDistance; dist++) {
                x = Math.floor(centerX + Math.cos(angle) * dist);
                y = Math.floor(centerY + Math.sin(angle) * dist);

                // Vérifier les limites
                if (x < 0 || x >= width || y < 0 || y >= height) {
                    // Ajouter le dernier point avant de sortir des limites
                    if (lastOpaque) {
                        outlinePoints.push({x, y});
                    }
                    break;
                }

                const idx = (y * width + x) * 4;
                const isOpaque = data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD;

                // Si on passe de opaque à transparent, on a trouvé un point de contour
                if (lastOpaque && !isOpaque) {
                    outlinePoints.push({x, y});
                    break;
                }

                lastOpaque = isOpaque;
            }
        }

        // 4. Parcourir les bordures pour ajouter des points supplémentaires
        // Bordure supérieure
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = 0; y < height; y += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }

        // Bordure inférieure
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = height - 1; y >= 0; y -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }

        // Bordure gauche
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = 0; x < width; x += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }

        // Bordure droite
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = width - 1; x >= 0; x -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }

        // 5. Si trop peu de points, revenir à un rectangle englobant
        if (outlinePoints.length < 6) {
            let minX = width;
            let minY = height;
            let maxX = 0;
            let maxY = 0;

            for (const point of outlinePoints) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }

            return [
                {x: minX, y: minY},
                {x: maxX, y: minY},
                {x: maxX, y: maxY},
                {x: minX, y: maxY}
            ];
        }

        // 6. Trier les points dans le sens horaire pour créer un polygone fermé
        const sortedPoints = sortPointsClockwise(outlinePoints, centerX, centerY);

        // 7. Simplifier le polygone avec l'algorithme de Douglas-Peucker
        const simplifiedPoints = simplifyPolygon(sortedPoints, CONTOUR_CONFIG.SIMPLIFY_TOLERANCE);

        return simplifiedPoints;
    }


    /**
     * Convertit les coordonnées du contour de l'image vers les coordonnées d'écran 2D
     * en utilisant la projection 3D → 2D de la caméra A-Frame
     * Optimisé avec réutilisation d'objets Vector3 pour éviter allocations
     * @param contourPoints - Points du contour en coordonnées image (pixels)
     * @param aframeEl - Élément A-Frame contenant l'objet 3D
     * @param imgWidth - Largeur de l'image source en pixels
     * @param imgHeight - Hauteur de l'image source en pixels
     * @param ratio - Ratio d'affichage de l'asset AR
     * @returns Points du contour en coordonnées écran (pixels)
     */
    function convertContourToScreenCoordinates(
        contourPoints: {x: number, y: number}[],
        aframeEl: Element,
        imgWidth: number,
        imgHeight: number,
        ratio: number
    ): {x: number, y: number}[] {
        if (!canvas || !tempVector3) return [];

        // Réinitialiser le cache au lieu de créer un nouveau tableau
        screenPointsCache.length = 0;

        const object3D = (aframeEl as AFrameElement).object3D;
        const cameraEl = document.querySelector('a-camera');
        if (!cameraEl) return [];

        const camera = (cameraEl as AFrameElement).object3D.children[0] as unknown as THREE.Camera;

        // Réutiliser le même Vector3 pour tous les points
        for (const point of contourPoints) {
            const normalizedX = (point.x / imgWidth - 0.5) * getAssetWidth(ratio);
            const normalizedY = (0.5 - point.y / imgHeight) * getAssetHeight(ratio);

            // Réutiliser tempVector3 au lieu de créer un nouveau Vector3
            tempVector3.set(normalizedX, normalizedY, 0);
            tempVector3.applyMatrix4(object3D.matrixWorld);

            // Projeter en 2D
            const screenPos = tempVector3.project(camera);

            // Convertir en pixels
            const screenX = (screenPos.x + 1) / 2 * canvas.width;
            const screenY = (-screenPos.y + 1) / 2 * canvas.height;

            screenPointsCache.push({x: screenX, y: screenY});
        }

        // Retourner une copie pour éviter mutations externes
        return [...screenPointsCache];
    }

    // Gestionnaire de clic sur la scène
    function handleSceneClick(event: MouseEvent) {
        if (!ctx) return;

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
                    if (debug) {
                        logger.log(`Clicked on ${hitbox.imageId} at depth ${hitbox.z}`);
                    }

                    // En mode debug, mettre en évidence la hitbox cliquée
                    if (debug && ctx) {
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
                // Important: arrêter après avoir trouvé la première hitbox (la plus proche de l'utilisateur)
                break;
            }
        }
    }


    // Instance AudioManager
    const audioManager = new AudioManager();


        onDestroy(() => {
        // Arrêter la boucle d'animation des hitbox
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        // Nettoyer le timeout de resize
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        // Nettoyer le timeout de typage
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Nettoyage des event listeners
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.removeEventListener('click', handleSceneClick as EventListener);
        }

        window.removeEventListener('resize', resizeHandler);

        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    });
</script>

<main>
    <a-scene mindar-image="imageTargetSrc: /chowa.mind;" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" renderer="logarithmicDepthBuffer: true; colorManagement: true; highPerformance: true; physicallyCorrectLights: true; antialias: false; powerPreference: high-performance;" stats="false">
        <a-assets></a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" near="0.01" far="10000"></a-camera>
        <a-entity mindar-image-target="targetIndex: 0">
            <!-- Image originale -->
            {#each images as image}
                <a-image src={`/track_assets/${image.name}.png`} alt="frame"
                         visible="true"
                         position={`0 0 ${image.z}`}
                         class={image.name}
                         height={getAssetHeight(image.ratio ?? assetRatio)}
                         width={getAssetWidth(image.ratio ?? 1)} rotation="0 0 0"
                         material="transparent: true; alphaTest: 0.5; depthTest: false; depthWrite: false; opacity: 1"
                         loading="lazy"
                ></a-image>
            {/each}
        </a-entity>
    </a-scene>

    <PaperModal bind:isOpen={showPaperModal} onClose={() => showPaperModal = false} />

    <Modal bind:isOpen={showScandalModal} onClose={() => showScandalModal = false} maxWidth="400px">
        <div class="flex justify-center flex-col gap-4 items-center">
            <img src="/divers/Scandal_hello.jpg" class="w-44 rounded" alt="scandal collected">
            <audio controls>
                <source src="/divers/departure.mp3" type="audio/mpeg">
            </audio>
        </div>
    </Modal>

    <Modal bind:isOpen={showCreditsModal} onClose={() => showCreditsModal = false} title="Crédits">
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

    <Modal bind:isOpen={showDevModal} onClose={() => showDevModal = false} title="SVG Animation Kawaii" maxWidth="900px">
        <div class="flex flex-col space-y-4">
            <!-- Conteneur pour le code et l'aperçu -->
            <div class="flex flex-col md:flex-row gap-4">
                <!-- Zone de code avec animation de typage -->
                <div class="mockup-code bg-base-200 text-base-content flex-1 overflow-x-auto text-sm">
                    <pre><code bind:this={codeContainer}></code></pre>
                </div>
                
                <!-- Aperçu du SVG -->
                <div class="flex-1 flex items-center justify-center p-4 bg-base-200 rounded-lg">
                    <div bind:this={svgContainer} class="w-full h-full flex items-center justify-center"></div>
                </div>
            </div>
        </div>
    </Modal>

    

    <!-- Système de particules -->
    <ParticleLayer />
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
    
    /* Styles pour l'animation SVG */
    @keyframes appear {
        0% {
            opacity: 0;
            transform: scale(0.8);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    :global(.appear-animation) {
        animation: appear 0.8s cubic-bezier(0.26, 0.53, 0.74, 1.48) forwards;
    }

    /* Style spécifique pour la zone de code */
    :global(.mockup-code pre code) {
        white-space: pre-wrap;
        max-height: 50vh;
        overflow-y: auto;
        line-height: 1.5;
    }

    /* Style pour le conteneur SVG */
    :global(.modal-box svg) {
        width: 100%;
        height: auto;
        max-height: 250px;
    }
</style>
