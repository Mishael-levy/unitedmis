import { SpacedRepetitionSchedule } from '@/types/ai-learning';

/**
 * Implementation of the SM-2 (SuperMemo 2) algorithm for spaced repetition
 * This helps optimize long-term retention by scheduling reviews at optimal intervals
 */

interface PerformanceQuality {
  correct: boolean;
  confidence: number; // 0-100
  timeSpent: number; // seconds
}

export class SpacedRepetitionEngine {
  // SM-2 algorithm constants
  private readonly INITIAL_EASE_FACTOR = 2.5;
  private readonly MINIMUM_EASE_FACTOR = 1.3;
  private readonly INTERVAL_MULTIPLIER = 1.5; // Adjust for more/less frequent reviews

  /**
   * Calculate the next review date based on SM-2 algorithm
   */
  calculateNextReview(
    currentSchedule: SpacedRepetitionSchedule | null,
    performance: PerformanceQuality
  ): SpacedRepetitionSchedule {
    const now = Date.now();

    if (!currentSchedule) {
      // First review
      return {
        exerciseId: '',
        userId: '',
        nextReviewDate: now + this.daysToMs(1), // 1 day
        interval: 1,
        easeFactor: this.INITIAL_EASE_FACTOR,
        repetitionCount: 1,
        lastReviewDate: now,
      };
    }

    // SM-2 algorithm calculation
    const quality = this.calculateQuality(performance);
    const newEaseFactor = this.calculateNewEaseFactor(
      currentSchedule.easeFactor,
      quality
    );

    let interval: number;
    if (quality < 3) {
      // Failed - reset interval
      interval = 1;
    } else if (currentSchedule.repetitionCount === 0) {
      interval = 1;
    } else if (currentSchedule.repetitionCount === 1) {
      interval = 3;
    } else {
      // Apply SM-2 formula: I(n) = I(n-1) * EF
      interval = Math.round(currentSchedule.interval * newEaseFactor);
    }

    return {
      exerciseId: currentSchedule.exerciseId,
      userId: currentSchedule.userId,
      nextReviewDate: now + this.daysToMs(interval),
      interval,
      easeFactor: newEaseFactor,
      repetitionCount: quality >= 3 ? currentSchedule.repetitionCount + 1 : 1,
      lastReviewDate: now,
    };
  }

  /**
   * Calculate quality score (0-5) based on performance
   * This drives the SM-2 algorithm
   */
  private calculateQuality(performance: PerformanceQuality): number {
    if (!performance.correct) {
      return Math.max(0, performance.confidence < 30 ? 0 : 2);
    }

    // Correct answer
    if (performance.confidence >= 90) return 5; // Perfect
    if (performance.confidence >= 75) return 4; // Good
    if (performance.confidence >= 50) return 3; // Acceptable
    return 2; // Barely correct
  }

  /**
   * Calculate new ease factor using SM-2 formula
   * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   */
  private calculateNewEaseFactor(currentEF: number, quality: number): number {
    const newEF =
      currentEF + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    return Math.max(this.MINIMUM_EASE_FACTOR, newEF);
  }

  /**
   * Convert days to milliseconds
   */
  private daysToMs(days: number): number {
    return days * 24 * 60 * 60 * 1000;
  }

  /**
   * Get exercises that need review today
   */
  getDueExercises(schedules: SpacedRepetitionSchedule[]): SpacedRepetitionSchedule[] {
    const now = Date.now();
    return schedules.filter((schedule) => schedule.nextReviewDate <= now);
  }

  /**
   * Get learning statistics
   */
  getStatistics(schedules: SpacedRepetitionSchedule[]) {
    const now = Date.now();
    const today = new Date(now).toDateString();

    return {
      total: schedules.length,
      due: schedules.filter((s) => s.nextReviewDate <= now).length,
      new: schedules.filter((s) => s.repetitionCount === 0).length,
      learning: schedules.filter(
        (s) =>
          s.repetitionCount > 0 &&
          s.repetitionCount < 3 &&
          s.nextReviewDate > now
      ).length,
      review: schedules.filter(
        (s) =>
          s.repetitionCount >= 3 && s.nextReviewDate > now
      ).length,
      averageEaseFactor:
        schedules.reduce((sum, s) => sum + s.easeFactor, 0) /
        schedules.length,
    };
  }
}

/**
 * Adaptive difficulty adjustment based on learner performance
 */
export class DifficultyAdapter {
  /**
   * Suggest next exercise difficulty based on current performance
   */
  suggestNextDifficulty(
    currentDifficulty: string,
    correctRate: number, // 0-1
    confidenceScore: number // 0-100
  ): string {
    const performanceScore = correctRate * (confidenceScore / 100);

    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficulties.indexOf(currentDifficulty);

    // If performance is very good, suggest harder difficulty
    if (performanceScore > 0.8) {
      return difficulties[Math.min(currentIndex + 1, difficulties.length - 1)];
    }

    // If performance is poor, suggest easier difficulty
    if (performanceScore < 0.4) {
      return difficulties[Math.max(currentIndex - 1, 0)];
    }

    // Otherwise, keep current difficulty
    return currentDifficulty;
  }

  /**
   * Calculate confidence score based on:
   * - Time taken to answer
   * - Answer correctness
   * - Previous performance on similar topics
   */
  calculateConfidenceScore(
    isCorrect: boolean,
    timeTaken: number, // seconds
    averageTimePerExercise: number,
    previousAccuracy: number // 0-1
  ): number {
    let score = 0;

    // Correctness: 0-40 points
    if (isCorrect) {
      score += 40;
    } else {
      score += 10;
    }

    // Speed: 0-30 points
    const speedRatio = timeTaken / averageTimePerExercise;
    if (speedRatio < 0.5) {
      score += 30; // Fast
    } else if (speedRatio < 1) {
      score += 20; // Normal
    } else if (speedRatio < 2) {
      score += 10; // Slow
    } else {
      score += 0; // Very slow
    }

    // Previous accuracy: 0-30 points
    score += previousAccuracy * 30;

    return Math.round(score);
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.due > 5) {
      recommendations.push('יש לך הרבה תרגילים המחכים לחזרה. התחל עם הם!');
    }

    if (stats.learning > 10) {
      recommendations.push('אתה בתהליך כבד של למידה. שקול להוסיף עוד זמן תרגול.');
    }

    if (stats.new > 0) {
      recommendations.push('יש לך תרגילים חדשים לתרגול. נסה אותם כיום!');
    }

    if (stats.averageEaseFactor < 1.5) {
      recommendations.push(
        'כנראה שהתוכן קשה לך. שקול לחזור לחומר בסיסי יותר.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('אתה עושה עבודה מעולה! המשך כך!');
    }

    return recommendations;
  }
}

// Export singleton instances
let spacedRepetitionEngine: SpacedRepetitionEngine | null = null;
let difficultyAdapter: DifficultyAdapter | null = null;

export function getSpacedRepetitionEngine(): SpacedRepetitionEngine {
  if (!spacedRepetitionEngine) {
    spacedRepetitionEngine = new SpacedRepetitionEngine();
  }
  return spacedRepetitionEngine;
}

export function getDifficultyAdapter(): DifficultyAdapter {
  if (!difficultyAdapter) {
    difficultyAdapter = new DifficultyAdapter();
  }
  return difficultyAdapter;
}
