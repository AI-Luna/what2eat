import { NextResponse } from 'next/server';
import type { QuizQuestion } from '@/types/quiz';

// Example questions data - this would typically come from a database or external API
const questions: QuizQuestion[] = [
  {
    question: "What flavor mood is ruling your stomach today?",
    answers: ["Fiery and adventurous", "Cheesy and comforting", "Crisp and salty", "Herbaceous and light"]
  },
  {
    question: "How hungry are you feeling right now?",
    answers: ["Just a nibble", "Regular hunger", "Pretty hungry", "Absolutely starving"]
  },
  {
    question: "What's your spice tolerance level?",
    answers: ["Keep it mild", "A little kick", "Bring the heat", "Make it volcanic"]
  },
  {
    question: "Are you in the mood for something familiar or adventurous?",
    answers: ["Stick with what I know", "Slightly adventurous", "Try something new", "Surprise me completely"]
  },
  {
    question: "What texture are you craving?",
    answers: ["Soft and tender", "Crispy and crunchy", "Creamy and smooth", "Mixed textures"]
  },
  {
    question: "Do you have any allergies?",
    answers: ["Dairy/Milk", "Eggs", "Peanuts", "Tree nuts", "Soy", "Wheat", "Fish", "Shellfish", "Sesame", "Other (please specify):_____"]
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
