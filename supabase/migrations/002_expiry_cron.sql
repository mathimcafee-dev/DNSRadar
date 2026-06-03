-- Add ssl_alert_days to profiles (default 30)
alter table public.profiles
  add column if not exists ssl_alert_days integer default 30;

-- Schedule expiry-alert edge function daily at 08:00 UTC
-- (same pattern as monitor-cron in 001_schema.sql)
select cron.schedule(
  'expiry-alert',
  '0 8 * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.edge_fn_url') || '/expiry-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.edge_fn_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
