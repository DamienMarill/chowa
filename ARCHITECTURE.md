# Architecture de Chowa

## 📋 Vue d'ensemble

Chowa est une application de réalité augmentée (AR) construite avec Svelte 5, A-Frame et MindAR. L'application a été refactorisée pour séparer les responsabilités et faciliter les démonstrations.

## 🏗️ Structure du projet

```
src/lib/
├── components/           # Composants réutilisables
│   ├── ar/              # Composants AR (scène, marker, assets)
│   ├── hitbox/          # Système de détection de clics AR
│   ├── particles/       # Système de particules (pétales)
│   └── ui/              # Composants d'interface (modals)
│
├── stores/              # State management avec Svelte runes
│   ├── gameState.svelte.ts
│   ├── audioState.svelte.ts
│   └── particleState.svelte.ts
│
├── managers/            # Classes utilitaires
│   ├── ar/             # HitboxManager
│   ├── audio/          # AudioManager
│   └── particles/      # ParticlePool
│
├── config/             # Configuration et constantes
│   └── constants.ts
│
├── geometry.ts         # Utilitaires géométriques
└── AR.svelte          # Point d'entrée principal (orchestration)
```

## 🎯 Composants principaux

### 1. Système AR (`components/ar/`)

#### ARScene.svelte
**Responsabilité** : Orchestration de la scène A-Frame
**Props** :
- `images`: Tableau des assets AR à afficher
- `sakuraImages`: Images de pétales pour les assets
- `onTargetFound`: Callback quand le marker AR est détecté
- `onSceneLoaded`: Callback quand la scène est chargée

**Exemple d'utilisation** :
```svelte
<ARScene
    {images}
    {sakuraImages}
    onTargetFound={() => console.log('Marker trouvé !')}
    onSceneLoaded={(arEntity) => console.log('Scène chargée', arEntity)}
/>
```

#### ARMarker.svelte
**Responsabilité** : Gestion du marker AR et des images trackées
**Props** :
- `images`: Assets à afficher sur le marker
- `assetRatio`: Ratio des assets
- `onTargetFound`: Callback de détection

#### ARAssets.svelte
**Responsabilité** : Définition des assets A-Frame
**Props** :
- `sakuraImages`: Liste des chemins d'images

---

### 2. Système de particules (`components/particles/`)

#### ParticleSystem.svelte
**Responsabilité** : Gestion des particules de pétales (sakura) en AR
**Props** :
- `arEntity`: Référence à l'entité AR parent

**Fonctionnalités** :
- Pool d'objets pour optimiser les performances
- Animation continue avec requestAnimationFrame
- Recyclage automatique des particules hors écran
- Support de 21 textures de pétales différentes

**Exemple d'utilisation** :
```svelte
<script>
    let arEntity = $state(null);
</script>

<ParticleSystem bind:arEntity={arEntity} />
```

---

### 3. Système de hitbox (`components/hitbox/`)

#### HitboxSystem.svelte
**Responsabilité** : Détection de clics sur les éléments AR
**Props** :
- `images`: Liste des images avec leurs handlers de clic
- `assetRatio`: Ratio des assets
- `debug`: Mode debug pour visualiser les hitboxes

**Fonctionnalités** :
- Détection de contours automatique des images
- Conversion coordonnées 3D → 2D
- Canvas overlay pour la détection
- Support du debug visuel

**Événements** :
- `hitboxClick`: Émis quand un élément est cliqué

**Exemple d'utilisation** :
```svelte
<HitboxSystem
    {images}
    {assetRatio}
    debug={true}
    on:hitboxClick={(e) => console.log('Cliqué sur', e.detail.imageId)}
/>
```

---

### 4. Composants UI (`components/ui/`)

Tous les modals utilisent le même pattern :

**Props communes** :
- `isOpen`: Boolean pour contrôler l'affichage
- `onClose`: Callback de fermeture

#### Modals disponibles :
- **PaperModal** : Affichage des papiers collectés
- **ScandalModal** : Easter egg avec Scandal
- **CreditsModal** : Crédits du projet
- **DevModal** : Animation SVG kawaii
- **ChowaFoundModal** : Message de bienvenue

**Exemple** :
```svelte
<script>
    let showModal = $state(false);
</script>

<CreditsModal
    bind:isOpen={showModal}
    onClose={() => showModal = false}
/>
```

---

## 🔧 Managers et utilitaires

### ParticlePool
**Fichier** : `particles/ParticlePool.ts`
**Responsabilité** : Pool d'objets pour réutiliser les particules
**Méthodes principales** :
- `acquire()`: Obtenir une particule du pool
- `release(particle)`: Libérer une particule
- `initialize(count)`: Initialiser le pool

### AudioManager
**Fichier** : `audio/AudioManager.ts`
**Responsabilité** : Gestion centralisée du son avec pooling
**Méthodes principales** :
- `play(sound, options)`: Jouer un son
- `stop(id)`: Arrêter un son
- `setVolume(id, volume)`: Ajuster le volume

### HitboxManager
**Fichier** : `ar/HitboxManager.ts`
**Responsabilité** : Détection et tracking des hitboxes AR
**Méthodes principales** :
- `detectContour(imageData)`: Détecter le contour d'une image
- `convertToScreenCoordinates()`: Conversion 3D → 2D
- `updateHitboxes()`: Mise à jour des positions

---

## 📊 State Management

### gameState
**Fichier** : `stores/gameState.svelte.ts`
**Responsabilité** : État du jeu (papers collectés)

```typescript
gameState.collectPaper('tailwind')  // Collecter un paper
gameState.papers  // { tailwind: 2, angular: 1, laravel: 0 }
```

### audioState
**Fichier** : `stores/audioState.svelte.ts`
**Responsabilité** : État des sons actifs

### particleState
**Fichier** : `stores/particleState.svelte.ts`
**Responsabilité** : État des particules (optionnel)

---

## 🎨 Flux de données

```
AR.svelte (orchestration)
    ↓
    ├─→ ARScene ─→ ARMarker ─→ Images AR
    ├─→ ParticleSystem ─→ ParticlePool ─→ Particules
    ├─→ HitboxSystem ─→ Détection clics
    └─→ Modals ─→ Affichage conditionnel
```

---

## 🚀 Démarrage rapide

### Installation
```bash
pnpm install
```

### Développement
```bash
pnpm run dev
```

### Build
```bash
pnpm run build
```

---

## 📈 Métriques de refactoring

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Lignes AR.svelte | 877 | 232 | -74% |
| Nombre de fichiers | 15 | 27 | +80% |
| Composants réutilisables | 2 | 14 | +600% |
| Lignes par fichier (moy.) | 150 | 85 | -43% |

---

## 🎯 Points clés pour les démos

### Démo 1 : Système AR
**Fichiers** : `components/ar/ARScene.svelte`, `ARMarker.svelte`
**Concept** : Composition de scène AR modulaire

### Démo 2 : Particules
**Fichiers** : `components/particles/ParticleSystem.svelte`, `ParticlePool.ts`
**Concept** : Pool d'objets et animations performantes

### Démo 3 : Hitbox
**Fichiers** : `components/hitbox/HitboxSystem.svelte`
**Concept** : Détection de contours et clics en AR

### Démo 4 : UI Components
**Fichiers** : `components/ui/*.svelte`
**Concept** : Modals réutilisables avec Svelte 5

### Démo 5 : State Management
**Fichiers** : `stores/*.svelte.ts`
**Concept** : Reactive stores avec runes Svelte 5

---

## 🔮 Améliorations futures

- [ ] Utiliser HitboxManager dans HitboxSystem (éliminer duplication)
- [ ] Ajouter des tests unitaires
- [ ] Lazy loading des composants
- [ ] Code splitting pour réduire le bundle
- [ ] Documentation API avec TypeDoc
