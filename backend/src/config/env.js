import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

// 1. Load .env.example first as defaults (no override — .env always wins)
const exampleEnvPath = path.resolve(backendRoot, '.env.example');
if (fs.existsSync(exampleEnvPath)) {
  dotenv.config({ path: exampleEnvPath });
}

// 2. Load backend/.env with override so it takes priority over .env.example
const envPath = path.resolve(backendRoot, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3001';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendOrigin,
  frontendOrigins: parseOrigins(frontendOrigin),
  
  supabase: {
    url: process.env.SUPABASE_URL || 'https://vxvgrtyvnulgnpcaadry.supabase.co',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_WpFw-SjHnKMG639HhtPHaw_R3jVrBTq',
    secretKey: process.env.SUPABASE_SECRET_KEY || null,
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ].join(','))
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '90000', 10),
  }
};

export default config;
