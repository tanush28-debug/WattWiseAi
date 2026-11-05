import { forecastService } from '../services/forecastService.js';

export const forecastController = {
  /**
   * GET /api/v1/forecast/demand
   */
  async getForecast(req, res, next) {
    try {
      const horizon = req.query.horizon || 30;
      const forecast = await forecastService.getForecast(req.user, req.supabase, horizon);
      res.json({
        success: true,
        data: forecast,
      });
    } catch (err) {
      next(err);
    }
  }
};

