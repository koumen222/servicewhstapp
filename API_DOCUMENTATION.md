# WhatsApp SaaS Platform - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Instance Management](#instance-management)
4. [Messaging](#messaging)
5. [Webhooks](#webhooks)
6. [Error Codes](#error-codes)
7. [Rate Limits & Quotas](#rate-limits--quotas)

---

## Overview

**Base URL:** `https://api.ecomcookpit.site`

Cette API vous permet de gérer des instances WhatsApp, envoyer et recevoir des messages, et gérer vos conversations en temps réel.

### Architecture
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **WhatsApp Engine:** Evolution API (self-hosted)
- **Frontend:** Next.js + React
- **Real-time:** Webhooks + Polling fallback

### Fonctionnalités principales
- ✅ Multi-tenant (isolation complète par utilisateur)
- ✅ Gestion d'instances WhatsApp illimitées (selon plan)
- ✅ Envoi/réception de messages (texte, média, documents)
- ✅ Webhooks temps réel pour les événements
- ✅ Quotas et rate limiting par plan
- ✅ API Keys sécurisées par instance
- ✅ Logs d'audit et sécurité

---

## Authentication

### 1. Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "d992fe3f",
      "email": "john@example.com",
      "name": "John Doe",
      "plan": "free",
      "maxInstances": 1
    }
  }
}
```

### 2. Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse:** Identique à l'inscription

### 3. Utilisation du Token
Toutes les requêtes authentifiées nécessitent le header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Instance Management

### 1. Créer une instance

```http
POST /api/instance/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "qrcode": false
}
```

**Paramètres:**
- `instanceName` (string, requis): Nom personnalisé de l'instance
- `qrcode` (boolean, optionnel): `false` par défaut (ne pas auto-connecter)

**Réponse:**
```json
{
  "success": true,
  "message": "Instance created successfully",
  "data": {
    "instance": {
      "id": "abc123",
      "instanceName": "user_d992fe3f_Support Bot",
      "customName": "Support Bot",
      "status": "close",
      "createdAt": "2026-03-05T02:00:00.000Z"
    },
    "webhook": "https://api.ecomcookpit.site/webhooks/evolution"
  }
}
```

**Notes:**
- Le nom complet de l'instance est `user_{userId8}_{customName}`
- Un webhook est automatiquement configuré pour recevoir les événements
- L'instance est créée mais non connectée (status: `close`)

### 2. Lister les instances

```http
GET /api/instances/instances
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "instances": [
      {
        "id": "abc123",
        "name": "Support Bot",
        "instanceName": "user_d992fe3f_Support Bot",
        "status": "open",
        "profileName": "My Business",
        "profilePictureUrl": "https://...",
        "createdAt": "2026-03-05T02:00:00.000Z",
        "lastUsed": "2026-03-05T03:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

**Status possibles:**
- `open`: Connecté et prêt
- `connecting`: En cours de connexion
- `close`: Déconnecté

### 3. Vérifier le statut d'une instance

```http
GET /api/instance/status/{instanceName}
Authorization: Bearer {token}
```

**Exemple:**
```http
GET /api/instance/status/Support%20Bot
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "rawState": "open",
    "instanceName": "Support Bot",
    "profileName": "My Business",
    "profilePicture": "https://..."
  }
}
```

**Mapping des statuts:**
- `open` → `connected`
- `connecting` → `connecting`
- `close`/`closed` → `disconnected`

### 4. Obtenir le QR Code

```http
GET /api/instance/qrcode/{instanceName}
Authorization: Bearer {token}
```

**Réponse (si non connecté):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "pairingCode": null,
    "count": 1
  }
}
```

**Réponse (si déjà connecté):**
```json
{
  "success": true,
  "data": {
    "qrCode": null,
    "pairingCode": null,
    "count": 0
  }
}
```

**Usage:**
1. Appelez cet endpoint
2. Affichez le QR code à l'utilisateur
3. L'utilisateur scanne avec WhatsApp
4. Le webhook `CONNECTION_UPDATE` notifiera la connexion

### 5. Connexion par numéro de téléphone

```http
POST /api/instance/connect-phone
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "phoneNumber": "+33612345678"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Pairing code generated. Enter it in WhatsApp.",
  "data": {
    "pairingCode": "ABCD-EFGH",
    "instanceName": "Support Bot"
  }
}
```

**Usage:**
1. Appelez cet endpoint avec le numéro
2. Affichez le code de jumelage à l'utilisateur
3. L'utilisateur entre le code dans WhatsApp > Appareils connectés
4. Le webhook `CONNECTION_UPDATE` notifiera la connexion

### 6. Déconnecter une instance

```http
DELETE /api/instance/logout/{instanceName}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Instance logged out successfully"
}
```

### 7. Supprimer une instance

```http
DELETE /api/instances/instances/{instanceId}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Instance deleted successfully"
}
```

**Note:** Supprime l'instance de la base de données ET de l'Evolution API.

---

## Messaging

### 1. Envoyer un message

```http
POST /api/instance/send-message
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "number": "33612345678",
  "message": "Bonjour ! Comment puis-je vous aider ?"
}
```

**Paramètres:**
- `instanceName` (string): Nom personnalisé de l'instance
- `number` (string): Numéro du destinataire (formats acceptés ci-dessous)
- `message` (string): Contenu du message

**Formats de numéros acceptés:**
- `33612345678` (numéro brut)
- `553198296801@s.whatsapp.net` (JID individuel)
- `10526998446088@lid` (Linked Device)
- `group@g.us` (groupe)

**Réponse:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "BAE5FAB9E65A3DA8",
    "remoteJid": "33612345678@s.whatsapp.net",
    "timestamp": "2026-03-05T03:30:00.000Z",
    "status": "PENDING",
    "number": "33612345678",
    "text": "Bonjour ! Comment puis-je vous aider ?"
  }
}
```

**Pré-requis:**
- L'instance doit être connectée (`status: "open"`)
- Sinon, erreur 400 avec code `INSTANCE_NOT_CONNECTED`

### 2. Récupérer les conversations (chats)

```http
GET /api/instance/chats/{instanceName}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "33612345678@s.whatsapp.net",
        "contactId": "33612345678@s.whatsapp.net",
        "contactName": "Jean Dupont",
        "contactAvatar": "https://...",
        "unreadCount": 3,
        "lastActivity": "2026-03-05T03:25:00.000Z",
        "lastMessage": {
          "id": "BAE5FAB9E65A3DA8",
          "content": "Merci pour votre aide !",
          "isFromMe": false,
          "timestamp": "2026-03-05T03:25:00.000Z",
          "status": "delivered"
        },
        "isArchived": false,
        "isPinned": false
      }
    ],
    "total": 1
  }
}
```

**Notes:**
- Retourne toutes les conversations actives
- `contactId` est le JID WhatsApp complet (utilisez-le pour envoyer des messages)
- Si l'instance n'est pas connectée, retourne `[]` au lieu d'une erreur 500

### 3. Récupérer les messages d'une conversation

```http
GET /api/instance/chats/{instanceName}/{remoteJid}/messages?limit=50
Authorization: Bearer {token}
```

**Exemple:**
```http
GET /api/instance/chats/Support%20Bot/33612345678%40s.whatsapp.net/messages?limit=50
```

**Paramètres:**
- `instanceName` (string): Nom de l'instance
- `remoteJid` (string): JID WhatsApp (URL-encoded)
- `limit` (number, optionnel): Nombre de messages (défaut: 50)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "BAE5FAB9E65A3DA8",
        "content": "Bonjour !",
        "isFromMe": false,
        "timestamp": "2026-03-05T03:20:00.000Z",
        "status": "delivered",
        "messageType": "text",
        "remoteJid": "33612345678@s.whatsapp.net"
      },
      {
        "id": "BAE5FAB9E65A3DA9",
        "content": "Comment puis-je vous aider ?",
        "isFromMe": true,
        "timestamp": "2026-03-05T03:21:00.000Z",
        "status": "read",
        "messageType": "text",
        "remoteJid": "33612345678@s.whatsapp.net"
      },
      {
        "id": "BAE5FAB9E65A3DB0",
        "content": "[Image]",
        "isFromMe": false,
        "timestamp": "2026-03-05T03:22:00.000Z",
        "status": "delivered",
        "messageType": "image",
        "remoteJid": "33612345678@s.whatsapp.net"
      }
    ],
    "total": 3
  }
}
```

**Types de messages supportés:**
- `text`: Message texte
- `image`: Image (avec caption optionnelle)
- `video`: Vidéo
- `audio`: Audio/vocal
- `document`: Document/fichier
- `sticker`: Sticker
- `contact`: Contact partagé

---

## Webhooks

### Configuration

Les webhooks sont **automatiquement configurés** lors de la création d'une instance.

**URL du webhook:** `https://api.ecomcookpit.site/webhooks/evolution`

**Aucune authentification requise** (Evolution API doit pouvoir appeler librement).

### Événements surveillés

| Événement | Description |
|-----------|-------------|
| `APPLICATION_STARTUP` | Démarrage de l'application |
| `CONNECTION_UPDATE` | Changement de statut de connexion |
| `QRCODE_UPDATED` | Nouveau QR code généré |
| `MESSAGES_SET` | Synchronisation initiale des messages |
| `MESSAGES_UPSERT` | Nouveaux messages reçus |
| `MESSAGES_UPDATE` | Messages mis à jour |
| `MESSAGES_DELETE` | Messages supprimés |
| `SEND_MESSAGE` | Message envoyé |
| `CHATS_SET` | Synchronisation initiale des chats |
| `CHATS_UPSERT` | Nouveaux chats ou chats mis à jour |
| `CHATS_UPDATE` | Chats modifiés |
| `CHATS_DELETE` | Chats supprimés |
| `CONTACTS_SET` | Synchronisation initiale des contacts |
| `CONTACTS_UPSERT` | Nouveaux contacts |
| `CONTACTS_UPDATE` | Contacts modifiés |
| `PRESENCE_UPDATE` | Changement de statut de présence |
| `CALL` | Événements d'appel |

### Format des webhooks

```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "user_d992fe3f_Support Bot",
  "data": {
    "state": "open",
    "instance": {
      "profileName": "My Business",
      "profilePictureUrl": "https://..."
    }
  }
}
```

### Exemple: Connexion réussie

```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "user_d992fe3f_Support Bot",
  "data": {
    "state": "open",
    "instance": {
      "profileName": "My Business",
      "profilePictureUrl": "https://pps.whatsapp.net/..."
    }
  }
}
```

### Exemple: Nouveau message reçu

```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "user_d992fe3f_Support Bot",
  "data": {
    "messages": [
      {
        "key": {
          "remoteJid": "33612345678@s.whatsapp.net",
          "fromMe": false,
          "id": "BAE5FAB9E65A3DA8"
        },
        "message": {
          "conversation": "Bonjour !"
        },
        "messageTimestamp": "1709605200"
      }
    ]
  }
}
```

### Traitement des webhooks

Le backend traite automatiquement les webhooks et met à jour:
- ✅ Statut de l'instance dans la base de données
- ✅ Nom et photo de profil
- ✅ Timestamp `lastUsed`

**Vous n'avez rien à faire** — le système est event-driven et se met à jour automatiquement.

---

## Error Codes

### Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé (quota dépassé, compte suspendu) |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |

### Codes d'erreur métier

```json
{
  "success": false,
  "message": "Instance is not connected",
  "code": "INSTANCE_NOT_CONNECTED"
}
```

| Code | Description |
|------|-------------|
| `MISSING_AUTH_TOKEN` | Token d'authentification manquant |
| `EMPTY_TOKEN` | Token vide |
| `ACCOUNT_SUSPENDED` | Compte utilisateur suspendu |
| `INSTANCE_NOT_CONNECTED` | Instance non connectée à WhatsApp |
| `QUOTA_EXCEEDED` | Quota d'instances dépassé |

### Exemples d'erreurs

**401 - Non authentifié:**
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid Bearer token",
  "code": "MISSING_AUTH_TOKEN"
}
```

**403 - Quota dépassé:**
```json
{
  "success": false,
  "message": "Instance quota exceeded. You can create up to 1 instances on your current plan.",
  "quota": {
    "current": 1,
    "max": 1
  }
}
```

**404 - Instance non trouvée:**
```json
{
  "success": false,
  "message": "Instance not found"
}
```

**400 - Instance non connectée:**
```json
{
  "success": false,
  "message": "Instance is not connected. Please scan QR code or use phone pairing first.",
  "code": "INSTANCE_NOT_CONNECTED"
}
```

---

## Rate Limits & Quotas

### Plans disponibles

| Plan | Instances max | Messages/jour | Messages/mois | Rate limit |
|------|---------------|---------------|---------------|------------|
| Free | 1 | 100 | 1,000 | 10 req/min |
| Basic | 5 | 1,000 | 10,000 | 30 req/min |
| Pro | 20 | 10,000 | 100,000 | 100 req/min |
| Enterprise | Illimité | Illimité | Illimité | 500 req/min |

### Headers de rate limit

Chaque réponse inclut:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1709605260
```

### Dépassement de quota

```json
{
  "success": false,
  "message": "Daily message quota exceeded",
  "quota": {
    "dailyUsed": 100,
    "dailyLimit": 100,
    "monthlyUsed": 450,
    "monthlyLimit": 1000
  }
}
```

---

## Exemples complets

### Workflow: Créer et connecter une instance

```javascript
// 1. Créer l'instance
const createResponse = await fetch('https://api.ecomcookpit.site/api/instance/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceName: 'Support Bot',
    qrcode: false
  })
});

const { data } = await createResponse.json();
console.log('Instance créée:', data.instance.customName);

// 2. Obtenir le QR code
const qrResponse = await fetch('https://api.ecomcookpit.site/api/instance/qrcode/Support%20Bot', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: qrData } = await qrResponse.json();
if (qrData.qrCode) {
  console.log('Scannez ce QR code:', qrData.qrCode);
}

// 3. Vérifier le statut (polling ou attendre le webhook)
const statusResponse = await fetch('https://api.ecomcookpit.site/api/instance/status/Support%20Bot', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: statusData } = await statusResponse.json();
console.log('Statut:', statusData.status); // "connected" si OK
```

### Workflow: Envoyer un message

```javascript
// 1. Vérifier que l'instance est connectée
const statusResponse = await fetch('https://api.ecomcookpit.site/api/instance/status/Support%20Bot', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: statusData } = await statusResponse.json();

if (statusData.status !== 'connected') {
  throw new Error('Instance non connectée');
}

// 2. Envoyer le message
const sendResponse = await fetch('https://api.ecomcookpit.site/api/instance/send-message', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceName: 'Support Bot',
    number: '33612345678',
    message: 'Bonjour ! Comment puis-je vous aider ?'
  })
});

const { data } = await sendResponse.json();
console.log('Message envoyé:', data.messageId);
```

### Workflow: Récupérer et afficher les conversations

```javascript
// 1. Récupérer les chats
const chatsResponse = await fetch('https://api.ecomcookpit.site/api/instance/chats/Support%20Bot', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const { data: chatsData } = await chatsResponse.json();
console.log(`${chatsData.total} conversations trouvées`);

// 2. Pour chaque chat, récupérer les messages
for (const chat of chatsData.chats) {
  const messagesResponse = await fetch(
    `https://api.ecomcookpit.site/api/instance/chats/Support%20Bot/${encodeURIComponent(chat.contactId)}/messages?limit=50`,
    { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
  );
  
  const { data: messagesData } = await messagesResponse.json();
  console.log(`${chat.contactName}: ${messagesData.total} messages`);
}
```

---

## Support & Contact

- **Email:** support@ecomcookpit.site
- **Documentation:** https://api.ecomcookpit.site/docs
- **Status:** https://status.ecomcookpit.site

---

## Changelog

### v1.0.0 (Mars 2026)
- ✅ Authentification JWT
- ✅ Gestion d'instances multi-tenant
- ✅ Envoi/réception de messages
- ✅ Webhooks temps réel
- ✅ Quotas et rate limiting
- ✅ Support QR code et phone pairing
- ✅ Support de tous les types de messages (texte, média, documents)
- ✅ Support des JID spéciaux (@lid, @g.us)

---

**© 2026 EcomCookpit - WhatsApp SaaS Platform**
