"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MenuItem {
  name: string;
  description: string | null;
  course: string | null;
  price: number | null;
}

interface Suggestion {
  description: string;
  selectedItems: MenuItem[];
  alternateChoices: MenuItem[];
}

export default function Results() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get suggestion from localStorage
    const suggestionString = localStorage.getItem('suggestion');
    if (!suggestionString) {
      router.push('/upload');
      return;
    }

    const suggestionData = JSON.parse(suggestionString);
    setSuggestion(suggestionData);

    // Trigger fade in
    setTimeout(() => setFadeIn(true), 50);
  }, [router]);

  if (!suggestion) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your recommendations...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black p-4 relative overflow-hidden transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="text-6xl">🍽️</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Picked by AI, Endorsed by Hunger
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Your cravings might just agree.
          </p>
        </div>

        {/* AI Description */}
        <div className="mb-12 p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <p className="text-white/90 text-lg leading-relaxed">
            {suggestion.description}
          </p>
        </div>

        {/* Top Recommendations */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Our Top Picks for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestion.selectedItems.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl backdrop-blur-sm hover:border-white/40 transition-all transform hover:scale-105"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold text-white">{item.name}</h3>
                  {item.price && (
                    <span className="text-green-400 font-semibold text-xl">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-white/70 mb-2">{item.description}</p>
                )}
                {item.course && (
                  <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-white/60 text-sm">
                    {item.course}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Choices */}
        {suggestion.alternateChoices.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Other Great Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestion.alternateChoices.map((item, index) => (
                <div
                  key={index}
                  className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:border-white/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    {item.price && (
                      <span className="text-green-400 font-medium">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-white/60 text-sm mb-2">{item.description}</p>
                  )}
                  {item.course && (
                    <span className="inline-block px-2 py-1 bg-white/10 rounded-full text-white/50 text-xs">
                      {item.course}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/upload">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105"
            >
              Try Another Menu
            </Button>
          </Link>
          <Link href="/">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
