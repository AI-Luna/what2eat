"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/types/quiz";

export default function Quiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [questionFade, setQuestionFade] = useState(true);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const router = useRouter();

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // Check if we have personalized questions from the menu processing
        const storedQuestions = localStorage.getItem('quizQuestions');
        if (storedQuestions) {
          const questions = JSON.parse(storedQuestions);
          setQuestions(questions);
          console.log('Using personalized questions from menu processing');
          return;
        }

        // If no questions found, redirect back to upload
        console.warn('No questions found in localStorage, redirecting to upload');
        router.push('/upload');
      } catch (error) {
        console.error('Failed to load questions:', error);
        // Redirect to upload if there's an error
        router.push('/upload');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
    setTimeout(() => setFadeIn(true), 50);
  }, [router]);

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

  const formatQuestionsAndAnswers = (answers: { [key: number]: string }): string => {
    return Object.entries(answers)
      .map(([index, answer]) => {
        const questionIndex = parseInt(index);
        const question = questions[questionIndex];
        if (!question) return `Q: Unknown question\nA: ${answer}`;
        return `Q: ${question.question}\nA: ${answer}`;
      })
      .join('\n\n');
  };

  const handleNext = async () => {
    if (selectedOption) {
      const newAnswers = { ...answers, [currentQuestion]: selectedOption };
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        transitionToQuestion(currentQuestion + 1, null);
      } else {
        // Submit quiz - call suggestMenuItem API
        console.log("Quiz completed:", newAnswers);

        // Format answers for API
        const questionsAndAnswersString = formatQuestionsAndAnswers(newAnswers);
        console.log("Formatted Q&A:", questionsAndAnswersString);

        // Get menu items from localStorage
        const menuItemsString = localStorage.getItem('menuItems');
        if (!menuItemsString) {
          alert('Menu items not found. Please upload a menu first.');
          router.push('/upload');
          return;
        }

        const menuItems = JSON.parse(menuItemsString);
        console.log('Menu items from storage:', menuItems);

        // Show loading screen
        setSuggesting(true);

        try {
          // Call suggestMenuItem API
          const response = await fetch('/api/suggestMenuItem', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              menuItems: menuItems,
              questionsAndAnswers: questionsAndAnswersString,
            }),
          });

          const suggestion = await response.json();
          console.log('Suggestion response:', suggestion);

          if (!response.ok) {
            alert(`Failed to get suggestion: ${suggestion.error}`);
            setSuggesting(false);
            return;
          }

          // Store suggestion in localStorage
          localStorage.setItem('suggestion', JSON.stringify(suggestion));

          // Navigate to results page
          router.push('/results');

        } catch (error) {
          console.error('Error getting suggestion:', error);
          alert('Failed to get recommendation. Please try again.');
          setSuggesting(false);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      transitionToQuestion(currentQuestion - 1, answers[currentQuestion - 1] || null);
    }
  };

  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Don't render if still loading or no questions available
  if (loading || questions.length === 0 || !question) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">
          {loading ? 'Loading questions...' : 'No questions available. Please upload a menu first.'}
        </div>
      </div>
    );
  }

  if (suggesting) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Animated circles */}
          <div className="relative">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Finding Your Perfect Item
            </h1>
            <p className="text-xl text-white/60">
              Analyzing your preferences and the menu...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
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
