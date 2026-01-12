import {
  AIProcessingRequest,
  AIProcessingResponse,
  GeneratedExercise,
  ExerciseType,
  DifficultyLevel,
  QuestionFeedback,
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
  // Fallback configuration
  fallbackOpenAIKey?: string;
  fallbackOpenAIModel?: string;
}

class AIContentProcessor {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Main method to process uploaded content and generate exercises
   */
  async processContent(
    request: AIProcessingRequest,
    goodExamples?: QuestionFeedback[]
  ): Promise<AIProcessingResponse> {
    const startTime = Date.now();

    try {
      // Extract and clean content
      const cleanedContent = this.cleanContent(request.content);

      // Analyze content structure
      const contentAnalysis = await this.analyzeContent(
        cleanedContent,
        request.subject
      );

      // Generate exercises based on analysis, using good examples if available
      const exercises = await this.generateExercises(
        cleanedContent,
        contentAnalysis,
        request,
        goodExamples
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

    // Remove special characters but keep Hebrew, English, numbers and important punctuation
    // Keep: Hebrew letters (א-ת), English letters (a-zA-Z), numbers, whitespace, and basic punctuation
    cleaned = cleaned.replace(/[^\u0590-\u05FFa-zA-Z0-9\s.,!?;:\-()[\]{}'"]/g, '');

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
    request: AIProcessingRequest,
    goodExamples?: QuestionFeedback[]
  ): Promise<GeneratedExercise[]> {
    // Use real AI API if configured
    if (this.config.provider !== 'local' && this.config.apiKey) {
      return await this.generateExercisesWithAI(content, analysis, request, goodExamples);
    }

    // Fallback to local generation
    return this.generateLocalExercises(content, analysis, request);
  }

  /**
   * Generate exercises using real AI API (Gemini, OpenAI, etc.) with fallback
   */
  private async generateExercisesWithAI(
    content: string,
    analysis: any,
    request: AIProcessingRequest,
    goodExamples?: QuestionFeedback[]
  ): Promise<GeneratedExercise[]> {
    // Build examples section if we have good feedback
    let examplesSection = '';
    if (goodExamples && goodExamples.length > 0) {
      const examples = goodExamples
        .slice(0, 3)
        .map((ex) => `- "${ex.questionText}"`)
        .join('\n');
      examplesSection = `

דוגמאות לשאלות טובות שקיבלו משוב חיובי מהמשתמשים:
${examples}

נסה ליצור שאלות באיכות דומה.`;
    }

    // Generate random seed for variety
    const randomSeed = Math.floor(Math.random() * 10000);
    const sessionId = Date.now();

    const prompt = `אתה מורה מומחה שיוצר תרגילים מחומר לימוד.

חומר הלימוד:
${content.slice(0, 3000)}

נושא: ${request.subject}
רמת קושי מועדפת: ${request.targetDifficulty}
מספר תרגילים: ${request.numberOfExercises}
${examplesSection}

מזהה סשן: ${sessionId}-${randomSeed}
חשוב מאוד: צור שאלות שונות לגמרי מכל סשן קודם. היה יצירתי ומגוון!

צור ${request.numberOfExercises} תרגילים איכותיים ומקוריים בעברית על סמך החומר.
כל תרגיל חייב להיות מבוסס ישירות על התוכן שלמעלה.
חשוב: אל תחשוף את התשובה בתוך השאלה עצמה.
השתמש בניסוחים שונים, זוויות שונות והיבטים שונים של החומר.

החזר JSON בפורמט הבא:
{
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "שאלה בעברית על התוכן",
      "options": ["תשובה 1", "תשובה 2", "תשובה 3", "תשובה 4"],
      "correctAnswer": 0,
      "explanation": "הסבר מפורט בעברית",
      "difficulty": "medium",
      "topic": "נושא מהתוכן",
      "keywords": ["מילת מפתח 1", "מילת מפתח 2"]
    }
  ]
}

סוגי תרגילים אפשריים: multiple-choice, true-false, fill-blank
רמות קושי: easy, medium, hard`;

    // Try Gemini first (if configured as primary)
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      console.log('🔵 Attempting Gemini API...');
      const geminiResult = await this.callGeminiAPI(prompt, request.contentId, analysis);
      if (geminiResult) {
        console.log('✅ Gemini API succeeded');
        return geminiResult;
      }
      console.log('❌ Gemini API failed');
    }

    // Try OpenAI as fallback (or primary if configured)
    const openaiKey = this.config.provider === 'openai' ? this.config.apiKey : this.config.fallbackOpenAIKey;
    const openaiModel = this.config.provider === 'openai' ? this.config.model : this.config.fallbackOpenAIModel;
    
    if (openaiKey) {
      console.log('🟡 Attempting OpenAI API...');
      const openaiResult = await this.callOpenAIAPI(prompt, request.contentId, analysis, openaiKey, openaiModel);
      if (openaiResult) {
        console.log('✅ OpenAI API succeeded');
        return openaiResult;
      }
      console.log('❌ OpenAI API failed');
    }

    // Fallback to local generation
    console.log('🟠 Falling back to local generation...');
    return this.generateLocalExercises(content, analysis, request);
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiAPI(
    prompt: string,
    contentId: string,
    analysis: any
  ): Promise<GeneratedExercise[] | null> {
    const modelName = this.config.model || 'gemini-2.5-flash';
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.config.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.95,
                maxOutputTokens: 2048,
                topP: 0.95,
                topK: 40,
              },
            }),
          }
        );

        const data = await response.json();
        console.log('Gemini API response status:', response.status);

        if (response.status === 503) {
          console.log(`Gemini API overloaded, attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return null; // Return null to trigger fallback
        }

        if (!response.ok) {
          const errorMessage = data?.error?.message || 'Unknown Gemini API error';
          console.error('Gemini API error:', errorMessage);
          return null;
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return this.parseExercisesFromResponse(responseText, contentId, analysis);
        
      } catch (fetchError) {
        console.error(`Gemini attempt ${attempt} error:`, fetchError);
        if (attempt === maxRetries) {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAIAPI(
    prompt: string,
    contentId: string,
    analysis: any,
    apiKey: string,
    model?: string
  ): Promise<GeneratedExercise[] | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      console.log('OpenAI API response status:', response.status);

      if (!response.ok) {
        const errorMessage = data?.error?.message || 'Unknown OpenAI API error';
        console.error('OpenAI API error:', errorMessage);
        return null;
      }

      const responseText = data.choices?.[0]?.message?.content || '';
      return this.parseExercisesFromResponse(responseText, contentId, analysis);
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  /**
   * Parse exercises from AI response
   */
  private parseExercisesFromResponse(
    responseText: string,
    contentId: string,
    analysis: any
  ): GeneratedExercise[] | null {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"exercises"[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Parsed JSON match found');
        const parsed = JSON.parse(jsonMatch[0]);
        const exercises = parsed.exercises.map((ex: any, index: number) => ({
          id: `ex-ai-${index}-${Date.now()}`,
          contentId: contentId,
          type: ex.type || 'multiple-choice',
          question: ex.question,
          options: ex.options,
          correctAnswer: ex.correctAnswer,
          explanation: ex.explanation,
          difficulty: ex.difficulty || 'medium',
          topic: ex.topic || analysis.topics[0] || 'general',
          keywords: ex.keywords || [],
        }));

        if (exercises.length > 0) {
          console.log('First exercise:', JSON.stringify(exercises[0], null, 2));
          return exercises;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }
    return null;
  }

  /**
   * Generate exercises locally (without AI API)
   */
  private async generateLocalExercises(
    content: string,
    analysis: any,
    request: AIProcessingRequest
  ): Promise<GeneratedExercise[]> {
    const exercises: GeneratedExercise[] = [];
    const exerciseTypesToUse = request.preferredExerciseTypes.length
      ? request.preferredExerciseTypes
      : this.getDefaultExerciseTypes();

    for (let i = 0; i < request.numberOfExercises; i++) {
      const difficulty = this.selectDifficulty(
        request.targetDifficulty,
        i,
        request.numberOfExercises
      );
      const exerciseType = exerciseTypesToUse[i % exerciseTypesToUse.length];

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
    // Extract a sentence from the content
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    if (sentences.length === 0) {
      const fallbackOptions = [topic, 'מושג אחר', 'רעיון שונה', 'תפיסה נוספת'];
      const shuffled = this.shuffleOptionsWithAnswer(fallbackOptions, 0);
      return {
        id: `ex-mc-${index}-${Date.now()}`,
        contentId: '',
        type: 'multiple-choice',
        question: `מהו המושג המרכזי הקשור ל${topic} ב${subject}?`,
        options: shuffled.options,
        correctAnswer: shuffled.correctIndex,
        explanation: `התשובה הנכונה היא "${topic}" כי זה המושג המרכזי בחומר הלימוד.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    const sentenceIndex = index % sentences.length;
    const baseSentence = sentences[sentenceIndex].trim();
    
    // Extract key words from the sentence
    const words = baseSentence.split(/\s+/).filter((w) => w && w.length > 3);
    const keyWord = words.length > 0 ? words[Math.floor(words.length / 2)] : topic;

    const question = `על פי החומר, ${baseSentence.slice(0, 100)}... מהו המושג המרכזי?`;

    // Generate options based on content
    const correctOption = keyWord;
    const distractors = words.slice(0, 3).filter(w => w !== keyWord);
    
    // Create options array with correct answer at index 0 initially
    const options = [
      correctOption,
      distractors[0] || 'אופציה 1',
      distractors[1] || 'אופציה 2',
      distractors[2] || 'אופציה 3',
    ];
    
    // Shuffle options and track correct answer position
    const shuffled = this.shuffleOptionsWithAnswer(options, 0);
    
    return {
      id: `ex-mc-${index}-${Date.now()}`,
      contentId: '',
      type: 'multiple-choice',
      question,
      options: shuffled.options,
      correctAnswer: shuffled.correctIndex,
      explanation: `התשובה הנכונה היא "${correctOption}" כי זה המושג המרכזי שמוזכר בחומר הלימוד בהקשר של ${topic}.`,
      difficulty,
      topic,
      keywords: [topic, keyWord],
    };
  }

  /**
   * Shuffle options and return new correct answer index
   */
  private shuffleOptionsWithAnswer(options: string[], correctIndex: number): { options: string[], correctIndex: number } {
    const correctAnswer = options[correctIndex];
    
    // Fisher-Yates shuffle
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Find new position of correct answer
    const newCorrectIndex = shuffled.indexOf(correctAnswer);
    
    return {
      options: shuffled,
      correctIndex: newCorrectIndex
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
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    if (sentences.length === 0) {
      return {
        id: `ex-fb-${index}-${Date.now()}`,
        contentId: '',
        type: 'fill-blank',
        question: `השלם: התוכן עוסק ב_____ בתחום ${subject}`,
        correctAnswer: topic,
        explanation: `המילה החסרה היא "${topic}" כפי שמופיע בחומר הלימוד.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    const sentenceIndex = (index * 3) % sentences.length;
    const sentence = sentences[sentenceIndex].trim();
    const words = sentence.split(/\s+/).filter(w => w && w.length > 2);
    
    if (words.length < 3) {
      return {
        id: `ex-fb-${index}-${Date.now()}`,
        contentId: '',
        type: 'fill-blank',
        question: `השלם: ${sentence} _____`,
        correctAnswer: topic,
        explanation: `המילה החסרה קשורה למושג ${topic}.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    const blankIndex = Math.floor(words.length / 2);
    const correctAnswer = words[blankIndex];
    
    // Create sentence with blank
    const sentenceWithBlank = [
      ...words.slice(0, blankIndex),
      '_____',
      ...words.slice(blankIndex + 1)
    ].join(' ');
    
    return {
      id: `ex-fb-${index}-${Date.now()}`,
      contentId: '',
      type: 'fill-blank',
      question: `השלם את המשפט: ${sentenceWithBlank}`,
      correctAnswer,
      explanation: `המילה החסרה היא "${correctAnswer}" כפי שמופיע בחומר הלימוד. זה קשור למושג ${topic}.`,
      difficulty,
      topic,
      keywords: [topic, correctAnswer],
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
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 15);
    const options = sentences.slice(index, index + 3).map((s, i) => 
      `${i + 1}. ${s.trim().slice(0, 50)}...`
    );
    
    return {
      id: `ex-mt-${index}-${Date.now()}`,
      contentId: '',
      type: 'matching',
      question: `התאם את המשפטים למושגים הקשורים ל"${topic}"`,
      options: options.length === 3 ? options : [
        '1. מושג ראשון מהחומר',
        '2. מושג שני מהחומר',
        '3. מושג שלישי מהחומר',
      ],
      correctAnswer: ['A', 'B', 'C'],
      explanation: `ההתאמות הנכונות מראות את הקשר בין המושגים המרכזיים ב${topic} במסגרת ${subject}.`,
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
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    if (sentences.length === 0) {
      return {
        id: `ex-tf-${index}-${Date.now()}`,
        contentId: '',
        type: 'true-false',
        question: `נכון או לא נכון: התוכן קשור ל${topic}`,
        correctAnswer: 'true',
        explanation: `המשפט מתייחס למושג ${topic} בהקשר של ${subject}.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    const sentenceIndex = (index * 2) % sentences.length;
    const statement = sentences[sentenceIndex].trim();
    
    return {
      id: `ex-tf-${index}-${Date.now()}`,
      contentId: '',
      type: 'true-false',
      question: `נכון או לא נכון: ${statement}`,
      correctAnswer: 'true',
      explanation: `המשפט הזה מופיע בחומר הלימוד ולכן הוא נכון. הוא מתייחס למושג ${topic} בהקשר של ${subject}.`,
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
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const sentenceIndex = (index * 4) % sentences.length;
    const contextSentence = sentences[sentenceIndex].trim();
    
    return {
      id: `ex-sa-${index}-${Date.now()}`,
      contentId: '',
      type: 'short-answer',
      question: `הסבר את המשמעות של "${topic}" על פי החומר הבא: "${contextSentence.slice(0, 80)}..."`,
      correctAnswer: topic,
      explanation: `תשובה טובה צריכה להתייחס למושגים המרכזיים שמוזכרים בחומר ולהסביר את הקשר שלהם ל${topic}.`,
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
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 15);
    const options = sentences.slice(index, index + 4).map((s, i) => s.trim());
    
    return {
      id: `ex-or-${index}-${Date.now()}`,
      contentId: '',
      type: 'ordering',
      question: `סדר את המשפטים הבאים לפי סדר הופעתם בחומר:`,
      options: options.length >= 3 ? options.slice(0, 3) : [
        'משפט ראשון מהחומר',
        'משפט שני מהחומר',
        'משפט שלישי מהחומר',
      ],
      correctAnswer: ['0', '1', '2'],
      explanation: `הסדר הנכון עוקב אחר הרצף שבו המידע מופיע בחומר הלימוד. זה קשור למושג ${topic}.`,
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
