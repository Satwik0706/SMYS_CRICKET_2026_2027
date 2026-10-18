import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Radio,
  Clock,
  IndianRupee,
  Shield,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Flame,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Download,
  Search,
  Gavel,
  Zap,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { PlayerRegistration, SaleRecord } from '../../types';
import { sound } from '../../services/soundEffects';

export const PublicLiveAuction: React.FC = () => {
  const store = useTournamentStore();

  const [activeTab, setActiveTab] = useState<'live' | 'results' | 'teams'>('live');
  const [salesTickerPaused, setSalesTickerPaused] = useState(false);
  const [dismissedSaleId, setDismissedSaleId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [resultsSearch, setResultsSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  const isBidding = store.auctionState.status === 'bidding';
  const isPaused = store.auctionState.status === 'paused';
  const isSold = store.auctionState.status === 'sold';
  const isUnsold = store.auctionState.status === 'unsold';

  const currentPlayer = store.players.find((p) => p.id === store.auctionState.currentPlayerId);
  const currentTier = currentPlayer ? store.getPlayerTier(currentPlayer) : null;
  const currentBidderTeam = store.teams.find((t) => t.id === store.auctionState.currentBidderTeamId);

  const eligibleQueue = store.getEligibleQueue();
  const nextPlayerOnDeck = eligibleQueue.find((p) => p.id !== store.auctionState.currentPlayerId);
  const soldCount = store.sales.length;
  const totalSpend = store.sales.reduce((sum, s) => sum + s.finalPrice, 0);
  const highestPrice = store.sales.length > 0 ? Math.max(...store.sales.map((s) => s.finalPrice)) : 0;
  const highestSale = store.sales.find((s) => s.finalPrice === highestPrice);

  // Last confirmed sale
  const lastSale = store.auctionState.lastSale || (store.sales.length > 0 ? store.sales[0] : null);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Filtered sales ledger
  const filteredSales = useMemo(() => {
    return store.sales.filter((sale) => {
      const matchSearch =
        sale.playerName.toLowerCase().includes(resultsSearch.toLowerCase()) ||
        sale.teamName.toLowerCase().includes(resultsSearch.toLowerCase()) ||
        (sale.regNumber && sale.regNumber.toLowerCase().includes(resultsSearch.toLowerCase()));
      const matchRole = selectedRoleFilter === 'all' || sale.playerRole === selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }, [store.sales, resultsSearch, selectedRoleFilter]);

  const handleExportCSV = () => {
    if (store.sales.length === 0) {
      alert('No sales records to export yet');
      return;
    }
    const headers = ['Registration Number', 'Player Name', 'Role', 'Tier', 'Winning Franchise', 'Final Hammer Price (INR)', 'Sold Time'];
    const rows = store.sales.map((s) => [
      `"${s.regNumber || ''}"`,
      `"${s.playerName}"`,
      `"${s.playerRole}"`,
      `"${s.playerTier}"`,
      `"${s.teamName}"`,
      s.finalPrice,
      `"${s.soldAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SMYS_Cricket_Auction_Results_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Next bid increment calculation
  const nextIncrement = currentTier?.bidIncrement || 10000;
  const nextQualifyingBid =
    store.auctionState.currentBidderTeamId === null
      ? store.auctionState.currentBid
      : store.auctionState.currentBid + nextIncrement;

  // Marquee loop list
  const tickerSales = useMemo(() => {
    if (store.sales.length === 0) return [];
    if (store.sales.length < 5) {
      return [...store.sales, ...store.sales, ...store.sales];
    }
    return [...store.sales, ...store.sales];
  }, [store.sales]);

  return (
    <div className={`min-h-screen bg-[#070D22] text-white selection:bg-gold selection:text-slate-950 pb-16 ${isFullscreen ? 'p-4' : ''}`}>
      {/* 6.1 TV Broadcast Sub-Header Bar */}
      <div className="bg-midnight border-b border-midnight-700/80 px-4 sm:px-6 py-3 sticky top-16 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            {isBidding ? (
              <div className="flex items-center space-x-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/40 animate-pulse font-extrabold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>LIVE AUCTION ON AIR</span>
              </div>
            ) : isPaused ? (
              <div className="flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/40 font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>AUCTION ON HOLD</span>
              </div>
            ) : isSold ? (
              <div className="flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/40 font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>HAMMER SOLD</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-gold animate-pulse" />
                <span>BROADCAST STANDBY</span>
              </div>
            )}

            <div className="hidden md:flex items-center space-x-2 text-slate-300">
              <span className="text-slate-600">|</span>
              <span>
                Teams: <strong className="text-white font-mono">{store.teams.length}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Sold: <strong className="text-gold font-mono">{soldCount}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Pool: <strong className="text-electric-light font-mono">{eligibleQueue.length}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Spend: <strong className="text-emerald-400 font-mono">₹{totalSpend.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          {/* View Mode Switcher & TV Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-midnight-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'live'
                    ? 'bg-electric text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Stage
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'teams'
                    ? 'bg-royal text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Franchises ({store.teams.length})
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'results'
                    ? 'bg-gold text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Results ({store.sales.length})
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio' : 'Mute Sound'}
              className="p-2 rounded-xl bg-midnight-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Fullscreen TV Mode */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen TV Mode' : 'Enter 4K TV Broadcast Mode'}
              className="p-2 rounded-xl bg-midnight-900 border border-slate-800 text-slate-300 hover:text-gold transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 6.5 Recent Sales Ticker Strip (Seamless Looping Marquee) */}
      {store.sales.length > 0 && (
        <div className="bg-gradient-to-r from-midnight-900 via-deepBlue to-midnight-900 border-b border-gold/30 py-2.5 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            <div className="bg-gold text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded tracking-wider mr-3 shrink-0 shadow flex items-center space-x-1">
              <Zap className="w-3 h-3 text-slate-950 fill-current" />
              <span>LATEST SALES</span>
            </div>

            <div
              className={`flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs ${
                salesTickerPaused ? '' : 'animate-marquee'
              }`}
              onMouseEnter={() => setSalesTickerPaused(true)}
              onMouseLeave={() => setSalesTickerPaused(false)}
            >
              {tickerSales.map((sale, idx) => (
                <div
                  key={`${sale.id}-${idx}`}
                  className="inline-flex items-center space-x-2 bg-midnight/90 px-3 py-1 rounded-xl border border-slate-700/70 shadow-sm"
                >
                  <img
                    src={sale.playerPhoto}
                    alt={sale.playerName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                    }}
                    className="w-5 h-5 rounded-full object-cover border border-gold"
                  />
                  <span className="font-bold text-white">{sale.playerName}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-bold text-gold flex items-center space-x-1">
                    <span>{sale.teamLogo}</span>
                    <span>{sale.teamName}</span>
                  </span>
                  <span className="bg-gold/20 text-gold font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                    ₹{sale.finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Broadcast Arena Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'live' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Stage Layout: Spotlight (Left) + Bidding Board (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 6.2 Current Player Spotlight (7 cols) */}
              <div className="lg:col-span-7 bg-gradient-to-b from-midnight via-midnight-800 to-deepBlue rounded-3xl border-2 border-gold/50 shadow-2xl p-6 sm:p-8 relative overflow-hidden ring-1 ring-gold/20">
                {/* Stadium Light Beam Background Animation */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gold/15 via-electric/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {currentPlayer ? (
                  <div className="space-y-6 relative z-10">
                    {/* Top Tier Badge & Match ID */}
                    <div className="flex items-center justify-between border-b border-slate-700/70 pb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gold text-slate-950 font-black px-3 py-1 rounded-md uppercase tracking-wider shadow">
                          {currentTier?.name}
                        </span>
                        <span className="text-xs text-slate-300 font-mono">
                          ID: {currentPlayer.regNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Opening Base Bid:{' '}
                        <strong className="text-gold text-sm font-black font-mono">
                          ₹{currentTier?.minBid.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {/* Spotlight Hero: Big Photo & Player Metadata */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="relative group">
                        <img
                          src={currentPlayer.photoUrl}
                          alt={currentPlayer.fullName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80';
                          }}
                          className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover border-4 border-gold shadow-2xl ring-8 ring-gold/15 transition-transform group-hover:scale-105"
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-electric to-royal text-white font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/20 whitespace-nowrap">
                          {currentPlayer.playingRole}
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-gold block flex items-center justify-center sm:justify-start space-x-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>Candidate on the Auction Block</span>
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white leading-tight">
                          {currentPlayer.fullName}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-300 font-medium">
                          {currentPlayer.academicYear} • {currentPlayer.battingStyle}
                        </p>
                        <p className="text-xs text-slate-400">
                          Bowling: {currentPlayer.bowlingStyle}
                        </p>

                        {/* Skill Radar Gauges */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start text-xs font-bold">
                          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                            <span>🏏 Batting:</span>
                            <span className="text-gold font-black">
                              {currentPlayer.battingRating !== null ? `${currentPlayer.battingRating}/10` : 'NA'}
                            </span>
                          </div>
                          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                            <span>🎯 Bowling:</span>
                            <span className="text-emerald-400 font-black">
                              {currentPlayer.bowlingRating !== null ? `${currentPlayer.bowlingRating}/10` : 'NA'}
                            </span>
                          </div>
                          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                            <span>🧤 Keeping:</span>
                            <span className="text-electric-light font-black">
                              {currentPlayer.wicketkeepingRating !== null ? `${currentPlayer.wicketkeepingRating}/10` : 'NA'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cricket Career Statistics Showcase */}
                    <div className="grid grid-cols-3 gap-3 bg-midnight-900/95 p-4 rounded-2xl border border-slate-700/80 text-center shadow-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Matches Played
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">
                          {currentPlayer.matchesPlayed}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Career Runs
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-gold font-mono">
                          {currentPlayer.runsScored}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Wickets Taken
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                          {currentPlayer.wicketsTaken}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standby Arena Display (When no player on podium) */
                  <div className="py-12 px-4 text-center relative z-10 space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold/20 via-electric/20 to-royal/20 border-2 border-gold/40 flex items-center justify-center mx-auto shadow-2xl ring-8 ring-gold/10">
                      <Trophy className="w-10 h-10 text-gold animate-bounce" />
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-electric/20 border border-electric/40 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>BROADCAST STANDBY CENTER</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                        Auction Podium Ready
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                        The chief auctioneer is preparing the stage. Live bids from participating franchises will stream here in real-time.
                      </p>
                    </div>

                    {/* Next Player on Deck Preview */}
                    {nextPlayerOnDeck ? (
                      <div className="bg-midnight-900/90 border border-gold/30 rounded-2xl p-4 max-w-md mx-auto text-left shadow-lg">
                        <span className="text-[10px] text-gold font-black uppercase tracking-widest block mb-2">
                          Next Up on Deck:
                        </span>
                        <div className="flex items-center space-x-3">
                          <img
                            src={nextPlayerOnDeck.photoUrl}
                            alt={nextPlayerOnDeck.fullName}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
                            }}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-gold/50"
                          />
                          <div className="flex-1">
                            <h4 className="font-extrabold text-sm text-white">{nextPlayerOnDeck.fullName}</h4>
                            <p className="text-[11px] text-electric-light font-semibold">
                              {nextPlayerOnDeck.playingRole} • {nextPlayerOnDeck.academicYear}
                            </p>
                          </div>
                          <span className="text-xs bg-gold text-slate-950 font-black px-2.5 py-1 rounded-lg">
                            {store.getPlayerTier(nextPlayerOnDeck).name.split('—')[0]}
                          </span>
                        </div>
                      </div>
                    ) : store.teams.length === 0 ? (
                      <div className="bg-midnight-900/80 border border-slate-700 rounded-2xl p-5 max-w-md mx-auto text-center space-y-2">
                        <p className="text-xs font-bold text-slate-300">Quick Start Tip:</p>
                        <p className="text-[11px] text-slate-400">
                          No teams or players are registered yet. Go to <strong>Admin Portal → Settings</strong> and click <strong>"Load Sample Tournament Data"</strong> to test live bidding immediately!
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* 6.3 Live Bidding Display Board (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Main Live Bidding Card */}
                <div className="bg-gradient-to-b from-midnight via-midnight-800 to-deepBlue rounded-3xl border-2 border-gold/40 shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-gold flex items-center space-x-1.5">
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                      <span>Live Bidding Floor</span>
                    </span>

                    {/* Clock countdown */}
                    <div className="flex items-center space-x-2 bg-midnight-900 px-3 py-1 rounded-xl border border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      <span
                        className={`font-mono font-black text-sm ${
                          isBidding && store.auctionState.timerSecondsRemaining <= 5
                            ? 'text-red-400 animate-ping'
                            : 'text-white'
                        }`}
                      >
                        {isBidding ? `${store.auctionState.timerSecondsRemaining}s` : 'STANDBY'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">
                    {currentPlayer ? 'Current Leading Bid' : 'Auction Valuation'}
                  </span>

                  {/* Mega Bid Value */}
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight my-2">
                    {currentPlayer ? (
                      `₹${store.auctionState.currentBid.toLocaleString('en-IN')}`
                    ) : (
                      <span className="text-slate-500 text-3xl sm:text-4xl">PODIUM READY</span>
                    )}
                  </div>

                  {/* Leading Franchise Card */}
                  {currentBidderTeam ? (
                    <div className="mt-4 p-4 rounded-2xl bg-midnight-900/90 border-2 border-gold shadow-lg flex items-center justify-center space-x-3 animate-fadeIn">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border"
                        style={{
                          backgroundColor: currentBidderTeam.color,
                          borderColor: currentBidderTeam.secondaryColor || '#FFFFFF',
                        }}
                      >
                        {currentBidderTeam.logo}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-gold font-bold uppercase tracking-widest block">
                          Current Highest Bidder
                        </span>
                        <h3 className="text-base font-extrabold text-white leading-tight">
                          {currentBidderTeam.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Remaining Purse: ₹{currentBidderTeam.remainingPurse.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ) : currentPlayer ? (
                    <div className="mt-4 p-4 rounded-2xl bg-midnight-900/60 border border-slate-700 text-slate-300 text-xs font-semibold">
                      Awaiting opening bid of <strong className="text-gold">₹{currentTier?.minBid.toLocaleString('en-IN')}</strong>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-2xl bg-midnight-900/60 border border-slate-700 text-slate-400 text-xs">
                      Official broadcast synchronized with Tournament Admin & Team Portals
                    </div>
                  )}

                  {/* Next Minimum Bid Pill */}
                  {currentPlayer && (
                    <div className="mt-3 py-2 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Next Valid Bid:</span>
                      <span className="font-black text-emerald-400 font-mono">
                        ₹{nextQualifyingBid.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-4 italic">
                    Public viewing mode • Bids placed via authenticated Team Portals or Administrator
                  </p>
                </div>

                {/* Bid Activity History Strip */}
                <div className="bg-midnight-900/90 rounded-2xl border border-slate-800 p-4 shadow-md">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 mb-2">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                      <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                      <span>Live Bid Stream Feed</span>
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {store.bids.length} bids recorded
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                    {store.bids.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 italic">
                        No bids placed yet this session
                      </p>
                    ) : (
                      store.bids.slice(0, 6).map((bid) => (
                        <div
                          key={bid.id}
                          className="p-2.5 rounded-xl bg-midnight/80 border border-slate-800 flex items-center justify-between animate-fadeIn"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{bid.teamLogo}</span>
                            <span className="font-bold text-slate-200">{bid.teamName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gold font-mono">
                              ₹{bid.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              {bid.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6.6 Franchise Purse Board Grid */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black font-display uppercase tracking-wide text-white">
                    Franchise Purse Board
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live balance and squad count across all participating franchises
                  </p>
                </div>
                <span className="text-xs font-mono text-gold font-bold">
                  Total Spend: ₹{totalSpend.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {store.teams.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-midnight-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-400">
                    <p className="text-sm font-bold text-slate-300">No Franchises Registered</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Franchises and purse balances will be broadcast here once created by the tournament administrator.
                    </p>
                  </div>
                ) : (
                  store.teams.map((team) => {
                    const spentPct = Math.min(100, Math.round((team.spentPurse / team.initialPurse) * 100));
                    const isCurrentLeading = team.id === store.auctionState.currentBidderTeamId;

                    return (
                      <div
                        key={team.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrentLeading
                            ? 'bg-midnight-800 border-gold shadow-lg shadow-gold/10 ring-2 ring-gold/40'
                            : 'bg-midnight border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                              style={{ backgroundColor: team.color }}
                            >
                              {team.logo}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white leading-tight">{team.name}</h3>
                              <span className="text-[10px] text-slate-400">
                                Capt: {team.captain}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-slate-300 bg-midnight-900 px-2 py-0.5 rounded-lg border border-slate-700 font-mono">
                            {team.playersCount}/{team.maxSquadSize}
                          </span>
                        </div>

                        <div className="flex justify-between items-end text-xs mb-1.5">
                          <span className="text-slate-400">Remaining Purse:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            ₹{team.remainingPurse.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${spentPct}%`,
                              backgroundColor: team.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6.8 Upcoming Players Carousel */}
            {store.config.allowPublicQueue && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black font-display uppercase tracking-wide text-white">
                      Upcoming Player Queue ({eligibleQueue.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Eligible candidates slated for upcoming calls
                    </p>
                  </div>
                </div>

                {eligibleQueue.length === 0 ? (
                  <div className="p-8 text-center bg-midnight-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-400">
                    <p className="text-sm font-bold text-slate-300">Upcoming Queue Empty</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Candidates will appear here once registered and verified by the committee.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {eligibleQueue.slice(0, 6).map((player, idx) => {
                      const tier = store.getPlayerTier(player);

                      return (
                        <div
                          key={player.id}
                          className="bg-midnight p-3 rounded-2xl border border-slate-800 text-center hover:border-slate-700 transition-colors"
                        >
                          <div className="relative mx-auto w-16 h-16 mb-2">
                            <img
                              src={player.photoUrl}
                              alt={player.fullName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                              }}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700"
                            />
                            <span className="absolute -top-1.5 -left-1.5 bg-slate-900 border border-slate-700 text-gold text-[9px] font-black px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{player.fullName}</h4>
                          <p className="text-[10px] text-electric-light font-semibold">{player.playingRole}</p>
                          <span className="inline-block mt-1 text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                            {tier.name.split('—')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Franchise Purses Deep Dive */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black font-display text-white">
                Franchise Financials & Roster Details
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Complete overview of squad acquisitions, remaining balances, and team composition
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.teams.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-midnight rounded-3xl border border-slate-800 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30 text-gold" />
                  <p className="font-bold text-sm">No Franchises Created</p>
                  <p className="text-xs mt-1">Teams will be displayed here once set up by administrator.</p>
                </div>
              ) : (
                store.teams.map((team) => {
                  const teamRoster = store.sales.filter((s) => s.teamId === team.id);

                  return (
                    <div
                      key={team.id}
                      className="bg-midnight rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4"
                    >
                      <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.logo}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-white">{team.name}</h3>
                          <p className="text-xs text-slate-400">Captain: {team.captain}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-midnight-900 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Remaining Purse
                          </span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            ₹{team.remainingPurse.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="bg-midnight-900 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Players Bought
                          </span>
                          <span className="text-base font-black text-white font-mono">
                            {teamRoster.length} / {team.maxSquadSize}
                          </span>
                        </div>
                      </div>

                      {/* Bought Players List */}
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Acquired Squad ({teamRoster.length}):
                        </span>
                        {teamRoster.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-3 text-center bg-midnight-900/50 rounded-xl">
                            No players acquired yet
                          </p>
                        ) : (
                          teamRoster.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 rounded-xl bg-midnight-900 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <img
                                  src={item.playerPhoto}
                                  alt={item.playerName}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                                  }}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                                />
                                <div>
                                  <span className="font-bold text-white block leading-tight">{item.playerName}</span>
                                  <span className="text-[10px] text-electric-light">{item.playerRole}</span>
                                </div>
                              </div>
                              <span className="font-black text-gold font-mono">
                                ₹{item.finalPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Completed Tournament Results (Official Records) */}
        {activeTab === 'results' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Results Banner */}
            <div className="bg-gradient-to-r from-midnight via-deepBlue to-midnight rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gold block flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-gold" />
                  <span>Official Tournament Records</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                  SMYS 75th Sathpantha Auction Ledger
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Total Players Sold: <strong className="text-white font-mono">{store.sales.length}</strong> • Total Expenditure:{' '}
                  <strong className="text-gold font-mono">₹{totalSpend.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {highestSale && (
                  <div className="bg-midnight-900/90 px-4 py-3 rounded-2xl border border-gold/40 text-center">
                    <span className="text-[10px] text-gold uppercase font-bold block">Tournament Top Buy</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      ₹{highestSale.finalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-300 block truncate max-w-[140px]">
                      {highestSale.playerName}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-3 rounded-2xl bg-electric hover:bg-electric-hover text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-midnight rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={resultsSearch}
                  onChange={(e) => setResultsSearch(e.target.value)}
                  placeholder="Search player, team, or registration ID..."
                  className="w-full pl-9 pr-3 py-2 bg-midnight-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px] font-bold">Filter Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-midnight-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="all">All Roles</option>
                  <option value="Batsman">Batsmen</option>
                  <option value="Bowler">Bowlers</option>
                  <option value="All-Rounder">All-Rounders</option>
                  <option value="Wicket-Keeper">Wicket-Keepers</option>
                </select>
              </div>
            </div>

            {/* Complete Sale Ledger Table */}
            <div className="bg-midnight rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              {filteredSales.length === 0 ? (
                <div className="p-16 text-center text-slate-500">
                  <p className="text-sm font-bold text-slate-400">No matching sales records found</p>
                  <p className="text-xs mt-1">Confirmed sales will appear here as the auction progresses.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-midnight-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">Player</th>
                        <th className="p-3.5">Role & Tier</th>
                        <th className="p-3.5">Winning Team</th>
                        <th className="p-3.5 text-right">Final Hammer Price</th>
                        <th className="p-3.5 text-right">Sold Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {filteredSales.map((sale, idx) => (
                        <tr key={sale.id} className="hover:bg-midnight-800/50 transition-colors">
                          <td className="p-3.5 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <img
                                src={sale.playerPhoto}
                                alt={sale.playerName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                                }}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                              />
                              <div>
                                <span className="font-bold text-white block text-sm">{sale.playerName}</span>
                                <span className="text-[10px] font-mono text-slate-400">{sale.regNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-electric-light block">{sale.playerRole}</span>
                            <span className="text-[10px] text-slate-400">{sale.playerTier}</span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2 font-bold text-white">
                              <span className="text-lg">{sale.teamLogo}</span>
                              <span>{sale.teamName}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-black text-gold text-base font-mono text-right">
                            ₹{sale.finalPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px] text-right">
                            {sale.soldAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6.4 Dramatic SOLD Announcement Modal / Overlay */}
      {isSold && lastSale && dismissedSaleId !== lastSale.id && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-midnight via-midnight-800 to-deepBlue border-4 border-gold rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center relative overflow-hidden animate-glow">
            {/* Celebratory Badge */}
            <div className="inline-block bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-slate-950 font-black text-2xl sm:text-3xl px-8 py-2 rounded-2xl uppercase tracking-widest shadow-2xl mb-6 transform -rotate-1 scale-105">
              🔨 SOLD!
            </div>

            <div className="relative mx-auto w-32 h-32 mb-4">
              <img
                src={lastSale.playerPhoto}
                alt={lastSale.playerName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80';
                }}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-gold shadow-2xl ring-8 ring-gold/30 mx-auto"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display text-white mb-1">
              {lastSale.playerName}
            </h2>
            <p className="text-xs text-electric-light font-bold uppercase tracking-wider mb-4">
              {lastSale.playerRole} • {lastSale.playerTier}
            </p>

            <div className="bg-midnight-900/90 p-5 rounded-2xl border-2 border-gold/40 shadow-inner mb-6 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-widest block">
                Acquired By
              </span>
              <div className="flex items-center justify-center space-x-2 text-lg sm:text-xl font-black text-white">
                <span className="text-2xl">{lastSale.teamLogo}</span>
                <span>{lastSale.teamName}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gold font-display pt-1 font-mono">
                ₹{lastSale.finalPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={() => {
                setDismissedSaleId(lastSale.id);
                store.resetAuctionToIdle();
              }}
              className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              Acknowledge & Continue Broadcast
            </button>
          </div>
        </div>
      )}

      {/* 6.4 UNSOLD Announcement Modal */}
      {isUnsold && currentPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-midnight border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-slate-800/50">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>

            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              UNSOLD
            </span>

            <h3 className="text-xl font-black text-white mt-3 mb-1">
              {currentPlayer.fullName}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              No qualifying bids were submitted before the countdown expired. Candidate moves to the unsold recall pool.
            </p>

            <button
              onClick={() => {
                store.acknowledgeUnsold();
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors shadow"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
