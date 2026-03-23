# 🚀 Guide de déploiement - WaveLength Game

Ce guide explique comment déployer le jeu WaveLength sur **Render.com** (gratuit).

## 📋 Prérequis

1. Un compte GitHub avec ton code pushé
2. Un compte sur [Render.com](https://render.com) (gratuit)

---

## 🎯 Architecture du déploiement

Le jeu sera déployé en **2 services séparés** :

1. **Backend** (Node.js + Socket.IO) - Web Service
2. **Frontend** (React) - Static Site

Les deux communiquent via WebSockets et HTTPS.

---

## 📝 Étape 1 : Préparer le code

### 1.1 Push ton code sur GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Vérifier les fichiers

Assure-toi que ces fichiers existent (déjà créés) :
- ✅ `render.yaml` - Configuration Render
- ✅ `backend/.env.example` - Variables d'environnement backend
- ✅ `frontend/.env.example` - Variables d'environnement frontend

---

## 🚀 Étape 2 : Déployer sur Render

### 2.1 Créer un compte Render

1. Va sur [render.com](https://render.com)
2. Clique sur **"Get Started for Free"**
3. Connecte-toi avec GitHub

### 2.2 Connecter ton repository

1. Dans le dashboard Render, clique sur **"New +"**
2. Sélectionne **"Blueprint"**
3. Connecte ton repository GitHub `demicercle`
4. Render va détecter automatiquement le fichier `render.yaml`

### 2.3 Lancer le déploiement

1. Clique sur **"Apply"** pour créer les 2 services
2. Render va automatiquement :
   - Créer le service **wavelength-backend**
   - Créer le service **wavelength-frontend**
   - Installer les dépendances
   - Builder les projets
   - Les déployer

⏱️ **Temps de déploiement** : 5-10 minutes

---

## 🔧 Étape 3 : Configurer les variables d'environnement

### 3.1 Backend (déjà configuré automatiquement)

Render configure automatiquement :
- `PORT=10000`
- `NODE_ENV=production`
- `FRONTEND_URL` → URL du frontend (auto-détecté)

### 3.2 Frontend (déjà configuré automatiquement)

Render configure automatiquement :
- `VITE_BACKEND_URL` → URL du backend (auto-détecté)

> **Note** : Le fichier `render.yaml` configure tout automatiquement ! 🎉

---

## ✅ Étape 4 : Vérifier le déploiement

### 4.1 Vérifier le backend

1. Dans Render Dashboard, clique sur **wavelength-backend**
2. Tu verras l'URL : `https://wavelength-backend.onrender.com`
3. Visite cette URL dans ton navigateur
4. Tu devrais voir :
   ```json
   {
     "message": "🎮 WaveLength Game Server",
     "version": "1.0.0",
     "status": "running"
   }
   ```

### 4.2 Vérifier le frontend

1. Dans Render Dashboard, clique sur **wavelength-frontend**
2. Tu verras l'URL : `https://wavelength-frontend.onrender.com`
3. Visite cette URL → Le jeu devrait s'afficher ! 🎮

---

## 🎮 Étape 5 : Jouer !

**Ton jeu est maintenant en ligne !**

- **URL du jeu** : `https://wavelength-frontend.onrender.com`
- Partage ce lien avec tes amis pour jouer ensemble
- Aucune installation requise, juste le lien !

---

## 🔄 Déploiements automatiques

### Auto-deploy activé par défaut

Render redéploie automatiquement à chaque push sur `main` :

1. Tu fais des modifications
2. Tu push sur GitHub :
   ```bash
   git add .
   git commit -m "Nouvelle fonctionnalité"
   git push
   ```
3. Render détecte le push et redéploie automatiquement
4. 5-10 minutes plus tard, les changements sont en ligne

---

## ⚠️ Limitations du plan gratuit Render

- **Sleep après 15 minutes d'inactivité**
  - Le serveur se met en veille après 15 min sans requête
  - Premier accès : 30-60 secondes de chargement (réveil)
  - Solution : Plan payant ($7/mois) pour éviter le sleep

- **750 heures gratuites par mois**
  - Largement suffisant pour tester et jouer avec des amis
  - Si dépassé : le service s'arrête jusqu'au mois prochain

- **Pas de domaine personnalisé en gratuit**
  - Tu as une URL `.onrender.com`
  - Pour un domaine custom (ex: `wavelength.fr`) : Plan payant

---

## 🐛 Dépannage

### Le backend ne démarre pas

1. Vérifie les logs dans le Dashboard Render
2. Vérifie que `package.json` a bien `"type": "module"`
3. Vérifie que `PORT` est bien configuré

### Le frontend ne se connecte pas au backend

1. Vérifie que `VITE_BACKEND_URL` pointe vers le bon backend
2. Vérifie les logs du backend pour voir les erreurs CORS
3. Ouvre la console du navigateur (F12) pour voir les erreurs

### Le jeu est lent au premier chargement

C'est normal ! Le plan gratuit met les services en veille.
- **Solution temporaire** : Attendre 30-60 secondes
- **Solution permanente** : Passer au plan payant ($7/mois)

### Erreur CORS

Si tu vois des erreurs CORS dans la console :
1. Vérifie que le backend autorise l'URL du frontend
2. Le fichier `server.js` autorise déjà tous les `.onrender.com`

---

## 🎯 Prochaines étapes (optionnel)

### 1. Domaine personnalisé

Pour avoir `wavelength.tonsite.com` au lieu de `.onrender.com` :
1. Achète un domaine (ex: sur Namecheap, ~10€/an)
2. Dans Render, va dans Settings > Custom Domain
3. Suis les instructions pour configurer les DNS

### 2. Analytics

Ajoute Google Analytics ou Plausible pour suivre :
- Nombre de joueurs
- Parties jouées
- Performance

### 3. Base de données

Pour sauvegarder les scores :
1. Ajoute un service PostgreSQL sur Render (gratuit)
2. Connecte-le au backend
3. Sauvegarde les parties et statistiques

---

## 💡 Conseils

- **Teste en local avant de push** : `npm run dev`
- **Surveille les logs** : Dashboard Render > Service > Logs
- **Version ton code** : Utilise des tags Git pour les releases importantes
- **Communique avec tes joueurs** : Préviens-les avant un redéploiement

---

## 🆘 Besoin d'aide ?

- **Documentation Render** : https://render.com/docs
- **Support Render** : https://render.com/support
- **Discord Render** : Communauté active et réactive

---

## ✨ C'est tout !

Ton jeu est maintenant accessible à **n'importe qui dans le monde** avec juste un lien ! 🌍🎮

Partage `https://wavelength-frontend.onrender.com` et amuse-toi bien ! 🎉
