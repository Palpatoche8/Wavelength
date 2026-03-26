import { useState, useEffect } from 'react';
import HelpModal from './HelpModal';

/**
 * Composant de la salle de jeu
 * Affiche les joueurs connectés et le statut de la partie
 */
function GameRoom({ room, socket, playerName, onLeaveRoom }) {
  const [currentRoom, setCurrentRoom] = useState(room);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  // Démarrer la partie
  const handleStartGame = () => {
    socket.emit('start-game', {
      roomCode: currentRoom.code
    });
  };

  // Mettre à jour les paramètres
  const handleUpdateSettings = (newSettings) => {
    socket.emit('update-settings', {
      roomCode: currentRoom.code,
      settings: newSettings
    });
  };

  // Écouter les mises à jour de paramètres
  useEffect(() => {
    if (!socket) return;

    socket.on('settings-updated', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
    });

    return () => {
      socket.off('settings-updated');
    };
  }, [socket]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Bouton Help flottant */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed top-4 right-4 w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Aide"
      >
        <span className="text-xl font-bold">?</span>
      </button>

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
                 Quitter
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
                    {copiedCode ? '✓ Copié !' : ' Copier'}
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
                      player.disconnected
                        ? 'border-gray-300 bg-gray-100 opacity-60'
                        : player.name === playerName
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        player.disconnected
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-br from-primary-400 to-indigo-500'
                      }`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {player.name}
                          {player.name === playerName && (
                            <span className="text-primary-600 ml-2">(Vous)</span>
                          )}
                          {player.disconnected && (
                            <span className="text-red-600 ml-2 text-xs">(Déconnecté)</span>
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

            {/* Paramètres de la partie (pour l'hôte uniquement) */}
            {isHost && (
              <div className="mt-6">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-between"
                >
                  <span>⚙️ Paramètres de la partie</span>
                  <span>{showSettings ? '▲' : '▼'}</span>
                </button>

                {showSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    {/* Mode de jeu */}
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        🎮 Mode de jeu
                      </label>
                      <select
                        value={currentRoom.settings.gameMode || 'ffa'}
                        onChange={(e) => {
                          handleUpdateSettings({
                            ...currentRoom.settings,
                            gameMode: e.target.value
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ffa">Chacun pour soi</option>
                        <option value="teams">Par équipe</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-1">
                        {currentRoom.settings.gameMode === 'teams'
                          ? '⚠️ Mode par équipe : les joueurs seront divisés en 2 équipes (bleu vs rouge)'
                          : 'Chaque joueur gagne des points individuellement'}
                      </p>
                    </div>

                    {/* Timer */}
                    <div>
                      <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">⏱️ Timer par tour</span>
                        <input
                          type="checkbox"
                          checked={currentRoom.settings.timerEnabled}
                          onChange={(e) => {
                            handleUpdateSettings({
                              ...currentRoom.settings,
                              timerEnabled: e.target.checked,
                              psychicTimerDuration: e.target.checked ? (currentRoom.settings.psychicTimerDuration || 60) : 60,
                              playersTimerDuration: e.target.checked ? (currentRoom.settings.playersTimerDuration || 60) : 60
                            });
                          }}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                      </label>
                      {currentRoom.settings.timerEnabled && (
                        <div className="space-y-3 mt-2">
                          {/* Timer du maître */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              🧙 Timer Maître (donner l'indice)
                            </label>
                            <select
                              value={currentRoom.settings.psychicTimerDuration || 60}
                              onChange={(e) => {
                                handleUpdateSettings({
                                  ...currentRoom.settings,
                                  psychicTimerDuration: parseInt(e.target.value)
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                              <option value={30}>30 secondes</option>
                              <option value={60}>60 secondes</option>
                              <option value={90}>90 secondes</option>
                              <option value={120}>2 minutes</option>
                            </select>
                          </div>
                          {/* Timer des joueurs */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              🎮 Timer Joueurs (deviner)
                            </label>
                            <select
                              value={currentRoom.settings.playersTimerDuration || 60}
                              onChange={(e) => {
                                handleUpdateSettings({
                                  ...currentRoom.settings,
                                  playersTimerDuration: parseInt(e.target.value)
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                              <option value={30}>30 secondes</option>
                              <option value={60}>60 secondes</option>
                              <option value={90}>90 secondes</option>
                              <option value={120}>2 minutes</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progression automatique */}
                    <div>
                      <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">⏭️ Progression auto des tours</span>
                        <input
                          type="checkbox"
                          checked={currentRoom.settings.autoProgressRounds !== false}
                          onChange={(e) => {
                            handleUpdateSettings({
                              ...currentRoom.settings,
                              autoProgressRounds: e.target.checked
                            });
                          }}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                      </label>
                      <p className="text-xs text-gray-600">
                        {currentRoom.settings.autoProgressRounds !== false
                          ? '✓ Les tours passent automatiquement après 6 secondes'
                          : "⚠️ L'hôte devra cliquer pour passer au tour suivant"}
                      </p>
                    </div>

                    {/* Nombre de tours */}
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        🎯 Nombre de tours
                      </label>
                      <select
                        value={currentRoom.settings.totalRounds || 'auto'}
                        onChange={(e) => {
                          const value = e.target.value === 'auto' ? null : parseInt(e.target.value);
                          handleUpdateSettings({
                            ...currentRoom.settings,
                            totalRounds: value
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="auto">Auto (2 × nombre de joueurs)</option>
                        <option value={5}>5 tours</option>
                        <option value={10}>10 tours</option>
                        <option value={15}>15 tours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton de démarrage (pour l'hôte uniquement) */}
            {isHost && (
              <div className="mt-6">
                <button
                  onClick={handleStartGame}
                  disabled={currentRoom.players.length < 2}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all ${
                    currentRoom.players.length >= 2
                      ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                   Démarrer la partie
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
             Prochaines étapes
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
