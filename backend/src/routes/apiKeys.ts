import express from 'express'
import { ApiKeyService } from '../services/apiKeyService.js'

const router = express.Router()

const VALID_PERMISSIONS = [
  'send_message',
  'get_instance_status',
  'manage_webhooks',
  'read_messages'
]

/**
 * GET /api/api-keys?instanceId=
 * List all active API keys for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const instanceId = req.query.instanceId as string | undefined

    const keys = await ApiKeyService.listApiKeys(userId, instanceId)
    res.json({ success: true, data: keys })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list API keys' })
  }
})

/**
 * POST /api/api-keys
 * Create a new API key for an instance
 * Body: { instanceId, name?, permissions? }
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const { instanceId, name, permissions, expiresAt } = req.body

    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId is required' })
    }

    if (permissions) {
      const invalid = (permissions as string[]).filter(p => !VALID_PERMISSIONS.includes(p))
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `Invalid permissions: ${invalid.join(', ')}`,
          validPermissions: VALID_PERMISSIONS
        })
      }
    }

    const result = await ApiKeyService.createApiKey({
      userId,
      instanceId,
      name,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    })

    // The full key is returned ONCE here — never again
    res.status(201).json({
      success: true,
      message: 'API key created. Save the full key now — it will not be shown again.',
      data: {
        key: result.apiKey,   // Full key — shown once
        ...result.keyData
      }
    })
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('Maximum') ? 429
      : 500
    res.status(status).json({ error: error.message || 'Failed to create API key' })
  }
})

/**
 * DELETE /api/api-keys/:id
 * Revoke (soft-delete) an API key
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const revoked = await ApiKeyService.revokeApiKey(userId, id)
    if (!revoked) {
      return res.status(404).json({ error: 'API key not found or already revoked' })
    }

    res.json({ success: true, message: 'API key revoked' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke API key' })
  }
})

/**
 * PATCH /api/api-keys/:id/permissions
 * Update permissions on an existing API key
 * Body: { permissions: string[] }
 */
router.patch('/:id/permissions', async (req, res) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { permissions } = req.body

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'permissions must be a non-empty array' })
    }

    const updated = await ApiKeyService.updateApiKeyPermissions(userId, id, permissions)
    if (!updated) {
      return res.status(404).json({ error: 'API key not found' })
    }

    res.json({ success: true, message: 'Permissions updated' })
  } catch (error: any) {
    const status = error.message.includes('Invalid') ? 400 : 500
    res.status(status).json({ error: error.message || 'Failed to update permissions' })
  }
})

/**
 * GET /api/api-keys/:id/stats
 * Usage statistics for a specific key
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const stats = await ApiKeyService.getApiKeyStats(userId, id)
    if (!stats) {
      return res.status(404).json({ error: 'API key not found' })
    }

    res.json({ success: true, data: stats })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get stats' })
  }
})

export default router
