# Guide de Déploiement en Production

## 📋 Prérequis

- Node.js 18+ installé
- MongoDB Atlas ou instance MongoDB
- Compte Evolution API
- Domaine configuré (ex: ecomcookpit.site)

## 🚀 Déploiement Backend

### 1. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
# Server
PORT=3001
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://morgan:koumen1234@cluster0.5t30p4l.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
JWT_EXPIRES_IN=7d

# Backend URL (URL publique de votre backend)
BACKEND_PUBLIC_URL=https://api.ecomcookpit.site

# Evolution API
EVOLUTION_API_URL=https://evolution-api-production-77b9.up.railway.app
EVOLUTION_API_KEY=1234567pkl...
EVOLUTION_MASTER_API_KEY=1234567pkl...

# Frontend URL (URLs autorisées pour CORS)
FRONTEND_URL=https://ecomcookpit.site,https://www.ecomcookpit.site
```

### 2. Installation et build

```bash
cd backend
npm install
npm run build
```

### 3. Créer le compte super admin

```bash
npm run create-admin
```

Notez les identifiants affichés :
- Email: `admin@whatsapp-saas.com`
- Mot de passe: `Admin@2024!`

### 4. Démarrer le serveur

```bash
npm start
```

Le backend sera accessible sur `http://localhost:3001` (ou le PORT configuré).

## 🌐 Déploiement Frontend

### 1. Configuration des variables d'environnement

Créez un fichier `.env.local` dans le dossier `frontend/` :

```env
NEXT_PUBLIC_API_URL=https://api.ecomcookpit.site
NEXT_PUBLIC_APP_URL=https://ecomcookpit.site
```

### 2. Build et déploiement

```bash
cd frontend
npm install
npm run build
```

Pour Netlify/Vercel, configurez :
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Framework**: Next.js

## 🔧 Configuration DNS

### Backend (API)
```
Type: A ou CNAME
Nom: api.ecomcookpit.site
Valeur: [IP de votre serveur backend]
```

### Frontend
```
Type: A ou CNAME
Nom: @ (ou www)
Valeur: [IP de votre serveur frontend ou Netlify/Vercel]
```

## 🔒 Sécurité

### 1. Changez les secrets en production

- Générez un nouveau `JWT_SECRET` fort
- Changez le mot de passe admin après la première connexion

### 2. Configurez HTTPS

Utilisez Let's Encrypt ou Cloudflare pour activer HTTPS sur vos domaines.

### 3. Variables d'environnement sensibles

Ne commitez JAMAIS les fichiers `.env` dans Git. Utilisez les fichiers `.env.example` comme modèles.

## 📊 Accès au Dashboard Admin

Une fois déployé, accédez au dashboard admin sur :

```
https://ecomcookpit.site/admin
```

Connectez-vous avec les identifiants du super admin créés précédemment.

## 🐛 Dépannage

### CORS bloqué en production

Vérifiez que `FRONTEND_URL` dans le backend contient bien l'URL exacte de votre frontend (avec https://).

### MongoDB connection failed

Vérifiez que :
- L'IP de votre serveur est autorisée dans MongoDB Atlas (Network Access)
- La chaîne de connexion `MONGODB_URI` est correcte
- Le mot de passe ne contient pas de caractères spéciaux non encodés

### Evolution API erreurs

Vérifiez que :
- `EVOLUTION_API_URL` est accessible depuis votre serveur
- `EVOLUTION_API_KEY` et `EVOLUTION_MASTER_API_KEY` sont corrects

## 📝 Logs

Pour voir les logs du backend en production :

```bash
# Si vous utilisez PM2
pm2 logs

# Ou directement
tail -f logs/app.log
```

## 🔄 Mise à jour

Pour mettre à jour le code en production :

```bash
# Backend
cd backend
git pull
npm install
npm run build
pm2 restart all

# Frontend
cd frontend
git pull
npm install
npm run build
# Redéployez sur Netlify/Vercel ou redémarrez votre serveur
```

## 📞 Support

Pour toute question ou problème, consultez les logs et vérifiez :
1. Les variables d'environnement
2. La configuration CORS
3. La connexion MongoDB
4. L'accès à Evolution API
