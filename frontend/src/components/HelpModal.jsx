/**
 * Modal d'aide avec les règles du jeu
 */
function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-600">❓ Comment jouer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h3 className="text-xl font-semibold mb-2"> Objectif</h3>
            <p>
              Devinez où la valeur secrète du maître sur un spectre entre deux concepts opposés.
              Plus vous êtes proche, plus vous gagnez de points !
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2"> Déroulement</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Un joueur est désigné <strong>maître</strong> à chaque tour</li>
              <li>Le maître voit une <strong>valeure secrète</strong> (1-20) et deux concepts opposés</li>
              <li>Il donne un <strong>indice</strong> aux autres joueurs</li>
              <li>Les joueurs placent le curseur où ils pensent que se trouve la cible</li>
              <li>La cible est révélée et les points sont attribués</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2"> Zones de score</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 rounded"></span>
                <span><strong>Zone verte (4 pts)</strong> : Distance 0 (valeur exacte en mode normal)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-500 rounded"></span>
                <span><strong>Zone jaune (3 pts)</strong> : Distance 1</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-500 rounded"></span>
                <span><strong>Zone orange (2 pts)</strong> : Distance 2</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-300 rounded"></span>
                <span><strong>Zone blanche (0 pt)</strong> : Distance 3+</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">⚙️ Paramètres</h3>
            <ul className="space-y-1">
              <li> <strong>Timer</strong> : Limite de temps par tour (30s, 60s, 90s ou illimité)</li>
              <li> <strong>Nombre de tours</strong> : 5, 10, 15 ou libre (2 × nb joueurs)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2"> Raccourcis clavier</h3>
            <ul className="space-y-1">
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">←</kbd> / <kbd className="px-2 py-1 bg-gray-200 rounded">→</kbd> : Déplacer le curseur</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Home</kbd> / <kbd className="px-2 py-1 bg-gray-200 rounded">End</kbd> : Aller aux extrémités</li>
              <li><kbd className="px-2 py-1 bg-gray-200 rounded">Tab</kbd> : Naviguer entre les éléments</li>
            </ul>
          </section>

          <div className="pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>WaveLength v2.0.0 - Jeu multijoueur spectrum</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
