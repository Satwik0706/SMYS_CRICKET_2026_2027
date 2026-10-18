import {
  AppPortal,
  AuctionCallMode,
  AuctionConfig,
  AuctionState,
  AuctionTier,
  AuditLog,
  BidRecord,
  PlayerRegistration,
  RegistrationStatus,
  SaleRecord,
  Team,
} from '../types';
import {
  DEMO_PLAYERS,
  DEMO_TEAMS,
  INITIAL_CONFIG,
  INITIAL_PLAYERS,
  INITIAL_TEAMS,
  INITIAL_TIERS,
} from '../data/initialData';
import { sound } from './soundEffects';
import confetti from 'canvas-confetti';
import {
  getSupabase,
  pushTournamentDataToSupabase,
  pullTournamentDataFromSupabase,
} from './supabaseClient';

const STORAGE_KEY_PLAYERS = 'smys_players_v2';
const STORAGE_KEY_TEAMS = 'smys_teams_v2';
const STORAGE_KEY_TIERS = 'smys_tiers_v2';
const STORAGE_KEY_CONFIG = 'smys_config_v2';
const STORAGE_KEY_AUCTION = 'smys_auction_state_v2';
const STORAGE_KEY_BIDS = 'smys_bids_v2';
const STORAGE_KEY_SALES = 'smys_sales_v2';
const STORAGE_KEY_LOGS = 'smys_audit_logs_v2';
const STORAGE_KEY_TEAM_AUTH = 'smys_active_team_auth_v2';
const STORAGE_KEY_ADMIN_CREDS = 'smys_admin_credentials_v2';
const STORAGE_KEY_ADMIN_AUTH = 'smys_admin_auth_v2';

function safeSync(operation: PromiseLike<unknown> | Promise<unknown>) {
  try {
    Promise.resolve(operation).catch((err: unknown) => {
      console.warn('Supabase async sync notice:', err);
    });
  } catch (err: unknown) {
    console.warn('Supabase async sync exception:', err);
  }
}

export class TournamentStore {
  private static instance: TournamentStore;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();
  private timerInterval: number | null = null;
  private realtimeSubscribed: boolean = false;

  public players: PlayerRegistration[] = [];
  public teams: Team[] = [];
  public tiers: AuctionTier[] = [];
  public config: AuctionConfig = INITIAL_CONFIG;
  public auctionState: AuctionState = {
    status: 'idle',
    currentPlayerId: null,
    currentBid: 0,
    currentBidderTeamId: null,
    timerSecondsRemaining: 30,
    isTimerRunning: false,
    callMode: 'queue',
    lastSale: null,
    lastBidAt: null,
  };
  public bids: BidRecord[] = [];
  public sales: SaleRecord[] = [];
  public auditLogs: AuditLog[] = [];
  public activeTeamId: string | null = null;
  public adminId: string = 'admin';
  public adminPasswordHash: string = 'admin123';
  public isAdminAuth: boolean = false;

  private constructor() {
    this.loadFromStorage();

    // Cross-tab real-time sync channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('smys_cricket_broadcast_channel');
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          this.applyExternalState(event.data.payload);
        }
      };
    }

    // Recover team login and admin login from storage
    if (typeof window !== 'undefined') {
      const savedTeam = localStorage.getItem(STORAGE_KEY_TEAM_AUTH);
      if (savedTeam) {
        this.activeTeamId = savedTeam;
      }
      const savedAdminAuth = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      if (savedAdminAuth === 'true') {
        this.isAdminAuth = true;
      }
    }

    // Initialize Supabase realtime listeners if configured
    this.initSupabaseRealtime();
  }

  public static getInstance(): TournamentStore {
    if (!TournamentStore.instance) {
      TournamentStore.instance = new TournamentStore();
    }
    return TournamentStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public initSupabaseRealtime() {
    if (typeof window === 'undefined' || this.realtimeSubscribed) return;
    const client = getSupabase();
    if (!client) return;

    try {
      this.realtimeSubscribed = true;
      client
        .channel('smys-live-sync-public')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'auction_state' },
          (payload) => {
            if (payload.new && (payload.new as Record<string, unknown>).id === 'live_auction') {
              const row = payload.new as Record<string, unknown>;
              this.auctionState = {
                status: row.status as AuctionState['status'],
                currentPlayerId: (row.current_player_id as string) || null,
                currentBid: Number(row.current_bid || 0),
                currentBidderTeamId: (row.current_bidder_team_id as string) || null,
                timerSecondsRemaining: Number(row.timer_seconds_remaining || 30),
                isTimerRunning: Boolean(row.is_timer_running),
                callMode: (row.call_mode as AuctionCallMode) || 'queue',
                lastSale: this.auctionState.lastSale,
                lastBidAt: (row.last_bid_at as string) || null,
              };
              this.saveToStorage(false);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bids' },
          (payload) => {
            if (payload.new) {
              const row = payload.new as Record<string, unknown>;
              if (!this.bids.some((b) => b.id === row.id)) {
                this.bids.unshift({
                  id: row.id as string,
                  playerId: row.player_id as string,
                  teamId: row.team_id as string,
                  teamName: row.team_name as string,
                  teamLogo: (row.team_logo as string) || '🏏',
                  teamColor: (row.team_color as string) || '#2563EB',
                  amount: Number(row.amount),
                  timestamp: (row.timestamp as string) || new Date().toLocaleTimeString(),
                });
                sound.playBid();
                this.saveToStorage(false);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sales' },
          (payload) => {
            if (payload.new) {
              const row = payload.new as Record<string, unknown>;
              if (!this.sales.some((s) => s.id === row.id)) {
                const newSale: SaleRecord = {
                  id: row.id as string,
                  playerId: row.player_id as string,
                  playerName: row.player_name as string,
                  playerPhoto: row.player_photo as string,
                  playerRole: row.player_role as SaleRecord['playerRole'],
                  playerTier: row.player_tier as string,
                  regNumber: row.reg_number as string,
                  teamId: row.team_id as string,
                  teamName: row.team_name as string,
                  teamLogo: (row.team_logo as string) || '🏆',
                  teamColor: (row.team_color as string) || '#F5B82E',
                  finalPrice: Number(row.final_price),
                  soldAt: row.sold_at as string,
                };
                this.sales.unshift(newSale);
                this.auctionState.lastSale = newSale;
                this.auctionState.status = 'sold';
                this.recalculateTeamStats();
                sound.playSold();
                this.launchConfetti();
                this.saveToStorage(false);
              }
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase realtime init warning:', err);
    }
  }

  private saveToStorage(broadcast: boolean = true) {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(this.players));
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(this.teams));
      localStorage.setItem(STORAGE_KEY_TIERS, JSON.stringify(this.tiers));
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEY_AUCTION, JSON.stringify(this.auctionState));
      localStorage.setItem(STORAGE_KEY_BIDS, JSON.stringify(this.bids));
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(this.sales));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    if (broadcast && this.channel) {
      this.channel.postMessage({
        type: 'SYNC_STATE',
        payload: {
          players: this.players,
          teams: this.teams,
          tiers: this.tiers,
          config: this.config,
          auctionState: this.auctionState,
          bids: this.bids,
          sales: this.sales,
          auditLogs: this.auditLogs,
        },
      });
    }

    this.notify();
  }

  private loadFromStorage() {
    try {
      const storedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
      const storedTeams = localStorage.getItem(STORAGE_KEY_TEAMS);
      const storedTiers = localStorage.getItem(STORAGE_KEY_TIERS);
      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      const storedAuction = localStorage.getItem(STORAGE_KEY_AUCTION);
      const storedBids = localStorage.getItem(STORAGE_KEY_BIDS);
      const storedSales = localStorage.getItem(STORAGE_KEY_SALES);
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

      this.players = storedPlayers ? JSON.parse(storedPlayers) : [];
      this.teams = storedTeams ? JSON.parse(storedTeams) : [];
      this.tiers = storedTiers ? JSON.parse(storedTiers) : [...INITIAL_TIERS];
      this.config = storedConfig ? JSON.parse(storedConfig) : { ...INITIAL_CONFIG };
      this.auctionState = storedAuction ? JSON.parse(storedAuction) : { ...this.auctionState };
      this.bids = storedBids ? JSON.parse(storedBids) : [];
      this.sales = storedSales ? JSON.parse(storedSales) : [];
      this.auditLogs = storedLogs
        ? JSON.parse(storedLogs)
        : [
            {
              id: 'log-init',
              action: 'Tournament Initialized',
              performedBy: 'System',
              details: 'SMYS Intra Hostel Cricket initialized. Ready for custom team and player creation.',
              timestamp: new Date().toLocaleString(),
            },
          ];
      const storedAdminCreds = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
      if (storedAdminCreds) {
        try {
          const parsed = JSON.parse(storedAdminCreds);
          if (parsed.id) this.adminId = parsed.id;
          if (parsed.passwordHash) this.adminPasswordHash = parsed.passwordHash;
        } catch {}
      }
    } catch {
      this.players = [];
      this.teams = [];
      this.tiers = [...INITIAL_TIERS];
      this.config = { ...INITIAL_CONFIG };
    }
  }

  private applyExternalState(payload: Partial<TournamentStore>) {
    if (payload.players) this.players = payload.players;
    if (payload.teams) this.teams = payload.teams;
    if (payload.tiers) this.tiers = payload.tiers;
    if (payload.config) this.config = payload.config;
    if (payload.auctionState) this.auctionState = payload.auctionState;
    if (payload.bids) this.bids = payload.bids;
    if (payload.sales) this.sales = payload.sales;
    if (payload.auditLogs) this.auditLogs = payload.auditLogs;
    this.notify();
  }

  // --- Registration Actions ---

  public registerPlayer(data: Omit<PlayerRegistration, 'id' | 'regNumber' | 'status' | 'createdAt'>): PlayerRegistration {
    const nextSeq = this.players.length + 1;
    const regNumber = `SMYS-2026-${String(nextSeq).padStart(3, '0')}`;
    const newPlayer: PlayerRegistration = {
      ...data,
      id: `ply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      regNumber,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
    };

    this.players.unshift(newPlayer);
    this.addAuditLog('New Registration Submitted', newPlayer.fullName, `Player registered with ID ${regNumber}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('player_registrations').upsert({
          id: newPlayer.id,
          reg_number: newPlayer.regNumber,
          full_name: newPlayer.fullName,
          academic_year: newPlayer.academicYear,
          phone: newPlayer.phone,
          matches_played: newPlayer.matchesPlayed,
          runs_scored: newPlayer.runsScored,
          wickets_taken: newPlayer.wicketsTaken,
          playing_role: newPlayer.playingRole,
          batting_rating: newPlayer.battingRating,
          bowling_rating: newPlayer.bowlingRating,
          wicketkeeping_rating: newPlayer.wicketkeepingRating,
          batting_style: newPlayer.battingStyle,
          bowling_style: newPlayer.bowlingStyle,
          photo_url: newPlayer.photoUrl,
          status: newPlayer.status,
        })
      );
    }

    return newPlayer;
  }

  public verifyPlayer(playerId: string, status: RegistrationStatus, notes?: string, adminName: string = 'Chief Administrator') {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;

    player.status = status;
    player.verificationNotes = notes;
    player.verifiedBy = adminName;
    player.verifiedAt = new Date().toLocaleString();

    this.addAuditLog(
      `Player Registration ${status.toUpperCase()}`,
      adminName,
      `Player ${player.fullName} (${player.regNumber}) set to ${status}. Notes: ${notes || 'None'}`
    );
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client
          .from('player_registrations')
          .update({
            status,
            verification_notes: notes || null,
            verified_by: adminName,
            verified_at: new Date().toISOString(),
          })
          .eq('id', playerId)
      );
    }
  }

  public deletePlayer(playerId: string): { success: boolean; message: string } {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    const playerName = this.players[playerIndex].fullName;

    // Reset auction state if this player is currently called
    if (this.auctionState.currentPlayerId === playerId) {
      this.stopTimer();
      this.auctionState.status = 'idle';
      this.auctionState.currentPlayerId = null;
      this.auctionState.currentBid = 0;
      this.auctionState.currentBidderTeamId = null;
      this.auctionState.isTimerRunning = false;
    }

    // Remove any sales or bids for this player
    this.sales = this.sales.filter((s) => s.playerId !== playerId);
    this.bids = this.bids.filter((b) => b.playerId !== playerId);

    this.players.splice(playerIndex, 1);
    this.recalculateTeamStats();
    this.addAuditLog('Player Deleted', 'Administrator', `Deleted player ${playerName}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(client.from('player_registrations').delete().eq('id', playerId));
    }

    return { success: true, message: `Player "${playerName}" deleted successfully` };
  }

  public addPlayerByAdmin(data: Omit<PlayerRegistration, 'id' | 'regNumber' | 'createdAt'>): PlayerRegistration {
    const nextSeq = this.players.length + 1;
    const regNumber = `SMYS-2026-${String(nextSeq).padStart(3, '0')}`;
    const newPlayer: PlayerRegistration = {
      ...data,
      id: `ply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      regNumber,
      createdAt: new Date().toLocaleString(),
    };
    this.players.unshift(newPlayer);
    this.addAuditLog('Player Added by Admin', 'Administrator', `Directly added player ${newPlayer.fullName} (${regNumber})`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('player_registrations').upsert({
          id: newPlayer.id,
          reg_number: newPlayer.regNumber,
          full_name: newPlayer.fullName,
          academic_year: newPlayer.academicYear,
          phone: newPlayer.phone,
          matches_played: newPlayer.matchesPlayed,
          runs_scored: newPlayer.runsScored,
          wickets_taken: newPlayer.wicketsTaken,
          playing_role: newPlayer.playingRole,
          batting_rating: newPlayer.battingRating,
          bowling_rating: newPlayer.bowlingRating,
          wicketkeeping_rating: newPlayer.wicketkeepingRating,
          batting_style: newPlayer.battingStyle,
          bowling_style: newPlayer.bowlingStyle,
          photo_url: newPlayer.photoUrl,
          status: newPlayer.status,
          verification_notes: newPlayer.verificationNotes || null,
          verified_by: newPlayer.verifiedBy || null,
        })
      );
    }

    return newPlayer;
  }

  public bulkApprovePending(adminName: string = 'Chief Administrator') {
    let count = 0;
    this.players.forEach((p) => {
      if (p.status === 'pending') {
        p.status = 'verified';
        p.verifiedBy = adminName;
        p.verifiedAt = new Date().toLocaleString();
        count++;
      }
    });
    if (count > 0) {
      this.addAuditLog('Bulk Player Verification', adminName, `Approved ${count} pending registrations`);
      this.saveToStorage();
    }
  }

  // --- Team Management ---

  public createTeam(data: Omit<Team, 'id' | 'playersCount' | 'spentPurse' | 'remainingPurse'>) {
    const newTeam: Team = {
      ...data,
      id: `team-${Date.now()}`,
      spentPurse: 0,
      remainingPurse: data.initialPurse,
      playersCount: 0,
    };
    this.teams.push(newTeam);
    this.addAuditLog('Team Created', 'Administrator', `Created team ${newTeam.name} (${newTeam.teamId}) with purse ₹${newTeam.initialPurse.toLocaleString('en-IN')}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('teams').upsert({
          id: newTeam.id,
          team_id: newTeam.teamId,
          name: newTeam.name,
          short_name: newTeam.shortName,
          logo: newTeam.logo,
          color: newTeam.color,
          secondary_color: newTeam.secondaryColor || '#FFFFFF',
          captain: newTeam.captain,
          login_id: newTeam.loginId,
          password_hash: newTeam.passwordHash,
          initial_purse: newTeam.initialPurse,
          remaining_purse: newTeam.remainingPurse,
          spent_purse: newTeam.spentPurse,
          max_squad_size: newTeam.maxSquadSize,
          players_count: newTeam.playersCount,
          status: newTeam.status,
        })
      );
    }
  }

  public updateTeam(id: string, updates: Partial<Team>) {
    const team = this.teams.find((t) => t.id === id);
    if (!team) return;
    Object.assign(team, updates);
    this.addAuditLog('Team Updated', 'Administrator', `Updated details for ${team.name}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client
          .from('teams')
          .update({
            name: team.name,
            short_name: team.shortName,
            logo: team.logo,
            color: team.color,
            captain: team.captain,
            login_id: team.loginId,
            password_hash: team.passwordHash,
            initial_purse: team.initialPurse,
            max_squad_size: team.maxSquadSize,
            status: team.status,
          })
          .eq('id', id)
      );
    }
  }

  public deleteTeam(id: string): { success: boolean; message: string } {
    const teamIndex = this.teams.findIndex((t) => t.id === id);
    if (teamIndex === -1) {
      return { success: false, message: 'Team not found' };
    }
    const teamName = this.teams[teamIndex].name;

    const hasBoughtPlayers = this.sales.some((s) => s.teamId === id);
    if (hasBoughtPlayers) {
      return {
        success: false,
        message: `Cannot delete "${teamName}" because it already has acquired players in the live auction. Reset the auction or release players first.`,
      };
    }

    this.teams.splice(teamIndex, 1);
    this.addAuditLog('Team Deleted', 'Administrator', `Deleted team "${teamName}"`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(client.from('teams').delete().eq('id', id));
    }

    return { success: true, message: `Team "${teamName}" deleted successfully` };
  }

  public resetTeamCredentials(id: string, newPassword: string) {
    const team = this.teams.find((t) => t.id === id);
    if (!team) return;
    team.passwordHash = newPassword;
    this.addAuditLog('Team Credentials Reset', 'Administrator', `Reset password for ${team.name}`);
    this.saveToStorage();
  }

  // --- Team Authentication ---

  public loginTeam(loginId: string, password: string): { success: boolean; message: string; team?: Team } {
    const team = this.teams.find((t) => t.loginId.toLowerCase() === loginId.trim().toLowerCase());
    if (!team) {
      return { success: false, message: 'Invalid Team Login ID' };
    }
    if (team.status === 'disabled') {
      return { success: false, message: 'This team account is disabled by administrator' };
    }
    if (team.passwordHash !== password.trim()) {
      return { success: false, message: 'Invalid Team Password' };
    }
    this.activeTeamId = team.id;
    localStorage.setItem(STORAGE_KEY_TEAM_AUTH, team.id);
    this.notify();
    return { success: true, message: `Welcome ${team.name}!`, team };
  }

  public logoutTeam() {
    this.activeTeamId = null;
    localStorage.removeItem(STORAGE_KEY_TEAM_AUTH);
    this.notify();
  }

  public getActiveTeam(): Team | null {
    if (!this.activeTeamId) return null;
    return this.teams.find((t) => t.id === this.activeTeamId) || null;
  }

  // --- Admin Authentication & Credentials ---

  public getAdminCredentials(): { id: string; passwordHash: string } {
    return {
      id: this.adminId,
      passwordHash: this.adminPasswordHash,
    };
  }

  public updateAdminCredentials(
    currentPassword: string,
    newId: string,
    newPassword: string
  ): { success: boolean; message: string } {
    if (currentPassword.trim() !== this.adminPasswordHash) {
      return { success: false, message: 'Current Admin Password does not match.' };
    }
    if (!newId.trim()) {
      return { success: false, message: 'Admin ID cannot be empty.' };
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      return { success: false, message: 'New Password must be at least 4 characters long.' };
    }

    this.adminId = newId.trim();
    this.adminPasswordHash = newPassword.trim();

    try {
      localStorage.setItem(
        STORAGE_KEY_ADMIN_CREDS,
        JSON.stringify({ id: this.adminId, passwordHash: this.adminPasswordHash })
      );
    } catch (e) {
      console.warn('Failed to save admin creds', e);
    }

    this.addAuditLog(
      'Admin Credentials Changed',
      'Administrator',
      `Admin ID updated to "${this.adminId}" and password was changed.`
    );
    this.notify();
    return { success: true, message: 'Admin credentials successfully updated!' };
  }

  public loginAdmin(id: string, password: string): { success: boolean; message: string } {
    if (
      id.trim().toLowerCase() === this.adminId.toLowerCase() &&
      password.trim() === this.adminPasswordHash
    ) {
      this.isAdminAuth = true;
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      this.addAuditLog('Admin Login Successful', this.adminId, 'Administrator authenticated into Control Centre');
      this.notify();
      return { success: true, message: 'Welcome Administrator!' };
    }
    return { success: false, message: 'Invalid Administrator ID or Password.' };
  }

  public logoutAdmin() {
    this.isAdminAuth = false;
    localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    this.addAuditLog('Admin Logged Out', this.adminId, 'Administrator signed out');
    this.notify();
  }

  public isAdminAuthenticated(): boolean {
    return this.isAdminAuth;
  }

  // --- Player Assignment & Squad Balancing ---

  public assignPlayerToTeam(playerId: string, teamId: string | null) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;

    player.assignedTeamId = teamId;
    this.recalculateTeamStats();
    this.addAuditLog('Player Assigned', 'Administrator', `Player ${player.fullName} assigned to ${teamId || 'Unassigned'}`);
    this.saveToStorage();
  }

  public autoAssignTeams() {
    const verified = this.players.filter((p) => p.status === 'verified');
    if (verified.length === 0 || this.teams.length === 0) return;

    const sorted = [...verified].sort((a, b) => {
      const rateA = Math.max(a.battingRating || 0, a.bowlingRating || 0, a.wicketkeepingRating || 0);
      const rateB = Math.max(b.battingRating || 0, b.bowlingRating || 0, b.wicketkeepingRating || 0);
      return rateB - rateA;
    });

    let teamIndex = 0;
    let forward = true;

    sorted.forEach((player) => {
      const team = this.teams[teamIndex];
      player.assignedTeamId = team.id;

      if (forward) {
        if (teamIndex === this.teams.length - 1) {
          forward = false;
        } else {
          teamIndex++;
        }
      } else {
        if (teamIndex === 0) {
          forward = true;
        } else {
          teamIndex--;
        }
      }
    });

    this.recalculateTeamStats();
    this.addAuditLog('Auto Squad Balancing', 'Administrator', `Balanced ${sorted.length} players across ${this.teams.length} teams`);
    this.saveToStorage();
  }

  public recalculateTeamStats() {
    this.teams.forEach((t) => {
      const soldPlayers = this.sales.filter((s) => s.teamId === t.id);
      t.playersCount = soldPlayers.length;
      t.spentPurse = soldPlayers.reduce((sum, s) => sum + s.finalPrice, 0);
      t.remainingPurse = Math.max(0, t.initialPurse - t.spentPurse);
    });
  }

  // --- Tier & Configuration ---

  public updateTiers(newTiers: AuctionTier[]) {
    this.tiers = newTiers;
    this.addAuditLog('Auction Tiers Updated', 'Administrator', 'Modified auction tiers and bid thresholds');
    this.saveToStorage();
  }

  public updateConfig(newConfig: Partial<AuctionConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.addAuditLog('Auction Config Updated', 'Administrator', 'Modified auction configuration');
    this.saveToStorage();
  }

  // --- Live Auction Command Actions ---

  public getPlayerTier(player: PlayerRegistration): AuctionTier {
    const maxRating = Math.max(
      player.battingRating || 0,
      player.bowlingRating || 0,
      player.wicketkeepingRating || 0
    );

    const matched = this.tiers.find(
      (tier) => maxRating >= tier.minRating && maxRating <= tier.maxRating
    );

    return matched || this.tiers[this.tiers.length - 1] || INITIAL_TIERS[0];
  }

  public getEligibleQueue(): PlayerRegistration[] {
    const soldPlayerIds = new Set(this.sales.map((s) => s.playerId));
    return this.players.filter(
      (p) => p.status === 'verified' && !soldPlayerIds.has(p.id)
    );
  }

  public callPlayer(playerId: string, mode: AuctionCallMode = 'queue') {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;

    const tier = this.getPlayerTier(player);

    this.stopTimer();

    this.auctionState = {
      status: 'bidding',
      currentPlayerId: player.id,
      currentBid: tier.minBid,
      currentBidderTeamId: null,
      timerSecondsRemaining: this.config.timerSeconds || 30,
      isTimerRunning: true,
      callMode: mode,
      lastSale: null,
      lastBidAt: null,
    };

    sound.playGavel();
    this.startTimer();
    this.addAuditLog('Player Called to Auction', 'Auctioneer', `Called ${player.fullName} (${player.regNumber}) - Opening Bid ₹${tier.minBid.toLocaleString('en-IN')}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('auction_state').upsert(
          {
            id: 'live_auction',
            status: 'bidding',
            current_player_id: player.id,
            current_bid: tier.minBid,
            current_bidder_team_id: null,
            timer_seconds_remaining: this.config.timerSeconds || 30,
            is_timer_running: true,
            call_mode: mode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      );
    }
  }

  public callNextEligiblePlayer() {
    const eligible = this.getEligibleQueue();
    const nextList = eligible.filter((p) => p.id !== this.auctionState.currentPlayerId);
    if (nextList.length > 0) {
      this.callPlayer(nextList[0].id, 'queue');
    }
  }

  public placeBid(teamId: string, customAmount?: number): { success: boolean; message: string } {
    if (this.auctionState.status !== 'bidding') {
      return { success: false, message: 'Auction is not currently open for bidding' };
    }

    const player = this.players.find((p) => p.id === this.auctionState.currentPlayerId);
    if (!player) {
      return { success: false, message: 'No active player in auction' };
    }

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found' };
    }

    if (team.status === 'disabled') {
      return { success: false, message: 'Your team account has been disabled' };
    }

    if (this.auctionState.currentBidderTeamId === teamId) {
      return { success: false, message: 'Your team is already the highest bidder!' };
    }

    if (team.playersCount >= team.maxSquadSize) {
      return { success: false, message: `Your team has reached maximum squad limit of ${team.maxSquadSize}` };
    }

    const tier = this.getPlayerTier(player);
    const increment = tier.bidIncrement || 10000;

    let targetBid: number;
    if (customAmount && customAmount > this.auctionState.currentBid) {
      targetBid = customAmount;
    } else {
      targetBid =
        this.auctionState.currentBidderTeamId === null
          ? this.auctionState.currentBid
          : this.auctionState.currentBid + increment;
    }

    if (team.remainingPurse < targetBid) {
      return {
        success: false,
        message: `Insufficient purse balance! Required: ₹${targetBid.toLocaleString('en-IN')}, Remaining: ₹${team.remainingPurse.toLocaleString('en-IN')}`,
      };
    }

    this.auctionState.currentBid = targetBid;
    this.auctionState.currentBidderTeamId = teamId;
    this.auctionState.timerSecondsRemaining = this.config.timerSeconds || 30;
    this.auctionState.lastBidAt = new Date().toISOString();

    const newBid: BidRecord = {
      id: `bid-${Date.now()}`,
      playerId: player.id,
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logo,
      teamColor: team.color,
      amount: targetBid,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.bids.unshift(newBid);
    sound.playBid();

    this.addAuditLog('New Leading Bid', team.name, `Bid ₹${targetBid.toLocaleString('en-IN')} on ${player.fullName}`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('auction_state').upsert(
          {
            id: 'live_auction',
            status: 'bidding',
            current_player_id: player.id,
            current_bid: targetBid,
            current_bidder_team_id: teamId,
            timer_seconds_remaining: this.config.timerSeconds || 30,
            is_timer_running: true,
            last_bid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      );

      safeSync(
        client.from('bids').insert({
          id: newBid.id,
          player_id: newBid.playerId,
          team_id: newBid.teamId,
          team_name: newBid.teamName,
          team_logo: newBid.teamLogo,
          team_color: newBid.teamColor,
          amount: newBid.amount,
          timestamp: newBid.timestamp,
        })
      );
    }

    return { success: true, message: `Bid of ₹${targetBid.toLocaleString('en-IN')} placed successfully!` };
  }

  public pauseBidding() {
    this.stopTimer();
    this.auctionState.status = 'paused';
    this.auctionState.isTimerRunning = false;
    this.addAuditLog('Auction Paused', 'Auctioneer', 'Paused bidding clock');
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(client.from('auction_state').update({ status: 'paused', is_timer_running: false }).eq('id', 'live_auction'));
    }
  }

  public resumeBidding() {
    this.auctionState.status = 'bidding';
    this.auctionState.isTimerRunning = true;
    this.startTimer();
    this.addAuditLog('Auction Resumed', 'Auctioneer', 'Resumed bidding clock');
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(client.from('auction_state').update({ status: 'bidding', is_timer_running: true }).eq('id', 'live_auction'));
    }
  }

  public markUnsold() {
    const player = this.players.find((p) => p.id === this.auctionState.currentPlayerId);
    if (!player) return;

    this.stopTimer();
    this.auctionState.status = 'unsold';
    this.auctionState.isTimerRunning = false;

    sound.playUnsold();
    this.addAuditLog('Player UNSOLD', 'Auctioneer', `${player.fullName} (${player.regNumber}) went unsold`);
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(client.from('auction_state').update({ status: 'unsold', is_timer_running: false }).eq('id', 'live_auction'));
    }
  }

  public acknowledgeUnsold() {
    this.stopTimer();
    this.auctionState.status = 'idle';
    this.auctionState.currentPlayerId = null;
    this.auctionState.currentBid = 0;
    this.auctionState.currentBidderTeamId = null;
    this.auctionState.isTimerRunning = false;
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client
          .from('auction_state')
          .update({
            status: 'idle',
            current_player_id: null,
            current_bid: 0,
            current_bidder_team_id: null,
            is_timer_running: false,
          })
          .eq('id', 'live_auction')
      );
    }
  }

  public resetAuctionToIdle() {
    this.stopTimer();
    this.auctionState.status = 'idle';
    this.auctionState.currentPlayerId = null;
    this.auctionState.currentBid = 0;
    this.auctionState.currentBidderTeamId = null;
    this.auctionState.isTimerRunning = false;
    this.auctionState.timerSecondsRemaining = this.config.timerSeconds || 30;
    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client
          .from('auction_state')
          .update({
            status: 'idle',
            current_player_id: null,
            current_bid: 0,
            current_bidder_team_id: null,
            is_timer_running: false,
            timer_seconds_remaining: this.config.timerSeconds || 30,
          })
          .eq('id', 'live_auction')
      );
    }
  }

  public confirmSale(): { success: boolean; message: string; sale?: SaleRecord } {
    if (!this.auctionState.currentPlayerId) {
      return { success: false, message: 'No active player to sell' };
    }

    if (!this.auctionState.currentBidderTeamId) {
      return { success: false, message: 'No bids placed yet! Cannot sell without a leading bid. Mark Unsold instead.' };
    }

    const player = this.players.find((p) => p.id === this.auctionState.currentPlayerId);
    const team = this.teams.find((t) => t.id === this.auctionState.currentBidderTeamId);

    if (!player || !team) {
      return { success: false, message: 'Player or Team data missing' };
    }

    const finalPrice = this.auctionState.currentBid;
    const tier = this.getPlayerTier(player);

    this.stopTimer();

    const sale: SaleRecord = {
      id: `sale-${Date.now()}`,
      playerId: player.id,
      playerName: player.fullName,
      playerPhoto: player.photoUrl,
      playerRole: player.playingRole,
      playerTier: tier.name,
      regNumber: player.regNumber,
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logo,
      teamColor: team.color,
      finalPrice,
      soldAt: new Date().toLocaleString(),
    };

    this.sales.unshift(sale);

    team.spentPurse += finalPrice;
    team.remainingPurse = Math.max(0, team.initialPurse - team.spentPurse);
    team.playersCount += 1;
    player.assignedTeamId = team.id;

    this.auctionState.status = 'sold';
    this.auctionState.isTimerRunning = false;
    this.auctionState.lastSale = sale;

    sound.playSold();
    sound.playGavel();
    this.launchConfetti();

    this.addAuditLog(
      'Player SOLD',
      'Auctioneer',
      `SOLD ${player.fullName} to ${team.name} for ₹${finalPrice.toLocaleString('en-IN')}`
    );

    this.saveToStorage();

    const client = getSupabase();
    if (client) {
      safeSync(
        client.from('sales').insert({
          id: sale.id,
          player_id: sale.playerId,
          player_name: sale.playerName,
          player_photo: sale.playerPhoto,
          player_role: sale.playerRole,
          player_tier: sale.playerTier,
          reg_number: sale.regNumber,
          team_id: sale.teamId,
          team_name: sale.teamName,
          team_logo: sale.teamLogo,
          team_color: sale.teamColor,
          final_price: sale.finalPrice,
          sold_at: sale.soldAt,
        })
      );

      safeSync(
        client.from('auction_state').update({
          status: 'sold',
          is_timer_running: false,
        }).eq('id', 'live_auction')
      );

      safeSync(
        client.from('teams').update({
          spent_purse: team.spentPurse,
          remaining_purse: team.remainingPurse,
          players_count: team.playersCount,
        }).eq('id', team.id)
      );

      safeSync(
        client.from('player_registrations').update({ assigned_team_id: team.id }).eq('id', player.id)
      );
    }

    return { success: true, message: `SOLD to ${team.name}!`, sale };
  }

  public launchConfetti() {
    if (typeof window === 'undefined') return;
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F5B82E', '#2563EB', '#7048E8', '#16A34A', '#FFFFFF'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#F5B82E', '#2563EB'],
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#F5B82E', '#7048E8'],
        });
      }, 250);
    } catch {
      // Confetti fallback
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      if (this.auctionState.status !== 'bidding') return;

      if (this.auctionState.timerSecondsRemaining > 1) {
        this.auctionState.timerSecondsRemaining -= 1;
        if (this.auctionState.timerSecondsRemaining <= 5) {
          sound.playTick();
        }
        this.saveToStorage(false);
      } else {
        this.auctionState.timerSecondsRemaining = 0;
        this.stopTimer();
        this.auctionState.isTimerRunning = false;
        this.saveToStorage();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public addAuditLog(action: string, performedBy: string, details: string) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      action,
      performedBy,
      details,
      timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // --- Demo & Cloud Sync Helpers ---

  public loadDemoData() {
    this.stopTimer();
    this.teams = JSON.parse(JSON.stringify(DEMO_TEAMS));
    this.players = JSON.parse(JSON.stringify(DEMO_PLAYERS));
    this.tiers = [...INITIAL_TIERS];
    this.config = { ...INITIAL_CONFIG };
    this.bids = [];
    this.sales = [];
    this.auctionState = {
      status: 'idle',
      currentPlayerId: null,
      currentBid: 0,
      currentBidderTeamId: null,
      timerSecondsRemaining: 30,
      isTimerRunning: false,
      callMode: 'queue',
      lastSale: null,
      lastBidAt: null,
    };
    this.addAuditLog('Demo Data Loaded', 'Administrator', 'Loaded 4 sample teams and 6 verified players for instant demonstration');
    this.saveToStorage();
  }

  public async pushToCloud(): Promise<{ success: boolean; message: string }> {
    return await pushTournamentDataToSupabase({
      players: this.players,
      teams: this.teams,
      tiers: this.tiers,
      config: this.config,
      auctionState: this.auctionState,
      bids: this.bids,
      sales: this.sales,
      auditLogs: this.auditLogs,
    });
  }

  public async pullFromCloud(): Promise<{ success: boolean; message: string }> {
    const res = await pullTournamentDataFromSupabase();
    if (res.success && res.data) {
      if (res.data.players.length > 0) this.players = res.data.players;
      if (res.data.teams.length > 0) this.teams = res.data.teams;
      if (res.data.tiers && res.data.tiers.length > 0) this.tiers = res.data.tiers;
      if (res.data.sales.length > 0) this.sales = res.data.sales;
      if (res.data.bids.length > 0) this.bids = res.data.bids;
      if (res.data.auctionState) this.auctionState = res.data.auctionState;
      if (res.data.config) this.config = { ...this.config, ...res.data.config };
      this.recalculateTeamStats();
      this.saveToStorage();
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  }

  public resetToDefaultData() {
    this.stopTimer();
    this.players = [...INITIAL_PLAYERS];
    this.teams = [...INITIAL_TEAMS];
    this.tiers = [...INITIAL_TIERS];
    this.config = { ...INITIAL_CONFIG };
    this.auctionState = {
      status: 'idle',
      currentPlayerId: null,
      currentBid: 0,
      currentBidderTeamId: null,
      timerSecondsRemaining: 30,
      isTimerRunning: false,
      callMode: 'queue',
      lastSale: null,
      lastBidAt: null,
    };
    this.bids = [];
    this.sales = [];
    this.auditLogs = [
      {
        id: `log-reset-${Date.now()}`,
        action: 'Database Reset',
        performedBy: 'Administrator',
        details: 'Restored clean SMYS Intra Hostel Cricket dataset',
        timestamp: new Date().toLocaleString(),
      },
    ];
    this.saveToStorage();
  }
}

export const store = TournamentStore.getInstance();
