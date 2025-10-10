/**
 * Application Constants
 * Centralized constants for the entire application
 */

// Service Types
export const SERVICE_TYPES = {
  AUDIO: 'audio',
  FATHOM: 'fathom',
  TRANSCRIPT: 'transcript',
  PHANTOM: 'phantom',
} as const

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES]

// Analysis Status
export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type AnalysisStatus = typeof ANALYSIS_STATUS[keyof typeof ANALYSIS_STATUS]

// Sentiment Types
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const

export type SentimentType = typeof SENTIMENT_TYPES[keyof typeof SENTIMENT_TYPES]

// Prompt Types
export const PROMPT_TYPES = {
  DEFAULT: 'default',
  CUSTOM: 'custom',
} as const

export type PromptType = typeof PROMPT_TYPES[keyof typeof PROMPT_TYPES]

// File Upload Limits
export const FILE_LIMITS = {
  MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/flac'
  ],
  ACCEPTED_AUDIO_EXTENSIONS: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

// Processing
export const PROCESSING = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  SCROLL_DELAY: 2.0, // 2 seconds
  PAGE_TIMEOUT: 60000, // 60 seconds
} as const

// User Agents
export const USER_AGENTS = {
  CHROME_WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  CHROME_MAC: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  FIREFOX_WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  FIREFOX_MAC: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
} as const

// Ratings
export const RATING_THRESHOLDS = {
  HIGH: 8,
  MEDIUM: 6,
  LOW: 0,
} as const

// Colors (CSS classes)
export const STATUS_COLORS = {
  pending: 'status-pending',
  processing: 'status-processing',
  completed: 'status-completed',
  failed: 'status-failed',
} as const

export const SERVICE_COLORS = {
  audio: 'service-audio',
  fathom: 'service-fathom',
  phantom: 'service-phantom',
  transcript: 'service-transcript',
} as const

