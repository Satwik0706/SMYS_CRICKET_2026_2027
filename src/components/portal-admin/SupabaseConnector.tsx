import React, { useState } from 'react';
import {
  Database,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Server,
  Zap,
  UploadCloud,
  DownloadCloud,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  HARDCODED_SUPABASE_URL,
  HARDCODED_SUPABASE_KEY,
} from '../../services/supabaseClient';
import { useTournamentStore } from '../../hooks/useTournamentStore';

export const SupabaseConnector: React.FC = () => {
  const store = useTournamentStore();
  const currentCreds = getSupabaseCredentials();

  const [url, setUrl] = useState(currentCreds.url || HARDCODED_SUPABASE_URL);
  const [key, setKey] = useState(currentCreds.key || HARDCODED_SUPABASE_KEY);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: { tables: boolean; storage: boolean } } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = url.trim() || HARDCODED_SUPABASE_URL;
    const targetKey = key.trim() || HARDCODED_SUPABASE_KEY;

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(targetUrl, targetKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseCredentials(targetUrl, targetKey);
      store.initSupabaseRealtime();
      await store.pullFromCloud();
    }
  };

  const handleDisconnect = () => {
    saveSupabaseCredentials('', '');
    setUrl(HARDCODED_SUPABASE_URL);
    setKey(HARDCODED_SUPABASE_KEY);
    setTestResult(null);
    setSyncStatus(null);
  };

  const handlePushToCloud = async () => {
    if (!currentCreds.isConfigured) {
      alert('Please connect and verify your Supabase credentials first.');
      return;
    }
    setSyncStatus({ type: 'loading', message: 'Pushing local tournament state to Supabase PostgreSQL...' });
    const res = await store.pushToCloud();
    if (res.success) {
      setSyncStatus({ type: 'success', message: res.message });
    } else {
      setSyncStatus({ type: 'error', message: res.message });
    }
  };

  const handlePullFromCloud = async () => {
    if (!currentCreds.isConfigured) {
      alert('Please connect and verify your Supabase credentials first.');
      return;
    }
    if (
      !confirm(
        'Pull latest data from Supabase Cloud? This will synchronize your local view with the cloud database.'
      )
    ) {
      return;
    }
    setSyncStatus({ type: 'loading', message: 'Fetching latest tournament dataset from Supabase Cloud...' });
    const res = await store.pullFromCloud();
    if (res.success) {
      setSyncStatus({ type: 'success', message: res.message });
    } else {
      setSyncStatus({ type: 'error', message: res.message });
    }
  };

  const sampleSQL = `-- ====================================================================
-- SMYS INTRA HOSTEL CRICKET - SUPABASE SETUP SCRIPT
-- Execute in Supabase SQL Editor:
-- ====================================================================

-- 1. Create Tables
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
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  assigned_team_id TEXT REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_state (
  id TEXT PRIMARY KEY DEFAULT 'live_auction',
  status TEXT DEFAULT 'idle',
  current_player_id TEXT REFERENCES player_registrations(id),
  current_bid BIGINT DEFAULT 0,
  current_bidder_team_id TEXT REFERENCES teams(id),
  timer_seconds_remaining INT DEFAULT 30,
  is_timer_running BOOLEAN DEFAULT FALSE,
  call_mode TEXT DEFAULT 'queue',
  last_bid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO auction_state (id, status, current_bid, timer_seconds_remaining, is_timer_running)
VALUES ('live_auction', 'idle', 0, 30, FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS bids (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES player_registrations(id),
  team_id TEXT REFERENCES teams(id),
  team_name TEXT NOT NULL,
  team_logo TEXT,
  team_color TEXT,
  amount BIGINT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES player_registrations(id),
  player_name TEXT NOT NULL,
  player_photo TEXT NOT NULL,
  player_role TEXT NOT NULL,
  player_tier TEXT,
  reg_number TEXT,
  team_id TEXT REFERENCES teams(id),
  team_name TEXT NOT NULL,
  team_logo TEXT,
  team_color TEXT,
  final_price BIGINT NOT NULL,
  sold_at TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Storage Bucket for Player Photographs
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public View Player Photos" ON storage.objects FOR SELECT USING (bucket_id = 'player-photos');
CREATE POLICY "Allow All Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-photos');
CREATE POLICY "Allow All Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'player-photos');

-- 3. Row Level Security & Universal Anon Access
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tiers" ON auction_tiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all players" ON player_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all auction_state" ON auction_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all bids" ON bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sales" ON sales FOR ALL USING (true) WITH CHECK (true);

-- 4. Realtime Replication & Full Replica Identity (Required for Supabase postgres_changes)
ALTER TABLE auction_state REPLICA IDENTITY FULL;
ALTER TABLE bids REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE player_registrations REPLICA IDENTITY FULL;
ALTER TABLE teams REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE auction_state; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE bids; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE sales; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE player_registrations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE teams; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;`;

  const replicationOnlySQL = `-- Quick Fix: Enable Realtime Replication & Full Identity on existing tables:
ALTER TABLE auction_state REPLICA IDENTITY FULL;
ALTER TABLE bids REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE player_registrations REPLICA IDENTITY FULL;
ALTER TABLE teams REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE auction_state; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE bids; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE sales; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE player_registrations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE teams; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;`;

  const [copiedReplSQL, setCopiedReplSQL] = useState(false);

  const handleCopyReplicationSQL = () => {
    navigator.clipboard.writeText(replicationOnlySQL);
    setCopiedReplSQL(true);
    setTimeout(() => setCopiedReplSQL(false), 3000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sampleSQL);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Cloud Database & Photo Storage Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Supabase Cloud Sync & Photo Storage</h2>
          <p className="text-xs text-slate-500">
            Connect your hosted Supabase instance to synchronize player registrations, bids, sales, and upload player photographs via high-speed CDN.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
              currentCreds.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentCreds.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{currentCreds.isConfigured ? 'Supabase Connected' : 'Local Realtime Broadcast Active'}</span>
          </div>
        </div>
      </div>

      {/* Cloud Sync Operations Card (Push & Pull) */}
      <div className="bg-gradient-to-r from-midnight via-midnight-800 to-deepBlue p-6 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gold flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Two-Way Cloud Data Synchronization</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Sync tournament roster, teams, purse balance, and live bids with your cloud PostgreSQL database.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePushToCloud}
              disabled={!currentCreds.isConfigured || syncStatus?.type === 'loading'}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-hover text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md disabled:opacity-40 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Push Local to Cloud</span>
            </button>
            <button
              onClick={handlePullFromCloud}
              disabled={!currentCreds.isConfigured || syncStatus?.type === 'loading'}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 border border-slate-700 disabled:opacity-40 transition-all"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Pull from Cloud</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : syncStatus.type === 'loading'
                ? 'bg-electric/20 text-cyan-300 border-electric/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
          >
            {syncStatus.type === 'loading' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            ) : syncStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Storage status note */}
        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
          <ImageIcon className="w-4 h-4 text-gold shrink-0" />
          <span>
            <strong>Supabase Storage:</strong> Player photos uploaded via the registration form are optimized and saved directly to the <code className="text-cyan-300 font-mono">player-photos</code> bucket with instant public CDN delivery.
          </span>
        </div>
      </div>

      {/* Connection Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Supabase Credentials
        </h3>
        <p className="text-xs text-slate-500 -mt-2">
          Obtain your credentials from your Supabase Dashboard under <strong>Project Settings → API</strong>.
        </p>

        <form onSubmit={handleTestConnection} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Project URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={HARDCODED_SUPABASE_URL}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-electric"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Anon / Public API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-electric"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={isTesting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test & Save Connection'}</span>
            </button>

            {currentCreds.isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Disconnect & Use Local Broadcast
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Database Schema Setup Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Complete PostgreSQL & Storage SQL Schema
            </h3>
            <p className="text-xs text-slate-500">
              Run this complete script once in your Supabase SQL Editor to set up all tables, Storage bucket policies, and Realtime publications.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReplicationSQL}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Copy the quick SQL to enable Realtime Replication on existing Supabase tables"
            >
              {copiedReplSQL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Zap className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{copiedReplSQL ? 'Replication SQL Copied!' : 'Copy Realtime Fix SQL'}</span>
            </button>
            <button
              onClick={handleCopySchema}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'SQL Copied!' : 'Copy Full Schema'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-midnight-900 text-slate-300 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800">
          <pre>{sampleSQL}</pre>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-gold shrink-0" />
          <span>
            <strong>Vercel Deployment Tip:</strong> For zero-configuration deployment on Vercel, add <code className="text-electric font-bold">VITE_SUPABASE_URL</code> and <code className="text-electric font-bold">VITE_SUPABASE_ANON_KEY</code> to your Vercel Project Settings → Environment Variables.
          </span>
        </div>
      </div>

      {/* Cloud & Admin Security Credentials Card */}
      <AdminCloudSecurityCard />
    </div>
  );
};

const AdminCloudSecurityCard: React.FC = () => {
  const store = useTournamentStore();
  const [currentPass, setCurrentPass] = useState('');
  const [newId, setNewId] = useState(store.adminId);
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentPass) {
      setMsg({ type: 'error', text: 'Enter current admin password' });
      return;
    }
    const res = store.updateAdminCredentials(currentPass, newId.trim(), newPass);
    if (res.success) {
      setMsg({ type: 'success', text: res.message });
      setCurrentPass('');
      setNewPass('');
    } else {
      setMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-electric/10 text-electric flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Admin Access & Cloud Security Credentials
            </h3>
            <p className="text-xs text-slate-500">
              Current Admin ID: <strong className="font-mono text-electric">{store.adminId}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
        >
          {isOpen ? 'Close' : 'Change Admin ID / Password'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleUpdate} className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          {msg && (
            <div
              className={`p-3 rounded-xl font-bold border ${
                msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Admin ID</label>
              <input
                type="text"
                required
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-electric"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Current pass"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-electric"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="New pass (min 4 chars)"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-electric"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md"
            >
              Update Credentials
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
