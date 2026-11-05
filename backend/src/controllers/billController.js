import { billService } from '../services/billService.js';

export const billController = {
  /**
   * GET /api/v1/bills
   */
  async getBills(req, res, next) {
    try {
      const bills = await billService.getBills(req.user, req.supabase);
      res.json({
        success: true,
        data: bills,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/bills/upload
   */
  async uploadBill(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please supply a valid PDF, PNG, or JPG file.',
        });
      }

      const bill = await billService.uploadBill({
        file: req.file,
        user: req.user,
        scopedClient: req.supabase,
      });

      res.status(201).json({
        success: true,
        data: bill,
        message: 'Bill uploaded successfully and extracted.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/bills/:id/confirm
   * User confirms or edits extracted bill fields
   */
  async confirmBill(req, res, next) {
    try {
      const { id } = req.params;
      const result = await billService.confirmBill({
        billId: id,
        confirmedData: req.body,
        user: req.user,
        scopedClient: req.supabase,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/bills/:id
   */
  async deleteBill(req, res, next) {
    try {
      const { id } = req.params;
      const result = await billService.deleteBill(id, req.user, req.supabase);
      res.json({
        success: true,
        message: 'Bill record deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
};
