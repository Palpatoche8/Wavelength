# 🎮 WaveLength - Jeu Multijoueur

Un jeu multijoueur inspiré de WaveLength où les joueurs doivent deviner la position d'un curseur sur une échelle entre deux concepts opposés.

## 📋 Architecture

- **Monorepo** avec structure frontend/backend séparée
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.IO
- **Temps réel**: Communication WebSocket via Socket.IO
- **Base de données**: En mémoire (MVP)

## 📁 Structure du projet

```
wavelength-game/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/      # Composants React
│   │   │   ├── HomePage.jsx
│   │   │   └── GameRoom.jsx
│   │   ├── App.jsx          # Composant racine
│   │   ├── main.jsx         # Point d'entrée
│   │   └── index.css        # Styles globaux
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Serveur Node.js
│   ├── src/
│   │   ├── server.js        # Serveur Express + Socket.IO
│   │   ├── game/
│   │   │   └── gameManager.js  # Logique de gestion des parties
│   │   └── socket/
│   │       └── socketHandlers.js  # Gestionnaires Socket.IO
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── README.md
└── package.json              # Scripts racine
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Installer toutes les dépendances (racine, backend, frontend)
npm run install:all
```

### Configuration

1. Créer un fichier `.env` dans le dossier `backend/` :

```bash
cp backend/.env.example backend/.env
```

2. (Optionnel) Modifier les valeurs par défaut dans `.env` :

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Démarrage en développement

#### Option 1 : Démarrer tout en même temps (recommandé)

```bash
npm run dev
```

Cette commande démarre le backend et le frontend simultanément.

#### Option 2 : Démarrer séparément

**Terminal 1 - Backend :**
```bash
npm run dev:backend
```
Le serveur démarre sur http://localhost:3000

**Terminal 2 - Frontend :**
```bash
npm run dev:frontend
```
L'application s'ouvre sur http://localhost:5173

## 🎯 Fonctionnalités actuelles (MVP)

### ✅ Implémenté

- [x] Connexion WebSocket temps réel
- [x] Création de parties avec code unique (4 lettres)
- [x] Système de rooms avec codes partagés
- [x] Rejoindre une partie avec un code
- [x] Liste des joueurs connectés en temps réel
- [x] Gestion de l'hôte (premier joueur)
- [x] Déconnexion automatique et nettoyage
- [x] Interface utilisateur responsive avec TailwindCSS
- [x] Indicateur de statut de connexion

### 🚧 À venir

- [ ] Logique de jeu WaveLength complète
- [ ] Système d'équipes
- [ ] Cartes avec spectres de concepts
- [ ] Score et classement
- [ ] Chat entre joueurs
- [ ] Persistance des données

## 🛠️ Scripts disponibles

### Racine du projet

| Script | Description |
|--------|-------------|
| `npm run install:all` | Installe toutes les dépendances |
| `npm run dev` | Lance backend + frontend |
| `npm run dev:backend` | Lance uniquement le backend |
| `npm run dev:frontend` | Lance uniquement le frontend |

### Backend

```bash
cd backend
npm start        # Démarre le serveur
npm run dev      # Mode développement avec auto-reload
```

### Frontend

```bash
cd frontend
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

## 🔧 Technologies utilisées

### Frontend
- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **TailwindCSS** - Framework CSS utility-first
- **Socket.IO Client** - Communication temps réel

### Backend
- **Node.js** - Environnement d'exécution
- **Express** - Framework web
- **Socket.IO** - WebSocket temps réel
- **CORS** - Gestion des origines multiples

## 📡 API WebSocket

### Événements émis par le client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `create-room` | `{ playerName: string }` | Créer une nouvelle partie |
| `join-room` | `{ roomCode: string, playerName: string }` | Rejoindre une partie |
| `leave-room` | `{ roomCode: string }` | Quitter une partie |

### Événements reçus par le client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `room-created` | `{ success: boolean, roomCode: string, room: object }` | Confirmation de création |
| `room-joined` | `{ success: boolean, roomCode: string, room: object }` | Confirmation de jonction |
| `room-updated` | `{ room: object }` | Mise à jour de la room |
| `player-joined` | `{ playerId: string, playerName: string }` | Nouveau joueur |
| `player-left` | `{ playerId: string }` | Joueur parti |
| `join-room-error` | `{ success: false, message: string }` | Erreur de jonction |

## 🎮 Comment jouer

1. **Créer une partie** :
   - Entrez votre nom
   - Cliquez sur "Créer une partie"
   - Partagez le code de 4 lettres avec vos amis

2. **Rejoindre une partie** :
   - Entrez votre nom
   - Cliquez sur l'onglet "Rejoindre"
   - Saisissez le code de la partie
   - Cliquez sur "Rejoindre la partie"

3. **Démarrer le jeu** :
   - L'hôte (premier joueur) peut démarrer la partie
   - Minimum 2 joueurs requis (4 recommandés)

## 🐛 Dépannage

### Le backend ne démarre pas

Vérifiez que le port 3000 est disponible :
```bash
lsof -i :3000
```

### Le frontend ne se connecte pas

1. Vérifiez que le backend est démarré
2. Vérifiez l'URL dans `frontend/src/App.jsx` (ligne 7)
3. Vérifiez la configuration CORS dans `backend/src/server.js`

### Erreur "Cannot find module"

Réinstallez les dépendances :
```bash
npm run install:all
```

## 📝 Notes de développement

- Les rooms sont stockées en mémoire et disparaissent au redémarrage
- Le premier joueur d'une room devient automatiquement l'hôte
- Si l'hôte quitte, le premier joueur restant devient le nouvel hôte
- Les rooms vides sont automatiquement supprimées
- La déconnexion d'un joueur le retire automatiquement de sa room

## 🎴 Cartes personnalisées

### Spectre de concepts (à implémenter)

- Meilleure Chanson ↔ Pire Chanson
- Meilleur Jeu vidéo ↔ Pire Jeu vidéo
- Meilleur Bonbon ↔ Pire Bonbon
- Green Flag ↔ Red Flag
- Meilleur Dessert ↔ Pire Dessert
- Meilleur Film ↔ Pire Film
- Meilleure Série ↔ Pire Série
- Meilleure Pizza ↔ Pire Pizza
- Meilleur Sport ↔ Pire Sport
- Meilleur Pokémon ↔ Pire Pokémon
- Meilleur Dessin Animé ↔ Pire Dessin Animé
- Meilleure Matière Scolaire ↔ Pire Matière Scolaire
- Meilleure Marque ↔ Pire Marque
- Meilleure Boisson ↔ Pire Boisson
- Meilleur Métro ↔ Pire Métro
- Meilleur Youtubeur/Streameur ↔ Pire Youtubeur/Streameur
- Meilleur FastFood ↔ Pire FastFood
- Meilleure Ville de France ↔ Pire Ville de France
- Meilleur Pays ↔ Pire Pays
- Meilleur Artiste ↔ Pire Artiste
- Meilleur Loisir ↔ Pire Loisir
- Meilleur Animal ↔ Pire Animal
- Meilleur Animal à 1vs1 ↔ Pire Animal à 1vs1

### Design préféré
- Couleurs : bleu/orange
- Style minimaliste

## 🤝 Contribution

Ce projet est un MVP. Les contributions sont les bienvenues !

## 📄 Licence

MIT
