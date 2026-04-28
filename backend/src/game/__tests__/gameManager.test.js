/**
 * Tests unitaires pour gameManager
 * Teste toutes les fonctionnalités du jeu multijoueur
 */

import gameManager from '../gameManager.js';

describe('GameManager - Création et gestion des rooms', () => {
  beforeEach(() => {
    // Nettoyer toutes les rooms avant chaque test
    gameManager.rooms.clear();
  });

  test('Créer une room avec un joueur', () => {
    const { roomCode, room } = gameManager.createRoom('player1', 'Alice');

    expect(roomCode).toBeTruthy();
    expect(roomCode).toHaveLength(4);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].name).toBe('Alice');
    expect(room.players[0].isHost).toBe(true);
    expect(room.gameState).toBe('waiting');
  });

  test('Les codes de room doivent être uniques', () => {
    const { roomCode: code1 } = gameManager.createRoom('player1', 'Alice');
    const { roomCode: code2 } = gameManager.createRoom('player2', 'Bob');

    expect(code1).not.toBe(code2);
  });

  test('Rejoindre une room existante', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    const room = gameManager.joinRoom(roomCode, 'player2', 'Bob');

    expect(room).toBeTruthy();
    expect(room.players).toHaveLength(2);
    expect(room.players[1].name).toBe('Bob');
    expect(room.players[1].isHost).toBe(false);
  });

  test('Impossible de rejoindre une room inexistante', () => {
    const room = gameManager.joinRoom('XXXX', 'player2', 'Bob');
    expect(room).toBeNull();
  });

  test('Reconnexion avec le même nom (joueur déconnecté)', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    // Bob se déconnecte
    gameManager.markPlayerDisconnected(roomCode, 'player2');

    // Bob se reconnecte avec le même nom mais un nouveau socket ID
    const room = gameManager.joinRoom(roomCode, 'player2_new', 'Bob');

    expect(room).toBeTruthy();
    expect(room.players).toHaveLength(2);

    const bob = room.players.find(p => p.name === 'Bob');
    expect(bob.disconnected).toBe(false);
    expect(bob.id).toBe('player2_new'); // Nouveau socket ID
  });

  test('Impossible de rejoindre avec un nom déjà pris', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    // Essayer de rejoindre avec le même nom
    const room = gameManager.joinRoom(roomCode, 'player3', 'Bob');

    expect(room).toBeNull();
  });
});

describe('GameManager - Démarrage et rounds', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Démarrer une partie avec 2 joueurs', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);

    expect(room).toBeTruthy();
    expect(room.gameState).toBe('playing');
    expect(room.game).toBeTruthy();
    expect(room.game.currentRound).toBe(1); // startGame() démarre au round 1
    expect(room.game.psychicId).toBeTruthy();
    expect(room.game.currentCard).toBeTruthy();
    expect(room.game.targetValue).toBeGreaterThanOrEqual(1);
    expect(room.game.targetValue).toBeLessThanOrEqual(20);
  });

  test('Impossible de démarrer une partie avec moins de 2 joueurs', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    const room = gameManager.startGame(roomCode);

    expect(room).toBeNull();
  });

  test('Vérifier qu\'il y a toujours UN SEUL maître par round', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');

    const room = gameManager.startGame(roomCode);

    // Vérifier le premier round
    expect(room.game.psychicId).toBeTruthy();
    const psychic1 = room.players.find(p => p.id === room.game.psychicId);
    expect(psychic1).toBeTruthy();

    // Vérifier que les autres joueurs ne sont pas maîtres
    const otherPlayers = room.players.filter(p => p.id !== room.game.psychicId);
    expect(otherPlayers).toHaveLength(2);
  });

  test('Le maître change à chaque round (mode FFA)', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');

    const room = gameManager.startGame(roomCode);
    const psychic1 = room.game.psychicId;

    // Soumettre un indice et des réponses pour passer au round suivant
    gameManager.submitClue(roomCode, psychic1, 'Test');
    room.players.filter(p => p.id !== psychic1).forEach(p => {
      gameManager.submitGuess(roomCode, p.id, 10);
    });
    gameManager.revealResult(roomCode);

    const room2 = gameManager.nextRound(roomCode);
    const psychic2 = room2.game.psychicId;

    // Le maître doit avoir changé
    expect(psychic2).not.toBe(psychic1);
  });

  test('Passer au round suivant incrémente correctement le compteur', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    expect(room.game.currentRound).toBe(1);

    const psychic = room.game.psychicId;
    gameManager.submitClue(roomCode, psychic, 'Test');
    room.players.filter(p => p.id !== psychic).forEach(p => {
      gameManager.submitGuess(roomCode, p.id, 10);
    });
    gameManager.revealResult(roomCode);

    const room2 = gameManager.nextRound(roomCode);
    expect(room2.game.currentRound).toBe(2);
  });

  test('La partie se termine après le nombre de rounds configuré', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode, { totalRounds: 2 });
    expect(room.game.totalRounds).toBe(2);
    expect(room.game.currentRound).toBe(1);

    // Jouer le round 1
    const psychic = room.game.psychicId;
    gameManager.submitClue(roomCode, psychic, 'Test');
    gameManager.submitGuess(roomCode, room.players.find(p => p.id !== psychic).id, 10);
    gameManager.revealResult(roomCode);

    // Passer au round 2
    const room1 = gameManager.nextRound(roomCode);
    expect(room1.gameState).toBe('playing');
    expect(room1.game.currentRound).toBe(2);

    // Jouer le round 2
    const psychic1 = room1.game.psychicId;
    gameManager.submitClue(roomCode, psychic1, 'Test 1');
    room1.players.filter(p => p.id !== psychic1).forEach(p => {
      gameManager.submitGuess(roomCode, p.id, 10);
    });
    gameManager.revealResult(roomCode);

    // Essayer de passer au round 3 -> partie terminée car totalRounds=2
    const room2 = gameManager.nextRound(roomCode);
    expect(room2.gameState).toBe('finished');
  });
});

describe('GameManager - Soumission d\'indices et réponses', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Le maître peut soumettre un indice', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    const psychic = room.game.psychicId;

    const updatedRoom = gameManager.submitClue(roomCode, psychic, 'Mon indice');

    expect(updatedRoom).toBeTruthy();
    expect(updatedRoom.game.clue).toBe('Mon indice');
  });

  test('Seul le maître peut soumettre un indice', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    const nonPsychic = room.players.find(p => p.id !== room.game.psychicId);

    const updatedRoom = gameManager.submitClue(roomCode, nonPsychic.id, 'Mon indice');

    expect(updatedRoom).toBeNull();
  });

  test('Les joueurs peuvent soumettre des réponses', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    const psychic = room.game.psychicId;
    const player = room.players.find(p => p.id !== psychic);

    gameManager.submitClue(roomCode, psychic, 'Test');

    const updatedRoom = gameManager.submitGuess(roomCode, player.id, 15);

    expect(updatedRoom).toBeTruthy();
    expect(updatedRoom.game.guesses).toHaveLength(1);
    expect(updatedRoom.game.guesses[0].playerId).toBe(player.id);
    expect(updatedRoom.game.guesses[0].guessValue).toBe(15);
  });

  test('Le maître ne peut pas soumettre de réponse', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    const psychic = room.game.psychicId;

    gameManager.submitClue(roomCode, psychic, 'Test');

    const updatedRoom = gameManager.submitGuess(roomCode, psychic, 15);

    expect(updatedRoom).toBeNull();
  });

  test('Tous les joueurs répondent -> passage automatique en révélation', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');

    const room = gameManager.startGame(roomCode);
    const psychic = room.game.psychicId;
    const players = room.players.filter(p => p.id !== psychic);

    gameManager.submitClue(roomCode, psychic, 'Test');

    // Premier joueur répond
    let updatedRoom = gameManager.submitGuess(roomCode, players[0].id, 10);
    expect(updatedRoom.gameState).toBe('playing'); // Pas encore tous répondu

    // Deuxième joueur répond
    updatedRoom = gameManager.submitGuess(roomCode, players[1].id, 12);
    expect(updatedRoom.gameState).toBe('revealing'); // Tous ont répondu
  });
});

describe('GameManager - Calcul des scores', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Calcul du score en difficulté normale', () => {
    const { points, zone } = gameManager.calculateScore(10, 10, 'normal');
    expect(points).toBe(4);
    expect(zone).toBe('green');

    const { points: p2, zone: z2 } = gameManager.calculateScore(10, 11, 'normal');
    expect(p2).toBe(3);
    expect(z2).toBe('yellow');

    const { points: p3, zone: z3 } = gameManager.calculateScore(10, 12, 'normal');
    expect(p3).toBe(2);
    expect(z3).toBe('orange');

    const { points: p4, zone: z4 } = gameManager.calculateScore(10, 13, 'normal');
    expect(p4).toBe(0);
    expect(z4).toBe('white');
  });

  test('Révéler le résultat et calculer les scores (mode FFA)', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);
    const psychic = room.game.psychicId;
    const player = room.players.find(p => p.id !== psychic);

    gameManager.submitClue(roomCode, psychic, 'Test');

    // Forcer une cible connue pour le test
    room.game.targetValue = 10;

    gameManager.submitGuess(roomCode, player.id, 10); // Réponse parfaite

    const { result } = gameManager.revealResult(roomCode);

    expect(result.targetValue).toBe(10);
    expect(result.guesses).toHaveLength(1);
    expect(result.guesses[0].points).toBe(4); // Score parfait
    expect(result.guesses[0].zone).toBe('green');

    // Vérifier que les scores sont mis à jour
    const updatedPlayer = room.players.find(p => p.id === player.id);
    expect(updatedPlayer.score).toBe(4);
  });
});

describe('GameManager - Réinitialisation et rejouer', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Réinitialiser une partie remet les scores à 0', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode);

    // Donner des scores aux joueurs
    room.players[0].score = 10;
    room.players[1].score = 15;

    const resetRoom = gameManager.resetGame(roomCode);

    expect(resetRoom.gameState).toBe('waiting');
    expect(resetRoom.game).toBeNull();
    expect(resetRoom.players[0].score).toBe(0);
    expect(resetRoom.players[1].score).toBe(0);
  });

  test('Réinitialiser remet aussi les scores d\'équipe à 0', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const room = gameManager.startGame(roomCode, { gameMode: 'teams' });

    // Donner des scores aux équipes
    room.teams.blue.score = 20;
    room.teams.red.score = 15;

    const resetRoom = gameManager.resetGame(roomCode);

    expect(resetRoom.teams.blue.score).toBe(0);
    expect(resetRoom.teams.red.score).toBe(0);
  });
});

describe('GameManager - Déconnexion et reconnexion', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Marquer un joueur comme déconnecté', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    const room = gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const updatedRoom = gameManager.markPlayerDisconnected(roomCode, 'player2');

    const bob = updatedRoom.players.find(p => p.name === 'Bob');
    expect(bob.disconnected).toBe(true);
    expect(bob.disconnectedAt).toBeTruthy();
  });

  test('Si l\'hôte se déconnecte, promouvoir un autre joueur', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    const updatedRoom = gameManager.markPlayerDisconnected(roomCode, 'player1');

    const alice = updatedRoom.players.find(p => p.name === 'Alice');
    const bob = updatedRoom.players.find(p => p.name === 'Bob');

    expect(alice.isHost).toBe(false);
    expect(bob.isHost).toBe(true);
  });

  test('Nettoyage des joueurs déconnectés depuis plus de 30s', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    gameManager.markPlayerDisconnected(roomCode, 'player2');

    // Simuler un déconnexion de plus de 30s
    const room = gameManager.getRoom(roomCode);
    const bob = room.players.find(p => p.name === 'Bob');
    bob.disconnectedAt = new Date(Date.now() - 31000); // 31 secondes

    const updatedRoom = gameManager.cleanupDisconnectedPlayers(roomCode);

    expect(updatedRoom.players).toHaveLength(1);
    expect(updatedRoom.players.find(p => p.name === 'Bob')).toBeUndefined();
  });
});

describe('GameManager - Mode Teams', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Démarrer une partie en mode teams', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');
    gameManager.joinRoom(roomCode, 'player4', 'David');

    const room = gameManager.startGame(roomCode, { gameMode: 'teams' });

    expect(room.settings.gameMode).toBe('teams');
    expect(room.game.currentTeam).toBe('blue'); // Première équipe à jouer
    expect(room.teams.blue.players.length).toBeGreaterThan(0);
    expect(room.teams.red.players.length).toBeGreaterThan(0);
  });

  test('Les équipes alternent à chaque round', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');
    gameManager.joinRoom(roomCode, 'player4', 'David');

    const room = gameManager.startGame(roomCode, { gameMode: 'teams' });
    expect(room.game.currentTeam).toBe('blue');
    expect(room.game.currentRound).toBe(1); // Round 1, équipe bleue

    const psychic = room.game.psychicId;
    gameManager.submitClue(roomCode, psychic, 'Test');
    gameManager.submitGuess(roomCode, room.players.find(p => p.id !== psychic && p.team === 'blue').id, 10);
    gameManager.revealResult(roomCode);

    // Passer au round 2 (alternance vers équipe rouge)
    const room1 = gameManager.nextRound(roomCode);
    expect(room1.game.currentTeam).toBe('red');
    expect(room1.game.currentRound).toBe(2);
  });
});

describe('GameManager - Reconnexion et join en cours', () => {
  beforeEach(() => {
    gameManager.rooms.clear();
  });

  test('Rejoindre une partie déjà en cours', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.startGame(roomCode);

    const room = gameManager.getRoom(roomCode);
    expect(room.gameState).toBe('playing');

    // Un nouveau joueur doit pouvoir rejoindre même en cours
    const joinedRoom = gameManager.joinRoom(roomCode, 'player3', 'Charlie');
    expect(joinedRoom).toBeTruthy();
    expect(joinedRoom.players).toHaveLength(3);
    expect(joinedRoom.players[2].name).toBe('Charlie');
  });

  test('Quitter et rejoindre avec récupération du score (partie en cours)', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');
    gameManager.joinRoom(roomCode, 'player3', 'Charlie');

    gameManager.startGame(roomCode); // Démarre automatiquement le round 1

    let room = gameManager.getRoom(roomCode);
    const psychic = room.game.psychicId;
    const targetValue = room.game.targetValue;

    gameManager.submitClue(roomCode, psychic, 'Test');

    // En mode FFA, tous les joueurs non-psychiques doivent répondre
    const nonPsychicPlayers = room.players.filter(p => p.id !== psychic);
    const testPlayer = nonPsychicPlayers[0];
    // Deviner près de la cible pour garantir des points
    gameManager.submitGuess(roomCode, testPlayer.id, targetValue + 1);
    // Faire répondre l'autre joueur pour déclencher la révélation
    gameManager.submitGuess(roomCode, nonPsychicPlayers[1].id, targetValue + 2);

    const result = gameManager.revealResult(roomCode);
    room = gameManager.getRoom(roomCode);

    // Vérifier que le joueur a un score
    const playerBefore = room.players.find(p => p.id === testPlayer.id);
    expect(playerBefore.score).toBeGreaterThan(0);
    const scoreBefore = playerBefore.score;

    // Marquer le joueur comme déconnecté (simule un leave en cours de partie)
    gameManager.markPlayerDisconnected(roomCode, testPlayer.id);
    room = gameManager.getRoom(roomCode);

    const disconnectedPlayer = room.players.find(p => p.name === playerBefore.name);
    expect(disconnectedPlayer.disconnected).toBe(true);

    // Le joueur rejoint avec un nouveau socket ID mais le même nom
    const rejoinedRoom = gameManager.joinRoom(roomCode, 'player2_new_socket', playerBefore.name);
    expect(rejoinedRoom).toBeTruthy();

    // Vérifier que c'est bien le même joueur reconnecté
    const playerAfter = rejoinedRoom.players.find(p => p.name === playerBefore.name);
    expect(playerAfter).toBeTruthy();
    expect(playerAfter.disconnected).toBe(false);
    expect(playerAfter.score).toBe(scoreBefore); // Score préservé
    expect(playerAfter.id).toBe('player2_new_socket'); // Nouveau socket ID
  });

  test('Quitter en phase waiting supprime le joueur définitivement', () => {
    const { roomCode } = gameManager.createRoom('player1', 'Alice');
    gameManager.joinRoom(roomCode, 'player2', 'Bob');

    let room = gameManager.getRoom(roomCode);
    expect(room.players).toHaveLength(2);
    expect(room.gameState).toBe('waiting');

    // Quitter en phase waiting
    gameManager.leaveRoom(roomCode, 'player2');
    room = gameManager.getRoom(roomCode);

    expect(room.players).toHaveLength(1);
    expect(room.players.find(p => p.name === 'Bob')).toBeUndefined();

    // Rejoindre à nouveau crée un nouveau joueur
    const rejoinedRoom = gameManager.joinRoom(roomCode, 'player2_new', 'Bob');
    expect(rejoinedRoom.players).toHaveLength(2);
    const newBob = rejoinedRoom.players.find(p => p.name === 'Bob');
    expect(newBob).toBeTruthy();
    expect(newBob.score).toBe(0); // Nouveau joueur, score à 0
  });
});
