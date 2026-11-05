import { analyticsService } from '../services/analyticsService.js';
import { gridService } from '../services/gridService.js';

export const analyticsController = {
  /**
   * GET /api/v1/analytics/consumer/overview
   */
  async getConsumerOverview(req, res, next) {
    try {
      const data = await analyticsService.getConsumerOverview(req.user, req.supabase);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/analytics/consumption
   */
  async getConsumptionHistory(req, res, next) {
    try {
      const timeframe = req.query.timeframe || 'monthly';
      const historyResult = await analyticsService.getConsumptionHistory(req.user, req.supabase, timeframe);
      res.json({
        success: true,
        data: historyResult.data,
        summary: historyResult.summary,
        hasData: historyResult.hasData,
        isDemo: historyResult.isDemo,
        timeframe: historyResult.timeframe,
        hasGranularData: historyResult.hasGranularData,
        granularityNote: historyResult.granularityNote,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/analytics/carbon
   */
  async getCarbonMetrics(req, res, next) {
    try {
      const data = await analyticsService.getCarbonMetrics(req.user, req.supabase);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/analytics/grid-monitor
   * Public official Indian electricity grid telemetry (CEA & NPP)
   */
  async getGridMonitor(req, res, next) {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await gridService.getGridMonitor(forceRefresh);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
};
