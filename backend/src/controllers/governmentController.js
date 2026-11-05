import { governmentService } from '../services/governmentService.js';

export const governmentController = {
  async getOverview(req, res, next) {
    try {
      const data = await governmentService.getOverview(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getRegionalAnalytics(req, res, next) {
    try {
      const filter = req.query.filter || 'ALL';
      const data = await governmentService.getRegionalAnalytics(filter, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getSectorAnalytics(req, res, next) {
    try {
      const data = await governmentService.getSectorAnalytics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getTariffPolicies(req, res, next) {
    try {
      const data = await governmentService.getTariffPolicies();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async saveTariffPolicy(req, res, next) {
    try {
      const data = await governmentService.saveTariffPolicy(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async simulatePolicy(req, res, next) {
    try {
      const data = governmentService.simulatePolicy(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async generateReport(req, res, next) {
    try {
      const data = await governmentService.generateReport(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

