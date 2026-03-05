# 🔧 Résolution des erreurs 404 - Rapport technique

## 📊 Problèmes identifiés et corrigés

### 1. ❌ Routes API avec doublon `/instances/instances/`

**Symptôme**: 
```
GET https://api.ecomcookpit.site/api/instances/instances/52763ea4-... 404 (Not Found)
```

**Cause**: Le frontend appelait `/api/instances/instances/:id` alors que le backend expose `/api/instances/:id`

**Correction**: `frontend/lib/api.ts`
```typescript
// ❌ AVANT
getAll: () => api.get("/api/instances/instances")
delete: (id: string) => api.delete(`/api/instances/instances/${id}`)

// ✅ APRÈS
getAll: () => api.get("/api/instances")
delete: (id: string) => api.delete(`/api/instances/${id}`)
```

---

### 2. ❌ Favicon manquant

**Symptôme**: 
```
/favicon.ico:1 Failed to load resource: 404
```

**Correction**: Fichier placeholder créé dans `frontend/app/favicon.ico`
- À remplacer par une vraie icône .ico (utiliser favicon.io ou similaire)

---

### 3. ❌ Appels API avec ID invalides

**Symptôme**: 
```
GET /api/instance/status/ssssss 404
GET /api/instance/qrcode/ssssss 404
```

**Cause**: 
- Anciennes instances en base ont "ssssss" comme `instanceName` (format obsolète)
- Backend production pas encore redéployé avec les corrections des routes

**Corrections appliquées**:

#### A. Validation des ID avant appels API (`frontend/lib/api.ts`)
```typescript
getStatus: (instanceName: string) => {
  if (!instanceName?.trim()) {
    return Promise.reject(new Error('Instance name is required'));
  }
  return api.get(`/api/instance/status/${encodeURIComponent(instanceName)}`);
}
```

#### B. Validation dans le hook (`frontend/hooks/useInstanceStatus.ts`)
```typescript
if (!enabled || !mountedRef.current || !instanceName || instanceName.trim().length === 0) {
  if (!isBackground && !instanceName) {
    setState(prev => ({ ...prev, isLoading: false, error: 'Invalid instance ID' }));
  }
  return;
}
```

---

### 4. ✅ Séparation ID réel vs ID affiché

**Problème**: Risque de confusion entre l'ID utilisé pour les API et l'ID affiché à l'utilisateur

**Solution**: Nouvelles fonctions utilitaires (`frontend/lib/utils.ts`)

```typescript
/**
 * Valider un ID avant appel API
 */
export function isValidInstanceId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return id.trim().length > 0;
}

/**
 * Formater l'ID pour l'affichage UI uniquement
 * N'affecte PAS les appels API
 */
export function formatInstanceIdForDisplay(id: string): string {
  if (!id) return 'N/A';
  
  // 5-digit number → #12345
  if (/^\d{5}$/.test(id)) return `#${id}`;
  
  // UUID → #52763ea4
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return `#${id.substring(0, 8)}`;
  }
  
  // Autres formats → extraire chiffres ou tronquer
  const digits = id.replace(/\D/g, '');
  return digits.length > 0 ? `#${digits.slice(0, 6)}` : id.substring(0, 8);
}
```

**Utilisation dans l'UI** (`frontend/components/InstanceCard.tsx`):
```typescript
// ✅ Affichage formaté dans l'UI
<p className="text-[11px] text-[#4a6a4a] mt-0.5 font-mono truncate">
  ID: {formatInstanceIdForDisplay(instance.instanceName || instance.id)}
</p>

// ✅ ID réel utilisé pour les appels API
const { status } = useInstanceStatus({
  instanceName: instance.instanceName, // ID réel non modifié
  enabled: true,
});
```

---

## 🎯 Architecture des routes

### Backend (`backend/src/index.ts`)
```typescript
app.use('/api/instances', authMiddleware, instanceManagementRoutes)
// Expose: /api/instances, /api/instances/:id, /api/instances/create-instance

app.use('/api/instance', authMiddleware, instanceRoutes)
// Expose: /api/instance/status/:name, /api/instance/qrcode/:name
```

### Frontend (`frontend/lib/api.ts`)
```typescript
// Pour les opérations CRUD par UUID
export const instancesApi = {
  getAll: () => api.get("/api/instances"),
  delete: (id: string) => api.delete(`/api/instances/${id}`),
  // ...
}

// Pour les opérations par instanceName (5-digit ID ou custom)
export const instanceApi = {
  getStatus: (instanceName: string) => api.get(`/api/instance/status/${instanceName}`),
  getQRCode: (instanceName: string) => api.get(`/api/instance/qrcode/${instanceName}`),
  // ...
}
```

---

## 🚀 Actions requises pour déploiement

### 1. Commit et push (✅ Déjà fait)
```bash
git add .
git commit -m "fix: resolve 404 errors - fix routes, add validation, format IDs"
git push
```

### 2. Redéployer le backend (⚠️ CRITIQUE)
```bash
# SSH vers le serveur
ssh user@api.ecomcookpit.site

# Backend
cd /path/to/whatsapp-saas/backend
git pull origin main
npm ci
npm run build
pm2 restart whatsapp-backend  # ou systemctl restart / docker-compose restart
pm2 logs whatsapp-backend --lines 30
```

### 3. Redéployer le frontend
```bash
cd /path/to/whatsapp-saas/frontend
git pull origin main
npm ci
npm run build
pm2 restart whatsapp-frontend
```

### 4. Vider le cache navigateur
- **Ctrl + Shift + R** (Windows/Linux)
- **Cmd + Shift + R** (Mac)
- Ou DevTools → Network → ☑️ Disable cache

---

## ✅ Tests de vérification

### Test 1: Health check
```bash
curl https://api.ecomcookpit.site/health
# Attendu: {"status":"ok"}
```

### Test 2: Liste des instances (avec JWT)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.ecomcookpit.site/api/instances
# Attendu: 200 OK avec liste d'instances
```

### Test 3: Status d'une instance
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.ecomcookpit.site/api/instance/status/12345
# Attendu: 200 OK (si instance existe) ou 404 (si n'existe pas, mais route existe)
```

### Test 4: Console navigateur
Après redéploiement + hard refresh, vérifier:
- ✅ Aucune erreur 404 pour `/api/instances/instances/`
- ✅ Aucune erreur 404 pour `/favicon.ico`
- ✅ Erreurs 404 pour status/qrcode uniquement si instance n'existe pas en base

---

## 📝 Bonnes pratiques implémentées

### ✅ Validation avant appels API
```typescript
// Toujours valider l'ID avant d'appeler l'API
if (!instanceName?.trim()) {
  return Promise.reject(new Error('Instance name is required'));
}
```

### ✅ Séparation affichage / logique
```typescript
// ❌ MAUVAIS - Modifier l'ID pour l'affichage ET l'utiliser pour l'API
const displayId = instance.id.replace(/\D/g, '').slice(0, 6);
await api.get(`/status/${displayId}`); // ❌ ID modifié!

// ✅ BON - Garder l'ID réel pour l'API, formater uniquement pour l'UI
const displayId = formatInstanceIdForDisplay(instance.id); // Pour l'UI
await api.get(`/status/${instance.id}`); // ✅ ID réel!
```

### ✅ Gestion d'erreur robuste
```typescript
try {
  const res = await instanceApi.getStatus(instanceName);
  // ...
} catch (error) {
  if (error.response?.status === 404) {
    console.error("Instance not found:", instanceName);
  } else if (error.response?.status === 401) {
    console.error("Unauthorized - token expired");
  }
  // Ne pas bloquer l'UI, afficher un état d'erreur
}
```

### ✅ Polling intelligent avec validation
```typescript
// Le hook useInstanceStatus valide automatiquement
// et ne fait pas d'appels inutiles si l'ID est invalide
const { status, error } = useInstanceStatus({
  instanceName: instance.instanceName,
  enabled: !!instance.instanceName, // Désactiver si pas d'ID
});
```

---

## 🔄 Migration des anciennes instances

Les instances avec `instanceName = "ssssss"` ou autres formats obsolètes continueront de fonctionner car:

1. Le backend cherche directement par `instanceName` (pas de reconstruction)
2. Les nouvelles instances utilisent le format 5-digit (ex: "12345")
3. Les anciennes instances gardent leur `instanceName` actuel jusqu'à suppression

**Option de migration** (si nécessaire):
```sql
-- Générer de nouveaux instanceName pour les anciennes instances
UPDATE Instance 
SET instanceName = LPAD(FLOOR(10000 + RAND() * 90000), 5, '0')
WHERE instanceName NOT REGEXP '^[0-9]{5}$'
AND instanceName NOT REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}';
```

---

## 📊 Résumé des fichiers modifiés

| Fichier | Modification | Statut |
|---------|-------------|--------|
| `frontend/lib/api.ts` | Correction routes `/instances/instances/` → `/instances/` | ✅ |
| `frontend/lib/api.ts` | Ajout validation ID dans instanceApi | ✅ |
| `frontend/lib/utils.ts` | Ajout `isValidInstanceId()` et `formatInstanceIdForDisplay()` | ✅ |
| `frontend/hooks/useInstanceStatus.ts` | Ajout validation ID avant fetch | ✅ |
| `frontend/components/InstanceCard.tsx` | Utilisation `formatInstanceIdForDisplay()` pour l'UI | ✅ |
| `frontend/app/favicon.ico` | Création fichier placeholder | ✅ |
| `backend/src/routes/instances.ts` | Correction routes status/qrcode (session précédente) | ✅ |

---

## 🎯 Résultat attendu après déploiement

### Console navigateur
```
✅ Aucune erreur 404 pour /favicon.ico
✅ Aucune erreur 404 pour /api/instances/instances/
✅ Appels API utilisent toujours l'ID réel (instance.instanceName)
✅ UI affiche un ID formaté propre (#12345, #52763ea4, etc.)
✅ Validation empêche les appels avec ID vide/invalide
```

### Interface utilisateur
```
Instance Card:
┌─────────────────────────────────┐
│ 🟢 Production Bot               │
│ ID: #12345                      │  ← ID formaté pour l'affichage
│ 📱 Acme Support                 │
└─────────────────────────────────┘

API Call (invisible pour l'utilisateur):
GET /api/instance/status/12345  ← ID réel utilisé
```

---

## 🆘 Dépannage

### Si les 404 persistent après redéploiement

1. **Vérifier que le backend a bien été rebuild**:
   ```bash
   ssh user@server
   cd /path/to/backend
   ls -la dist/routes/instances.js  # Vérifier date de modification
   ```

2. **Vérifier les logs backend**:
   ```bash
   pm2 logs whatsapp-backend --lines 100
   # Chercher: "[STATUS] Route hit - instanceName: ..."
   ```

3. **Vérifier la base de données**:
   ```sql
   SELECT instanceName, customName FROM Instance LIMIT 5;
   -- Vérifier le format des instanceName
   ```

4. **Tester directement l'API**:
   ```bash
   # Remplacer YOUR_TOKEN et INSTANCE_NAME
   curl -v -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.ecomcookpit.site/api/instance/status/INSTANCE_NAME
   ```

5. **Vérifier le cache CDN** (si applicable):
   - Purger le cache Cloudflare/Nginx
   - Attendre 5-10 minutes pour propagation DNS

---

**Date de correction**: 5 mars 2026  
**Version**: 1.0  
**Statut**: ✅ Code corrigé localement, ⚠️ En attente de déploiement production
