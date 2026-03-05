# 🔌 WhatsApp SaaS Integration Guide

## 📋 Overview

This integration allows external applications to connect to existing WhatsApp instances using instance API keys. The system validates access and enables message sending through the WhatsApp SaaS service.

## 🧱 Architecture

```
[ External Application ]
        │
        │ Authorization: Bearer INSTANCE_API_KEY
        ▼
[ WhatsApp SaaS Service ]
        │
        │ (Validates instance API key)
        │
        │ apikey: GLOBAL_EVOLUTION_API_KEY
        ▼
[ Evolution API ]
        ▼
[ WhatsApp User Instance ]
```

## 🔐 Authentication Levels

### Level 1 — Access to SaaS Service
- **Header**: `Authorization: Bearer INSTANCE_API_KEY`
- **Purpose**: Identifies and authenticates the specific instance
- **Scope**: Access only to that instance's resources
- **Security**: Never exposes Evolution API credentials

### Level 2 — Evolution API Access (Internal)
- **Header**: `apikey: GLOBAL_EVOLUTION_API_KEY`
- **Purpose**: SaaS service communicates with Evolution API
- **Scope**: Server-side only, never exposed to clients

## 🚀 Implementation

### Backend Components

#### 1. Integration Service
**File**: `backend/src/services/whatsappIntegration.ts`

```typescript
// Verify instance access
verifyWhatsAppInstance({ instanceId, apiKey })

// Send message via SaaS
sendWhatsAppMessage({ instanceId, apiKey, number, text })
```

#### 2. Integration Routes
**File**: `backend/src/routes/integrations.ts`

**Endpoints**:
- `POST /api/integrations/whatsapp/connect` - Connect instance
- `POST /api/integrations/whatsapp/test-message` - Send test message
- `GET /api/integrations/whatsapp/status` - Get connection status

#### 3. Route Registration
**File**: `backend/src/index.ts`

```typescript
app.use('/api/integrations', authMiddleware, userRateLimit, integrationsRoutes)
```

### Frontend Components

#### 1. API Client
**File**: `frontend/lib/api.ts`

```typescript
integrationsApi.connectWhatsApp(instanceName, instanceId, apiKey)
integrationsApi.testWhatsAppMessage(instanceId, apiKey, number, text)
integrationsApi.getWhatsAppStatus()
```

#### 2. UI Component
**File**: `frontend/components/WhatsAppIntegration.tsx`

Features:
- Instance connection form
- Connection verification
- Test message sending
- Status display

#### 3. Integration Page
**File**: `frontend/app/dashboard/integrations/page.tsx`

Accessible at: `/dashboard/integrations`

## 📝 Usage Flow

### Step 1: Connect Instance

**Request**:
```json
POST /api/integrations/whatsapp/connect
Authorization: Bearer <JWT_TOKEN>

{
  "instanceName": "Support Client",
  "instanceId": "sssss",
  "apiKey": "ak_live_xxxxxxxxx"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "WhatsApp instance connected successfully",
  "data": {
    "instanceName": "Support Client",
    "instanceId": "sssss",
    "connected": true,
    "verifiedAt": "2024-03-05T22:10:00.000Z"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "INSTANCE_VERIFICATION_FAILED"
}
```

### Step 2: Send Test Message

**Request**:
```json
POST /api/integrations/whatsapp/test-message
Authorization: Bearer <JWT_TOKEN>

{
  "instanceId": "sssss",
  "apiKey": "ak_live_xxxxxxxxx",
  "number": "+1234567890",
  "text": "Hello, this is a test message!"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Test message sent successfully",
  "data": {
    // Evolution API response
  }
}
```

### Step 3: Check Status

**Request**:
```json
GET /api/integrations/whatsapp/status
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "instances": [
      {
        "id": "sssss",
        "name": "Support Client",
        "status": "open",
        "createdAt": "2024-03-05T20:00:00.000Z"
      }
    ]
  }
}
```

## 🧪 Testing

### Manual Testing via UI

1. **Navigate to Integrations**
   - Go to `/dashboard/integrations`
   - Click "Configure" on "WhatsApp Instance"

2. **Connect Instance**
   - Enter Instance Name (e.g., "Support Client")
   - Enter Instance ID (e.g., "sssss")
   - Enter API Key (e.g., "ak_live_xxxxxxxxx")
   - Click "Connect WhatsApp Instance"

3. **Verify Connection**
   - Check for success message
   - Verify instance details displayed

4. **Send Test Message**
   - Enter phone number with country code
   - Enter test message
   - Click "Send Test Message"
   - Verify success

### API Testing with cURL

**Connect Instance**:
```bash
curl -X POST http://localhost:8080/api/integrations/whatsapp/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "instanceName": "Support Client",
    "instanceId": "sssss",
    "apiKey": "ak_live_xxxxxxxxx"
  }'
```

**Send Test Message**:
```bash
curl -X POST http://localhost:8080/api/integrations/whatsapp/test-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "instanceId": "sssss",
    "apiKey": "ak_live_xxxxxxxxx",
    "number": "+1234567890",
    "text": "Hello from integration!"
  }'
```

**Check Status**:
```bash
curl -X GET http://localhost:8080/api/integrations/whatsapp/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Logging & Debugging

All operations include detailed console logging:

### Connection Verification
```
=========== VERIFY WHATSAPP INSTANCE ===========
📱 Instance ID: sssss
🔑 API Key present: YES
🌍 Calling: https://api.ecomcookpit.site/api/instance/status
📡 Status: 200
📡 Raw response: {...}
✅ Instance verified successfully
================================================
```

### Message Sending
```
============== SEND WHATSAPP MESSAGE ==============
📱 Instance ID: sssss
📞 Number: +1234567890
💬 Text: Hello, this is a test message!
🌍 Calling: https://api.ecomcookpit.site/api/message/sendText
📡 Status: 200
📡 Response: {...}
✅ Message sent successfully
====================================================
```

## ⚠️ Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `MISSING_CREDENTIALS` | Instance ID or API key missing | Provide both fields |
| `INVALID_CREDENTIALS` | API key invalid or instance not found | Verify credentials |
| `INSTANCE_VERIFICATION_FAILED` | Cannot verify instance | Check instance exists in SaaS |
| `WHATSAPP_SEND_FAILED` | Message sending failed | Check instance is connected |
| `UNAUTHORIZED` | JWT token missing/invalid | Login again |

## 🎯 Key Features

✅ **Secure Authentication**
- Instance API keys for granular access
- JWT authentication for user sessions
- No exposure of Evolution API credentials

✅ **Detailed Logging**
- Console logs for all operations
- Request/response tracking
- Error diagnostics

✅ **User-Friendly UI**
- Dark theme integration
- Real-time feedback
- Test message capability

✅ **Robust Error Handling**
- Specific error codes
- User-friendly messages
- Detailed debugging info

## 📊 Data Flow

1. **User enters credentials** → Frontend validates input
2. **Frontend sends request** → Backend receives with JWT
3. **Backend verifies instance** → Calls SaaS service with instance API key
4. **SaaS validates** → Checks instance exists and key is valid
5. **Backend returns result** → Frontend displays success/error
6. **User sends message** → Same flow, calls message endpoint
7. **SaaS sends to Evolution** → Uses global Evolution API key
8. **Evolution sends to WhatsApp** → Message delivered

## 🔒 Security Best Practices

1. **Never expose Evolution API key** to clients
2. **Always validate** instance API keys server-side
3. **Use HTTPS** in production
4. **Rate limit** integration endpoints
5. **Log all operations** for audit trail
6. **Sanitize inputs** to prevent injection attacks

## 🚀 Next Steps

1. Test the integration with real instance credentials
2. Monitor logs for any issues
3. Verify messages are sent successfully
4. Check Evolution API dashboard for delivery status
5. Implement additional features as needed

## 📞 Support

For issues or questions:
- Check console logs for detailed error messages
- Verify instance exists in WhatsApp SaaS service
- Ensure instance is connected (status: "open")
- Confirm API key has correct permissions
