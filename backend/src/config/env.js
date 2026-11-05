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

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
  
  supabase: {
    url: process.env.SUPABASE_URL || 'https://vxvgrtyvnulgnpcaadry.supabase.co',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_WpFw-SjHnKMG639HhtPHaw_R3jVrBTq',
    secretKey: process.env.SUPABASE_SECRET_KEY || null,
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  }
};

export default config;
