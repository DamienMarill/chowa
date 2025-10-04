# Roadmap d'Amélioration Chowa 2025

## 📋 Résumé Exécutif

Plan d'amélioration complet pour migrer Chowa vers une architecture moderne, maintenable et performante.

**Durée totale**: 11-17 jours
**ROI**: Maintenabilité +300%, Performance +150%, Testabilité +1500%

## 🎯 Objectifs Principaux

### Best Practices
- ✅ Migration Svelte 5 runes complète ($state, $derived, $effect)
- ✅ Pattern A-Frame composants (AFRAME.registerComponent)
- ✅ TypeScript strict mode (0 `any`)
- ✅ Tests coverage >80%

### Lisibilité
- ✅ Fichiers <200 lignes (actuellement 1245 max)
- ✅ Complexité cyclomatique <10 (actuellement ~25)
- ✅ Documentation JSDoc complète
- ✅ Code self-documenting

### Maintenabilité
- ✅ Séparation responsabilités (SRP)
- ✅ Architecture modulaire testable
- ✅ Dependency injection
- ✅ 80% test coverage

### Performance
- ✅ Web Workers (détection contours)
- ✅ Object pooling généralisé
- ✅ Lazy loading assets
- ✅ 60 FPS stable mobile

## 📊 Métriques Actuelles vs Cibles

| Métrique | Actuel | Cible | Amélioration |
|----------|--------|-------|--------------|
| **Lignes/fichier (max)** | 1245 | <200 | -84% |
| **Complexité max** | ~25 | <10 | -60% |
| **Test coverage** | 5% | >80% | +1500% |
| **`any` TypeScript** | 13× | 0 | -100% |
| **Svelte 5 runes** | Partiel | 100% | ✅ |
| **Composants A-Frame** | 0 | 5+ | ✅ |

## 🗺️ Plan Détaillé

### Phase 1: Fondations (2-3j) 🔴
**Priorité**: CRITIQUE

#### 1.1 TypeScript Strict Mode
- Activer `"strict": true` dans tsconfig.app.json
- Corriger ~50 erreurs révélées
- Type safety 95%+

#### 1.2 Typage A-Frame/THREE.js
- Créer `lib/types/aframe.d.ts`
- Créer `lib/types/three.d.ts`
- Supprimer 13× `any`

#### 1.3 Svelte 5 Runes Mode
- Activer dans vite.config.ts
- Migrer toutes variables réactives
- Utiliser $derived, $effect

### Phase 2: Décomposition (3-5j) 🔴
**Priorité**: CRITIQUE

#### 2.1 Composants A-Frame
```
lib/aframe/components/
├── ar-scene-config.ts
├── particle-system.ts
├── hitbox-detector.ts
└── audio-player.ts
```

#### 2.2 Architecture Modulaire
```
src/lib/
├── ar/ (AR logique)
├── particles/ (Système particules)
├── interactions/ (Hitbox/clicks)
├── ui/ (Modals/SVG)
├── audio/ (AudioManager)
└── game/ (GameState store)
```

#### 2.3 Stores Svelte 5
- GameState avec runes
- AudioState
- ParticleState

### Phase 3: Performance (2-3j) 🟡
**Priorité**: IMPORTANT

#### 3.1 Web Workers
- `contour-detector.worker.ts`
- `hitbox-updater.worker.ts`
- Détection 500ms → 50ms

#### 3.2 Object Pooling
- Vector3Pool
- ParticlePool
- AudioPool (limite: 10)

#### 3.3 Lazy Loading
- Assets on-demand
- Intersection Observer
- Réduction chargement initial

### Phase 4: Tests (3-4j) 🟡
**Priorité**: IMPORTANT

#### 4.1 Infrastructure
- Vitest + jsdom
- Coverage v8
- Playwright E2E

#### 4.2 Tests Unitaires
- HitboxManager (100%)
- AudioManager (100%)
- ParticlePool (100%)
- GameState (100%)
- Geometry (✅ fait)

#### 4.3 Tests E2E
- AR interactions
- Paper collection
- Audio playback
- Modal flows

### Phase 5: Polish (1-2j) 🟢
**Priorité**: RECOMMANDÉ

#### 5.1 Cleanup
- Supprimer 12× console.log
- Centraliser config
- ESLint + Prettier
- JSDoc documentation

#### 5.2 Monitoring
- Performance budgets
- Error tracking
- Analytics events

## 🚀 Quick Wins (<1h chacun)

1. **TypeScript Strict** → `"strict": true`
2. **Cleanup Logs** → Supprimer console.log
3. **Config Centralisée** → `lib/config/constants.ts`
4. **Audio Limit** → MAX_AUDIO_INSTANCES = 10

## ⚠️ Risques & Mitigations

### Risque 1: Regression Bugs
- **Mitigation**: Tests E2E snapshot actuel
- **Mitigation**: Refactoring incrémental
- **Mitigation**: Feature flags rollback

### Risque 2: Performance Degradation  
- **Mitigation**: Benchmarks avant/après
- **Mitigation**: Budget 16ms/frame
- **Mitigation**: Profiling continu

### Risque 3: Breaking Changes Svelte 5
- **Mitigation**: Compatibility mode
- **Mitigation**: Tests exhaustifs
- **Mitigation**: Rollback plan

## 📈 Ordre d'Exécution Recommandé

1. **Quick Wins** (1j) → Gains immédiats
2. **Phase 1** (2-3j) → Fondations solides
3. **Phase 2** (3-5j) → Architecture propre
4. **Phase 3** (2-3j) → Performance optimale
5. **Phase 4** (3-4j) → Tests robustes
6. **Phase 5** (1-2j) → Finitions

**Total**: 11-17 jours selon équipe

## 📚 Références Clés

- [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state)
- [A-Frame Components](https://aframe.io/docs/1.7.0/core/component.html)
- [TypeScript Strict](https://www.typescriptlang.org/tsconfig#strict)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Object Pooling](https://gameprogrammingpatterns.com/object-pool.html)

## 🎯 Success Criteria

✅ Tous fichiers <200 lignes
✅ Complexité <10 partout
✅ 0 utilisation `any`
✅ >80% test coverage
✅ 60 FPS mobile stable
✅ Svelte 5 runes 100%
✅ 5+ composants A-Frame

---

**Créé**: 2025-10-04
**Contexte**: Audit refactoring complet
**Fichier détails**: `claudedocs/refactoring-audit-report.md`