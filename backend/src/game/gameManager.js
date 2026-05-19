/**
 * Gestionnaire de parties pour WaveLength
 * Gère la création, la gestion et la suppression des rooms
 */

import { createShuffledDeck } from './cards.js';
import timerManager from './timerManager.js';
import customCardsManager from './customCardsManager.js';

class GameManager {
  constructor() {
    // Map des rooms actives : { roomCode: { players: [], createdAt: Date, game: {...}, settings: {...} } }
    this.rooms = new Map();
  }

  /**
   * Génère un code unique de 4 lettres majuscules
   * @returns {string} Code de room (ex: "ABCD")
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
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
        score: 0,
        team: null, // 'blue' ou 'red' en mode teams
        disconnected: false,
        disconnectedAt: null
      }],
      createdAt: new Date(),
      gameState: 'waiting', // waiting, playing, revealing, scoring, finished
      game: null, // Données de la partie en cours
      teams: {
        blue: { score: 0, players: [] },
        red: { score: 0, players: [] }
      },
      settings: {
        // Paramètres par défaut
        timerEnabled: false,
        psychicTimerDuration: 60, // Timer pour le maître (en secondes)
        playersTimerDuration: 60, // Timer pour les joueurs (en secondes)
        timerDuration: null, // DEPRECATED - garde pour compatibilité
        totalRounds: null, // null (= 2 * nb joueurs), 5, 10, 15
        difficulty: 'normal', // easy, normal, hard
        gameMode: 'ffa', // 'ffa' (chacun pour soi) ou 'teams' (par équipe)
        autoProgressRounds: false, // Progression automatique des tours après 6 secondes
        soundEnabled: true,
        animationsEnabled: true,
        customCardsEnabled: false,
        customCardIds: []
      }
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

    // Vérifier si c'est une reconnexion (même nom, joueur déconnecté)
    const disconnectedPlayer = room.players.find(
      p => p.name === playerName && p.disconnected
    );

    if (disconnectedPlayer) {
      // Reconnexion : mettre à jour l'ID du socket et enlever le flag déconnecté
      console.log(`🔄 Reconnexion de ${playerName} dans ${roomCode}`);
      disconnectedPlayer.id = playerId;
      disconnectedPlayer.disconnected = false;
      disconnectedPlayer.disconnectedAt = null;
      return room;
    }

    // Vérifie si le joueur n'est pas déjà dans la room (même ID)
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      console.log(`⚠️ Joueur ${playerName} déjà dans la room ${roomCode}`);
      return room;
    }

    // Vérifier si un joueur avec le même nom existe déjà (et n'est pas déconnecté)
    const sameNamePlayer = room.players.find(
      p => p.name === playerName && !p.disconnected
    );
    if (sameNamePlayer) {
      console.log(`❌ Un joueur avec le nom ${playerName} existe déjà dans ${roomCode}`);
      return null;
    }

    // Permettre de rejoindre une partie en cours (spectateur temporaire)
    // Le joueur pourra participer à partir du prochain round
    const canJoin = room.gameState === 'waiting' || room.gameState === 'playing' || room.gameState === 'revealing' || room.gameState === 'scoring';

    if (!canJoin) {
      console.log(`❌ ${playerName} ne peut pas rejoindre ${roomCode} : état invalide (${room.gameState})`);
      return null;
    }

    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      joinedAt: new Date(),
      score: 0,
      team: null, // 'blue' ou 'red' en mode teams
      disconnected: false,
      disconnectedAt: null
    });

    console.log(`✅ ${playerName} a rejoint la room ${roomCode} (état: ${room.gameState})`);

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

    // Si la room est vide, la supprimer et arrêter le timer
    if (room.players.length === 0) {
      timerManager.stopTimer(roomCode);
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
   * Marque un joueur comme déconnecté (grace period de 30s)
   * @param {string} roomCode - Code de la room
   * @param {string} playerId - ID du joueur
   * @returns {Object|null} Room mise à jour ou null si room supprimée
   */
  markPlayerDisconnected(roomCode, playerId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      console.log(`⚠️ Joueur ${playerId} introuvable dans ${roomCode}`);
      return room;
    }

    // Marquer comme déconnecté
    player.disconnected = true;
    player.disconnectedAt = new Date();

    console.log(`⏳ ${player.name} marqué comme déconnecté dans ${roomCode} (30s pour se reconnecter)`);

    // Si l'hôte est déconnecté ET qu'il y a d'autres joueurs connectés, promouvoir un autre joueur
    if (player.isHost) {
      const connectedPlayers = room.players.filter(p => !p.disconnected);
      if (connectedPlayers.length > 0) {
        player.isHost = false;
        connectedPlayers[0].isHost = true;
        console.log(`👑 ${connectedPlayers[0].name} est maintenant l'hôte de ${roomCode} (temporaire)`);
      }
    }

    return room;
  }

  /**
   * Nettoie les joueurs déconnectés depuis plus de 30 secondes
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room mise à jour ou null si room supprimée
   */
  cleanupDisconnectedPlayers(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    const now = new Date();
    const DISCONNECT_TIMEOUT = 30000; // 30 secondes

    // Filtrer les joueurs qui sont déconnectés depuis plus de 30s
    const playersToRemove = room.players.filter(p => {
      if (!p.disconnected || !p.disconnectedAt) return false;
      const disconnectDuration = now - new Date(p.disconnectedAt);
      return disconnectDuration >= DISCONNECT_TIMEOUT;
    });

    if (playersToRemove.length > 0) {
      playersToRemove.forEach(p => {
        console.log(`🗑️ Suppression de ${p.name} de ${roomCode} (déconnecté > 30s)`);
      });

      room.players = room.players.filter(p => !playersToRemove.includes(p));

      // Si la room est vide, la supprimer
      if (room.players.length === 0) {
        timerManager.stopTimer(roomCode);
        this.rooms.delete(roomCode);
        console.log(`🗑️ Room ${roomCode} supprimée (vide)`);
        return null;
      }

      // Si l'hôte a été supprimé, promouvoir le premier joueur connecté
      const hasHost = room.players.some(p => p.isHost);
      if (!hasHost && room.players.length > 0) {
        const connectedPlayers = room.players.filter(p => !p.disconnected);
        if (connectedPlayers.length > 0) {
          connectedPlayers[0].isHost = true;
          console.log(`👑 ${connectedPlayers[0].name} est maintenant l'hôte de ${roomCode}`);
        }
      }
    }

    return room;
  }

  /**
   * Assigne les joueurs aux équipes (bleu et rouge) en alternance
   * @param {string} roomCode - Code de la room
   */
  assignTeams(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room) return;

    // Réinitialiser les équipes
    room.teams.blue.players = [];
    room.teams.red.players = [];
    room.teams.blue.score = 0;
    room.teams.red.score = 0;

    // Assigner les joueurs en alternance
    room.players.forEach((player, index) => {
      const team = index % 2 === 0 ? 'blue' : 'red';
      player.team = team;
      room.teams[team].players.push(player.id);
    });

    console.log(`👥 Équipes assignées dans ${roomCode}:`);
    console.log(`   Bleu: ${room.teams.blue.players.length} joueurs`);
    console.log(`   Rouge: ${room.teams.red.players.length} joueurs`);
  }

  /**
   * Démarre une partie dans une room
   * @param {string} roomCode - Code de la room
   * @param {Object} settings - Paramètres optionnels de la partie
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  startGame(roomCode, settings = {}) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      console.log(`❌ Room ${roomCode} introuvable`);
      return null;
    }

    if (room.players.length < 2) {
      console.log(`❌ Pas assez de joueurs dans ${roomCode}`);
      return null;
    }

    // Fusionner les settings fournis avec les settings actuels de la room
    if (settings && Object.keys(settings).length > 0) {
      room.settings = { ...room.settings, ...settings };
    }

    // Si mode teams, assigner les équipes
    if (room.settings.gameMode === 'teams') {
      this.assignTeams(roomCode);
    }

    // Initialiser le jeu avec custom cards si activées
    const customCards = room.settings.customCardsEnabled
      ? customCardsManager.getCards(roomCode)
      : [];

    // Prioriser les cartes custom si l'option est activée (elles apparaissent toutes en premier)
    const deck = createShuffledDeck(customCards, room.settings.customCardsEnabled && customCards.length > 0);

    // Choisir psychique aléatoire au démarrage
    const randomPsychicIndex = Math.floor(Math.random() * room.players.length);

    // Calculer totalRounds : utiliser settings.totalRounds si défini, sinon 2 * nb joueurs
    const totalRounds = room.settings.totalRounds || (room.players.length * 2);

    // Choisir le premier psychique
    let firstPsychicIndex;
    let firstPsychicId;

    if (room.settings.gameMode === 'teams') {
      // Mode teams : équipe bleue commence
      const blueTeamPlayers = room.players.filter(p => p.team === 'blue');
      const randomBluePlayer = blueTeamPlayers[Math.floor(Math.random() * blueTeamPlayers.length)];
      firstPsychicId = randomBluePlayer.id;
      firstPsychicIndex = room.players.findIndex(p => p.id === firstPsychicId);
    } else {
      // Mode FFA : psychique aléatoire
      firstPsychicIndex = Math.floor(Math.random() * room.players.length);
      firstPsychicId = room.players[firstPsychicIndex].id;
    }

    // Tirer la première carte
    const firstCard = deck[0];

    // Générer la première cible (distribution gaussienne)
    const generateTargetValue = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let value = Math.round(10.5 + z0 * 5);
      return Math.max(1, Math.min(20, value));
    };
    const firstTarget = generateTargetValue();

    // Initialiser le jeu avec le round 1 configuré
    room.gameState = 'playing';
    room.game = {
      deck: deck,
      currentCardIndex: 0,
      currentCard: firstCard,
      targetValue: firstTarget,
      psychicIndex: firstPsychicIndex,
      psychicId: firstPsychicId,
      currentRound: 1, // Premier round
      totalRounds: totalRounds,
      guesses: [],
      clue: null,
      startedAt: new Date(),
      roundStartTime: null,
      roundTimeLimit: room.settings.timerDuration,
      timerExpired: false,
      currentTeam: room.settings.gameMode === 'teams' ? 'blue' : null
    };

    console.log(`🎮 Partie créée dans ${roomCode}`);
    console.log(`   Paramètres: timer=${room.settings.timerEnabled}, difficulté=${room.settings.difficulty}, tours=${totalRounds}`);
    console.log(`▶️ Tour ${room.game.currentRound}/${totalRounds} dans ${roomCode}`);
    console.log(`   Psychique: ${room.players[firstPsychicIndex].name}`);
    console.log(`   Carte: ${firstCard.left} ↔ ${firstCard.right}`);

    // Valider la cohérence du jeu
    this.validateGameState(roomCode);

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

    // Arrêter le timer du psychique et démarrer celui des joueurs
    if (room.settings.timerEnabled) {
      timerManager.stopTimer(roomCode);
      this.startRoundTimer(roomCode, 'players');
    }

    return room;
  }

  /**
   * Les joueurs soumettent leur réponse (valeur sur l'échelle 1-20)
   * @param {string} roomCode - Code de la room
   * @param {string} playerId - ID du joueur qui soumet
   * @param {number} value - Valeur de la réponse (1-20)
   * @returns {Object|null} Room mise à jour ou null si erreur
   */
  submitGuess(roomCode, playerId, value) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return null;
    }

    if (room.gameState !== 'playing') {
      return null;
    }

    // Vérifier que ce n'est pas le psychique qui soumet
    if (playerId === room.game.psychicId) {
      console.log(`❌ Le psychique ne peut pas soumettre de réponse`);
      return null;
    }

    // En mode teams, vérifier que le joueur fait partie de l'équipe qui joue
    if (room.settings.gameMode === 'teams') {
      const player = room.players.find(p => p.id === playerId);
      if (!player || player.team !== room.game.currentTeam) {
        console.log(`❌ ${playerId} n'est pas dans l'équipe qui joue (${room.game.currentTeam})`);
        return null;
      }
    }

    // Valider que la valeur est entre 1 et 20
    const clampedValue = Math.max(1, Math.min(20, Math.round(value)));

    // Vérifier si le joueur a déjà répondu
    const existingGuessIndex = room.game.guesses.findIndex(g => g.playerId === playerId);
    if (existingGuessIndex >= 0) {
      // Mettre à jour la réponse existante
      room.game.guesses[existingGuessIndex].guessValue = clampedValue;
      console.log(`🎯 Réponse mise à jour dans ${roomCode}: ${clampedValue} par ${playerId}`);
    } else {
      // Ajouter nouvelle réponse
      room.game.guesses.push({ playerId, guessValue: clampedValue });
      console.log(`🎯 Réponse soumise dans ${roomCode}: ${clampedValue} par ${playerId}`);
    }

    // En mode "chacun pour soi", vérifier si tous les joueurs non-psychiques ont répondu
    if (room.settings.gameMode !== 'teams') {
      const nonPsychicPlayers = room.players.filter(p => p.id !== room.game.psychicId);
      const allAnswered = nonPsychicPlayers.every(p =>
        room.game.guesses.some(g => g.playerId === p.id)
      );

      if (allAnswered) {
        room.gameState = 'revealing';
        console.log(`✅ Tous les joueurs ont répondu, révélation !`);
      }
    } else {
      // En mode teams, un seul joueur répond par tour (comportement actuel)
      room.gameState = 'revealing';
    }

    return room;
  }

  /**
   * Calcule le score selon la distance entre la réponse et la cible
   * @param {number} targetValue - Valeur cible (1-20)
   * @param {number} guessValue - Valeur de la réponse (1-20)
   * @param {string} difficulty - Difficulté (easy, normal, hard)
   * @returns {Object} Score et zone
   */
  calculateScore(targetValue, guessValue, difficulty = 'normal') {
    const distance = Math.abs(targetValue - guessValue);

    let points = 0;
    let zone = 'white';

    // Ajuster les seuils selon la difficulté
    let greenThreshold, yellowThreshold, orangeThreshold;

    switch (difficulty) {
      case 'easy':
        // Plus tolérant
        greenThreshold = 1;  // 0-1
        yellowThreshold = 3; // 2-3
        orangeThreshold = 5; // 4-5
        break;
      case 'hard':
        // Plus strict
        greenThreshold = 0;  // 0 uniquement
        yellowThreshold = 1; // 1 uniquement
        orangeThreshold = 2; // 2 uniquement
        break;
      case 'normal':
      default:
        // Standard
        greenThreshold = 0;  // 0
        yellowThreshold = 1; // 1
        orangeThreshold = 2; // 2
        break;
    }

    if (distance <= greenThreshold) {
      points = 4;
      zone = 'green';
    } else if (distance <= yellowThreshold) {
      points = 3;
      zone = 'yellow';
    } else if (distance <= orangeThreshold) {
      points = 2;
      zone = 'orange';
    }
    // distance > orangeThreshold : 0 point, zone white

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

    // Arrêter le timer du round en cours
    timerManager.stopTimer(roomCode);

    const { targetValue, guesses } = room.game;
    const difficulty = room.settings?.difficulty || 'normal';

    // Gestion des points selon le mode de jeu
    if (room.settings.gameMode === 'teams') {
      // Mode par équipe : un seul joueur répond par tour
      const teamGuess = guesses[0];
      if (!teamGuess) {
        console.log(`   Timeout : aucune réponse soumise`);
        room.gameState = 'scoring';
        room.game.lastResult = { points: 0, zone: 'white', distance: 0, guesses: [] };
        return { room, result: { points: 0, zone: 'white', distance: 0, targetValue, guesses: [] } };
      }

      const result = this.calculateScore(targetValue, teamGuess.guessValue, difficulty);
      const currentTeam = room.game.currentTeam;
      room.teams[currentTeam].score += result.points;

      console.log(`📊 Résultat dans ${roomCode} (Teams):`);
      console.log(`   Équipe ${currentTeam} gagne ${result.points} points`);

      room.gameState = 'scoring';
      room.game.lastResult = {
        ...result,
        targetValue,
        guesses: [{ ...teamGuess, ...result }]
      };

      return {
        room,
        result: { ...result, targetValue, guesses: [{ ...teamGuess, ...result }] }
      };
    } else {
      // Mode chacun pour soi : chaque joueur a sa propre réponse
      const psychicId = room.game.psychicId;
      const totalPlayers = room.players.length;

      if (guesses.length === 0) {
        console.log(`   Timeout : aucun joueur n'a soumis de réponse, aucun point distribué`);
        room.gameState = 'scoring';
        room.game.lastResult = { points: 0, zone: 'white', distance: 0, targetValue, guesses: [] };
        return { room, result: { points: 0, zone: 'white', distance: 0, targetValue, guesses: [] } };
      }

      // Calculer les résultats pour chaque joueur
      const results = guesses.map(guess => {
        const playerResult = this.calculateScore(targetValue, guess.guessValue, difficulty);
        return {
          ...guess,
          ...playerResult
        };
      });

      console.log(`📊 Résultat dans ${roomCode} (Chacun pour soi):`);
      console.log(`   Cible: ${targetValue}`);

      // Distribuer les points à chaque joueur
      let totalPointsForPsychic = 0;
      let playersCount = 0;

      results.forEach(result => {
        const player = room.players.find(p => p.id === result.playerId);
        if (player) {
          player.score += result.points;
          totalPointsForPsychic += result.points;
          playersCount++;
          console.log(`   ${player.name}: ${result.guessValue} → ${result.points} pts (distance: ${result.distance})`);
        }
      });

      // Le maître gagne la moyenne arrondie au supérieur
      if (playersCount > 0 && totalPlayers > 2) {
        const psychicPoints = Math.ceil(totalPointsForPsychic / playersCount);
        const psychic = room.players.find(p => p.id === psychicId);
        if (psychic) {
          psychic.score += psychicPoints;
          console.log(`   ${psychic.name} (Maître) gagne ${psychicPoints} pts (moyenne)`);
        }
      }

      room.gameState = 'scoring';
      room.game.lastResult = {
        targetValue,
        guesses: results
      };

      return {
        room,
        result: {
          targetValue,
          guesses: results
        }
      };
    }
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

    if (room.game.isTransitioning) {
      console.log(`⚠️ Transition déjà en cours pour ${roomCode}`);
      return room;
    }

    room.game.isTransitioning = true;

    const game = room.game;

    // Arrêter le timer du round précédent
    timerManager.stopTimer(roomCode);

    // Incrémenter le round (0 -> 1 pour le premier round)
    game.currentRound++;

    // Vérifier si la partie est terminée
    if (game.currentRound > game.totalRounds) {
      room.gameState = 'finished';
      console.log(`🏁 Partie terminée dans ${roomCode}`);
      return room;
    }

    // Choisir le psychique
    if (room.settings.gameMode === 'teams') {
      // Mode par équipe : alterner l'équipe qui joue (sauf au premier round)
      if (game.currentRound > 1) {
        game.currentTeam = game.currentTeam === 'blue' ? 'red' : 'blue';
      }
      // Au premier round, currentTeam est déjà défini à 'blue' dans startGame

      // Choisir un psychique de l'équipe qui joue
      const teamPlayers = room.players.filter(p => p.team === game.currentTeam);
      const randomTeamPlayerIndex = Math.floor(Math.random() * teamPlayers.length);
      const psychic = teamPlayers[randomTeamPlayerIndex];

      game.psychicId = psychic.id;
      game.psychicIndex = room.players.findIndex(p => p.id === psychic.id);

      console.log(`   Équipe ${game.currentTeam} joue`);
    } else {
      // Mode chacun pour soi
      if (game.currentRound === 1) {
        // Premier round : choisir un psychique aléatoire
        game.psychicIndex = Math.floor(Math.random() * room.players.length);
      } else {
        // Rounds suivants : rotation normale
        game.psychicIndex = (game.psychicIndex + 1) % room.players.length;
      }
      game.psychicId = room.players[game.psychicIndex].id;
    }

    // Tirer une nouvelle carte
    game.currentCardIndex = (game.currentCardIndex + 1) % game.deck.length;
    game.currentCard = game.deck[game.currentCardIndex];

    // Nouvelle cible aléatoire (1-20) avec distribution gaussienne
    const generateTargetValue = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let value = Math.round(10.5 + z0 * 5);
      return Math.max(1, Math.min(20, value));
    };
    game.targetValue = generateTargetValue();

    // Réinitialiser l'état du tour
    game.guesses = [];
    game.clue = null;
    game.lastResult = null;
    game.timerExpired = false;

    room.gameState = 'playing';

    console.log(`▶️ Tour ${game.currentRound}/${game.totalRounds} dans ${roomCode}`);
    console.log(`   Psychique: ${room.players[game.psychicIndex].name}`);
    console.log(`   Carte: ${game.currentCard.left} ↔ ${game.currentCard.right}`);

    // Démarrer le timer du psychique pour le nouveau round si activé
    if (room.settings.timerEnabled) {
      this.startRoundTimer(roomCode, 'psychic');
    }

    room.game.isTransitioning = false;

    // Valider la cohérence du jeu (debug)
    this.validateGameState(roomCode);

    return room;
  }

  /**
   * Passe au tour suivant avec le même thème/carte
   * @param {string} roomCode - Code de la room
   * @returns {Object|null} Room mise à jour
   */
  nextRoundSameCard(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return null;
    }

    if (room.game.isTransitioning) {
      console.log(`⚠️ Transition déjà en cours pour ${roomCode}`);
      return room;
    }

    room.game.isTransitioning = true;

    const game = room.game;

    // Arrêter le timer du round précédent
    timerManager.stopTimer(roomCode);

    // Incrémenter le round
    game.currentRound++;

    // Vérifier si la partie est terminée
    if (game.currentRound > game.totalRounds) {
      room.gameState = 'finished';
      console.log(`🏁 Partie terminée dans ${roomCode}`);
      return room;
    }

    // Choisir le prochain psychique
    if (room.settings.gameMode === 'teams') {
      // Mode par équipe : alterner l'équipe qui joue
      if (game.currentRound > 1) {
        game.currentTeam = game.currentTeam === 'blue' ? 'red' : 'blue';
      }

      // Choisir un psychique de l'équipe qui joue
      const teamPlayers = room.players.filter(p => p.team === game.currentTeam);
      const randomTeamPlayerIndex = Math.floor(Math.random() * teamPlayers.length);
      const psychic = teamPlayers[randomTeamPlayerIndex];

      game.psychicId = psychic.id;
      game.psychicIndex = room.players.findIndex(p => p.id === psychic.id);

      console.log(`   Équipe ${game.currentTeam} joue`);
    } else {
      // Mode chacun pour soi : rotation normale
      game.psychicIndex = (game.psychicIndex + 1) % room.players.length;
      game.psychicId = room.players[game.psychicIndex].id;
    }

    // GARDER LA MÊME CARTE (pas d'incrémentation de currentCardIndex)
    // game.currentCard reste inchangé

    // Nouvelle cible aléatoire (1-20) avec distribution gaussienne
    const generateTargetValue = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let value = Math.round(10.5 + z0 * 5);
      return Math.max(1, Math.min(20, value));
    };
    game.targetValue = generateTargetValue();

    // Réinitialiser l'état du tour
    game.guesses = [];
    game.clue = null;
    game.lastResult = null;
    game.timerExpired = false;

    room.gameState = 'playing';

    console.log(`▶️ Tour ${game.currentRound}/${game.totalRounds} dans ${roomCode} (MÊME THÈME)`);
    console.log(`   Psychique: ${room.players[game.psychicIndex].name}`);
    console.log(`   Carte: ${game.currentCard.left} ↔ ${game.currentCard.right}`);

    // Démarrer le timer du psychique pour le nouveau round si activé
    if (room.settings.timerEnabled) {
      this.startRoundTimer(roomCode, 'psychic');
    }

    room.game.isTransitioning = false;

    // Valider la cohérence du jeu (debug)
    this.validateGameState(roomCode);

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

    // Arrêter le timer en cours
    timerManager.stopTimer(roomCode);

    // Réinitialiser les scores des joueurs
    room.players.forEach(player => {
      player.score = 0;
    });

    // Réinitialiser les scores des équipes
    if (room.teams) {
      room.teams.blue.score = 0;
      room.teams.red.score = 0;
    }

    // Réinitialiser l'état du jeu
    room.gameState = 'waiting';
    room.game = null;

    console.log(`🔄 Partie réinitialisée dans ${roomCode}`);

    return room;
  }

  /**
   * Valide la cohérence de l'état du jeu (debug & synchronisation)
   * @param {string} roomCode - Code de la room
   * @returns {Object} Résultat de la validation avec warnings
   */
  validateGameState(roomCode) {
    const room = this.rooms.get(roomCode);
    const warnings = [];

    if (!room) {
      return { valid: false, warnings: ['Room introuvable'] };
    }

    if (!room.game || room.gameState !== 'playing') {
      return { valid: true, warnings: [] }; // Pas de jeu en cours, pas besoin de valider
    }

    const game = room.game;

    // Vérifier qu'il y a UN SEUL maître
    if (!game.psychicId) {
      warnings.push('⚠️ CRITIQUE: Aucun maître défini');
    } else {
      const psychic = room.players.find(p => p.id === game.psychicId);
      if (!psychic) {
        warnings.push(`⚠️ CRITIQUE: Le maître ${game.psychicId} n'existe pas dans la liste des joueurs`);
      }

      // Vérifier que psychicIndex correspond à psychicId
      if (game.psychicIndex !== null) {
        const playerAtIndex = room.players[game.psychicIndex];
        if (!playerAtIndex || playerAtIndex.id !== game.psychicId) {
          warnings.push(`⚠️ Incohérence: psychicIndex (${game.psychicIndex}) ne correspond pas à psychicId (${game.psychicId})`);
        }
      }
    }

    // Vérifier qu'il y a une carte actuelle
    if (!game.currentCard) {
      warnings.push('⚠️ Aucune carte définie pour le round actuel');
    }

    // Vérifier qu'il y a une cible
    if (game.targetValue === null || game.targetValue === undefined) {
      warnings.push('⚠️ CRITIQUE: Aucune valeur cible définie');
    } else if (game.targetValue < 1 || game.targetValue > 20) {
      warnings.push(`⚠️ Valeur cible invalide: ${game.targetValue} (doit être entre 1 et 20)`);
    }

    // Vérifier le numéro de round
    if (game.currentRound < 1) {
      warnings.push(`⚠️ Numéro de round invalide: ${game.currentRound} (doit être >= 1)`);
    }
    if (game.currentRound > game.totalRounds) {
      warnings.push(`⚠️ Round actuel (${game.currentRound}) dépasse le total (${game.totalRounds})`);
    }

    // Logger les warnings
    if (warnings.length > 0) {
      console.log(`\n🔍 Validation de ${roomCode} - Round ${game.currentRound}:`);
      warnings.forEach(w => console.log(`   ${w}`));
      console.log(`   Maître: ${game.psychicId} (index: ${game.psychicIndex})`);
      console.log(`   Carte: ${game.currentCard?.left} ↔ ${game.currentCard?.right}`);
      console.log(`   Cible: ${game.targetValue}`);
    }

    return {
      valid: warnings.filter(w => w.includes('CRITIQUE')).length === 0,
      warnings
    };
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

  /**
   * Démarre le timer pour un round
   * @param {string} roomCode - Code de la room
   * @param {string} timerType - Type de timer : 'psychic' ou 'players'
   * @param {Function} onTick - Callback optionnel appelé chaque seconde
   * @param {Function} onExpireCallback - Callback optionnel appelé en plus de handleTimerExpire
   */
  startRoundTimer(roomCode, timerType = 'psychic', onTick = null, onExpireCallback = null) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game || !room.settings.timerEnabled) {
      return;
    }

    // Déterminer la durée selon le type de timer
    let duration;
    if (timerType === 'psychic') {
      duration = room.settings.psychicTimerDuration || room.settings.timerDuration || 60;
    } else {
      duration = room.settings.playersTimerDuration || room.settings.timerDuration || 60;
    }

    if (!duration) return;

    room.game.roundStartTime = new Date();
    room.game.timerExpired = false;
    room.game.currentTimerType = timerType; // Stocker le type de timer actif

    // Callback d'expiration : forcer la soumission ou passer au round suivant
    const onExpire = () => {
      this.handleTimerExpire(roomCode);

      // Appeler le callback custom si fourni (pour émettre socket event)
      if (onExpireCallback) {
        onExpireCallback(roomCode);
      }
    };

    console.log(`⏱️ Démarrage timer ${timerType} pour ${roomCode}: ${duration}s`);
    timerManager.startTimer(roomCode, duration, onExpire, onTick);
  }

  /**
   * Gère l'expiration du timer d'un round
   * @param {string} roomCode - Code de la room
   */
  handleTimerExpire(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room || !room.game) {
      return;
    }

    console.log(`⏰ Timer expiré pour ${roomCode} - Round ${room.game.currentRound}`);

    room.game.timerExpired = true;

    // Si on est en attente de réponses, passer à la révélation
    // Les joueurs qui n'ont pas répondu n'auront pas de points
    if (room.gameState === 'playing' && room.game.clue) {
      console.log(`   → Révélation automatique (timeout)`);
      room.gameState = 'revealing';
    }
    // Si le maître n'a pas encore donné d'indice, passer directement au prochain tour
    else if (room.gameState === 'playing' && !room.game.clue) {
      console.log(`   → Pas d'indice donné, passage au prochain tour`);
      // On passe directement au prochain tour
      this.nextRound(roomCode);
    }
  }

  /**
   * Met à jour les paramètres d'une room
   * @param {string} roomCode - Code de la room
   * @param {Object} newSettings - Nouveaux paramètres
   * @returns {Object|null} Room mise à jour
   */
  updateSettings(roomCode, newSettings) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    // Fusionner les nouveaux settings
    room.settings = { ...room.settings, ...newSettings };

    console.log(`⚙️ Settings mis à jour pour ${roomCode}:`, newSettings);

    return room;
  }

  /**
   * Récupère le temps restant pour le round actuel
   * @param {string} roomCode - Code de la room
   * @returns {number} Temps restant en secondes
   */
  getRemainingTime(roomCode) {
    return timerManager.getRemainingTime(roomCode);
  }
}

// Export singleton
export default new GameManager();
