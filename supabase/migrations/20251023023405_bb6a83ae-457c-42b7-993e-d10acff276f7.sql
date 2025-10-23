-- Add scheduled_time column to wordpress_posts table
ALTER TABLE wordpress_posts 
ADD COLUMN scheduled_time timestamp with time zone;

-- Add index for efficient querying of scheduled posts
CREATE INDEX idx_wordpress_posts_scheduled 
ON wordpress_posts(scheduled_time) 
WHERE status = 'scheduled';

-- Create function to process scheduled posts
CREATE OR REPLACE FUNCTION process_scheduled_wordpress_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function will be called by pg_cron to process scheduled posts
  -- The actual processing will be done by the edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'process-scheduled-wordpress-posts',
  '* * * * *', -- Every minute
  $$
  SELECT process_scheduled_wordpress_posts();
  $$
);