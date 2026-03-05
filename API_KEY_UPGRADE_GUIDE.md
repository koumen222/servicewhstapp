# 🔐 API Key System Upgrade Guide

## 📋 Overview

This guide explains how to upgrade your WhatsApp SaaS service to provide professional, secure API credentials for external systems.

## 🎯 What's Being Upgraded

### Current Issues
- ❌ API keys use SHA-256 hashing (less secure than bcrypt)
- ❌ No explicit revocation tracking
- ❌ No rate limiting per API key
- ❌ No IP tracking for security audits
- ❌ Limited observability

### New Professional Features
- ✅ **Bcrypt hashing** for maximum security (12 rounds)
- ✅ **Explicit revocation** with reason tracking
- ✅ **Rate limiting** per API key (configurable per minute)
- ✅ **IP tracking** for security audits
- ✅ **Detailed logging** for all API key operations
- ✅ **API key rotation** capabilities
- ✅ **Bearer token authentication** middleware

## 📦 Step 1: Install Required Dependencies

```bash
cd backend
npm install bcrypt
npm install --save-dev @types/bcrypt
```

## 🗄️ Step 2: Update Database Schema

The Prisma schema has been updated with new fields. Run the migration:

```bash
cd backend
npx prisma migrate dev --name add_api_key_security_fields
```

### New Schema Fields Added to `ApiKey` model:

```prisma
model ApiKey {
  // ... existing fields ...
  
  // NEW SECURITY FIELDS
  revoked           Boolean  @default(false)  // Explicit revocation flag
  revokedAt         DateTime?                 // When was it revoked
  revokedReason     String?                   // Why was it revoked
  lastUsedIp        String?                   // Last IP that used this key
  rateLimitPerMin   Int      @default(60)     // Rate limit per minute
  
  // UPDATED: keyHash now uses bcrypt instead of SHA-256
  keyHash           String   @unique          // Bcrypt hash (was SHA-256)
  
  @@index([isActive])
  @@index([revoked])
}
```

## 🔧 Step 3: New Files Created

### 1. API Key Generator (`backend/src/utils/apiKeyGenerator.ts`)

Secure cryptographic key generation with bcrypt hashing:

```typescript
import crypto from 'crypto'
import bcrypt from 'bcrypt'

// Generate API key: ak_live_xxxxxxxxxxxxxxxxxxxxxxxxx
export async function generateAndHashApiKey(): Promise<{
  apiKey: string
  keyHash: string
  keyPrefix: string
}>

// Verify API key against bcrypt hash
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean>

// Mask API key for display
export function maskApiKey(apiKey: string): string
```

### 2. Instance API Key Auth Middleware (`backend/src/middleware/instanceApiKeyAuth.ts`)

Professional Bearer token authentication:

```typescript
// Middleware for API key authentication
export async function instanceApiKeyAuth(req, res, next)

// Permission checker middleware
export async function checkApiKeyPermission(permission: string)
```

**Usage in routes:**
```typescript
import { instanceApiKeyAuth, checkApiKeyPermission } from '../middleware/instanceApiKeyAuth.js'

// Protect route with API key auth
router.post('/send-message', 
  instanceApiKeyAuth,
  checkApiKeyPermission('send_message'),
  async (req, res) => {
    // Access authenticated data via req.apiKeyAuth
    const { instance, user, apiKey } = req.apiKeyAuth
  }
)
```

## 🔄 Step 4: Update Existing Routes

### Update Public API Routes

Replace the old API key validation with the new middleware:

**Before:**
```typescript
// Old approach - manual validation
const validation = await ApiKeyService.validateApiKey(apiKey)
if (!validation.isValid) {
  return res.status(401).json({ error: 'Invalid API key' })
}
```

**After:**
```typescript
import { instanceApiKeyAuth } from '../middleware/instanceApiKeyAuth.js'

// New approach - middleware handles everything
router.post('/api/v1/message/sendText', 
  instanceApiKeyAuth,
  async (req, res) => {
    // req.apiKeyAuth contains: { apiKey, instance, user }
    const { instance } = req.apiKeyAuth
  }
)
```

## 📝 Step 5: API Key Management Endpoints

### Generate New API Key

```http
POST /api/api-keys
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "instanceId": "uuid-here",
  "name": "Production API Key",
  "permissions": ["send_message", "get_instance_status"],
  "rateLimitPerMin": 60
}
```

**Response (shown ONCE only):**
```json
{
  "success": true,
  "message": "API key created. Save the full key now — it will not be shown again.",
  "data": {
    "key": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "id": "uuid",
    "name": "Production API Key",
    "keyPrefix": "ak_live_a1b2c3d...",
    "permissions": ["send_message", "get_instance_status"],
    "rateLimitPerMin": 60,
    "createdAt": "2024-03-05T22:00:00.000Z"
  }
}
```

### Rotate API Key

```http
POST /api/api-keys/:id/rotate
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "API key rotated successfully",
  "data": {
    "newKey": "ak_live_new_key_here",
    "oldKeyRevoked": true
  }
}
```

### Revoke API Key

```http
DELETE /api/api-keys/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "reason": "Security breach - rotating all keys"
}
```

### List API Keys

```http
GET /api/api-keys?instanceId=uuid
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production API Key",
      "keyPrefix": "ak_live_a1b2c3d...",
      "permissions": ["send_message"],
      "rateLimitPerMin": 60,
      "lastUsed": "2024-03-05T22:00:00.000Z",
      "lastUsedIp": "192.168.1.1",
      "usageCount": 1523,
      "createdAt": "2024-03-01T10:00:00.000Z",
      "revoked": false
    }
  ]
}
```

## 🔒 Step 6: Security Best Practices

### 1. API Key Storage
- ✅ **NEVER** store API keys in plain text
- ✅ **ALWAYS** use bcrypt with 12+ rounds
- ✅ Show the full key **ONLY ONCE** when generated
- ✅ Store only the hash and prefix in database

### 2. API Key Transmission
- ✅ **ALWAYS** use HTTPS in production
- ✅ Send keys via `Authorization: Bearer <key>` header
- ✅ **NEVER** send keys in URL parameters
- ✅ **NEVER** log full API keys

### 3. API Key Rotation
- ✅ Rotate keys every 90 days
- ✅ Provide rotation endpoint for users
- ✅ Allow grace period for old key after rotation
- ✅ Log all rotation events

### 4. Rate Limiting
- ✅ Implement per-key rate limiting
- ✅ Default: 60 requests/minute
- ✅ Configurable per API key
- ✅ Return 429 with retry-after header

### 5. Audit Logging
- ✅ Log all API key usage
- ✅ Track IP addresses
- ✅ Monitor for suspicious patterns
- ✅ Alert on revoked key usage attempts

## 📊 Step 7: Monitoring & Observability

### Console Logging

All API key operations include detailed logging:

```
========== INSTANCE API KEY AUTH ==========
🔍 Searching for API key...
  Token prefix: ak_live_a1b2c3d...
  Found 5 active API keys to check
✅ API Key validated successfully
  Key ID: uuid-here
  Key Prefix: ak_live_a1b2c3d...
  Instance: user_123_support
  User: user@example.com
  Updated usage stats
  Usage count: 1524
==========================================
```

### Metrics to Track

1. **API Key Usage**
   - Total requests per key
   - Requests per minute
   - Success vs failure rate
   - Geographic distribution (by IP)

2. **Security Events**
   - Invalid key attempts
   - Revoked key usage attempts
   - Rate limit violations
   - Suspicious IP patterns

3. **Performance**
   - Authentication latency
   - Bcrypt verification time
   - Database query performance

## 🧪 Step 8: Testing

### Test API Key Generation

```bash
curl -X POST http://localhost:8080/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "instanceId": "your-instance-id",
    "name": "Test Key",
    "permissions": ["send_message"],
    "rateLimitPerMin": 30
  }'
```

### Test API Key Authentication

```bash
curl -X POST http://localhost:8080/api/v1/message/sendText \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ak_live_your_generated_key_here" \
  -d '{
    "instanceId": "your-instance-id",
    "number": "+1234567890",
    "text": "Test message"
  }'
```

### Test Invalid API Key

```bash
curl -X POST http://localhost:8080/api/v1/message/sendText \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_key_here" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "Invalid or expired API key"
}
```

## 🚀 Step 9: Migration Strategy

### For Existing API Keys

If you have existing API keys with SHA-256 hashing:

1. **Option A: Force Re-generation**
   - Mark all existing keys as `requiresRotation: true`
   - Force users to generate new keys
   - Provide grace period (e.g., 30 days)

2. **Option B: Gradual Migration**
   - Keep old validation logic temporarily
   - Encourage users to rotate keys
   - Remove old logic after migration period

### Recommended: Option A (Clean Break)

```typescript
// Add migration script
async function migrateApiKeys() {
  await prisma.apiKey.updateMany({
    where: { /* all keys */ },
    data: {
      revoked: true,
      revokedReason: 'Security upgrade - please generate new API key'
    }
  })
  
  console.log('All old API keys revoked. Users must generate new keys.')
}
```

## 📱 Step 10: Frontend Integration

### API Key Management UI

Create a component to display and manage API keys:

```typescript
// components/ApiKeyManager.tsx
- List all API keys for an instance
- Generate new API key (show once with copy button)
- Revoke existing keys
- View usage statistics
- Rotate keys
```

### Key Features:
- ⚠️ **Warning**: "Save this key now - it will never be shown again"
- 📋 **Copy to clipboard** button
- 🔄 **Rotate key** with confirmation
- 🗑️ **Revoke key** with reason input
- 📊 **Usage stats** per key

## ✅ Checklist

Before deploying to production:

- [ ] Install bcrypt dependency
- [ ] Run Prisma migration
- [ ] Update API key generation to use bcrypt
- [ ] Implement instanceApiKeyAuth middleware
- [ ] Update all public API routes to use new middleware
- [ ] Add API key rotation endpoint
- [ ] Add API key revocation with reason
- [ ] Implement rate limiting per key
- [ ] Add IP tracking
- [ ] Update frontend UI for API key management
- [ ] Test key generation
- [ ] Test key authentication
- [ ] Test key rotation
- [ ] Test key revocation
- [ ] Test rate limiting
- [ ] Migrate existing keys (if any)
- [ ] Update documentation
- [ ] Monitor logs for issues

## 🎯 Expected Results

After implementing this upgrade:

✅ **Professional API Provider**
- Secure bcrypt-hashed API keys
- Industry-standard Bearer token auth
- Granular permissions system

✅ **Enhanced Security**
- Explicit revocation tracking
- IP-based audit logs
- Rate limiting per key
- Suspicious activity detection

✅ **Better User Experience**
- Clear API key management UI
- One-time key display with warnings
- Easy key rotation
- Detailed usage statistics

✅ **Operational Excellence**
- Comprehensive logging
- Performance monitoring
- Security event tracking
- Automated cleanup of expired keys

## 🆘 Troubleshooting

### Issue: "Cannot find module 'bcrypt'"
**Solution:** Run `npm install bcrypt @types/bcrypt`

### Issue: Prisma errors about unknown fields
**Solution:** Run `npx prisma migrate dev` to apply schema changes

### Issue: All API keys failing validation
**Solution:** Check that bcrypt is installed and middleware is properly registered

### Issue: Rate limiting not working
**Solution:** Ensure rate limiting middleware is applied after authentication

## 📚 Additional Resources

- [Bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**Next Steps:** Follow the checklist above to implement the upgrade systematically.
