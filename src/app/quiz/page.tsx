"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/types/quiz";
import FoodLoadingAnimation from "@/components/FoodLoadingAnimation";

export default function Quiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [fadeIn, setFadeIn] = useState(false);
  const [questionFade, setQuestionFade] = useState(true);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const router = useRouter();

  // Function to render question text with animated "hungry"
  const renderQuestionText = (text: string) => {
    const lowerText = text.toLowerCase();
    const hungryIndex = lowerText.indexOf('hungry');
    
    if (hungryIndex === -1) {
      return text;
    }
    
    const before = text.substring(0, hungryIndex);
    const hungryWord = text.substring(hungryIndex, hungryIndex + 6);
    const after = text.substring(hungryIndex + 6);
    
    return (
      <>
        {before}
        <span className="animate-color-change inline-block">
          {hungryWord}
        </span>
        {after}
      </>
    );
  };

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
    const question = questions[currentQuestion];
    
    if (question?.allowMultiple) {
      // Handle multiple selection
      setSelectedOptions(prev => {
        if (option === "None") {
          // If "None" is selected, clear all other selections
          return ["None"];
        } else {
          // Remove "None" if another option is selected
          const filtered = prev.filter(o => o !== "None");
          
          if (filtered.includes(option)) {
            // Deselect if already selected
            return filtered.filter(o => o !== option);
          } else {
            // Select if not already selected
            return [...filtered, option];
          }
        }
      });
    } else {
      // Handle single selection
      setSelectedOption(option);
    }
  };

  const transitionToQuestion = (nextQuestionIndex: number, newAnswer: string | string[] | null) => {
    // Fade out current question
    setQuestionFade(false);

    setTimeout(() => {
      // Change question
      setCurrentQuestion(nextQuestionIndex);
      
      // Load previous answer
      if (newAnswer) {
        if (Array.isArray(newAnswer)) {
          setSelectedOptions(newAnswer);
          setSelectedOption(null);
        } else {
          setSelectedOption(newAnswer);
          setSelectedOptions([]);
        }
      } else {
        setSelectedOption(null);
        setSelectedOptions([]);
      }

      // Fade in new question
      setTimeout(() => {
        setQuestionFade(true);
      }, 50);
    }, 300);
  };

  const formatQuestionsAndAnswers = (answers: { [key: number]: string | string[] }): string => {
    return Object.entries(answers)
      .map(([index, answer]) => {
        const questionIndex = parseInt(index);
        const question = questions[questionIndex];
        const formattedAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
        if (!question) return `Q: Unknown question\nA: ${formattedAnswer}`;
        return `Q: ${question.question}\nA: ${formattedAnswer}`;
      })
      .join('\n\n');
  };

  const handleNext = async () => {
    const question = questions[currentQuestion];
    const currentAnswer = question?.allowMultiple ? selectedOptions : selectedOption;
    
    if ((question?.allowMultiple && selectedOptions.length > 0) || selectedOption) {
      const newAnswers = { ...answers, [currentQuestion]: currentAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        transitionToQuestion(currentQuestion + 1, answers[currentQuestion + 1] || null);
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
    return <FoodLoadingAnimation />;
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
              {renderQuestionText(question.question)}
            </h1>
            {currentQuestion < 3 && (
              <p className="text-lg text-white/60">
                {question.allowMultiple ? 'Select all that apply' : 'Select the option that best fits your preference'}
              </p>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            <div className={`grid grid-cols-1 ${question.allowMultiple ? 'md:grid-cols-3' : question.answers.length > 3 ? 'md:grid-cols-2' : 'md:grid-cols-' + Math.min(question.answers.length, 3)} gap-4`}>
              {question.answers.map((answer, index) => {
                const isSelected = question.allowMultiple 
                  ? selectedOptions.includes(answer)
                  : selectedOption === answer;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(answer)}
                    className={`p-4 rounded-xl transition-all transform hover:scale-105 text-left ${
                      isSelected
                        ? "bg-white text-black border-2 border-white"
                        : "bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {question.allowMultiple && (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-black border-black' : 'border-white/40'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="font-semibold text-base">{answer}</div>
                    </div>
                  </button>
                );
              })}
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
            disabled={question.allowMultiple ? selectedOptions.length === 0 : !selectedOption}
            className={`${currentQuestion === 0 ? 'w-full' : 'flex-1'} ${
              currentQuestion === questions.length - 1 
                ? 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white' 
                : 'bg-white hover:bg-white/90 text-black'
            } transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            size="lg"
          >
            {currentQuestion === questions.length - 1 ? "Get My Recommendations" : "Next →"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes colorChange {
          0% { color: #ffffff; }
          20% { color: #ff6b6b; }
          40% { color: #ffd93d; }
          60% { color: #6bcf7f; }
          80% { color: #4ecdc4; }
          100% { color: #ffffff; }
        }
        .animate-color-change {
          animation: colorChange 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
