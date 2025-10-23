-- 刪除舊的 cron job
SELECT cron.unschedule('process-scheduled-wordpress-posts');

-- 創建新的 cron job，直接使用 extensions.http_post
SELECT cron.schedule(
  'process-scheduled-wordpress-posts-http',
  '* * * * *',
  $$
  SELECT extensions.http_post(
    'https://pjnyuexzxhwnsogxweng.supabase.co/functions/v1/process-scheduled-posts',
    '{"time": "' || now()::text || '"}'::jsonb,
    'application/json'::text,
    jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnl1ZXh6eGh3bnNvZ3h3ZW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg0Mzg3NCwiZXhwIjoyMDc2NDE5ODc0fQ.tZ0cqHBx3RzKVSXqKC0gW7Qx7HhA4lKJrQU8-YpOiOU'
    )::jsonb,
    30000
  );
  $$
);