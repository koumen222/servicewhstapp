# 🚀 Déploiement Backend en Production

## Prérequis

- Compte Railway, Render, Vercel ou autre hébergeur Node.js
- Base PostgreSQL Railway configurée

## Étapes de déploiement

### 1. Préparation du code

```bash
# Builder le backend
npm run build
```

### 2. Variables d'environnement (à configurer sur l'hébergeur)

```env
NODE_ENV=production
PORT=3001

# JWT (très important - changez ceci !)
JWT_SECRET=votre-secret-jwt-super-securise-unique
JWT_EXPIRES_IN=7d

# Evolution API
EVOLUTION_API_URL=https://evolution-api-production-77b9.up.railway.app
EVOLUTION_API_KEY=votre-cle-api-evolution

# Base PostgreSQL Railway
DATABASE_URL=postgresql://postgres:pHuLirBCTfaAnKMzhwHjUEhBNkagXdKl@caboose.proxy.rlwy.net:45082/railway

# CORS (URL de votre frontend déployé)
FRONTEND_URL=https://votre-frontend.com
```

### 3. Migration Prisma

```bash
# Sur l'hébergeur, après déploiement :
npx prisma migrate deploy
npx prisma generate
```

### 4. Déploiement Railway (recommandé)

1. Connectez-vous à Railway
2. Créez un nouveau projet depuis GitHub
3. Liez votre repo `whatsapp-saas`
4. Configurez le **root directory** : `backend`
5. Ajoutez toutes les variables d'environnement ci-dessus
6. Déployez !

### 5. Vérification

Une fois déployé, testez :
```bash
curl https://votre-backend.railway.app/api/auth/login
```

## ⚠️ Sécurité importante

- **Jamais** exposer `EVOLUTION_API_KEY` dans le frontend
- **Jamais** utiliser `NODE_ENV=development` en production
- Changez `JWT_SECRET` pour une valeur unique
- Configurez `FRONTEND_URL` avec votre domaine réel

## 🔄 Mise à jour du Frontend

Après déploiement du backend, mettez à jour `.env` du frontend :

```env
VITE_BACKEND_URL=https://votre-backend-deploye.railway.app
```

Puis redéployez le frontend.
