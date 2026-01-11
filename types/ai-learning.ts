// Types for AI-powered educational platform

export type ExerciseType = 
  | 'multiple-choice'
  | 'fill-blank'
  | 'matching'
  | 'true-false'
  | 'short-answer'
  | 'ordering';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface UploadedContent {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'document' | 'image';
  fileUrl: string;
  title: string;
  description: string;
  subject: string;
  uploadedAt: number; // timestamp
  status: 'processing' | 'completed' | 'failed';
  processingError?: string;
}

export interface GeneratedExercise {
  id: string;
  contentId: string;
  type: ExerciseType;
  question: string;
  options?: string[]; // for multiple choice, matching, etc.
  correctAnswer: string | number | string[];
  explanation: string;
  difficulty: DifficultyLevel;
  topic: string; // specific topic within the content
  keywords: string[]; // key concepts covered
}

export interface StudySet {
  id: string;
  userId: string;
  contentId: string;
  title: string;
  description: string;
  subject: string;
  exercises: GeneratedExercise[];
  createdAt: number;
  updatedAt: number;
  totalExercises: number;
  completedExercises: number;
}

export interface UserProgress {
  userId: string;
  setId: string;
  exerciseId: string;
  correct: boolean;
  difficulty: DifficultyLevel;
  attemptCount: number;
  lastAttemptAt: number;
  nextReviewAt?: number; // spaced repetition
  confidenceScore: number; // 0-100
  timeSpent: number; // in seconds
}

export interface SpacedRepetitionSchedule {
  exerciseId: string;
  userId: string;
  nextReviewDate: number;
  interval: number; // days
  easeFactor: number; // SM-2 algorithm factor
  repetitionCount: number;
  lastReviewDate: number;
}

export interface LearningSession {
  id: string;
  userId: string;
  setId: string;
  startedAt: number;
  endedAt?: number;
  exercisesCompleted: number;
  correctAnswers: number;
  totalXP: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface SubjectArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  userContents: string[]; // content IDs
}

export interface AIProcessingRequest {
  contentId: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  preferredExerciseTypes: ExerciseType[];
  targetDifficulty: DifficultyLevel[];
  numberOfExercises: number;
}

export interface AIProcessingResponse {
  contentId: string;
  exercises: GeneratedExercise[];
  summary: string;
  keyTopics: string[];
  estimatedLearningTime: number; // in minutes
  processingTime: number; // in milliseconds
}
