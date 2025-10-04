/**
 * Déclarations globales pour les bibliothèques externes
 */

// Déclarations pour THREE.js (global via A-Frame)
declare namespace THREE {
    class Vector3 {
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        set(x: number, y: number, z: number): Vector3;
        copy(v: Vector3): Vector3;
        clone(): Vector3;
        applyMatrix4(matrix: Matrix4): Vector3;
        project(camera: Camera): Vector3;
        distanceTo(v: Vector3): number;
        length(): number;
        normalize(): Vector3;
    }

    class Matrix4 {
        elements: number[];
        constructor();
        identity(): Matrix4;
        copy(m: Matrix4): Matrix4;
        multiplyMatrices(a: Matrix4, b: Matrix4): Matrix4;
        getInverse(matrix: Matrix4): Matrix4;
    }

    interface Camera {
        matrixWorld: Matrix4;
        projectionMatrix: Matrix4;
        position: Vector3;
        rotation: { x: number; y: number; z: number };
        updateMatrixWorld(force?: boolean): void;
    }

    class Object3D {
        position: Vector3;
        rotation: { x: number; y: number; z: number };
        scale: Vector3;
        visible: boolean;
        parent: Object3D | null;
        children: Object3D[];
        matrixWorld: Matrix4;
        updateMatrixWorld(force?: boolean): void;
        getWorldPosition(target: Vector3): Vector3;
        getWorldQuaternion(target: unknown): unknown;
        getWorldScale(target: Vector3): Vector3;
    }

    interface WebGLRenderer {
        domElement: HTMLCanvasElement;
        autoClear: boolean;
        render(scene: unknown, camera: Camera): void;
        setSize(width: number, height: number): void;
    }
}

declare const THREE: {
    Vector3: typeof THREE.Vector3;
    Matrix4: typeof THREE.Matrix4;
    Camera: THREE.Camera;
    Object3D: typeof THREE.Object3D;
};

// Déclarations pour A-Frame
interface AFrameComponentDefinition {
    schema?: Record<string, unknown>;
    init?: () => void;
    update?: (oldData?: unknown) => void;
    tick?: (time: number, timeDelta: number) => void;
    remove?: () => void;
    pause?: () => void;
    play?: () => void;
}

declare const AFRAME: {
    registerComponent: (name: string, definition: AFrameComponentDefinition) => void;
    registerSystem: (name: string, definition: AFrameComponentDefinition) => void;
    registerGeometry: (name: string, definition: AFrameComponentDefinition) => void;
    registerShader: (name: string, definition: AFrameComponentDefinition) => void;
    registerPrimitive: (name: string, definition: AFrameComponentDefinition) => void;
};

// Extension des éléments A-Frame avec object3D
interface AFrameElement extends HTMLElement {
    object3D: THREE.Object3D;
    renderer?: THREE.WebGLRenderer;
    getAttribute(attribute: string): string | null;
    setAttribute(attribute: string, value: unknown): void;
    removeAttribute(attribute: string): void;
    components?: Record<string, unknown>;
}
