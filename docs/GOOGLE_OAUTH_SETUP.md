# Google OAuth Setup

This document outlines the step-by-step instructions to configure Google OAuth login for **InterviewAI** in development and production environments.

## Step 1 — Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Configure the **OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**.
   - Select **External** as User Type.
   - App Name: `InterviewAI`.
   - Support email: (your developer email).
   - Add the scopes: `email`, `profile`, `openid`.
   - **Test Users:** Under development mode, you must add your Google email address as a test user so you can log in.
4. Create **Credentials**:
   - Go to **APIs & Services** → **Credentials**.
   - Click **+ Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `InterviewAI Web`.
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (Local Development)
     - `https://your-app.vercel.app` (Production URL)
   - **Authorized redirect URIs:**
     - Paste your Supabase callback URL here (retrieve this from Step 2 below). It will look like:
       `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy the generated **Client ID** and **Client Secret**.

---

## Step 2 — Supabase Dashboard

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** → **Providers** → **Google**.
3. **Enable** the Google provider.
4. Paste the **Client ID** and **Client Secret** obtained from Google Console in the previous step.
5. Click **Save**.
6. Copy the **Redirect URI** shown in the Google Auth settings section in Supabase, and paste it back into your Google Cloud Console under **Authorized redirect URIs**.

---

## Step 3 — Local and Production Configuration

- **Environment Variables:** You do **not** need to add Google Client ID or Client Secret values to your local `.env.local` or Vercel environment variables. All OAuth credentials live securely in the Supabase Dashboard.
- **Supabase Keys:** Ensure your standard client-side environment keys (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are loaded correctly.
- **Database Migrations:** Ensure that you run the migration `supabase/migrations/004_google_oauth_profile.sql` in your Supabase SQL Editor. This adds the necessary columns to the `profiles` table and updates the trigger to handle Google user metadata.
