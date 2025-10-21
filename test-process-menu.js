/**
 * Test script for /api/processMenu endpoint
 *
 * Usage: node test-process-menu.js [test-name]
 *
 * Tests: text, image
 *
 * Make sure to:
 * 1. Start the dev server: npm run dev
 * 2. Set OPENAI_API_KEY in .env.local
 * 3. Run this script: node test-process-menu.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000/api/processMenu';
const SAMPLE_MENU_PATH = path.join(__dirname, 'public', 'sample-menu.jpeg');

/**
 * Convert image to base64 data URL
 */
function imageToDataUrl(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64Image}`;
}

/**
 * Test 1: Process menu from text input
 */
async function testMenuText() {
  console.log('\n--- Test 1: Process menu from text input ---\n');

  const menuText = `
SOUTHERN PACIFIC

BAR BITES
SAGE FRIES - $9
With sage, garlic, aleppo sauce

ONION RINGS BASKET - $10
With house BBQ and ranch

FRIED PRETZEL TWIST - $9
With queso sauce and mustard

BURGERS
HOUSE BURGER - $15
Served medium with lettuce, red onion, tomato, house pickles

BRASS HAT BURGER - $17
Served medium with caramelized onions, pepper jack cheese, pickled jalapeños, sweet chili sauce
  `.trim();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuText }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error: HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    console.log(`Received ${data.length} menu items\n`);

    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample items (first 3):');
      data.slice(0, 3).forEach((item, i) => {
        console.log(`${i + 1}. ${item.name} - $${item.price || 'N/A'}`);
        if (item.course) console.log(`   Course: ${item.course}`);
        if (item.description) console.log(`   ${item.description}`);
      });
      return true;
    } else {
      console.error('Response is not a valid array or is empty');
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Process menu from image URL (base64 data URL)
 */
async function testImageUrl() {
  console.log('\n--- Test 2: Process menu from image ---\n');

  try {
    if (!fs.existsSync(SAMPLE_MENU_PATH)) {
      console.error(`Image not found at: ${SAMPLE_MENU_PATH}`);
      return false;
    }

    console.log(`Using sample menu: ${SAMPLE_MENU_PATH}\n`);

    const imageUrl = imageToDataUrl(SAMPLE_MENU_PATH);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error: HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    console.log(`Received ${data.length} menu items from image\n`);

    if (Array.isArray(data) && data.length > 0) {
      // Organize by course
      const itemsByCourse = {};
      data.forEach(item => {
        const course = item.course || 'Uncategorized';
        if (!itemsByCourse[course]) itemsByCourse[course] = [];
        itemsByCourse[course].push(item);
      });

      console.log('Extracted menu items by course:\n');
      Object.entries(itemsByCourse).forEach(([course, items]) => {
        console.log(`${course}:`);
        items.forEach(item => {
          const price = item.price ? `$${item.price}` : 'N/A';
          console.log(`  • ${item.name} - ${price}`);
          if (item.description) {
            console.log(`    ${item.description}`);
          }
        });
        console.log('');
      });

      return true;
    } else {
      console.error('Response is not a valid array or is empty');
      return false;
    }
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n========================================');
  console.log('Testing /api/processMenu Endpoint');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Sample Menu: ${SAMPLE_MENU_PATH}`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Check if specific test is requested
  const testArg = process.argv[2];

  const allTests = {
    'text': testMenuText,
    'image': testImageUrl,
  };

  let tests;
  if (testArg && allTests[testArg]) {
    console.log(`\nRunning single test: ${testArg}\n`);
    tests = [allTests[testArg]];
  } else if (testArg) {
    console.error(`Unknown test: ${testArg}`);
    console.log(`Available tests: ${Object.keys(allTests).join(', ')}`);
    process.exit(1);
  } else {
    tests = Object.values(allTests);
  }

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Test threw unexpected error: ${error.message}`);
      results.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\nAll tests passed!');
  } else {
    console.log('\nSome tests failed. Check the output above for details.');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
