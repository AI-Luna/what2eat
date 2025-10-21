# Testing Guide - Clerk Authentication Flow

This guide will walk you through testing the complete authentication and onboarding flow.

## Prerequisites

Before testing, ensure you have:

1. ✅ Added your Clerk keys to `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   OPENAI_API_KEY=sk-proj-...
   ```

2. ✅ Installed all dependencies:
   ```bash
   npm install
   ```

3. ✅ Started the development server:
   ```bash
   npm run dev
   ```

## Complete Testing Flow

### Step 1: Initial Visit (Should Redirect to Sign-In)

1. Open browser to `http://localhost:3000`
2. **Expected**: You should be automatically redirected to Clerk's sign-in page
3. **Verification**: URL should show Clerk's authentication modal or redirect

### Step 2: Create New Account

1. Click "Sign Up" button
2. Enter your email and create a password (or use social login if configured)
3. Complete email verification if required
4. **Expected**: After sign-up completes, you should be automatically redirected to `/onboarding`

### Step 3: Complete Onboarding Form

The onboarding form has two sections:

#### Dietary Restrictions (Multi-select)
- [ ] Vegetarian
- [ ] Vegan
- [ ] Gluten-free (celiac disease)
- [ ] Lactose intolerant
- [ ] Kosher
- [ ] Halal
- [ ] Low sodium
- [ ] Diabetic-friendly/Low sugar
- [ ] Other (text input appears if selected)

#### Allergies (Multi-select)
- [ ] Dairy/Milk
- [ ] Eggs
- [ ] Peanuts
- [ ] Tree nuts
- [ ] Soy
- [ ] Wheat
- [ ] Fish
- [ ] Shellfish
- [ ] Sesame
- [ ] Other (can add multiple text inputs)

**Test Scenario**: Select at least 2 dietary restrictions and 2 allergies

Example:
- Dietary Restrictions: ✓ Vegetarian, ✓ Gluten-free
- Allergies: ✓ Peanuts, ✓ Dairy/Milk

### Step 4: Submit Preferences

1. Click "Complete Setup" button
2. **Expected Behavior**:
   - Button text changes to "Saving..."
   - Button becomes disabled during save
   - After successful save, redirects to `/success` page

### Step 5: Verify Success Page

On the success page, you should see:

1. ✅ **Green checkmark icon** at the top
2. ✅ **"Successfully Saved!"** heading
3. ✅ **Your saved preferences displayed**, including:
   - Dietary restrictions as blue pills
   - Allergies as red pills
   - Any "Other" text you entered
4. ✅ **Verification instructions** for checking Clerk Dashboard
5. ✅ **Countdown timer** (5 seconds) before auto-redirect
6. ✅ **"Go to Home Now"** button

**Screenshot this page** - it confirms your preferences were saved!

### Step 6: Verify in Clerk Dashboard

1. Open [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign in to your Clerk account
3. Navigate to **"Users"** in the sidebar
4. Find and click on your test user account
5. Scroll down to **"Public metadata"** section
6. **Expected**: You should see JSON like this:

```json
{
  "dietaryPreferences": {
    "restrictions": ["Vegetarian", "Gluten-free (celiac disease)"],
    "allergies": ["Peanuts", "Dairy/Milk"],
    "hasCompletedOnboarding": true
  }
}
```

7. ✅ **Take a screenshot** - this proves data was saved to Clerk!

### Step 7: Check Server Logs

In your terminal where `npm run dev` is running, you should see:

```
[SavePreferences] Saving preferences for user: user_xxxxx
[SavePreferences] Dietary preferences: {
  "restrictions": ["Vegetarian", "Gluten-free (celiac disease)"],
  "restrictionsOther": undefined,
  "allergies": ["Peanuts", "Dairy/Milk"],
  "allergiesOther": undefined,
  "hasCompletedOnboarding": true
}
[SavePreferences] ✓ Successfully saved to Clerk
[SavePreferences] Updated user metadata: { ... }
```

### Step 8: Test Redirect Behavior

After 5 seconds (or clicking "Go to Home Now"):
- **Expected**: Redirected to home page `/`
- **Expected**: You should NOT be redirected back to onboarding
- **Expected**: Header shows your profile picture (UserButton) instead of Sign In/Sign Up

### Step 9: Test Return Visit

1. Refresh the page or visit `http://localhost:3000` again
2. **Expected**: You stay on the home page (no redirect to onboarding)
3. **Expected**: You're still authenticated

### Step 10: Test Protected Route Access

1. Try visiting `/onboarding` manually
2. **Expected**: Since you've already completed onboarding, you should be redirected to `/`

### Step 11: Test Sign Out

1. Click on your profile picture (UserButton) in the header
2. Click "Sign out"
3. **Expected**: You're signed out and redirected to sign-in page

### Step 12: Test Sign In (Existing User)

1. Sign in with the same account you created
2. **Expected**: You go directly to home page (skip onboarding since already completed)
3. **Expected**: No prompt for dietary preferences again

## Troubleshooting

### Issue: "Unauthorized" error on `/api/savePreferences`

**Cause**: Clerk keys not configured or user not authenticated

**Solution**:
1. Check `.env.local` has correct Clerk keys
2. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again
3. Clear browser cookies for localhost
4. Try signing in again

### Issue: Redirect loop between `/onboarding` and `/`

**Cause**: Metadata not saving properly or middleware issue

**Solution**:
1. Check server logs for errors
2. Verify Clerk keys are correct
3. Check browser console for JavaScript errors
4. Try signing out and creating a new test account

### Issue: Success page shows "Loading..." forever

**Cause**: User metadata not updated yet

**Solution**:
1. Wait a few seconds and refresh
2. Check if savePreferences API returned success
3. Verify Clerk Dashboard shows the metadata

### Issue: Preferences not showing on success page

**Cause**: Clerk metadata sync delay

**Solution**:
1. The onboarding form now waits 500ms before redirect
2. If still not showing, refresh the `/success` page
3. Check Clerk Dashboard to confirm data was saved

## Expected Console Output

### Browser Console (Success Case)
No errors should appear. You might see Clerk authentication logs.

### Server Console (Success Case)
```
[SavePreferences] Saving preferences for user: user_xxxxx
[SavePreferences] Dietary preferences: { ... }
[SavePreferences] ✓ Successfully saved to Clerk
[SavePreferences] Updated user metadata: { ... }
```

### Browser Console (Error Case)
```
Error saving preferences: <error details>
```

### Server Console (Error Case)
```
Error saving preferences: <error details>
Error checking onboarding status in middleware: <error details>
```

## Success Criteria

✅ All tests passed if:

1. Sign-up redirects to `/onboarding`
2. Onboarding form submits without errors
3. Redirect to `/success` page occurs
4. Success page displays your saved preferences
5. Clerk Dashboard shows metadata under your user
6. Server logs show successful save
7. Return visits skip onboarding
8. Sign out and sign in works correctly

## Next Steps After Successful Testing

Once all tests pass, you can:

1. Test the AI features with your dietary preferences:
   - `/api/generateQuiz` - Should consider your restrictions
   - `/api/processMenu` - Should highlight compatible items
   - `/api/suggestMenuItem` - Should filter by your allergies

2. Build the main application UI

3. Create additional pages that use the dietary preferences

## Getting Help

If you encounter issues:

1. Check the [CLERK_SETUP.md](CLERK_SETUP.md) guide
2. Review Clerk logs in dashboard
3. Check server console for detailed error messages
4. Verify environment variables are set correctly
