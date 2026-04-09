/**
 * Centralized configuration constants for client-side
 * All hardcoded values should be defined here for easy modification
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT_MS: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  TESTS_LIMIT: 12,
  RESULTS_LIMIT: 10,
  DASHBOARD_TESTS_LIMIT: 6,
  DASHBOARD_RESULTS_LIMIT: 5,
  VIDEOS_LIMIT: 20,
};

// Exam Configuration
export const EXAM_CONFIG = {
  DEFAULT_DURATION_MINUTES: 60,
  LOW_TIME_THRESHOLD_SECONDS: 120,    // 2 minutes
  CRITICAL_TIME_THRESHOLD_SECONDS: 30, // 30 seconds
};

// Cache TTL (Time-to-live in milliseconds)
export const CACHE_TTL = {
  CATEGORIES: 60 * 60 * 1000,    // 1 hour
  TESTS: 5 * 60 * 1000,          // 5 minutes
  LEADERBOARD: 5 * 60 * 1000,    // 5 minutes
  USER_RESULTS: 2 * 60 * 1000,   // 2 minutes
};

// Categories (shared across components)
export const CATEGORIES = [
  'SSC',
  'Railway',
  'Banking',
  'UPSC',
  'Defence',
  'State PSC',
  'Teaching',
  'Other'
];

// Question Status Colors
export const QUESTION_STATUS = {
  unattempted: { 
    bg: 'var(--bg-elevated)', 
    color: 'var(--text-secondary)', 
    border: 'var(--border-base)' 
  },
  answered: { 
    bg: 'var(--success)', 
    color: 'white', 
    border: 'transparent' 
  },
  review: { 
    bg: 'var(--warning)', 
    color: '#000', 
    border: 'transparent' 
  },
  'answered-review': { 
    bg: 'var(--accent)', 
    color: 'white', 
    border: 'transparent' 
  },
};

// Difficulty Colors
export const DIFFICULTY_COLORS = {
  Easy: {
    bg: 'var(--success-muted)',
    color: 'var(--success)',
  },
  Medium: {
    bg: 'var(--warning-muted)',
    color: 'var(--warning)',
  },
  Hard: {
    bg: 'var(--danger-muted)',
    color: 'var(--danger)',
  },
};

export default {
  API_CONFIG,
  PAGINATION,
  EXAM_CONFIG,
  CACHE_TTL,
  CATEGORIES,
  QUESTION_STATUS,
  DIFFICULTY_COLORS,
};
