import { auth, currentUser } from '@clerk/nextjs/server'
import { DietaryPreferences } from '@/types/dietary'

/**
 * Get the current user's dietary preferences from Clerk metadata
 * Returns null if user is not authenticated or hasn't completed onboarding
 */
export async function getUserDietaryPreferences(): Promise<DietaryPreferences | null> {
  try {
    const user = await currentUser()

    if (!user) {
      return null
    }

    const metadata = user.publicMetadata as { dietaryPreferences?: DietaryPreferences }

    if (!metadata.dietaryPreferences?.hasCompletedOnboarding) {
      return null
    }

    return metadata.dietaryPreferences
  } catch (error) {
    console.error('Error fetching user dietary preferences:', error)
    return null
  }
}

/**
 * Check if the current user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const user = await currentUser()

    if (!user) {
      return false
    }

    const metadata = user.publicMetadata as { dietaryPreferences?: DietaryPreferences }
    return metadata.dietaryPreferences?.hasCompletedOnboarding === true
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}

/**
 * Format dietary preferences into a human-readable string for AI prompts
 */
export function formatDietaryPreferencesForPrompt(preferences: DietaryPreferences | null): string {
  if (!preferences) {
    return ''
  }

  const parts: string[] = []

  // Add dietary restrictions
  if (preferences.restrictions.length > 0) {
    const restrictions = [...preferences.restrictions]
    if (preferences.restrictionsOther) {
      restrictions.push(preferences.restrictionsOther)
    }
    parts.push(`Dietary restrictions: ${restrictions.join(', ')}`)
  }

  // Add allergies
  if (preferences.allergies.length > 0) {
    const allergies = [...preferences.allergies]
    if (preferences.allergiesOther && preferences.allergiesOther.length > 0) {
      allergies.push(...preferences.allergiesOther)
    }
    parts.push(`Allergies: ${allergies.join(', ')}`)
  }

  if (parts.length === 0) {
    return ''
  }

  return `\n\nUSER'S DIETARY INFORMATION (IMPORTANT - Must be considered in all recommendations):\n${parts.join('\n')}\n`
}

/**
 * Get current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
