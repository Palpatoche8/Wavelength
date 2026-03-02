/**
 * Composant d'affichage de la carte avec spectre
 */
function Card({ card }) {
  if (!card) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      {/* Titre */}
      <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
        Spectre actuel
      </h3>

      {/* Spectre visuel */}
      <div className="relative">
        {/* Barre de dégradé */}
        <div className="h-16 rounded-lg bg-gradient-to-r from-blue-500 via-purple-300 to-orange-500 mb-4 shadow-inner">
        </div>

        {/* Labels des concepts */}
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="bg-blue-100 rounded-lg p-3 text-center border-2 border-blue-300">
              <p className="text-sm font-bold text-blue-800">
                {card.left}
              </p>
            </div>
          </div>

          <div className="flex-1 pl-4">
            <div className="bg-orange-100 rounded-lg p-3 text-center border-2 border-orange-300">
              <p className="text-sm font-bold text-orange-800">
                {card.right}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          ← Positionnez le cadran entre ces deux concepts →
        </p>
      </div>
    </div>
  );
}

export default Card;
