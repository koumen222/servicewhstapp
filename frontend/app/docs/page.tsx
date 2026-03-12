"use client";

import { useState } from "react";
import { Copy, Check, Book, Code, Zap, Shield, MessageSquare, Settings } from "lucide-react";

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = "javascript", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={() => copyToClipboard(code, id)}
          className="p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          {copiedCode === id ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <pre className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 font-mono">{code}</code>
      </pre>
    </div>
  );

  const sections = [
    { id: "overview", label: "Vue d'ensemble", icon: Book },
    { id: "auth", label: "Authentication", icon: Shield },
    { id: "instances", label: "Instances", icon: Settings },
    { id: "messaging", label: "Messaging", icon: MessageSquare },
    { id: "webhooks", label: "Webhooks", icon: Zap },
    { id: "examples", label: "Exemples", icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1f0f] to-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff87] to-[#60efff] rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">API Documentation</h1>
                <p className="text-sm text-gray-400">WhatsApp SaaS Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#00ff87]/10 text-[#00ff87] rounded-full text-xs font-medium">
                v1.0.0
              </span>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                API Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === section.id
                        ? "bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20"
                        : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">WhatsApp SaaS API</h2>
                  <p className="text-gray-400 text-lg mb-6">
                    API REST complète pour gérer vos instances WhatsApp, envoyer et recevoir des messages en temps réel.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                      <Shield className="w-8 h-8 text-[#00ff87] mb-2" />
                      <h3 className="text-white font-semibold mb-1">Sécurisé</h3>
                      <p className="text-sm text-gray-400">JWT + Multi-tenant isolation</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                      <Zap className="w-8 h-8 text-[#00ff87] mb-2" />
                      <h3 className="text-white font-semibold mb-1">Temps réel</h3>
                      <p className="text-sm text-gray-400">Webhooks + Polling fallback</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                      <Code className="w-8 h-8 text-[#00ff87] mb-2" />
                      <h3 className="text-white font-semibold mb-1">Simple</h3>
                      <p className="text-sm text-gray-400">REST API + JSON responses</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Base URL</h3>
                  <CodeBlock
                    id="base-url"
                    code="https://api.ecomgroupit"
                    language="text"
                  />
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Fonctionnalités</h3>
                  <ul className="space-y-3">
                    {[
                      "Multi-tenant avec isolation complète",
                      "Gestion d'instances WhatsApp illimitées",
                      "Envoi/réception de messages (texte, média, documents)",
                      "Webhooks temps réel pour tous les événements",
                      "Quotas et rate limiting par plan",
                      "API Keys sécurisées par instance",
                      "Logs d'audit et sécurité",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#00ff87] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Authentication */}
            {activeTab === "auth" && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
                  <p className="text-gray-400 mb-6">
                    Toutes les requêtes nécessitent un token JWT obtenu via login ou register.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">1. Inscription</h3>
                      <CodeBlock
                        id="register"
                        code={`POST /api/auth/register
Content-Type: application/json

{
  "name": "Moussa Traoré",
  "email": "moussa.traore@exemple.com",
  "password": "SecurePassword123!"
}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="register-response"
                          code={`{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "d992fe3f",
      "email": "moussa.traore@exemple.com",
      "name": "Moussa Traoré",
      "plan": "basic",
      "maxInstances": 1
    }
  }
}`}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">2. Connexion</h3>
                      <CodeBlock
                        id="login"
                        code={`POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">3. Utilisation du Token</h3>
                      <CodeBlock
                        id="auth-header"
                        code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                      />
                      <p className="text-sm text-gray-400 mt-2">
                        Ajoutez ce header à toutes vos requêtes authentifiées.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instances */}
            {activeTab === "instances" && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Gestion des Instances</h2>

                  <div className="space-y-8">
                    {/* Create Instance */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Créer une instance</h3>
                      <CodeBlock
                        id="create-instance"
                        code={`POST /api/instance/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "qrcode": false
}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="create-instance-response"
                          code={`{
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
    "webhook": "https://api.ecomgroupit/webhooks/evolution"
  }
}`}
                        />
                      </div>
                    </div>

                    {/* Get QR Code */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Obtenir le QR Code</h3>
                      <CodeBlock
                        id="get-qr"
                        code={`GET /api/instance/qrcode/{instanceName}
Authorization: Bearer {token}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="get-qr-response"
                          code={`{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "pairingCode": null,
    "count": 1
  }
}`}
                        />
                      </div>
                    </div>

                    {/* Phone Pairing */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Connexion par téléphone</h3>
                      <CodeBlock
                        id="phone-pairing"
                        code={`POST /api/instance/connect-phone
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "phoneNumber": "+33612345678"
}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="phone-pairing-response"
                          code={`{
  "success": true,
  "message": "Pairing code generated",
  "data": {
    "pairingCode": "ABCD-EFGH",
    "instanceName": "Support Bot"
  }
}`}
                        />
                      </div>
                    </div>

                    {/* Check Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Vérifier le statut</h3>
                      <CodeBlock
                        id="check-status"
                        code={`GET /api/instance/status/{instanceName}
Authorization: Bearer {token}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="check-status-response"
                          code={`{
  "success": true,
  "data": {
    "status": "connected",
    "rawState": "open",
    "instanceName": "Support Bot",
    "profileName": "My Business"
  }
}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messaging */}
            {activeTab === "messaging" && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Messaging</h2>

                  <div className="space-y-8">
                    {/* Send Message */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Envoyer un message</h3>
                      <CodeBlock
                        id="send-message"
                        code={`POST /api/instance/send-message
Authorization: Bearer {token}
Content-Type: application/json

{
  "instanceName": "Support Bot",
  "number": "33612345678",
  "message": "Bonjour ! Comment puis-je vous aider ?"
}`}
                      />
                      <div className="mt-4 space-y-4">
                        <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                          <p className="text-sm font-semibold text-white mb-2">Formats de numéros acceptés:</p>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li>• <code className="text-[#00ff87]">33612345678</code> (numéro brut)</li>
                            <li>• <code className="text-[#00ff87]">553198296801@s.whatsapp.net</code> (JID individuel)</li>
                            <li>• <code className="text-[#00ff87]">10526998446088@lid</code> (Linked Device)</li>
                            <li>• <code className="text-[#00ff87]">group@g.us</code> (groupe)</li>
                          </ul>
                        </div>
                        <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                          <p className="text-sm font-semibold text-white mb-2">Réponse avec quota:</p>
                          <CodeBlock
                            id="send-message-response-quota"
                            code={`{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "BAE5FAB9E65A3DA8",
    "remoteJid": "33612345678@s.whatsapp.net",
    "timestamp": "2026-03-05T03:30:00.000Z",
    "status": "PENDING",
    "number": "33612345678",
    "text": "Bonjour !"
  },
  "quota": {
    "dailyUsed": 15,
    "dailyLimit": 50,
    "monthlyUsed": 234,
    "monthlyLimit": 500,
    "dailyRemaining": 35,
    "monthlyRemaining": 266
  }
}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Get Chats */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Récupérer les conversations</h3>
                      <CodeBlock
                        id="get-chats"
                        code={`GET /api/instance/chats/{instanceName}
Authorization: Bearer {token}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Réponse:</p>
                        <CodeBlock
                          id="get-chats-response"
                          code={`{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "33612345678@s.whatsapp.net",
        "contactId": "33612345678@s.whatsapp.net",
        "contactName": "Moussa Traoré",
        "unreadCount": 3,
        "lastMessage": {
          "content": "Merci !",
          "isFromMe": false,
          "timestamp": "2026-03-05T03:25:00.000Z"
        }
      }
    ],
    "total": 1
  }
}`}
                        />
                      </div>
                    </div>

                    {/* Get Messages */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Récupérer les messages</h3>
                      <CodeBlock
                        id="get-messages"
                        code={`GET /api/instance/chats/{instanceName}/{remoteJid}/messages?limit=50
Authorization: Bearer {token}`}
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Exemple:</p>
                        <CodeBlock
                          id="get-messages-example"
                          code={`GET /api/instance/chats/Support%20Bot/33612345678%40s.whatsapp.net/messages?limit=50`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks */}
            {activeTab === "webhooks" && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Webhooks</h2>
                  <p className="text-gray-400 mb-6">
                    Les webhooks sont automatiquement configurés lors de la création d'une instance.
                  </p>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#00ff87]/10 to-[#60efff]/10 border border-[#00ff87]/20 rounded-xl p-4">
                      <p className="text-sm font-semibold text-white mb-2">✅ Configuration automatique</p>
                      <p className="text-sm text-gray-400 mb-3">
                        Les webhooks sont configurés automatiquement lors de la création d'une instance.
                      </p>
                      <p className="text-sm font-semibold text-white mb-2">URL du webhook:</p>
                      <code className="text-[#00ff87]">https://api.ecomgroupit/webhooks/evolution</code>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Événements surveillés</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          "CONNECTION_UPDATE",
                          "QRCODE_UPDATED",
                          "MESSAGES_UPSERT",
                          "MESSAGES_UPDATE",
                          "SEND_MESSAGE",
                          "CHATS_UPSERT",
                          "CHATS_UPDATE",
                          "CONTACTS_UPSERT",
                          "PRESENCE_UPDATE",
                          "CALL",
                        ].map((event) => (
                          <div key={event} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2">
                            <code className="text-sm text-[#00ff87]">{event}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Exemple: Connexion réussie</h3>
                      <CodeBlock
                        id="webhook-connection"
                        code={`{
  "event": "CONNECTION_UPDATE",
  "instance": "user_d992fe3f_Support Bot",
  "data": {
    "state": "open",
    "instance": {
      "profileName": "My Business",
      "profilePictureUrl": "https://..."
    }
  }
}`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Exemple: Nouveau message</h3>
                      <CodeBlock
                        id="webhook-message"
                        code={`{
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
}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Examples */}
            {activeTab === "examples" && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Exemples Complets</h2>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Créer et connecter une instance</h3>
                      <CodeBlock
                        id="example-create"
                        code={`// 1. Créer l'instance
const createResponse = await fetch('https://api.ecomgroupit/api/instance/create', {
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
const qrResponse = await fetch(
  'https://api.ecomgroupit/api/instance/qrcode/Support%20Bot',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);

const { data: qrData } = await qrResponse.json();
if (qrData.qrCode) {
  console.log('Scannez ce QR code');
  // Afficher qrData.qrCode dans une image
}

// 3. Vérifier le statut
const statusResponse = await fetch(
  'https://api.ecomgroupit/api/instance/status/Support%20Bot',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);

const { data: statusData } = await statusResponse.json();
console.log('Statut:', statusData.status); // "connected" si OK`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Envoyer un message</h3>
                      <CodeBlock
                        id="example-send"
                        code={`// Envoyer un message
const sendResponse = await fetch('https://api.ecomgroupit/api/instance/send-message', {
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
console.log('Message envoyé:', data.messageId);`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Récupérer les conversations</h3>
                      <CodeBlock
                        id="example-chats"
                        code={`// Récupérer les chats
const chatsResponse = await fetch(
  'https://api.ecomgroupit/api/instance/chats/Support%20Bot',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);

const { data: chatsData } = await chatsResponse.json();
console.log(\`\${chatsData.total} conversations trouvées\`);

// Pour chaque chat, récupérer les messages
for (const chat of chatsData.chats) {
  const messagesResponse = await fetch(
    \`https://api.ecomgroupit/api/instance/chats/Support%20Bot/\${encodeURIComponent(chat.contactId)}/messages?limit=50\`,
    { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
  );
  
  const { data: messagesData } = await messagesResponse.json();
  console.log(\`\${chat.contactName}: \${messagesData.total} messages\`);
}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Plans & Quotas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Plan</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Instances</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Messages/jour</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Messages/mois</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rate limit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { plan: "Basic", instances: "1", daily: "Illimité", monthly: "Illimité", rate: "30 req/min" },
                          { plan: "Premium", instances: "Illimité", daily: "Illimité", monthly: "Illimité", rate: "100 req/min" },
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-[#2a2a2a]/50">
                            <td className="py-3 px-4 text-white font-medium">{row.plan}</td>
                            <td className="py-3 px-4 text-gray-300">{row.instances}</td>
                            <td className="py-3 px-4 text-gray-300">{row.daily}</td>
                            <td className="py-3 px-4 text-gray-300">{row.monthly}</td>
                            <td className="py-3 px-4 text-gray-300">{row.rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
