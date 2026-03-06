# 🌐 Configuration DNS pour ZeChat.site

## Problème actuel

Le backend ne répond pas en production car le domaine `api.zechat.site` n'est pas encore configuré.

## Solution : Configuration DNS

### Étape 1 : Obtenir l'URL Railway de votre backend

1. Connectez-vous à [Railway.app](https://railway.app)
2. Ouvrez votre projet backend
3. Dans l'onglet **Settings** → **Domains**, vous verrez quelque chose comme :
   ```
   whatsapp-saas-backend-production.up.railway.app
   ```
4. **Copiez cette URL** - c'est votre URL Railway temporaire

### Étape 2 : Configurer le DNS chez votre registrar

Allez sur le panneau de contrôle DNS de votre domaine `zechat.site` et ajoutez :

#### Option A : CNAME (Recommandé)
```
Type: CNAME
Nom: api
Valeur: whatsapp-saas-backend-production.up.railway.app
TTL: 300 (ou Auto)
```

#### Option B : Si CNAME n'est pas disponible, utilisez A Record
1. D'abord, trouvez l'IP de Railway :
   ```bash
   nslookup whatsapp-saas-backend-production.up.railway.app
   ```
2. Ajoutez un enregistrement A :
   ```
   Type: A
   Nom: api
   Valeur: [L'IP obtenue]
   TTL: 300
   ```

### Étape 3 : Ajouter le domaine personnalisé sur Railway

1. Retournez sur Railway.app
2. Dans **Settings** → **Domains**
3. Cliquez sur **+ Add Custom Domain**
4. Entrez : `api.zechat.site`
5. Railway vérifiera automatiquement le DNS et générera un certificat SSL

⏳ **Propagation DNS** : Peut prendre 5 minutes à 48 heures (généralement ~30 minutes)

### Étape 4 : Mettre à jour les variables d'environnement Railway

Une fois le domaine configuré, allez dans **Variables** et ajoutez/modifiez :

```env
BACKEND_PUBLIC_URL=https://api.zechat.site
FRONTEND_URL=https://zechat.site
```

### Étape 5 : Redéployer

Railway redéploiera automatiquement après la modification des variables.

## Vérification

Testez avec :
```bash
curl https://api.zechat.site/api/health
```

Si cela fonctionne, vous devriez voir :
```json
{
  "status": "ok",
  "timestamp": "2026-03-06T22:15:00.000Z"
}
```

## ⚠️ En attendant la configuration DNS

Si vous voulez tester immédiatement sans attendre le DNS :

### Dans `frontend/.env.local` :
```env
NEXT_PUBLIC_API_URL=https://whatsapp-saas-backend-production.up.railway.app
```

Puis redémarrez votre frontend local :
```bash
cd frontend
npm run dev
```

## Problèmes courants

### "ERR_NAME_NOT_RESOLVED"
→ Le DNS n'est pas encore propagé. Attendez ou utilisez l'URL Railway temporaire.

### "SSL Certificate Error"
→ Railway n'a pas encore généré le certificat. Attendez 5-10 minutes après l'ajout du domaine.

### "502 Bad Gateway"
→ Le backend n'est pas déployé ou a crashé. Vérifiez les logs Railway.
