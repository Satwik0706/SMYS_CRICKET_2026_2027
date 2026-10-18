import React, { useState } from 'react';
import {
  Users,
  LogIn,
  LogOut,
  Gavel,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';

interface TeamPortalProps {
  onLogout?: () => void;
}

export const TeamPortal: React.FC<TeamPortalProps> = ({ onLogout }) => {
  const store = useTournamentStore();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [customBidAmount, setCustomBidAmount] = useState<number | ''>('');

  const activeTeam = store.getActiveTeam();
  const isAuctionLive = store.auctionState.status === 'bidding';
  const currentPlayer = store.players.find((p) => p.id === store.auctionState.currentPlayerId);
  const currentTier = currentPlayer ? store.getPlayerTier(currentPlayer) : null;
  const isCurrentLeading = activeTeam ? activeTeam.id === store.auctionState.currentBidderTeamId : false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = store.loginTeam(loginId, password);
    if (!res.success) {
      setLoginError(res.message);
    } else {
      setLoginId('');
      setPassword('');
    }
  };

  const handleQuickDemoLogin = (teamId: string) => {
    const team = store.teams.find((t) => t.id === teamId);
    if (team) {
      store.loginTeam(team.loginId, team.passwordHash);
    }
  };

  const handleLogout = () => {
    store.logoutTeam();
    if (onLogout) onLogout();
  };

  const nextIncrement = currentTier?.bidIncrement || 10000;
  const nextValidBid =
    store.auctionState.currentBidderTeamId === null
      ? store.auctionState.currentBid
      : store.auctionState.currentBid + nextIncrement;

  const handlePlaceBid = (amount?: number) => {
    if (!activeTeam) return;
    setBidError(null);
    setBidSuccess(null);

    const targetAmount = amount || (customBidAmount ? Number(customBidAmount) : undefined);
    const res = store.placeBid(activeTeam.id, targetAmount);

    if (!res.success) {
      setBidError(res.message);
      setTimeout(() => setBidError(null), 5000);
    } else {
      setBidSuccess(res.message);
      setCustomBidAmount('');
      setTimeout(() => setBidSuccess(null), 4000);
    }
  };

  // If not logged in, show polished franchise login screen
  if (!activeTeam) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F4F7FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-midnight via-deepBlue to-royal text-gold flex items-center justify-center mx-auto shadow-md border border-gold/40">
              <Users className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black font-display text-slate-900 tracking-tight">
              Franchise Team Login
            </h1>
            <p className="text-xs text-slate-500">
              SMYS Intra Hostel Cricket • Authenticated Bidding Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Team Login ID
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter Franchise Login ID"
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-royal"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-royal flex items-center space-x-1 transition-colors"
                >
                  {showPassword ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-royal" />
                      <span>Visible (Click to mask *)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden (*)</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter franchise password"
                  className="w-full p-3 pr-10 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-royal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  title={showPassword ? "Click to mask (*)" : "Click to make visible"}
                >
                  {showPassword ? <Eye className="w-4 h-4 text-royal" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-royal to-deepBlue text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Authenticate & Enter Auction</span>
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100">
            {store.teams.length === 0 ? (
              <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700">No Teams Created Yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Go to <strong>Admin Control → Teams & Accounts</strong> to create your custom teams.
                </p>
              </div>
            ) : (
              <>
                <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                  Quick Access (Created Teams):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {store.teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleQuickDemoLogin(t.id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-bold text-slate-700 flex items-center space-x-2 transition-colors"
                    >
                      <span className="text-base">{t.logo}</span>
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Click any team above to authenticate instantly.
                </p>
              </>
            )}
          </div>

          {onLogout && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-royal hover:underline font-bold"
              >
                ← Return to Role Selection Gateway
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Authenticated Team View
  const teamPurchases = store.sales.filter((s) => s.teamId === activeTeam.id);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F7FC] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Team Profile Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          background: `linear-gradient(135deg, ${activeTeam.color} 0%, #0B1535 100%)`,
        }}
      >
        <div className="flex items-center space-x-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2"
            style={{
              backgroundColor: activeTeam.color,
              borderColor: activeTeam.secondaryColor || '#FFFFFF',
            }}
          >
            {activeTeam.logo}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gold text-slate-950 font-black px-2.5 py-0.5 rounded-md uppercase">
                {activeTeam.teamId}
              </span>
              <span className="text-xs text-slate-300 font-mono">ID: {activeTeam.loginId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white mt-1">
              {activeTeam.name}
            </h1>
            <p className="text-xs text-slate-300">
              Captain: <strong className="text-white">{activeTeam.captain}</strong> • Max Squad:{' '}
              {activeTeam.maxSquadSize}
            </p>
          </div>
        </div>

        {/* Financial & Logout controls */}
        <div className="flex items-center space-x-4 self-start md:self-auto">
          <div className="bg-midnight-900/80 px-4 py-2.5 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-gold uppercase font-bold tracking-wider block">
              Remaining Auction Purse
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
              ₹{activeTeam.remainingPurse.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Auction Bidding Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Player Podium Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Live Auction Stage
              </h2>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
              <Clock className="w-3.5 h-3.5 text-gold-dark" />
              <span>{store.auctionState.timerSecondsRemaining}s remaining</span>
            </div>
          </div>

          {currentPlayer ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <img
                  src={currentPlayer.photoUrl}
                  alt={currentPlayer.fullName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-slate-100 shadow-md ring-2 ring-slate-200"
                />

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="text-[11px] font-bold text-electric uppercase tracking-wider">
                    {currentTier?.name} • {currentPlayer.regNumber}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">{currentPlayer.fullName}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentPlayer.playingRole} • {currentPlayer.academicYear}
                  </p>
                  <p className="text-xs text-slate-400">
                    {currentPlayer.battingStyle} • {currentPlayer.bowlingStyle}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start text-xs">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                      🏏 {currentPlayer.battingRating ?? 'NA'}/10
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                      🎯 {currentPlayer.bowlingRating ?? 'NA'}/10
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                      🧤 {currentPlayer.wicketkeepingRating ?? 'NA'}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Bid Display */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider block">
                  Current Highest Bid
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
                  ₹{store.auctionState.currentBid.toLocaleString('en-IN')}
                </span>

                {isCurrentLeading ? (
                  <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-100/80 px-3 py-1 rounded-full inline-block">
                    ★ Your franchise holds the leading bid!
                  </div>
                ) : store.auctionState.currentBidderTeamId ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Leading team: <strong className="text-slate-800">{store.teams.find((t) => t.id === store.auctionState.currentBidderTeamId)?.name}</strong>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">
                    Awaiting first opening bid
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Gavel className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="font-bold text-slate-600">No active player called</p>
              <p className="text-xs mt-1">Waiting for the auctioneer to spotlight the next candidate.</p>
            </div>
          )}
        </div>

        {/* Bidding Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Submit Authorized Bid
            </h2>

            {/* Error / Success Notifications */}
            {bidError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            {bidSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2 animate-fadeIn">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {/* Quick Bid Button */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Next Incremental Bid
              </span>
              <button
                type="button"
                onClick={() => handlePlaceBid(nextValidBid)}
                disabled={
                  !isAuctionLive ||
                  !currentPlayer ||
                  isCurrentLeading ||
                  activeTeam.remainingPurse < nextValidBid ||
                  activeTeam.playersCount >= activeTeam.maxSquadSize
                }
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2"
              >
                <Gavel className="w-5 h-5" />
                <span>Bid ₹{nextValidBid.toLocaleString('en-IN')} (+₹{(nextIncrement / 1000).toFixed(0)}K)</span>
              </button>
            </div>

            {/* Power Raise by +50K or +1 Lakh */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePlaceBid(nextValidBid + 20000)}
                disabled={
                  !isAuctionLive ||
                  !currentPlayer ||
                  isCurrentLeading ||
                  activeTeam.remainingPurse < nextValidBid + 20000
                }
                className="p-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30"
              >
                Raise +₹20,000
              </button>

              <button
                type="button"
                onClick={() => handlePlaceBid(nextValidBid + 50000)}
                disabled={
                  !isAuctionLive ||
                  !currentPlayer ||
                  isCurrentLeading ||
                  activeTeam.remainingPurse < nextValidBid + 50000
                }
                className="p-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30"
              >
                Raise +₹50,000
              </button>
            </div>

            {/* Custom Bid Input */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Custom Bid (₹)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="5000"
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Min ₹${nextValidBid}`}
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-royal"
                />
                <button
                  type="button"
                  onClick={() => handlePlaceBid()}
                  disabled={
                    !isAuctionLive ||
                    !currentPlayer ||
                    isCurrentLeading ||
                    !customBidAmount ||
                    Number(customBidAmount) < nextValidBid
                  }
                  className="px-4 py-2.5 rounded-xl bg-royal text-white font-bold text-xs shadow-md disabled:opacity-40"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <strong>Rules:</strong> All bids deduct atomically upon administrator sale confirmation. Bids cannot be retracted.
          </div>
        </div>
      </div>

      {/* Team Roster List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Your Acquired Squad ({teamPurchases.length}/{activeTeam.maxSquadSize})
            </h3>
            <p className="text-xs text-slate-400">Total Spent: ₹{activeTeam.spentPurse.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {teamPurchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold text-slate-600">No players acquired yet</p>
            <p className="text-[11px] mt-0.5">Win bids in the live auction to build your championship squad!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamPurchases.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-400 text-[10px]">#{idx + 1}</span>
                  <img
                    src={item.playerPhoto}
                    alt={item.playerName}
                    className="w-10 h-10 rounded-xl object-cover border"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{item.playerName}</p>
                    <span className="text-[10px] text-electric font-semibold">{item.playerRole}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">
                    ₹{item.finalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">{item.playerTier}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
