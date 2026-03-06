# MongoDB Migration Notes

## Overview
Added MongoDB support for WhatsApp instance management alongside existing PostgreSQL/Prisma setup for SaaS features (users, subscriptions, quotas).

## What was added
- MongoDB driver (`mongodb`)
- Connection layer (`src/lib/mongo.ts`)
- Instance service (`src/services/instanceService.ts`)
- Evolution API service (`src/services/evolutionService.ts`)
- WhatsApp instance routes (`src/routes/whatsapp/instances.ts`)
- TypeScript types (`src/types/instance.ts`)

## Database separation
- **PostgreSQL/Prisma**: Users, auth, subscriptions, quotas, audit logs
- **MongoDB**: WhatsApp instances (state, QR codes, Evolution API metadata)

## New endpoints (per API spec)
- `GET /api/instances` - List all WhatsApp instances
- `POST /api/create-instance` - Create new WhatsApp instance
- `POST /api/refresh-qr/:instanceId` - Refresh QR code
- `POST /api/check-connection/:instanceId` - Check connection status
- `POST /api/send-message/:instanceId` - Send WhatsApp message

## Environment variables required
```env
MONGODB_URI="mongodb+srv://..."
EVOLUTION_API_URL="https://evolution-api-production-77b9.up.railway.app"
EVOLUTION_ADMIN_TOKEN="1234567pkltd"
```

## MongoDB collection schema
```javascript
{
  _id: ObjectId,
  instanceId: string,        // Unique ID (chosen name)
  instanceName: string,     // Display name
  apiKey: string,          // Evolution API key
  hash: string,            // Same as apiKey
  status: string,          // Connection status
  integration?: string,    // "WHATSAPP-BAILEYS"
  qrcodeBase64?: string,   // QR code in base64
  createdAt: Date,
  updatedAt: Date
}
```

## Migration impact
- Existing Prisma models unchanged
- No data migration needed (separate concerns)
- Backend now connects to both databases on startup
- Graceful shutdown handles both connections

## Testing
1. Ensure MongoDB connection string is valid
2. Verify Evolution API credentials
3. Test instance creation flow
4. Verify QR refresh and connection check
5. Test message sending when connected

## Notes
- Multi-tenant isolation can be added later by including userId in MongoDB queries
- Current implementation is single-tenant for instances
- Authentication for these endpoints can be added later if needed
