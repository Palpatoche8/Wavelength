import { useState, useEffect } from 'react';

/**
 * Composant de la salle de jeu
 * Affiche les joueurs connectés et le statut de la partie
 */
function GameRoom({ room, socket, playerName, onLeaveRoom }) {
  const [currentRoom, setCurrentRoom] = useState(room);
  const [copiedCode, setCopiedCode] = useState(false);

  // Écouter les mises à jour de la room
  useEffect(() => {
    if (!socket) return;

    socket.on('room-updated', (updatedRoom) => {
      console.log('🔄 Room mise à jour', updatedRoom);
      setCurrentRoom(updatedRoom);
    });

    socket.on('player-joined', ({ playerName: newPlayerName }) => {
      console.log(`👋 ${newPlayerName} a rejoint la partie`);
    });

    socket.on('player-left', ({ playerId }) => {
      console.log(`👋 Joueur ${playerId} a quitté la partie`);
    });

    return () => {
      socket.off('room-updated');
      socket.off('player-joined');
      socket.off('player-left');
    };
  }, [socket]);

  // Copier le code de la room
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Trouver le joueur actuel
  const currentPlayer = currentRoom.players.find(p => p.name === playerName);
  const isHost = currentPlayer?.isHost || false;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* En-tête de la room */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Bannière du code */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Salle de jeu
              </h2>
              <button
                onClick={onLeaveRoom}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                🚪 Quitter
              </button>
            </div>

            {/* Code de la room */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-1">Code de la partie :</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-mono font-bold tracking-widest">
                    {currentRoom.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                  >
                    {copiedCode ? '✓ Copié !' : '📋 Copier'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de la room */}
          <div className="p-6">
            {/* Liste des joueurs */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>👥 Joueurs connectés</span>
                <span className="text-sm font-normal text-gray-500">
                  ({currentRoom.players.length})
                </span>
              </h3>

              <div className="space-y-2">
                {currentRoom.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      player.name === playerName
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {player.name}
                          {player.name === playerName && (
                            <span className="text-primary-600 ml-2">(Vous)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(player.joinedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {player.isHost && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        👑 Hôte
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Statut de la partie */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>En attente de joueurs...</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Partagez le code <strong>{currentRoom.code}</strong> avec vos amis pour commencer à jouer !
              </p>
            </div>

            {/* Bouton de démarrage (pour l'hôte uniquement) */}
            {isHost && (
              <div className="mt-6">
                <button
                  disabled={currentRoom.players.length < 2}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all ${
                    currentRoom.players.length >= 2
                      ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  🎮 Démarrer la partie
                  {currentRoom.players.length < 2 && (
                    <span className="text-sm font-normal ml-2">
                      (minimum 2 joueurs)
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            🎯 Prochaines étapes
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Room créée avec succès</li>
            <li>✓ {currentRoom.players.length} joueur(s) connecté(s)</li>
            <li>• Attendez que tous les joueurs rejoignent</li>
            <li>• L'hôte pourra démarrer la partie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
