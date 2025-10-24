'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { DIETARY_RESTRICTIONS, ALLERGIES, DietaryRestriction, Allergy } from '@/types/dietary'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>([])
  const [restrictionsOther, setRestrictionsOther] = useState('')
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([])
  const [allergiesOther, setAllergiesOther] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Check if user has already completed onboarding
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as { dietaryPreferences?: { hasCompletedOnboarding?: boolean } }
      if (metadata.dietaryPreferences?.hasCompletedOnboarding) {
        router.push('/')
      }
    }
  }, [isLoaded, user, router])

  const toggleRestriction = (restriction: DietaryRestriction) => {
    setSelectedRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    )
  }

  const toggleAllergy = (allergy: Allergy) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    )
  }

  const handleAllergyOtherChange = (index: number, value: string) => {
    const newAllergiesOther = [...allergiesOther]
    newAllergiesOther[index] = value
    setAllergiesOther(newAllergiesOther)
  }

  const addAllergyOtherField = () => {
    setAllergiesOther([...allergiesOther, ''])
  }

  const removeAllergyOtherField = (index: number) => {
    setAllergiesOther(allergiesOther.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Filter out empty "other" allergy entries
      const filteredAllergiesOther = allergiesOther.filter(a => a.trim() !== '')

      const payload = {
        restrictions: selectedRestrictions,
        restrictionsOther: restrictionsOther.trim() || undefined,
        allergies: selectedAllergies,
        allergiesOther: filteredAllergiesOther.length > 0 ? filteredAllergiesOther : undefined,
      }

      console.log('[Onboarding] Submitting preferences:', payload)

      const response = await fetch('/api/savePreferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('[Onboarding] Response status:', response.status)

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      console.log('[Onboarding] Response content-type:', contentType)

      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text()
        console.error('[Onboarding] Non-JSON response:', textResponse.substring(0, 500))
        throw new Error('Server returned an error. Check the browser console for details.')
      }

      const responseData = await response.json()
      console.log('[Onboarding] Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save preferences')
      }

      // Wait a moment for Clerk to update metadata, then redirect to success page
      console.log('[Onboarding] Preferences saved successfully, redirecting to success page')
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/success')
    } catch (err) {
      setError('Failed to save your preferences. Please try again.')
      console.error('[Onboarding] Error saving preferences:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to What2Eat!</h1>
            <p className="text-gray-600">
              Let&apos;s personalize your experience. Tell us about your dietary preferences so we can recommend the perfect meals for you.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Dietary Restrictions */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Do you have any dietary restrictions?
                <span className="text-sm font-normal text-gray-500 ml-2">(Select all that apply)</span>
              </label>
              <div className="space-y-3">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <label key={restriction} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRestrictions.includes(restriction)}
                      onChange={() => toggleRestriction(restriction)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{restriction}</span>
                  </label>
                ))}
              </div>
              {selectedRestrictions.includes('Other') && (
                <input
                  type="text"
                  value={restrictionsOther}
                  onChange={(e) => setRestrictionsOther(e.target.value)}
                  placeholder="Please specify other dietary restrictions"
                  className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Allergies */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Do you have any allergies?
                <span className="text-sm font-normal text-gray-500 ml-2">(Select all that apply)</span>
              </label>
              <div className="space-y-3">
                {ALLERGIES.map((allergy) => (
                  <label key={allergy} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAllergies.includes(allergy)}
                      onChange={() => toggleAllergy(allergy)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{allergy}</span>
                  </label>
                ))}
              </div>
              {selectedAllergies.includes('Other') && (
                <div className="mt-3 space-y-2">
                  {allergiesOther.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleAllergyOtherChange(index, e.target.value)}
                        placeholder="Please specify other allergies"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {allergiesOther.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAllergyOtherField(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAllergyOtherField}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another allergy
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
