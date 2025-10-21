/**
 * Test script for the suggestMenuItem API
 *
 * Usage:
 * 1. Make sure your dev server is running: npm run dev
 * 2. Make sure OPENAI_API_KEY is set in your .env.local file
 * 3. Run this test: node test-suggest-menu.js
 */

const MOCK_MENU_ITEMS = [
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

const MOCK_QUIZ_RESPONSE = `
Q: Do you have any dietary restrictions? A: None
Q: How hungry are you? A: Very hungry
Q: What kind of flavors are you craving? A: Spicy
Q: What protein would you prefer? A: Chicken
Q: How adventurous are you feeling? A: Somewhat adventurous
Q: What meal type are you looking for? A: Full meal
`.trim();

async function testSuggestMenuItem() {
  console.log('🧪 Testing Suggest Menu Item API...\n');

  const requestBody = {
    menuItems: MOCK_MENU_ITEMS,
    questionsAndAnswers: MOCK_QUIZ_RESPONSE,
  };

  console.log('📤 Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n📡 Calling API at http://localhost:3000/api/suggestMenuItem...\n');

  try {
    const response = await fetch('http://localhost:3000/api/suggestMenuItem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', response.status);
      console.error('Error details:', data);
      return;
    }

    console.log('✅ API Response (Status:', response.status, '):\n');
    console.log('📝 Description:');
    console.log(data.description);
    console.log('\n🎯 Selected Items:');
    data.selectedItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} - $${item.price}`);
      console.log(`     ${item.description}`);
      console.log(`     Course: ${item.course}`);
    });
    console.log('\n🔄 Alternate Choices:');
    data.alternateChoices.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} - $${item.price}`);
      console.log(`     ${item.description}`);
      console.log(`     Course: ${item.course}`);
    });

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your dev server is running (npm run dev)');
    console.error('2. OPENAI_API_KEY is set in .env.local');
    console.error('3. The API endpoint is accessible at http://localhost:3000');
  }
}

testSuggestMenuItem();
