import React, { useState, useMemo } from 'react';
import {
  Gavel,
  Play,
  Pause,
  SkipForward,
  UserX,
  CheckCircle,
  Search,
  Sparkles,
  Volume2,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { PlayerRegistration, Team } from '../../types';

export const LiveAuctionControl: React.FC = () => {
  const store = useTournamentStore();

  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState(false);
  const [manualCallPlayerId, setManualCallPlayerId] = useState('');
  const [adminCustomBid, setAdminCustomBid] = useState<number | ''>('');
  const [selectedBidTeamId, setSelectedBidTeamId] = useState<string>('');

  const allEligibleQueue = useMemo(
    () => store.getEligibleQueue(),
    [store.players, store.sales, store.tiers]
  );
  const eligibleQueue = useMemo(
    () => store.getEligibleQueue(selectedTierFilter),
    [store.players, store.sales, store.tiers, selectedTierFilter]
  );

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEligibleQueue.forEach((p) => {
      const t = store.getPlayerTier(p);
      counts[t.id] = (counts[t.id] || 0) + 1;
    });
    return counts;
  }, [allEligibleQueue, store]);

  const currentPlayer = store.players.find((p) => p.id === store.auctionState.currentPlayerId);
  const currentBidderTeam = store.teams.find((t) => t.id === store.auctionState.currentBidderTeamId);
  const currentTier = currentPlayer ? store.getPlayerTier(currentPlayer) : null;

  const nextPlayerOnDeck = eligibleQueue.find((p) => p.id !== store.auctionState.currentPlayerId);
  const nextTierOnDeck = nextPlayerOnDeck ? store.getPlayerTier(nextPlayerOnDeck) : null;

  const filteredQueue = eligibleQueue.filter((p) => {
    return (
      p.fullName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      p.regNumber.toLowerCase().includes(queueSearch.toLowerCase()) ||
      p.playingRole.toLowerCase().includes(queueSearch.toLowerCase())
    );
  });

  const handleCallPlayer = (playerId: string) => {
    store.callPlayer(playerId, 'manual');
  };

  const handleCallNext = () => {
    store.callNextEligiblePlayer(selectedTierFilter);
  };

  const handleToggleTimer = () => {
    if (store.auctionState.status === 'bidding') {
      store.pauseBidding();
    } else if (store.auctionState.status === 'paused') {
      store.resumeBidding();
    }
  };

  const handleAdminPlaceBid = (teamId: string) => {
    const res = store.placeBid(teamId, adminCustomBid ? Number(adminCustomBid) : undefined);
    if (!res.success) {
      alert(res.message);
    } else {
      setAdminCustomBid('');
    }
  };

  const handleConfirmSale = () => {
    const res = store.confirmSale();
    setIsConfirmSaleModalOpen(false);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleMarkUnsold = () => {
    if (confirm('Mark active player as UNSOLD?')) {
      store.markUnsold();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Status Bar */}
      <div className="bg-midnight-900 border border-slate-700/80 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center border border-gold/40">
            <Gavel className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold uppercase tracking-wide">
                Live Auction Commander
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest ${
                  store.auctionState.status === 'bidding'
                    ? 'bg-red-500 text-white animate-pulse'
                    : store.auctionState.status === 'paused'
                    ? 'bg-amber-400 text-slate-950'
                    : store.auctionState.status === 'sold'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {store.auctionState.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Session sync: Live Broadcast & Team Portals synchronized in real-time
            </p>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-midnight-800 px-4 py-2 rounded-xl border border-slate-700">
            <Clock className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold text-slate-400 uppercase">Clock:</span>
            <span
              className={`text-xl font-black font-mono ${
                store.auctionState.timerSecondsRemaining <= 5 ? 'text-red-400 animate-ping' : 'text-gold'
              }`}
            >
              {store.auctionState.timerSecondsRemaining}s
            </span>
          </div>

          <button
            onClick={handleToggleTimer}
            disabled={store.auctionState.status !== 'bidding' && store.auctionState.status !== 'paused'}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
              store.auctionState.status === 'bidding'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-40'
            }`}
          >
            {store.auctionState.status === 'bidding' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Clock</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Clock</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-Column Main Auction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Player Queue (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-slate-900">Calling Queue</h3>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-tight">
                  Tier-Ranked
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {eligibleQueue.length} in pool • Higher tier first
              </p>
            </div>
            <button
              onClick={handleCallNext}
              className="text-[11px] bg-electric/10 text-electric hover:bg-electric hover:text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-sm"
              title="Call next player according to higher tier priority"
            >
              Call Next →
            </button>
          </div>

          {/* Tier Call Hierarchy Notice */}
          <div className="mb-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
              <span>⚡ Priority:</span>
              <strong className="text-slate-800">Tier 1 → Tier 4</strong>
            </span>
            {nextTierOnDeck && (
              <span className="text-[10px] font-bold text-electric">
                Next: {nextTierOnDeck.name.split('—')[0]}
              </span>
            )}
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTierFilter('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                selectedTierFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({allEligibleQueue.length})
            </button>
            {store.tiers.map((t) => {
              const count = tierCounts[t.id] || 0;
              const isSelected = selectedTierFilter === t.id;
              const shortName = t.name.split('—')[0].trim();
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTierFilter(t.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-electric text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{shortName}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search queue */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search queue..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-electric"
            />
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredQueue.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-600">No players in this tier</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedTierFilter !== 'all'
                    ? 'All players in this tier have been called or sold.'
                    : 'Add or approve verified players in Player Registrations to see them in this calling queue.'}
                </p>
              </div>
            ) : (
              filteredQueue.map((p, idx) => {
                const tier = store.getPlayerTier(p);
                const isCurrent = p.id === store.auctionState.currentPlayerId;
                const prevPlayer = idx > 0 ? filteredQueue[idx - 1] : null;
                const prevTier = prevPlayer ? store.getPlayerTier(prevPlayer) : null;
                const showTierHeader = selectedTierFilter === 'all' && (!prevTier || prevTier.id !== tier.id);

                return (
                  <React.Fragment key={p.id}>
                    {showTierHeader && (
                      <div className="pt-2 pb-1 first:pt-0">
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-100/90 border border-slate-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                            {tier.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-500">
                            Base ₹{tier.minBid.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      onClick={() => handleCallPlayer(p.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-electric bg-electric/10 ring-2 ring-electric/30 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="w-8 h-8 rounded-lg object-cover border"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{p.fullName}</p>
                          <span className="text-[10px] text-slate-500">{p.playingRole}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 block">
                          {tier.name.split('—')[0]}
                        </span>
                        <span
                          className="text-[10px] font-bold text-electric"
                          title={`₹${tier.minBid.toLocaleString('en-IN')}`}
                        >
                          {tier.minBid >= 10000000
                            ? `₹${(tier.minBid / 10000000).toFixed(tier.minBid % 10000000 === 0 ? 0 : 1)} Cr`
                            : tier.minBid >= 100000
                            ? `₹${(tier.minBid / 100000).toFixed(0)} L`
                            : `₹${(tier.minBid / 1000).toFixed(0)}K`}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Current Player Spotlight & Bidding Dashboard (6 cols) */}
        <div className="lg:col-span-6 bg-gradient-to-b from-midnight via-midnight-800 to-deepBlue rounded-2xl border-2 border-gold/40 shadow-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle gold glow aura */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

          {currentPlayer ? (
            <div className="space-y-6 relative z-10">
              {/* Spotlight Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gold text-slate-950 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {currentTier?.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {currentPlayer.regNumber}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Min Base Bid: <strong className="text-gold">₹{currentTier?.minBid.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Player Showcase Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative">
                  <img
                    src={currentPlayer.photoUrl}
                    alt={currentPlayer.fullName}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-gold shadow-2xl ring-4 ring-gold/20"
                  />
                  <span className="absolute -bottom-2 -right-2 bg-electric text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase shadow">
                    {currentPlayer.playingRole}
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                    {currentPlayer.fullName}
                  </h1>
                  <p className="text-xs text-slate-300">
                    {currentPlayer.academicYear} • {currentPlayer.battingStyle}
                  </p>
                  <p className="text-xs text-slate-400">
                    Bowling: {currentPlayer.bowlingStyle}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      🏏 Bat: {currentPlayer.battingRating ?? 'NA'}/10
                    </span>
                    <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      🎯 Bowl: {currentPlayer.bowlingRating ?? 'NA'}/10
                    </span>
                    <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      🧤 Keep: {currentPlayer.wicketkeepingRating ?? 'NA'}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Career Stats Grid */}
              <div className="grid grid-cols-3 gap-3 bg-midnight-900/90 p-3.5 rounded-xl border border-slate-700/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Matches</span>
                  <span className="text-lg font-black text-white">{currentPlayer.matchesPlayed}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Runs</span>
                  <span className="text-lg font-black text-gold">{currentPlayer.runsScored}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wickets</span>
                  <span className="text-lg font-black text-emerald-400">{currentPlayer.wicketsTaken}</span>
                </div>
              </div>

              {/* Live Leading Bid Display Box */}
              <div className="bg-gradient-to-r from-deepBlue via-midnight to-deepBlue p-5 rounded-2xl border-2 border-gold/50 text-center shadow-inner">
                <span className="text-xs text-gold uppercase font-extrabold tracking-widest block mb-1">
                  Current Highest Bid
                </span>
                <div className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
                  ₹{store.auctionState.currentBid.toLocaleString('en-IN')}
                </div>

                {currentBidderTeam ? (
                  <div className="inline-flex items-center space-x-2 mt-3 px-4 py-1.5 rounded-full bg-midnight-900 border border-gold/40 text-gold text-xs font-black">
                    <span className="text-base">{currentBidderTeam.logo}</span>
                    <span>Leading: {currentBidderTeam.name}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    Awaiting first opening bid of ₹{currentTier?.minBid.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 my-auto">
              <Gavel className="w-16 h-16 mx-auto mb-3 opacity-30 text-gold" />
              <h2 className="text-xl font-bold text-white">No Player on Podium</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select a player from the queue on the left or click "Call Next" to spotlight them on stage.
              </p>
              <button
                onClick={handleCallNext}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Call Next Eligible Player
              </button>
            </div>
          )}

          {/* Admin Manual Bid Injection Desk */}
          {currentPlayer && (
            <div className="mt-4 pt-3 border-t border-slate-700/80">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span className="font-bold">Place Bid on Behalf of Team:</span>
                <span className="text-[11px] text-slate-400">
                  +₹{currentTier?.bidIncrement.toLocaleString('en-IN')} increment
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedBidTeamId}
                  onChange={(e) => setSelectedBidTeamId(e.target.value)}
                  className="p-2 text-xs rounded-xl bg-midnight-900 border border-slate-700 text-white font-bold flex-1"
                >
                  <option value="">-- Choose Team to Place Bid --</option>
                  {store.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logo} {t.name} (Purse: ₹
                      {t.remainingPurse >= 10000000
                        ? `${(t.remainingPurse / 10000000).toFixed(1)}Cr`
                        : `${(t.remainingPurse / 100000).toFixed(1)}L`})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!selectedBidTeamId}
                  onClick={() => handleAdminPlaceBid(selectedBidTeamId)}
                  className="px-4 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md disabled:opacity-40 transition-colors"
                >
                  Place Next Bid
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Participating Teams & Live Bidding Status (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[640px]">
          <div className="pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Franchises & Purses</h3>
            <p className="text-[11px] text-slate-400">Click a team to place instant bid</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {store.teams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-600">No teams created</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Create participating teams in <strong>Teams & Accounts</strong> to enable bidding on players.
                </p>
              </div>
            ) : (
              store.teams.map((team) => {
                const isLeading = team.id === store.auctionState.currentBidderTeamId;

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                      isLeading
                        ? 'border-gold bg-amber-50/80 ring-2 ring-gold/40 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{team.logo}</span>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {team.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {team.playersCount}/{team.maxSquadSize} squad
                          </span>
                        </div>
                      </div>

                      {isLeading && (
                        <span className="text-[10px] bg-gold text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                          Highest Bidder
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Purse:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{team.remainingPurse.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Instant Bid Button */}
                    {currentPlayer && (
                      <button
                        onClick={() => handleAdminPlaceBid(team.id)}
                        disabled={isLeading || team.remainingPurse < store.auctionState.currentBid}
                        className="mt-2 w-full py-1.5 rounded-lg bg-slate-100 hover:bg-electric hover:text-white text-slate-700 font-bold text-[11px] transition-colors disabled:opacity-30"
                      >
                        {isLeading ? 'Currently Leading' : `Bid for ${team.shortName}`}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCallNext}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <SkipForward className="w-4 h-4" />
            <span>Call Next Player</span>
          </button>

          <button
            onClick={handleMarkUnsold}
            disabled={!currentPlayer}
            className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center space-x-1.5 disabled:opacity-40"
          >
            <UserX className="w-4 h-4" />
            <span>Mark Unsold</span>
          </button>
        </div>

        {/* Finalize Sale Confirmation Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsConfirmSaleModalOpen(true)}
            disabled={!currentPlayer || !currentBidderTeam}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/30 flex items-center space-x-2 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Gavel className="w-4 h-4" />
            <span>
              Confirm Sale — ₹{store.auctionState.currentBid.toLocaleString('en-IN')}
            </span>
          </button>
        </div>
      </div>

      {/* Sale Confirmation Modal */}
      {isConfirmSaleModalOpen && currentPlayer && currentBidderTeam && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-full bg-gold/20 text-gold-dark mx-auto flex items-center justify-center mb-4 ring-8 ring-gold/10">
              <Gavel className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              Finalize Sale Transaction?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              This action will deduct ₹{store.auctionState.currentBid.toLocaleString('en-IN')} from{' '}
              <strong>{currentBidderTeam.name}</strong>, assign the player to their roster, and announce the confirmed SOLD result to all public broadcast viewers.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Player:</span>
                <span className="font-bold text-slate-900">{currentPlayer.fullName} ({currentPlayer.regNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Winning Franchise:</span>
                <span className="font-bold text-electric">{currentBidderTeam.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Final Hammer Price:</span>
                <span className="font-black text-slate-900">₹{store.auctionState.currentBid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Franchise New Purse:</span>
                <span className="font-bold text-emerald-600">
                  ₹{(currentBidderTeam.remainingPurse - store.auctionState.currentBid).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmSaleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-6 py-2 rounded-xl bg-gold text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-gold-hover shadow-md"
              >
                Gavel Strike — SOLD!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
