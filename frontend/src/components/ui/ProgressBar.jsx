/**
 * Barre de progression pour afficher l'avancement des rounds
 */
function ProgressBar({ currentRound, totalRounds }) {
  // Calculer le pourcentage de progression
  const percentage = (currentRound / totalRounds) * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Label avec Round X / Y */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Tour {currentRound} / {totalRounds}
        </span>
        <span className="text-xs text-gray-500">
          {Math.round(percentage)}% complété
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
