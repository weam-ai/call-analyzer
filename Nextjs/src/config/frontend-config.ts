/**
 * Frontend Configuration
 * Centralized configuration for environment variables and constants
 */

import path from 'path';
import dotenv from 'dotenv';

// Load dotenv only on server side
if (typeof window === 'undefined') {
  // Load from root .env file (one level up from Nextjs directory)
  dotenv.config({ path: path.join(process.cwd(), '..', '.env') });
}

interface FrontendConfig {
  environment: string;
  basePath: string;
  apiUrl: string;
  cookieName: string;
  cookiePassword: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const frontendConfig: FrontendConfig = {
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/call-analyzer',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  cookieName: process.env.NEXT_PUBLIC_COOKIE_NAME || 'weam',
  cookiePassword: process.env.NEXT_PUBLIC_COOKIE_PASSWORD || 'YczgOhDJQj0RRDR3ASnvOVoQUBV0PtSz',
  isDevelopment: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production',
};

// Validation
const validateConfig = (): void => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
};

// Validate configuration on import
validateConfig();

export default frontendConfig;

// Export individual config properties for convenience
export const { environment, basePath, apiUrl, cookieName, cookiePassword, isDevelopment, isProduction } = frontendConfig;
