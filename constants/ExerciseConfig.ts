import { ExerciseType, DifficultyLevel } from '@/types/ai-learning';

/**
 * Configuration and constants for the AI-Powered Educational Platform
 */

export const EXERCISE_CONFIG = {
  // Default exercise generation parameters
  DEFAULT_EXERCISES_PER_CONTENT: 10,
  MIN_EXERCISES_PER_CONTENT: 5,
  MAX_EXERCISES_PER_CONTENT: 50,

  // Exercise type distribution (in percentages)
  EXERCISE_TYPE_DISTRIBUTION: {
    'multiple-choice': 35,
    'fill-blank': 25,
    'true-false': 20,
    'matching': 10,
    'short-answer': 8,
    'ordering': 2,
  } as Record<ExerciseType, number>,

  // Default difficulty distribution
  DIFFICULTY_DISTRIBUTION: {
    easy: 30,
    medium: 50,
    hard: 18,
    expert: 2,
  } as Record<DifficultyLevel, number>,

  // Minimum content length requirements
  MIN_CONTENT_LENGTH: 100, // characters
  MAX_CONTENT_LENGTH: 1000000, // 1MB equivalent

  // Supported file types
  SUPPORTED_FILE_TYPES: ['pdf', 'text', 'document', 'image'] as const,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

  // Exercise option counts
  MULTIPLE_CHOICE_OPTIONS: 4,
  MATCHING_ITEMS: 3,
  FILL_BLANK_MIN_LENGTH: 2,
  FILL_BLANK_MAX_LENGTH: 100,
};

export const SPACED_REPETITION_CONFIG = {
  // SM-2 Algorithm constants
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  MAXIMUM_EASE_FACTOR: 5.0,

  // Initial intervals (days)
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 3,

  // Interval multiplier for more/less frequent reviews
  INTERVAL_MULTIPLIER: 1.5,

  // Quality score thresholds (0-5)
  PASS_THRESHOLD: 3, // 3+ is considered passing

  // Statistics
  STATISTICS_WINDOW_DAYS: 7,
  RETENTION_GOAL: 0.9, // 90% retention rate
};

export const DIFFICULTY_ADAPTATION_CONFIG = {
  // Thresholds for difficulty adjustment
  IMPROVE_THRESHOLD: 0.8, // 80% correct rate
  DECLINE_THRESHOLD: 0.4, // 40% correct rate

  // Confidence score calculation weights
  CORRECTNESS_WEIGHT: 40,
  SPEED_WEIGHT: 30,
  HISTORY_WEIGHT: 30,

  // Speed categories
  SPEED_FAST: 0.5, // < 50% of average time
  SPEED_NORMAL: 1.0, // ~100% of average time
  SPEED_SLOW: 2.0, // > 200% of average time

  // Time spent bonus/penalty (seconds)
  OPTIMAL_TIME_VARIANCE: 0.3, // ±30%
};

export const GAMIFICATION_CONFIG = {
  // XP System
  XP_CORRECT_ANSWER: 10,
  XP_FIRST_TRY: 5,
  XP_SPEED_BONUS: 5,
  XP_STREAK_MULTIPLIER: 1.1, // 10% bonus per streak level

  // Streak configuration
  STREAK_RESET_DAYS: 1, // Reset if not reviewed in X days
  STREAK_FREEZE_ENABLED: true,
  STREAK_FREEZE_COST: 50, // XP to freeze streak

  // Badge achievements
  BADGES: {
    FIRST_EXERCISE: 'first_exercise',
    TEN_CORRECT: 'ten_correct',
    HUNDRED_XP: 'hundred_xp',
    WEEK_STREAK: 'week_streak',
    MONTH_STREAK: 'month_streak',
    PERFECT_SCORE: 'perfect_score',
    SPEED_DEMON: 'speed_demon',
    KNOWLEDGE_MASTER: 'knowledge_master',
  },

  // Points required for achievements
  BADGE_REQUIREMENTS: {
    first_exercise: 1,
    ten_correct: 10,
    hundred_xp: 100,
    week_streak: 7,
    month_streak: 30,
    perfect_score: 100, // % correct on a subject
    speed_demon: 50, // exercises below average time
    knowledge_master: 1000, // total XP
  },
};

export const UI_CONFIG = {
  // Colors
  COLORS: {
    PRIMARY: '#FF6B35',
    SECONDARY: '#004E89',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    DANGER: '#f44336',
    LIGHT: '#f9f9f9',
    DARK: '#333333',
  },

  // Animation durations (ms)
  ANIMATION_DURATION: 300,
  TRANSITION_DURATION: 500,

  // Spacing
  PADDING_SMALL: 8,
  PADDING_MEDIUM: 16,
  PADDING_LARGE: 24,

  // Border radius
  BORDER_RADIUS_SMALL: 4,
  BORDER_RADIUS_MEDIUM: 8,
  BORDER_RADIUS_LARGE: 12,
};

export const NOTIFICATION_CONFIG = {
  // Notification triggers
  REMIND_DUE_EXERCISES: true,
  REMIND_MORNING_TIME: '08:00', // HH:MM
  REMIND_EVENING_TIME: '20:00',

  // Notification messages
  MESSAGES: {
    NEW_CONTENT_READY: 'תוכנך עוד לתרגול!',
    DUE_EXERCISES: 'יש לך תרגילים חדשים לתרגול',
    STREAK_REMINDER: 'שמור על הפסדך!',
    ACHIEVEMENT_UNLOCKED: 'הישגים חדשים!',
    DAILY_GOAL: 'הגעת ליעד היומי!',
  },

  // Frequency
  MAX_NOTIFICATIONS_PER_DAY: 3,
};

export const API_CONFIG = {
  // AI Provider settings
  AI_PROVIDERS: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    },
    claude: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-pro', 'gemini-1.5-pro'],
    },
  },

  // Request timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 60000, // 60 seconds for file uploads

  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: 60,
  RATE_LIMIT_UPLOADS_PER_HOUR: 10,

  // Retry policy
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  RETRY_BACKOFF: 2, // exponential multiplier
};

export const SUBJECT_AREAS = [
  {
    id: 'math',
    name: 'מתמטיקה',
    emoji: '🔢',
    color: '#FF6B35',
  },
  {
    id: 'physics',
    name: 'פיזיקה',
    emoji: '⚛️',
    color: '#004E89',
  },
  {
    id: 'chemistry',
    name: 'כימיה',
    emoji: '🧪',
    color: '#44AF69',
  },
  {
    id: 'biology',
    name: 'ביולוגיה',
    emoji: '🧬',
    color: '#F8961E',
  },
  {
    id: 'literature',
    name: 'ספרות',
    emoji: '📚',
    color: '#9D4EDD',
  },
  {
    id: 'history',
    name: 'היסטוריה',
    emoji: '📜',
    color: '#C1121F',
  },
  {
    id: 'geography',
    name: 'גיאוגרפיה',
    emoji: '🌍',
    color: '#2A9D8F',
  },
  {
    id: 'programming',
    name: 'תכנות',
    emoji: '💻',
    color: '#264653',
  },
  {
    id: 'english',
    name: 'אנגלית',
    emoji: '🌐',
    color: '#457B9D',
  },
  {
    id: 'arts',
    name: 'אומנות',
    emoji: '🎨',
    color: '#E76F51',
  },
  {
    id: 'sports',
    name: 'ספורט',
    emoji: '⚽',
    color: '#06A77D',
  },
  {
    id: 'other',
    name: 'אחר',
    emoji: '✨',
    color: '#A8DADC',
  },
];

/**
 * Get configuration for a specific AI provider
 */
export function getAIProviderConfig(provider: string) {
  return API_CONFIG.AI_PROVIDERS[provider as keyof typeof API_CONFIG.AI_PROVIDERS];
}

/**
 * Get subject area by ID
 */
export function getSubjectArea(id: string) {
  return SUBJECT_AREAS.find((s) => s.id === id);
}

/**
 * Calculate XP for an exercise
 */
export function calculateXP(
  isCorrect: boolean,
  isFirstTry: boolean = true,
  isFast: boolean = false,
  streakLevel: number = 0
): number {
  let xp = 0;

  if (isCorrect) {
    xp += GAMIFICATION_CONFIG.XP_CORRECT_ANSWER;
    if (isFirstTry) {
      xp += GAMIFICATION_CONFIG.XP_FIRST_TRY;
    }
    if (isFast) {
      xp += GAMIFICATION_CONFIG.XP_SPEED_BONUS;
    }
    if (streakLevel > 0) {
      xp = Math.round(xp * Math.pow(GAMIFICATION_CONFIG.XP_STREAK_MULTIPLIER, streakLevel));
    }
  }

  return xp;
}

/**
 * Get exercise types for a session
 */
export function getExerciseTypesForSession(
  count: number
): ExerciseType[] {
  const distribution = EXERCISE_CONFIG.EXERCISE_TYPE_DISTRIBUTION;
  const types: ExerciseType[] = [];

  const typeEntries = Object.entries(distribution) as [ExerciseType, number][];
  const totalPercentage = typeEntries.reduce((sum, [, percent]) => sum + percent, 0);

  typeEntries.forEach(([type, percent]) => {
    const typeCount = Math.round((count * percent) / totalPercentage);
    types.push(...Array(typeCount).fill(type));
  });

  // Shuffle and return correct count
  return types.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Get difficulty distribution for a session
 */
export function getDifficultyDistribution(
  count: number
): DifficultyLevel[] {
  const distribution = EXERCISE_CONFIG.DIFFICULTY_DISTRIBUTION;
  const difficulties: DifficultyLevel[] = [];

  const diffEntries = Object.entries(distribution) as [DifficultyLevel, number][];
  const totalPercentage = diffEntries.reduce((sum, [, percent]) => sum + percent, 0);

  diffEntries.forEach(([difficulty, percent]) => {
    const diffCount = Math.round((count * percent) / totalPercentage);
    difficulties.push(...Array(diffCount).fill(difficulty));
  });

  // Shuffle and return correct count
  return difficulties.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Validate content before processing
 */
export function validateContent(content: string, fileType: string): { valid: boolean; error?: string } {
  if (content.length < EXERCISE_CONFIG.MIN_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `תוכן קצר מדי. דרוש לפחות ${EXERCISE_CONFIG.MIN_CONTENT_LENGTH} תווים.`,
    };
  }

  if (content.length > EXERCISE_CONFIG.MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `תוכן ארוך מדי. מקסימום ${EXERCISE_CONFIG.MAX_CONTENT_LENGTH} תווים.`,
    };
  }

  if (!EXERCISE_CONFIG.SUPPORTED_FILE_TYPES.includes(fileType as any)) {
    return {
      valid: false,
      error: `סוג קובץ לא תומך: ${fileType}`,
    };
  }

  return { valid: true };
}
