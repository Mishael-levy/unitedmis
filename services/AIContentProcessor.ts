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
 * Supports multiple AI providers: OpenAI, Anthropic Claude, Google Gemini, Groq, or local solution
 */

interface AIConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'groq' | 'local';
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
   * Extract key topics from content - IMPROVED
   */
  private extractKeyTopics(content: string, subject: string): string[] {
    // Filter common Hebrew words that aren't meaningful topics
    const commonWords = [
      'את', 'של', 'על', 'עם', 'לא', 'גם', 'או', 'כי', 'אם', 'הוא', 'היא', 'הם', 'הן',
      'זה', 'זו', 'אלה', 'כל', 'רק', 'עוד', 'מה', 'מי', 'איך', 'למה', 'כמה', 'אבל',
      'אך', 'לכן', 'משום', 'היה', 'היו', 'יהיה', 'להיות', 'אותו', 'אותה', 'אלו',
      'כאשר', 'בין', 'תוך', 'אחרי', 'לפני', 'כמו', 'יותר', 'פחות', 'כדי', 'באופן',
      'לפי', 'בכל', 'עצמו', 'עצמה', 'שלו', 'שלה', 'שלהם', 'מכל', 'אצל', 'נגד',
      'בלי', 'עד', 'מתוך', 'לגבי', 'במקום', 'בזמן', 'הזה', 'הזו', 'הזאת', 'ההוא',
      'שהוא', 'שהיא', 'שהם', 'שהן', 'כבר', 'עדיין', 'כלל', 'בכלל', 'ממש', 'מאוד',
      'הרבה', 'קצת', 'בערך', 'אולי', 'כנראה', 'בטח', 'ודאי', 'מעט', 'מספיק',
      'להם', 'להן', 'לנו', 'לכם', 'אליו', 'אליה', 'אליהם', 'אלינו', 'ממנו', 'ממנה',
      'איזה', 'איזו', 'אילו', 'שום', 'משהו', 'מישהו', 'כלום', 'אף', 'כזה', 'כזו',
      'such', 'that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'would',
      'could', 'should', 'there', 'their', 'about', 'which', 'when', 'where', 'what',
    ];
    
    const words = content
      .split(/\s+/)
      .map(w => w.replace(/[.,;:!?()"\[\]{}]/g, '')) // Remove punctuation
      .filter((w) => w.length > 3 && !commonWords.includes(w.toLowerCase()));

    const frequency: { [key: string]: number } = {};

    words.forEach((word) => {
      // Normalize word but keep original case for display
      const normalized = word.toLowerCase();
      if (!frequency[normalized]) {
        frequency[normalized] = 0;
      }
      frequency[normalized]++;
    });

    // Get top words by frequency, prefer longer words
    return Object.entries(frequency)
      .filter(([word, count]) => count >= 2 || word.length > 5) // Must appear twice or be longer
      .sort(([wordA, countA], [wordB, countB]) => {
        // Sort by count, then by word length
        if (countB !== countA) return countB - countA;
        return wordB.length - wordA.length;
      })
      .slice(0, 15)
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

    // Try Groq first (if configured as primary) - it's free and fast!
    if (this.config.provider === 'groq' && this.config.apiKey) {
      console.log('🟢 Attempting Groq API...');
      const groqResult = await this.callGroqAPI(prompt, request.contentId, analysis);
      if (groqResult) {
        console.log('✅ Groq API succeeded');
        return groqResult;
      }
      console.log('❌ Groq API failed');
    }

    // Try Gemini (if configured as primary)
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
   * Call Groq API - Free and fast AI!
   */
  private async callGroqAPI(
    prompt: string,
    contentId: string,
    analysis: any
  ): Promise<GeneratedExercise[] | null> {
    try {
      const model = this.config.model || 'llama-3.3-70b-versatile';
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'אתה עוזר ליצירת תרגילים חינוכיים בעברית. תמיד החזר JSON תקין בלבד.'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.8,
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      console.log('Groq API response status:', response.status);

      if (!response.ok) {
        const errorMessage = data?.error?.message || 'Unknown Groq API error';
        console.error('Groq API error:', errorMessage);
        return null;
      }

      const responseText = data.choices?.[0]?.message?.content || '';
      console.log('Groq response length:', responseText.length);
      return this.parseExercisesFromResponse(responseText, contentId, analysis);
      
    } catch (error) {
      console.error('Groq API error:', error);
      return null;
    }
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
   * Create multiple choice exercise - IMPROVED with variety
   */
  private createMultipleChoice(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    // Question templates for variety
    const questionTemplates = [
      { template: 'definition', prefix: 'מהי ההגדרה הנכונה של' },
      { template: 'meaning', prefix: 'מה המשמעות של' },
      { template: 'purpose', prefix: 'מהי המטרה העיקרית של' },
      { template: 'characteristic', prefix: 'מה מאפיין את' },
      { template: 'difference', prefix: 'מה ההבדל בין' },
      { template: 'example', prefix: 'מהי דוגמה ל' },
      { template: 'result', prefix: 'מה התוצאה של' },
      { template: 'reason', prefix: 'מדוע' },
      { template: 'when', prefix: 'מתי משתמשים ב' },
      { template: 'who', prefix: 'מי אחראי על' },
      { template: 'where', prefix: 'היכן מתבצע' },
      { template: 'how', prefix: 'כיצד פועל' },
    ];
    
    const templateIndex = index % questionTemplates.length;
    const selectedTemplate = questionTemplates[templateIndex];
    
    if (sentences.length === 0) {
      const fallbackOptions = [topic, 'מושג אחר', 'רעיון שונה', 'תפיסה נוספת'];
      const shuffled = this.shuffleOptionsWithAnswer(fallbackOptions, 0);
      return {
        id: `ex-mc-${index}-${Date.now()}`,
        contentId: '',
        type: 'multiple-choice',
        question: `${selectedTemplate.prefix} "${topic}" בתחום ${subject}?`,
        options: shuffled.options,
        correctAnswer: shuffled.correctIndex,
        explanation: `התשובה הנכונה היא "${topic}".`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    // Pick different sentence based on index
    const sentenceIndex = (index * 7) % sentences.length;
    const baseSentence = sentences[sentenceIndex].trim();
    
    // Extract meaningful words (filter short and common words)
    const commonWords = ['את', 'של', 'על', 'עם', 'לא', 'גם', 'או', 'כי', 'אם', 'הוא', 'היא', 'הם', 'הן', 'זה', 'זו', 'אלה', 'כל', 'רק', 'עוד', 'מה', 'מי', 'איך', 'למה', 'כמה', 'אבל', 'אך', 'לכן', 'משום', 'היה', 'היו', 'יהיה', 'להיות', 'אותו', 'אותה', 'אלו', 'כאשר', 'בין', 'תוך', 'אחרי', 'לפני', 'כמו', 'יותר', 'פחות'];
    const words = baseSentence.split(/\s+/).filter((w) => w && w.length > 3 && !commonWords.includes(w));
    
    // Create varied questions based on template
    let question = '';
    let correctOption = '';
    let distractors: string[] = [];
    
    if (words.length >= 3) {
      const keyWordIndex = Math.floor(Math.random() * Math.min(words.length, 5));
      correctOption = words[keyWordIndex];
      
      // Get other words as distractors
      distractors = words.filter((w, i) => i !== keyWordIndex && w !== correctOption).slice(0, 3);
      
      // Fill missing distractors
      while (distractors.length < 3) {
        distractors.push(`אפשרות ${distractors.length + 1}`);
      }
      
      // Create question based on template type
      switch (selectedTemplate.template) {
        case 'definition':
          question = `על פי החומר, מהי ההגדרה הנכונה הקשורה ל"${topic}"?`;
          break;
        case 'meaning':
          question = `מה המשמעות של הביטוי שמופיע בחומר בהקשר של "${topic}"?`;
          break;
        case 'purpose':
          question = `מהי המטרה העיקרית של "${correctOption}" כפי שמתואר בחומר?`;
          distractors = ['לשפר תהליכים', 'למנוע בעיות', 'ליצור הזדמנויות'];
          break;
        case 'characteristic':
          question = `איזה מאפיין מתאר את "${topic}" על פי החומר?`;
          break;
        case 'result':
          question = `מה קורה כתוצאה מ${baseSentence.slice(0, 40)}...?`;
          break;
        case 'reason':
          question = `מדוע ${baseSentence.slice(0, 50)}...?`;
          break;
        case 'when':
          question = `מתי מתרחש התהליך המתואר בחומר בהקשר של "${topic}"?`;
          distractors = ['בתחילת התהליך', 'בסוף התהליך', 'לפני ההכנה'];
          break;
        case 'how':
          question = `כיצד מתבצע ${baseSentence.slice(0, 40)}...?`;
          break;
        default:
          question = `על פי החומר בנושא "${topic}": ${baseSentence.slice(0, 60)}... מהי המילה הנכונה?`;
      }
    } else {
      correctOption = topic;
      distractors = ['אפשרות א', 'אפשרות ב', 'אפשרות ג'];
      question = `${selectedTemplate.prefix} "${topic}" על פי החומר?`;
    }
    
    const options = [correctOption, ...distractors.slice(0, 3)];
    const shuffled = this.shuffleOptionsWithAnswer(options, 0);
    
    return {
      id: `ex-mc-${index}-${Date.now()}`,
      contentId: '',
      type: 'multiple-choice',
      question,
      options: shuffled.options,
      correctAnswer: shuffled.correctIndex,
      explanation: `התשובה הנכונה היא "${correctOption}".`,
      difficulty,
      topic,
      keywords: [topic, correctOption],
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
   * Create fill-in-the-blank exercise - IMPROVED with variety
   */
  private createFillBlank(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    // Different fill-blank templates
    const templates = [
      { type: 'complete', prefix: 'השלם את המשפט:' },
      { type: 'missing', prefix: 'מהי המילה החסרה:' },
      { type: 'define', prefix: 'השלם את ההגדרה:' },
      { type: 'connect', prefix: 'השלם את הקשר:' },
    ];
    
    const selectedTemplate = templates[index % templates.length];
    
    if (sentences.length === 0) {
      return {
        id: `ex-fb-${index}-${Date.now()}`,
        contentId: '',
        type: 'fill-blank',
        question: `${selectedTemplate.prefix} התוכן בנושא ${subject} עוסק ב_____`,
        correctAnswer: topic,
        explanation: `המילה החסרה היא "${topic}".`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    // Use different sentences for variety
    const sentenceIndex = (index * 5 + 3) % sentences.length;
    const sentence = sentences[sentenceIndex].trim();
    
    // Filter common Hebrew words
    const commonWords = ['את', 'של', 'על', 'עם', 'לא', 'גם', 'או', 'כי', 'אם', 'הוא', 'היא', 'הם', 'הן', 'זה', 'זו', 'כל', 'רק', 'עוד', 'היה', 'היו', 'אלה', 'אלו', 'כאשר', 'בין', 'תוך', 'אחרי', 'לפני', 'כמו'];
    const words = sentence.split(/\s+/).filter(w => w && w.length > 3 && !commonWords.includes(w));
    
    if (words.length < 3) {
      return {
        id: `ex-fb-${index}-${Date.now()}`,
        contentId: '',
        type: 'fill-blank',
        question: `${selectedTemplate.prefix} ${sentence} מתייחס ל_____`,
        correctAnswer: topic,
        explanation: `המילה החסרה קשורה ל${topic}.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    // Pick meaningful word to blank out (not first or last)
    const blankIndex = 1 + Math.floor(Math.random() * (words.length - 2));
    const correctAnswer = words[blankIndex];
    
    // Create sentence with blank
    const sentenceWithBlank = sentence.replace(correctAnswer, '_____');
    
    return {
      id: `ex-fb-${index}-${Date.now()}`,
      contentId: '',
      type: 'fill-blank',
      question: `${selectedTemplate.prefix} ${sentenceWithBlank}`,
      correctAnswer,
      explanation: `המילה החסרה היא "${correctAnswer}".`,
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
   * Create true/false exercise - IMPROVED with variety and false statements
   */
  private createTrueFalse(
    content: string,
    difficulty: DifficultyLevel,
    subject: string,
    topic: string,
    index: number
  ): GeneratedExercise {
    const sentences = content.split(/[.!?]+/).filter((s) => s && s.trim().length > 20);
    
    // Alternate between true and false questions
    const shouldBeFalse = index % 2 === 1;
    
    // Templates for variety
    const trueTemplates = [
      'נכון או לא נכון:',
      'האם המשפט הבא נכון?',
      'קבע אם הטענה הבאה נכונה:',
      'בדוק את נכונות הטענה:',
    ];
    
    const template = trueTemplates[index % trueTemplates.length];
    
    if (sentences.length === 0) {
      return {
        id: `ex-tf-${index}-${Date.now()}`,
        contentId: '',
        type: 'true-false',
        question: `${template} התוכן עוסק בנושא ${topic} בתחום ${subject}`,
        correctAnswer: 'נכון',
        explanation: `המשפט נכון.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    // Pick different sentence
    const sentenceIndex = (index * 3 + 2) % sentences.length;
    let statement = sentences[sentenceIndex].trim();
    
    if (shouldBeFalse) {
      // Create a false statement by modifying the original
      const modifications = [
        { find: /תמיד/g, replace: 'אף פעם לא' },
        { find: /חייב/g, replace: 'אסור' },
        { find: /ראשון/g, replace: 'אחרון' },
        { find: /לפני/g, replace: 'אחרי' },
        { find: /יותר/g, replace: 'פחות' },
        { find: /גדול/g, replace: 'קטן' },
        { find: /חשוב/g, replace: 'לא חשוב' },
      ];
      
      let modified = false;
      for (const mod of modifications) {
        if (mod.find.test(statement)) {
          statement = statement.replace(mod.find, mod.replace);
          modified = true;
          break;
        }
      }
      
      // If no modification was made, add "לא" or change meaning
      if (!modified) {
        if (statement.length > 30) {
          statement = statement.slice(0, 30) + ' - זה לא קשור ל' + subject;
        }
      }
      
      return {
        id: `ex-tf-${index}-${Date.now()}`,
        contentId: '',
        type: 'true-false',
        question: `${template} ${statement}`,
        correctAnswer: 'לא נכון',
        explanation: `המשפט אינו נכון על פי החומר.`,
        difficulty,
        topic,
        keywords: [topic],
      };
    }
    
    return {
      id: `ex-tf-${index}-${Date.now()}`,
      contentId: '',
      type: 'true-false',
      question: `${template} ${statement}`,
      correctAnswer: 'נכון',
      explanation: `המשפט נכון על פי החומר.`,
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
