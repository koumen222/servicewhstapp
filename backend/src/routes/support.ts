import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.service.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = chatSchema.parse(req.body);

    // Try quick answer first
    const quickAnswer = await aiService.quickAnswer(message);
    if (quickAnswer) {
      return res.json(quickAnswer);
    }

    // Use AI for complex questions
    const result = await aiService.chat(message, conversationHistory);
    
    res.json(result);
  } catch (error) {
    console.error('💥 Support chat error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Message invalide', 
        details: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      response: "Désolé, une erreur s'est produite. Veuillez réessayer."
    });
  }
});

export default router;
