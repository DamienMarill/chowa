# 🌸 Chowa - Overview

> [!NOTE] > **Chowa (調和)** signifie "Harmonie" en japonais. Ce projet est une exploration de l'harmonie entre le monde réel et le monde virtuel à travers la réalité augmentée.

> (Note de l'artiste : la note au-dessus est le fruit de l'interprétation de Gemini 3 Pro et ne reflète pas nécessairement mon point de vue personnel ou celui que vous êtes en droit d'avoir en intéragissant avec l'œuvre)

## 📖 Introduction

**Chowa** est une application web progressive (PWA) de Réalité Augmentée (AR) immersive. Elle permet aux utilisateurs d'interagir avec des éléments virtuels superposés au monde réel via la caméra de leur appareil. L'application est conçue pour être performante, esthétique et facile à utiliser, offrant une expérience fluide sans installation d'application native.

## 🛠️ Stack Technique

Le projet repose sur une stack moderne et performante :

| Technologie                                            | Usage                                             |
| ------------------------------------------------------ | ------------------------------------------------- |
| **[Svelte 5](https://svelte.dev/)**                    | Framework UI réactif (Runes)                      |
| **[A-Frame](https://aframe.io/)**                      | Framework WebVR/WebAR pour la 3D                  |
| **[MindAR](https://hiukim.github.io/mind-ar-js-doc/)** | Tracking d'images et reconnaissance faciale en AR |
| **[Tailwind CSS](https://tailwindcss.com/)**           | Framework CSS utilitaire                          |
| **[DaisyUI](https://daisyui.com/)**                    | Composants UI pour Tailwind                       |
| **[Vite](https://vitejs.dev/)**                        | Build tool et serveur de développement            |

## 🎯 Objectifs du Projet

1.  **Immersion** : Créer une expérience AR fluide et captivante.
2.  **Performance** : Optimiser le rendu 3D et la gestion des assets pour mobile.
3.  **Modularité** : Architecture propre et maintenable (voir [Architecture](./architecture)).
4.  **Esthétique** : Design soigné inspiré de l'esthétique japonaise moderne.

## 🌟 Fonctionnalités Clés

- **Image Tracking** : Détection de markers personnalisés pour afficher du contenu 3D.
- **Système de Particules** : Moteur de particules optimisé pour les effets visuels (pétales de sakura).
- **Interactions** : Hitbox système pour rendre les éléments 3D cliquables.
- **Audio Spatial** : Gestion sonore immersive.
- **Collection** : Système de progression et de collection d'objets virtuels.

## 📂 Structure de la Documentation

- [**Architecture**](./architecture) : Détails techniques sur la structure du code et les flux de données.
- [**Setup**](./setup) : Guide d'installation et de configuration pour les développeurs.
- [**Features**](./features) : Description détaillée des fonctionnalités.
- [**Components**](./components) : Documentation de l'API des composants principaux.
- [**Contributing**](./contributing) : Guide pour contribuer au projet.
