# ⚙️ Installation & Setup

Ce guide vous aidera à installer et lancer **Chowa** sur votre machine locale.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **[Node.js](https://nodejs.org/)** (version 20 ou supérieure recommandée)
- **[pnpm](https://pnpm.io/)** (gestionnaire de paquets recommandé)
  - Installation : `npm install -g pnpm`

## 🚀 Installation

1.  **Cloner le dépôt**

    ```bash
    git clone https://github.com/DamienMarill/chowa.git
    cd chowa
    ```

2.  **Installer les dépendances**
    ```bash
    pnpm install
    ```

## 💻 Développement

Pour lancer le serveur de développement avec rechargement à chaud (HMR) :

```bash
pnpm run dev
```

L'application sera accessible à l'adresse : `http://localhost:5173`

> [!WARNING] > **Test sur Mobile**
> Pour tester les fonctionnalités AR (caméra), vous devez accéder à l'application via **HTTPS** ou via **localhost**.
> Si vous voulez tester sur votre téléphone connecté au même réseau Wi-Fi, Vite expose l'IP locale, mais la caméra peut être bloquée par le navigateur pour des raisons de sécurité (contexte non sécurisé).
>
> **Solution recommandée** : Utilisez un tunnel comme `ngrok` ou la fonctionnalité de tunneling de VS Code pour exposer votre port 5173 en HTTPS.

## 📦 Build pour la Production

Pour compiler l'application pour la production :

```bash
pnpm run build
```

Les fichiers compilés seront dans le dossier `dist/`. Vous pouvez prévisualiser le build avec :

```bash
pnpm run preview
```

## 🧪 Tests

Pour lancer les tests unitaires (Vitest) :

```bash
pnpm run test
```

Pour vérifier les types TypeScript et le code Svelte :

```bash
pnpm run check
```
