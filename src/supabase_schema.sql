-- ====================================================================
-- SMYS INTRA HOSTEL CRICKET BY 75TH SATHPANTHA
-- Production PostgreSQL Schema & Storage Bucket Configuration
-- Compatible with Supabase + Vercel Deployment
-- ====================================================================

-- 1. Tournaments Master Table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2026',
  status TEXT DEFAULT 'live',
  date_label TEXT DEFAULT 'October 2026',
  timer_seconds INT DEFAULT 30,
  unsold_recall_rule TEXT DEFAULT 'end_of_round',
  allow_public_queue BOOLEAN DEFAULT TRUE,
  active_tier_id TEXT DEFAULT 'tier-elite',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Participating Franchise Teams
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo TEXT NOT NULL,
  color TEXT NOT NULL,
  secondary_color TEXT DEFAULT '#FFFFFF',
  captain TEXT NOT NULL,
  login_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  initial_purse BIGINT NOT NULL DEFAULT 1000000,
  remaining_purse BIGINT NOT NULL DEFAULT 1000000,
  spent_purse BIGINT NOT NULL DEFAULT 0,
  max_squad_size INT NOT NULL DEFAULT 15,
  players_count INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auction Tiers & Bid Thresholds
CREATE TABLE IF NOT EXISTS auction_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_rating NUMERIC(4,2) NOT NULL,
  max_rating NUMERIC(4,2) NOT NULL,
  min_bid BIGINT NOT NULL,
  bid_increment BIGINT NOT NULL,
  priority INT NOT NULL,
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Player Registrations
CREATE TABLE IF NOT EXISTS player_registrations (
  id TEXT PRIMARY KEY,
  reg_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  phone TEXT NOT NULL,
  matches_played INT DEFAULT 0,
  runs_scored INT DEFAULT 0,
  wickets_taken INT DEFAULT 0,
  playing_role TEXT NOT NULL,
  batting_rating NUMERIC(3,1),
  bowling_rating NUMERIC(3,1),
  wicketkeeping_rating NUMERIC(3,1),
  batting_style TEXT,
  bowling_style TEXT,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  assigned_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Live Auction State (Singleton row for live auction sync across all clients)
CREATE TABLE IF NOT EXISTS auction_state (
  id TEXT PRIMARY KEY DEFAULT 'live_auction',
  status TEXT DEFAULT 'idle',
  current_player_id TEXT REFERENCES player_registrations(id) ON DELETE SET NULL,
  current_bid BIGINT DEFAULT 0,
  current_bidder_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  timer_seconds_remaining INT DEFAULT 30,
  is_timer_running BOOLEAN DEFAULT FALSE,
  call_mode TEXT DEFAULT 'queue',
  last_bid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert singleton auction_state if not exists
INSERT INTO auction_state (id, status, current_bid, timer_seconds_remaining, is_timer_running, call_mode)
VALUES ('live_auction', 'idle', 0, 30, FALSE, 'queue')
ON CONFLICT (id) DO NOTHING;

-- 6. Live Bids Ledger
CREATE TABLE IF NOT EXISTS bids (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES player_registrations(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  team_color TEXT,
  amount BIGINT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Finalized Hammer Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES player_registrations(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_photo TEXT NOT NULL,
  player_role TEXT NOT NULL,
  player_tier TEXT,
  reg_number TEXT,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  team_color TEXT,
  final_price BIGINT NOT NULL,
  sold_at TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit & Action Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SUPABASE STORAGE: Player Photo Bucket Setup
-- ====================================================================

-- 1. Create public storage bucket for photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to prevent conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public View Player Photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow All Uploads to Player Photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow All Updates to Player Photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow All Deletions from Player Photos" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 3. Create Storage Policies for anonymous/authenticated access
CREATE POLICY "Public View Player Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Allow All Uploads to Player Photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-photos');

CREATE POLICY "Allow All Updates to Player Photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-photos');

CREATE POLICY "Allow All Deletions from Player Photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-photos');

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR TABLES
-- (Permissive for tournament operations with anon key)
-- ====================================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow universal read/write access via Supabase Anon Key
CREATE POLICY "Allow public all tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all auction_tiers" ON auction_tiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all player_registrations" ON player_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all auction_state" ON auction_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all bids" ON bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- REALTIME REPLICATION PUBLICATION
-- Stream live auction state, active bids, hammer sales, player registrations, and teams
-- ====================================================================

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_state;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bids;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE player_registrations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ====================================================================
-- OPTIONAL: INSTANT EGRESS & DATABASE RESET SCRIPT
-- If your DB size is bloated (e.g. 30 MB) from old base64 test images:
-- Run these commands in Supabase SQL Editor to instantly free up space:
--
-- UPDATE player_registrations 
-- SET photo_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
-- WHERE photo_url LIKE 'data:image%';
-- VACUUM FULL;
-- ====================================================================
