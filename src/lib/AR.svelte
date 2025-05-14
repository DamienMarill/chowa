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
        aframeEl: Element; // Stocke la référence à l'élément a-frame pour la mise à jour
    }[] = [];
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    
    // Variables pour le système de particules
    let particles: Particle[] = [];
    let particleContainer: HTMLElement | null = null;
    let particleCount = 50; // Nombre de pétales de sakura
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
    let lastParticleId = 0;
    
    // Valeurs Z possibles pour les particules (intercalées entre les images)
    // Analyse des valeurs z existantes : 0, 0.3, 0.4, 0.5, 0.6
    // Nous créons des positions intermédiaires pour placer les particules
    let possibleZValues = [0.05, 0.15, 0.25, 0.35];
    
    // Variable pour le contrôle d'animation
    let animationFrameId: number | null = null;
    let particleAnimationId: number | null = null;

    let images: trackAsset[] = [
        { 
            name: 'background', 
            z: 0, 
            ratio: 1.55,
            clickHandler: () => console.log('Background clicked!')
        },
        { name: "pc", z: 0.2},
        { name: 'bibi', z: 0.3 },
        { name: 'whale', z: 0.3},
        { name: 'paper_2', z: 0.3, clickHandler: () => console.log('Paper 2 clicked!') },
        { name: 'paper_6', z: 0.3, clickHandler: () => console.log('Paper 6 clicked!') },
        { name: 'phone', z: 0.35},
        { name: 'book_2', z: 0.35},
        {
            name: 'girl',
            z: 0.4,
            clickHandler: () => console.log('Girl clicked!')
        },
        { name: 'paper_8', z: 0.4, clickHandler: () => console.log('Paper 8 clicked!') },
        { 
            name: 'scandal', 
            z: 0.45,
            clickHandler: () => console.log('Scandal clicked!')
        },

        { name: 'book_1', z: 0.45},
        { name: 'book_3', z: 0.5},
        { name: 'mimiqui', z: 0.5},

        //paper - tu peux personnaliser les actions pour chaque papier ici
        { name: 'paper_1', z: 0.5, clickHandler: () => console.log('Paper 1 clicked!') },
        { name: 'paper_4', z: 0.5, clickHandler: () => console.log('Paper 4 clicked!') },
        { name: 'paper_7', z: 0.5, clickHandler: () => console.log('Paper 7 clicked!') },
        { name: 'paper_3', z: 0.6, clickHandler: () => console.log('Paper 3 clicked!') },
        { name: 'paper_5', z: 0.6, clickHandler: () => console.log('Paper 5 clicked!') },
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
                
                // Initialiser le système de particules
                initParticleSystem();
            });
        }

        // Initialiser le système de détection de clics
        setupClickDetection();
        
        // Générer les hitbox initiales après que les images AR sont chargées
        // Note: Nous utilisons un délai pour s'assurer que les images sont chargées
        setTimeout(async () => {
            await generateHitboxes();
            console.log('Initial hitboxes generated:', hitboxes.length);
            
            // Démarrer la boucle d'animation pour mettre à jour les hitbox
            startHitboxUpdateLoop();
        }, 2000);
    });
    
    // Initialisation du système de particules
    function initParticleSystem() {
        // Trouver le conteneur AR où placer les particules
        const arEntity = document.querySelector('a-entity[mindar-image-target]');
        if (!arEntity) {
            console.error('AR entity not found for particle system');
            return;
        }
        
        // Créer un conteneur pour les particules
        particleContainer = document.createElement('a-entity');
        particleContainer.setAttribute('id', 'particle-container');
        arEntity.appendChild(particleContainer);
        
        // Générer les particules initiales
        generateParticles();
        
        // Démarrer l'animation des particules
        startParticleAnimation();
    }
    
    // Sélectionner aléatoirement une image de pétale
    function getRandomSakuraImage(): string {
        const randomIndex = Math.floor(Math.random() * sakuraImages.length);
        return sakuraImages[randomIndex];
    }
    
    // Création d'une particule
    function createParticle(): Particle {
        lastParticleId++;
        
        // Position aléatoire sur l'axe X (désormais légèrement plus à gauche pour laisser de la marge pour la dérive)
        const x = (Math.random() * 2 - 1.5) * 1.2; // Plus vers la gauche pour qu'elles dérivent vers la droite
        
        // Position Y au-dessus de la scène
        const y = 1.2 + Math.random() * 0.5; // 1.2 à 1.7
        
        // Profondeur Z aléatoire parmi les valeurs possibles
        const z = possibleZValues[Math.floor(Math.random() * possibleZValues.length)];
        
        // Sélectionner aléatoirement une image de pétale
        const image = getRandomSakuraImage();
        
        // Créer l'objet particule
        const particle: Particle = {
            id: lastParticleId,
            x,
            y,
            z,
            rotationX: Math.random() * 360,
            rotationY: Math.random() * 360,
            rotationZ: Math.random() * 360,
            scale: 0.01 + Math.random() * 0.09, // Taille aléatoire entre 0.05 et 0.2
            speedY: 0.0005 + Math.random() * 0.0008, // Vitesse de chute TRÈS réduite (environ 6x plus lent)
            speedX: 0.0002 + Math.random() * 0.0003, // Vitesse horizontale (dérive vers la droite)
            speedRotationX: (Math.random() - 0.5) * 0.2, // Vitesse de rotation X (plus lente)
            speedRotationY: (Math.random() - 0.5) * 0.2, // Vitesse de rotation Y (plus lente)
            speedRotationZ: (Math.random() - 0.5) * 0.2, // Vitesse de rotation Z (plus lente)
            swayFrequency: 0.2 + Math.random() * 0.4, // Fréquence de l'oscillation (plus lente)
            swayAmplitude: 0.0005 + Math.random() * 0.001, // Amplitude de l'oscillation (plus légère)
            swayOffset: Math.random() * Math.PI * 2, // Décalage pour varier le mouvement
            element: null,
            image: image
        };
        
        // Créer l'élément A-Frame correspondant
        if (particleContainer) {
            const el = document.createElement('a-plane');
            el.setAttribute('id', `particle-${particle.id}`);
            el.setAttribute('src', particle.image);
            el.setAttribute('width', '1');
            el.setAttribute('height', '1');
            el.setAttribute('scale', `${particle.scale} ${particle.scale} ${particle.scale}`);
            el.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
            el.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);
            el.setAttribute('material', 'transparent: true; alphaTest: 0.5; depthTest: true; depthWrite: false;');
            
            particleContainer.appendChild(el);
            particle.element = el;
        }
        
        return particle;
    }
    
    // Génération des particules initiales
    function generateParticles() {
        // Vider le tableau des particules
        particles = [];
        
        // Créer les nouvelles particules
        for (let i = 0; i < particleCount; i++) {
            // Répartir la position Y initiale pour éviter que toutes les particules apparaissent en même temps
            const particle = createParticle();
            particle.y = -1 + Math.random() * 3; // Répartir sur toute la hauteur de la scène
            particles.push(particle);
        }
    }
    
    // Animation des particules
    function updateParticles(deltaTime: number) {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Mettre à jour la position Y (chute)
            particle.y -= particle.speedY * deltaTime;
            
            // Mettre à jour la position X (dérive horizontale vers la droite)
            particle.x += particle.speedX * deltaTime;
            
            // Oscillation latérale (effet de flottement plus subtil)
            const swayX = Math.sin((Date.now() * 0.001 * particle.swayFrequency) + particle.swayOffset) * particle.swayAmplitude * deltaTime;
            particle.x += swayX;
            
            // Rotation
            particle.rotationX += particle.speedRotationX * deltaTime;
            particle.rotationY += particle.speedRotationY * deltaTime;
            particle.rotationZ += particle.speedRotationZ * deltaTime;
            
            // Vérifier si la particule est sortie de la scène (par le bas ou la droite)
            if (particle.y < -1.5 || particle.x > 1.5) {
                // Réinitialiser la particule en haut et à gauche
                particle.y = 1.2 + Math.random() * 0.5;
                particle.x = -1.5 + Math.random() * -0.5; // Réapparaît à gauche
                
                // Changer de type de pétale lors du recyclage pour plus de variété
                if (particle.element) {
                    const newImage = getRandomSakuraImage();
                    particle.image = newImage;
                    particle.element.setAttribute('src', newImage);
                }
            }
            
            // Mettre à jour l'élément A-Frame
            if (particle.element) {
                particle.element.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
                particle.element.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);
            }
        }
    }
    
    // Démarrer l'animation des particules
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
        }
        
        // Gérer le redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Forcer une mise à jour des hitbox au redimensionnement
            updateHitboxes();
        });
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
        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Pour chaque hitbox existante
        for (const hitbox of hitboxes) {
            // Récupérer les contours à partir de l'élément a-frame
            try {
                // Vérifier si l'élément a-frame est toujours visible
                const isVisible = (hitbox.aframeEl as any).object3D.visible;
                
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
                console.error(`Error updating hitbox for ${hitbox.imageId}:`, error);
            }
        }
    }

    // Création d'une hitbox à partir d'une image
    async function createHitboxFromImage(image: trackAsset): Promise<{imageId: string, path: Path2D, z: number, aframeEl: Element} | null> {
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

    // Fonction de détection de contour améliorée
    function detectContour(imageData: ImageData): {x: number, y: number}[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Paramètres pour un contour plus précis
        const step = 5; // Distance entre les points échantillonnés (plus petit = plus précis mais plus lourd)
        const outlinePoints: {x: number, y: number}[] = [];
        const threshold = 127; // Seuil pour considérer un pixel comme non transparent
        
        // 1. Trouver les contours par balayage en croix depuis le centre
        const directions = [
            { dx: 1, dy: 0 },   // droite
            { dx: 0, dy: 1 },   // bas
            { dx: -1, dy: 0 },  // gauche
            { dx: 0, dy: -1 },  // haut
            { dx: 1, dy: 1 },   // diagonale bas-droite
            { dx: -1, dy: 1 },  // diagonale bas-gauche
            { dx: -1, dy: -1 }, // diagonale haut-gauche
            { dx: 1, dy: -1 }   // diagonale haut-droite
        ];
        
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
                    if (data[idx + 3] > threshold) {
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
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const idx = (y * width + x) * 4;
                    const alpha = data[idx + 3];
                    
                    if (alpha > threshold) {
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
        const numRays = 36; // Nombre de rayons à lancer (plus = plus précis)
        
        for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numRays) {
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
                const isOpaque = data[idx + 3] > threshold;
                
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
        for (let x = 0; x < width; x += step) {
            for (let y = 0; y < height; y += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > threshold) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }
        
        // Bordure inférieure
        for (let x = 0; x < width; x += step) {
            for (let y = height - 1; y >= 0; y -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > threshold) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }
        
        // Bordure gauche
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > threshold) {
                    outlinePoints.push({x, y});
                    break;
                }
            }
        }
        
        // Bordure droite
        for (let y = 0; y < height; y += step) {
            for (let x = width - 1; x >= 0; x -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > threshold) {
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
        const simplifiedPoints = simplifyPolygon(sortedPoints, 5.0); // Tolérance pour la simplification
        
        return simplifiedPoints;
    }
    
    // Fonction pour trier les points dans le sens horaire
    function sortPointsClockwise(points: {x: number, y: number}[], centerX: number, centerY: number): {x: number, y: number}[] {
        return [...points].sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });
    }
    
    // Algorithme de simplification de Douglas-Peucker pour réduire le nombre de points
    function simplifyPolygon(points: {x: number, y: number}[], tolerance: number): {x: number, y: number}[] {
        if (points.length <= 2) return points;
        
        // Fonction pour calculer la distance d'un point à une ligne
        function perpendicularDistance(point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number {
            const dx = lineEnd.x - lineStart.x;
            const dy = lineEnd.y - lineStart.y;
            
            // Si la ligne est un point, retourner la distance euclidienne au point
            if (dx === 0 && dy === 0) {
                return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
            }
            
            // Distance normalisée le long de la ligne
            const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
            
            if (t < 0) {
                // Point est avant le début de la ligne
                return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
            }
            if (t > 1) {
                // Point est après la fin de la ligne
                return Math.sqrt((point.x - lineEnd.x) ** 2 + (point.y - lineEnd.y) ** 2);
            }
            
            // Point projette sur la ligne
            const projX = lineStart.x + t * dx;
            const projY = lineStart.y + t * dy;
            
            return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
        }
        
        // Implémenter l'algorithme de Douglas-Peucker récursivement
        function douglasPeucker(pts: {x: number, y: number}[], startIndex: number, endIndex: number, tolerance: number): {x: number, y: number}[] {
            if (endIndex <= startIndex + 1) {
                return [pts[startIndex]];
            }
            
            // Trouver le point avec la plus grande distance
            let maxDistance = 0;
            let maxIndex = 0;
            
            for (let i = startIndex + 1; i < endIndex; i++) {
                const distance = perpendicularDistance(pts[i], pts[startIndex], pts[endIndex]);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    maxIndex = i;
                }
            }
            
            // Si la distance max est supérieure à la tolérance, diviser et simplifier
            let result: {x: number, y: number}[] = [];
            if (maxDistance > tolerance) {
                const left = douglasPeucker(pts, startIndex, maxIndex, tolerance);
                const right = douglasPeucker(pts, maxIndex, endIndex, tolerance);
                
                result = [...left, ...right];
            } else {
                result = [pts[startIndex], pts[endIndex]];
            }
            
            return result;
        }
        
        // Appliquer l'algorithme au polygone
        const result = douglasPeucker(points, 0, points.length - 1, tolerance);
        
        // Assurons-nous que le dernier point est inclus si nécessaire
        if (result[result.length - 1].x !== points[points.length - 1].x || 
            result[result.length - 1].y !== points[points.length - 1].y) {
            result.push(points[points.length - 1]);
        }
        
        return result;
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
            // Important: appliquer la matrice de transformation de l'objet pour tenir compte de sa position actuelle
            worldPos.applyMatrix4(object3D.matrixWorld);
            
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
        // Arrêter la boucle d'animation des hitbox
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Arrêter la boucle d'animation des particules
        if (particleAnimationId !== null) {
            cancelAnimationFrame(particleAnimationId);
        }
        
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
        <a-assets>
            <!-- Précharger les images de sakura -->
            {#each sakuraImages as image, index}
                <img id="sakura-{index+1}" src="{image}" />
            {/each}
        </a-assets>
        
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
