import { NextRequest, NextResponse } from 'next/server';

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
 * POST /api/processMenu
 *
 * Processes menu data and returns a structured array of menu items.
 *
 * Example request body:
 * {
 *   "filterCourse": "appetizers" // optional - filter by course (appetizers, mains, desserts)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body if needed for filtering/processing
    const body = await request.json().catch(() => ({}));

    // Example: Process menu data (replace with actual logic)
    const menuItems: MenuItem[] = [
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan and croutons',
        course: 'appetizers',
        price: 12.99,
      },
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with seasonal vegetables',
        course: 'mains',
        price: 24.99,
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with vanilla ice cream',
        course: 'desserts',
        price: 8.99,
      },
    ];

    // Apply filters if provided
    let filteredItems = menuItems;

    if (body.filterCourse) {
      filteredItems = filteredItems.filter(
        item => item.course === body.filterCourse
      );
    }

    return NextResponse.json(filteredItems, { status: 200 });
  } catch (error) {
    console.error('Error processing menu:', error);
    return NextResponse.json(
      { error: 'Failed to process menu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/processMenu
 *
 * Returns all menu items (convenience method)
 */
export async function GET() {
  try {
    const menuItems: MenuItem[] = [
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan and croutons',
        course: 'appetizers',
        price: 12.99,
      },
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with seasonal vegetables',
        course: 'mains',
        price: 24.99,
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with vanilla ice cream',
        course: 'desserts',
        price: 8.99,
      },
    ];

    return NextResponse.json(menuItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
