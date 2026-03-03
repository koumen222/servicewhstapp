# Instructions de Migration pour le SaaS Multi-Tenant

## Étapes à suivre quand la base de données sera accessible :

1. **Appliquer le nouveau schéma Prisma :**
```bash
cd backend
npx prisma db push
```

2. **Ou créer une migration propre :**
```bash
npx prisma migrate dev --name "add-multi-tenant-support"
```

3. **Générer le client Prisma :**
```bash
npx prisma generate
```

4. **Initialiser les configurations système :**
```sql
INSERT INTO "SystemConfig" ("id", "key", "value", "description") VALUES
(gen_random_uuid(), 'max_instances_free', '1', 'Nombre max d\'instances pour le plan gratuit'),
(gen_random_uuid(), 'max_instances_starter', '3', 'Nombre max d\'instances pour le plan starter'),
(gen_random_uuid(), 'max_instances_pro', '10', 'Nombre max d\'instances pour le plan pro'),
(gen_random_uuid(), 'max_instances_enterprise', '50', 'Nombre max d\'instances pour le plan enterprise'),
(gen_random_uuid(), 'daily_messages_free', '100', 'Quota quotidien de messages pour le plan gratuit'),
(gen_random_uuid(), 'daily_messages_starter', '1000', 'Quota quotidien de messages pour le plan starter'),
(gen_random_uuid(), 'daily_messages_pro', '10000', 'Quota quotidien de messages pour le plan pro'),
(gen_random_uuid(), 'daily_messages_enterprise', '100000', 'Quota quotidien de messages pour le plan enterprise'),
(gen_random_uuid(), 'api_key_salt', 'CHANGE_THIS_SALT_IN_PRODUCTION', 'Salt pour le hashage des clés API');
```

5. **Variables d'environnement à ajouter :**
```env
# Ajoutez ces variables à votre .env
API_KEY_SALT=your-super-secret-salt-here-change-me
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_MASTER_API_KEY=your-evolution-master-api-key
```

## Structure des nouvelles tables créées :

- **ApiKey** : Stockage sécurisé des clés API enfants avec hash SHA-256
- **QuotaUsage** : Gestion des quotas par instance et type de quota
- **MessageLog** : Audit et logging de tous les messages envoyés
- **SystemConfig** : Configuration système centralisée

## Sécurité multi-tenant :

- Isolation complète des données par utilisateur/instance
- Clés API avec préfixe `ak_live_` pour identification
- Hash sécurisé avec salt des clés API (jamais stockées en clair)
- Système de permissions granulaires
- Quotas par instance et plan utilisateur
