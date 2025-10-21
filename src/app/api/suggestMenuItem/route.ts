import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getUserDietaryPreferences, formatDietaryPreferencesForPrompt } from '@/lib/clerk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Suggest Menu Item API
 *
 * This API endpoint analyzes user preferences from quiz questions and answers to recommend
 * personalized menu items from a restaurant's menu.
 *
 * Input:
 * - menuItems: Array of available menu items with their details (name, description, tags, etc.)
 * - questionsAndAnswers: String containing the user's responses to preference questions
 *   describing how they're feeling (e.g., spice preference, protein choice, dietary needs)
 *
 * Output:
 * - description: A narrative string explaining the recommended dishes and reasoning
 *   behind each suggestion based on the user's preferences
 * - selectedItems: Array of menu item objects that best match the user's preferences
 * - alternateChoices: Array of additional menu items that are good alternatives
 *
 * The algorithm matches user preferences against menu item attributes to provide
 * personalized recommendations with explanations for each suggestion.
 */

/**
 * MenuItem represents a menu item
 * Must match the structure from processMenu API
 */
interface MenuItem {
  name: string;
  description: string | null;
  course: string | null; // e.g., appetizers, mains, desserts
  price: number | null;
}

/**
 * Request body structure
 */
interface SuggestMenuRequest {
  menuItems: MenuItem[];
  questionsAndAnswers: string;
}

/**
 * Response structure
 */
interface SuggestMenuResponse {
  description: string;
  selectedItems: MenuItem[];
  alternateChoices: MenuItem[];
}

/**
 * POST /api/suggestMenuItem
 *
 * Processes quiz answers and suggests menu items based on user preferences.
 *
 * Example request body:
 * {
 *   "menuItems": [array of menu item objects],
 *   "questionsAndAnswers": "Q: How hungry are you? A: Very hungry\nQ: What flavors? A: Spicy..."
 * }
 *
 * Returns: {
 *   "description": "Personalized explanation of recommendations",
 *   "selectedItems": [2-3 best matching menu items],
 *   "alternateChoices": [2-3 alternative menu items]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: SuggestMenuRequest = await request.json();

    // Validate inputs
    if (!body.menuItems || !Array.isArray(body.menuItems)) {
      return NextResponse.json(
        { error: 'menuItems is required and must be an array' },
        { status: 400 }
      );
    }

    if (body.menuItems.length === 0) {
      return NextResponse.json(
        { error: 'menuItems cannot be empty' },
        { status: 400 }
      );
    }

    if (!body.questionsAndAnswers || typeof body.questionsAndAnswers !== 'string') {
      return NextResponse.json(
        { error: 'questionsAndAnswers is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.questionsAndAnswers.trim().length === 0) {
      return NextResponse.json(
        { error: 'questionsAndAnswers cannot be empty' },
        { status: 400 }
      );
    }

    // Generate menu suggestions using OpenAI
    const suggestions = await generateMenuSuggestions(
      body.menuItems,
      body.questionsAndAnswers.trim()
    );

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Error suggesting menu items:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to suggest menu items' },
      { status: 500 }
    );
  }
}

/**
 * Generate menu item suggestions using OpenAI GPT-4
 *
 * Uses AI to analyze user preferences from quiz responses and match them
 * with available menu items to provide personalized recommendations.
 */
async function generateMenuSuggestions(
  menuItems: MenuItem[],
  questionsAndAnswers: string
): Promise<SuggestMenuResponse> {
  // Get user's dietary preferences
  const dietaryPreferences = await getUserDietaryPreferences();
  const dietaryInfo = formatDietaryPreferencesForPrompt(dietaryPreferences);

  // Read prompt from file
  const promptPath = join(process.cwd(), 'src/app/api/suggestMenuItem/prompt.txt');
  const promptTemplate = readFileSync(promptPath, 'utf-8');

  // Replace placeholders with actual data and append dietary info
  const prompt = promptTemplate
    .replace('${questionsAndAnswers}', questionsAndAnswers)
    .replace('${menuItems}', JSON.stringify(menuItems, null, 2)) + dietaryInfo;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful restaurant assistant that provides personalized menu recommendations. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  const result = JSON.parse(responseContent) as SuggestMenuResponse;
  return result;
}
