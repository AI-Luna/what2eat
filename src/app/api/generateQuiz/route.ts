import { NextRequest, NextResponse } from 'next/server';

/**
 * QuizQuestion represents a single question with its answer
 */
interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Request body structure
 */
interface GenerateQuizRequest {
  input: string;
  count?: number; // optional: number of questions to generate
}

/**
 * POST /api/generateQuiz
 *
 * Generates quiz questions based on input text.
 *
 * Example request body:
 * {
 *   "input": "JavaScript is a programming language...",
 *   "count": 5  // optional, defaults to 3
 * }
 *
 * Returns: Array of question-answer objects
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuizRequest = await request.json();

    // Validate input
    if (!body.input || typeof body.input !== 'string') {
      return NextResponse.json(
        { error: 'Input string is required' },
        { status: 400 }
      );
    }

    if (body.input.trim().length === 0) {
      return NextResponse.json(
        { error: 'Input string cannot be empty' },
        { status: 400 }
      );
    }

    const questionCount = body.count || 3;

    // TODO: Replace with actual quiz generation logic
    // This is a template - integrate with AI service, database, or custom logic
    const quizQuestions: QuizQuestion[] = generateQuestionsFromInput(
      body.input,
      questionCount
    );

    return NextResponse.json(quizQuestions, { status: 200 });
  } catch (error) {
    console.error('Error generating quiz:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}

/**
 * Generate quiz questions from input text
 *
 * TODO: Replace this placeholder logic with:
 * - AI/LLM integration (OpenAI, Anthropic, etc.)
 * - NLP processing
 * - Database lookup
 * - Custom question generation algorithm
 */
function generateQuestionsFromInput(
  input: string,
  count: number
): QuizQuestion[] {
  // Placeholder implementation - generates example questions
  const questions: QuizQuestion[] = [];

  // Extract some basic info from input for demonstration
  const wordCount = input.split(/\s+/).length;
  const hasNumbers = /\d/.test(input);
  const firstWord = input.trim().split(/\s+/)[0];

  // Generate sample questions (replace with actual logic)
  const templates = [
    {
      question: `What is the main topic discussed in: "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"?`,
      answer: 'Replace with extracted topic',
      category: 'comprehension',
      difficulty: 'easy' as const,
    },
    {
      question: `How many words are in the provided text?`,
      answer: `${wordCount} words`,
      category: 'analysis',
      difficulty: 'easy' as const,
    },
    {
      question: `What is the first word in the input text?`,
      answer: firstWord,
      category: 'detail',
      difficulty: 'easy' as const,
    },
    {
      question: `Does the text contain numerical values?`,
      answer: hasNumbers ? 'Yes' : 'No',
      category: 'analysis',
      difficulty: 'easy' as const,
    },
  ];

  // Return requested number of questions
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    questions.push({
      id: `q${i + 1}`,
      ...templates[i],
    });
  }

  return questions;
}
