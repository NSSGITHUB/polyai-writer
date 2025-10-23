-- 刪除錯誤的 cron job
SELECT cron.unschedule('process-scheduled-wordpress-posts-http');

-- 使用正確的參數順序創建 cron job
SELECT cron.schedule(
  'process-scheduled-wordpress-posts-http',
  '* * * * *',
  $$
  SELECT extensions.http((
    'POST',
    'https://pjnyuexzxhwnsogxweng.supabase.co/functions/v1/process-scheduled-posts',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnl1ZXh6eGh3bnNvZ3h3ZW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg0Mzg3NCwiZXhwIjoyMDc2NDE5ODc0fQ.tZ0cqHBx3RzKVSXqKC0gW7Qx7HhA4lKJrQU8-YpOiOU'),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  $$
);