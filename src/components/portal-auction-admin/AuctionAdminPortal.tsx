import React, { useState, useMemo, useEffect } from 'react';
import {
  Gavel,
  Play,
  Pause,
  SkipForward,
  UserX,
  CheckCircle,
  Clock,
  IndianRupee,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Shuffle,
  Layers,
  Flame,
  Award,
  Users,
  AlertCircle,
  Eye,
  LogOut,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { sound } from '../../services/soundEffects';
import { PlayerRegistration, Team } from '../../types';

interface AuctionAdminPortalProps {
  onLogout?: () => void;
}

export const AuctionAdminPortal: React.FC<AuctionAdminPortalProps> = ({ onLogout }) => {
  const store = useTournamentStore();

  // Auth gate states
  const [authKey, setAuthKey] = useState('satu');
  const [authAppword, setAuthAppword] = useState('satu07');
  const [authError, setAuthError] = useState<string | null>(null);

  // Auction settings
  const [callingMode, setCallingMode] = useState<'random' | 'tier'>(
    store.config.callingPreference || 'random'
  );
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [demandIncrement, setDemandIncrement] = useState<number>(0); // 0 = use tier default
  const [customIncInput, setCustomIncInput] = useState<string>('');
  const [showUnsoldPoolModal, setShowUnsoldPoolModal] = useState<boolean>(false);
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState<boolean>(false);
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  // Sync calling preference with store config
  useEffect(() => {
    if (store.config.callingPreference !== callingMode) {
      store.updateConfig({ callingPreference: callingMode });
    }
  }, [callingMode, store]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = store.loginAuctionAdmin(authKey, authAppword);
    if (!res.success) {
      setAuthError(res.message);
    }
  };

  const handleLogout = () => {
    store.logoutAuctionAdmin();
    if (onLogout) {
      onLogout();
    }
  };

  // Pools
  const uncalledPlayers = useMemo(
    () => store.getUncalledPlayers(selectedTierFilter),
    [store.players, store.sales, store.unsoldPlayerIds, selectedTierFilter]
  );

  const unsoldPlayers = useMemo(
    () => store.getUnsoldPlayers(selectedTierFilter),
    [store.players, store.sales, store.unsoldPlayerIds, selectedTierFilter]
  );

  const allUncalledCount = useMemo(
    () => store.getUncalledPlayers().length,
    [store.players, store.sales, store.unsoldPlayerIds]
  );

  const allUnsoldCount = useMemo(
    () => store.getUnsoldPlayers().length,
    [store.players, store.sales, store.unsoldPlayerIds]
  );

  const currentPlayer = store.players.find((p) => p.id === store.auctionState.currentPlayerId);
  const currentBidderTeam = store.teams.find((t) => t.id === store.auctionState.currentBidderTeamId);
  const currentTier = currentPlayer ? store.getPlayerTier(currentPlayer) : null;

  // Active Increment Calculation
  const activeIncrement = useMemo(() => {
    if (demandIncrement > 0) return demandIncrement;
    if (currentTier?.bidIncrement) return currentTier.bidIncrement;
    return 100000; // default ₹1L
  }, [demandIncrement, currentTier]);

  // Notice Banner Flash
  const flashNotice = (msg: string) => {
    setLastActionNotice(msg);
    setTimeout(() => setLastActionNotice(null), 4000);
  };

  // Call Next Player
  const handleCallNext = () => {
    const res = store.callNextPlayer(callingMode, selectedTierFilter);
    flashNotice(res.message);
  };

  // Call Specific Player (e.g., from Unsold Pool)
  const handleCallSpecific = (playerId: string) => {
    store.callPlayer(playerId, 'manual');
    setShowUnsoldPoolModal(false);
    flashNotice('Recalled candidate directly to the auction arena!');
  };

  // Tapping a Team Card to Place Incremented Bid
  const handleTeamCardTap = (teamId: string) => {
    if (store.auctionState.status !== 'bidding') {
      flashNotice('Auction is currently idle. Call a candidate first!');
      return;
    }

    if (store.auctionState.currentBidderTeamId === teamId) {
      flashNotice('This team is already holding the highest bid!');
      return;
    }

    const team = store.teams.find((t) => t.id === teamId);
    if (!team) return;

    if (team.status === 'disabled') {
      alert('This franchise is disabled!');
      return;
    }

    if (team.playersCount >= team.maxSquadSize) {
      alert(`Team ${team.name} has reached maximum squad limit of ${team.maxSquadSize}!`);
      return;
    }

    // Determine target bid based on current demand increment
    const targetBid =
      store.auctionState.currentBidderTeamId === null
        ? store.auctionState.currentBid
        : store.auctionState.currentBid + activeIncrement;

    if (team.remainingPurse < targetBid) {
      alert(
        `Insufficient balance in ${team.name}! Required: ₹${targetBid.toLocaleString(
          'en-IN'
        )}, Remaining: ₹${team.remainingPurse.toLocaleString('en-IN')}`
      );
      return;
    }

    const res = store.placeBid(teamId, targetBid);
    if (res.success) {
      flashNotice(`⚡ Bid Placed: ${team.name} at ₹${targetBid.toLocaleString('en-IN')}`);
    } else {
      alert(res.message);
    }
  };

  // Mark Unsold with Voice Announcement "Oh no!"
  const handleMarkUnsold = () => {
    if (!currentPlayer) return;
    if (confirm(`Mark ${currentPlayer.fullName} as UNSOLD and move to end-of-auction pool?`)) {
      store.markUnsold();
      flashNotice(`❌ ${currentPlayer.fullName} marked UNSOLD. "Oh no!" voice triggered!`);
    }
  };

  // Confirm Sale
  const handleConfirmSale = () => {
    const res = store.confirmSale();
    setIsConfirmSaleModalOpen(false);
    if (res.success) {
      flashNotice(`🎉 GAVEL STRUCK! ${currentPlayer?.fullName} SOLD!`);
    } else {
      alert(res.message);
    }
  };

  // Timer Toggle
  const handleToggleTimer = () => {
    if (store.auctionState.status === 'bidding') {
      store.pauseBidding();
      flashNotice('Bidding clock PAUSED');
    } else if (store.auctionState.status === 'paused') {
      store.resumeBidding();
      flashNotice('Bidding clock RESUMED');
    }
  };

  // Format Indian Currency
  const formatINR = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // 1. AUTH GATE: If not logged in as Auction Admin (satu / satu07), render login screen
  if (!store.isAuctionAdminAuthenticated()) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#070D22] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-midnight-900 border-2 border-gold/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-royal/30 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 flex items-center justify-center mx-auto shadow-xl ring-4 ring-gold/20">
              <Gavel className="w-8 h-8 text-midnight-950 animate-bounce" />
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-gold uppercase px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
                Authorized Personnel Only
              </span>
              <h2 className="text-2xl font-black mt-2 uppercase font-display tracking-tight text-white">
                Auction Admin Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter Master Key & Appword to control live bidding, random calling, and team budget increments.
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 relative z-10">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Auction Master Key
              </label>
              <input
                type="text"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                placeholder="Enter Key (e.g. satu)"
                required
                className="w-full px-4 py-3 rounded-xl bg-midnight-800 border border-slate-700 text-white font-mono text-sm focus:border-gold focus:ring-2 focus:ring-gold/30 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Master Appword
              </label>
              <input
                type="text"
                value={authAppword}
                onChange={(e) => setAuthAppword(e.target.value)}
                placeholder="Enter Appword (e.g. satu07)"
                required
                className="w-full px-4 py-3 rounded-xl bg-midnight-800 border border-slate-700 text-white font-mono text-sm focus:border-gold focus:ring-2 focus:ring-gold/30 outline-none transition"
              />
            </div>

            {/* Quick Helper Pill */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-midnight-800/60 p-2.5 rounded-xl border border-slate-800">
              <span>Required Credentials:</span>
              <span className="font-mono text-gold font-bold">Key: satu • Appword: satu07</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-midnight-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-gold/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Auction Admin Console</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. MAIN AUCTION ADMIN CONSOLE
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#070D22] text-slate-100 p-3 sm:p-5 flex flex-col justify-between select-none">
      <div className="max-w-7xl mx-auto w-full space-y-4">
        
        {/* Floating Notification */}
        {lastActionNotice && (
          <div className="bg-amber-500/20 border border-gold text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0 animate-spin" />
              <span>{lastActionNotice}</span>
            </div>
            <button onClick={() => setLastActionNotice(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Top Control Bar: Master Identity, Calling Mode, Demand Increments, Tools */}
        <div className="bg-midnight-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-3">
          
          {/* Identity & Portal Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-midnight-950 shadow-md ring-2 ring-gold/40">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                  Auction Admin Master Console
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  KEY: SATU
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time Auctioneer Controls • Random Calling & Franchise Card Increment Engine
              </p>
            </div>
          </div>

          {/* Calling Mode Switcher (Random-wise vs Tier-wise) */}
          <div className="flex items-center space-x-2 bg-midnight-800 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">
              Calling Order:
            </span>

            <button
              onClick={() => {
                setCallingMode('random');
                flashNotice('Switched to RANDOM CALLING MODE across available tiers!');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
                callingMode === 'random'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-midnight-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random Across Tiers</span>
            </button>

            <button
              onClick={() => {
                setCallingMode('tier');
                flashNotice('Switched to TIER-WISE CALLING (Tier 1 -> Tier 4)!');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
                callingMode === 'tier'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tier-Wise Sequence</span>
            </button>
          </div>

          {/* Audio & Sound Testing & Logout */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                sound.playUnsold(currentPlayer?.fullName || 'Candidate');
                flashNotice('Testing "Oh no!" voice announcement!');
              }}
              title="Test the Unsold Voice Announcement"
              className="px-3 py-1.5 rounded-xl bg-midnight-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test "Oh no!" Voice</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock / Exit</span>
            </button>
          </div>
        </div>

        {/* Dynamic Demand Increment Bar & Pool Metrics Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Demand Increment Selector (7 cols) */}
          <div className="md:col-span-8 bg-midnight-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-xs font-extrabold text-white block">
                  Player Demand Increment:
                </span>
                <span className="text-[10px] text-slate-400">
                  Active per card tap:{' '}
                  <strong className="text-gold font-mono">{formatINR(activeIncrement)}</strong>
                </span>
              </div>
            </div>

            {/* Quick Increment Steppers */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setDemandIncrement(0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 0
                    ? 'bg-gold text-midnight-950 border-gold shadow'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                Tier Default ({formatINR(currentTier?.bidIncrement || 100000)})
              </button>

              <button
                onClick={() => setDemandIncrement(200000)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 200000
                    ? 'bg-amber-500 text-midnight-950 border-amber-400 font-black'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                +₹2 Lakh
              </button>

              <button
                onClick={() => setDemandIncrement(500000)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 500000
                    ? 'bg-amber-500 text-midnight-950 border-amber-400 font-black'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                +₹5 Lakh
              </button>

              <button
                onClick={() => setDemandIncrement(1000000)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 1000000
                    ? 'bg-amber-500 text-midnight-950 border-amber-400 font-black'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                +₹10 Lakh
              </button>

              <button
                onClick={() => setDemandIncrement(2500000)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 2500000
                    ? 'bg-amber-500 text-midnight-950 border-amber-400 font-black'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                +₹25 Lakh
              </button>

              <button
                onClick={() => setDemandIncrement(5000000)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  demandIncrement === 5000000
                    ? 'bg-red-500 text-white border-red-400 font-black'
                    : 'bg-midnight-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                +₹50 Lakh 🔥
              </button>
            </div>
          </div>

          {/* Player Pool Status Counts (5 cols) */}
          <div className="md:col-span-4 bg-midnight-900 border border-slate-800 rounded-2xl p-2.5 grid grid-cols-3 gap-2 text-center">
            
            {/* Uncalled Pool */}
            <div className="bg-midnight-800/80 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Uncalled Pool
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {allUncalledCount} Players
              </span>
            </div>

            {/* Unsold Pool (Classed at End) */}
            <button
              onClick={() => setShowUnsoldPoolModal(true)}
              className="bg-midnight-800/80 hover:bg-slate-800 p-2 rounded-xl border border-slate-700/50 transition cursor-pointer group"
            >
              <span className="text-[10px] uppercase font-bold text-red-400 group-hover:underline block flex items-center justify-center space-x-1">
                <span>Unsold Pool</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
              <span className="text-sm font-black text-red-400 font-mono">
                {allUnsoldCount} At End
              </span>
            </button>

            {/* Sold Pool */}
            <div className="bg-midnight-800/80 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Sold Pool
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {store.sales.length} Deals
              </span>
            </div>
          </div>
        </div>

        {/* 3. THE MAIN ARENA:
            - Player Card in the MIDDLE
            - 4 Team Cards flanking (2 on left, 2 on right on desktop)
            - Tapping a team card increments the bid by activeIncrement!
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* LEFT 2 TEAM CARDS (Team 0 & Team 1) */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3">
            {store.teams.slice(0, 2).map((team) => {
              const isLeading = team.id === store.auctionState.currentBidderTeamId;
              const nextBidAmount =
                store.auctionState.currentBidderTeamId === null
                  ? store.auctionState.currentBid
                  : store.auctionState.currentBid + activeIncrement;
              const hasPurse = team.remainingPurse >= nextBidAmount;

              return (
                <div
                  key={team.id}
                  onClick={() => handleTeamCardTap(team.id)}
                  className={`flex-1 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] ${
                    isLeading
                      ? 'bg-gradient-to-br from-amber-950/80 via-midnight-900 to-amber-900/50 border-2 border-gold ring-4 ring-gold/30 shadow-2xl shadow-gold/20'
                      : 'bg-midnight-900/95 hover:bg-midnight-800 border-2 border-slate-700 hover:border-slate-500 shadow-lg'
                  }`}
                >
                  {/* Leading Ribbon */}
                  {isLeading && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-gold to-yellow-500 text-midnight-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center space-x-1 shadow">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>CURRENT HIGHEST BIDDER</span>
                    </div>
                  )}

                  {/* Team Header */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border"
                        style={{ backgroundColor: `${team.color}25`, borderColor: team.color }}
                      >
                        {team.logo}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-white tracking-wide leading-tight">
                          {team.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Captain: <strong className="text-slate-300">{team.captain}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Purse & Squad Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-midnight-950/70 border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Remaining Purse
                        </span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {formatINR(team.remainingPurse)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Squad Filled
                        </span>
                        <span className="text-sm font-black text-slate-200 font-mono">
                          {team.playersCount} / {team.maxSquadSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tap Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {isLeading ? (
                      <div className="w-full py-2.5 rounded-xl bg-gold/20 border border-gold/40 text-gold font-black text-xs text-center uppercase tracking-wider">
                        ★ Holding High Bid ({formatINR(store.auctionState.currentBid)})
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!hasPurse || store.auctionState.status !== 'bidding'}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                          hasPurse && store.auctionState.status === 'bidding'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          Tap to Bid {formatINR(nextBidAmount)} (+{formatINR(activeIncrement)})
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MIDDLE: THE ACTIVE PLAYER CARD (6 cols) */}
          <div className="lg:col-span-6 bg-gradient-to-b from-midnight-900 via-midnight-950 to-[#070D22] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient Background Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            {/* Player Card Header Status & Timer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                    store.auctionState.status === 'bidding'
                      ? 'bg-red-500 text-white animate-pulse'
                      : store.auctionState.status === 'paused'
                      ? 'bg-amber-400 text-midnight-950 font-black'
                      : store.auctionState.status === 'sold'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {store.auctionState.status === 'bidding' ? '● BIDDING ACTIVE' : store.auctionState.status.toUpperCase()}
                </span>
                {currentTier && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-slate-300 border border-white/20">
                    {currentTier.name}
                  </span>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center space-x-2">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-xl border font-mono font-black text-sm ${
                    store.auctionState.timerSecondsRemaining <= 5
                      ? 'bg-red-500/20 text-red-400 border-red-500 animate-ping'
                      : 'bg-midnight-800 text-gold border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{store.auctionState.timerSecondsRemaining}s</span>
                </div>

                <button
                  onClick={handleToggleTimer}
                  disabled={store.auctionState.status !== 'bidding' && store.auctionState.status !== 'paused'}
                  className="p-1.5 rounded-xl bg-midnight-800 hover:bg-slate-700 border border-slate-700 text-white transition disabled:opacity-30"
                  title="Pause/Resume Clock"
                >
                  {store.auctionState.status === 'bidding' ? (
                    <Pause className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Player Body OR Idle Standby State */}
            {currentPlayer ? (
              <div className="py-4 space-y-4 relative z-10">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Player Photo with Glow Border */}
                  <div className="relative shrink-0">
                    <img
                      src={currentPlayer.photoUrl}
                      alt={currentPlayer.fullName}
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-gold/60 shadow-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-midnight-950 border border-gold text-gold font-mono font-black text-[10px]">
                      {currentPlayer.regNumber}
                    </div>
                  </div>

                  {/* Player Name & Vitals */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                      {currentPlayer.fullName}
                    </h2>
                    <p className="text-xs text-slate-300">
                      {currentPlayer.academicYear} •{' '}
                      <strong className="text-gold">{currentPlayer.playingRole}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Batting: {currentPlayer.battingStyle} | Bowling: {currentPlayer.bowlingStyle}
                    </p>

                    {/* Rating Stats Pills */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-midnight-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                        Matches: <strong className="text-white">{currentPlayer.matchesPlayed}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-midnight-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                        Runs: <strong className="text-emerald-400">{currentPlayer.runsScored}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-midnight-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                        Wickets: <strong className="text-blue-400">{currentPlayer.wicketsTaken}</strong>
                      </span>
                      {currentPlayer.battingRating && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                          Bat: {currentPlayer.battingRating}/10
                        </span>
                      )}
                      {currentPlayer.bowlingRating && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-[10px] font-bold text-blue-300">
                          Bowl: {currentPlayer.bowlingRating}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Live Bid Banner */}
                <div className="bg-gradient-to-r from-midnight-950 via-midnight-900 to-midnight-950 border-2 border-gold/50 rounded-2xl p-4 text-center shadow-xl relative overflow-hidden">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1">
                    CURRENT HIGHEST BID
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-amber-400 font-mono tracking-tight">
                    {formatINR(store.auctionState.currentBid)}
                  </div>

                  <div className="mt-2 flex items-center justify-center space-x-2 text-xs">
                    {currentBidderTeam ? (
                      <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold font-bold">
                        <span className="text-base">{currentBidderTeam.logo}</span>
                        <span>Held by: {currentBidderTeam.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">
                        Waiting for opening bid (Base: {formatINR(currentTier?.minBid || 5000000)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Idle Standby Screen */
              <div className="py-12 text-center space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-midnight-800 border-2 border-slate-700 flex items-center justify-center mx-auto text-gold shadow-lg">
                  <Gavel className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    The Floor is Currently Open
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Ready to summon the next candidate according to your active{' '}
                    <strong className="text-gold uppercase font-mono">
                      {callingMode === 'random' ? 'Random Mode' : 'Tier-wise Mode'}
                    </strong>{' '}
                    settings.
                  </p>
                </div>

                <button
                  onClick={handleCallNext}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-midnight-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-gold/20 flex items-center justify-center space-x-2 mx-auto transition-transform active:scale-95"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>
                    Call Next Candidate ({callingMode === 'random' ? 'Random across Tiers' : 'Next in Tier'})
                  </span>
                </button>
              </div>
            )}

            {/* Quick Action Dock Inside Center Card */}
            {currentPlayer && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-10">
                {/* Confirm Sale Button */}
                <button
                  type="button"
                  disabled={!store.auctionState.currentBidderTeamId}
                  onClick={() => setIsConfirmSaleModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-40 transition"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>SOLD (Gavel)</span>
                </button>

                {/* Mark Unsold Button ("Oh no!" voice) */}
                <button
                  type="button"
                  onClick={handleMarkUnsold}
                  className="py-2.5 px-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-red-950/40 transition"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>UNSOLD ("Oh no!")</span>
                </button>

                {/* Call Next Candidate */}
                <button
                  type="button"
                  onClick={handleCallNext}
                  className="py-2.5 px-3 rounded-xl bg-midnight-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition col-span-2 sm:col-span-1"
                >
                  <SkipForward className="w-3.5 h-3.5 text-gold" />
                  <span>Next Candidate</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT 2 TEAM CARDS (Team 2 & Team 3) */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3">
            {store.teams.slice(2, 4).map((team) => {
              const isLeading = team.id === store.auctionState.currentBidderTeamId;
              const nextBidAmount =
                store.auctionState.currentBidderTeamId === null
                  ? store.auctionState.currentBid
                  : store.auctionState.currentBid + activeIncrement;
              const hasPurse = team.remainingPurse >= nextBidAmount;

              return (
                <div
                  key={team.id}
                  onClick={() => handleTeamCardTap(team.id)}
                  className={`flex-1 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] ${
                    isLeading
                      ? 'bg-gradient-to-br from-amber-950/80 via-midnight-900 to-amber-900/50 border-2 border-gold ring-4 ring-gold/30 shadow-2xl shadow-gold/20'
                      : 'bg-midnight-900/95 hover:bg-midnight-800 border-2 border-slate-700 hover:border-slate-500 shadow-lg'
                  }`}
                >
                  {/* Leading Ribbon */}
                  {isLeading && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-gold to-yellow-500 text-midnight-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center space-x-1 shadow">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>CURRENT HIGHEST BIDDER</span>
                    </div>
                  )}

                  {/* Team Header */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border"
                        style={{ backgroundColor: `${team.color}25`, borderColor: team.color }}
                      >
                        {team.logo}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-white tracking-wide leading-tight">
                          {team.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Captain: <strong className="text-slate-300">{team.captain}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Purse & Squad Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-midnight-950/70 border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Remaining Purse
                        </span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {formatINR(team.remainingPurse)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Squad Filled
                        </span>
                        <span className="text-sm font-black text-slate-200 font-mono">
                          {team.playersCount} / {team.maxSquadSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tap Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {isLeading ? (
                      <div className="w-full py-2.5 rounded-xl bg-gold/20 border border-gold/40 text-gold font-black text-xs text-center uppercase tracking-wider">
                        ★ Holding High Bid ({formatINR(store.auctionState.currentBid)})
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!hasPurse || store.auctionState.status !== 'bidding'}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                          hasPurse && store.auctionState.status === 'bidding'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          Tap to Bid {formatINR(nextBidAmount)} (+{formatINR(activeIncrement)})
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* If More than 4 teams exist, render remaining teams in an overflow grid */}
        {store.teams.length > 4 && (
          <div className="bg-midnight-900 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Additional Participating Franchises (Tap to Bid):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {store.teams.slice(4).map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleTeamCardTap(team.id)}
                  className="p-3 rounded-xl bg-midnight-950 border border-slate-700 hover:border-gold cursor-pointer transition text-xs flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{team.logo}</span>
                    <span className="font-bold text-white">{team.name}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">{formatINR(team.remainingPurse)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. MODALS */}

      {/* 4.1 Confirm Sale Modal */}
      {isConfirmSaleModalOpen && currentPlayer && currentBidderTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-midnight-900 border-2 border-gold rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-500/10">
              <Gavel className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white uppercase font-display">
              Confirm Final Sale?
            </h3>

            <p className="text-xs text-slate-300 mt-2">
              You are about to strike the wooden gavel and award candidate:
            </p>

            <div className="my-4 p-4 rounded-2xl bg-midnight-950 border border-slate-800 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Player:</span>
                <span className="font-bold text-white">{currentPlayer.fullName} ({currentPlayer.regNumber})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Acquiring Team:</span>
                <span className="font-bold text-gold">{currentBidderTeam.logo} {currentBidderTeam.name}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Winning Bid:</span>
                <span className="font-black text-emerald-400 font-mono text-base">
                  {formatINR(store.auctionState.currentBid)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setIsConfirmSaleModalOpen(false)}
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSale}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition"
              >
                Strike Gavel & Sell!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 Unsold Pool Drawer / Modal ("class players who are unsold at the end") */}
      {showUnsoldPoolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-midnight-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase">
                    Unsold Candidates Pool (End Round)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Classed at the end of initial calls • Recall any candidate directly to the floor
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUnsoldPoolModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1">
              {unsoldPlayers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-midnight-950 rounded-2xl border border-dashed border-slate-800">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-slate-300">No Unsold Players in Pool!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Any candidate who goes unsold will be automatically classified and placed here for the end round.
                  </p>
                </div>
              ) : (
                unsoldPlayers.map((player) => {
                  const tier = store.getPlayerTier(player);
                  return (
                    <div
                      key={player.id}
                      className="p-3 rounded-xl bg-midnight-950 border border-slate-800 hover:border-slate-600 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={player.photoUrl}
                          alt={player.fullName}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-white text-xs block leading-tight">
                            {player.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {player.regNumber} • {player.playingRole} • Base: {formatINR(tier.minBid)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCallSpecific(player.id)}
                        className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-midnight-950 font-black text-xs uppercase tracking-wider shadow transition"
                      >
                        Recall to Floor
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total in Unsold Pool: <strong className="text-red-400 font-mono">{unsoldPlayers.length}</strong></span>
              <button
                onClick={() => setShowUnsoldPoolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
