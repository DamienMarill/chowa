# 🧩 Composants API

Documentation technique des composants principaux de Chowa.

## 📦 ARScene

Le composant racine qui initialise la scène A-Frame et MindAR.

**Chemin** : `src/lib/components/ar/ARScene.svelte`

### Props

| Nom             | Type                          | Description                                     |
| --------------- | ----------------------------- | ----------------------------------------------- |
| `images`        | `TrackAsset[]`                | Liste des assets à tracker et afficher.         |
| `sakuraImages`  | `string[]`                    | Liste des chemins d'images pour les particules. |
| `assetRatio`    | `number`                      | Ratio par défaut des assets (optionnel).        |
| `onTargetFound` | `() => void`                  | Callback déclenché quand un marker est détecté. |
| `onSceneLoaded` | `(arEntity: Element) => void` | Callback déclenché quand la scène est prête.    |

### Types

```typescript
interface TrackAsset {
  name: string; // Nom de l'asset (doit correspondre au fichier)
  z: number; // Profondeur Z
  ratio?: number; // Ratio spécifique
  clickHandler?: () => void; // Action au clic
}
```

---

## 📍 ARMarker

Gère l'affichage des éléments sur un marker MindAR spécifique.

**Chemin** : `src/lib/components/ar/ARMarker.svelte`

### Props

| Nom             | Type           | Description                                              |
| --------------- | -------------- | -------------------------------------------------------- |
| `images`        | `TrackAsset[]` | Liste des images à afficher sur ce marker.               |
| `assetRatio`    | `number`       | Ratio par défaut (défaut: `ASSET_CONFIG.RATIO_DEFAULT`). |
| `onTargetFound` | `() => void`   | Callback de détection.                                   |

---

## 🌸 ParticleSystem

Gère le système de particules (pétales de cerisier).

**Chemin** : `src/lib/components/particles/ParticleSystem.svelte`

### Props

| Nom        | Type              | Description                                                            |
| ---------- | ----------------- | ---------------------------------------------------------------------- |
| `arEntity` | `Element \| null` | Référence à l'entité AR parente (`mindar-image-target`). **Bindable**. |

### Fonctionnement

Ce composant n'a pas de rendu visuel direct dans le template Svelte, il manipule directement le DOM A-Frame via `ParticlePool` pour des performances optimales.

---

## 🎯 HitboxSystem

Gère la détection des clics sur les éléments AR via un canvas overlay.

**Chemin** : `src/lib/components/hitbox/HitboxSystem.svelte`

### Props

| Nom          | Type           | Description                                         |
| ------------ | -------------- | --------------------------------------------------- |
| `images`     | `TrackAsset[]` | Liste des images interactives.                      |
| `assetRatio` | `number`       | Ratio par défaut.                                   |
| `debug`      | `boolean`      | Affiche le canvas de debug (contours rouges/verts). |

### Events

| Nom           | Detail                           | Description                                |
| ------------- | -------------------------------- | ------------------------------------------ |
| `hitboxClick` | `{ imageId: string, z: number }` | Émis lors d'un clic validé sur une hitbox. |

### Méthodes Internes Clés

- `detectContour(imageData)`: Analyse les pixels de l'image pour créer un polygone de collision précis.
- `convertContourToScreenCoordinates(...)`: Projette les points 3D du contour vers l'écran 2D.
