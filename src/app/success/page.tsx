'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { DietaryPreferences } from '@/types/dietary'

export default function SuccessPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [preferences, setPreferences] = useState<DietaryPreferences | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as { dietaryPreferences?: DietaryPreferences }

      if (!metadata.dietaryPreferences?.hasCompletedOnboarding) {
        // If onboarding not completed, redirect to onboarding
        router.push('/onboarding')
      } else {
        // Display the saved preferences
        setPreferences(metadata.dietaryPreferences)
      }
    }
  }, [isLoaded, user, router])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push('/')
    }
  }, [countdown, router])

  if (!isLoaded || !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg px-8 py-10">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Successfully Saved! ✓
            </h1>
            <p className="text-lg text-gray-600">
              Your dietary preferences have been saved to Clerk.
            </p>
          </div>

          {/* Display Saved Preferences */}
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Saved Preferences:
            </h2>

            {/* Dietary Restrictions */}
            {preferences.restrictions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Dietary Restrictions:</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.restrictions.map((restriction) => (
                    <span
                      key={restriction}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {restriction}
                    </span>
                  ))}
                  {preferences.restrictionsOther && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {preferences.restrictionsOther}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Allergies */}
            {preferences.allergies.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Allergies:</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {allergy}
                    </span>
                  ))}
                  {preferences.allergiesOther && preferences.allergiesOther.map((allergy, index) => (
                    <span
                      key={`other-${index}`}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No Preferences */}
            {preferences.restrictions.length === 0 && preferences.allergies.length === 0 && (
              <p className="text-gray-600 italic">No dietary restrictions or allergies specified.</p>
            )}
          </div>

          {/* Verification Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">
              ✓ Verified in Clerk
            </h3>
            <p className="text-sm text-green-800">
              These preferences are now stored in your Clerk user metadata and will be used to personalize your menu recommendations.
            </p>
            <p className="text-sm text-green-800 mt-2">
              <strong>To verify in Clerk Dashboard:</strong>
            </p>
            <ol className="text-sm text-green-800 list-decimal list-inside ml-2 mt-1">
              <li>Go to your Clerk Dashboard</li>
              <li>Navigate to &quot;Users&quot;</li>
              <li>Find your user account</li>
              <li>Check the &quot;Public metadata&quot; section</li>
            </ol>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Redirecting to home page in <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Home Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
