"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import Image from "next/image";
import type { Shape } from "canvas-confetti";

const FOOD_EMOJIS = ['🍕', '🍔', '🍣', '🍜', '🥗', '🍝', '🌮', '🍱', '🥘', '🍲', '🍛', '🍤', '🥙', '🌯', '🥪', '🍖', '🥩', '🍗'];
const LOADING_MESSAGES = [
  'Marinating on your menu…',
  'Tasting every word before we start…',
  'Syncing flavor intelligence…',
  'Cooking up your questions…'
];

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const router = useRouter();

  // Cycle through food emojis while processing
  useEffect(() => {
    if (processing) {
      const interval = setInterval(() => {
        setCurrentEmojiIndex((prev) => (prev + 1) % FOOD_EMOJIS.length);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [processing]);

  // Cycle through loading messages
  useEffect(() => {
    if (processing) {
      setCurrentMessageIndex(0); // Start with first message
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000); // Change message every 3 seconds
      return () => clearInterval(interval);
    }
  }, [processing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerConfettiAndNavigate = () => {
    // Create a single large burst of green confetti from the bottom
    const count = 200;
    const defaults = {
      origin: { y: 1 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
      shapes: ['circle', 'square'] as Shape[],
      scalar: 2.5, // Makes particles larger
      gravity: 0.8,
      decay: 0.9,
      startVelocity: 60,
      ticks: 400
    };

    // Fire confetti from bottom left
    confetti({
      ...defaults,
      particleCount: count / 2,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 1 }
    });

    // Fire confetti from bottom right
    confetti({
      ...defaults,
      particleCount: count / 2,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 1 }
    });

    // Start fade out after 1.5 seconds
    setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Navigate after 2.5 seconds (after fade out)
    setTimeout(() => {
      router.push('/quiz');
    }, 2500);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setProcessing(true);

    try {
      // Convert file to base64 directly
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        // Send directly to processMenu API
        const processResponse = await fetch("/api/processMenu", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64Data.split(',')[1], // Remove data:image/...;base64, prefix
          }),
        });

        const menuData = await processResponse.json();

        // Log the response from processMenu API
        console.log('processMenu API Response:', menuData);
        console.log('Menu items extracted:', menuData.length ? `${menuData.length} items` : 'No items');

        if (!processResponse.ok) {
          alert(`Menu processing failed: ${menuData.error}`);
          setProcessing(false);
          return;
        }

        // Check if menu items array is empty
        if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
          alert('We couldn\'t find any menu items in your image. Please make sure the image contains a clear menu and try again.');
          setProcessing(false);
          return;
        }

        // Store menu items in localStorage for the quiz
        localStorage.setItem('menuItems', JSON.stringify(menuData));
        console.log('Menu items stored in localStorage');

        // Generate personalized questions based on the menu
        try {
          const menuString = menuData.map(item => `${item.name} - $${item.price || 'N/A'}`).join(', ');
          
          const quizResponse = await fetch("/api/generateQuiz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              menu: menuString,
            }),
          });

          const generatedQuestions = await quizResponse.json();
          
          if (quizResponse.ok && generatedQuestions) {
            // Store the generated questions in localStorage
            localStorage.setItem('quizQuestions', JSON.stringify(generatedQuestions));
            console.log('Generated questions stored in localStorage');
          } else {
            console.warn('Failed to generate personalized questions, will use default questions');
          }
        } catch (quizError) {
          console.error('Error generating personalized questions:', quizError);
          // Continue with default questions
        }

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Success - show confetti and navigate
        setProcessing(false);
        triggerConfettiAndNavigate();
      };
      
      reader.readAsDataURL(selectedFile);

    } catch (error) {
      console.error("Processing error:", error);
      alert("Something went wrong!");
      setProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Back to Home button */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 md:top-8 md:left-8 text-white/60 hover:text-white transition-colors z-20 text-sm md:text-base"
      >
        ← Back to Home
      </button>

      <div className="max-w-4xl w-full relative z-10 pt-12 md:pt-0">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Upload Your Menu
          </h1>
          <p className="text-base md:text-lg text-white/60 px-4">
            You pick the menu, we&apos;ll handle the overthinking.
          </p>
        </div>

        <div className="space-y-4 flex flex-col items-center">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${
              isDragging
                ? "border-white bg-white/10 scale-105 p-12 w-full"
                : preview
                ? "border-white/30 bg-transparent p-4"
                : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 p-12 w-full"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />

            {!preview ? (
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl text-white font-medium mb-2">
                      Drop your menu here, we&apos;ll do the cooking.
                    </p>
                    <p className="text-white/40 text-sm">
                      Supports: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="relative group inline-block">
                <Image
                  src={preview}
                  alt="Preview"
                  width={800}
                  height={800}
                  className="h-auto max-h-[55vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
                <label
                  htmlFor="file-upload"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg flex items-center justify-center"
                >
                  <span className="text-white font-medium">Click to change image</span>
                </label>
              </div>
            )}
          </div>

          {/* Floating Process Button */}
          {preview && !processing && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || processing}
                className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-2xl px-12 py-6 text-lg font-bold"
                size="lg"
              >
                <span className="inline-block animate-pulse">Process Menu</span>
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Full Screen Processing Animation */}
      {processing && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {/* Status Text Above Emoji */}
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center transition-opacity duration-500">
              {LOADING_MESSAGES[currentMessageIndex]}
            </h2>

            {/* Flipping Food Emojis at Center */}
            <div className="text-9xl animate-flip">
              {FOOD_EMOJIS[currentEmojiIndex]}
            </div>

            {/* Subtitle Below */}
            <p className="text-white/60 text-lg">
              This will only take a moment
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flip {
          0%, 100% {
            transform: rotateY(0deg) scale(1);
          }
          50% {
            transform: rotateY(180deg) scale(1.2);
          }
        }
        .animate-flip {
          animation: flip 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
