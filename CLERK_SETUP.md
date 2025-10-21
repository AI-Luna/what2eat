# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for the What2Eat application.

## Prerequisites

- Node.js and npm installed
- A Clerk account (free tier available at [clerk.com](https://clerk.com))

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click "Add application"
3. Give your application a name (e.g., "What2Eat")
4. Choose your authentication options (Email, Google, etc.)
5. Click "Create application"

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. In the Clerk Dashboard, copy your API keys from the "API Keys" section

3. Update `.env.local` with your Clerk keys:
   ```env
   OPENAI_API_KEY=your_existing_openai_key

   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

### 4. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you should be redirected to the sign-in page.

## How It Works

### Authentication Flow

1. **First Visit**: Users see the sign-in/sign-up page (only public route)
2. **New User Sign Up**: After signing up, users are automatically redirected to `/onboarding`
3. **Onboarding**: Users complete a form with:
   - Dietary restrictions (Vegetarian, Vegan, Gluten-free, etc.)
   - Allergies (Dairy, Eggs, Peanuts, etc.)
4. **Saved Preferences**: Data is saved to Clerk's `publicMetadata` (no database needed!)
5. **Access Granted**: Users can now access the main application

### Middleware Protection

The middleware ([src/middleware.ts](src/middleware.ts)) ensures:
- All routes except `/sign-in` and `/sign-up` require authentication
- Authenticated users without completed onboarding are redirected to `/onboarding`
- Completed users can access all protected routes

### Data Storage

User dietary preferences are stored in Clerk's `publicMetadata`:

```typescript
{
  dietaryPreferences: {
    restrictions: ["Vegetarian", "Gluten-free"],
    restrictionsOther: "No red meat",
    allergies: ["Peanuts", "Tree nuts"],
    allergiesOther: ["Kiwi"],
    hasCompletedOnboarding: true
  }
}
```

### API Integration

All three API routes automatically include user dietary preferences in AI prompts:

- **[/api/generateQuiz](src/app/api/generateQuiz/route.ts)**: Generates quiz questions considering dietary needs
- **[/api/processMenu](src/app/api/processMenu/route.ts)**: Extracts menu items with dietary context
- **[/api/suggestMenuItem](src/app/api/suggestMenuItem/route.ts)**: Suggests items filtered by dietary restrictions

## File Structure

```
src/
├── middleware.ts                    # Route protection and onboarding redirect
├── app/
│   ├── layout.tsx                   # ClerkProvider and auth UI components
│   ├── onboarding/
│   │   └── page.tsx                 # Dietary preferences form
│   └── api/
│       ├── savePreferences/
│       │   └── route.ts             # Saves dietary data to Clerk
│       ├── generateQuiz/
│       │   └── route.ts             # Updated with dietary preferences
│       ├── processMenu/
│       │   └── route.ts             # Updated with dietary preferences
│       └── suggestMenuItem/
│           └── route.ts             # Updated with dietary preferences
├── lib/
│   └── clerk.ts                     # Helper utilities for Clerk
└── types/
    └── dietary.ts                   # TypeScript types for dietary data
```

## Testing the Flow

1. **Sign Up**: Create a new account
2. **Onboarding**: You should be automatically redirected to `/onboarding`
3. **Select Preferences**: Choose dietary restrictions and allergies
4. **Complete Setup**: Click "Complete Setup"
5. **Access App**: You should now be redirected to the home page
6. **Verify**: Try accessing any protected route - you should not be redirected to onboarding again

## Troubleshooting

### "Unauthorized" errors in API routes

- Make sure you're signed in
- Check that Clerk keys are correctly set in `.env.local`
- Restart the dev server after changing environment variables

### Redirect loop to onboarding

- Clear your browser cookies for localhost
- Check browser console for errors
- Verify that the onboarding form successfully saves data

### Clerk components not showing

- Ensure `ClerkProvider` is wrapping your app in `layout.tsx`
- Check that Clerk keys are properly set
- Look for errors in the browser console

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk User Metadata](https://clerk.com/docs/users/metadata)
