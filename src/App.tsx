import React, { useState, useEffect } from 'react';
import { AppPortal } from './types';
import { Header } from './components/common/Header';
import { PortalGateway } from './components/gateway/PortalGateway';
import { PlayerRegistrationPortal } from './components/portal-register/PlayerRegistration';
import { AdminPortal } from './components/portal-admin/AdminPortal';
import { PublicLiveAuction } from './components/portal-live/PublicLiveAuction';
import { TeamPortal } from './components/portal-team/TeamPortal';
import { Trophy, Lock, ShieldCheck } from 'lucide-react';
import { useTournamentStore } from './hooks/useTournamentStore';

export function App() {
  const store = useTournamentStore();

  const getInitialPortal = (): AppPortal => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/register')) return 'register';
    if (path.includes('/admin')) {
      return store.isAdminAuthenticated() ? 'admin' : 'gateway';
    }
    if (path.includes('/team')) {
      return store.getActiveTeam() ? 'team' : 'gateway';
    }
    if (path.includes('/live')) return 'live';
    return 'gateway';
  };

  const [currentPortal, setCurrentPortal] = useState<AppPortal>(getInitialPortal());

  const handleSelectPortal = (portal: AppPortal) => {
    // Route guards
    if (portal === 'admin' && !store.isAdminAuthenticated()) {
      setCurrentPortal('gateway');
      window.history.pushState(null, '', '/');
      return;
    }
    if (portal === 'team' && !store.getActiveTeam()) {
      setCurrentPortal('gateway');
      window.history.pushState(null, '', '/');
      return;
    }

    setCurrentPortal(portal);
    const newPath = portal === 'gateway' ? '/' : `/${portal}`;
    window.history.pushState(null, '', newPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPortal(getInitialPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    store.autoSyncFromCloud();

    const handleSync = () => {
      store.autoSyncFromCloud();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('online', handleSync);
    const interval = setInterval(handleSync, 6000);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('online', handleSync);
      clearInterval(interval);
    };
  }, [currentPortal]);

  const isDarkPortal = currentPortal === 'live';

  return (
    <div className={`min-h-screen flex flex-col ${isDarkPortal ? 'bg-[#070D22]' : 'bg-[#FAF8F5]'}`}>
      {/* Universal Sticky Header (Portal Isolated) */}
      <Header currentPortal={currentPortal} onSelectPortal={handleSelectPortal} />

      {/* Main Portal View */}
      <main className="flex-1">
        {currentPortal === 'gateway' && (
          <PortalGateway onNavigate={handleSelectPortal} />
        )}
        {currentPortal === 'register' && (
          <PlayerRegistrationPortal onGoToLive={() => handleSelectPortal('gateway')} />
        )}
        {currentPortal === 'admin' && (
          <AdminPortal onLogout={() => handleSelectPortal('gateway')} />
        )}
        {currentPortal === 'live' && <PublicLiveAuction />}
        {currentPortal === 'team' && (
          <TeamPortal onLogout={() => handleSelectPortal('gateway')} />
        )}
      </main>

      {/* Global Brand Footer (Enforces Portal Isolation) */}
      <footer
        className={`border-t py-8 px-4 sm:px-6 lg:px-8 text-xs transition-colors ${
          isDarkPortal
            ? 'bg-midnight-950 border-midnight-800 text-slate-500'
            : 'bg-[#F4EFE6] border-[#E5DDD0] text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center text-midnight-950 border border-gold/40 shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className={`font-extrabold text-sm ${isDarkPortal ? 'text-slate-200' : 'text-slate-900'}`}>
                SMYS — INTRA HOSTEL CRICKET
              </p>
              <p className="text-[11px] text-amber-600 font-bold">BY 75TH SATHPANTHA</p>
            </div>
          </div>

          {/* Secure Navigation & Isolation Status */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => handleSelectPortal('gateway')}
              className={`transition-colors flex items-center space-x-1.5 ${
                isDarkPortal ? 'hover:text-electric text-slate-300' : 'hover:text-amber-700 text-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Role Selection Gateway</span>
            </button>
            <span>•</span>
            <span className={isDarkPortal ? 'text-slate-400' : 'text-slate-500'}>
              Active Portal: <strong className="text-amber-600 uppercase font-mono">{currentPortal}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-600 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted Session Active</span>
            </span>
          </div>

          <p className={`text-[11px] ${isDarkPortal ? 'text-slate-500' : 'text-slate-500'}`}>
            © 2026 SMYS Cricket Ecosystem • All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

