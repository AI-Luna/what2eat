"use client";

import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function AuthHeader() {
  const pathname = usePathname();

  // Don't show header on landing page or upload page
  if (pathname === '/' || pathname === '/upload') {
    return null;
  }

  return (
    <header className="flex justify-end items-center p-4 gap-4 border-b">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
