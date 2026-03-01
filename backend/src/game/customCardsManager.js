/**
 * Gestionnaire de cartes personnalisées
 * Stockage en mémoire par room
 */
class CustomCardsManager {
  constructor() {
    // Map : roomCode -> Card[]
    this.customCards = new Map();
    this.nextId = 1;
  }

  /**
   * Ajoute une carte personnalisée à une room
   * @param {string} roomCode - Code de la room
   * @param {Object} card - { left: string, right: string }
   * @returns {Object} Carte ajoutée avec ID
   */
  addCard(roomCode, card) {
    if (!this.customCards.has(roomCode)) {
      this.customCards.set(roomCode, []);
    }

    const newCard = {
      id: this.nextId++,
      left: card.left.trim(),
      right: card.right.trim(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    this.customCards.get(roomCode).push(newCard);
    console.log(`➕ Carte custom ajoutée à ${roomCode}: "${newCard.left}" ↔ "${newCard.right}"`);

    return newCard;
  }

  /**
   * Récupère toutes les cartes custom d'une room
   * @param {string} roomCode - Code de la room
   * @returns {Array} Liste des cartes custom
   */
  getCards(roomCode) {
    return this.customCards.get(roomCode) || [];
  }

  /**
   * Supprime une carte custom
   * @param {string} roomCode - Code de la room
   * @param {number} cardId - ID de la carte
   * @returns {boolean} True si supprimée
   */
  removeCard(roomCode, cardId) {
    const cards = this.customCards.get(roomCode);
    if (!cards) return false;

    const index = cards.findIndex(c => c.id === cardId);
    if (index === -1) return false;

    cards.splice(index, 1);
    console.log(`➖ Carte custom ${cardId} supprimée de ${roomCode}`);

    return true;
  }

  /**
   * Importe des cartes depuis JSON
   * @param {string} roomCode - Code de la room
   * @param {Array} cardsData - Tableau de { left, right }
   * @returns {Array} Cartes importées
   */
  importCards(roomCode, cardsData) {
    if (!Array.isArray(cardsData)) {
      throw new Error('cardsData doit être un tableau');
    }

    const imported = [];
    for (const card of cardsData) {
      if (card.left && card.right) {
        const newCard = this.addCard(roomCode, card);
        imported.push(newCard);
      }
    }

    console.log(`📥 ${imported.length} cartes importées dans ${roomCode}`);
    return imported;
  }

  /**
   * Exporte les cartes en JSON
   * @param {string} roomCode - Code de la room
   * @returns {string} JSON des cartes
   */
  exportCards(roomCode) {
    const cards = this.getCards(roomCode);
    return JSON.stringify(
      cards.map(c => ({ left: c.left, right: c.right })),
      null,
      2
    );
  }

  /**
   * Nettoie les cartes d'une room (quand room supprimée)
   * @param {string} roomCode - Code de la room
   */
  cleanup(roomCode) {
    this.customCards.delete(roomCode);
    console.log(`🧹 Cartes custom nettoyées pour ${roomCode}`);
  }
}

// Export singleton
export default new CustomCardsManager();
