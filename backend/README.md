# WhatsApp SaaS Backend Proxy

Backend sécurisé qui protège votre Evolution API et gère l'authentification multi-tenant.

## 🔒 Architecture de sécurité

- **Evolution API cachée** : jamais exposée publiquement
- **Authentification JWT** : chaque utilisateur a son token
- **Isolation des instances** : préfixage automatique `user_{userId}_{customName}`
- **Quotas par plan** : limitation du nombre d'instances
- **Rate limiting** : protection contre les abus

## 🚀 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables :

```env
PORT=3001
JWT_SECRET=votre-secret-jwt-super-securise
EVOLUTION_API_URL=https://votre-evolution-api.com
EVOLUTION_API_KEY=votre-cle-api-evolution
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@host:port/database"
```

## 📦 Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 🏃 Démarrage

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## 📡 API Endpoints

### Auth
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

## 🔐 Sécurité

- ✅ Evolution API jamais exposée au frontend
- ✅ Clé API globale cachée côté serveur
- ✅ JWT pour authentification
- ✅ Vérification des quotas
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Helmet pour headers sécurisés

## 📊 Plans & Quotas

| Plan | Max Instances |
|------|---------------|
| Free | 1 |
| Starter | 5 |
| Pro | 20 |
| Enterprise | Illimité |

Modifiez dans `prisma/schema.prisma` et ajustez la logique dans `middleware/quota.ts`.
