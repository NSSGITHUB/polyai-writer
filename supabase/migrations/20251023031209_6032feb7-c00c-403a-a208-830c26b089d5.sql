-- Drop the old function that uses settings
DROP FUNCTION IF EXISTS public.process_scheduled_wordpress_posts();

-- Create a simplified version that uses vault to get secrets
CREATE OR REPLACE FUNCTION public.process_scheduled_wordpress_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get secrets from vault
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL'
  LIMIT 1;
  
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- Call edge function using http extension
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;