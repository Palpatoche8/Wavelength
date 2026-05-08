/**
 * Cartes de spectres pour WaveLength
 * Chaque carte contient deux concepts opposés
 */

export const CARDS = [
  { id: 1, left: "Pire Chanson", right: "Meilleure Chanson" },
  { id: 2, left: "Pire Jeu vidéo", right: "Meilleur Jeu vidéo" },
  { id: 3, left: "Pire Bonbon", right: "Meilleur Bonbon" },
  { id: 4, left: "Red Flag", right: "Green Flag" },
  { id: 5, left: "Pire Dessert", right: "Meilleur Dessert" },
  { id: 6, left: "Pire Film", right: "Meilleur Film" },
  { id: 7, left: "Pire Série", right: "Meilleure Série" },
  { id: 8, left: "Pire Pizza", right: "Meilleure Pizza" },
  { id: 9, left: "Pire Sport", right: "Meilleur Sport" },
  { id: 10, left: "Pire Pokémon", right: "Meilleur Pokémon" },
  { id: 11, left: "Pire Dessin Animé", right: "Meilleur Dessin Animé" },
  { id: 12, left: "Pire Matière Scolaire", right: "Meilleure Matière Scolaire" },
  { id: 13, left: "Pire Marque", right: "Meilleure Marque" },
  { id: 14, left: "Pire Boisson", right: "Meilleure Boisson" },
  { id: 15, left: "Pire ligne de transport", right: "Meilleur ligne de transport" },
  { id: 16, left: "Pire Youtubeur/Streameur", right: "Meilleur Youtubeur/Streameur" },
  { id: 17, left: "Pire FastFood", right: "Meilleur FastFood" },
  { id: 18, left: "Pire Ville de France", right: "Meilleure Ville de France" },
  { id: 19, left: "Pire Pays", right: "Meilleur Pays" },
  { id: 20, left: "Pire Artiste", right: "Meilleur Artiste" },
  { id: 21, left: "Pire Loisir", right: "Meilleur Loisir" },
  { id: 22, left: "Pire Animal", right: "Meilleur Animal" },
  { id: 23, left: "Pire Animal à 1vs1", right: "Meilleur Animal à 1vs1" },
  { id: 24, left: "Très Froid", right: "Très Chaud" },
  { id: 25, left: "Très Ennuyeux", right: "Très Intéressant" },
  { id: 26, left: "Très Facile", right: "Très Difficile" },
  { id: 27, left: "Détesté", right: "Adoré" },
  { id: 28, left: "Inutile", right: "Indispensable" },
  { id: 29, left: "Silencieux", right: "Bruyant" },
  { id: 30, left: "Pire Idée de Date", right: "Meilleure Idée de Date" },
  { id: 31, left: "Pire Sport Aux JO", right: "Meilleur Sport aux JO" },
  { id: 32, left: "Pire unité de mesure", right: "Meilleure unité de mesure" },
  { id: 33, left: "Pire Célébrité", right: "Meilleure Célébrité" },
  { id: 34, left: "Pire Apéritif", right: "Meilleure Apéritif" },
  { id: 35, left: "Overrated skill", right: "Underrated skill" },
  { id: 36, left: "Mauvaise habitude", right: "Bonne habitude" },
  { id: 37, left: "Pire arme pour se battre", right: "Meilleure arme pour se battre" },
  { id: 38, left: "Pire Super-Pouvoir", right: "Meilleur Super-Pouvoir" },
  { id: 39, left: "Demande de la chance", right: "Demande du talent" },
  { id: 40, left: "Pire petit déjeuner", right: "Meilleur petit déjeuner" },
  { id: 41, left: "Pire émission télé", right: "Meilleur émission télé" },
  { id: 42, left: "Pire diner en amoureux", right: "Meilleur diner en amoureux" },
  { id: 43, left: "Inutile pour l'Apocalypse", right: "Essentiel pour l'Apocalypse" },
  { id: 44, left: "Fait inconnu", right: "Fait extremement connu" },
  { id: 45, left: "Mot très moche", right: "Mot très beau" },
  { id: 46, left: "Horrible de dormir dessus", right: "Incroyable de dormir dessus" },
  { id: 47, left: "Jamais à l'heure", right: "Toujours à l'heure" },
  { id: 48, left: "Personnage fictif détesté", right: "Personnage fictif adoré" },
  { id: 49, left: "Personne qui me détruirait", right: "Personne que je détruis" },
  { id: 50, left: "Pire couleur de chaussure", right: "Meilleure couleur de chaussure" },
  { id: 51, left: "Meilleur froid", right: "Meilleure chaud" },
  { id: 52, left: "Pire cadeau à un enfant", right: "Meilleur cadeau à un enfant" },
  { id: 53, left: "Pire Livre", right: "Meilleur Livre" },
  { id: 54, left: "Pire Anime", right: "Meilleur Anime" },









];

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Tire une carte aléatoire
 */
export function drawRandomCard() {
  const randomIndex = Math.floor(Math.random() * CARDS.length);
  return CARDS[randomIndex];
}

/**
 * Crée un deck mélangé de toutes les cartes
 * @param {Array} customCards - Cartes personnalisées optionnelles
 * @param {boolean} guaranteeCustomCard - Si true, garantit qu'au moins une carte custom est en première position
 * @returns {Array} Deck mélangé
 */
export function createShuffledDeck(customCards = [], guaranteeCustomCard = false) {
  // Fusionner cartes officielles + custom
  const allCards = [...CARDS];
  let customWithIds = [];

  if (customCards && customCards.length > 0) {
    // Ajouter les cartes custom avec IDs uniques
    customWithIds = customCards.map((card, index) => ({
      id: `custom_${card.id || index}`,
      left: card.left,
      right: card.right,
      isCustom: true
    }));
    allCards.push(...customWithIds);
  }

  const shuffled = shuffleArray(allCards);

  // Si demandé, garantir qu'au moins une carte custom est en première position
  if (guaranteeCustomCard && customWithIds.length > 0) {
    // Trouver une carte custom dans le deck mélangé
    const customCardIndex = shuffled.findIndex(card => card.isCustom);

    if (customCardIndex > 0) {
      // Échanger la première carte avec une carte custom
      [shuffled[0], shuffled[customCardIndex]] = [shuffled[customCardIndex], shuffled[0]];
    }
  }

  return shuffled;
}
