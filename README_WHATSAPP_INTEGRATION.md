# Intégration WhatsApp (NAND/NK)

Ce document explique comment intégrer l'envoi de messages WhatsApp dans d'autres services (comme NK) en utilisant l'infrastructure Evolution API déjà configurée.

## 🚀 Utilisation via API HTTP (Externe)

Pour envoyer un message depuis une application externe, utilisez l'endpoint simplifié. Cet endpoint détecte automatiquement l'instance connectée de l'utilisateur.

**Endpoint :** `POST /api/whatsapp/send`
**Authentification :** `Authorization: Bearer <JWT_TOKEN>`

### Requête (JSON)
```json
{
  "number": "226XXXXXXXX", 
  "message": "Votre message ici"
}
```
*Note : Le numéro peut être un JID individuel (@s.whatsapp.net) ou un JID de groupe (@g.us).*

### Réponse (Succès)
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "messageId": "ABC123...",
    "instanceUsed": "sefedwcdvefw",
    "to": "226XXXXXXXX"
  }
}
```

---

## 🛠️ Utilisation via Service (Interne au Backend)

Si vous travaillez directement dans le code du backend, utilisez la classe `WhatsAppService`.

### Importation
```typescript
import { WhatsAppService } from '../services/whatsAppService.js';
```

### Appel simple
```typescript
const result = await WhatsAppService.send(userId, number, message);
```

### Fonctionnement Automatique
La fonction `send()` effectue les étapes suivantes pour vous :
1. **Recherche :** Trouve l'instance WhatsApp active (`status: 'open'`) appartenant à l'utilisateur (`userId`).
2. **Configuration :** Récupère le nom de l'instance et le token d'accès.
3. **Transmission :** Envoie la requête à Evolution API avec les bonnes entêtes de sécurité.
4. **Retour :** Fournit le `messageId` généré par WhatsApp.

## ⚡ Utilisation Directe (Pour applications tierces)

Si vous avez déjà le **nom de l'instance** et son **token Evolution**, vous pouvez envoyer un message directement sans passer par l'authentification JWT de cette plateforme.

**Endpoint :** `POST /api/v1/external/whatsapp/send-direct`
**Authentification :** Aucune (Sécurité gérée par `instanceToken` dans le body)

### Requête (JSON)
```json
{
  "instanceName": "votre_nom_instance",
  "instanceToken": "votre_token_evolution",
  "number": "226XXXXXXXX",
  "message": "Message envoyé directement !"
}
```

### Pourquoi utiliser cet endpoint ?
- **Plug & Play :** Idéal pour intégrer WhatsApp dans NK ou d'autres outils en 1 minute.
- **Indépendant :** Pas besoin de gérer des tokens de session JWT complexes.
- **Direct :** Utilise les identifiants que l'utilisateur possède déjà.

---

## ⚠️ Pré-requis
Pour que l'envoi fonctionne, l'utilisateur doit :
1. Avoir créé une instance dans son tableau de bord.
2. Avoir scanné le QR Code (statut doit être **Connecté**).

Si aucune instance n'est connectée, le service renverra une erreur :
`"Aucune instance WhatsApp connectée trouvée pour cet utilisateur."`
