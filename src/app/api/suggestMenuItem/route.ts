import { NextRequest, NextResponse } from 'next/server';

/**
 * MenuItem represents a suggested menu item
 */
interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  matchReason?: string;
}

/**
 * Request body structure
 */
interface SuggestMenuRequest {
  answer1: string;
  answer2: string;
}

/**
 * POST /api/suggestMenuItem
 *
 * Processes quiz answers and suggests menu items based on the responses.
 *
 * Example request body:
 * {
 *   "answer1": "spicy",
 *   "answer2": "chicken"
 * }
 *
 * Returns: Array of suggested menu items
 */
export async function POST(request: NextRequest) {
  try {
    const body: SuggestMenuRequest = await request.json();

    // Validate inputs
    if (!body.answer1 || typeof body.answer1 !== 'string') {
      return NextResponse.json(
        { error: 'answer1 is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.answer2 || typeof body.answer2 !== 'string') {
      return NextResponse.json(
        { error: 'answer2 is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.answer1.trim().length === 0 || body.answer2.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answers cannot be empty' },
        { status: 400 }
      );
    }

    // Process answers and generate menu suggestions
    const suggestions = generateMenuSuggestions(
      body.answer1.trim(),
      body.answer2.trim()
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
 * Generate menu item suggestions based on quiz answers
 *
 * TODO: Replace this placeholder logic with:
 * - Database queries based on preferences
 * - AI-powered recommendation engine
 * - User preference matching algorithm
 * - Menu item filtering and ranking system
 */
function generateMenuSuggestions(
  answer1: string,
  answer2: string
): MenuItem[] {
  // Sample menu database (replace with actual database/API)
  const menuDatabase: MenuItem[] = [
    {
      id: 'm1',
      name: 'Spicy Chicken Wings',
      description: 'Crispy wings tossed in our signature hot sauce',
      category: 'appetizers',
      tags: ['spicy', 'chicken', 'crispy', 'hot'],
    },
    {
      id: 'm2',
      name: 'Grilled Chicken Caesar Salad',
      description: 'Fresh romaine with grilled chicken and parmesan',
      category: 'salads',
      tags: ['chicken', 'healthy', 'salad', 'grilled'],
    },
    {
      id: 'm3',
      name: 'Szechuan Chicken Stir-Fry',
      description: 'Spicy stir-fried chicken with vegetables',
      category: 'mains',
      tags: ['spicy', 'chicken', 'asian', 'vegetables'],
    },
    {
      id: 'm4',
      name: 'Mild Herb Chicken',
      description: 'Tender chicken with herbs and lemon',
      category: 'mains',
      tags: ['chicken', 'mild', 'herbs', 'healthy'],
    },
    {
      id: 'm5',
      name: 'Buffalo Chicken Pizza',
      description: 'Pizza topped with spicy buffalo chicken',
      category: 'mains',
      tags: ['spicy', 'chicken', 'pizza', 'buffalo'],
    },
    {
      id: 'm6',
      name: 'Vegetable Curry',
      description: 'Spicy vegetable curry with rice',
      category: 'mains',
      tags: ['spicy', 'vegetarian', 'curry', 'vegetables'],
    },
  ];

  // Normalize answers for matching
  const answer1Lower = answer1.toLowerCase();
  const answer2Lower = answer2.toLowerCase();

  // Score and filter menu items based on answers
  const scoredItems = menuDatabase.map(item => {
    let score = 0;
    const matchedTags: string[] = [];

    // Check if answers match tags
    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(answer1Lower) ||
            answer1Lower.includes(tag.toLowerCase())) {
          score += 2;
          matchedTags.push(tag);
        }
        if (tag.toLowerCase().includes(answer2Lower) ||
            answer2Lower.includes(tag.toLowerCase())) {
          score += 2;
          matchedTags.push(tag);
        }
      }
    }

    // Check name and description for partial matches
    const searchText = `${item.name} ${item.description}`.toLowerCase();
    if (searchText.includes(answer1Lower)) score += 1;
    if (searchText.includes(answer2Lower)) score += 1;

    return {
      item,
      score,
      matchedTags: [...new Set(matchedTags)], // remove duplicates
    };
  });

  // Filter items with score > 0 and sort by score (highest first)
  const suggestions = scoredItems
    .filter(scored => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(scored => ({
      ...scored.item,
      matchReason: scored.matchedTags.length > 0
        ? `Matches your preferences: ${scored.matchedTags.join(', ')}`
        : 'Based on your answers',
    }));

  // If no matches found, return top general recommendations
  if (suggestions.length === 0) {
    return menuDatabase.slice(0, 3).map(item => ({
      ...item,
      matchReason: 'Popular choice',
    }));
  }

  return suggestions;
}
