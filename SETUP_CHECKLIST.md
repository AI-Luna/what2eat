# Setup Checklist - Clerk Authentication

Use this checklist to ensure everything is configured correctly before testing.

## ✅ Pre-Flight Checklist

### 1. Environment Variables

- [ ] `.env.local` file exists in project root
- [ ] `OPENAI_API_KEY` is set (already done)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is added
- [ ] `CLERK_SECRET_KEY` is added (keep this secret!)
- [ ] Clerk keys are from the correct application in Clerk Dashboard

**How to verify:**
```bash
# File should exist
ls .env.local

# Should NOT print your actual keys (they're hidden)
cat .env.local
```

### 2. Dependencies Installed

- [ ] `@clerk/nextjs` package installed
- [ ] All dependencies installed

**How to verify:**
```bash
# Should show @clerk/nextjs in the list
npm list @clerk/nextjs

# Should show no errors
npm install
```

### 3. Clerk Dashboard Setup

- [ ] Clerk account created at [clerk.com](https://clerk.com)
- [ ] New application created in Clerk Dashboard
- [ ] Email authentication enabled (or other auth methods)
- [ ] API keys copied from dashboard

**Clerk Dashboard Checklist:**
1. Go to https://dashboard.clerk.com/
2. Click "Add application" (or select existing)
3. Copy Publishable Key: `pk_test_...`
4. Copy Secret Key: `sk_test_...`
5. Paste both into `.env.local`

### 4. File Structure

Verify these files exist:

**Core Authentication Files:**
- [ ] `src/middleware.ts` - Route protection
- [ ] `src/app/layout.tsx` - ClerkProvider wrapper
- [ ] `src/app/onboarding/page.tsx` - Dietary preferences form
- [ ] `src/app/success/page.tsx` - Success confirmation page
- [ ] `src/app/api/savePreferences/route.ts` - Save API endpoint

**Helper Files:**
- [ ] `src/lib/clerk.ts` - Utility functions
- [ ] `src/types/dietary.ts` - TypeScript types

**Documentation:**
- [ ] `CLERK_SETUP.md` - Setup instructions
- [ ] `TESTING_GUIDE.md` - Testing instructions
- [ ] `.env.example` - Environment template

### 5. Middleware Configuration

- [ ] `src/middleware.ts` uses `clerkMiddleware()`
- [ ] Public routes include `/sign-in` and `/sign-up`
- [ ] Onboarding and success routes exempt from onboarding check
- [ ] Middleware matcher excludes static files

**How to verify:**
Open `src/middleware.ts` and check:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// ✓ Using clerkMiddleware (not authMiddleware)

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])
// ✓ Sign-in and sign-up are public
```

### 6. Layout Configuration

- [ ] `ClerkProvider` wraps entire app
- [ ] Auth components in header (`SignInButton`, `SignUpButton`, `UserButton`)

**How to verify:**
Open `src/app/layout.tsx` and check:
```typescript
import { ClerkProvider, ... } from "@clerk/nextjs"
// ✓ Importing from @clerk/nextjs

<ClerkProvider>
  <html lang="en">
    // ✓ ClerkProvider wrapping app
```

### 7. Git Safety

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to git

**How to verify:**
```bash
# Should show .env* in the list
cat .gitignore | grep env

# Should return nothing (file is ignored)
git status | grep .env.local
```

## 🚀 Ready to Test?

If all boxes are checked above, you're ready to test!

### Quick Start Commands

```bash
# 1. Start development server
npm run dev

# 2. Open browser
# Visit: http://localhost:3000

# 3. Follow TESTING_GUIDE.md for complete test flow
```

### Expected First-Time Flow

```
Visit localhost:3000
    ↓
Redirect to sign-in (Clerk modal)
    ↓
Sign up with email
    ↓
Verify email (if required)
    ↓
Redirect to /onboarding
    ↓
Fill out dietary preferences
    ↓
Click "Complete Setup"
    ↓
Redirect to /success
    ↓
See confirmation with saved data
    ↓
Auto-redirect to home page (5 sec)
    ↓
✅ Setup Complete!
```

## 🔍 Verification Steps

### Verify in Browser (Frontend)

1. **Sign Up Works:**
   - Click "Sign Up" button
   - Form appears (Clerk modal)
   - Can create account

2. **Onboarding Appears:**
   - After sign-up, see `/onboarding` page
   - Form has dietary restrictions
   - Form has allergies

3. **Success Page Shows:**
   - After submit, see `/success` page
   - Your preferences displayed
   - Countdown timer works

### Verify in Clerk Dashboard (Backend)

1. Go to https://dashboard.clerk.com/
2. Navigate to "Users"
3. Click on your test user
4. Scroll to "Public metadata"
5. Should see:
   ```json
   {
     "dietaryPreferences": {
       "restrictions": [...],
       "allergies": [...],
       "hasCompletedOnboarding": true
     }
   }
   ```

### Verify in Server Logs (Terminal)

When you submit the form, terminal should show:
```
[SavePreferences] Saving preferences for user: user_xxxxx
[SavePreferences] Dietary preferences: { ... }
[SavePreferences] ✓ Successfully saved to Clerk
[SavePreferences] Updated user metadata: { ... }
```

## ❌ Common Issues

### Issue: Can't see sign-in modal

**Problem:** Clerk keys not configured or incorrect

**Solution:**
1. Check `.env.local` has both keys
2. Keys start with `pk_test_` and `sk_test_`
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: 401 Unauthorized on API calls

**Problem:** Clerk authentication not working

**Solution:**
1. Verify you're signed in (see UserButton in header)
2. Check Clerk keys in `.env.local`
3. Clear browser cookies
4. Sign out and sign in again

### Issue: Redirect loop

**Problem:** Middleware configuration issue

**Solution:**
1. Check `src/middleware.ts` has success route exemption
2. Verify onboarding form redirects to `/success`
3. Check server logs for errors

### Issue: Preferences not saving

**Problem:** API error or Clerk connection issue

**Solution:**
1. Check server terminal for error logs
2. Verify Clerk Secret Key is correct
3. Check network tab in browser DevTools
4. Look for error response from `/api/savePreferences`

## 📚 Next Steps

After successful setup:

1. ✅ Complete [TESTING_GUIDE.md](TESTING_GUIDE.md) walkthrough
2. ✅ Verify preferences saved in Clerk Dashboard
3. ✅ Test sign out and sign in again
4. ✅ Build your main application features
5. ✅ Test API routes with dietary preferences

## 🆘 Need Help?

1. Check [CLERK_SETUP.md](CLERK_SETUP.md) for detailed setup
2. Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing flow
3. Review server console logs for errors
4. Check browser console for JavaScript errors
5. Verify Clerk Dashboard for user data

## ✨ Success Indicators

You know everything is working when:

✅ Sign-up creates user in Clerk Dashboard
✅ Onboarding form appears after sign-up
✅ Form submission saves data without errors
✅ Success page displays your preferences
✅ Clerk Dashboard shows metadata
✅ Return visits skip onboarding
✅ Sign out and sign in works smoothly
✅ No errors in server or browser console

---

**Ready to test?** → See [TESTING_GUIDE.md](TESTING_GUIDE.md)
