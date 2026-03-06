# WhatsApp Instance Service - Architecture Logicielle

## 📋 Vue d'ensemble

Le **WhatsApp Instance Service** est le service central du système SaaS. Il gère des instances WhatsApp isolées par utilisateur et expose une API permettant l'interaction machine-to-machine via des tokens d'authentification.

---

## 🏗️ Architecture Globale

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Instance Service                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Couche API   │  │ Couche       │  │ Couche       │      │
│  │ Publique     │  │ Métier       │  │ Données      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                                          │
         │                                          │
    ┌────▼────┐                              ┌─────▼──────┐
    │ Clients │                              │ Base de    │
    │ Externes│                              │ Données    │
    └─────────┘                              └────────────┘
```

### Couches du Service

#### 1. **Couche API Publique**
- Point d'entrée unique pour toutes les requêtes
- Gestion des authentifications multiples
- Validation des requêtes entrantes
- Formatage des réponses

#### 2. **Couche Métier**
- Logique de gestion des instances
- Génération et validation des tokens
- Orchestration des actions WhatsApp
- Règles de sécurité et autorisations

#### 3. **Couche Données**
- Persistance des utilisateurs et instances
- Gestion des états
- Requêtes et transactions

---

## 🗄️ Modèle de Données

### Entité : Utilisateur

```
Utilisateur
├── id_utilisateur          (identifiant unique interne)
├── email                   (adresse email)
├── mot_de_passe_hash       (hash du mot de passe)
├── date_creation           (timestamp)
├── date_derniere_connexion (timestamp)
└── statut_compte           (actif / suspendu / supprimé)
```

**Relations :**
- Un utilisateur possède zéro ou plusieurs instances

---

### Entité : Instance

```
Instance
├── id_instance_interne     (identifiant unique système)
├── id_instance_public      (identifiant visible publiquement)
├── id_proprietaire         (référence → Utilisateur)
├── token_instance          (chaîne aléatoire unique)
├── numero_whatsapp         (numéro connecté, optionnel)
├── statut                  (active / inactive / en_attente / erreur)
├── date_creation           (timestamp)
├── date_derniere_activite  (timestamp)
└── metadata                (données additionnelles flexibles)
```

**Caractéristiques du Token :**
- Longueur : 32-64 caractères
- Format : alphanumerique (a-z, A-Z, 0-9)
- Exemple : `k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8`
- Stockage : texte brut (pas de chiffrement)
- Unicité : garantie par le système

**Relations :**
- Une instance appartient à un seul utilisateur
- Une instance possède un seul token unique

---

### Entité : Journal d'Activité (optionnel)

```
JournalActivite
├── id_journal              (identifiant unique)
├── id_instance             (référence → Instance)
├── type_action             (envoi_message / verification_statut / etc.)
├── timestamp               (date et heure)
├── resultat                (succes / echec)
└── details                 (informations complémentaires)
```

**Utilité :**
- Traçabilité des actions
- Débogage
- Métriques d'usage
- Audit de sécurité

---

## 🔐 Système d'Authentification

### Deux Modes d'Authentification

#### Mode 1 : Authentification Utilisateur
**Contexte :** Utilisateur humain accédant au dashboard

**Flux :**
```
1. Utilisateur envoie email + mot de passe
2. Service vérifie les credentials
3. Service génère session utilisateur
4. Service retourne jeton de session
5. Utilisateur utilise ce jeton pour accès dashboard
```

**Portée :**
- Gestion des instances
- Visualisation des tokens
- Configuration du compte

---

#### Mode 2 : Authentification par Token d'Instance
**Contexte :** Service externe appelant l'API

**Flux :**
```
1. Service externe envoie requête avec token dans header
2. Service extrait token du header
3. Service recherche instance correspondante
4. Service vérifie validité (instance active)
5. Si valide → action autorisée
6. Si invalide → erreur 401 Unauthorized
```

**Format Header :**
```
Authorization: Instance-Token k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8
```

**Portée :**
- Actions WhatsApp (envoi message, etc.)
- Consultation statut instance
- Opérations machine-to-machine

---

## 📡 API - Endpoints

### Groupe : Gestion Utilisateur

#### `POST /auth/register`
**Description :** Créer un nouveau compte utilisateur

**Requête :**
```
{
  "email": "utilisateur@example.com",
  "mot_de_passe": "motdepasse123"
}
```

**Réponse :**
```
{
  "id_utilisateur": "usr_abc123",
  "email": "utilisateur@example.com",
  "message": "Compte créé avec succès"
}
```

---

#### `POST /auth/login`
**Description :** Authentifier un utilisateur

**Requête :**
```
{
  "email": "utilisateur@example.com",
  "mot_de_passe": "motdepasse123"
}
```

**Réponse :**
```
{
  "jeton_session": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2026-03-07T10:55:00Z"
}
```

---

### Groupe : Gestion des Instances

#### `POST /instances`
**Description :** Créer une nouvelle instance WhatsApp

**Authentification :** Jeton utilisateur requis

**Requête :**
```
{
  "nom_instance": "Instance Marketing" (optionnel)
}
```

**Réponse :**
```
{
  "id_instance": "inst_xyz789",
  "token_instance": "k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8",
  "statut": "en_attente",
  "date_creation": "2026-03-06T10:55:00Z",
  "message": "Instance créée. Conservez ce token en lieu sûr."
}
```

**⚠️ Important :** Le token est retourné une seule fois à la création, mais reste consultable via l'endpoint dédié.

---

#### `GET /instances`
**Description :** Lister toutes les instances de l'utilisateur

**Authentification :** Jeton utilisateur requis

**Réponse :**
```
{
  "instances": [
    {
      "id_instance": "inst_xyz789",
      "nom_instance": "Instance Marketing",
      "statut": "active",
      "numero_whatsapp": "+33612345678",
      "date_creation": "2026-03-06T10:55:00Z"
    },
    {
      "id_instance": "inst_abc456",
      "nom_instance": "Instance Support",
      "statut": "inactive",
      "numero_whatsapp": null,
      "date_creation": "2026-03-05T14:30:00Z"
    }
  ]
}
```

---

#### `GET /instances/{id_instance}`
**Description :** Obtenir les détails d'une instance spécifique

**Authentification :** Jeton utilisateur requis

**Réponse :**
```
{
  "id_instance": "inst_xyz789",
  "nom_instance": "Instance Marketing",
  "token_instance": "k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8",
  "statut": "active",
  "numero_whatsapp": "+33612345678",
  "date_creation": "2026-03-06T10:55:00Z",
  "date_derniere_activite": "2026-03-06T11:30:00Z"
}
```

**⚠️ Important :** Le token est visible ici pour permettre à l'utilisateur de le récupérer à tout moment.

---

#### `DELETE /instances/{id_instance}`
**Description :** Supprimer une instance

**Authentification :** Jeton utilisateur requis

**Réponse :**
```
{
  "message": "Instance supprimée avec succès"
}
```

---

### Groupe : Actions WhatsApp (API Externe)

#### `POST /api/v1/send-message`
**Description :** Envoyer un message WhatsApp

**Authentification :** Token d'instance requis (header)

**Header :**
```
Authorization: Instance-Token k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8
```

**Requête :**
```
{
  "destinataire": "+33612345678",
  "message": "Bonjour, ceci est un message automatique."
}
```

**Réponse :**
```
{
  "statut": "envoye",
  "id_message": "msg_def456",
  "timestamp": "2026-03-06T11:45:00Z"
}
```

**Erreurs possibles :**
- 401 : Token invalide ou instance inactive
- 400 : Paramètres manquants ou invalides
- 500 : Erreur lors de l'envoi

---

#### `GET /api/v1/instance-status`
**Description :** Vérifier le statut de l'instance

**Authentification :** Token d'instance requis (header)

**Réponse :**
```
{
  "id_instance": "inst_xyz789",
  "statut": "active",
  "numero_whatsapp": "+33612345678",
  "connecte": true
}
```

---

## 🔁 Flux Métier Détaillés

### Flux 1 : Création d'Instance

```
┌──────────┐                ┌─────────────┐              ┌──────────┐
│Utilisateur│                │   Service   │              │    BD    │
└─────┬────┘                └──────┬──────┘              └────┬─────┘
      │                            │                          │
      │ 1. POST /instances         │                          │
      │ ──────────────────────────>│                          │
      │                            │                          │
      │                            │ 2. Vérifier auth         │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 3. Générer id_instance   │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 4. Générer token unique  │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 5. Vérifier unicité token│
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 6. Créer instance en BD  │
      │                            │ ────────────────────────>│
      │                            │                          │
      │ 7. Retourner instance      │                          │
      │    + token                 │                          │
      │ <──────────────────────────│                          │
      │                            │                          │
```

**Étapes détaillées :**

1. **Réception requête** : Utilisateur demande création d'instance
2. **Vérification authentification** : Service valide le jeton utilisateur
3. **Génération ID instance** : Création d'un identifiant unique (ex: UUID)
4. **Génération token** : Création d'une chaîne aléatoire de 32-64 caractères
5. **Vérification unicité** : Contrôle que le token n'existe pas déjà
6. **Persistance** : Enregistrement de l'instance avec statut "en_attente"
7. **Réponse** : Retour de l'instance complète avec le token visible

**Règles métier :**
- Un utilisateur peut créer un nombre illimité d'instances (ou limité par plan)
- Le token doit être unique dans tout le système
- En cas de collision de token, régénérer automatiquement
- L'instance démarre en statut "en_attente" jusqu'à connexion WhatsApp

---

### Flux 2 : Consultation du Token

```
┌──────────┐                ┌─────────────┐              ┌──────────┐
│Utilisateur│                │   Service   │              │    BD    │
└─────┬────┘                └──────┬──────┘              └────┬─────┘
      │                            │                          │
      │ 1. GET /instances/{id}     │                          │
      │ ──────────────────────────>│                          │
      │                            │                          │
      │                            │ 2. Vérifier auth         │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 3. Vérifier propriété    │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 4. Récupérer instance    │
      │                            │    avec token            │
      │                            │ ────────────────────────>│
      │                            │                          │
      │ 5. Retourner instance      │                          │
      │    avec token visible      │                          │
      │ <──────────────────────────│                          │
      │                            │                          │
```

**Règles métier :**
- Seul le propriétaire peut voir le token de son instance
- Le token est toujours retourné en clair
- Aucune limite de consultation

---

### Flux 3 : Appel API Externe (Envoi Message)

```
┌──────────┐                ┌─────────────┐              ┌──────────┐
│  Service │                │   Service   │              │    BD    │
│  Externe │                │  WhatsApp   │              │          │
└─────┬────┘                └──────┬──────┘              └────┬─────┘
      │                            │                          │
      │ 1. POST /api/v1/send-msg   │                          │
      │    Header: Instance-Token  │                          │
      │ ──────────────────────────>│                          │
      │                            │                          │
      │                            │ 2. Extraire token header │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 3. Rechercher instance   │
      │                            │    par token             │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 4. Vérifier statut actif │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 5. Valider paramètres    │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 6. Exécuter envoi        │
      │                            │    WhatsApp              │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │                            │ 7. Enregistrer activité  │
      │                            │ ────────────────────────>│
      │                            │                          │
      │ 8. Retourner résultat      │                          │
      │ <──────────────────────────│                          │
      │                            │                          │
```

**Étapes détaillées :**

1. **Réception requête** : Service externe envoie requête avec token
2. **Extraction token** : Lecture du header `Authorization`
3. **Recherche instance** : Requête BD pour trouver l'instance correspondante
4. **Vérification statut** : L'instance doit être "active"
5. **Validation** : Contrôle des paramètres (destinataire, message)
6. **Exécution** : Envoi du message via le module WhatsApp
7. **Journalisation** : Enregistrement de l'action dans le journal
8. **Réponse** : Retour du résultat (succès ou erreur)

**Règles métier :**
- Token invalide → 401 Unauthorized
- Instance inactive → 403 Forbidden
- Paramètres invalides → 400 Bad Request
- Erreur WhatsApp → 500 Internal Server Error
- Chaque action est journalisée pour audit

---

### Flux 4 : Vérification de Statut

```
┌──────────┐                ┌─────────────┐              ┌──────────┐
│  Service │                │   Service   │              │    BD    │
│  Externe │                │  WhatsApp   │              │          │
└─────┬────┘                └──────┬──────┘              └────┬─────┘
      │                            │                          │
      │ 1. GET /api/v1/instance-   │                          │
      │    status                  │                          │
      │    Header: Instance-Token  │                          │
      │ ──────────────────────────>│                          │
      │                            │                          │
      │                            │ 2. Valider token         │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 3. Récupérer instance    │
      │                            │ ────────────────────────>│
      │                            │                          │
      │                            │ 4. Vérifier connexion    │
      │                            │    WhatsApp              │
      │                            │ ────────┐                │
      │                            │         │                │
      │                            │<────────┘                │
      │                            │                          │
      │ 5. Retourner statut        │                          │
      │ <──────────────────────────│                          │
      │                            │                          │
```

---

## 🔒 Sécurité et Règles

### Génération de Token

**Algorithme :**
1. Générer chaîne aléatoire de 32-64 caractères
2. Utiliser source d'aléa cryptographiquement sûre
3. Vérifier unicité dans la base de données
4. En cas de collision (très rare), régénérer

**Caractères autorisés :**
- Lettres minuscules : a-z
- Lettres majuscules : A-Z
- Chiffres : 0-9

**Exemple de token :**
```
k8mP3nQ7vL2xR9wT4yU6hJ1sF5gD0aZ8
```

---

### Validation de Token

**Processus :**
1. Extraire token du header `Authorization`
2. Rechercher instance correspondante en BD
3. Vérifier que l'instance existe
4. Vérifier que l'instance est active
5. Autoriser ou refuser l'action

**Cas de refus :**
- Token inexistant
- Instance supprimée
- Instance inactive
- Format de token invalide

---

### Isolation des Instances

**Principes :**
- Chaque instance est totalement isolée
- Un token ne donne accès qu'à sa propre instance
- Aucune action cross-instance possible
- Les données d'une instance ne sont jamais exposées à une autre

---

### Gestion des Erreurs

**Codes de réponse standardisés :**

| Code | Signification | Contexte |
|------|---------------|----------|
| 200  | Succès | Action réussie |
| 201  | Créé | Instance créée |
| 400  | Requête invalide | Paramètres manquants/incorrects |
| 401  | Non authentifié | Token invalide ou manquant |
| 403  | Interdit | Instance inactive ou accès refusé |
| 404  | Non trouvé | Instance inexistante |
| 500  | Erreur serveur | Erreur interne |

**Format de réponse d'erreur :**
```
{
  "erreur": true,
  "code": "INVALID_TOKEN",
  "message": "Le token d'instance fourni est invalide",
  "timestamp": "2026-03-06T11:45:00Z"
}
```

---

## 📊 Scalabilité et Performance

### Considérations de Scalabilité

**Gestion de milliers d'instances :**
- Index sur `token_instance` pour recherche rapide
- Index sur `id_proprietaire` pour lister instances utilisateur
- Pagination des résultats de liste
- Cache des tokens actifs en mémoire (optionnel)

**Optimisations :**
- Validation de token en une seule requête BD
- Mise en cache des instances fréquemment utilisées
- Journalisation asynchrone des activités
- Pool de connexions BD

---

### Limites et Quotas (optionnel)

**Par utilisateur :**
- Nombre maximum d'instances
- Nombre de requêtes API par minute
- Taille maximale des messages

**Par instance :**
- Nombre de messages par jour
- Nombre de destinataires uniques
- Taux d'envoi (messages/seconde)

---

## 🔄 États et Transitions

### Cycle de Vie d'une Instance

```
┌─────────────┐
│ en_attente  │ (Instance créée, pas encore connectée)
└──────┬──────┘
       │
       │ Connexion WhatsApp réussie
       ▼
┌─────────────┐
│   active    │ (Instance opérationnelle)
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       │ Déconnexion      │ Suppression
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  inactive   │    │  supprimee  │
└─────────────┘    └─────────────┘
       │
       │ Reconnexion
       ▼
┌─────────────┐
│   active    │
└─────────────┘
```

**États possibles :**
- `en_attente` : Instance créée, en attente de connexion WhatsApp
- `active` : Instance connectée et opérationnelle
- `inactive` : Instance déconnectée temporairement
- `erreur` : Problème technique détecté
- `supprimee` : Instance supprimée (soft delete optionnel)

---

## 🎯 Résumé des Responsabilités

### Ce que le service FAIT :

✅ Gérer le cycle de vie des instances  
✅ Générer et valider les tokens  
✅ Authentifier les requêtes API  
✅ Autoriser les actions WhatsApp  
✅ Journaliser les activités  
✅ Isoler les instances par utilisateur  
✅ Exposer une API claire et documentée  

### Ce que le service NE FAIT PAS :

❌ Gérer la facturation (service séparé)  
❌ Gérer l'interface utilisateur (frontend séparé)  
❌ Implémenter le protocole WhatsApp (module externe)  
❌ Stocker les messages (optionnel, autre service)  

---

## 🚀 Extensions Futures Possibles

### Fonctionnalités Additionnelles

**Webhooks :**
- Notification d'événements (message reçu, statut changé)
- Configuration d'URL de callback par instance
- Retry automatique en cas d'échec

**Métriques d'usage :**
- Nombre de messages envoyés
- Taux de succès/échec
- Temps de réponse moyen
- Consommation par instance

**Gestion avancée :**
- Rotation de tokens
- Tokens avec expiration
- Tokens avec permissions granulaires
- Multi-utilisateurs par instance

**Monitoring :**
- Alertes sur instances inactives
- Détection d'usage anormal
- Rapports d'activité automatiques

---

## 📝 Conclusion

Cette architecture fournit :

- **Simplicité** : Token unique, pas de complexité inutile
- **Sécurité** : Isolation stricte, validation systématique
- **Scalabilité** : Conçu pour gérer des milliers d'instances
- **Maintenabilité** : Structure claire, responsabilités séparées
- **Extensibilité** : Facile d'ajouter de nouvelles fonctionnalités

Le service est prêt à être implémenté avec n'importe quelle stack technologique respectant ces principes architecturaux.
