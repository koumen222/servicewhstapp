import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Base de connaissances du système
const KNOWLEDGE_BASE = `
# ZeChat.site - Plateforme WhatsApp Business pour E-commerçants

## À propos
ZeChat.site est une plateforme professionnelle de gestion WhatsApp Business spécialement conçue pour les e-commerçants en Afrique. 
Notre solution permet d'envoyer des messages en masse, de cibler des clients par ville ou produit, et d'utiliser un agent IA pour automatiser les réponses.

## Fonctionnalités principales

### 1. Diffusion ciblée en masse
- Envoyez des messages à des centaines de clients simultanément
- Filtrez par ville, produit, ou historique d'achat
- Envoyez des photos, vidéos, messages vocaux, PDF, localisations
- Taille maximale : 100 Mo par fichier

### 2. Agent IA intelligent
- Répond automatiquement aux questions clients 24h/24
- Configurez votre catalogue produits, prix, conditions de livraison
- Gère les commandes et transfère les cas complexes à un humain
- Ne laisse jamais une question sans réponse

### 3. Médias riches
- Photos de produits (JPG, PNG)
- Vidéos de présentation (MP4)
- Messages vocaux (OGG)
- Documents PDF, fichiers ZIP
- Localisations GPS
- Contacts partagés

### 4. Intégrations e-commerce
- Shopify, WooCommerce
- Google Sheets
- Zapier, Make, N8N
- Webhooks personnalisés
- API REST complète

## Plans tarifaires

### Plan Free
- 1 instance WhatsApp
- 1 000 messages/mois
- Accès complet à l'API
- Support par email (24h)

### Plan Starter
- 3 instances WhatsApp
- 5 000 messages/mois
- Accès API prioritaire
- Support prioritaire (4h)

### Plan Pro
- 10 instances WhatsApp
- 20 000 messages/mois
- Agent IA avancé
- Support prioritaire (2h)

### Plan Enterprise
- 50 instances WhatsApp
- Messages illimités
- Support dédié
- Intégrations personnalisées

## Paiement
- Facturation mensuelle en XAF
- Paiement via WhatsApp
- Aucune carte bancaire requise

## API

### Base URL
https://api.ecomgroupit

### Authentification
Utilisez votre token Bearer dans l'en-tête Authorization :
Authorization: Bearer YOUR_TOKEN

### Endpoints principaux
- POST /api/auth/register - Créer un compte
- POST /api/auth/login - Se connecter
- GET /api/instances - Lister vos instances
- POST /api/instance/create - Créer une instance
- POST /api/instance/send-message - Envoyer un message
- GET /api/instance/qrcode/:name - Obtenir le QR code
- GET /api/instance/status/:name - Vérifier le statut

### Webhooks
URL automatique : https://api.ecomgroupit/webhooks/evolution
Événements : CONNECTION_UPDATE, QRCODE_UPDATED, MESSAGES_UPSERT, MESSAGES_UPDATE

## Support technique

### Inscription
1. Visitez https://ecomcookpit.site/register
2. Répondez aux questions du chatbot (nom, téléphone)
3. Remplissez le formulaire (email, mot de passe)
4. Votre compte est créé immédiatement

### Connexion
- Email + mot de passe
- Compte actif immédiatement après inscription

### Numéro de téléphone
- Format international requis avec indicatif pays
- Exemple : +237612345678, +33612345678, +1234567890
- Tous les pays acceptés

### Vérification email
- Email de vérification envoyé automatiquement
- Lien valide 24 heures
- Compte utilisable immédiatement (vérification optionnelle)

## FAQ

Q: Puis-je envoyer des photos de produits à plusieurs clients en même temps ?
R: Oui, la diffusion en masse permet d'envoyer photos, vidéos, PDF ou messages vocaux à des centaines de clients simultanément.

Q: Comment fonctionne l'agent IA ?
R: Vous configurez votre catalogue produits, prix, conditions de livraison et FAQ. L'IA répond automatiquement 24h/24 et gère les commandes.

Q: Puis-je cibler mes clients par ville ou par produit ?
R: Absolument. Le système de segmentation permet de filtrer par ville, intérêt produit, historique d'achat ou tout autre critère.

Q: Quel type de fichiers puis-je envoyer ?
R: Tous les types WhatsApp : images (JPG, PNG), vidéos (MP4), messages vocaux (OGG), PDF, ZIP, localisations GPS, contacts. Max 100 Mo.

Q: Est-ce que ça fonctionne avec Shopify ou WooCommerce ?
R: Oui, via API REST ou Zapier/Make. Automatisez les notifications de commande, confirmations de paiement et relances panier abandonné.

Q: Comment se passe le paiement ?
R: Facturation mensuelle en XAF, réglée via WhatsApp. Aucune carte bancaire requise.

## Contact
- Email : contact@infomania.store
- Support : Disponible dans le chatbot
- Documentation : https://ecomcookpit.site/docs
`;

export const aiService = {
  async chat(userMessage: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []) {
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `Tu es Rita, l'assistante de support client experte pour ZeChat.site, une plateforme WhatsApp Business pour e-commerçants.

INSTRUCTIONS IMPORTANTES :
- Tu t'appelles Rita, présente-toi comme une assistante IA nommée Rita
- Réponds UNIQUEMENT en français
- Sois professionnelle, amicale et concise
- Utilise les informations de la base de connaissances ci-dessous
- Si tu ne connais pas la réponse, dis-le honnêtement et propose de contacter le support
- Fournis des exemples concrets quand c'est pertinent
- Utilise des emojis avec parcimonie pour rendre la conversation plus agréable
- Ne mentionne jamais que tu es un modèle IA ou que tu as des limitations
- Termine parfois par "Rita" pour renforcer ton identité

BASE DE CONNAISSANCES :
${KNOWLEDGE_BASE}

Réponds maintenant à la question de l'utilisateur de manière claire et utile en tant que Rita.`
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const completion = await groq.chat.completions.create({
        messages,
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";
      
      return {
        success: true,
        response,
        conversationId: completion.id,
      };
    } catch (error: any) {
      console.error('❌ Groq API error:', error);
      return {
        success: false,
        response: "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter notre support à contact@infomania.store",
        error: error.message,
      };
    }
  },

  async quickAnswer(question: string) {
    // Réponses rapides pour les questions fréquentes
    const quickAnswers: Record<string, string> = {
      'prix': 'Nos plans commencent à partir du plan Free (gratuit) avec 1 instance et 1000 messages/mois. Pour plus de détails, consultez notre page tarifs.',
      'tarif': 'Nos plans commencent à partir du plan Free (gratuit) avec 1 instance et 1000 messages/mois. Pour plus de détails, consultez notre page tarifs.',
      'gratuit': 'Oui ! Le plan Free est gratuit et inclut 1 instance WhatsApp et 1000 messages/mois.',
      'api': 'Notre API REST est disponible sur https://api.ecomgroupit. Documentation complète sur /docs.',
      'contact': 'Vous pouvez nous contacter par email à contact@infomania.store ou via ce chatbot.',
      'support': 'Notre support est disponible 24h via email (contact@infomania.store) et ce chatbot. Les plans payants ont un support prioritaire.',
    };

    const lowerQuestion = question.toLowerCase();
    for (const [key, answer] of Object.entries(quickAnswers)) {
      if (lowerQuestion.includes(key)) {
        return { success: true, response: answer, quick: true };
      }
    }

    return null;
  }
};
