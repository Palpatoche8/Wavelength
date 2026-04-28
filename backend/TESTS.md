# Tests Unitaires - WaveLength Backend

## 🧪 Lancer les tests

```bash
cd backend
npm test
```

## 📊 Couverture des tests

Les tests couvrent toutes les fonctionnalités principales du jeu :

### ✅ Création et gestion des rooms
- Création d'une room avec un joueur hôte
- Unicité des codes de room
- Rejoindre une room existante
- Reconnexion avec le même pseudo
- Impossible de rejoindre avec un nom déjà pris

### ✅ Démarrage et rounds
- Démarrer une partie avec 2+ joueurs
- Vérification qu'il y a **toujours UN SEUL maître** par round
- Le maître change à chaque round (rotation)
- Incrémentation correcte du compteur de rounds
- Fin de partie après le nombre de rounds configuré

### ✅ Soumission d'indices et réponses
- Le maître peut soumettre un indice
- Seul le maître peut soumettre un indice
- Les joueurs peuvent soumettre des réponses
- Le maître ne peut pas soumettre de réponse
- Passage automatique en révélation quand tous ont répondu

### ✅ Calcul des scores
- Calcul correct selon la difficulté (easy/normal/hard)
- Zones de score (green/yellow/orange/white)
- Distribution des points en mode FFA
- Le maître gagne la moyenne des points des joueurs

### ✅ Réinitialisation et rejouer
- Réinitialiser une partie remet les scores à 0
- Réinitialiser remet aussi les scores d'équipe à 0

### ✅ Déconnexion et reconnexion
- Marquer un joueur comme déconnecté
- Promotion d'un nouvel hôte si l'ancien se déconnecte
- Nettoyage automatique après 30 secondes

### ✅ Mode Teams
- Démarrer une partie en mode équipes
- Les équipes alternent à chaque round

## 🔍 Vérifications de synchronisation

Le gameManager inclut maintenant une méthode `validateGameState()` qui vérifie :
- **1 seul maître par round** (jamais 0, jamais 2+)
- Le maître existe bien dans la liste des joueurs
- Cohérence entre `psychicId` et `psychicIndex`
- Présence d'une carte et d'une cible valides
- Numéro de round valide

Cette validation est automatiquement appelée après chaque `nextRound()` et logge des warnings en cas d'incohérence.

## 🐛 Debug

Pour voir les logs détaillés pendant les tests :

```bash
npm test -- --verbose
```

Les logs incluent :
- ✅ Créations/joins de rooms
- 🎮 Démarrages de parties
- 💡 Soumissions d'indices
- 🎯 Soumissions de réponses
- 📊 Calculs de scores
- 🔍 Validations d'état (warnings uniquement en cas de problème)

## 📝 Ajouter de nouveaux tests

Les tests sont dans `src/game/__tests__/gameManager.test.js`.

Structure d'un test :
```javascript
test('Description du test', () => {
  // 1. Setup
  const { roomCode } = gameManager.createRoom('player1', 'Alice');
  gameManager.joinRoom(roomCode, 'player2', 'Bob');

  // 2. Action
  const room = gameManager.startGame(roomCode);

  // 3. Assertions
  expect(room.gameState).toBe('playing');
  expect(room.game.psychicId).toBeTruthy();
});
```

## 🚀 Résultats attendus

```
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        ~0.3s
```

Tous les tests doivent passer ! ✅
