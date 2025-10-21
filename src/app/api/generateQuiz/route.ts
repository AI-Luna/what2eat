import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getUserDietaryPreferences, formatDietaryPreferencesForPrompt } from '@/lib/clerk';

/**
 * QuizQuestion represents a single question with its answer
 */
interface QuizQuestion {
  question: string;
  questionType: "multiple-choice" | "anything";
}

/**
 * Request body structure
 */
interface GenerateQuizRequest {
  menu: string;
}

/**
 * OpenAI response structure
 */
interface OpenAIQuizResponse {
  questions: QuizQuestion[];
}

/**
 * POST /api/generateQuiz
 *
 * Generates quiz questions based on menu input using OpenAI GPT-4o-mini.
 *
 * Example request body:
 * {
 *   "menu": "Pizza Margherita - $12, Caesar Salad - $8, Pasta Carbonara - $15"
 * }
 *
 * Returns: Array of question-answer objects
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuizRequest = await request.json();

    // Validate input
    if (!body.menu || typeof body.menu !== 'string') {
      return NextResponse.json(
        { error: 'Menu string is required' },
        { status: 400 }
      );
    }

    if (body.menu.trim().length === 0) {
      return NextResponse.json(
        { error: 'Menu string cannot be empty' },
        { status: 400 }
      );
    }

    // Generate quiz questions using OpenAI GPT-4o-mini
    const quizQuestions: QuizQuestion[] = await generateQuestionsFromMenu(
      body.menu
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
 * Generate quiz questions from menu using OpenAI GPT-4o-mini
 */
async function generateQuestionsFromMenu(
  menu: string
): Promise<QuizQuestion[]> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Get user's dietary preferences
  const dietaryPreferences = await getUserDietaryPreferences();
  const dietaryInfo = formatDietaryPreferencesForPrompt(dietaryPreferences);

  // Read prompt from file
  const promptPath = join(process.cwd(), 'src/app/api/generateQuiz/prompt.txt');
  const promptTemplate = readFileSync(promptPath, 'utf-8');

  // Replace ${menu} placeholder with actual menu and append dietary info
  const prompt = promptTemplate.replace('${menu}', menu) + dietaryInfo;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates quiz questions from restaurant menus. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse: OpenAIQuizResponse = JSON.parse(responseText);
    
    // Validate the response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure each question has the required fields
    const validQuestions = parsedResponse.questions.filter(q => 
      q.question && 
      typeof q.question === 'string'
    );

    return validQuestions;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate quiz questions from OpenAI');
  }
}
