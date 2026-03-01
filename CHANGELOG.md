# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-01

### Ajouté
- ⏱️ **Système de timer** avec countdown configurable (30s, 60s, 90s, illimité)
- 📊 **Barre de progression** pour suivre l'avancement des tours
- 🎊 **Animations** : confetti sur zone verte, pulse de score, flip de carte
- 📱 **Feedback haptique** pour mobile (vibrations)
- 🃏 **Cartes personnalisées** : création, import/export JSON
- ⚙️ **Paramètres de partie** : timer, nombre de tours, difficulté (facile/normal/difficile)
- 📈 **Statistiques** : tracking des parties, historique, moyennes, export CSV
- 🌐 **PWA** : installation sur mobile, mode hors-ligne partiel, manifest
- 🌙 **Mode sombre** avec toggle light/dark
- ❓ **Modal d'aide** avec règles et raccourcis clavier
- 🔗 **Web Share API** pour partager le code de room
- 🔄 **Reconnexion automatique** à la dernière room
- ♿ **Accessibilité** : labels ARIA, navigation clavier, contrastes WCAG AA
- 📱 **Responsive amélioré** : meilleure expérience mobile et tablette

### Modifié
- 🎲 **Psychique aléatoire** au démarrage de partie (au lieu du premier joueur)
- 🎯 **Modificateurs de difficulté** : seuils de zones ajustés selon le mode
- 📐 **Layout responsive** : timer et barre de progression intégrés
- 🎨 **Animations CSS** : fichier dédié avec keyframes réutilisables

### Corrigé
- Synchronisation timer backend/frontend
- Gestion des déconnexions en partie
- Nettoyage des timers lors de suppression de room

## [1.0.0] - 2026-02-26

### Ajouté
- 🎮 **Système de jeu de base** : création de room, multijoueur temps réel
- 🔗 **Code de room** : génération automatique de codes 4 lettres
- 📋 **Copie du code** (Clipboard API)
- 🎯 **Système de scoring** : zones verte/jaune/orange/rouge
- 🔄 **Rotation du psychique** entre les tours
- 🎛️ **Interface Dial** avec support tactile
- 🃏 **30 cartes spectrum** par défaut (français)
- 🎨 **UI Tailwind CSS** : design moderne et responsive
- ⚡ **Backend Socket.IO** : communication temps réel
- 🏗️ **Architecture modulaire** : gameManager, socketHandlers, cards

---

**Légende** :
- ✨ Ajouté : Nouvelles fonctionnalités
- 🔧 Modifié : Changements dans les fonctionnalités existantes
- 🐛 Corrigé : Corrections de bugs
- 🗑️ Supprimé : Fonctionnalités retirées
