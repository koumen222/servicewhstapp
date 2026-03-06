# Full MongoDB Migration Guide

## Overview
Complete migration from Prisma/PostgreSQL to MongoDB for all data models while maintaining API compatibility.

## What's Been Migrated

### 1. Data Models (`src/types/models.ts`)
- **User**: Authentication, plans, instance limits
- **ApiKey**: API key management with permissions
- **Subscription**: Plan subscriptions
- **Payment**: Payment records
- **Notification**: User notifications
- **ActivityLog**: Instance activity logs
- **QuotaUsage**: Message quotas
- **MessageLog**: Message history
- **SystemConfig**: System configuration
- **WhatsAppInstance**: WhatsApp instance state

### 2. Service Layers
- **UserService** (`src/services/userService.ts`)
- **ApiKeyService** (`src/services/apiKeyService.mongo.ts`)
- **AuthService** (`src/services/authService.mongo.ts`)
- **InstanceService** (already MongoDB)
- **EvolutionService** (already exists)

### 3. Middleware
- **AuthMiddleware** (`src/middleware/auth.mongo.ts`)
- Maintains Express user interface compatibility

### 4. Authentication Flow
- JWT token generation/validation
- Password hashing with bcrypt
- User registration/login
- Token refresh

## Collection Schemas

### Users Collection
```javascript
{
  _id: ObjectId,
  email: string (unique),
  name: string,
  password: string (hashed),
  plan: 'free' | 'starter' | 'pro' | 'enterprise',
  maxInstances: number,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ApiKeys Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  instanceId: ObjectId,
  keyHash: string (unique),
  keyPrefix: string,
  name: string,
  permissions: string[],
  isActive: boolean,
  revoked: boolean,
  usageCount: number,
  rateLimitPerMin: number,
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date,
  lastUsed: Date,
  lastUsedIp: string
}
```

### WhatsAppInstances Collection
```javascript
{
  _id: ObjectId,
  instanceId: string (unique),
  instanceName: string,
  customName: string,
  apiKey: string,
  hash: string,
  status: string,
  integration: string,
  qrcodeBase64: string,
  userId: ObjectId,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Migration Steps

### 1. Environment Setup
```env
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
EVOLUTION_API_URL="https://evolution-api-production-77b9.up.railway.app"
EVOLUTION_ADMIN_TOKEN="1234567pkltd"
```

### 2. Database Initialization
MongoDB collections are created automatically on first use. No migrations needed.

### 3. Data Migration (if needed)
```javascript
// Example migration script
// Export from PostgreSQL and import to MongoDB
// Use custom migration scripts for existing data
```

## API Compatibility

All existing API endpoints remain the same:
- Authentication: JWT Bearer tokens
- Instance management: Same response formats
- Rate limiting: Same middleware
- Multi-tenant: Same isolation patterns

## Performance Considerations

### Indexes to Create
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ isActive: 1 })

// ApiKeys
db.apikeys.createIndex({ keyHash: 1 }, { unique: true })
db.apikeys.createIndex({ userId: 1, instanceId: 1 })
db.apikeys.createIndex({ isActive: 1, revoked: 1 })

// WhatsAppInstances
db.whatsapp_instances.createIndex({ instanceId: 1 }, { unique: true })
db.whatsapp_instances.createIndex({ userId: 1 })
db.whatsapp_instances.createIndex({ status: 1 })
```

## Benefits of MongoDB

1. **Flexible Schema**: Easy to add new fields
2. **Document Structure**: Nested data in single documents
3. **Scalability**: Horizontal scaling ready
4. **JSON Native**: Perfect for API responses
5. **Change Streams**: Real-time updates possible

## Rollback Plan

If needed, rollback steps:
1. Switch import statements back to Prisma services
2. Update environment variables to PostgreSQL
3. Restore PostgreSQL database
4. Update package.json dependencies

## Next Steps

1. **Testing**: Verify all endpoints work with MongoDB
2. **Performance**: Add indexes and optimize queries
3. **Monitoring**: Set up MongoDB monitoring
4. **Backup**: Configure MongoDB backups
5. **Security**: Enable MongoDB authentication/SSL

## Files Changed

- ✅ `src/types/models.ts` - All model interfaces
- ✅ `src/services/userService.ts` - User CRUD operations
- ✅ `src/services/apiKeyService.mongo.ts` - API key management
- ✅ `src/services/authService.mongo.ts` - Authentication logic
- ✅ `src/middleware/auth.mongo.ts` - Express auth middleware
- ✅ `src/lib/mongo.ts` - MongoDB connection
- ✅ `src/index.ts` - Updated imports and initialization

## Files to Remove (after testing)

- `prisma/` directory (optional)
- `src/lib/prisma.ts`
- Prisma service files
- PostgreSQL dependencies from package.json
