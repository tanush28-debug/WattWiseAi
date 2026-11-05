import { config } from './env.js';

export const isGeminiConfigured = Boolean(config.gemini.apiKey);

export const geminiConfig = {
  apiKey: config.gemini.apiKey,
  modelName: 'gemini-1.5-flash',
  isAvailable: isGeminiConfigured,
};

export default geminiConfig;

