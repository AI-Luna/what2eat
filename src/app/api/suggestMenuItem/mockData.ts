/**
 * Mock data for testing the suggestMenuItem API
 */

/**
 * MenuItem represents a menu item
 * Must match the structure from processMenu API
 */
export interface MenuItem {
  name: string;
  description: string | null;
  course: string | null; // e.g., appetizers, mains, desserts
  price: number | null;
}

/**
 * Mock Quiz Response Example
 *
 * Example of a filled-out quiz string with questions and answers:
 */
export const MOCK_QUIZ_RESPONSE = `
Q: Do you have any dietary restrictions? A: None
Q: How hungry are you? A: Very hungry
Q: What kind of flavors are you craving? A: Spicy
Q: What protein would you prefer? A: Chicken
Q: How adventurous are you feeling? A: Somewhat adventurous
Q: What meal type are you looking for? A: Full meal
`.trim();

/**
 * Mock Menu Items
 * Sample menu database for testing
 */
export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings tossed in our signature hot sauce',
    course: 'appetizers',
    price: 12.99,
  },
  {
    name: 'Grilled Chicken Caesar Salad',
    description: 'Fresh romaine with grilled chicken and parmesan',
    course: 'salads',
    price: 14.99,
  },
  {
    name: 'Szechuan Chicken Stir-Fry',
    description: 'Spicy stir-fried chicken with vegetables',
    course: 'mains',
    price: 18.99,
  },
  {
    name: 'Mild Herb Chicken',
    description: 'Tender chicken with herbs and lemon',
    course: 'mains',
    price: 16.99,
  },
  {
    name: 'Buffalo Chicken Pizza',
    description: 'Pizza topped with spicy buffalo chicken',
    course: 'mains',
    price: 15.99,
  },
  {
    name: 'Vegetable Curry',
    description: 'Spicy vegetable curry with rice',
    course: 'mains',
    price: 13.99,
  },
];
