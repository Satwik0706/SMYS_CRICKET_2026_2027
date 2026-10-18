import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  Users,
  Radio,
  UserPlus,
  LogIn,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { AppPortal } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';

interface PortalGatewayProps {
  onNavigate: (portal: AppPortal) => void;
}

type SelectedRole = '' | 'admin' | 'team' | 'live' | 'register';

export const PortalGateway: React.FC<PortalGatewayProps> = ({ onNavigate }) => {
  const store = useTournamentStore();

  const [selectedRole, setSelectedRole] = useState<SelectedRole>('admin');

  // Admin login states - showAdminPass is TRUE by default so password is visible while entering
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Team login states - showTeamPass is TRUE by default
  const [teamLoginIdInput, setTeamLoginIdInput] = useState('');
  const [teamPassInput, setTeamPassInput] = useState('');
  const [showTeamPass, setShowTeamPass] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  const isAuctionLive = store.auctionState.status === 'bidding';
  const verifiedPlayersCount = store.players.filter((p) => p.status === 'verified').length;
  const totalTeamsCount = store.teams.length;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const res = store.loginAdmin(adminIdInput, adminPassInput);
    if (res.success) {
      onNavigate('admin');
    } else {
      setAdminError(res.message);
    }
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError(null);
    const res = store.loginTeam(teamLoginIdInput, teamPassInput);
    if (res.success) {
      onNavigate('team');
    } else {
      setTeamError(res.message);
    }
  };

  const handleSelectTeamFromList = (loginId: string) => {
    setTeamLoginIdInput(loginId);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF8F5] bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(245,184,46,0.12),rgba(250,248,245,1))] text-slate-900 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-7">
        
        {/* Hero Header */}
        <div className="text-center space-y-3 pt-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-bold tracking-wider backdrop-blur-md shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span className="uppercase">SMYS Premier League 2026 • Official Auction Gateway</span>
          </div>

          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 font-black ring-2 ring-amber-400/50">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-slate-900 uppercase">
              SMYS <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">Auction Gateway</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium">
            Intra Hostel Cricket Tournament • <span className="text-amber-700 font-bold">Organized by 75th Sathpantha</span>
          </p>
        </div>

        {/* Live Metrics Ticker (Creamy Cards) */}
        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto text-center">
          <div className="p-3 rounded-2xl bg-white/90 border border-[#E7E0D2] shadow-sm backdrop-blur-md">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Auction Engine
            </span>
            <span
              className={`text-xs sm:text-sm font-black mt-0.5 flex items-center justify-center space-x-1.5 ${
                isAuctionLive ? 'text-red-600 animate-pulse' : 'text-emerald-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAuctionLive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isAuctionLive ? 'LIVE BIDDING' : 'STANDBY READY'}</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-[#E7E0D2] shadow-sm backdrop-blur-md">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Franchises
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-800 mt-0.5 block">
              {totalTeamsCount} Teams
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-[#E7E0D2] shadow-sm backdrop-blur-md">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Verified Pool
            </span>
            <span className="text-xs sm:text-sm font-black text-blue-700 mt-0.5 block">
              {verifiedPlayersCount} Players
            </span>
          </div>
        </div>

        {/* Role Selection White Creamy Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#E5DFD2] p-5 sm:p-7 shadow-[0_12px_45px_-8px_rgba(40,30,15,0.08)] space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Select Access Role</span>
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
                Instant 1-Click Role Access
              </span>
            </div>

            {/* Quick 4-Tab Switcher for High Speed UI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setAdminError(null);
                  setTeamError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedRole === 'admin'
                    ? 'bg-royal/10 border-royal text-royal shadow-sm ring-2 ring-royal/30'
                    : 'bg-[#FAF7F2] border-[#E8E1D3] text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'admin' ? 'bg-royal text-white' : 'bg-slate-200/60 text-slate-500'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  {selectedRole === 'admin' && (
                    <span className="w-2 h-2 rounded-full bg-royal animate-pulse" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${selectedRole === 'admin' ? 'text-royal' : 'text-slate-800'}`}>Administrator</div>
                  <div className="text-[10px] text-slate-500">Control Centre</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('team');
                  setAdminError(null);
                  setTeamError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedRole === 'team'
                    ? 'bg-amber-500/15 border-amber-600 text-amber-900 shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-[#FAF7F2] border-[#E8E1D3] text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'team' ? 'bg-amber-500 text-white' : 'bg-slate-200/60 text-slate-500'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  {selectedRole === 'team' && (
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${selectedRole === 'team' ? 'text-amber-900' : 'text-slate-800'}`}>Franchise Team</div>
                  <div className="text-[10px] text-slate-500">Bidding Console</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('live');
                  setAdminError(null);
                  setTeamError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedRole === 'live'
                    ? 'bg-red-50 border-red-500 text-red-800 shadow-sm ring-2 ring-red-400/30'
                    : 'bg-[#FAF7F2] border-[#E8E1D3] text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'live' ? 'bg-red-600 text-white' : 'bg-slate-200/60 text-slate-500'}`}>
                    <Radio className="w-4 h-4" />
                  </div>
                  {selectedRole === 'live' && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${selectedRole === 'live' ? 'text-red-800' : 'text-slate-800'}`}>Live Broadcast</div>
                  <div className="text-[10px] text-slate-500">Public Stream</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('register');
                  setAdminError(null);
                  setTeamError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedRole === 'register'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-[#FAF7F2] border-[#E8E1D3] text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'register' ? 'bg-emerald-600 text-white' : 'bg-slate-200/60 text-slate-500'}`}>
                    <UserPlus className="w-4 h-4" />
                  </div>
                  {selectedRole === 'register' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${selectedRole === 'register' ? 'text-emerald-900' : 'text-slate-800'}`}>Hostel Player</div>
                  <div className="text-[10px] text-slate-500">Registration</div>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Content Based on Role Selection */}

          {/* 1. ADMIN SELECTED */}
          {selectedRole === 'admin' && (
            <div className="bg-[#FCFAF6] rounded-2xl border border-[#E6DFD1] p-6 space-y-5 animate-fadeIn shadow-sm">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#E8E2D6]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Administrator Control Centre</h3>
                  <p className="text-xs text-slate-500">
                    Sign in to manage teams, verify candidates, and control live bidding gavel calls.
                  </p>
                </div>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
                {/* Admin ID - Visible While Entering */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Administrator ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={adminIdInput}
                      onChange={(e) => setAdminIdInput(e.target.value)}
                      placeholder="Enter Administrator ID"
                      autoComplete="username"
                      className="w-full p-3.5 pl-10 rounded-xl bg-white border border-[#D6CEC0] text-slate-900 font-mono text-sm focus:outline-none focus:border-royal focus:ring-2 focus:ring-royal/20 transition-all placeholder:text-slate-400 shadow-sm"
                    />
                    <div className="absolute left-3.5 top-3.5 text-royal">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Admin Password - Visible While Entering by Default with (*) Mask Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Administrator Password
                    </label>

                    {/* Prominent Visible / Hidden (*) Toggle Switcher */}
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        showAdminPass
                          ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title={showAdminPass ? 'Password is visible while entering. Click to mask with (*)' : 'Password is masked (*). Click to make visible'}
                    >
                      {showAdminPass ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Visible (Click to mask *)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono">Hidden (*)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      required
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      placeholder="Enter Password"
                      autoComplete="current-password"
                      className="w-full p-3.5 pl-10 pr-12 rounded-xl bg-white border border-[#D6CEC0] text-slate-900 font-mono text-sm focus:outline-none focus:border-royal focus:ring-2 focus:ring-royal/20 transition-all placeholder:text-slate-400 shadow-sm"
                    />
                    <div className="absolute left-3.5 top-3.5 text-royal">
                      <Lock className="w-4 h-4" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                      title={showAdminPass ? 'Mask password (*)' : 'Make password visible'}
                    >
                      {showAdminPass ? (
                        <Eye className="w-4 h-4 text-amber-600" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-royal via-indigo-600 to-electric text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-royal/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4 text-gold" />
                  <span>Authenticate & Enter Admin Centre</span>
                </button>
              </form>
            </div>
          )}

          {/* 2. TEAM SELECTED */}
          {selectedRole === 'team' && (
            <div className="bg-[#FCFAF6] rounded-2xl border border-[#E6DFD1] p-6 space-y-5 animate-fadeIn shadow-sm">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#E8E2D6]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Franchise Team Bidding Console</h3>
                  <p className="text-xs text-slate-500">
                    Sign in with your team credentials to access your live bidding paddle and squad budget.
                  </p>
                </div>
              </div>

              {teamError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{teamError}</span>
                </div>
              )}

              {totalTeamsCount === 0 ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">No Participating Franchises Created Yet</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    The tournament administrator has not added any teams yet. Create teams inside the Administrator Control Centre first.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTeamSubmit} className="space-y-4 text-xs">
                  {/* Quick Team selector pills */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Franchise (or Type Login ID)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {store.teams.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTeamFromList(t.loginId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 ${
                            teamLoginIdInput.toLowerCase() === t.loginId.toLowerCase()
                              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/30 shadow-sm'
                              : 'bg-white text-slate-700 border-[#D6CEC0] hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <span className="text-sm">{t.logo}</span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={teamLoginIdInput}
                        onChange={(e) => setTeamLoginIdInput(e.target.value)}
                        placeholder="Enter Franchise ID"
                        className="w-full p-3.5 pl-10 rounded-xl bg-white border border-[#D6CEC0] text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                      />
                      <div className="absolute left-3.5 top-3.5 text-amber-600">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider">
                        Franchise Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTeamPass(!showTeamPass)}
                        className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          showTeamPass
                            ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                        }`}
                        title={showTeamPass ? 'Password is visible while entering. Click to mask with (*)' : 'Password is masked (*). Click to make visible'}
                      >
                        {showTeamPass ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            <span>Visible (Click to mask *)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-mono">Hidden (*)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showTeamPass ? 'text' : 'password'}
                        required
                        value={teamPassInput}
                        onChange={(e) => setTeamPassInput(e.target.value)}
                        placeholder="Enter Franchise Password"
                        className="w-full p-3.5 pl-10 pr-12 rounded-xl bg-white border border-[#D6CEC0] text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                      />
                      <div className="absolute left-3.5 top-3.5 text-amber-600">
                        <Lock className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTeamPass(!showTeamPass)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                        title={showTeamPass ? 'Mask password (*)' : 'Make password visible'}
                      >
                        {showTeamPass ? (
                          <Eye className="w-4 h-4 text-amber-600" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Authenticate & Enter Franchise Portal</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. LIVE SPECTATOR SELECTED */}
          {selectedRole === 'live' && (
            <div className="bg-[#FCFAF6] rounded-2xl border border-[#E6DFD1] p-6 space-y-5 animate-fadeIn shadow-sm">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#E8E2D6]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md">
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Public Live Auction Broadcast</h3>
                  <p className="text-xs text-slate-500">
                    Watch the real-time player calling, active bids, team purse meters, and commentary gavel.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E6DFD1] shadow-sm">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">
                    Calling Status
                  </span>
                  <span className="text-slate-900 font-bold text-sm block mt-0.5">
                    {store.auctionState.status === 'bidding'
                      ? 'Live Bidding Active'
                      : 'Auction Standing By'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E6DFD1] shadow-sm">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">
                    Audience Mode
                  </span>
                  <span className="text-emerald-700 font-bold text-sm block mt-0.5">
                    Open Public Access
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('live')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-600/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Radio className="w-4 h-4 text-white" />
                <span>Enter Public Live Broadcast</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4. PLAYER REGISTRATION SELECTED */}
          {selectedRole === 'register' && (
            <div className="bg-[#FCFAF6] rounded-2xl border border-[#E6DFD1] p-6 space-y-5 animate-fadeIn shadow-sm">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#E8E2D6]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Player Registration Portal</h3>
                  <p className="text-xs text-slate-500">
                    Hostel students register your cricket profile, stats, photos, and playing skills.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#E6DFD1] space-y-2 text-xs shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eligibility & Registration Guidelines:</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  • Open to all hostel students across all branches and academic years.
                  <br />
                  • Provide accurate batting/bowling statistics, matches played, and contact info.
                  <br />
                  • Upload your front-facing profile photograph for the live auction draft screen.
                  <br />
                  • Once submitted, the administrator will verify your profile for the auction pool.
                </p>
              </div>

              <button
                onClick={() => onNavigate('register')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>Enter Player Registration Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Security Isolation Notice */}
        <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E4DCCE] flex items-center justify-center space-x-2 text-xs text-slate-600 text-center shadow-sm">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="text-slate-800">Restricted Session Isolation:</strong> Direct authentication ensures role boundaries are strictly protected. To switch roles, exit back to this central gateway.
          </span>
        </div>
      </div>
    </div>
  );
};
