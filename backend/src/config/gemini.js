import { config } from './env.js';

export const isGeminiConfigured = Boolean(config.gemini.apiKey);

export const geminiConfig = {
  apiKey: config.gemini.apiKey,
  modelName: config.gemini.model,
  fallbackModels: config.gemini.fallbackModels,
  timeoutMs: config.gemini.timeoutMs,
  isAvailable: isGeminiConfigured,
};

export default geminiConfig;

