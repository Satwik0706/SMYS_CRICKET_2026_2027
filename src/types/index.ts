export type PlayingRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper' | 'NA';

export type BattingStyle =
  | 'Right-Handed — Top Order'
  | 'Right-Handed — Middle Order'
  | 'Right-Handed — Lower Order'
  | 'Left-Handed — Top Order'
  | 'Left-Handed — Middle Order'
  | 'Left-Handed — Lower Order'
  | 'Aggressive'
  | 'Defensive'
  | 'NA';

export type BowlingStyle =
  | 'Right Arm Fast'
  | 'Left Arm Fast'
  | 'Right Arm Medium'
  | 'Left Arm Medium'
  | 'Right Arm Off Spin'
  | 'Left Arm Off Spin'
  | 'Right Arm Leg Spin'
  | 'Left Arm Leg Spin'
  | 'NA';

export type RegistrationStatus = 'pending' | 'verified' | 'rejected';

export interface PlayerRegistration {
  id: string;
  regNumber: string; // e.g. SMYS-2026-001
  fullName: string;
  academicYear: string; // e.g. '1st Year', '2nd Year', '3rd Year', '4th Year', 'Post-Grad'
  phone: string;
  matchesPlayed: number;
  runsScored: number;
  wicketsTaken: number;
  playingRole: PlayingRole;
  battingRating: number | null; // 1-10 or null for NA
  bowlingRating: number | null;
  wicketkeepingRating: number | null;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  photoUrl: string;
  status: RegistrationStatus;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  assignedTeamId?: string | null;
  tierId?: string | null;
}

export interface Team {
  id: string;
  teamId: string; // e.g. 'TEAM-01'
  name: string;
  shortName: string;
  logo: string;
  color: string;
  secondaryColor?: string;
  captain: string;
  loginId: string;
  passwordHash: string;
  initialPurse: number; // In currency units (e.g. ₹10,00,000)
  remainingPurse: number;
  spentPurse: number;
  maxSquadSize: number;
  status: 'active' | 'disabled';
  playersCount: number;
}

export interface AuctionTier {
  id: string;
  name: string; // e.g. 'Tier 1 — Elite', 'Tier 2 — Gold', 'Tier 3 — Silver', 'Tier 4 — Emerging'
  minRating: number;
  maxRating: number;
  minBid: number; // Opening bid in ₹
  bidIncrement: number; // ₹ per bid
  priority: number;
  badgeColor: string;
}

export interface AuctionConfig {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: 'draft' | 'ready' | 'live' | 'paused' | 'completed';
  timerSeconds: number; // e.g. 30 seconds countdown
  unsoldRecallRule: 'immediate' | 'end_of_round' | 'manual';
  callingPreference?: 'random' | 'tier';
  allowPublicQueue: boolean;
  activeTierId: string | null;
}

export type AuctionCallMode = 'queue' | 'manual';

export interface SaleRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerPhoto: string;
  playerRole: PlayingRole;
  playerTier: string;
  regNumber: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  finalPrice: number;
  soldAt: string;
}

export interface BidRecord {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  amount: number;
  timestamp: string;
}

export interface AuctionState {
  status: 'idle' | 'bidding' | 'paused' | 'sold' | 'unsold' | 'completed';
  currentPlayerId: string | null;
  currentBid: number;
  currentBidderTeamId: string | null;
  timerSecondsRemaining: number;
  isTimerRunning: boolean;
  callMode: AuctionCallMode;
  lastSale: SaleRecord | null;
  lastBidAt: string | null;
  sessionStartedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export type AppPortal =
  | 'gateway'
  | 'register'
  | 'admin'
  | 'live'
  | 'team'
  | 'player'
  | 'correction'
  | 'auction-admin';
