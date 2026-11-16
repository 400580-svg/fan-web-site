-- Apply to the development database when setting up a fresh import.
-- Production schema changes are handled by Replit's Publish flow.
CREATE TABLE IF NOT EXISTS public.user_progress (
  clerk_user_id text PRIMARY KEY,
  progress jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.play_call_games (
  id uuid PRIMARY KEY,
  host_user_id text NOT NULL,
  guest_user_id text,
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'complete', 'cancelled')),
  home_roster jsonb NOT NULL,
  away_roster jsonb,
  state jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_call_games_status_created_idx
  ON public.play_call_games (status, created_at DESC);
CREATE INDEX IF NOT EXISTS play_call_games_host_updated_idx
  ON public.play_call_games (host_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS play_call_games_guest_updated_idx
  ON public.play_call_games (guest_user_id, updated_at DESC);
