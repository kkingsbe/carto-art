# Supabase Setup Guide

This guide will help you set up Supabase for the CartoArt social features.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be fully provisioned

## 2. Run Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it in the SQL Editor
4. This will create:
   - `profiles` table
   - `maps` table
   - `votes` table
   - `comments` table
   - All necessary indexes, triggers, and RLS policies

## 3. Set Up Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `map-thumbnails`
3. Set it to **Public** bucket
4. Optionally configure file size limits (recommended: 5MB max)

## 4. Configure OAuth Providers

### Google OAuth

1. Go to Authentication > Providers in Supabase dashboard
2. Enable Google provider
3. Follow the instructions to set up OAuth credentials:
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### GitHub OAuth

1. Go to Authentication > Providers in Supabase dashboard
2. Enable GitHub provider
3. Follow the instructions to set up OAuth credentials:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

## 5. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Found in Project Settings > API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Project Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY`: Found in Project Settings > API (keep this secret!)

## 6. Update Site URL (Important!)

1. Go to Authentication > URL Configuration in Supabase dashboard
2. Set Site URL to your production domain (e.g., `https://yourdomain.com`)
3. Add redirect URLs for local development:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `/login` and try signing in with Google or GitHub
3. Verify that a profile is created automatically
4. Try creating and saving a map
5. Publish a map and verify it appears in the feed

## Troubleshooting

### Authentication not working
- Verify OAuth redirect URIs match exactly
- Check that Site URL is configured correctly
- Ensure environment variables are set correctly

### Database errors
- Verify the migration SQL ran successfully
- Check RLS policies are enabled
- Ensure the profile trigger function is created

### Storage upload fails
- Verify the `map-thumbnails` bucket exists and is public
- Check file size limits
- Ensure storage policies allow uploads

### Type errors

## 8. Carto Plus Subscription Migration

Run this SQL to add subscription support to the `profiles` table:

```sql
-- Add subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'unpaid', 'paused')),
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'carto_plus'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
```

## 9. Add Feature Flag for Paywall

Run this to add the gate feature flag (defaults to OFF in production):

```sql
INSERT INTO public.feature_flags (
    key, 
    name, 
    description, 
    enabled_production, 
    enabled_development, 
    enabled_percentage
) VALUES (
    'paywall_gif_video_export',
    'Paywall GIF/Video Exports',
    'Gates high-value export options behind Carto Plus subscription',
    false, -- Off by default in prod
    true,  -- On by default in dev for testing
    100
) ON CONFLICT (key) DO NOTHING;
```

