-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule notification processing to run every minute  
SELECT cron.schedule(
  'process-delivery-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://vltveasdxtfvvqbzxzuf.supabase.co/functions/v1/process-delivery-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHZlYXNkeHRmdnZxYnp4enVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzE5MiwiZXhwIjoyMDc0Nzk5MTkyfQ.i8Wc7YaOIrUqDRJT7Kq9vG6hHYOc39QLj-YONvHm1T4"}'::jsonb
  ) as request_id;
  $$
);