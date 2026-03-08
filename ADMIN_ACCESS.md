# Accès Super Admin

## Identifiants de connexion

- **URL**: `/admin` (ex: http://localhost:3000/admin)
- **Email**: `admin@whatsapp-saas.com`
- **Mot de passe**: `Admin@2024!`
- **Rôle**: `super_admin`

## Fonctionnalités du Dashboard Admin

### 1. Tableau de bord
- Statistiques globales (utilisateurs, instances)
- Graphiques de répartition par plan
- Graphiques de statut des instances
- Taux d'activité

### 2. Gestion des utilisateurs
- Liste complète des utilisateurs
- Activation/Désactivation des comptes
- Modification des plans (à venir)
- Détails par utilisateur

### 3. Gestion des instances
- Liste de toutes les instances WhatsApp
- Suppression d'instances
- Filtrage par statut
- Informations détaillées

## API Endpoints Admin

Toutes les routes admin sont préfixées par `/api/admin`:

- `POST /api/admin/login` - Connexion admin
- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/users/:userId` - Détails d'un utilisateur
- `PUT /api/admin/users/:userId/plan` - Modifier le plan
- `PUT /api/admin/users/:userId/toggle` - Activer/Désactiver
- `GET /api/admin/instances` - Liste des instances
- `DELETE /api/admin/instances/:instanceId` - Supprimer une instance

## Authentification

Le système admin utilise un token JWT séparé stocké dans `localStorage`:
- Token: `adminToken`
- Info admin: `adminInfo`

## Sécurité

⚠️ **IMPORTANT**: Changez le mot de passe après la première connexion!

Le mot de passe par défaut est connu et doit être modifié pour des raisons de sécurité.
