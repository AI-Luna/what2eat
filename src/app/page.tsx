"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to upload page
    if (isLoaded && isSignedIn) {
      router.push('/upload');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render landing page if user is signed in (they'll be redirected)
  if (isSignedIn) {
    return null;
  }

  return (
    <div style={{backgroundColor: '#000000'}}>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Can't Decide<br />What to Eat?
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Let AI help you discover the perfect dish from any restaurant menu
              </p>
            </div>

            <div className="flex gap-4 items-center justify-center">
              <SignInButton
                mode="modal"
                fallbackRedirectUrl="/upload"
                forceRedirectUrl="/upload"
              >
                <Button size="lg" className="text-lg px-12 py-6 h-auto">
                  Get Started
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>

        {/* Food Images - Positioned on sides */}
        <div className="absolute -left-[15vw] md:-left-[200px] top-1/4 -translate-y-1/2 w-[35vw] md:w-[550px]">
          <Image
            src="/ChatGPT Image Oct 21, 2025 at 12_19_36 PM.png"
            alt="Pasta dish"
            width={550}
            height={550}
            className="rounded-lg opacity-90 w-full h-auto"
          />
        </div>

        <div className="absolute -right-[10vw] md:-right-[100px] top-1/2 rotate-45 w-[30vw] md:w-[400px]">
          <Image
            src="/ChatGPT Image Oct 21, 2025 at 12_19_37 PM.png"
            alt="Burrito"
            width={400}
            height={400}
            className="rounded-lg opacity-90 w-full h-auto"
          />
        </div>

        <div className="absolute -right-[8vw] md:-right-[80px] -top-[8vw] md:-top-[80px] w-[28vw] md:w-[350px]">
          <Image
            src="/ChatGPT Image Oct 21, 2025 at 12_23_29 PM.png"
            alt="Pizza slice"
            width={350}
            height={350}
            className="rounded-lg opacity-90 w-full h-auto"
          />
        </div>

        <div className="absolute -left-[10vw] md:-left-[-100px] bottom-0 w-[28vw] md:w-[350px] translate-y-1/2">
          <Image
            src="/ChatGPT Image Oct 21, 2025 at 12_52_20 PM.png"
            alt="Soda can"
            width={350}
            height={350}
            className="rounded-lg opacity-90 w-full h-auto"
          />
        </div>
      </section>
    </div>
  );
}
