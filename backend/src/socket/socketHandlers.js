/**
 * Gestionnaires d'événements Socket.IO pour WaveLength
 */

import gameManager from '../game/gameManager.js';

/**
 * Configure les gestionnaires d'événements Socket.IO
 * @param {Object} io - Instance Socket.IO
 */
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Nouveau client connecté: ${socket.id}`);

    // Créer une nouvelle room
    socket.on('create-room', ({ playerName }) => {
      console.log(`📝 Demande de création de room par ${playerName}`);

      const { roomCode, room } = gameManager.createRoom(socket.id, playerName);

      // Rejoindre la room Socket.IO
      socket.join(roomCode);

      // Envoyer la confirmation au créateur
      socket.emit('room-created', {
        success: true,
        roomCode,
        room
      });

      // Informer tous les clients de la room
      io.to(roomCode).emit('room-updated', room);
    });

    // Rejoindre une room existante
    socket.on('join-room', ({ roomCode, playerName }) => {
      console.log(`🚪 ${playerName} tente de rejoindre ${roomCode}`);

      const room = gameManager.joinRoom(roomCode, socket.id, playerName);

      if (!room) {
        socket.emit('join-room-error', {
          success: false,
          message: `La room ${roomCode} n'existe pas`
        });
        return;
      }

      // Rejoindre la room Socket.IO
      socket.join(roomCode.toUpperCase());

      // Confirmer au joueur qu'il a rejoint
      socket.emit('room-joined', {
        success: true,
        roomCode: roomCode.toUpperCase(),
        room
      });

      // Informer tous les clients de la room de la mise à jour
      io.to(roomCode.toUpperCase()).emit('room-updated', room);

      // Notifier les autres joueurs
      socket.to(roomCode.toUpperCase()).emit('player-joined', {
        playerId: socket.id,
        playerName
      });
    });

    // Quitter une room
    socket.on('leave-room', ({ roomCode }) => {
      console.log(`👋 ${socket.id} quitte ${roomCode}`);

      const room = gameManager.leaveRoom(roomCode, socket.id);

      socket.leave(roomCode);

      if (room) {
        // Informer les joueurs restants
        io.to(roomCode).emit('room-updated', room);
        io.to(roomCode).emit('player-left', {
          playerId: socket.id
        });
      }

      socket.emit('left-room', { success: true });
    });

    // Déconnexion du client
    socket.on('disconnect', () => {
      console.log(`❌ Client déconnecté: ${socket.id}`);

      // Retirer le joueur de toutes les rooms
      const rooms = gameManager.getAllRooms();
      rooms.forEach(room => {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          const updatedRoom = gameManager.leaveRoom(room.code, socket.id);

          if (updatedRoom) {
            io.to(room.code).emit('room-updated', updatedRoom);
            io.to(room.code).emit('player-left', {
              playerId: socket.id
            });
          }
        }
      });
    });

    // Debug: obtenir l'état d'une room
    socket.on('get-room-state', ({ roomCode }) => {
      const room = gameManager.getRoom(roomCode);
      socket.emit('room-state', room);
    });
  });

  // Log périodique des statistiques
  setInterval(() => {
    const roomCount = gameManager.getRoomCount();
    const clientCount = io.engine.clientsCount;
    console.log(`📊 Stats: ${roomCount} room(s) active(s), ${clientCount} client(s) connecté(s)`);
  }, 60000); // Toutes les 60 secondes
}
