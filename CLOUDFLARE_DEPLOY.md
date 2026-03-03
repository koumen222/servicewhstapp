# 🚀 Déploiement Frontend sur Cloudflare Pages

## Étapes de déploiement

### 1. Préparation
Assurez-vous que le backend Railway est déployé et notez son URL.

### 2. Configuration de l'environnement
Mettez à jour `.env` avec l'URL de votre backend Railway :
```env
VITE_BACKEND_URL=https://votre-backend.railway.app
```

### 3. Déploiement sur Cloudflare Pages

#### Option A : Via GitHub (recommandé)
1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pages > Create a project > Connect to Git
3. Sélectionnez votre repo `servicewhstapp`
4. Configuration :
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
   - **Root directory** : `/` (racine)

#### Option B : Upload direct
1. Build local : `npm run build`
2. Upload le dossier `dist` sur Cloudflare Pages

### 4. Variables d'environnement sur Cloudflare
Dans Settings > Environment variables :
```env
VITE_BACKEND_URL=https://votre-backend.railway.app
```

### 5. Configuration des redirects
Les fichiers `_redirects` et `_headers` sont déjà configurés pour :
- Rediriger les appels API vers le backend Railway
- Sécuriser les headers HTTP
- Gérer le routing SPA

### 6. Domaine personnalisé (optionnel)
1. Dans Pages > Custom domains
2. Ajoutez votre domaine
3. Configurez les DNS comme indiqué

## ✅ Vérification après déploiement

1. **Test de l'API** :
   ```bash
   curl https://votre-domaine.pages.dev/api/auth/login
   ```

2. **Test complet** :
   - Créez un compte
   - Créez une instance
   - Scannez le QR code

## 🔧 Dépannage

### Erreur CORS ?
Vérifiez que `FRONTEND_URL` dans Railway contient votre domaine Cloudflare.

### Erreur 502 ?
Le backend Railway n'est pas accessible. Vérifiez les logs Railway.

### Erreur 404 ?
Les routes API ne sont pas redirigées. Vérifiez le fichier `_redirects`.

## 🌍 Avantages Cloudflare Pages

- **CDN mondial** : performance optimale
- **HTTPS gratuit** : SSL automatique
- **Build automatique** : à chaque push Git
- **Zero cold start** : instantané
- **100% gratuit** : pour la plupart des usages
