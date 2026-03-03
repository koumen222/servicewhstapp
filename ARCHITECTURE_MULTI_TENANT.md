# Architecture SaaS Multi-Tenant WhatsApp - Guide Complet

## 🏗️ Vue d'Ensemble de l'Architecture

### Architecture Finale Implémentée

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Final  │    │  Frontend React │    │ Backend Express │
│                 │    │                 │    │   Multi-Tenant  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ x-api-key (enfant)     │ JWT Auth               │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Couche de Sécurité                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Validation     │  │   Isolation     │  │  Rate Limiting  │ │
│  │  Clés API       │  │  Multi-Tenant   │  │  & Quotas       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
          ┌─────────────────────────────────────────┐
          │           Base de Données               │
          │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
          │  │  Users  │ │Instance │ │ ApiKey  │    │
          │  └─────────┘ └─────────┘ └─────────┘    │
          │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
          │  │ Quotas  │ │Messages │ │ Config  │    │
          │  └─────────┘ └─────────┘ └─────────┘    │
          └─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Evolution API                                │
│              (Clé Principale Cachée)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de Données Principal

```
1. Client → API avec clé enfant (ak_live_xxx)
2. Validation clé enfant → Instance associée
3. Vérification quotas & permissions
4. Appel Evolution API avec clé principale (cachée)
5. Logging & audit complets
6. Réponse standardisée au client
```

## 🔐 Système de Clés API Sécurisé

### Génération des Clés
- **Format** : `ak_live_` + 25 caractères aléatoires
- **Stockage** : Hash SHA-256 + salt (jamais en clair)
- **Préfixe** : Premiers 16 caractères pour identification
- **Permissions granulaires** : send_message, get_instance_status, etc.

### Validation et Sécurité
```typescript
// Processus de validation
1. Extraction header x-api-key
2. Validation format ak_live_
3. Hash avec salt configuré
4. Recherche en base (index sur keyHash)
5. Vérification expiration et statut
6. Contrôle permissions requises
7. Mise à jour stats d'utilisation
```

### Isolation Multi-Tenant Garantie
- Chaque clé API → Une seule instance
- Validation ownership à chaque requête  
- Impossible d'accéder aux données d'un autre utilisateur
- Audit complet de tous les accès

## 📊 Gestion des Quotas par Plan

### Limites par Plan Utilisateur
```javascript
const quotaLimits = {
  free: {
    messages_per_day: 50,
    messages_per_month: 1000
  },
  starter: {
    messages_per_day: 1000, 
    messages_per_month: 15000
  },
  pro: {
    messages_per_day: 10000,
    messages_per_month: 200000
  },
  enterprise: {
    messages_per_day: 100000,
    messages_per_month: 2000000
  }
}
```

### Système de Quotas Intelligent
- **Réinitialisation automatique** (quotidien/mensuel)
- **Vérification avant envoi** (évite la surconsommation)
- **Compteurs en temps réel** avec isolation par instance
- **Gestion des quotas expirés** via tâches de maintenance

## 🛡️ Sécurité Multi-Couches

### 1. Authentification & Autorisation
- **JWT** pour le frontend (utilisateurs)
- **API Keys** pour les clients externes (instances)
- **Permissions granulaires** par clé API
- **Expiration configurable** des clés

### 2. Isolation Multi-Tenant
```typescript
// Validation systématique de l'ownership
const instance = await prisma.instance.findFirst({
  where: {
    id: instanceId,
    userId,        // CRITIQUE : toujours filtrer par utilisateur
    isActive: true
  }
})
```

### 3. Rate Limiting Avancé
- **Par IP** : 1000 req/15min
- **Par utilisateur** : selon plan (200-10000 req/15min)
- **Par clé API** : 100 req/min avec sliding window
- **Headers informatifs** : X-RateLimit-*

### 4. Détection d'Activité Suspecte
- **Scanning automatisé** détecté
- **User-agents suspects** identifiés  
- **Patterns malveillants** dans les payloads
- **Alertes en temps réel** avec scoring de risque

### 5. Sanitisation & Validation
- **Nettoyage automatique** des entrées utilisateur
- **Validation des formats** (numéros de téléphone, etc.)
- **Limitation des longueurs** (messages, noms, etc.)
- **Protection XSS** et injections

## 📡 Endpoints API Complets

### Endpoints Publics (clés API)
```
POST /api/v1/send-message       # Envoyer message texte
POST /api/v1/send-media         # Envoyer média (image/document) 
GET  /api/v1/instance/status    # Statut de l'instance
GET  /api/v1/quota/usage        # Utilisation des quotas
```

### Endpoints Privés (JWT)
```
POST /api/instances/create-instance    # Créer nouvelle instance
GET  /api/instances/instances          # Lister instances utilisateur  
DELETE /api/instances/:id              # Supprimer instance
POST /api/instances/:id/restart        # Redémarrer instance
GET  /api/instances/:id/qr-code        # Obtenir QR code connexion
```

## 🗃️ Schéma de Base de Données

### Tables Principales

#### Users
```sql
- id (UUID, PK)
- email (UNIQUE)  
- name, password
- plan (free|starter|pro|enterprise)
- maxInstances (selon plan)
- isActive (soft delete)
- timestamps
```

#### Instance  
```sql
- id (UUID, PK)
- userId (FK Users)
- instanceName (UNIQUE, format Evolution API)
- customName (nom utilisateur)
- evolutionApiKey (clé privée Evolution)
- status, profileName, profilePictureUrl
- isActive, timestamps, lastUsed
```

#### ApiKey
```sql
- id (UUID, PK)
- userId (FK Users) 
- instanceId (FK Instance)
- keyHash (SHA-256, UNIQUE)
- keyPrefix (identification)
- permissions (array)
- isActive, usageCount, lastUsed
- expiresAt (optionnel)
- timestamps
```

#### QuotaUsage
```sql
- id (UUID, PK)
- instanceId (FK Instance)
- quotaType (messages_per_day|messages_per_month)
- currentUsage, maxAllowed
- resetDate (auto-calculé)
- timestamps
```

#### MessageLog
```sql
- id (UUID, PK)
- instanceId (FK Instance)
- apiKeyId (FK ApiKey) 
- recipientNumber, messageType, messageContent
- status, evolutionMessageId, errorMessage
- ipAddress, userAgent
- createdAt (pour analytics)
```

### Relations Clés
- User 1:N Instance (selon maxInstances)
- Instance 1:N ApiKey (max 10 par instance)
- Instance 1:N QuotaUsage (par type de quota)
- ApiKey 1:N MessageLog (audit complet)

## 🚀 Déploiement Production

### Variables d'Environnement Critiques
```env
# Base de données
DATABASE_URL=postgresql://...

# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_MASTER_API_KEY=your-master-key-here

# Sécurité
API_KEY_SALT=your-super-secret-salt-change-in-production
JWT_SECRET=your-jwt-secret-here

# Frontend
FRONTEND_URL=https://your-frontend.com,http://localhost:3000

# Optionnel
REDIS_URL=redis://... (pour rate limiting avancé)
```

### Checklist Pré-Production

#### Sécurité
- [ ] Changer `API_KEY_SALT` en production
- [ ] Utiliser HTTPS uniquement
- [ ] Configurer CORS restrictif
- [ ] Activer tous les headers de sécurité
- [ ] Audit logs activés

#### Base de Données
- [ ] Migration Prisma exécutée
- [ ] Index de performance créés
- [ ] Backup automatique configuré
- [ ] Connection pooling optimisé

#### Monitoring
- [ ] Logs structurés (JSON)
- [ ] Métriques de performance
- [ ] Alertes sur quotas dépassés
- [ ] Dashboard de monitoring

#### Performance
- [ ] Rate limiting avec Redis
- [ ] Cache des clés API chaudes
- [ ] Compression gzip activée
- [ ] CDN pour assets statiques

## 🔄 Maintenance & Operations

### Tâches Cron Recommandées
```bash
# Nettoyer les quotas expirés (toutes les heures)
0 * * * * curl -X POST http://localhost:3001/api/internal/reset-expired-quotas

# Nettoyer les anciens logs (quotidien)
0 2 * * * curl -X POST http://localhost:3001/api/internal/cleanup-old-logs

# Nettoyer les clés expirées (quotidien) 
0 3 * * * curl -X POST http://localhost:3001/api/internal/cleanup-expired-keys
```

### Scripts de Maintenance
```sql
-- Statistiques d'utilisation
SELECT 
  u.plan,
  COUNT(i.id) as total_instances,
  AVG(q.currentUsage) as avg_usage
FROM users u
LEFT JOIN instances i ON u.id = i.userId 
LEFT JOIN quota_usage q ON i.id = q.instanceId
GROUP BY u.plan;

-- Top utilisateurs actifs
SELECT 
  u.email,
  u.plan,
  COUNT(m.id) as messages_sent
FROM users u
JOIN instances i ON u.id = i.userId
JOIN message_log m ON i.id = m.instanceId
WHERE m.createdAt > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.plan
ORDER BY messages_sent DESC
LIMIT 10;
```

## 🚨 Erreurs à Éviter Absolument

### 1. Isolation Multi-Tenant
❌ **JAMAIS** : Filtrer seulement par instanceId
```typescript
// DANGEREUX - permet l'accès cross-tenant
const instance = await prisma.instance.findUnique({
  where: { id: instanceId }
})
```

✅ **TOUJOURS** : Filtrer par userId ET instanceId
```typescript
// SÉCURISÉ - isolation garantie
const instance = await prisma.instance.findFirst({
  where: { 
    id: instanceId,
    userId: authenticatedUserId 
  }
})
```

### 2. Gestion des Clés API
❌ **JAMAIS** stocker les clés en clair
❌ **JAMAIS** logguer les clés complètes
❌ **JAMAIS** exposer la clé Evolution principale

✅ **TOUJOURS** hasher avec salt
✅ **TOUJOURS** logguer seulement le préfixe  
✅ **TOUJOURS** cacher la clé Evolution côté backend

### 3. Validation des Entrées
❌ Faire confiance aux données clients
❌ Oublier la validation côté serveur
❌ Autoriser des formats de numéros invalides

✅ Valider TOUS les inputs
✅ Sanitiser les chaînes de caractères
✅ Vérifier les formats (téléphone, email, etc.)

## 📈 Exemple d'Utilisation Complète

### 1. Création d'Instance (Frontend)
```typescript
const response = await fetch('/api/instances/create-instance', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customName: 'Mon Bot WhatsApp',
    integration: 'WHATSAPP-BAILEYS'
  })
})

const { data } = await response.json()
// data.apiKey.key = clé enfant à donner au client
// data.instance.id = ID de l'instance
// data.qrCode = QR code pour connexion WhatsApp
```

### 2. Envoi de Message (Client Final)
```typescript
const response = await fetch('https://your-saas-api.com/api/v1/send-message', {
  method: 'POST',
  headers: {
    'x-api-key': 'ak_live_abc123...', // Clé enfant
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '33612345678',
    text: 'Bonjour depuis mon SaaS!'
  })
})

const result = await response.json()
// result.data.messageId = ID du message envoyé
// result.data.quotaRemaining = quota restant
```

### 3. Vérification du Statut
```typescript
const statusResponse = await fetch('https://your-saas-api.com/api/v1/instance/status', {
  headers: {
    'x-api-key': 'ak_live_abc123...'
  }
})

const { data } = await statusResponse.json()
// data.status = 'open' | 'close' | 'connecting'
// data.profileName = nom du profil WhatsApp
```

## 🎯 Architecture de Production Recommandée

```
Internet
    ↓
Load Balancer (Nginx/Cloudflare)
    ↓
Multiple Backend Instances (PM2/Docker)
    ↓
Redis (Rate Limiting + Cache)
    ↓
PostgreSQL (Primary + Replica)
    ↓
Evolution API (Séparé, sécurisé)
```

### Résilience et Scalabilité
- **Load balancing** entre plusieurs instances backend
- **Redis** pour le rate limiting distribué
- **PostgreSQL** avec réplication pour haute disponibilité
- **Monitoring** avec Prometheus + Grafana
- **Logs centralisés** avec ELK Stack

Cette architecture garantit un système SaaS multi-tenant sécurisé, scalable et prêt pour la production, avec isolation complète des données clients et protection contre tous les vecteurs d'attaque courants.
