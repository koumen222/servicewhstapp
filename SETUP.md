# 🚀 Guide de démarrage - WhatsApp SaaS avec Backend Proxy

## 📋 Architecture

```
Frontend (React + Vite)
    ↓ JWT Auth
Backend Proxy (Express + TypeScript)
    ↓ API Key (cachée)
Evolution API (Railway)
```

**Sécurité** : Evolution API jamais exposée publiquement, clé API cachée côté serveur.

---

## 🔧 Installation

### 1. Backend

```bash
cd backend
npm install
```

### 2. Configuration Backend

Créer `backend/.env` :

```env
PORT=3001
NODE_ENV=development

JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
JWT_EXPIRES_IN=7d

EVOLUTION_API_URL=https://evolution-api-production-77b9.up.railway.app
EVOLUTION_API_KEY=1234567pkltd

DATABASE_URL="postgresql://postgres:pHuLirBCTfaAnKMzhwHjUEhBNkagXdKl@caboose.proxy.rlwy.net:45082/railway"
FRONTEND_URL=http://localhost:5173
```

### 3. Base de données

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Frontend

```bash
cd ..
npm install
```

### 5. Configuration Frontend

Vérifier `.env` :

```env
VITE_BACKEND_URL=http://localhost:3001
```

---

## ▶️ Démarrage

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Le backend démarre sur **http://localhost:3001**

### Terminal 2 - Frontend

```bash
npm run dev
```

Le frontend démarre sur **http://localhost:5173**

---

## 🔐 Fonctionnement

### 1. Inscription / Connexion

- L'utilisateur s'inscrit via `/register`
- Le backend crée un compte avec un **plan** (free, starter, pro, enterprise)
- Un **JWT** est généré et stocké dans le localStorage

### 2. Création d'instance

- L'utilisateur crée une instance avec un nom custom (ex: `mon-shop`)
- Le backend vérifie le **quota** selon le plan
- Le backend préfixe le nom : `user_{userId}_mon-shop`
- L'instance est créée sur Evolution API avec le nom préfixé
- L'utilisateur ne voit que `mon-shop` dans l'interface

### 3. Isolation des données

- Chaque requête inclut le JWT
- Le backend filtre les instances par `userId`
- Un utilisateur ne peut **jamais** voir/modifier les instances d'un autre

### 4. Quotas par plan

| Plan | Max Instances |
|------|---------------|
| Free | 1 |
| Starter | 5 |
| Pro | 20 |
| Enterprise | Illimité |

---

## 🛡️ Sécurité

✅ **Evolution API cachée** : jamais exposée au frontend  
✅ **Clé API globale** : stockée uniquement dans `backend/.env`  
✅ **JWT** : authentification sécurisée  
✅ **Quotas** : limitation par plan  
✅ **Rate limiting** : 100 requêtes / 15 min  
✅ **CORS** : uniquement le frontend autorisé  
✅ **Helmet** : headers de sécurité  

---

## 📡 Endpoints API

### Auth (public)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Instances (authentifié)
- `POST /api/instance/create` - Créer instance
- `GET /api/instance/fetchInstances` - Lister instances
- `GET /api/instance/connectionState/:name` - Statut
- `GET /api/instance/qrcode/:name` - QR code
- `DELETE /api/instance/logout/:name` - Déconnecter
- `DELETE /api/instance/delete/:name` - Supprimer

### Messages (authentifié)
- `POST /api/message/sendText/:name` - Envoyer message

---

## 🧪 Test

1. Créer un compte sur http://localhost:5173/register
2. Créer une instance
3. Scanner le QR code avec WhatsApp
4. Envoyer un message test

---

## 🚀 Déploiement

### Backend (Railway, Render, etc.)

1. Déployer le dossier `backend/`
2. Configurer les variables d'environnement
3. Exécuter `npx prisma migrate deploy`

### Frontend (Vercel, Netlify, etc.)

1. Déployer le dossier racine
2. Configurer `VITE_BACKEND_URL` avec l'URL du backend déployé

---

## 💡 Prochaines étapes

- [ ] Ajouter Stripe pour les paiements
- [ ] Webhooks Evolution API pour notifications
- [ ] Dashboard admin pour gérer les utilisateurs
- [ ] Logs et analytics
- [ ] Support multi-langue
