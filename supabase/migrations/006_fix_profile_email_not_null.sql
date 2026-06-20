-- Migration: Fix profiles email NOT NULL constraint and handle_new_user trigger
-- Dropping the NOT NULL constraint on email column to support OAuth signups without public emails
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Recreate the trigger function to safely handle null emails and extract from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile (handle both magic link and OAuth)
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert credits for new user (10 free credits)
  INSERT INTO public.credits (user_id, balance, is_unlimited)
  VALUES (NEW.id, 10.00, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
