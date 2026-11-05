import { industrialService } from '../services/industrialService.js';

export const industrialController = {
  async getOverview(req, res, next) {
    try {
      const data = await industrialService.getOverview(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getFacilities(req, res, next) {
    try {
      const data = await industrialService.getFacilities(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async addFacility(req, res, next) {
    try {
      const data = await industrialService.addFacility(req.body, req.user, req.supabase);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMachines(req, res, next) {
    try {
      const data = await industrialService.getMachines(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async addMachine(req, res, next) {
    try {
      const data = await industrialService.addMachineEntry(req.body, req.user, req.supabase);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAnomalies(req, res, next) {
    try {
      const data = await industrialService.getAnomalies(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getOptimization(req, res, next) {
    try {
      const data = await industrialService.getOptimizationScenarios(req.user, req.supabase);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async generateReport(req, res, next) {
    try {
      const data = await industrialService.generateReport(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

