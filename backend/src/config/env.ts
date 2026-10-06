import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local .env

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codesync',
  USE_SQLITE_FALLBACK: process.env.USE_SQLITE_FALLBACK !== 'false',
  SQLITE_PATH: process.env.SQLITE_PATH || path.resolve(__dirname, '../../../database/codesync.sqlite'),
  JWT_SECRET: process.env.JWT_SECRET || 'codesync-btech-cse-jwt-secret-key-2026',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
  LLM_MODEL: process.env.LLM_MODEL || 'gemini-1.5-pro'
};
