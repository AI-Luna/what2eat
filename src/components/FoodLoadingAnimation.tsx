'use client';

import { useState, useEffect } from 'react';

interface FoodEmoji {
  emoji: string;
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const FOOD_EMOJIS = [
  // Fruits
  '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥',
  // Vegetables  
  '🍄', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🫚', '🫛', '🍄', '🥕',
  // Bakery, Meals & Snacks
  '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥗', '🍿', '🧈', '🧂', '🥫'
];

const LOADING_MESSAGES = [
  'Scanning preferences, parsing bites, calculating cravings...',
  'Your Perfect Dish Is Out There.\nWe\'re just making the introduction.'
];

export default function FoodLoadingAnimation() {
  const [emojis, setEmojis] = useState<FoodEmoji[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const createEmoji = (): FoodEmoji => {
      const randomEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      const size = Math.random() * 40 + 20; // 20-60px
      const x = Math.random() * (window.innerWidth - size);
      const y = Math.random() * (window.innerHeight - size);
      const delay = Math.random() * 2000; // 0-2s delay
      const duration = Math.random() * 3000 + 2000; // 2-5s duration

      return {
        emoji: randomEmoji,
        id: Date.now() + Math.random(),
        x,
        y,
        size,
        delay,
        duration
      };
    };

    // Create initial emojis
    const initialEmojis = Array.from({ length: 15 }, createEmoji);
    setEmojis(initialEmojis);

    // Add new emojis periodically
    const emojiInterval = setInterval(() => {
      setEmojis(prev => {
        const newEmoji = createEmoji();
        const updated = [...prev, newEmoji];
        
        // Keep only the last 20 emojis to prevent memory issues
        return updated.slice(-20);
      });
    }, 800);

    // Cycle through messages every 4 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    // Cleanup
    return () => {
      clearInterval(emojiInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Main loading text */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <p className="text-2xl md:text-3xl font-bold text-white whitespace-pre-line transition-opacity duration-500">
          {LOADING_MESSAGES[currentMessageIndex]}
        </p>
      </div>

      {/* Floating food emojis */}
      {emojis.map((food) => (
        <div
          key={food.id}
          className="absolute pointer-events-none"
          style={{
            left: `${food.x}px`,
            top: `${food.y}px`,
            fontSize: `${food.size}px`,
            animationDelay: `${food.delay}ms`,
            animationDuration: `${food.duration}ms`,
            animation: 'foodPop 2s ease-in-out infinite'
          }}
        >
          {food.emoji}
        </div>
      ))}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes foodPop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: scale(1.2) rotate(10deg);
          }
          40% {
            opacity: 0.8;
            transform: scale(1) rotate(-5deg);
          }
          60% {
            opacity: 0.9;
            transform: scale(1.1) rotate(5deg);
          }
          80% {
            opacity: 0.6;
            transform: scale(0.9) rotate(-2deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
