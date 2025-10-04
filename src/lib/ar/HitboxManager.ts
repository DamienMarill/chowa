/**
 * Gestionnaire pour la détection et le tracking des hitboxes AR
 */

import { CONTOUR_CONFIG, ASSET_CONFIG, CAMERA_CONFIG } from '../config/constants';
import { sortPointsClockwise, simplifyPolygon } from '../geometry';
import type { Point2D, Hitbox } from './types';

export class HitboxManager {
    private hitboxes: Hitbox[] = [];
    private screenPointsCache: Point2D[] = [];
    private tempVector3: THREE.Vector3 | null = null;
    private lastCameraPosition = { x: 0, y: 0, z: 0 };
    private lastCameraRotation = { y: 0 };

    constructor() {
        if (typeof THREE !== 'undefined') {
            this.tempVector3 = new THREE.Vector3();
        }
    }

    /**
     * Détecte le contour d'une image à partir de ses données pixel
     * @param imageData - Données de l'image (canvas ImageData)
     * @returns Points du contour simplifiés avec Douglas-Peucker
     */
    detectContour(imageData: ImageData): Point2D[] {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        const outlinePoints: Point2D[] = [];

        // Trouver le centre de l'image approximativement
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

        // Si on n'a pas trouvé de pixel non transparent, retourner un rectangle englobant
        if (!found) {
            return this.findBoundingBox(data, width, height);
        }

        // Lancer des rayons depuis le centre dans toutes les directions
        for (let i = 0; i < CONTOUR_CONFIG.NUM_RAYS; i++) {
            const angle = (i / CONTOUR_CONFIG.NUM_RAYS) * Math.PI * 2;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            let lastOpaque = false;

            for (let dist = 0; dist < Math.max(width, height); dist++) {
                const x = Math.floor(centerX + dirX * dist);
                const y = Math.floor(centerY + dirY * dist);

                if (x < 0 || x >= width || y < 0 || y >= height) {
                    break;
                }

                const idx = (y * width + x) * 4;
                const isOpaque = data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD;

                // Si on passe de opaque à transparent, on a trouvé un point de contour
                if (lastOpaque && !isOpaque) {
                    outlinePoints.push({ x, y });
                    break;
                }

                lastOpaque = isOpaque;
            }
        }

        // Parcourir les bordures pour ajouter des points supplémentaires
        this.addBorderPoints(data, width, height, outlinePoints);

        // Si trop peu de points, revenir à un rectangle englobant
        if (outlinePoints.length < 6) {
            return this.findBoundingBox(data, width, height);
        }

        // Trier les points dans le sens horaire pour créer un polygone fermé
        const sortedPoints = sortPointsClockwise(outlinePoints, centerX, centerY);

        // Simplifier le polygone avec l'algorithme de Douglas-Peucker
        const simplifiedPoints = simplifyPolygon(sortedPoints, CONTOUR_CONFIG.SIMPLIFY_TOLERANCE);

        return simplifiedPoints;
    }

    /**
     * Trouver un rectangle englobant basé sur les pixels non transparents
     */
    private findBoundingBox(data: Uint8ClampedArray, width: number, height: number): Point2D[] {
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
            return [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY }
            ];
        }

        // Par défaut, retourner un rectangle central
        const margin = 20;
        return [
            { x: margin, y: margin },
            { x: width - margin, y: margin },
            { x: width - margin, y: height - margin },
            { x: margin, y: height - margin }
        ];
    }

    /**
     * Ajouter des points sur les bordures de l'image
     */
    private addBorderPoints(
        data: Uint8ClampedArray,
        width: number,
        height: number,
        outlinePoints: Point2D[]
    ): void {
        // Bordure supérieure
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = 0; y < height; y += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y });
                    break;
                }
            }
        }

        // Bordure inférieure
        for (let x = 0; x < width; x += CONTOUR_CONFIG.STEP) {
            for (let y = height - 1; y >= 0; y -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y });
                    break;
                }
            }
        }

        // Bordure gauche
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = 0; x < width; x += 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y });
                    break;
                }
            }
        }

        // Bordure droite
        for (let y = 0; y < height; y += CONTOUR_CONFIG.STEP) {
            for (let x = width - 1; x >= 0; x -= 1) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > CONTOUR_CONFIG.ALPHA_THRESHOLD) {
                    outlinePoints.push({ x, y });
                    break;
                }
            }
        }
    }

    /**
     * Convertir les points du contour en coordonnées écran
     */
    convertToScreenCoordinates(
        aframeEl: HTMLElement,
        contourPoints: Point2D[],
        imgWidth: number,
        imgHeight: number,
        ratio: number
    ): Point2D[] {
        if (!this.tempVector3) return [];

        this.screenPointsCache.length = 0;

        const object3D = (aframeEl as AFrameElement).object3D;
        const cameraEl = document.querySelector('a-camera');
        if (!cameraEl) return [];

        const camera = (cameraEl as AFrameElement).object3D.children[0] as unknown as THREE.Camera;

        // Réutiliser le même Vector3 pour tous les points
        for (const point of contourPoints) {
            const normalizedX = (point.x / imgWidth - 0.5) * this.getAssetWidth(ratio);
            const normalizedY = -(point.y / imgHeight - 0.5) * this.getAssetHeight(ratio);

            this.tempVector3.set(normalizedX, normalizedY, 0);
            this.tempVector3.applyMatrix4(object3D.matrixWorld);
            this.tempVector3.project(camera);

            const screenX = (this.tempVector3.x + 1) * window.innerWidth / 2;
            const screenY = -(this.tempVector3.y - 1) * window.innerHeight / 2;

            this.screenPointsCache.push({ x: screenX, y: screenY });
        }

        return this.screenPointsCache;
    }

    /**
     * Créer une hitbox pour un élément A-Frame
     */
    createHitbox(aframeEl: HTMLElement, image: string): Hitbox | null {
        const contourPoints = this.loadContourFromElement(aframeEl);
        if (!contourPoints || contourPoints.length === 0) return null;

        return {
            aframeEl,
            screenPoints: [],
            image
        };
    }

    /**
     * Charger les points de contour depuis l'attribut data
     */
    private loadContourFromElement(aframeEl: HTMLElement): Point2D[] | null {
        const contourData = aframeEl.getAttribute('data-contour');
        if (!contourData) return null;

        try {
            return JSON.parse(contourData);
        } catch {
            return null;
        }
    }

    /**
     * Mettre à jour toutes les hitboxes
     */
    updateHitboxes(): void {
        for (const hitbox of this.hitboxes) {
            const contourPoints = this.loadContourFromElement(hitbox.aframeEl);
            if (!contourPoints) continue;

            const ratio = ASSET_CONFIG.A4_RATIO;
            const imgWidth = 512; // Largeur par défaut
            const imgHeight = 512;

            hitbox.screenPoints = this.convertToScreenCoordinates(
                hitbox.aframeEl,
                contourPoints,
                imgWidth,
                imgHeight,
                ratio
            );
        }
    }

    /**
     * Vérifier si la caméra a bougé significativement
     */
    shouldUpdateHitboxes(): boolean {
        const camera = document.querySelector('a-camera');
        if (!camera) return false;

        const cameraObj = (camera as AFrameElement).object3D;
        const pos = cameraObj.position;
        const rot = cameraObj.rotation;

        const dx = pos.x - this.lastCameraPosition.x;
        const dy = pos.y - this.lastCameraPosition.y;
        const dz = pos.z - this.lastCameraPosition.z;
        const dr = Math.abs(rot.y - this.lastCameraRotation.y);

        const moved = Math.sqrt(dx * dx + dy * dy + dz * dz) > CAMERA_CONFIG.MOVE_THRESHOLD || dr > 0.01;

        if (moved) {
            this.lastCameraPosition = { x: pos.x, y: pos.y, z: pos.z };
            this.lastCameraRotation = { y: rot.y };
        }

        return moved;
    }

    /**
     * Obtenir la largeur d'un asset en fonction du ratio
     */
    private getAssetWidth(ratio: number): number {
        return ratio;
    }

    /**
     * Obtenir la hauteur d'un asset en fonction du ratio
     */
    private getAssetHeight(ratio: number): number {
        return 1 / ratio;
    }

    /**
     * Définir les hitboxes
     */
    setHitboxes(hitboxes: Hitbox[]): void {
        this.hitboxes = hitboxes;
    }

    /**
     * Obtenir toutes les hitboxes
     */
    getHitboxes(): Hitbox[] {
        return this.hitboxes;
    }
}
