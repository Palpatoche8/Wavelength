import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [customCards, setCustomCards] = useState([]);
  const [newCardLeft, setNewCardLeft] = useState('');
  const [newCardRight, setNewCardRight] = useState('');

  // Écouter les mises à jour de la room
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (updatedRoom) => {
      console.log('🔄 Room mise à jour', updatedRoom);
      setCurrentRoom(updatedRoom);
    };

    const handlePlayerJoined = ({ playerName: newPlayerName }) => {
      console.log(`👋 ${newPlayerName} a rejoint la partie`);
    };

    const handlePlayerLeft = ({ playerId }) => {
      console.log(`👋 Joueur ${playerId} a quitté la partie`);
    };

    socket.on('room-updated', handleRoomUpdated);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);

    return () => {
      socket.off('room-updated', handleRoomUpdated);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
    };
  }, [socket]);

  // Écouter les mises à jour de paramètres
  useEffect(() => {
    if (!socket) return;

    const handleSettingsUpdated = ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
    };

    socket.on('settings-updated', handleSettingsUpdated);

    return () => {
      socket.off('settings-updated', handleSettingsUpdated);
    };
  }, [socket]);

  // Écouter les événements de cartes personnalisées
  useEffect(() => {
    if (!socket) return;

    const handleCustomCardAdded = ({ card }) => {
      setCustomCards(prev => [...prev, card]);
    };

    const handleCustomCardRemoved = ({ cardId }) => {
      setCustomCards(prev => prev.filter(c => c.id !== cardId));
    };

    socket.on('custom-card-added', handleCustomCardAdded);
    socket.on('custom-card-removed', handleCustomCardRemoved);

    return () => {
      socket.off('custom-card-added', handleCustomCardAdded);
      socket.off('custom-card-removed', handleCustomCardRemoved);
    };
  }, [socket]);

  // Copier le code de la room
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentPlayer = currentRoom.players.find(p => p.name === playerName);
  const isHost = currentPlayer?.isHost || false;

  const handleStartGame = () => {
    socket.emit('start-game', {
      roomCode: currentRoom.code
    });
  };

  const handleUpdateSettings = (newSettings) => {
    socket.emit('update-settings', {
      roomCode: currentRoom.code,
      settings: newSettings
    });
  };

  const handleAddCustomCard = () => {
    if (!newCardLeft.trim() || !newCardRight.trim()) {
      alert('Veuillez remplir les deux champs');
      return;
    }

    socket.emit('add-custom-card', {
      roomCode: currentRoom.code,
      card: {
        left: newCardLeft.trim(),
        right: newCardRight.trim()
      }
    });

    setNewCardLeft('');
    setNewCardRight('');
  };

  const handleRemoveCustomCard = (cardId) => {
    socket.emit('remove-custom-card', {
      roomCode: currentRoom.code,
      cardId
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond dégradé animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Bouton Help amélioré */}
      <motion.button
        onClick={() => setShowHelp(true)}
        className="fixed top-4 right-4 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full shadow-2xl border border-white/30 transition-all z-50"
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Aide"
      >
        <span className="text-2xl font-bold">?</span>
      </motion.button>

      <motion.div
        className="max-w-2xl w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Carte principale avec glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Bannière du code */}
          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black">
                🎮 Salle de jeu
              </h2>
              <motion.button
                onClick={onLeaveRoom}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors border border-white/30 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Quitter
              </motion.button>
            </div>

            {/* Code de la room avec effet brillant */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <p className="text-sm font-semibold opacity-90 mb-2">Code de la partie :</p>
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-5xl font-black tracking-[0.2em] bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent drop-shadow-lg"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentRoom.code}
                </motion.span>
                <motion.button
                  onClick={handleCopyCode}
                  className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all text-sm font-bold border border-white/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedCode ? '✓ Copié !' : '📋 Copier'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">
            {/* Liste des joueurs */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>👥 Joueurs</span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30">
                  {currentRoom.players.length}
                </span>
              </h3>

              <div className="space-y-2">
                <AnimatePresence>
                  {currentRoom.players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-xl backdrop-blur-md border-2 transition-all ${
                        player.disconnected
                          ? 'bg-gray-500/20 border-gray-400/30 opacity-60'
                          : player.name === playerName
                          ? 'bg-purple-400/30 border-purple-300/50 shadow-lg shadow-purple-500/20'
                          : 'bg-white/10 border-white/20 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                          player.disconnected
                            ? 'bg-gray-400'
                            : 'bg-gradient-to-br from-purple-500 to-pink-600'
                        }`}>
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">
                            {player.name}
                            {player.name === playerName && (
                              <span className="text-purple-300 ml-2 text-sm">(Vous)</span>
                            )}
                          </p>
                          {player.disconnected && (
                            <span className="text-red-300 text-xs font-semibold">⚠️ Déconnecté</span>
                          )}
                        </div>
                      </div>

                      {player.isHost && (
                        <motion.span
                          className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 text-sm font-bold rounded-full shadow-lg"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          👑 Hôte
                        </motion.span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Statut */}
            <motion.div
              className="bg-blue-400/20 backdrop-blur-md border border-blue-300/30 rounded-xl p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-white font-semibold">
                ℹ️ En attente de joueurs...
              </p>
              <p className="text-blue-100 text-sm mt-1">
                Partagez le code <strong className="text-white">{currentRoom.code}</strong> avec vos amis !
              </p>
            </motion.div>

            {/* Paramètres (hôte) */}
            {isHost && (
              <div>
                <motion.button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all flex items-center justify-between border border-white/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>⚙️ Paramètres</span>
                  <motion.span
                    animate={{ rotate: showSettings ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ▼
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/20 space-y-4">
                        {/* Mode de jeu */}
                        <div>
                          <label className="block font-bold text-white mb-2">
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
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white font-semibold backdrop-blur-sm focus:ring-2 focus:ring-purple-400 outline-none"
                          >
                            <option value="ffa" className="text-gray-900">Chacun pour soi</option>
                            <option value="teams" className="text-gray-900">Par équipe</option>
                          </select>
                        </div>

                        {/* Nombre de tours */}
                        <div>
                          <label className="block font-bold text-white mb-2">
                            🔢 Nombre de tours
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={
                                currentRoom.settings.totalRounds === null ? 'auto' :
                                currentRoom.settings.totalRounds === 5 ? '5' :
                                currentRoom.settings.totalRounds === 10 ? '10' :
                                currentRoom.settings.totalRounds === 15 ? '15' :
                                'custom'
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                handleUpdateSettings({
                                  ...currentRoom.settings,
                                  totalRounds: value === 'auto' ? null : (value === 'custom' ? 6 : parseInt(value))
                                });
                              }}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white font-semibold backdrop-blur-sm focus:ring-2 focus:ring-purple-400 outline-none"
                            >
                              <option value="auto" className="text-gray-900">Auto (2×joueurs)</option>
                              <option value="5" className="text-gray-900">5 tours</option>
                              <option value="10" className="text-gray-900">10 tours</option>
                              <option value="15" className="text-gray-900">15 tours</option>
                              <option value="custom" className="text-gray-900">Personnalisé</option>
                            </select>
                            {currentRoom.settings.totalRounds !== null &&
                             currentRoom.settings.totalRounds !== 5 &&
                             currentRoom.settings.totalRounds !== 10 &&
                             currentRoom.settings.totalRounds !== 15 && (
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={currentRoom.settings.totalRounds}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= 1 && value <= 50) {
                                    handleUpdateSettings({
                                      ...currentRoom.settings,
                                      totalRounds: value
                                    });
                                  }
                                }}
                                className="w-20 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white font-semibold backdrop-blur-sm text-center focus:ring-2 focus:ring-purple-400 outline-none"
                              />
                            )}
                          </div>
                        </div>

                        {/* Timer */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">⏱️ Timer</span>
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
                              className="w-5 h-5 rounded"
                            />
                          </label>
                        </div>

                        {/* Progression auto */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">⏭️ Progression auto</span>
                            <input
                              type="checkbox"
                              checked={currentRoom.settings.autoProgressRounds !== false}
                              onChange={(e) => {
                                handleUpdateSettings({
                                  ...currentRoom.settings,
                                  autoProgressRounds: e.target.checked
                                });
                              }}
                              className="w-5 h-5 rounded"
                            />
                          </label>
                        </div>

                        {/* Cartes personnalisées */}
                        <div className="border-t border-white/20 pt-4">
                          <label className="flex items-center justify-between mb-3">
                            <span className="font-bold text-white">✨ Thèmes personnalisés</span>
                            <input
                              type="checkbox"
                              checked={currentRoom.settings.customCardsEnabled || false}
                              onChange={(e) => {
                                handleUpdateSettings({
                                  ...currentRoom.settings,
                                  customCardsEnabled: e.target.checked
                                });
                              }}
                              className="w-5 h-5 rounded"
                            />
                          </label>

                          {currentRoom.settings.customCardsEnabled && (
                            <div className="space-y-3 mt-3">
                              {/* Formulaire d'ajout */}
                              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                <p className="text-xs text-white/70 mb-2">Ajouter un nouveau thème :</p>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Extrême gauche (ex: Pire chanson)"
                                    value={newCardLeft}
                                    onChange={(e) => setNewCardLeft(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm placeholder:text-white/40 backdrop-blur-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                    maxLength={50}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Extrême droite (ex: Meilleure chanson)"
                                    value={newCardRight}
                                    onChange={(e) => setNewCardRight(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm placeholder:text-white/40 backdrop-blur-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                    maxLength={50}
                                  />
                                  <motion.button
                                    onClick={handleAddCustomCard}
                                    className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold text-sm transition"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    ➕ Ajouter
                                  </motion.button>
                                </div>
                              </div>

                              {/* Liste des cartes personnalisées */}
                              {customCards.length > 0 && (
                                <div className="bg-white/5 p-3 rounded-lg border border-white/10 max-h-48 overflow-y-auto">
                                  <p className="text-xs text-white/70 mb-2">Thèmes créés ({customCards.length}) :</p>
                                  <div className="space-y-2">
                                    {customCards.map((card) => (
                                      <div
                                        key={card.id}
                                        className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-white/90 truncate">
                                            <span className="font-semibold">{card.left}</span>
                                            <span className="text-white/50 mx-2">↔</span>
                                            <span className="font-semibold">{card.right}</span>
                                          </p>
                                        </div>
                                        <motion.button
                                          onClick={() => handleRemoveCustomCard(card.id)}
                                          className="ml-2 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs font-bold transition"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          ✕
                                        </motion.button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {customCards.length === 0 && (
                                <p className="text-xs text-white/50 text-center italic">
                                  Aucun thème personnalisé pour l'instant
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bouton démarrage */}
            {isHost && (
              <motion.button
                onClick={handleStartGame}
                disabled={currentRoom.players.length < 2}
                className={`w-full py-4 px-6 rounded-xl font-black text-xl transition-all shadow-xl ${
                  currentRoom.players.length >= 2
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/50'
                    : 'bg-gray-400/30 text-gray-300 cursor-not-allowed'
                }`}
                whileHover={currentRoom.players.length >= 2 ? { scale: 1.02, y: -2 } : {}}
                whileTap={currentRoom.players.length >= 2 ? { scale: 0.98 } : {}}
              >
                🚀 Démarrer la partie
                {currentRoom.players.length < 2 && (
                  <span className="text-sm font-normal ml-2">
                    (min. 2 joueurs)
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default GameRoom;
