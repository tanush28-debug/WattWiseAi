import { geminiService } from '../services/geminiService.js';

export const aiController = {
  /**
   * POST /api/v1/ai/chat
   */
  async askAdvisor(req, res, next) {
    try {
      const { message, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Message string parameter is required.',
        });
      }

      const result = await geminiService.generateEnergyAdvice({
        message,
        userContext: {
          ...(req.user || {}),
          ...(context && typeof context === 'object' ? context : {}),
        },
      });

      res.json({
        success: true,
        reply: result.reply,
        source: result.source,
        isDemo: !result.isAiConfigured,
        configNotice: result.configNotice || null,
      });
    } catch (err) {
      next(err);
    }
  }
};

