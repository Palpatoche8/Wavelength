/**
 * Gestionnaire de parties pour WaveLength
 * Gère la création, la gestion et la suppression des rooms
 */

class GameManager {
  constructor() {
    // Map des rooms actives : { roomCode: { players: [], createdAt: Date } }
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
        joinedAt: new Date()
      }],
      createdAt: new Date(),
      gameState: 'waiting' // waiting, playing, finished
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
      joinedAt: new Date()
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
