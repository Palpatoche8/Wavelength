/**
 * Gestionnaires d'événements Socket.IO pour WaveLength
 */

import gameManager from '../game/gameManager.js';
import customCardsManager from '../game/customCardsManager.js';

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

    // ========== GESTION DU JEU ==========

    // Démarrer la partie
    socket.on('start-game', ({ roomCode, settings }) => {
      console.log(`🎮 Demande de démarrage de partie dans ${roomCode}`);

      const room = gameManager.startGame(roomCode, settings);

      if (!room) {
        socket.emit('start-game-error', {
          success: false,
          message: 'Impossible de démarrer la partie'
        });
        return;
      }

      // Envoyer l'état du jeu à tous les joueurs
      io.to(roomCode).emit('game-started', {
        success: true,
        room
      });

      // Envoyer la cible secrète uniquement au psychique
      // Utiliser io.to() avec l'ID du socket pour cibler directement le psychique
      io.to(room.game.psychicId).emit('target-revealed', {
        targetValue: room.game.targetValue
      });

      // Si le timer est activé, démarrer avec callbacks tick et expire
      if (room.settings.timerEnabled && room.settings.timerDuration) {
        const onTick = (remainingTime) => {
          io.to(roomCode).emit('timer-tick', {
            remainingTime,
            roomCode
          });
        };

        const onExpire = (roomCode) => {
          io.to(roomCode).emit('timer-expired', {
            roomCode,
            room: gameManager.getRoom(roomCode)
          });
        };

        gameManager.startRoundTimer(roomCode, onTick, onExpire);
      }
      setTimeout(() => {
      const updatedRoom = gameManager.nextRound(roomCode);
      if (updatedRoom && updatedRoom.gameState === 'playing') {
        io.to(roomCode).emit('round-started', {
          success: true,
          room: updatedRoom
        });
    
      io.to(updatedRoom.game.psychicId).emit('target-revealed', {
        targetValue: updatedRoom.game.targetValue
       });
      }
      }, 100); // Petit délai pour la synchronisation
    });

    // Le psychique soumet un indice
    socket.on('submit-clue', ({ roomCode, clue }) => {
      console.log(`💡 Indice soumis dans ${roomCode}: "${clue}"`);

      const room = gameManager.submitClue(roomCode, socket.id, clue);

      if (!room) {
        socket.emit('submit-clue-error', {
          success: false,
          message: 'Erreur lors de la soumission de l\'indice'
        });
        return;
      }

      // Informer tous les joueurs de l'indice
      io.to(roomCode).emit('clue-submitted', {
        success: true,
        clue,
        room
      });
    });

    // Les joueurs soumettent leur réponse
    socket.on('submit-guess', ({ roomCode, value }) => {
      console.log(`🎯 Réponse soumise dans ${roomCode}: ${value}`);

      const room = gameManager.submitGuess(roomCode, socket.id, value);

      if (!room) {
        socket.emit('submit-guess-error', {
          success: false,
          message: 'Erreur lors de la soumission de la réponse'
        });
        return;
      }

      // Passer automatiquement à la révélation
      const resultData = gameManager.revealResult(roomCode);

      if (resultData) {
        // Informer tous les joueurs du résultat
        io.to(roomCode).emit('result-revealed', {
          success: true,
          result: resultData.result,
          room: resultData.room
        });
      }
    });

    // Passer au tour suivant
    socket.on('next-round', ({ roomCode }) => {
      console.log(`▶️ Passage au tour suivant dans ${roomCode}`);

      const room = gameManager.nextRound(roomCode);

      if (!room) {
        socket.emit('next-round-error', {
          success: false,
          message: 'Erreur lors du passage au tour suivant'
        });
        return;
      }

      if (room.gameState === 'finished') {
        // La partie est terminée
        io.to(roomCode).emit('game-finished', {
          success: true,
          room
        });
      } else {
        // Nouveau tour
        io.to(roomCode).emit('round-started', {
          success: true,
          room
        });

        // Envoyer la nouvelle cible au nouveau psychique
        io.to(room.game.psychicId).emit('target-revealed', {
          targetValue: room.game.targetValue
        });

        // Si le timer est activé, démarrer avec callbacks tick et expire
        if (room.settings.timerEnabled && room.settings.timerDuration) {
          const onTick = (remainingTime) => {
            io.to(roomCode).emit('timer-tick', {
              remainingTime,
              roomCode
            });
          };

          const onExpire = (roomCode) => {
            io.to(roomCode).emit('timer-expired', {
              roomCode,
              room: gameManager.getRoom(roomCode)
            });
          };

          gameManager.startRoundTimer(roomCode, onTick, onExpire);
        }
      }
    });

    // Rejouer (réinitialiser la partie)
    socket.on('reset-game', ({ roomCode }) => {
      console.log(`🔄 Réinitialisation de la partie dans ${roomCode}`);

      const room = gameManager.resetGame(roomCode);

      if (!room) {
        socket.emit('reset-game-error', {
          success: false,
          message: 'Erreur lors de la réinitialisation'
        });
        return;
      }

      io.to(roomCode).emit('game-reset', {
        success: true,
        room
      });
    });

    // Mettre à jour les paramètres d'une room (avant de démarrer)
    socket.on('update-settings', ({ roomCode, settings }) => {
      console.log(`⚙️ Mise à jour des paramètres pour ${roomCode}`);

      const room = gameManager.updateSettings(roomCode, settings);

      if (!room) {
        socket.emit('update-settings-error', {
          success: false,
          message: 'Room introuvable'
        });
        return;
      }

      // Informer tous les joueurs des nouveaux paramètres
      io.to(roomCode).emit('settings-updated', {
        success: true,
        settings: room.settings,
        room
      });
    });

    // ========== DÉCONNEXION ==========

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

    // ========== CUSTOM CARDS ==========

    // Ajouter une carte personnalisée
    socket.on('add-custom-card', ({ roomCode, card }) => {
      const newCard = customCardsManager.addCard(roomCode, card);
      io.to(roomCode).emit('custom-card-added', { card: newCard });
    });

    // Supprimer une carte personnalisée
    socket.on('remove-custom-card', ({ roomCode, cardId }) => {
      const success = customCardsManager.removeCard(roomCode, cardId);
      if (success) {
        io.to(roomCode).emit('custom-card-removed', { cardId });
      }
    });

    // Importer des cartes
    socket.on('import-custom-cards', ({ roomCode, cards }) => {
      try {
        const imported = customCardsManager.importCards(roomCode, cards);
        io.to(roomCode).emit('custom-cards-imported', { cards: imported });
      } catch (error) {
        socket.emit('import-error', { message: error.message });
      }
    });

    // Exporter des cartes
    socket.on('export-custom-cards', ({ roomCode }) => {
      const json = customCardsManager.exportCards(roomCode);
      socket.emit('custom-cards-exported', { json });
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
