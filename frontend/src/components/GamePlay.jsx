import { useState, useEffect } from 'react';
import Dial from './Dial';
import Timer from './ui/Timer';
import ProgressBar from './ui/ProgressBar';
import ConfettiEffect from './ui/ConfettiEffect';
import ScorePulse from './ui/ScorePulse';
import useTimer from '../hooks/useTimer';
import useHaptic from '../hooks/useHaptic';

/**
 * Composant principal du jeu en cours
 */
function GamePlay({ room, socket, playerName, onLeaveRoom }) {
  const [currentRoom, setCurrentRoom] = useState(room);
  const [dialValue, setDialValue] = useState(10); // Valeur entre 1-20, initialisée à 10
  const [clueText, setClueText] = useState('');
  const [targetValue, setTargetValue] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [triggerConfetti, setTriggerConfetti] = useState(0); // Counter pour trigger confetti

  const game = currentRoom?.game;
  const currentPlayer = currentRoom?.players.find(p => p.name === playerName);
  const isPsychic = currentPlayer?.id === game?.psychicId;
  const psychicPlayer = currentRoom?.players.find(p => p.id === game?.psychicId);

  // Hook pour gérer le timer
  const timerEnabled = currentRoom?.settings?.timerEnabled && currentRoom?.gameState === 'playing';
  const timerDuration = currentRoom?.settings?.timerDuration;
  const { remainingTime, isExpired } = useTimer(socket, timerDuration, timerEnabled);

  // Hook pour feedback haptique
  const { feedback: haptic } = useHaptic();

  // Écouter les mises à jour du jeu
  useEffect(() => {
    if (!socket) return;

    // Mise à jour de la room
    socket.on('room-updated', (updatedRoom) => {
      setCurrentRoom(updatedRoom);
    });

    // Partie démarrée
    socket.on('game-started', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
      setShowResult(false);
      setLastResult(null);
      setDialValue(10);
      setClueText('');
    });

    // Cible révélée (uniquement pour le psychique)
    socket.on('target-revealed', ({ targetValue: target }) => {
      setTargetValue(target);
      // Le psychique voit la cible mais ne peut pas bouger le cadran
    });

    // Indice soumis
    socket.on('clue-submitted', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
    });

    // Résultat révélé
    socket.on('result-revealed', ({ result, room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
      setLastResult(result);
      setShowResult(true);
      if (!isPsychic) {
        setTargetValue(result.targetValue);
      }

      // Déclencher confetti sur zone verte
      if (result.zone === 'green') {
        setTriggerConfetti(prev => prev + 1);
        haptic.success();
      } else if (result.zone === 'yellow' || result.zone === 'orange') {
        haptic.medium();
      } else {
        haptic.error();
      }
    });

    // Nouveau tour
    socket.on('round-started', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
      setShowResult(false);
      setLastResult(null);
      setDialValue(10);
      setClueText('');
      setTargetValue(null);
    });

    // Partie terminée
    socket.on('game-finished', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
    });

    // Partie réinitialisée
    socket.on('game-reset', ({ room: updatedRoom }) => {
      setCurrentRoom(updatedRoom);
      setShowResult(false);
      setLastResult(null);
      setDialValue(10);
      setClueText('');
      setTargetValue(null);
    });

    return () => {
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('target-revealed');
      socket.off('clue-submitted');
      socket.off('result-revealed');
      socket.off('round-started');
      socket.off('game-finished');
      socket.off('game-reset');
    };
  }, [socket, isPsychic]);

  // Soumettre l'indice (psychique)
  const handleSubmitClue = () => {
    if (!clueText.trim()) {
      alert('Veuillez entrer un indice');
      return;
    }

    socket.emit('submit-clue', {
      roomCode: currentRoom.code,
      clue: clueText.trim()
    });
  };

  // Soumettre la réponse (joueurs)
  const handleSubmitGuess = () => {
    socket.emit('submit-guess', {
      roomCode: currentRoom.code,
      value: dialValue
    });
  };

  // Passer au tour suivant
  const handleNextRound = () => {
    socket.emit('next-round', {
      roomCode: currentRoom.code
    });
  };

  // Rejouer - Redémarrer directement une nouvelle partie
  const handleResetGame = () => {
    // Reset puis redémarrer
    socket.emit('reset-game', {
      roomCode: currentRoom.code
    });

    // Attendre un peu puis démarrer automatiquement
    setTimeout(() => {
      socket.emit('start-game', {
        roomCode: currentRoom.code
      });
    }, 500);
  };

  // Déterminer la couleur de la zone selon le score
  const getZoneColor = (zone) => {
    switch (zone) {
      case 'green':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'orange':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  // Obtenir le message selon la distance
  const getDistanceMessage = (distance) => {
    if (distance === 0) return '🎉 PARFAIT ! Valeur exacte !';
    if (distance === 1) return '👍 Très proche !';
    if (distance === 2) return '👌 Proche';
    return '❌ Trop loin...';
  };

  // Affichage selon l'état du jeu
  if (currentRoom.gameState === 'finished') {
    // Partie terminée - affichage des scores finaux
    const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-4xl font-bold text-center mb-6 text-purple-800">
              🏆 Partie terminée !
            </h2>

            {/* Podium */}
            <div className="space-y-3 mb-8">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400'
                      : 'bg-gray-50 border border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="font-semibold">{player.name}</span>
                    {player.name === playerName && (
                      <span className="text-sm text-purple-600">(Vous)</span>
                    )}
                  </div>
                  <ScorePulse value={player.score} className="text-2xl font-bold" /> pts
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
              >
                🔄 Rejouer
              </button>
              <button
                onClick={onLeaveRoom}
                className="flex-1 py-3 px-6 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                🚪 Quitter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Confetti effect sur zone verte */}
      <ConfettiEffect trigger={triggerConfetti} />

      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                🎮 WaveLength
              </h2>
              <p className="text-sm text-gray-600">
                Room: <span className="font-mono font-bold">{currentRoom.code}</span>
              </p>
            </div>

            {/* Barre de progression */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <ProgressBar
                currentRound={game?.currentRound || 1}
                totalRounds={game?.totalRounds || 1}
              />
            </div>

            {/* Timer si activé */}
            {timerEnabled && timerDuration && (
              <div>
                <Timer
                  duration={timerDuration}
                  remainingTime={remainingTime}
                  isActive={timerEnabled}
                />
              </div>
            )}

            <button
              onClick={onLeaveRoom}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
            >
              🚪 Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Joueurs et scores */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">👥 Joueurs</h3>
              <div className="space-y-2">
                {currentRoom.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.id === game?.psychicId
                        ? 'bg-purple-100 border-2 border-purple-400'
                        : player.name === playerName
                        ? 'bg-blue-50 border border-blue-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        {player.name}
                        {player.name === playerName && ' (Vous)'}
                      </p>
                      {player.id === game?.psychicId && (
                        <p className="text-xs text-purple-600">🔮 Psychique</p>
                      )}
                    </div>
                    <ScorePulse value={player.score} className="font-bold text-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne centrale - Jeu */}
          <div className="lg:col-span-2">
            {/* Carte actuelle - SEULEMENT le texte, pas de spectre */}
            {game?.currentCard && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-center text-lg font-semibold text-gray-700 mb-3">
                  Thème
                </h3>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                      <p className="text-sm font-bold text-orange-800">
                        {game.currentCard.left}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">↔</div>
                  <div className="flex-1 text-center">
                    <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-sm font-bold text-blue-800">
                        {game.currentCard.right}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zone psychique */}
            {isPsychic && !game?.clue && (
              <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-purple-800 mb-4">
                  🔮 Vous êtes le Psychique !
                </h3>
                <p className="text-gray-700 mb-2">
                  La cible secrète est : <strong className="text-3xl text-purple-900">
                    {targetValue !== null ? targetValue : '...'}
                  </strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Donnez un indice pour aider votre équipe à deviner cette valeur (entre 1 et 20).
                  Plus votre équipe se rapproche de la cible, plus vous gagnez de points !
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Votre indice..."
                    maxLength={50}
                    className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue()}
                  />
                  <button
                    onClick={handleSubmitClue}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    Envoyer l'indice
                  </button>
                </div>
              </div>
            )}

            {/* Indice affiché */}
            {game?.clue && (
              <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  💡 Indice de {psychicPlayer?.name}
                </h3>
                <p className="text-2xl font-bold text-blue-900">"{game.clue}"</p>
              </div>
            )}

            {/* Cadran */}
            {!showResult && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <Dial
                  value={dialValue}
                  onValueChange={setDialValue}
                  targetValue={isPsychic ? targetValue : null}
                  showTarget={isPsychic}
                  showColoredZones={isPsychic && !game?.clue}
                  disabled={isPsychic || !game?.clue}
                />

                {/* Bouton de validation (joueurs seulement, après l'indice) */}
                {!isPsychic && game?.clue && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleSubmitGuess}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
                    >
                      ✓ Valider la réponse : {dialValue}
                    </button>
                  </div>
                )}

                {isPsychic && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                      Vous êtes le psychique. Attendez que votre équipe positionne le curseur.
                    </p>
                  </div>
                )}

                {!game?.clue && !isPsychic && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                      Attendez l'indice du psychique...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Résultat */}
            {showResult && lastResult && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-2xl font-bold text-center mb-6">
                  📊 Résultat du tour
                </h3>

                {/* Cadran avec cible révélée */}
                <Dial
                  value={lastResult.guessValue}
                  onValueChange={() => {}}
                  targetValue={lastResult.targetValue}
                  showTarget={true}
                  disabled={true}
                />

                {/* Affichage des valeurs - 2 encadrés côte à côte */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* Valeur sélectionnée */}
                  <div className="bg-white rounded-xl shadow-md border-2 border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Valeur sélectionnée</p>
                    <p className="text-6xl font-bold text-gray-800">{lastResult.guessValue}</p>
                  </div>

                  {/* Cible */}
                  <div className="bg-white rounded-xl shadow-md border-2 border-red-300 p-6 text-center">
                    <p className="text-sm text-red-600 mb-2 font-medium">🎯 Cible</p>
                    <p className="text-6xl font-bold text-red-600">{lastResult.targetValue}</p>
                  </div>
                </div>

                {/* Score - Grand encadré */}
                <div className={`mt-4 p-8 rounded-xl border-4 ${getZoneColor(lastResult.zone)}`}>
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-3 uppercase tracking-wide">Score obtenu</p>
                    <p className="text-7xl font-bold mb-3">
                      {lastResult.points} pts
                    </p>
                    <p className="text-2xl font-semibold mb-2">
                      {getDistanceMessage(lastResult.distance)}
                    </p>
                    <p className="text-base opacity-75">
                      Distance: <strong>{lastResult.distance}</strong>
                      {' '}•{' '}
                      Zone: <strong className="uppercase">{lastResult.zone}</strong>
                    </p>
                  </div>
                </div>

                {/* Bouton suivant (hôte uniquement) */}
                {currentPlayer?.isHost && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleNextRound}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
                    >
                      ▶️ Tour suivant
                    </button>
                  </div>
                )}

                {!currentPlayer?.isHost && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                      Attendez que l'hôte passe au tour suivant...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePlay;
