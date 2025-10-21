import { NextResponse } from 'next/server';
import type { QuizQuestion } from '@/types/quiz';

// Example questions data - this would typically come from a database or external API
const questions: QuizQuestion[] = [
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
        "Caloric maintenance — I’ll have what they’re having.",
        "Caloric surplus — I’m not watching my waist.",
        "No clue, just feed me good food."
      ]
    },
    {
      "question":"What flavor mood is ruling your stomach today?",
      "answers": [
          "Fiery and adventurous","Cheesy and comforting",
          "Crisp and salty","Herbaceous and light"
      ]
    },
    {
        "question":"What texture are you daydreaming about?",
        "answers": [
            "Crunchy and shareable",
            "Tender and melt-in-your-mouth",
            "Bubbly and creamy","Crispy and golden"
        ]
    },
    {
        "question":"Pick the vibe your plate should bring",
        "answers": [
            "Casual party-friendly",
            "Romantic upscale",
            "Nostalgic homey",
            "Bold and indulgent"
        ]
    },
    {
        "question":"Pick the after-meal vibe you’re hunting",
        "answers":[
            "Cozy and satisfied","Energized and ready to chat","A little tipsy and merry",
            "Light and refreshed"
        ]
    }
  ];

export async function GET() {
  try {
    // In a real application, you might:
    // 1. Fetch questions from a database
    // 2. Randomize the order
    // 3. Personalize based on user preferences
    // 4. Generate questions using AI based on the uploaded menu

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
