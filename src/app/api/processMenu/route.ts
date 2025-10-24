import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openAIRateLimit, getClientIP } from '@/lib/rateLimit';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

// Dynamic import for Sharp to handle platform-specific issues
async function getSharp() {
  try {
    const sharp = await import('sharp');
    return sharp.default;
  } catch (error) {
    console.warn('Sharp module failed to load:', error);
    return null;
  }
}

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
  imageBase64?: string;     // Base64 encoded image data
  localFilePath?: string;   // Local file path (development only)
  fileId?: string;          // Uploaded file ID (from OpenAI Files API)
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
 * Example request body (base64 image):
 * {
 *   "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA..."
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

    const body: ProcessMenuRequest = await request.json();

    // Validate input - at least one input type must be provided
    if (!body.menuText && !body.imageUrl && !body.imageBase64 && !body.localFilePath && !body.fileId) {
      return NextResponse.json(
        { error: 'One of menuText, imageUrl, imageBase64, localFilePath, or fileId is required' },
        { status: 400 }
      );
    }

    // Extract menu items using OpenAI
    const menuItems = await extractMenuItems(body);

    return NextResponse.json(menuItems, { status: 200 });
  } catch (error) {
    console.error('Error processing menu:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to process menu';
    return NextResponse.json(
      { error: 'Failed to process menu', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Strip markdown code block formatting from JSON responses
 * Handles cases where LLM returns ```json\n{...}\n``` instead of raw JSON
 */
function stripMarkdownFormatting(text: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.trim();

  // Check if the response starts with ```
  if (cleaned.startsWith('```')) {
    // Remove opening ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing ```
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }

  return cleaned.trim();
}

/**
 * Downscale image to ensure largest dimension is <= 700px
 * Maintains aspect ratio
 * Falls back to original buffer if Sharp is not available
 */
async function downscaleImage(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = await getSharp();
  
  // If Sharp is not available, return original buffer
  if (!sharp) {
    console.warn('Sharp not available, skipping image downscaling');
    return imageBuffer;
  }

  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    const maxDimension = 700;
    const largestDimension = Math.max(metadata.width, metadata.height);

    // Only resize if image is larger than max dimension
    if (largestDimension > maxDimension) {
      if (metadata.width > metadata.height) {
        // Width is larger - resize based on width
        return await image.resize({ width: maxDimension }).toBuffer();
      } else {
        // Height is larger - resize based on height
        return await image.resize({ height: maxDimension }).toBuffer();
      }
    }

    // Image is already small enough
    return imageBuffer;
  } catch (error) {
    console.warn('Sharp processing failed, using original image:', error);
    return imageBuffer;
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

  // Get user's dietary preferences
  // const dietaryPreferences = await getUserDietaryPreferences();
  // const dietaryInfo = formatDietaryPreferencesForPrompt(dietaryPreferences);
  const dietaryInfo = ''; // No dietary preferences for now

  // Read prompt template
  const promptPath = join(process.cwd(), 'src/app/api/processMenu/prompt.txt');
  const systemPrompt = readFileSync(promptPath, 'utf-8') + dietaryInfo;

  try {
    // Build the message content based on input type
    const messageContent: ChatCompletionContentPart[] = [];

    if (input.menuText) {
      // Text-based menu
      messageContent.push({
        type: 'text',
        text: `Extract menu items from the following text:\n\n${input.menuText}`,
      });
    } else if (input.localFilePath) {
      // Local file path - read, downscale, and convert to base64
      const filePath = join(process.cwd(), input.localFilePath);
      const imageBuffer = readFileSync(filePath);

      // Downscale image to max 700px on largest dimension
      const downscaledBuffer = await downscaleImage(imageBuffer);
      const base64Image = downscaledBuffer.toString('base64');

      // Detect image type from file extension
      const ext = input.localFilePath.toLowerCase().split('.').pop();
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      messageContent.push({
        type: 'text',
        text: 'Extract all menu items from this image:',
      });
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`
        },
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
    } else if (input.imageBase64) {
      // Base64 encoded image - decode, downscale, and re-encode
      const imageBuffer = Buffer.from(input.imageBase64, 'base64');

      // Downscale image to max 700px on largest dimension
      const downscaledBuffer = await downscaleImage(imageBuffer);
      const base64Image = downscaledBuffer.toString('base64');

      messageContent.push({
        type: 'text',
        text: 'Extract all menu items from this image:',
      });
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        },
      });
    } else if (input.fileId) {
      // Uploaded file - Note: This requires the file to be accessible via URL
      // For now, we'll return an error as file handling requires additional setup
      throw new Error('File upload support requires additional configuration. Please use menuText, imageUrl, or imageBase64.');
    }

    // Call OpenAI API with vision capabilities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for vision support
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_completion_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response (strip markdown formatting if present)
    const parsedResponse: OpenAIMenuResponse = JSON.parse(stripMarkdownFormatting(responseText));

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
