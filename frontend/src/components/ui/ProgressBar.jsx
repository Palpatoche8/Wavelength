/**
 * Barre de progression pour afficher l'avancement des rounds
 */
function ProgressBar({ currentRound, totalRounds }) {
  // Calculer le pourcentage de progression
  // On compte les rounds TERMINÉS, donc currentRound - 1
  const completedRounds = Math.max(0, currentRound - 1);
  const percentage = (completedRounds / totalRounds) * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Label avec Round X / Y */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-black-1500">
          Tour {currentRound} / {totalRounds}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-md"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Message de fin */}
      {currentRound === totalRounds && (
        <p className="text-center text-sm text-indigo-600 font-semibold mt-2 animate-pulse">
          🏁 Dernier tour !
        </p>
      )}
    </div>
  );
}

export default ProgressBar;
