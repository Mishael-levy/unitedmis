import {
  AIProcessingRequest,
  AIProcessingResponse,
  GeneratedExercise,
  ExerciseType,
  DifficultyLevel,
} from '@/types/ai-learning';

/**
 * Service for integrating with AI APIs to generate exercises from uploaded content
 * Supports multiple AI providers: OpenAI, Anthropic Claude, Google Gemini, or local solution
 */

interface AIConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'local';
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
}

class AIContentProcessor {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Main method to process uploaded content and generate exercises
   */
  async processContent(request: AIProcessingRequest): Promise<AIProcessingResponse> {
    const startTime = Date.now();

    try {
      // Extract and clean content
      const cleanedContent = this.cleanContent(request.content);

      // Analyze content structure
      const contentAnalysis = await this.analyzeContent(
        cleanedContent,
        request.subject
      );

      // Generate exercises based on analysis
      const exercises = await this.generateExercises(
        cleanedContent,
        contentAnalysis,
        request
      );

      // Calculate learning time estimate (rough estimate: 2-3 minutes per exercise)
      const estimatedLearningTime = exercises.length * 2.5;

      return {
        contentId: request.contentId,
        exercises,
        summary: contentAnalysis.summary,
        keyTopics: contentAnalysis.topics,
        estimatedLearningTime: Math.round(estimatedLearningTime),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error processing content with AI:', error);
      throw new Error(
        `Failed to process content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clean and preprocess the content
   */
  private cleanContent(content: string): string {
    // Remove extra whitespace
    let cleaned = content.replace(/\s+/g, ' ').trim();

    // Remove special characters but keep important punctuation
    cleaned = cleaned.replace(/[^\w\s.,!?;:\-()[\]{}]/g, '');

    return cleaned;
  }

  /**
   * Analyze content to extract structure and key topics
   */
  private async analyzeContent(
    content: string,
    subject: string
  ): Promise<{
    summary: string;
    topics: string[];
    structure: string[];
  }> {
    // This would call the AI API to analyze content
    // For now, returning a simple analysis structure

    const contentLength = content.length;
    const sentenceCount = (content.match(/[.!?]+/g) || []).length;
    const words = content.split(/\s+/);
    const wordCount = words.length;

    return {
      summary: `Analyzed ${wordCount} words across ${sentenceCount} sentences in the subject: ${subject}`,
      topics: this.extractKeyTopics(content, subject),
      structure: this.identifyContentStructure(content),
    };
  }

  /**
   * Extract key topics from content
   */
  private extractKeyTopics(content: string, subject: string): string[] {
    // Simple keyword extraction - in production, use NLP
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const frequency: { [key: string]: number } = {};

    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Identify content structure (headers, sections, etc.)
   */
  private identifyContentStructure(content: string): string[] {
    const sections: string[] = [];

    // Split by common delimiters
    const parts = content.split(/\n\n+|\.\s+[A-Z]|:\s+/);

    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        sections.push(trimmed);
      }
    });

    return sections.slice(0, 5); // Return first 5 sections
  }

  /**
   * Generate exercises based on content analysis and request parameters
   */
  private async generateExercises(
    content: string,
    analysis: any,
    request: AIProcessingRequest
  ): Promise<GeneratedExercise[]> {
    const exercises: GeneratedExercise[] = [];
    const exerciseTypesToUse = request.preferredExerciseTypes.length
      ? request.preferredExerciseTypes
      : this.getDefaultExerciseTypes();

    // Generate exercises based on request
    for (let i = 0; i < request.numberOfExercises; i++) {
      const difficulty = this.selectDifficulty(
        request.targetDifficulty,
        i,
        request.numberOfExercises
      );
      const exerciseType =
        exerciseTypesToUse[i % exerciseTypesToUse.length];

      const exercise = await this.createExercise(
        content,
        analysis,
        exerciseType,
        difficulty,
        request.subject,
        i
      );

      exercises.push(exercise);
    }

    return exercises;
  }

  /**
   * Create a single exercise
   */
  private async createExercise(
    content: string,
    analysis: any,
    type: ExerciseType,
    difficulty: DifficultyLevel,
    subject: string,
    index: number
  ): Promise<GeneratedExercise> {
    const contentSnippet = this.extractContentSnippet(content, index);
    const topic = analysis.topics[index % analysis.topics.length];

    switch (type) {
      case 'multiple-choice':
        return this.createMultipleChoice(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      case 'fill-blank':
        return this.createFillBlank(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      case 'matching':
        return this.createMatching(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      case 'true-false':
        return this.createTrueFalse(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      case 'short-answer':
        return this.createShortAnswer(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      case 'ordering':
        return this.createOrdering(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );

      default:
        return this.createMultipleChoice(
          contentSnippet,
          difficulty,
          subject,
          topic,
          index
        );
    }
  }

  /**
   * Extract a snippet of content for the exercise
   */
  private extractContentSnippet(content: string, index: number): string {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());
    const snippetStart = (index * 3) % sentences.length;
    return sentences
      .slice(snippetStart, snippetStart + 3)
      .join('. ')
      .trim();
  }

  /**
   * Create multiple choice exercise
   */
  private createMultipleChoice(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    const questions = [
      `What is the main concept related to "${topic}" in the context of "${subject}"?`,
      `According to the material, what defines "${topic}"?`,
      `Which statement best describes "${topic}"?`,
      `What can be inferred about "${topic}" from the text?`,
      `In the context of "${subject}", how is "${topic}" characterized?`,
    ];

    const question = questions[index % questions.length];

    return {
      id: `ex-mc-${index}-${Date.now()}`,
      contentId: '',
      type: 'multiple-choice',
      question,
      options: [
        'Option A related to the correct answer',
        'Option B as a distractor',
        'Option C as a distractor',
        'Option D as the correct answer',
      ],
      correctAnswer: 3,
      explanation: `This answer is correct because it directly relates to the key concept of ${topic} mentioned in the study material.`,
      difficulty,
      topic,
      keywords: [topic],
    };
  }

  /**
   * Create fill-in-the-blank exercise
   */
  private createFillBlank(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    return {
      id: `ex-fb-${index}-${Date.now()}`,
      contentId: '',
      type: 'fill-blank',
      question: `The concept of ${topic} in ${subject} can be understood as _____.`,
      correctAnswer: 'a fundamental principle that applies across various contexts',
      explanation: `The blank should be filled with a definition or description of ${topic} that relates to the main concepts of ${subject}.`,
      difficulty,
      topic,
      keywords: [topic],
    };
  }

  /**
   * Create matching exercise
   */
  private createMatching(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    return {
      id: `ex-mt-${index}-${Date.now()}`,
      contentId: '',
      type: 'matching',
      question: `Match the terms related to "${topic}" with their correct definitions`,
      options: [
        'Term 1: Definition A',
        'Term 2: Definition B',
        'Term 3: Definition C',
      ],
      correctAnswer: ['A', 'B', 'C'],
      explanation: `The correct matches show the relationship between key concepts in ${topic} within the subject of ${subject}.`,
      difficulty,
      topic,
      keywords: [topic],
    };
  }

  /**
   * Create true/false exercise
   */
  private createTrueFalse(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    return {
      id: `ex-tf-${index}-${Date.now()}`,
      contentId: '',
      type: 'true-false',
      question: `True or False: ${topic} is a core concept in ${subject} that requires understanding multiple related principles.`,
      correctAnswer: 'true',
      explanation: `This statement is true because ${topic} encompasses multiple interconnected concepts within ${subject}.`,
      difficulty,
      topic,
      keywords: [topic],
    };
  }

  /**
   * Create short answer exercise
   */
  private createShortAnswer(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    return {
      id: `ex-sa-${index}-${Date.now()}`,
      contentId: '',
      type: 'short-answer',
      question: `Explain the significance of ${topic} in the field of ${subject} in 2-3 sentences.`,
      correctAnswer: `${topic} is significant in ${subject} because it provides foundational understanding and practical applications in various contexts.`,
      explanation: `A good answer should reference the main concepts and demonstrate understanding of why ${topic} matters in ${subject}.`,
      difficulty,
      topic,
      keywords: [topic, subject],
    };
  }

  /**
   * Create ordering exercise
   */
  private createOrdering(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    return {
      id: `ex-or-${index}-${Date.now()}`,
      contentId: '',
      type: 'ordering',
      question: `Arrange the following steps related to ${topic} in the correct order:`,
      options: ['Step 1: Initial concept', 'Step 2: Application', 'Step 3: Evaluation'],
      correctAnswer: ['0', '1', '2'],
      explanation: `The correct sequence shows the logical progression of understanding and applying ${topic} in ${subject}.`,
      difficulty,
      topic,
      keywords: [topic],
    };
  }

  /**
   * Get default exercise types if none specified
   */
  private getDefaultExerciseTypes(): ExerciseType[] {
    return [
      'multiple-choice',
      'fill-blank',
      'true-false',
      'matching',
      'short-answer',
    ];
  }

  /**
   * Select appropriate difficulty based on position and request
   */
  private selectDifficulty(
    targetDifficulties: DifficultyLevel[],
    index: number,
    total: number
  ): DifficultyLevel {
    if (!targetDifficulties.length) {
      // Default progression: easy -> medium -> hard
      if (index < total * 0.33) return 'easy';
      if (index < total * 0.66) return 'medium';
      return 'hard';
    }

    return targetDifficulties[index % targetDifficulties.length];
  }
}

// Export singleton instance
let processorInstance: AIContentProcessor | null = null;

export function initializeAIProcessor(config: AIConfig): AIContentProcessor {
  processorInstance = new AIContentProcessor(config);
  return processorInstance;
}

export function getAIProcessor(): AIContentProcessor {
  if (!processorInstance) {
    throw new Error('AI Processor not initialized. Call initializeAIProcessor first.');
  }
  return processorInstance;
}

export { AIContentProcessor };
