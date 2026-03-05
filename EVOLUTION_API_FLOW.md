# Evolution API - Correct Connection Flow

## ⚠️ IMPORTANT: Do NOT call restart or connect after instance creation

The Evolution API handles the connection flow automatically. Calling restart or connect endpoints after creation will **interfere** with the natural connection process.

---

## ✅ Correct Flow

### 1️⃣ Create Instance

**Frontend:**
```typescript
POST /api/instance/create
{
  "instanceName": "my-bot",
  "integration": "WHATSAPP-BAILEYS"
}
```

**Backend calls Evolution API:**
```typescript
POST /instance/create
{
  "instanceName": "user_123_my-bot_1234567890",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true  // ← This generates QR automatically
}
```

**Response:**
```json
{
  "success": true,
  "message": "Instance created successfully",
  "data": {
    "instance": { "id": "...", "name": "my-bot", "status": "close" },
    "evolution": { "qrcode": { "base64": "..." } }
  }
}
```

⚠️ **DO NOT call `/instance/restart` or `/instance/connect` after this!**

---

### 2️⃣ Get QR Code (when user clicks "Scan QR")

**Frontend:**
```typescript
GET /api/instance/qrcode/my-bot
```

**Backend calls Evolution API:**
```typescript
GET /instance/connect/user_123_my-bot_1234567890
Headers: { apikey: EVOLUTION_MASTER_API_KEY }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "pairingCode": null,
    "count": 1
  }
}
```

---

### 3️⃣ User Scans QR Code

**On WhatsApp Mobile:**
1. Open WhatsApp
2. Menu → **Linked Devices**
3. **Link a Device**
4. Scan the QR code displayed in the dashboard

Evolution API automatically detects the scan and updates the connection state.

---

### 4️⃣ Poll Connection Status

**Frontend polls every 5 seconds:**
```typescript
GET /api/instance/status/my-bot
```

**Backend calls Evolution API:**
```typescript
GET /instance/connectionState/user_123_my-bot_1234567890
```

**Response when connected:**
```json
{
  "success": true,
  "data": {
    "status": "connected",      // ← Mapped from "open"
    "rawState": "open",          // ← Evolution API state
    "instanceName": "my-bot",
    "profileName": "John Doe",
    "profilePicture": "https://..."
  }
}
```

**State Mapping:**
- `open` → `connected` ✅
- `connecting` → `connecting` 🟡
- `close` → `disconnected` ⚫
- `closed` → `disconnected` ⚫

---

### 5️⃣ Enable Chat Features

**Frontend logic:**
```typescript
if (status === "connected") {
  // ✅ Enable chat input
  // ✅ Enable send button
  // ✅ Start fetching chats
  // ✅ Allow sending messages
}
```

---

## 🚫 What NOT to Do

### ❌ Do NOT call restart after creation
```typescript
// WRONG - This breaks the connection flow
await instancesApi.create("my-bot")
await instancesApi.restart(instanceId) // ❌ DON'T DO THIS
```

### ❌ Do NOT call connect after creation
```typescript
// WRONG - Evolution API already handles this
await instanceApi.create("my-bot")
await instanceApi.connect("my-bot") // ❌ DON'T DO THIS
```

### ✅ Correct approach
```typescript
// CORRECT - Just create and poll status
await instanceApi.create("my-bot")
// Evolution API handles connection automatically
// Frontend polls status until state = "connected"
```

---

## 📋 Backend Endpoints Summary

| Endpoint | Evolution API Call | Purpose |
|----------|-------------------|---------|
| `POST /api/instance/create` | `POST /instance/create` | Create instance with QR |
| `GET /api/instance/qrcode/:name` | `GET /instance/connect/:name` | Get/refresh QR code |
| `GET /api/instance/status/:name` | `GET /instance/connectionState/:name` | Poll connection status |
| `POST /api/instance/connect-phone` | `POST /instance/pairingCode/:name` | Get pairing code for phone |
| `POST /api/instance/send-message` | `POST /message/sendText/:name` | Send WhatsApp message |
| `GET /api/instance/chats/:name` | `GET /chat/findChats/:name` | Get all chats |

---

## 🔑 Key Points

1. **Instance creation automatically generates QR** - No need to call connect
2. **Evolution API manages the connection** - Just poll status
3. **State "open" means connected** - Map to "connected" in frontend
4. **Restart is for reconnecting** - Not for initial connection
5. **Poll every 5 seconds** - Until status = "connected"
6. **Lock chat features** - When status ≠ "connected"

---

## 🐛 Troubleshooting

**Problem:** Instance stays in "connecting" state forever
- **Cause:** Called restart/connect after creation
- **Solution:** Delete instance and recreate (don't call restart)

**Problem:** QR code doesn't appear
- **Cause:** Evolution API not configured or instance already connected
- **Solution:** Check `EVOLUTION_MASTER_API_KEY` and instance state

**Problem:** Status never changes to "connected"
- **Cause:** Not polling status or wrong endpoint
- **Solution:** Poll `GET /api/instance/status/:name` every 5s

---

## 📝 Implementation Checklist

- [x] Backend: Create instance with `qrcode: true`
- [x] Backend: Get QR via `/instance/connect`
- [x] Backend: Poll status via `/instance/connectionState`
- [x] Backend: Map `open` → `connected`
- [x] Frontend: Remove restart button
- [x] Frontend: Poll status every 5s
- [x] Frontend: Lock chat when not connected
- [x] Frontend: Auto-detect connection and close modals

---

**Last Updated:** 2026-03-05
**Evolution API Version:** Compatible with Evolution API v2.x
