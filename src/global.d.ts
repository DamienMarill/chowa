/**
 * Déclarations globales pour les bibliothèques externes
 */

// Déclarations pour A-Frame
declare const AFRAME: {
    registerComponent: (name: string, definition: any) => void;
    registerSystem: (name: string, definition: any) => void;
    registerGeometry: (name: string, definition: any) => void;
    registerShader: (name: string, definition: any) => void;
    registerPrimitive: (name: string, definition: any) => void;
};

// Extension des éléments A-Frame avec object3D
interface AFrameElement extends HTMLElement {
    object3D?: any;
    renderer?: any;
}

// Déclarations pour THREE.js (global via A-Frame)
declare namespace THREE {
    class Vector3 {
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        set(x: number, y: number, z: number): void;
        applyMatrix4(matrix: any): void;
        project(camera: any): { x: number; y: number; z: number };
    }

    interface Camera {
        // Interface de base pour les caméras THREE.js
    }
}

declare const THREE: {
    Vector3: typeof THREE.Vector3;
    Camera: THREE.Camera;
};
