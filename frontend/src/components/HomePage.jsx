import { useState } from 'react';
import { motion } from 'framer-motion';
import HelpModal from './HelpModal';

/**
 * Composant de la page d'accueil
 * Permet de créer ou rejoindre une partie
 */
function HomePage({ onCreateRoom, onJoinRoom, isConnected }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    if (activeTab === 'create') {
      onCreateRoom(name.trim());
    } else {
      if (!roomCode.trim()) {
        alert('Veuillez entrer un code de room');
        return;
      }
      onJoinRoom(roomCode.trim(), name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond animé avec dégradés */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        {/* Bulles flottantes */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <motion.div
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* En-tête avec effet glassmorphism */}
        <div className="text-center mb-8 relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >

            <h1 className="text-6xl font-black mb-3 pb-2 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent drop-shadow-1xl">
              WaveLength
            </h1>
            <p className="text-white/90 text-lg font-medium drop-shadow-lg">
              Jeu multijoueur de devinettes par équipes
            </p>
          </motion.div>

          {/* Bouton Help amélioré */}
          <motion.button
            onClick={() => setShowHelp(true)}
            className="absolute top-0 -right-6 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full shadow-2xl border border-white/30 transition-all"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Aide"
          >
            <span className="text-2xl font-bold">?</span>
          </motion.button>
        </div>

        {/* Carte principale avec glassmorphism */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Onglets */}
          <div className="flex p-2 bg-black/10">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === 'create'
                ? 'bg-white text-purple-600 shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              ✨ Créer
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-3 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === 'join'
                ? 'bg-white text-purple-600 shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              🚪 Rejoindre
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Champ Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white/90 mb-2">
                Votre nom
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
            </div>

            {/* Champ Code */}
            {activeTab === 'join' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="code" className="block text-sm font-semibold text-white/90 mb-2">
                  Code de la partie
                </label>
                <input
                  type="text"
                  id="code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 outline-none transition-all text-center text-3xl font-bold tracking-[0.3em] text-gray-800 placeholder:text-gray-400"
                />
              </motion.div>
            )}

            {/* Bouton de soumission */}
            <motion.button
              type="submit"
              disabled={!isConnected}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-xl ${isConnected
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/50'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              whileHover={isConnected ? { scale: 1.02, y: -2 } : {}}
              whileTap={isConnected ? { scale: 0.98 } : {}}
            >
              {activeTab === 'create' ? '✨ Créer la partie' : '🎮 Rejoindre la partie'}
            </motion.button>

            {!isConnected && (
              <motion.p
                className="text-sm text-yellow-300 text-center font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ⏳ Connexion au serveur...
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Instructions améliorées */}
        <motion.div
          className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
            💡 Comment jouer ?
          </h3>
          <ul className="text-sm text-white/80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-300">✓</span>
              <span>Créez une partie ou rejoignez-en une avec un code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300">✓</span>
              <span>Invitez vos amis avec le code de 4 lettres</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300">✓</span>
              <span>Devinez ensemble sur une échelle de concepts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300">✓</span>
              <span>Minimum 2 joueurs pour commencer</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HomePage;
