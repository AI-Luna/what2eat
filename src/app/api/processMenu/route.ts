import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * MenuItem represents a single menu item
 */
interface MenuItem {
  name: string;
  description: string | null;
  course: string | null; // e.g., appetizers, mains, desserts
  price: number | null;
}

/**
 * Request body structure - supports multiple input types
 */
interface ProcessMenuRequest {
  menuText?: string;        // Raw menu text
  imageUrl?: string;        // URL to menu image
  fileId?: string;          // Uploaded file ID (from OpenAI Files API)
  filterCourse?: string;    // Optional: filter results by course
}

/**
 * OpenAI response structure
 */
interface OpenAIMenuResponse {
  menuItems: MenuItem[];
}

/**
 * POST /api/processMenu
 *
 * Extracts structured menu data from text, images, or uploaded files using OpenAI.
 *
 * Example request body (text input):
 * {
 *   "menuText": "Caesar Salad - $12\nGrilled Salmon - $24\nChocolate Cake - $8"
 * }
 *
 * Example request body (image URL):
 * {
 *   "imageUrl": "https://example.com/menu.jpg"
 * }
 *
 * Example request body (uploaded file):
 * {
 *   "fileId": "file-abc123"
 * }
 *
 * Returns: Array of MenuItem objects
 */
export async function POST(request: NextRequest) {
  try {
    const body: ProcessMenuRequest = await request.json();

    // Validate input - at least one input type must be provided
    if (!body.menuText && !body.imageUrl && !body.fileId) {
      return NextResponse.json(
        { error: 'One of menuText, imageUrl, or fileId is required' },
        { status: 400 }
      );
    }

    // Extract menu items using OpenAI
    const menuItems = await extractMenuItems(body);

    // Apply course filter if provided
    let filteredItems = menuItems;
    if (body.filterCourse) {
      const filterCourse = body.filterCourse.toLowerCase();
      filteredItems = menuItems.filter(
        item => item.course?.toLowerCase() === filterCourse
      );
    }

    return NextResponse.json(filteredItems, { status: 200 });
  } catch (error) {
    console.error('Error processing menu:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process menu' },
      { status: 500 }
    );
  }
}

/**
 * Extract menu items from various input types using OpenAI Vision/GPT-4
 */
async function extractMenuItems(input: ProcessMenuRequest): Promise<MenuItem[]> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Read prompt template
  const promptPath = join(process.cwd(), 'src/app/api/processMenu/prompt.txt');
  const systemPrompt = readFileSync(promptPath, 'utf-8');

  try {
    // Build the message content based on input type
    const messageContent: Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }> = [];

    if (input.menuText) {
      // Text-based menu
      messageContent.push({
        type: 'text',
        text: `Extract menu items from the following text:\n\n${input.menuText}`,
      });
    } else if (input.imageUrl) {
      // Image URL
      messageContent.push({
        type: 'text',
        text: 'Extract all menu items from this image:',
      });
      messageContent.push({
        type: 'image_url',
        image_url: { url: input.imageUrl },
      });
    } else if (input.fileId) {
      // Uploaded file - Note: This requires the file to be accessible via URL
      // For now, we'll return an error as file handling requires additional setup
      throw new Error('File upload support requires additional configuration. Please use menuText or imageUrl.');
    }

    // Call OpenAI API with vision capabilities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o for vision support
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: messageContent as any, // Type assertion for content array
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse: OpenAIMenuResponse = JSON.parse(responseText);

    // Validate the response structure
    if (!parsedResponse.menuItems || !Array.isArray(parsedResponse.menuItems)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Validate and clean each menu item
    const validMenuItems = parsedResponse.menuItems.filter(item =>
      item.name && typeof item.name === 'string'
    ).map(item => ({
      name: item.name,
      description: item.description || null,
      course: item.course || null,
      price: item.price || null,
    }));

    return validMenuItems;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract menu items: ${error.message}`);
    }
    throw new Error('Failed to extract menu items from OpenAI');
  }
}
