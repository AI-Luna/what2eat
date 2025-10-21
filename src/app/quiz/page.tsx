"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/types/quiz";

// Example questions matching the API structure
const exampleQuestions: QuizQuestion[] = [
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

export default function Quiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(exampleQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [questionFade, setQuestionFade] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch questions on mount (or use example questions)
  useEffect(() => {
    // TODO: Replace with actual API call
    // fetchQuestions();
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  // Example function to fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      // Fall back to example questions
      setQuestions(exampleQuestions);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const transitionToQuestion = (nextQuestionIndex: number, newSelectedOption: string | null) => {
    // Fade out current question
    setQuestionFade(false);

    setTimeout(() => {
      // Change question
      setCurrentQuestion(nextQuestionIndex);
      setSelectedOption(newSelectedOption);

      // Fade in new question
      setTimeout(() => {
        setQuestionFade(true);
      }, 50);
    }, 300);
  };

  const handleNext = () => {
    if (selectedOption) {
      const newAnswers = { ...answers, [currentQuestion]: selectedOption };
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        transitionToQuestion(currentQuestion + 1, null);
      } else {
        // Submit quiz
        console.log("Quiz completed:", newAnswers);
        alert("Quiz completed! Recommendations coming soon...");
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      transitionToQuestion(currentQuestion - 1, answers[currentQuestion - 1] || null);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-white/60 text-sm">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content with Fade Animation */}
        <div className={`transition-opacity duration-300 ${questionFade ? 'opacity-100' : 'opacity-0'}`}>
          {/* Question Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {question.question}
            </h1>
            <p className="text-lg text-white/60">
              Select the option that best fits your preference
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            <div className={`grid grid-cols-1 ${question.answers.length > 3 ? 'md:grid-cols-2' : 'md:grid-cols-' + Math.min(question.answers.length, 3)} gap-4`}>
              {question.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(answer)}
                  className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                    selectedOption === answer
                      ? "bg-white text-black border-2 border-white"
                      : "bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 text-white"
                  }`}
                >
                  <div className="font-semibold text-lg">{answer}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentQuestion > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              size="lg"
            >
              ← Previous
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`${currentQuestion === 0 ? 'w-full' : 'flex-1'} bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            size="lg"
          >
            {currentQuestion === questions.length - 1 ? "Get My Recommendations" : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
