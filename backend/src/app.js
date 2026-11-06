import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

// Route modules
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import billRoutes from './routes/billRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import tariffRoutes from './routes/tariffRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import industrialRoutes from './routes/industrialRoutes.js';
import governmentRoutes from './routes/governmentRoutes.js';

export const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration: exact whitelist from FRONTEND_ORIGIN (comma-separated).
app.use(cors({
  origin: (origin, callback) => {
    // Requests without an Origin header are not browser cross-origin requests
    // (server-to-server, curl, health checks). Browsers always send Origin.
    if (!origin) return callback(null, true);

    if (config.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject by omitting CORS headers; do not fall through to a permissive default.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Controller
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'WattWise AI Node.js Express 5 Backend',
    version: '1.0.0',
    environment: config.nodeEnv,
    supabaseConfigured: Boolean(config.supabase.url && config.supabase.publishableKey),
  });
};

// Registered Health & Root Endpoints
app.get('/api/v1/health', healthHandler);
app.get('/health', healthHandler);
app.get('/', (req, res) => {
  res.json({
    service: 'WattWise AI Node.js Express 5 Backend',
    status: 'online',
    healthCheck: '/api/v1/health',
    version: '1.0.0',
  });
});

// Mount API routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/forecast', forecastRoutes);
app.use('/api/v1/tariffs', tariffRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/industrial', industrialRoutes);
app.use('/api/v1/government', governmentRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

