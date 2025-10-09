<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import 'aframe';
    import 'mind-ar/dist/mindar-image-aframe.prod.js';
    import { sortPointsClockwise, simplifyPolygon } from './geometry';
    import {
        DEBUG,
        TYPING_SPEED,
        PARTICLE_CONFIG,
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
    let showChowaFoundModal = $state(false);

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

    // Interface pour les particules
    interface Particle {
        id: number;
        x: number;
        y: number;
        z: number;
        rotationX: number;
        rotationY: number;
        rotationZ: number;
        scale: number;
        speedY: number;
        speedX: number; // Ajout d'une vitesse horizontale pour le mouvement vers la droite
        speedRotationX: number;
        speedRotationY: number;
        speedRotationZ: number;
        swayFrequency: number;
        swayAmplitude: number;
        swayOffset: number;
        element: HTMLElement | null;
        image: string; // Pour stocker le chemin de l'image utilisée
    }

    let assetRatio = $state(ASSET_CONFIG.RATIO_DEFAULT);

    function getAssetWidth(ratio: number){
        return ratio;
    }

    function getAssetHeight(ratio: number){
        return ASSET_CONFIG.A4_RATIO * ratio;
    }

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

    // Variables pour le système de particules avec pooling
    let particles = $state([] as Particle[]);
    let particlePool = $state([] as Particle[]);
    let particleContainer = $state(null as HTMLElement | null);
    // Liste des différentes images de pétales disponibles
    let sakuraImages = [
        '/sakuras/sakura1.png',
        '/sakuras/sakura2.png',
        '/sakuras/sakura3.png',
        '/sakuras/sakura4.png',
        '/sakuras/sakura5.png',
        '/sakuras/sakura6.png',
        '/sakuras/sakura7.png',
        '/sakuras/petal1.png',
        '/sakuras/petal2.png',
        '/sakuras/petal3.png',
        '/sakuras/petal4.png',
        '/sakuras/petal5.png',
        '/sakuras/petal6.png',
        '/sakuras/petal7.png',
        '/sakuras/petal8.png',
        '/sakuras/petal9.png',
        '/sakuras/petal10.png',
        '/sakuras/petal11.png',
        '/sakuras/petal12.png',
        '/sakuras/petal13.png',
        '/sakuras/petal14.png',
    ];
    let lastParticleId = $state(0);

    // Valeurs Z possibles pour les particules (intercalées entre les images)
    let possibleZValues = [0.05, 0.15, 0.25, 0.35];

    // Variable pour la boucle d'animation
    let animationFrameId = $state(null as number | null);
    let particleAnimationId = $state(null as number | null);

    // Objets réutilisables pour éviter allocations dans tick()
    const tempVector3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
    const screenPointsCache: {x: number, y: number}[] = [];

    // Tableau d'images
    const images: TrackAsset[] = [
        { name: 'background', z: 0, ratio: 1.55 },
        { name: "pc", z: 0.2, clickHandler: () => {
            showDevModal = true;
            setTimeout(startSvgCodeAnimation, 300);
        }},
        { name: 'bibi', z: 0.3, clickHandler: () => audioManager.play('cafe.mp3', {volume: 0.3}) },
        { name: 'whale', z: 0.3, clickHandler: () => audioManager.play('trivia.mp3')},
        { name: 'paper_2', z: 0.3, clickHandler: () => collectPaper('paper_2', 'angular')  },
        { name: 'paper_6', z: 0.3, clickHandler: () => collectPaper('paper_6', 'angular') },
        { name: 'phone', z: 0.35, clickHandler: () => showCreditsModal = true },
        { name: 'book_2', z: 0.35, clickHandler: () => tookBook()},
        { name: 'girl', z: 0.4, clickHandler: () => audioManager.play('Million-dreams.mp3') },
        { name: 'paper_8', z: 0.4, clickHandler: () => collectPaper('paper_8', 'laravel') },
        { name: 'scandal', z: 0.45, clickHandler: () => showScandalModal = true },
        { name: 'book_1', z: 0.45, clickHandler: () => tookBook()},
        { name: 'book_3', z: 0.5, clickHandler: () => tookBook()},
        { name: 'mimiqui', z: 0.5, clickHandler: () => audioManager.play('mimiqui.mp3', {volume: 0.3}) },
        { name: 'paper_1', z: 0.5, clickHandler: () => collectPaper('paper_1', 'tailwind') },
        { name: 'paper_4', z: 0.5, clickHandler: () => collectPaper('paper_4', 'tailwind')},
        { name: 'paper_7', z: 0.5, clickHandler: () => collectPaper('paper_7', 'angular') },
        { name: 'paper_3', z: 0.6, clickHandler: () => collectPaper('paper_3', 'laravel') },
        { name: 'paper_5', z: 0.6, clickHandler: () => collectPaper('paper_5', 'laravel') },
    ];

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

    let hasFound = false;

    function foundChowa(){
        if (!hasFound){
            showChowaFoundModal = true;
            hasFound = true;
        }
    }

    function startSvgCodeAnimation() {
        if (codeContainer) codeContainer.textContent = '';
        if (svgContainer) svgContainer.innerHTML = '';
        if (typingTimeout) clearTimeout(typingTimeout);

        let charIndex = 0;
        function typeNextChar() {
            if (charIndex < svgCode.length && codeContainer) {
                codeContainer.textContent += svgCode.charAt(charIndex);
                codeContainer.scrollTop = codeContainer.scrollHeight;
                charIndex++;
                typingTimeout = setTimeout(typeNextChar, TYPING_SPEED);
            } else if (svgContainer) {
                svgContainer.innerHTML = svgCode;
                const svgElement = svgContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('appear-animation');
                }
            }
        }
        typeNextChar();
    }

    onMount(async () => {
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
                initParticleSystem();
            });
        }

        setupClickDetection();

        setTimeout(async () => {
            await generateHitboxes();
            if (debug) {
                logger.log('Initial hitboxes generated:', hitboxes.length);
            }
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

    function initParticleSystem() {
        const arEntity = document.querySelector('a-entity[mindar-image-target]');
        if (!arEntity) {
            logger.error('AR entity not found for particle system');
            return;
        }

        particleContainer = document.createElement('a-entity');
        particleContainer.setAttribute('id', 'particle-container');
        arEntity.appendChild(particleContainer);

        generateParticles();
        startParticleAnimation();
    }

    function getRandomSakuraImage(): string {
        const randomIndex = Math.floor(Math.random() * sakuraImages.length);
        return sakuraImages[randomIndex];
    }

    function acquireParticle(): Particle {
        let particle = particlePool.pop();

        if (!particle) {
            lastParticleId++;
            const image = getRandomSakuraImage();

            particle = {
                id: lastParticleId,
                x: 0, y: 0, z: 0,
                rotationX: 0, rotationY: 0, rotationZ: 0,
                scale: 0, speedY: 0, speedX: 0,
                speedRotationX: 0, speedRotationY: 0, speedRotationZ: 0,
                swayFrequency: 0, swayAmplitude: 0, swayOffset: 0,
                element: null, image: image
            };

            if (particleContainer) {
                const el = document.createElement('a-plane');
                el.setAttribute('id', `particle-${particle.id}`);
                el.setAttribute('src', particle.image);
                el.setAttribute('width', '1');
                el.setAttribute('height', '1');
                el.setAttribute('material', 'transparent: true; alphaTest: 0.5; depthTest: true; depthWrite: false;');
                particleContainer.appendChild(el);
                particle.element = el;
            }
        }

        particle.x = (Math.random() * 2 - 1.5) * 1.2;
        particle.y = 1.2 + Math.random() * 0.5;
        particle.z = possibleZValues[Math.floor(Math.random() * possibleZValues.length)];
        particle.rotationX = Math.random() * 360;
        particle.rotationY = Math.random() * 360;
        particle.rotationZ = Math.random() * 360;
        particle.scale = 0.01 + Math.random() * 0.09;
        particle.speedY = 0.0005 + Math.random() * 0.0008;
        particle.speedX = 0.0002 + Math.random() * 0.0003;
        particle.speedRotationX = (Math.random() - 0.5) * 0.2;
        particle.speedRotationY = (Math.random() - 0.5) * 0.2;
        particle.speedRotationZ = (Math.random() - 0.5) * 0.2;
        particle.swayFrequency = 0.2 + Math.random() * 0.4;
        particle.swayAmplitude = 0.0005 + Math.random() * 0.001;
        particle.swayOffset = Math.random() * Math.PI * 2;

        if (particle.element) {
            particle.element.setAttribute('scale', `${particle.scale} ${particle.scale} ${particle.scale}`);
            particle.element.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
            particle.element.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);
        }

        return particle;
    }

    function releaseParticle(particle: Particle): void {
        particlePool.push(particle);
    }

    function generateParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_CONFIG.COUNT; i++) {
            const particle = acquireParticle();
            particle.y = -1 + Math.random() * 3;
            particles.push(particle);
        }
    }

    function updateParticles(deltaTime: number) {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.y -= particle.speedY * deltaTime;
            particle.x += particle.speedX * deltaTime;
            const swayX = Math.sin((Date.now() * 0.001 * particle.swayFrequency) + particle.swayOffset) * particle.swayAmplitude * deltaTime;
            particle.x += swayX;
            particle.rotationX += particle.speedRotationX * deltaTime;
            particle.rotationY += particle.speedRotationY * deltaTime;
            particle.rotationZ += particle.speedRotationZ * deltaTime;

            if (particle.y < -1.5 || particle.x > 1.5) {
                releaseParticle(particle);
                const newParticle = acquireParticle();
                particles[i] = newParticle;
                if (newParticle.element) {
                    const newImage = getRandomSakuraImage();
                    newParticle.image = newImage;
                    newParticle.element.setAttribute('src', newImage);
                }
            }

            if (particle.element) {
                particle.element.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
                particle.element.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);
            }
        }
    }

    function startParticleAnimation() {
        let lastTime = performance.now();
        const animateParticles = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            updateParticles(deltaTime);
            particleAnimationId = requestAnimationFrame(animateParticles);
        };
        particleAnimationId = requestAnimationFrame(animateParticles);
    }

    function setupClickDetection() {
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
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.addEventListener('click', handleSceneClick as EventListener);
        }
        window.addEventListener('resize', resizeHandler);
    }

    // Boucle d'animation pour mettre à jour en continu les hitbox
    function startHitboxUpdateLoop() {
        // Fonction pour la mise à jour des hitbox à chaque frame
        const updateLoop = () => {
            // Mettre à jour les positions des hitbox
            updateHitboxes();

            // Continuer la boucle
            animationFrameId = requestAnimationFrame(updateLoop);
        };

        // Démarrer la boucle
        animationFrameId = requestAnimationFrame(updateLoop);
    }

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
                        const screenPoints = convertContourToScreenCoordinates(contourPoints, hitbox.aframeEl, imgWidth, imgHeight, ratio);
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

    async function createHitboxFromImage(image: TrackAsset): Promise<{imageId: string, path: Path2D, z: number, aframeEl: Element} | null> {
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
                        const screenContourPoints = convertContourToScreenCoordinates(contourPoints, aframeEl, img.width, img.height, image.ratio ?? assetRatio);
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

    function detectContour(imageData: ImageData): {x: number, y: number}[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const outlinePoints: {x: number, y: number}[] = [];
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
                return [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
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
                    if (lastOpaque) outlinePoints.push({x, y});
                    break;
                }
                const idx = (y * width + x) * 4;
                const isOpaque = data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD;
                if (lastOpaque && !isOpaque) {
                    outlinePoints.push({x, y});
                    break;
                }
                lastOpaque = isOpaque;
            }
        }

        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = 0; y < height; y += 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y}); break;
                }
            }
        }
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = height - 1; y >= 0; y -= 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y}); break;
                }
            }
        }
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = 0; x < width; x += 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y}); break;
                }
            }
        }
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = width - 1; x >= 0; x -= 1) {
                if (data[(y * width + x) * 4 + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({x, y}); break;
                }
            }
        }

        if (outlinePoints.length < 6) {
            let minX = width, minY = height, maxX = 0, maxY = 0;
            for (const point of outlinePoints) {
                minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
            }
            return [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
        }

        const sortedPoints = sortPointsClockwise(outlinePoints, centerX, centerY);
        return simplifyPolygon(sortedPoints, CONTOUR_CONFIG.SIMPLIFY_TOLERANCE);
    }

    function convertContourToScreenCoordinates(
        contourPoints: {x: number, y: number}[], aframeEl: Element,
        imgWidth: number, imgHeight: number, ratio: number
    ): {x: number, y: number}[] {
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
            screenPointsCache.push({x: screenX, y: screenY});
        }
        return [...screenPointsCache];
    }

    function handleSceneClick(event: MouseEvent) {
        if (!ctx) return;
        const x = event.clientX;
        const y = event.clientY;
        for (const hitbox of hitboxes) {
            if (ctx.isPointInPath(hitbox.path, x, y)) {
                const clickedImage = images.find(img => img.name === hitbox.imageId);
                if (clickedImage && clickedImage.clickHandler) {
                    clickedImage.clickHandler();
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

    const audioManager = new AudioManager();

    onDestroy(() => {
        // Arrêter la boucle d'animation des hitbox
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        // Arrêter la boucle d'animation des particules
        if (particleAnimationId !== null) {
            cancelAnimationFrame(particleAnimationId);
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
        if (scene) scene.removeEventListener('click', handleSceneClick as EventListener);
        window.removeEventListener('resize', resizeHandler);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    });
</script>

<main>
    <div id="scanOverlay" class="hidden">
        <div class="mindar-ui-overlay mindar-ui-scanning">
            <div class="scanning">
                <div class="inner">
                    <div class="flex items-center justify-center w-full h-full opacity-60 saturate-50">
                        <img src="/chowa_little.jpg" class="w-full"/>
                    </div>
                    <div class="scanline">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <a-scene mindar-image="imageTargetSrc: /chowa.mind; uiScanning: #scanOverlay" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: true" renderer="logarithmicDepthBuffer: true; colorManagement: true; highPerformance: true; physicallyCorrectLights: true; antialias: false; powerPreference: high-performance;" stats="false">
        <a-assets>
            {#each sakuraImages as image, index}
                <img id="sakura-{index+1}" src="{image}" alt="Sakura petal texture {index + 1}" />
            {/each}
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" near="0.01" far="10000"></a-camera>
        <a-entity ontargetFound={foundChowa} mindar-image-target="targetIndex: 0">
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
            <div class="flex flex-col md:flex-row gap-4">
                <div class="mockup-code bg-base-200 text-base-content flex-1 overflow-x-auto text-sm">
                    <pre><code bind:this={codeContainer}></code></pre>
                </div>
                <div class="flex-1 flex items-center justify-center p-4 bg-base-200 rounded-lg">
                    <div bind:this={svgContainer} class="w-full h-full flex items-center justify-center"></div>
                </div>
            </div>
        </div>
    </Modal>

    <Modal bind:isOpen={showChowaFoundModal} onClose={() => showChowaFoundModal = false} title="intéragissez !" maxWidth="900px">
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
    
    @keyframes appear {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
    }

    :global(.appear-animation) {
        animation: appear 0.8s cubic-bezier(0.26, 0.53, 0.74, 1.48) forwards;
    }

    :global(.mockup-code pre code) {
        white-space: pre-wrap;
        max-height: 50vh;
        overflow-y: auto;
        line-height: 1.5;
    }

    :global(.modal-box svg) {
        width: 100%;
        height: auto;
        max-height: 250px;
    }
</style>
