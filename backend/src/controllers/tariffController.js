import { tariffEngine } from '../services/tariffEngine.js';

export const tariffController = {
  /**
   * GET /api/v1/tariffs/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await tariffEngine.getCategories(req.supabase);
      res.json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/tariffs/simulate
   */
  async simulate(req, res, next) {
    try {
      const { consumptionKWh, tariffId, peakUsagePercent, comparisonTariffId } = req.body;
      const result = tariffEngine.simulate({
        consumptionKWh,
        tariffId,
        peakUsagePercent,
        comparisonTariffId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
};

