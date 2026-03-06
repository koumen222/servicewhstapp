import { Router, Request, Response } from 'express'
import { InstanceService } from '../../services/instanceService.js'
import { EvolutionService } from '../../services/evolutionService.js'

const router = Router()
const evolution = new EvolutionService()

// DELETE /api/instances/:instanceName - Delete WhatsApp instance
router.delete('/:instanceName', async (req: Request, res: Response) => {
  try {
    const { instanceName } = req.params

    // Get instance from DB
    const instance = await InstanceService.findByInstanceName(instanceName)
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      })
    }

    // Delete from Evolution API first
    try {
      await evolution.deleteInstance(instanceName)
    } catch (evolutionError: any) {
      console.warn('[DELETE] Failed to delete from Evolution API:', evolutionError.message)
      // Continue with DB deletion even if Evolution API fails
    }

    // Delete from MongoDB
    const deleted = await InstanceService.deleteByInstanceName(instanceName)
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete instance from database'
      })
    }

    res.json({
      success: true,
      message: 'Instance deleted successfully'
    })
  } catch (error: any) {
    console.error('[DELETE /api/instances]', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete instance',
      message: error.message
    })
  }
})

export default router
