import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { QuizQuestion } from '@/types/quiz';
import { openAIRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * QuizQuestion represents a single question with its answer
 */
interface AIQuizQuestion {
  question: string;
  answers: string[];
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
  questions: AIQuizQuestion[];
}

/**
 * Standard questions that should always be at the front of the quiz
 */
const STANDARD_QUESTIONS: QuizQuestion[] = [
  {
    "question": "How hungry are you?",
    "answers": [
      "Girl dinner. Just vibes and crumbs.",
      "Appetizer energy only.",
      "Regular human hungry.",
      "I could eat a cow."
    ]
  },
  {
    "question": "Do you have any dietary restrictions?",
    "answers": [
      "Vegetarian",
      "Vegan",
      "Gluten-free (celiac disease)",
      "Lactose intolerant",
      "Kosher",
      "Halal",
      "Low sodium",
      "Diabetic-friendly/Low sugar"
    ]
  },
  {
    "question": "Calorie Preference",
    "answers": [
      "Caloric deficit — gotta watch my carbs.",
      "Caloric maintenance — I'll have what they're having.",
      "Caloric surplus — I'm not watching my waist.",
      "No clue, just feed me good food."
    ]
  }
];

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
    // Rate limiting
    const clientIP = getClientIP(request);
    const { success, limit, reset, remaining } = await openAIRateLimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.round((reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      );
    }

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
    const aiQuestions: QuizQuestion[] = await generateQuestionsFromMenu(
      body.menu
    );

    // Combine standard questions (at front) with AI-generated questions
    const allQuestions = [...STANDARD_QUESTIONS, ...aiQuestions];
    
    console.log(`Returning ${allQuestions.length} total questions (${STANDARD_QUESTIONS.length} standard + ${aiQuestions.length} AI-generated)`);

    return NextResponse.json(allQuestions, { status: 200 });
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
  // const dietaryPreferences = await getUserDietaryPreferences();
  // const dietaryInfo = formatDietaryPreferencesForPrompt(dietaryPreferences);
  const dietaryInfo = ''; // No dietary preferences for now

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

    // Parse the JSON response with better error handling
    let parsedResponse: OpenAIQuizResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', responseText);
      throw new Error('OpenAI returned invalid JSON response');
    }
    
    // Validate the response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure each question has the required fields and convert to QuizQuestion format
    const validQuestions: QuizQuestion[] = parsedResponse.questions
      .filter(q => {
        // Check basic structure
        if (!q.question || typeof q.question !== 'string') return false;
        if (!q.answers || !Array.isArray(q.answers)) return false;
        
        // Ensure we have exactly 4 answers as specified in prompt
        if (q.answers.length !== 4) {
          console.warn(`Question has ${q.answers.length} answers, expected 4:`, q.question);
          return false;
        }
        
        // Ensure all answers are strings
        return q.answers.every(answer => typeof answer === 'string' && answer.trim().length > 0);
      })
      .map(q => ({
        question: q.question,
        answers: q.answers
      }));

    // If no valid questions were generated, log warning but don't fail
    if (validQuestions.length === 0) {
      console.warn('No valid AI questions generated, will return only standard questions');
    } else {
      console.log(`Generated ${validQuestions.length} AI questions`);
    }

    return validQuestions;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate quiz questions from OpenAI');
  }
}
