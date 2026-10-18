import React, { useState } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Shuffle,
  Sliders,
  Gavel,
  ListOrdered,
  Trophy,
  FileText,
  Database,
  Settings,
  Menu,
  X,
  Shield,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { AdminDashboard } from './AdminDashboard';
import { PlayerVerification } from './PlayerVerification';
import { TeamManagement } from './TeamManagement';
import { TeamAssignment } from './TeamAssignment';
import { AuctionConfiguration } from './AuctionConfiguration';
import { LiveAuctionControl } from './LiveAuctionControl';
import { AuctionSummary } from './AuctionSummary';
import { ReportsPDF } from './ReportsPDF';
import { SupabaseConnector } from './SupabaseConnector';
import { AdminSettings } from './AdminSettings';

type AdminTab =
  | 'dashboard'
  | 'verification'
  | 'verified-players'
  | 'teams'
  | 'assignment'
  | 'auction-config'
  | 'live-control'
  | 'queue'
  | 'summary'
  | 'reports'
  | 'supabase'
  | 'settings';

interface AdminPortalProps {
  onLogout?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout }) => {
  const store = useTournamentStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount = store.players.filter((p) => p.status === 'pending').length;
  const isAuctionLive = store.auctionState.status === 'bidding';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verification', label: 'Player Registrations', icon: UserCheck, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'verified-players', label: 'Verified Players', icon: UserCheck },
    { id: 'teams', label: 'Teams & Accounts', icon: Users },
    { id: 'assignment', label: 'Team Assignment', icon: Shuffle },
    { id: 'auction-config', label: 'Auction Configuration', icon: Sliders },
    { id: 'live-control', label: 'Live Auction Control', icon: Gavel, isLiveBadge: isAuctionLive },
    { id: 'queue', label: 'Player Calling Queue', icon: ListOrdered },
    { id: 'summary', label: 'Auction Summary', icon: Trophy },
    { id: 'reports', label: 'Reports & PDF', icon: FileText },
    { id: 'supabase', label: 'Supabase Connector', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab as AdminTab)} />;
      case 'verification':
      case 'verified-players':
      case 'queue':
        return <PlayerVerification />;
      case 'teams':
        return <TeamManagement />;
      case 'assignment':
        return <TeamAssignment />;
      case 'auction-config':
        return <AuctionConfiguration />;
      case 'live-control':
        return <LiveAuctionControl />;
      case 'summary':
        return <AuctionSummary />;
      case 'reports':
        return <ReportsPDF />;
      case 'supabase':
        return <SupabaseConnector />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab as AdminTab)} />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-[#F4F7FC]">
      {/* Persistent Navy Sidebar (#0B1535) for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-midnight border-r border-midnight-700/80 text-white shrink-0">
        <div className="p-4 border-b border-midnight-700/60 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center font-bold text-xs shadow-md">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xs tracking-wider uppercase text-gold">
              Control Centre
            </span>
            <p className="text-[11px] text-slate-400 font-medium">SMYS 75th Sathpantha</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-electric to-royal text-white shadow-md shadow-electric/25'
                    : 'text-slate-400 hover:text-white hover:bg-midnight-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}

                {item.isLiveBadge && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer & Logout */}
        <div className="p-3 bg-midnight-900 border-t border-midnight-700 space-y-2">
          <button
            onClick={() => {
              store.logoutAdmin();
              if (onLogout) onLogout();
            }}
            className="w-full py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Exit Admin</span>
          </button>
          <div className="text-[11px] text-slate-400">
            <p className="font-bold text-slate-300">Intra Hostel Cricket 2026</p>
            <p className="text-[10px] text-gold font-semibold">Organized by 75th Sathpantha</p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3.5 bg-midnight text-gold rounded-full shadow-2xl border-2 border-gold flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Modal */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-midnight text-white flex flex-col justify-between p-4 h-full shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-midnight-700 mb-4">
                <span className="font-extrabold text-sm text-gold uppercase">Admin Modules</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80vh]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as AdminTab);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                        isActive
                          ? 'bg-electric text-white'
                          : 'text-slate-400 hover:text-white hover:bg-midnight-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-amber-500 text-slate-900 font-bold text-[10px] px-1.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-midnight-700">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  store.logoutAdmin();
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Lock & Exit Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderActiveView()}
      </main>
    </div>
  );
};
