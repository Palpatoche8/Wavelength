/**
 * Utilitaires pour exporter des données en CSV
 */

/**
 * Convertit un tableau d'objets en CSV
 * @param {Array} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  // Extraire les en-têtes
  const headers = Object.keys(data[0]);

  // Créer les lignes CSV
  const csvRows = [
    headers.join(','), // En-têtes
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et les virgules
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  // Créer le contenu CSV
  const csvContent = csvRows.join('\n');

  // Télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default exportToCSV;
