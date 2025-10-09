# Audit Chowa - Janvier 2025

## Projet
Application AR Svelte 5 avec MindAR et A-Frame pour tracking d'images avec particules sakura

## Stack Technique
- Svelte 5.28.1 (mode classique, pas runes)
- A-Frame 1.7.1
- MindAR 1.2.5
- TypeScript 5.8.3
- Vite 6.3.5
- Tailwind 3.4.17 + DaisyUI 4.12.24

## Problèmes Identifiés

### Critique 🔴
1. **Code Svelte 4 avec Svelte 5** : Utilise `let` au lieu de `$state`, pas de runes
2. **Logique monolithique** : 1156 lignes dans AR.svelte avec tout le code inline
3. **Pas de composants A-Frame** : Code dans script tags au lieu de `AFRAME.registerComponent`
4. **Memory leaks** : Création Vector3/objets dans tick sans réutilisation
5. **Type safety faible** : Beaucoup de `any`, interfaces non strictes

### Important 🟡
1. **TypeScript config incomplète** : Manque `moduleResolution: bundler`
2. **Performance particules** : 50 particules avec création/destruction non optimale
3. **Hitbox detection** : Calcul chaque frame sans debounce/throttle
4. **Tests insuffisants** : Seulement 2 tests basiques pour geometry
5. **Dépendances manquantes** : `THREE` utilisé mais pas déclaré

### Recommandé 🟢
1. **Code splitting** : Tout dans un seul bundle
2. **Asset optimization** : PNG pas optimisés (WebP/AVIF)
3. **Accessibility** : Manque ARIA labels, pas de fallback AR
4. **Documentation** : Pas de JSDoc pour fonctions complexes
5. **Git hooks** : Pas de pre-commit pour lint/test

## Fichiers Analysés
- src/lib/AR.svelte (1156 lignes - trop gros)
- src/lib/geometry.ts (113 lignes - bien structuré)
- src/lib/geometry.test.ts (34 lignes - basique)
- Configs: vite, tsconfig, tailwind, svelte

## Bonnes Pratiques Trouvées ✅
- Tests unitaires présents (même si basiques)
- TypeScript utilisé
- Fonctions geometry bien documentées et testées
- Git workflow propre avec commits descriptifs
