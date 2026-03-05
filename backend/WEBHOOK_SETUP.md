# Configuration des Webhooks Evolution API

## Vue d'ensemble

Le système utilise maintenant des **webhooks** au lieu du polling frontend pour les mises à jour de statut. Cela réduit drastiquement la charge sur le backend et améliore les performances.

## Architecture

```
Evolution API → Webhook → Backend → DB Update
                                  ↓
                            Frontend (polling réduit à 60s)
```

## Configuration automatique

Lors de la création d'une instance, le backend configure automatiquement le webhook :

```typescript
// URL du webhook
const webhookUrl = `${BACKEND_PUBLIC_URL}/webhooks/evolution`

// Événements surveillés
- CONNECTION_UPDATE  → Changements de statut (open, close, connecting)
- QRCODE_UPDATED     → Nouveau QR code généré
- MESSAGES_UPSERT    → Nouveaux messages reçus
- MESSAGES_UPDATE    → Messages mis à jour
- SEND_MESSAGE       → Messages envoyés
```

## Endpoint webhook

**URL:** `POST /webhooks/evolution`

**Pas d'authentification requise** (Evolution API doit pouvoir appeler librement)

**Format attendu:**
```json
{
  "event": "connection.update",
  "instance": "user_xxxxx_instanceName",
  "data": {
    "state": "open",
    "profileName": "John Doe",
    "profilePictureUrl": "https://..."
  }
}
```

## Événements traités

### 1. CONNECTION_UPDATE
Met à jour le statut de l'instance en DB :
- `open` → instance connectée
- `connecting` → connexion en cours
- `close` → déconnectée

### 2. QRCODE_UPDATED
Notifie qu'un nouveau QR code est disponible (pour implémentation future SSE)

### 3. MESSAGES_UPSERT
Met à jour `lastUsed` de l'instance

## Configuration manuelle (si nécessaire)

Si le webhook n'est pas configuré automatiquement, utilisez l'API Evolution :

```bash
curl -X POST "https://evolution-api-url/webhook/set/INSTANCE_NAME" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://api.ecomcookpit.site/webhooks/evolution",
    "webhookByEvents": true,
    "webhookBase64": false,
    "events": [
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "SEND_MESSAGE"
    ]
  }'
```

## Variables d'environnement requises

```env
BACKEND_PUBLIC_URL=https://api.ecomcookpit.site
```

Cette URL doit être accessible publiquement par Evolution API.

## Polling frontend (fallback)

Le polling frontend a été réduit drastiquement :
- **Avant:** 5-8 secondes
- **Maintenant:** 60 secondes (1 minute)
- **Quand connecté:** 120 secondes (2 minutes)

Le polling sert uniquement de **fallback** au cas où les webhooks échouent.

## Logs

Les webhooks génèrent des logs détaillés :

```
[WEBHOOK] Received Evolution API event: { event: 'connection.update', instance: '...', data: {...} }
[WEBHOOK] Connection update for instance xxx: open
[WEBHOOK] Instance xxx status updated to: open
```

## Sécurité

- Le endpoint webhook n'a **pas d'authentification JWT** (Evolution API doit pouvoir appeler)
- Validation de l'instance dans la DB avant traitement
- Logs de sécurité pour détecter les appels suspects
- Rate limiting global appliqué

## Prochaines étapes (optionnel)

1. **Server-Sent Events (SSE)** : Permettre au frontend de s'abonner aux mises à jour en temps réel
2. **Signature webhook** : Valider que les webhooks viennent bien d'Evolution API
3. **Queue système** : Utiliser Redis/Bull pour traiter les webhooks de manière asynchrone
