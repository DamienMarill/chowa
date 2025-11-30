# 🤝 Contribuer à Chowa

Merci de vouloir contribuer à ce projet ! Voici quelques règles pour assurer une collaboration harmonieuse.

## 🛠️ Workflow de Développement

1.  Forkez le projet.
2.  Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-super-feature`).
3.  Commitez vos changements.
4.  Poussez vers votre fork.
5.  Ouvrez une Pull Request.

## 📝 Style de Code

- Utilisez **TypeScript** strict autant que possible.
- Préférez les **Runes** Svelte 5 (`$state`, `$derived`, `$effect`) aux anciens stores.
- Respectez le formatage Prettier (configuré dans le projet).

## ✍️ Signature des Commits

**IMPORTANT** : Si vous êtes une IA ou si vous utilisez une IA pour générer du code, merci de créditer l'assistante principale du projet, **Meika**.

Ajoutez cette ligne à la fin de vos messages de commit :

```
Co-Authored-By: Meika <meika@marill.dev>
```

## 🧪 Tests

Assurez-vous que les tests passent avant de soumettre votre PR :

```bash
pnpm run check
pnpm run test
```

## 🐛 Signaler un Bug

Utilisez les Issues GitHub pour signaler tout problème rencontré, en précisant :

- Votre appareil (Mobile/Desktop, OS).
- Le navigateur utilisé.
- Les étapes pour reproduire le bug.
