/**
 * Gestionnaire de parties pour WaveLength
 * Gère la création, la gestion et la suppression des rooms
 */

import { createShuffledDeck } from './cards.js';

class GameManager {
  constructor() {
    // Map des rooms actives : { roomCode: { players: [], createdAt: Date, game: {...} } }
    this.rooms = new Map();
  }

  /**
   * Génère un code unique de 4 lettres majuscules
   * @returns {string} Code de room (ex: "ABCD")
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    // Génère un code et vérifie qu'il n'existe pas déjà
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));

    return code;
  }

  /**
   * Crée une nouvelle room
   * @param {string} playerId - ID du joueur créateur
   * @param {string} playerName - Nom du joueur créateur
   * @returns {Object} Informations sur la room créée
   */
  createRoom(playerId, playerName) {
    const roomCode = this.generateRoomCode();

    this.rooms.set(roomCode, {
      code: roomCode,
      players: [{
        id: playerId,
        name: playerName,
        isHost: true,
        joinedAt: new Date(),
        score: 0
      }],
      createdAt: new Date(),
      gameState: 'waiting', // waiting, playing, revealing, scoring, finished
      game: null // Données de la partie en cours
    });

    console.log(`✅ Room créée: ${roomCode} par ${playerName}`);

    return {
      roomCode,
      room: this.rooms.get(roomCode)
    };
  }

  /**
   * Ajoute un joueur à une room existante
   * @param {string} roomCode - Code de la room
   * @param {string} playerId - ID du joueur
   * @param {string} playerName - Nom du joueur
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  joinRoom(roomCode, playerId, playerName) {
    const room = this.rooms.get(roomCode.toUpperCase());

    if (!room) {
      console.log(`❌ Room ${roomCode} introuvable`);
      return null;
    }

    // Vérifie si le joueur n'est pas déjà dans la room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      console.log(`⚠️ Joueur ${playerName} déjà dans la room ${roomCode}`);
      return room;
    }

    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      joinedAt: new Date(),
      score: 0
    });

    console.log(`✅ ${playerName} a rejoint la room ${roomCode}`);

    return room;
  }

  /**
   * Retire un joueur d'une room
   * @param {string} roomCode - Code de la room
   * @param {string} playerId - ID du joueur
   * @returns {Object|null} Room mise à jour ou null si room supprimée
   */
  leaveRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    // Retire le joueur de la liste
    room.players = room.players.filter(p => p.id !== playerId);

    // Si la room est vide, la supprimer
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      console.log(`🗑️ Room ${roomCode} supprimée (vide)`);
      return null;
    }

    // Si l'hôte est parti, promouvoir le premier joueur
    const hasHost = room.players.some(p => p.isHost);
    if (!hasHost && room.players.length > 0) {
      room.players[0].isHost = true;
      console.log(`👑 ${room.players[0].name} est maintenant l'hôte de ${roomCode}`);
    }

    console.log(`👋 Joueur ${playerId} a quitté la room ${roomCode}`);

    return room;
  }

  /**
   * Démarre une partie dans une room
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  startGame(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      console.log(`❌ Room ${roomCode} introuvable`);
      return null;
    }

    if (room.players.length < 2) {
      console.log(`❌ Pas assez de joueurs dans ${roomCode}`);
      return null;
    }

    // Initialiser le jeu
    const deck = createShuffledDeck();
    const randomPsychicIndex = Math.floor(Math.random() * room.players.length); // ← Ajoute cette ligne

    room.gameState = 'playing';
    room.game = {
      deck: deck,
      currentCardIndex: 0,
      currentCard: deck[0],
      targetValue: Math.floor(Math.random() * 20) + 1, // 1 à 20
      psychicIndex: randomPsychicIndex, // ← Utilise la variable
      psychicId: room.players[randomPsychicIndex].id, // ← Utilise la variable
      currentRound: 0,
      totalRounds: room.players.length * 2, // 2 tours par joueur
      guessValue: null,
      clue: null,
      startedAt: new Date()
    };

    console.log(`🎮 Partie démarrée dans ${roomCode}`);
    console.log(`   Carte: ${room.game.currentCard.left} ↔ ${room.game.currentCard.right}`);
    console.log(`   Cible: ${room.game.targetValue}`);
    console.log(`   Psychique: ${room.players[room.game.psychicIndex].name}`);

    return room;
  }

  /**
   * Le psychique donne un indice
   * @param {string} roomCode - Code de la room
   * @param {string} playerId - ID du psychique
   * @param {string} clue - Indice donné
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  submitClue(roomCode, playerId, clue) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return null;
    }

    if (room.game.psychicId !== playerId) {
      console.log(`❌ ${playerId} n'est pas le psychique`);
      return null;
    }

    room.game.clue = clue;
    console.log(`💡 Indice donné dans ${roomCode}: "${clue}"`);

    return room;
  }

  /**
   * Les joueurs soumettent leur réponse (valeur sur l'échelle 1-20)
   * @param {string} roomCode - Code de la room
   * @param {number} value - Valeur de la réponse (1-20)
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  submitGuess(roomCode, value) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return null;
    }

    if (room.gameState !== 'playing') {
      return null;
    }

    // Valider que la valeur est entre 1 et 20
    const clampedValue = Math.max(1, Math.min(20, Math.round(value)));

    room.game.guessValue = clampedValue;
    room.gameState = 'revealing';

    console.log(`🎯 Réponse soumise dans ${roomCode}: ${clampedValue}`);

    return room;
  }

  /**
   * Calcule le score selon la distance entre la réponse et la cible
   * @param {number} targetValue - Valeur cible (1-20)
   * @param {number} guessValue - Valeur de la réponse (1-20)
   * @returns {Object} Score et zone
   */
  calculateScore(targetValue, guessValue) {
    const distance = Math.abs(targetValue - guessValue);

    let points = 0;
    let zone = 'white';

    if (distance === 0) {
      // Valeur exacte
      points = 4;
      zone = 'green';
    } else if (distance === 1) {
      // ±1 point d'écart
      points = 3;
      zone = 'yellow';
    } else if (distance === 2) {
      // ±2 points d'écart
      points = 2;
      zone = 'orange';
    }
    // distance > 2 : 0 point, zone white

    return { points, zone, distance };
  }

  /**
   * Révèle le résultat et calcule les scores
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Résultat avec scores
   */
  revealResult(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game || room.gameState !== 'revealing') {
      return null;
    }

    const { targetValue, guessValue } = room.game;
    const result = this.calculateScore(targetValue, guessValue);

    // Ajouter les points à tous les joueurs (sauf le psychique)
    room.players.forEach(player => {
      if (player.id !== room.game.psychicId) {
        player.score += result.points;
      }
    });

    room.gameState = 'scoring';
    room.game.lastResult = result;

    console.log(`📊 Résultat dans ${roomCode}:`);
    console.log(`   Cible: ${targetValue}, Réponse: ${guessValue}`);
    console.log(`   Distance: ${result.distance}, Zone: ${result.zone}, Points: ${result.points}`);

    return {
      room,
      result: {
        ...result,
        targetValue,
        guessValue
      }
    };
  }

  /**
   * Passe au tour suivant
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room mise à jour
   */
  nextRound(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return null;
    }

    const game = room.game;

    // Vérifier si la partie est terminée
    if (game.currentRound >= game.totalRounds) {
      room.gameState = 'finished';
      console.log(`🏁 Partie terminée dans ${roomCode}`);
      return room;
    }

    // Passer au joueur psychique suivant
    game.psychicIndex = (game.psychicIndex + 1) % room.players.length;
    game.psychicId = room.players[game.psychicIndex].id;

    // Tirer une nouvelle carte
    game.currentCardIndex = (game.currentCardIndex + 1) % game.deck.length;
    game.currentCard = game.deck[game.currentCardIndex];

    // Nouvelle cible aléatoire (1-20)
    game.targetValue = Math.floor(Math.random() * 20) + 1;

    // Réinitialiser l'état du tour
    game.guessValue = null;
    game.clue = null;
    game.lastResult = null;
    game.currentRound++;

    room.gameState = 'playing';

    console.log(`▶️ Tour ${game.currentRound}/${game.totalRounds} dans ${roomCode}`);
    console.log(`   Psychique: ${room.players[game.psychicIndex].name}`);
    console.log(`   Carte: ${game.currentCard.left} ↔ ${game.currentCard.right}`);

    return room;
  }

  /**
   * Réinitialise une partie pour rejouer
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room réinitialisée
   */
  resetGame(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    // Réinitialiser les scores
    room.players.forEach(player => {
      player.score = 0;
    });

    room.gameState = 'waiting';
    room.game = null;

    console.log(`🔄 Partie réinitialisée dans ${roomCode}`);

    return room;
  }

  /**
   * Récupère les informations d'une room
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room ou null si introuvable
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  /**
   * Récupère toutes les rooms actives (pour debug)
   * @returns {Array} Liste des rooms
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Compte le nombre de rooms actives
   * @returns {number} Nombre de rooms
   */
  getRoomCount() {
    return this.rooms.size;
  }
}

// Export singleton
export default new GameManager();
