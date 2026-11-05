export const authController = {
  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user and their verified role from database
   */
  async getMe(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated.',
        });
      }

      res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          fullName: req.user.fullName,
          role: req.user.role,
          organizationId: req.user.organizationId,
          isDemo: req.user.isDemo || false,
        },
        role: req.user.role,
      });
    } catch (err) {
      next(err);
    }
  }
};

