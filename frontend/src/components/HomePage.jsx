import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpModal from './HelpModal';

/**
 * Composant de la page d'accueil
 * Permet de créer ou rejoindre une partie via une liste de salles publiques
 */
function HomePage({ onCreateRoom, onJoinRoom, isConnected, socket }) {
  const [name, setName] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [gameMode, setGameMode] = useState('ffa');
  const [manualCode, setManualCode] = useState('');
  const [showJoinByCode, setShowJoinByCode] = useState(false);

  // Écouter les mises à jour de la liste de rooms
  useEffect(() => {
    if (!socket) return;

    const handleRoomsList = ({ rooms: roomsList }) => {
      setRooms(roomsList || []);
    };

    socket.on('rooms-list-updated', handleRoomsList);
    socket.emit('list-rooms');

    return () => {
      socket.off('rooms-list-updated', handleRoomsList);
    };
  }, [socket]);

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    onCreateRoom(name.trim(), { isPrivate, gameMode });
    setShowCreateMenu(false);
  };

  const handleJoin = (roomCode) => {
    if (!name.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    onJoinRoom(roomCode, name.trim());
  };

  const handleJoinByCode = () => {
    if (!name.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    if (!manualCode.trim()) {
      alert('Veuillez entrer un code de partie');
      return;
    }
    onJoinRoom(manualCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond animé avec dégradés */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        {/* Bulles flottantes */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <motion.div
        className="max-w-lg w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* En-tête */}
        <div className="text-center mb-6 relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >

            <h1 className="text-6xl font-black mb-3 pb-2 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent drop-shadow-1xl">
              WaveLength
            </h1>
            <p className="text-white/90 text-base md:text-lg font-medium drop-shadow-lg">
              Jeu multijoueur de devinettes
            </p>
          </motion.div>

          <motion.button
            onClick={() => setShowHelp(true)}
            className="absolute top-0 -right-6 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full shadow-2xl border border-white/30 transition-all"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Aide"
          >
            <span className="text-xl font-bold">?</span>
          </motion.button>
        </div>

        {/* Champ nom */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 mb-4 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label htmlFor="name" className="block text-sm font-semibold text-white/90 mb-2">
            Votre pseudo
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entrez votre nom"
            maxLength={20}
            className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 outline-none transition-all text-gray-800 placeholder:text-gray-500"
          />
        </motion.div>

        {/* Bouton créer */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 mb-4 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            disabled={!isConnected}
            className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all shadow-xl ${
              isConnected
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/50'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            whileHover={isConnected ? { scale: 1.02 } : {}}
            whileTap={isConnected ? { scale: 0.98 } : {}}
          >
            ✨ Créer une partie
          </motion.button>

          <AnimatePresence>
            {showCreateMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 pt-3 border-t border-white/20">
                  {/* Mode de jeu */}
                  <div>
                    <label className="block text-xs font-semibold text-white/90 mb-1">Mode de jeu</label>
                    <select
                      value={gameMode}
                      onChange={(e) => setGameMode(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white font-semibold backdrop-blur-sm text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                    >
                      <option value="ffa" className="text-gray-900">Chacun pour soi</option>
                      <option value="teams" className="text-gray-900">Par équipe</option>
                      <option value="solo" className="text-gray-900">🎮 Solo (pass & play)</option>
                    </select>
                  </div>

                  {/* Privée */}
                  <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span>🔒 Partie privée (ne pas afficher dans la liste)</span>
                  </label>

                  <motion.button
                    onClick={handleCreate}
                    className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🚀 Créer maintenant
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Liste des salles */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              🚪 Salles disponibles
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{rooms.length}</span>
            </h3>
            <motion.button
              onClick={() => setShowJoinByCode(!showJoinByCode)}
              className="text-xs text-white/70 hover:text-white underline"
              whileHover={{ scale: 1.05 }}
            >
              {showJoinByCode ? 'Masquer code' : 'Rejoindre par code'}
            </motion.button>
          </div>

          <AnimatePresence>
            {showJoinByCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white/5 border-b border-white/20 flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="flex-1 px-3 py-2 bg-white/90 rounded-lg text-center text-lg font-bold tracking-widest text-gray-800 placeholder:text-gray-400 outline-none"
                  />
                  <motion.button
                    onClick={handleJoinByCode}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Rejoindre
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-h-80 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/60 text-sm italic">
                  Aucune salle disponible pour l'instant
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Créez la première partie !
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {rooms.map((room, idx) => (
                  <motion.div
                    key={room.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded text-sm">
                          {room.code}
                        </span>
                        <span className="text-xs text-white/70">
                          {room.gameMode === 'teams' ? '👥 Teams' : room.gameMode === 'solo' ? '🎮 Solo' : '🎯 FFA'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 truncate">
                        Hôte : <span className="font-semibold text-white/80">{room.hostName}</span>
                        <span className="mx-2">•</span>
                        {room.playerCount} joueur{room.playerCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleJoin(room.code)}
                      disabled={!isConnected}
                      className={`ml-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        isConnected
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                      whileHover={isConnected ? { scale: 1.05 } : {}}
                      whileTap={isConnected ? { scale: 0.95 } : {}}
                    >
                      Rejoindre
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {!isConnected && (
          <motion.p
            className="mt-4 text-sm text-yellow-300 text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ⏳ Connexion au serveur...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

export default HomePage;
