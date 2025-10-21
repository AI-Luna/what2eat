import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Define routes that don't require onboarding check
const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isSuccessRoute = createRouteMatcher(['/success'])
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Allow API routes through (they handle their own auth)
  if (isApiRoute(req)) {
    return NextResponse.next()
  }

  // If user is not authenticated, redirect to sign-in
  if (!userId) {
    return redirectToSignIn()
  }

  // If authenticated user is on the landing page, redirect to upload
  if (req.nextUrl.pathname === '/') {
    const uploadUrl = new URL('/upload', req.url)
    return NextResponse.redirect(uploadUrl)
  }

  // For authenticated users not on onboarding or success page, check if they've completed onboarding
  if (!isOnboardingRoute(req) && !isSuccessRoute(req)) {
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const metadata = user.publicMetadata as { dietaryPreferences?: { hasCompletedOnboarding?: boolean } }

      // If user hasn't completed onboarding, redirect to onboarding page
      if (!metadata.dietaryPreferences?.hasCompletedOnboarding) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
      }
    } catch (error) {
      console.error('Error checking onboarding status in middleware:', error)
      // On error, allow the request to proceed - the page will handle it
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
