import React, { useState } from 'react';
import {
  Trophy,
  Radio,
  UserPlus,
  Shield,
  Users,
  Volume2,
  VolumeX,
  Menu,
  X,
  Database,
  LogOut,
  Lock,
  Home,
  User,
} from 'lucide-react';
import { AppPortal } from '../../types';
import { sound } from '../../services/soundEffects';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { getSupabaseCredentials } from '../../services/supabaseClient';

interface HeaderProps {
  currentPortal: AppPortal;
  onSelectPortal: (portal: AppPortal) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPortal, onSelectPortal }) => {
  const store = useTournamentStore();
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConfigured } = getSupabaseCredentials();

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const isLive = store.auctionState.status === 'bidding';
  const activeTeam = store.getActiveTeam();
  const isDarkPortal = currentPortal === 'live' || currentPortal === 'gateway';

  const handleExitPortal = () => {
    if (currentPortal === 'admin') {
      store.logoutAdmin();
    } else if (currentPortal === 'team') {
      store.logoutTeam();
    } else if (currentPortal === 'player' || currentPortal === 'correction') {
      store.logoutPlayer();
      return;
    }
    onSelectPortal('gateway');
  };

  const isPublicStandalone =
    currentPortal === 'register' || currentPortal === 'correction' || currentPortal === 'player';

  const renderPortalBadge = () => {
    switch (currentPortal) {
      case 'admin':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-royal/20 border border-royal/40 text-royal-light text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-gold" />
            <span>Admin Control Centre</span>
            <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.2 rounded-full font-mono">
              {store.adminId}
            </span>
          </div>
        );
      case 'team':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Franchise: {activeTeam ? activeTeam.name : 'Team Portal'}</span>
            {activeTeam && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
        );
      case 'live':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Public Live Broadcast</span>
            {isLive && (
              <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full">
                LIVE
              </span>
            )}
          </div>
        );
      case 'register':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Player Registration Portal</span>
          </div>
        );
      case 'correction':
      case 'player':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Player Correction Desk</span>
          </div>
        );
      case 'gateway':
      default:
        return (
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            isDarkPortal
              ? 'bg-white/10 border border-white/20 text-slate-300'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-900'
          }`}>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Role Selection Gateway</span>
          </div>
        );
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b ${
        isDarkPortal
          ? 'bg-midnight border-midnight-700/80 text-white shadow-xl shadow-black/30'
          : 'bg-[#FCFAF6]/95 backdrop-blur-md border-[#E7E1D4] text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className={`flex items-center space-x-3 group ${
              isPublicStandalone || currentPortal === 'gateway' ? 'cursor-default' : 'cursor-pointer'
            }`}
            onClick={() => {
              if (isPublicStandalone || currentPortal === 'gateway') return;
              if (confirm('Do you want to exit this portal and return to the Common Role Gateway?')) {
                handleExitPortal();
              }
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-midnight-700 via-deepBlue to-electric flex items-center justify-center shadow-md shadow-electric/20 border border-gold/40 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-gold animate-glow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg font-display uppercase bg-gradient-to-r from-gold via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                  SMYS
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isLive
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-electric/20 text-electric border border-electric/30'
                  }`}
                >
                  {isLive ? '● LIVE AUCTION' : 'CRICKET 2026'}
                </span>
              </div>
              <p
                className={`text-[11px] font-medium tracking-tight ${
                  isDarkPortal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Intra Hostel Cricket • <span className="text-gold font-semibold">By 75th Sathpantha</span>
              </p>
            </div>
          </div>

          {/* Center: Current Isolated Portal Identity (No cross-portal navigation) */}
          <div className="hidden md:flex items-center">{renderPortalBadge()}</div>

          {/* Quick Controls: Realtime Sync, Audio & Exit Portal Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase status badge */}
            <div
              title={
                store.isRealtimeConnected
                  ? 'Realtime WebSocket Connected — Sub-50ms live synchronizing across all devices'
                  : isConfigured
                  ? 'Connecting to Supabase Realtime channel...'
                  : 'Local Realtime Broadcast Active'
              }
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                store.isRealtimeConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : isConfigured
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  store.isRealtimeConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span>{store.isRealtimeConnected ? '⚡ Realtime Live' : 'Connecting...'}</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio Commentary & Gavel' : 'Mute Sound'}
              className={`p-2 rounded-lg transition-colors border ${
                isDarkPortal
                  ? 'bg-midnight-800 border-midnight-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Exit Portal / Switch Role Button */}
            {currentPortal === 'admin' || currentPortal === 'team' ? (
              <button
                onClick={handleExitPortal}
                title="Exit this portal and return to the Common Role Gateway"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {currentPortal === 'admin' ? 'Exit Admin' : 'Exit Team'}
                </span>
                <span className="sm:hidden">Exit</span>
              </button>
            ) : currentPortal === 'live' ? (
              <button
                onClick={() => onSelectPortal('gateway')}
                title="Return to Common Role Gateway"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Stream</span>
                <span className="sm:hidden">Exit</span>
              </button>
            ) : (currentPortal === 'correction' || currentPortal === 'player') && store.getActivePlayer() ? (
              <button
                onClick={() => {
                  store.logoutPlayer();
                }}
                title="Sign out of your player session"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-400 font-semibold px-2 py-1 rounded-lg bg-black/5 border border-black/10">
                <Lock className="w-3 h-3 text-gold" />
                <span>Restricted Access</span>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Strictly shows current portal info) */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden px-4 pt-3 pb-4 space-y-3 border-t ${
            isDarkPortal ? 'bg-midnight-900 border-midnight-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <span className="text-xs font-bold text-slate-400">Current Portal Status</span>
            {renderPortalBadge()}
          </div>

          {currentPortal === 'admin' || currentPortal === 'team' || currentPortal === 'live' ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleExitPortal();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold shadow"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Portal & Return to Role Gateway</span>
            </button>
          ) : (currentPortal === 'correction' || currentPortal === 'player') && store.getActivePlayer() ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                store.logoutPlayer();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold shadow"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Player Session</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">
              Official SMYS 2026 Portal • Intra Hostel Cricket
            </p>
          )}
        </div>
      )}
    </header>
  );
};

