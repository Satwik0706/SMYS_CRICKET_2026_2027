import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AuctionConfig,
  AuctionState,
  AuctionTier,
  AuditLog,
  BidRecord,
  PlayerRegistration,
  SaleRecord,
  Team,
} from '../types';

const STORAGE_KEY_URL = 'smys_supabase_url';
const STORAGE_KEY_KEY = 'smys_supabase_anon_key';
const STORAGE_BUCKET_PHOTOS = 'player-photos';

export const HARDCODED_SUPABASE_URL = 'https://bugtqzvswkgmcrlkhmtc.supabase.co';
export const HARDCODED_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z3RxenZzd2tnbWNybGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTc5NzcsImV4cCI6MjEwNzg3Mzk3N30.-CIv4updWbjPb0u0PCTcoTdFn6GY8o8EX7iitQiJ84U';

export const DEFAULT_SUPABASE_URL = HARDCODED_SUPABASE_URL;
export const DEFAULT_SUPABASE_ANON_KEY = HARDCODED_SUPABASE_KEY;

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  // Use valid localUrl if set, otherwise fallback to HARDCODED credentials
  const url = (localUrl && localUrl.trim().startsWith('http') ? localUrl : envUrl || HARDCODED_SUPABASE_URL).trim();
  const key = (localKey && localKey.trim().length > 20 ? localKey : envKey || HARDCODED_SUPABASE_KEY).trim();

  return {
    url,
    key,
    isConfigured: true,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window === 'undefined') return;
  if (url && key) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  supabaseInstance = null; // Reset cached instance
}

let supabaseInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!supabaseInstance || lastUrl !== url || lastKey !== key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      lastUrl = url;
      lastKey = key;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; details?: { tables: boolean; storage: boolean } }> {
  try {
    const client = createClient(url, key, { auth: { persistSession: false } });

    // 1. Test database access
    const { error: dbError } = await client.from('tournaments').select('id').limit(1);

    if (dbError && dbError.code !== 'PGRST116') {
      return {
        success: false,
        message: `Database error: ${dbError.message || dbError.code}. (Did you run the SQL schema in your Supabase SQL Editor?)`,
      };
    }

    // 2. Test storage access
    let storageOk = false;
    try {
      const { data: buckets } = await client.storage.listBuckets();
      storageOk = Boolean(buckets?.some((b) => b.id === STORAGE_BUCKET_PHOTOS || b.name === STORAGE_BUCKET_PHOTOS));
    } catch {
      storageOk = false;
    }

    return {
      success: true,
      message: storageOk
        ? 'Connected to Supabase! PostgreSQL Database & Storage Bucket "player-photos" are verified and ready.'
        : 'Connected to Supabase! (Database ready. If "player-photos" bucket is missing, run the storage bucket SQL from the schema).',
      details: {
        tables: true,
        storage: storageOk,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || 'Connection failed' };
  }
}

/**
 * Uploads a player photo to Supabase Storage and returns the public CDN URL.
 */
export async function uploadPlayerPhotoToSupabase(
  fileOrBlob: File | Blob,
  playerId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    const fileExt = 'jpg';
    const cleanId = playerId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = `avatars/${cleanId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET_PHOTOS)
      .upload(filePath, fileOrBlob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data } = client.storage.from(STORAGE_BUCKET_PHOTOS).getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Pushes entire local tournament state to Supabase PostgreSQL tables.
 */
export async function pushTournamentDataToSupabase(data: {
  players: PlayerRegistration[];
  teams: Team[];
  tiers: AuctionTier[];
  config: AuctionConfig;
  auctionState: AuctionState;
  bids: BidRecord[];
  sales: SaleRecord[];
  auditLogs: AuditLog[];
}): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase credentials are not configured' };
  }

  try {
    // 1. Tournaments
    await client.from('tournaments').upsert(
      {
        id: data.config.id || 'smys-auction-2026',
        title: data.config.title,
        subtitle: data.config.subtitle,
        academic_year: '2026',
        status: data.config.status,
        date_label: data.config.date,
        timer_seconds: data.config.timerSeconds,
        unsold_recall_rule: data.config.unsoldRecallRule,
        allow_public_queue: data.config.allowPublicQueue,
        active_tier_id: data.config.activeTierId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Teams
    if (data.teams.length > 0) {
      const teamsPayload = data.teams.map((t) => ({
        id: t.id,
        team_id: t.teamId,
        name: t.name,
        short_name: t.shortName,
        logo: t.logo,
        color: t.color,
        secondary_color: t.secondaryColor || '#FFFFFF',
        captain: t.captain,
        login_id: t.loginId,
        password_hash: t.passwordHash,
        initial_purse: t.initialPurse,
        remaining_purse: t.remainingPurse,
        spent_purse: t.spentPurse,
        max_squad_size: t.maxSquadSize,
        players_count: t.playersCount,
        status: t.status,
      }));
      await client.from('teams').upsert(teamsPayload, { onConflict: 'id' });
    }

    // 3. Auction Tiers
    if (data.tiers.length > 0) {
      const tiersPayload = data.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        min_rating: tier.minRating,
        max_rating: tier.maxRating,
        min_bid: tier.minBid,
        bid_increment: tier.bidIncrement,
        priority: tier.priority,
        badge_color: tier.badgeColor,
      }));
      await client.from('auction_tiers').upsert(tiersPayload, { onConflict: 'id' });
    }

    // 4. Player Registrations
    if (data.players.length > 0) {
      const playersPayload = data.players.map((p) => ({
        id: p.id,
        reg_number: p.regNumber,
        full_name: p.fullName,
        academic_year: p.academicYear,
        phone: p.phone,
        matches_played: p.matchesPlayed,
        runs_scored: p.runsScored,
        wickets_taken: p.wicketsTaken,
        playing_role: p.playingRole,
        batting_rating: p.battingRating,
        bowling_rating: p.bowlingRating,
        wicketkeeping_rating: p.wicketkeepingRating,
        batting_style: p.battingStyle,
        bowling_style: p.bowlingStyle,
        photo_url: p.photoUrl,
        status: p.status,
        verification_notes: p.verificationNotes || null,
        verified_by: p.verifiedBy || null,
        verified_at: p.verifiedAt ? new Date(p.verifiedAt).toISOString() : null,
        assigned_team_id: p.assignedTeamId || null,
      }));
      await client.from('player_registrations').upsert(playersPayload, { onConflict: 'id' });
    }

    // 5. Auction State
    await client.from('auction_state').upsert(
      {
        id: 'live_auction',
        status: data.auctionState.status,
        current_player_id: data.auctionState.currentPlayerId,
        current_bid: data.auctionState.currentBid,
        current_bidder_team_id: data.auctionState.currentBidderTeamId,
        timer_seconds_remaining: data.auctionState.timerSecondsRemaining,
        is_timer_running: data.auctionState.isTimerRunning,
        call_mode: data.auctionState.callMode,
        last_bid_at: data.auctionState.lastBidAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 6. Bids
    if (data.bids.length > 0) {
      const bidsPayload = data.bids.slice(0, 50).map((b) => ({
        id: b.id,
        player_id: b.playerId,
        team_id: b.teamId,
        team_name: b.teamName,
        team_logo: b.teamLogo,
        team_color: b.teamColor,
        amount: b.amount,
        timestamp: b.timestamp,
      }));
      await client.from('bids').upsert(bidsPayload, { onConflict: 'id' });
    }

    // 7. Sales
    if (data.sales.length > 0) {
      const salesPayload = data.sales.map((s) => ({
        id: s.id,
        player_id: s.playerId,
        player_name: s.playerName,
        player_photo: s.playerPhoto,
        player_role: s.playerRole,
        player_tier: s.playerTier,
        reg_number: s.regNumber,
        team_id: s.teamId,
        team_name: s.teamName,
        team_logo: s.teamLogo,
        team_color: s.teamColor,
        final_price: s.finalPrice,
        sold_at: s.soldAt,
      }));
      await client.from('sales').upsert(salesPayload, { onConflict: 'id' });
    }

    return {
      success: true,
      message: `Successfully synchronized ${data.teams.length} teams, ${data.players.length} players, and ${data.sales.length} sales to Supabase Cloud!`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: `Cloud synchronization failed: ${error.message}` };
  }
}

/**
 * Pulls tournament dataset from Supabase PostgreSQL tables.
 */
export async function pullTournamentDataFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    players: PlayerRegistration[];
    teams: Team[];
    tiers: AuctionTier[];
    config?: Partial<AuctionConfig>;
    auctionState?: AuctionState;
    bids: BidRecord[];
    sales: SaleRecord[];
  };
}> {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase credentials not configured' };
  }

  try {
    const [
      { data: teamsData, error: teamsError },
      { data: playersData, error: playersError },
      { data: tiersData },
      { data: auctionData },
      { data: bidsData },
      { data: salesData },
      { data: tournamentData },
    ] = await Promise.all([
      client.from('teams').select('*').order('created_at', { ascending: true }),
      client.from('player_registrations').select('*').order('created_at', { ascending: false }),
      client.from('auction_tiers').select('*').order('priority', { ascending: true }),
      client.from('auction_state').select('*').eq('id', 'live_auction').single(),
      client.from('bids').select('*').order('created_at', { ascending: false }).limit(50),
      client.from('sales').select('*').order('created_at', { ascending: false }),
      client.from('tournaments').select('*').limit(1).maybeSingle(),
    ]);

    if (teamsError || playersError) {
      throw new Error(teamsError?.message || playersError?.message);
    }

    const teams: Team[] = (teamsData || []).map((t) => ({
      id: t.id,
      teamId: t.team_id,
      name: t.name,
      shortName: t.short_name,
      logo: t.logo,
      color: t.color,
      secondaryColor: t.secondary_color,
      captain: t.captain,
      loginId: t.login_id,
      passwordHash: t.password_hash,
      initialPurse: Number(t.initial_purse),
      remainingPurse: Number(t.remaining_purse),
      spentPurse: Number(t.spent_purse),
      maxSquadSize: Number(t.max_squad_size),
      playersCount: Number(t.players_count || 0),
      status: t.status,
    }));

    const players: PlayerRegistration[] = (playersData || []).map((p) => ({
      id: p.id,
      regNumber: p.reg_number,
      fullName: p.full_name,
      academicYear: p.academic_year,
      phone: p.phone,
      matchesPlayed: Number(p.matches_played || 0),
      runsScored: Number(p.runs_scored || 0),
      wicketsTaken: Number(p.wickets_taken || 0),
      playingRole: p.playing_role,
      battingRating: p.batting_rating !== null ? Number(p.batting_rating) : null,
      bowlingRating: p.bowling_rating !== null ? Number(p.bowling_rating) : null,
      wicketkeepingRating: p.wicketkeeping_rating !== null ? Number(p.wicketkeeping_rating) : null,
      battingStyle: p.batting_style,
      bowlingStyle: p.bowling_style,
      photoUrl: p.photo_url,
      status: p.status,
      verificationNotes: p.verification_notes,
      verifiedBy: p.verified_by,
      verifiedAt: p.verified_at,
      createdAt: p.created_at,
      assignedTeamId: p.assigned_team_id,
    }));

    const tiers: AuctionTier[] = (tiersData || []).map((tier) => ({
      id: tier.id,
      name: tier.name,
      minRating: Number(tier.min_rating),
      maxRating: Number(tier.max_rating),
      minBid: Number(tier.min_bid),
      bidIncrement: Number(tier.bid_increment),
      priority: Number(tier.priority),
      badgeColor: tier.badge_color,
    }));

    const bids: BidRecord[] = (bidsData || []).map((b) => ({
      id: b.id,
      playerId: b.player_id,
      teamId: b.team_id,
      teamName: b.team_name,
      teamLogo: b.team_logo || '🏏',
      teamColor: b.team_color || '#2563EB',
      amount: Number(b.amount),
      timestamp: b.timestamp,
    }));

    const sales: SaleRecord[] = (salesData || []).map((s) => ({
      id: s.id,
      playerId: s.player_id,
      playerName: s.player_name,
      playerPhoto: s.player_photo,
      playerRole: s.player_role,
      playerTier: s.player_tier,
      regNumber: s.reg_number,
      teamId: s.team_id,
      teamName: s.team_name,
      teamLogo: s.team_logo || '🏆',
      teamColor: s.team_color || '#F5B82E',
      finalPrice: Number(s.final_price),
      soldAt: s.sold_at,
    }));

    let auctionState: AuctionState | undefined;
    if (auctionData) {
      auctionState = {
        status: auctionData.status,
        currentPlayerId: auctionData.current_player_id,
        currentBid: Number(auctionData.current_bid || 0),
        currentBidderTeamId: auctionData.current_bidder_team_id,
        timerSecondsRemaining: Number(auctionData.timer_seconds_remaining || 30),
        isTimerRunning: Boolean(auctionData.is_timer_running),
        callMode: auctionData.call_mode || 'queue',
        lastSale: null,
        lastBidAt: auctionData.last_bid_at,
      };
    }

    let config: Partial<AuctionConfig> | undefined;
    if (tournamentData) {
      config = {
        id: tournamentData.id,
        title: tournamentData.title,
        subtitle: tournamentData.subtitle,
        status: tournamentData.status,
        date: tournamentData.date_label,
        timerSeconds: tournamentData.timer_seconds,
        unsoldRecallRule: tournamentData.unsold_recall_rule,
        allowPublicQueue: tournamentData.allow_public_queue,
        activeTierId: tournamentData.active_tier_id,
      };
    }

    return {
      success: true,
      message: `Loaded ${players.length} players, ${teams.length} teams, and ${sales.length} sales from Supabase`,
      data: {
        players,
        teams,
        tiers: tiers.length > 0 ? tiers : [],
        config,
        auctionState,
        bids,
        sales,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: `Failed to fetch from Supabase: ${error.message}` };
  }
}
