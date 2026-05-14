-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  report_time text default '07:00',
  alert_email boolean default true,
  alert_webhook text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Domains
create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  domain_name text not null,
  verify_token text unique not null,
  verified boolean default false,
  verified_at timestamptz,
  monitor_interval text default '6h' check (monitor_interval in ('1h','6h','24h','off')),
  next_scan_at timestamptz,
  health_score smallint,
  last_scanned_at timestamptz,
  paused boolean default false,
  created_at timestamptz default now(),
  constraint unique_user_domain unique (user_id, domain_name)
);

-- Scan results
create table if not exists scan_results (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  scanned_at timestamptz default now(),
  health_score smallint,
  score_dns smallint,
  score_email smallint,
  score_ssl smallint,
  score_propagation smallint,
  score_security smallint,
  score_blacklist smallint,
  dns_records jsonb,
  email_auth jsonb,
  ssl_info jsonb,
  propagation jsonb,
  security jsonb,
  blacklists jsonb,
  issues jsonb,
  raw_resolver text default 'cloudflare'
);

-- Keep only last 50 scans per domain (cleanup)
create or replace function cleanup_old_scans()
returns trigger language plpgsql as $$
begin
  delete from scan_results
  where domain_id = new.domain_id
    and id not in (
      select id from scan_results
      where domain_id = new.domain_id
      order by scanned_at desc
      limit 50
    );
  return new;
end;
$$;

drop trigger if exists cleanup_scans_trigger on scan_results;
create trigger cleanup_scans_trigger
  after insert on scan_results
  for each row execute function cleanup_old_scans();

-- Alerts
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  alert_type text not null,
  severity text default 'info' check (severity in ('info','warn','critical')),
  category text,
  before_val text,
  after_val text,
  message text,
  read boolean default false,
  emailed boolean default false,
  created_at timestamptz default now()
);

-- Report snapshots
create table if not exists report_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  report_date date not null,
  domain_count smallint default 0,
  total_issues smallint default 0,
  critical_count smallint default 0,
  avg_score smallint,
  avg_score_delta smallint,
  domains_json jsonb,
  report_html text,
  sent_at timestamptz,
  constraint unique_user_report_date unique (user_id, report_date)
);

-- Anonymous scans (for public/non-auth users)
create table if not exists anon_scans (
  id uuid primary key default gen_random_uuid(),
  domain_name text not null,
  scan_type text default 'website',
  health_score smallint,
  results jsonb,
  ip_hash text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

-- Auto-delete expired anon scans
create or replace function delete_expired_anon_scans()
returns void language sql as $$
  delete from anon_scans where expires_at < now();
$$;

-- ─── RLS ───────────────────────────────────────────────

alter table profiles enable row level security;
alter table domains enable row level security;
alter table scan_results enable row level security;
alter table alerts enable row level security;
alter table report_snapshots enable row level security;
alter table anon_scans enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_self" on profiles for all using (auth.uid() = id);

-- Domains: users own their domains
create policy "domains_owner" on domains for all using (auth.uid() = user_id);

-- Scan results: via domain ownership
create policy "scan_results_owner" on scan_results for all
  using (exists (select 1 from domains where domains.id = scan_results.domain_id and domains.user_id = auth.uid()));

-- Alerts: own alerts only
create policy "alerts_owner" on alerts for all using (auth.uid() = user_id);

-- Report snapshots: own reports only
create policy "reports_owner" on report_snapshots for all using (auth.uid() = user_id);

-- Anon scans: public insert, no select (edge fn bypasses RLS)
create policy "anon_scans_insert" on anon_scans for insert with check (true);

-- Service role (edge functions) bypass RLS via service key

-- ─── INDEXES ────────────────────────────────────────────

create index if not exists idx_domains_user on domains(user_id);
create index if not exists idx_domains_next_scan on domains(next_scan_at) where verified = true and paused = false;
create index if not exists idx_scan_results_domain on scan_results(domain_id, scanned_at desc);
create index if not exists idx_alerts_user_unread on alerts(user_id, read, created_at desc);
create index if not exists idx_reports_user_date on report_snapshots(user_id, report_date desc);
create index if not exists idx_anon_expires on anon_scans(expires_at);

-- ─── DASHBOARD VIEW ─────────────────────────────────────

create or replace view user_domains_view as
select
  d.*,
  sr.health_score as latest_score,
  sr.score_dns, sr.score_email, sr.score_ssl, sr.score_security,
  sr.issues as latest_issues,
  sr.scanned_at as latest_scan_at,
  (select count(*) from alerts a where a.domain_id = d.id and a.read = false) as unread_alerts
from domains d
left join lateral (
  select * from scan_results where domain_id = d.id order by scanned_at desc limit 1
) sr on true;

-- ─── pg_cron JOBS ───────────────────────────────────────
-- Run every hour: monitor cron
select cron.schedule(
  'monitor-cron',
  '0 * * * *',
  $$select net.http_post(
    url := current_setting('app.edge_fn_url') || '/monitor-cron',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  )$$
);

-- Run daily at 07:00 UTC: report cron
select cron.schedule(
  'report-cron',
  '0 7 * * *',
  $$select net.http_post(
    url := current_setting('app.edge_fn_url') || '/report-cron',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  )$$
);
