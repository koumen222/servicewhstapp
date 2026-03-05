# 🚀 Deployment Checklist - WhatsApp SaaS Backend

## ⚠️ Current Issue

The production backend at `api.ecomcookpit.site` is returning **404 errors** for:
- `GET /api/instance/status/:name`
- `GET /api/instance/qrcode/:name`

**Root Cause:** The deployed backend code is outdated and doesn't include the new routes.

---

## ✅ Pre-Deployment Checklist

### 1. Verify Local Code

- [x] Routes exist in `backend/src/routes/instances.ts`
  - `GET /status/:instanceName` (Line 187)
  - `GET /qrcode/:instanceName` (Line 263)
  - `POST /create` (Line 37)
  - `GET /connect/:instanceName` (Line 242)
  - `POST /connect-phone` (Line 291)
  - `POST /send-message` (Line 327)
  - `GET /chats/:instanceName` (Line 365)
  - `GET /chats/:instanceName/:remoteJid/messages` (Line 399)

- [x] Routes registered in `backend/src/index.ts` (Line 151)
  ```typescript
  app.use('/api/instance', authMiddleware, userRateLimit, multiTenantIsolation, instanceRoutes)
  ```

- [x] Router exported in `instances.ts` (Line 614)
  ```typescript
  export default router
  ```

### 2. Environment Variables

Ensure these are set in production:

```bash
# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_MASTER_API_KEY=your_master_api_key

# Database
DATABASE_URL=your_database_url

# Backend
PORT=8080
NODE_ENV=production
BACKEND_PUBLIC_URL=https://api.ecomcookpit.site

# Frontend
FRONTEND_URL=https://your-frontend-url.com

# JWT
JWT_SECRET=your_jwt_secret
```

### 3. Build the Backend

```bash
cd backend
npm install
npm run build
```

This should create a `dist/` folder with compiled JavaScript.

---

## 🔧 Deployment Steps

### Option 1: Railway Deployment

If you're using Railway:

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Add instance status and QR code endpoints"
   git push origin main
   ```

2. **Railway Auto-Deploy**
   - Railway should automatically detect the push and redeploy
   - Monitor the deployment logs in Railway dashboard
   - Look for the log: `✅ Registered routes: /api/instance/* (status, qrcode, create, etc.)`

3. **Verify Deployment**
   - Check Railway logs for startup messages
   - Look for: `✅ Instance routes module loaded`
   - Verify server started on port 8080

### Option 2: Manual Deployment

1. **Build Locally**
   ```bash
   cd backend
   npm run build
   ```

2. **Upload to Server**
   - Upload the entire `backend/` folder (including `dist/`, `node_modules/`, `package.json`)
   - Or use your CI/CD pipeline

3. **Install Dependencies on Server**
   ```bash
   npm install --production
   ```

4. **Start the Server**
   ```bash
   npm start
   # or
   node dist/index.js
   ```

---

## 🧪 Post-Deployment Verification

### 1. Check Server Logs

Look for these startup messages:

```
✅ Instance routes module loaded
✅ Registered routes: /api/instance/* (status, qrcode, create, etc.)
🚀 Server running on port 8080
```

### 2. Test Endpoints

**Test Status Endpoint:**
```bash
curl -X GET https://api.ecomcookpit.site/api/instance/status/test-instance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response (if instance doesn't exist):
```json
{
  "success": false,
  "message": "Instance not found"
}
```

**Test QR Code Endpoint:**
```bash
curl -X GET https://api.ecomcookpit.site/api/instance/qrcode/test-instance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response (if instance doesn't exist):
```json
{
  "success": false,
  "message": "Instance not found"
}
```

### 3. Test Full Flow

1. **Create Instance**
   ```bash
   curl -X POST https://api.ecomcookpit.site/api/instance/create \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"instanceName": "test-bot", "integration": "WHATSAPP-BAILEYS"}'
   ```

2. **Get QR Code**
   ```bash
   curl -X GET https://api.ecomcookpit.site/api/instance/qrcode/test-bot \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Check Status**
   ```bash
   curl -X GET https://api.ecomcookpit.site/api/instance/status/test-bot \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## 🐛 Troubleshooting

### Issue: 404 on /api/instance/status/:name

**Possible Causes:**
1. Backend not redeployed with latest code
2. Routes not registered in `index.ts`
3. Router not exported from `instances.ts`
4. Middleware blocking requests

**Solutions:**
1. Verify deployment completed successfully
2. Check server logs for route registration messages
3. Restart the backend server
4. Clear any CDN/proxy caches

### Issue: 401 Unauthorized

**Cause:** Missing or invalid JWT token

**Solution:**
- Ensure you're sending `Authorization: Bearer <token>` header
- Verify JWT token is valid and not expired
- Check `JWT_SECRET` matches between frontend and backend

### Issue: 500 Internal Server Error

**Possible Causes:**
1. Evolution API not configured
2. Database connection failed
3. Missing environment variables

**Solutions:**
1. Check `EVOLUTION_API_URL` and `EVOLUTION_MASTER_API_KEY`
2. Verify `DATABASE_URL` is correct
3. Check server logs for detailed error messages

---

## 📊 Monitoring

After deployment, monitor:

1. **Server Logs**
   - Look for `[STATUS] Route hit` messages
   - Look for `[QR] Route hit` messages
   - Check for any error messages

2. **Frontend Console**
   - Should no longer see 404 errors
   - Should see successful API responses

3. **Database**
   - Verify instances are being created
   - Check instance status updates

---

## 🔄 Rollback Plan

If deployment fails:

1. **Revert Git Commit**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Redeploy Previous Version**
   - Railway will auto-deploy the reverted code
   - Or manually deploy previous build

3. **Verify Rollback**
   - Check that previous functionality still works
   - Monitor error logs

---

## ✅ Success Criteria

Deployment is successful when:

- [ ] Server starts without errors
- [ ] Logs show: `✅ Instance routes module loaded`
- [ ] Logs show: `✅ Registered routes: /api/instance/*`
- [ ] `GET /api/instance/status/:name` returns 200 or 404 (not 404 on route itself)
- [ ] `GET /api/instance/qrcode/:name` returns 200 or 404 (not 404 on route itself)
- [ ] Frontend can create instances
- [ ] Frontend can fetch QR codes
- [ ] Frontend can poll instance status
- [ ] No 404 errors in browser console for these endpoints

---

## 📝 Notes

- The routes require JWT authentication (`authMiddleware`)
- All responses follow the format: `{success: boolean, message: string, data: object}`
- Status endpoint maps Evolution states: `open → connected`, `close → disconnected`
- QR endpoint calls Evolution's `/instance/connect/:name`

---

**Last Updated:** 2026-03-05
**Version:** 1.0.0
