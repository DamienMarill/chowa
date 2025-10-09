# Phase 2 - Plan de Décomposition

## 📊 Analyse Fichier AR.svelte (1263 lignes)

### Structure Actuelle

**Responsabilités identifiées**:
1. 🎮 **Game State** - Papers, collection, scoring
2. 🎨 **Particle System** - Sakura particles, pooling, animation
3. 🎯 **Hitbox Detection** - Contour detection, click handling
4. 🔊 **Audio Management** - Sound pooling, playback
5. 🖼️ **UI Modals** - Credits, paper info, dev tools
6. 📝 **SVG Animation** - Code typing effect
7. 🎬 **AR Scene** - A-Frame setup, camera tracking

### Modules à Créer

```
src/lib/
├── stores/
│   ├── gameState.svelte.ts       # Papers, scoring, collection
│   ├── particleState.svelte.ts   # Particle management
│   └── audioState.svelte.ts      # Audio instances tracking
│
├── ar/
│   ├── HitboxManager.ts          # Contour detection + hitbox
│   ├── CameraTracker.ts          # Camera movement tracking
│   └── SceneSetup.ts             # A-Frame scene initialization
│
├── particles/
│   ├── ParticlePool.ts           # Object pooling
│   ├── ParticleAnimator.ts       # Animation loop
│   └── types.ts                  # Particle interface
│
├── audio/
│   ├── AudioManager.ts           # Pooling + playback
│   └── types.ts                  # Audio options
│
├── ui/
│   ├── Modal.svelte              # Modal générique
│   ├── PaperModal.svelte         # Info paper
│   ├── CreditsModal.svelte       # Credits
│   ├── DevModal.svelte           # Dev tools
│   └── SvgCodeAnimation.svelte   # SVG typing
│
└── components/
    ├── ARScene.svelte            # Scene A-Frame principale
    ├── ParticleLayer.svelte      # Overlay particules
    └── HitboxLayer.svelte        # Debug hitboxes
```

## 🎯 Phase 2.1: Stores Svelte 5 (Jour 1)

### Store 1: gameState.svelte.ts

```typescript
import { DEFAULT_PAPERS } from '../config/constants';

interface Paper {
    name: string;
    count: number;
}

interface GameState {
    papers: Record<string, number>;
    selectedPaper: string | null;
    totalCollected: number;
}

// State avec runes
let papers = $state({ ...DEFAULT_PAPERS });
let selectedPaper = $state<string | null>(null);

// Derived
const totalCollected = $derived(
    Object.values(papers).reduce((sum, count) => sum + count, 0)
);

// Actions
export function collectPaper(paperName: string) {
    if (papers[paperName] !== undefined) {
        papers[paperName]++;
    }
}

export function selectPaper(paperName: string) {
    selectedPaper = paperName;
}

export function clearSelection() {
    selectedPaper = null;
}

export const gameState = {
    get papers() { return papers; },
    get selectedPaper() { return selectedPaper; },
    get totalCollected() { return totalCollected; },
    collectPaper,
    selectPaper,
    clearSelection
};
```

### Store 2: particleState.svelte.ts

```typescript
import type { Particle } from '../particles/types';

let particles = $state<Particle[]>([]);
let isAnimating = $state(false);

export const particleState = {
    get particles() { return particles; },
    get isAnimating() { return isAnimating; },
    setParticles(newParticles: Particle[]) {
        particles = newParticles;
    },
    setAnimating(value: boolean) {
        isAnimating = value;
    }
};
```

### Store 3: audioState.svelte.ts

```typescript
const audioInstances = $state<{ [key: string]: HTMLAudioElement }>({});

export const audioState = {
    get instances() { return audioInstances; },
    addInstance(id: string, audio: HTMLAudioElement) {
        audioInstances[id] = audio;
    },
    removeInstance(id: string) {
        delete audioInstances[id];
    },
    getActiveCount() {
        return Object.keys(audioInstances).length;
    }
};
```

## 🎯 Phase 2.2: Managers & Services (Jour 2-3)

### HitboxManager.ts

```typescript
export class HitboxManager {
    private hitboxes: Hitbox[] = [];
    private cache: Vector3 = new THREE.Vector3();

    detectContour(imageData: ImageData): Point2D[] { }
    generateHitbox(element: AFrameElement, image: string): Hitbox { }
    updateHitboxes(): void { }
    checkClick(x: number, y: number): Hitbox | null { }
}
```

### AudioManager.ts

```typescript
import { AUDIO_CONFIG } from '../config/constants';
import { audioState } from '../stores/audioState.svelte';

export class AudioManager {
    play(filename: string, options?: AudioOptions): HTMLAudioElement {
        // Pooling logic avec audioState
    }

    cleanup(): void {
        // Remove ended instances
    }
}
```

### ParticlePool.ts

```typescript
import { PARTICLE_CONFIG } from '../config/constants';

export class ParticlePool {
    private pool: Particle[] = [];
    private active: Set<Particle> = new Set();

    acquire(): Particle { }
    release(particle: Particle): void { }
    getActive(): Particle[] { }
}
```

## 🎯 Phase 2.3: Composants UI (Jour 4)

### Modal.svelte (Générique)

```svelte
<script lang="ts">
    interface Props {
        isOpen: boolean;
        onClose: () => void;
        title?: string;
    }

    let { isOpen = $bindable(), onClose, title }: Props = $props();
</script>

{#if isOpen}
    <div class="modal-overlay" onclick={onClose}>
        <div class="modal-content" onclick|stopPropagation>
            {#if title}
                <h2>{title}</h2>
            {/if}
            {@render children?.()}
        </div>
    </div>
{/if}
```

### PaperModal.svelte

Utilise Modal + affiche info du paper sélectionné

### ParticleLayer.svelte

```svelte
<script lang="ts">
    import { particleState } from '../stores/particleState.svelte';
    import { onMount, onDestroy } from 'svelte';

    let animationId: number | null = null;

    onMount(() => {
        // Start particle animation
    });

    onDestroy(() => {
        if (animationId) cancelAnimationFrame(animationId);
    });
</script>

<div class="particle-container">
    {#each particleState.particles as particle (particle.id)}
        <img
            src={particle.image}
            style:transform="translate3d({particle.x}px, {particle.y}px, 0) scale({particle.scale})"
            style:opacity={particle.opacity}
        />
    {/each}
</div>
```

## 🎯 Phase 2.4: ARScene.svelte Refactoré (Jour 5)

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { gameState } from '../stores/gameState.svelte';
    import ParticleLayer from './ParticleLayer.svelte';
    import HitboxLayer from './HitboxLayer.svelte';
    import PaperModal from '../ui/PaperModal.svelte';
    import CreditsModal from '../ui/CreditsModal.svelte';
    import { HitboxManager } from '../ar/HitboxManager';
    import { AudioManager } from '../audio/AudioManager';

    const hitboxManager = new HitboxManager();
    const audioManager = new AudioManager();

    let paperModalOpen = $state(false);

    onMount(() => {
        hitboxManager.initialize();
        // Setup scene
    });
</script>

<a-scene>
    <!-- A-Frame markup -->
</a-scene>

<ParticleLayer />
<HitboxLayer {hitboxManager} />

<PaperModal
    bind:isOpen={paperModalOpen}
    paper={gameState.selectedPaper}
/>
```

## 📋 Ordre d'Exécution

1. ✅ **Jour 1**: Créer les 3 stores (gameState, particleState, audioState)
2. ✅ **Jour 2**: AudioManager + ParticlePool
3. ✅ **Jour 3**: HitboxManager + CameraTracker
4. ✅ **Jour 4**: Composants UI (Modal, PaperModal, etc.)
5. ✅ **Jour 5**: Refactorer AR.svelte pour utiliser les composants

## ✅ Critères de Succès

- [ ] AR.svelte < 200 lignes
- [ ] Chaque module < 150 lignes
- [ ] 0 erreurs TypeScript
- [ ] Stores utilisent runes Svelte 5
- [ ] Tests unitaires pour managers
- [ ] Séparation claire des responsabilités

## 🔄 Rollback Plan

- Garder AR.svelte.backup
- Commits granulaires (1 par composant)
- Feature flag pour ancien/nouveau code
- Tests E2E avant/après

---

**Créé**: 2025-10-04
**Phase**: 2 - Décomposition
**Durée estimée**: 5 jours
