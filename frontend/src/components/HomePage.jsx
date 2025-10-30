import { useState } from 'react';

/**
 * Composant de la page d'accueil
 * Permet de créer ou rejoindre une partie
 */
function HomePage({ onCreateRoom, onJoinRoom, isConnected }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' ou 'join'

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            🎮 WaveLength
          </h1>
          <p className="text-gray-600">
            Jeu multijoueur de devinettes par équipes
          </p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Onglets */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Créer une partie
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'join'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rejoindre
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Champ Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Champ Code (uniquement pour rejoindre) */}
            {activeTab === 'join' && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Code de la partie
                </label>
                <input
                  type="text"
                  id="code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-center text-2xl font-mono tracking-widest"
                />
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={!isConnected}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all ${
                isConnected
                  ? 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {activeTab === 'create' ? '🎯 Créer la partie' : '🚪 Rejoindre la partie'}
            </button>

            {!isConnected && (
              <p className="text-sm text-red-600 text-center">
                Connexion au serveur en cours...
              </p>
            )}
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            📖 Comment jouer ?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Créez une partie ou rejoignez-en une avec un code</li>
            <li>• Invitez vos amis avec le code de 4 lettres</li>
            <li>• Devinez ensemble sur une échelle de concepts</li>
            <li>• Minimum 4 joueurs recommandé pour jouer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
