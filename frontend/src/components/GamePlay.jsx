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
  const gameMode = currentRoom?.settings?.gameMode || 'ffa';
  const isTeamsMode = gameMode === 'teams';
  const currentTeam = game?.currentTeam;
  const isMyTeamPlaying = isTeamsMode && currentPlayer?.team === currentTeam;
  const canPlay = !isPsychic && (!isTeamsMode || isMyTeamPlaying);

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

  // Auto-progression après 6 secondes en mode scoring
  useEffect(() => {
    if (gameState === 'scoring' && showResult) {
      const timer = setTimeout(() => {
        handleNextRound();
      }, 6000); // 6 secondes

      return () => clearTimeout(timer);
    }
  }, [gameState, showResult]);

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
    if (distance === 0) return ' PARFAIT ! Valeur exacte !';
    if (distance === 1) return ' Très proche !';
    if (distance === 2) return ' Proche';
    return ' Trop loin...';
  };

  // Affichage selon l'état du jeu
  if (currentRoom.gameState === 'finished') {
    // Partie terminée - affichage des scores finaux
    if (isTeamsMode) {
      // Mode par équipe : afficher les scores des équipes
      const blueScore = currentRoom.teams?.blue?.score || 0;
      const redScore = currentRoom.teams?.red?.score || 0;
      const winner = blueScore > redScore ? 'blue' : redScore > blueScore ? 'red' : 'tie';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-4xl font-bold text-center mb-6 text-purple-800">
                 Partie terminée !
              </h2>

              {/* Résultat */}
              {winner !== 'tie' && (
                <div className="text-center mb-6">
                  <p className="text-2xl font-bold text-gray-800">
                    🏆 Équipe {winner === 'blue' ? 'Bleue' : 'Rouge'} gagne !
                  </p>
                </div>
              )}
              {winner === 'tie' && (
                <div className="text-center mb-6">
                  <p className="text-2xl font-bold text-gray-800">
                    🤝 Égalité !
                  </p>
                </div>
              )}

              {/* Scores des équipes */}
              <div className="space-y-4 mb-8">
                {/* Équipe Bleue */}
                <div className={`p-6 rounded-lg ${winner === 'blue' ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-4 border-blue-500' : 'bg-blue-50 border-2 border-blue-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-blue-800">🔵 Équipe Bleue</h3>
                    <div className="flex items-center gap-1">
                      <ScorePulse value={blueScore} className="text-3xl font-bold text-blue-800" />
                      <span className="text-3xl font-bold text-blue-800">pts</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {currentRoom.players.filter(p => p.team === 'blue').map(player => (
                      <div key={player.id} className="text-sm text-blue-700">
                        • {player.name} {player.name === playerName && '(Vous)'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Équipe Rouge */}
                <div className={`p-6 rounded-lg ${winner === 'red' ? 'bg-gradient-to-r from-red-100 to-red-200 border-4 border-red-500' : 'bg-red-50 border-2 border-red-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-red-800">🔴 Équipe Rouge</h3>
                    <div className="flex items-center gap-1">
                      <ScorePulse value={redScore} className="text-3xl font-bold text-red-800" />
                      <span className="text-3xl font-bold text-red-800">pts</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {currentRoom.players.filter(p => p.team === 'red').map(player => (
                      <div key={player.id} className="text-sm text-red-700">
                        • {player.name} {player.name === playerName && '(Vous)'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleResetGame}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                   Rejouer
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="flex-1 py-3 px-6 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                   Quitter
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Mode chacun pour soi : afficher les scores individuels
      const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-4xl font-bold text-center mb-6 text-purple-800">
                 Partie terminée !
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
                    <div className="flex items-center gap-1">
                      <ScorePulse value={player.score} className="text-2xl font-bold" />
                      <span className="text-2xl font-bold">pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleResetGame}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                   Rejouer
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="flex-1 py-3 px-6 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                   Quitter
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-2">
      {/* Confetti effect sur zone verte */}
      <ConfettiEffect trigger={triggerConfetti} />

      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-2 mb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                 WaveLength
              </h2>
              <p className="text-xs text-gray-600">
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
              className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded-lg transition"
            >
               Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Colonne gauche - Joueurs et scores */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-3 mb-3">
              {isTeamsMode ? (
                <>
                  <h3 className="text-sm font-semibold mb-2">🎯 Équipes</h3>
                  <div className="space-y-2">
                    {/* Équipe Bleue */}
                    <div className={`p-2 rounded-lg ${currentTeam === 'blue' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-blue-50 border border-blue-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-blue-800">🔵 Bleue</h4>
                        <ScorePulse value={currentRoom.teams?.blue?.score || 0} className="font-bold text-sm text-blue-800" />
                      </div>
                      {currentTeam === 'blue' && (
                        <p className="text-xs text-blue-600 mb-1">▶ À leur tour</p>
                      )}
                      <div className="space-y-0.5">
                        {currentRoom.players.filter(p => p.team === 'blue').map((player) => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between px-2 py-1 rounded ${
                              player.id === game?.psychicId
                                ? 'bg-purple-200 border border-purple-400'
                                : 'bg-white'
                            }`}
                          >
                            <p className="text-sm">
                              {player.name}
                              {player.name === playerName && ' (Vous)'}
                              {player.id === game?.psychicId && ' 🧙'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Équipe Rouge */}
                    <div className={`p-2 rounded-lg ${currentTeam === 'red' ? 'bg-red-100 border-2 border-red-500' : 'bg-red-50 border border-red-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-red-800">🔴 Rouge</h4>
                        <ScorePulse value={currentRoom.teams?.red?.score || 0} className="font-bold text-sm text-red-800" />
                      </div>
                      {currentTeam === 'red' && (
                        <p className="text-xs text-red-600 mb-1">▶ À leur tour</p>
                      )}
                      <div className="space-y-0.5">
                        {currentRoom.players.filter(p => p.team === 'red').map((player) => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between px-2 py-1 rounded ${
                              player.id === game?.psychicId
                                ? 'bg-purple-200 border border-purple-400'
                                : 'bg-white'
                            }`}
                          >
                            <p className="text-sm">
                              {player.name}
                              {player.name === playerName && ' (Vous)'}
                              {player.id === game?.psychicId && ' 🧙'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold mb-2">👥 Joueurs</h3>
                  <div className="space-y-1">
                    {currentRoom.players.map((player) => {
                      const hasAnswered = game?.guesses?.some(g => g.playerId === player.id);
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            player.id === game?.psychicId
                              ? 'bg-purple-100 border-2 border-purple-400'
                              : player.name === playerName
                              ? 'bg-blue-50 border border-blue-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">
                                {player.name}
                                {player.name === playerName && ' (Vous)'}
                              </p>
                              {player.id === game?.psychicId && (
                                <p className="text-xs text-purple-600"> Maitre</p>
                              )}
                            </div>
                            {/* Pastille verte si le joueur a répondu */}
                            {hasAnswered && player.id !== game?.psychicId && gameState === 'playing' && (
                              <span className="inline-block w-3 h-3 bg-green-500 rounded-full" title="A répondu"></span>
                            )}
                          </div>
                          <ScorePulse value={player.score} className="font-bold text-sm" />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
             {/* Indice affiché */}
            {game?.clue && (
              <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 mb-3">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">
                   Indice de {psychicPlayer?.name}
                </h3>
                <p className="text-lg font-bold text-blue-900">"{game.clue}"</p>
              </div>
            )}
          </div>

          {/* Colonne centrale - Jeu */}
          <div className="lg:col-span-2">
            {/* Carte actuelle - SEULEMENT le texte, pas de spectre */}
            {game?.currentCard && (
              <div className="bg-white rounded-lg shadow-lg p-3 mb-3">
                <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">
                  Thème
                </h3>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 text-center">
                    <div className="bg-blue-100 rounded-lg p-2 border-2 border-blue-300">
                      <p className="text-xs font-bold text-blue-800">
                        {game.currentCard.left}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg text-gray-400">↔</div>
                  <div className="flex-1 text-center">
                    <div className="bg-orange-100 rounded-lg p-2 border-2 border-orange-300">
                      <p className="text-xs font-bold text-orange-800">
                        {game.currentCard.right}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zone psychique */}
            {isPsychic && !game?.clue && (
              <div className="bg-purple-100 border-2 border-purple-400 rounded-lg p-3 mb-3">
                <h3 className="text-lg font-bold text-purple-800 mb-2">
                   Vous êtes le Maitre !
                </h3>
                <p className="text-gray-700 mb-1">
                  La valeur secrète est : <strong className="text-2xl text-purple-900">
                    {targetValue !== null ? targetValue : '...'}
                  </strong>
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {isTeamsMode
                    ? `Donnez un indice pour aider votre équipe ${currentPlayer?.team === 'blue' ? '🔵 Bleue' : '🔴 Rouge'} à deviner cette valeur (entre 1 et 20).`
                    : 'Donnez un indice pour aider les joueurs à deviner cette valeur (entre 1 et 20).'}
                  {' '}Plus {isTeamsMode ? 'votre équipe' : 'les joueurs'} se rapprochent de la cible, plus vous gagnez de points !
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Votre indice..."
                    maxLength={50}
                    className="flex-1 px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitClue()}
                  />
                  <button
                    onClick={handleSubmitClue}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            )}

            {/* Cadran */}
            {!showResult && (
              <div className="bg-white rounded-lg shadow-lg p-2 mb-3">
                <Dial
                  value={dialValue}
                  onValueChange={setDialValue}
                  targetValue={isPsychic ? targetValue : null}
                  showTarget={isPsychic}
                  showColoredZones={isPsychic && !game?.clue}
                  disabled={isPsychic || !game?.clue || (isTeamsMode && !isMyTeamPlaying)}
                />

                {/* Bouton de validation (joueurs qui peuvent jouer, après l'indice) */}
                {canPlay && game?.clue && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={handleSubmitGuess}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-base hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
                    >
                      ✓ Valider : {dialValue}
                    </button>
                  </div>
                )}

                {!game?.clue && !isPsychic && (
                  <div className="mt-3 text-center">
                    <p className="text-gray-600 text-xs">
                      Attendez l'indice du Maitre...
                    </p>
                  </div>
                )}

                {isTeamsMode && !isPsychic && !isMyTeamPlaying && game?.clue && (
                  <div className="mt-3 text-center">
                    <p className="text-gray-600 text-xs">
                      C'est au tour de l'équipe {currentTeam === 'blue' ? 'Bleue' : 'Rouge'}. Attendez votre tour...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Résultat */}
            {showResult && lastResult && (
              <div className="bg-white rounded-lg shadow-lg p-2 mb-2">
                <h3 className="text-base font-bold text-center mb-2">
                   Résultat du tour
                </h3>

                {/* Mode teams ou résultat unique */}
                {(!lastResult.guesses || lastResult.guesses.length === 1) && (
                  <>
                    {/* Cadran avec cible révélée */}
                    <Dial
                      value={lastResult.guesses?.[0]?.guessValue || lastResult.guessValue || 10}
                      onValueChange={() => {}}
                      targetValue={lastResult.targetValue}
                      showTarget={true}
                      disabled={true}
                    />

                    {/* Affichage des valeurs - 2 encadrés côte à côte */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {/* Valeur sélectionnée */}
                      <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-2 text-center">
                        <p className="text-xs text-gray-600 mb-0.5 font-medium">Valeur sélectionnée</p>
                        <p className="text-3xl font-bold text-gray-800">
                          {lastResult.guesses?.[0]?.guessValue || lastResult.guessValue || 10}
                        </p>
                      </div>

                      {/* Cible */}
                      <div className="bg-white rounded-lg shadow-md border-2 border-red-300 p-2 text-center">
                        <p className="text-xs text-red-600 mb-0.5 font-medium"> Cible</p>
                        <p className="text-3xl font-bold text-red-600">{lastResult.targetValue}</p>
                      </div>
                    </div>

                    {/* Score - Grand encadré */}
                    <div className={`mt-2 p-2 rounded-lg border-2 ${getZoneColor(lastResult.guesses?.[0]?.zone || lastResult.zone)}`}>
                      <div className="text-center">
                        <p className="text-xs font-semibold mb-1 uppercase tracking-wide">Score obtenu</p>
                        <p className="text-3xl font-bold mb-0.5">
                          {lastResult.guesses?.[0]?.points || lastResult.points || 0} pts
                        </p>
                        <p className="text-base font-semibold mb-0.5">
                          {getDistanceMessage(lastResult.guesses?.[0]?.distance || lastResult.distance || 0)}
                        </p>
                        <p className="text-xs opacity-75">
                          Distance: <strong>{lastResult.guesses?.[0]?.distance || lastResult.distance || 0}</strong>
                          {' '}•{' '}
                          Zone: <strong className="uppercase">{lastResult.guesses?.[0]?.zone || lastResult.zone || 'white'}</strong>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Mode chacun pour soi avec plusieurs réponses */}
                {lastResult.guesses && lastResult.guesses.length > 1 && (
                  <div className="space-y-2">
                    {/* Afficher la cible */}
                    <div className="bg-red-50 rounded-lg border-2 border-red-300 p-2 text-center">
                      <p className="text-xs text-red-600 mb-0.5 font-medium"> Cible</p>
                      <p className="text-3xl font-bold text-red-600">{lastResult.targetValue}</p>
                    </div>

                    {/* Liste des résultats par joueur */}
                    <div className="space-y-1">
                      {lastResult.guesses.map((guess) => {
                        const player = currentRoom.players.find(p => p.id === guess.playerId);
                        return (
                          <div key={guess.playerId} className={`p-2 rounded-lg border-2 ${getZoneColor(guess.zone)}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">{player?.name || 'Inconnu'}</p>
                                <p className="text-xs text-gray-600">
                                  Réponse: <strong>{guess.guessValue}</strong> • Distance: <strong>{guess.distance}</strong>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{guess.points} pts</p>
                                <p className="text-xs uppercase font-semibold">{guess.zone}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bouton suivant (hôte uniquement) */}
                {currentPlayer?.isHost && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={handleNextRound}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-base hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
                    >
                      ▶ Tour suivant
                    </button>
                  </div>
                )}

                {!currentPlayer?.isHost && (
                  <div className="mt-3 text-center">
                    <p className="text-gray-600 text-xs">
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
