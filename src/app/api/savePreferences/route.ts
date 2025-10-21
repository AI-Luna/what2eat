import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { DietaryPreferences } from '@/types/dietary'

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = await auth()
    console.log('[SavePreferences] Starting - userId:', userId)

    if (!userId) {
      console.error('[SavePreferences] No userId found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    console.log('[SavePreferences] Received body:', JSON.stringify(body, null, 2))

    const { restrictions, restrictionsOther, allergies, allergiesOther } = body

    // Validate the data
    if (!Array.isArray(restrictions) || !Array.isArray(allergies)) {
      console.error('[SavePreferences] Invalid data format - restrictions:', restrictions, 'allergies:', allergies)
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Create the dietary preferences object
    const dietaryPreferences: DietaryPreferences = {
      restrictions,
      restrictionsOther,
      allergies,
      allergiesOther,
      hasCompletedOnboarding: true,
    }

    // Save to Clerk user metadata
    console.log('[SavePreferences] Saving preferences for user:', userId)
    console.log('[SavePreferences] Dietary preferences:', JSON.stringify(dietaryPreferences, null, 2))

    const client = await clerkClient()

    // First, get the current user to see their metadata before update
    const userBefore = await client.users.getUser(userId)
    console.log('[SavePreferences] User metadata BEFORE update:', JSON.stringify(userBefore.publicMetadata, null, 2))

    const updatedUser = await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        dietaryPreferences,
      },
    })

    console.log('[SavePreferences] ✓ Successfully saved to Clerk')
    console.log('[SavePreferences] Updated user metadata AFTER update:', JSON.stringify(updatedUser.publicMetadata, null, 2))

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences saved successfully',
        preferences: dietaryPreferences
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SavePreferences] ERROR:', error)
    console.error('[SavePreferences] ERROR Stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[SavePreferences] ERROR Message:', error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: 'Failed to save preferences',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
