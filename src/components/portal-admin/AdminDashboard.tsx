import React from 'react';
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Shield,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const store = useTournamentStore();

  const totalRegistrations = store.players.length;
  const pendingCount = store.players.filter((p) => p.status === 'pending').length;
  const verifiedCount = store.players.filter((p) => p.status === 'verified').length;
  const rejectedCount = store.players.filter((p) => p.status === 'rejected').length;
  const totalTeams = store.teams.length;
  const soldCount = store.sales.length;
  const eligibleForAuction = store.getEligibleQueue().length;
  const unsoldCount = store.players.filter(
    (p) => p.status === 'verified' && !store.sales.some((s) => s.playerId === p.id) && store.auctionState.status === 'unsold' && store.auctionState.currentPlayerId === p.id
  ).length;

  const totalExpenditure = store.sales.reduce((sum, s) => sum + s.finalPrice, 0);

  // Rating distribution: 8.5-10, 7.0-8.4, 5.0-6.9, <5.0
  const ratingDistribution = [
    { label: 'Elite (8.5 - 10)', count: store.players.filter((p) => Math.max(p.battingRating || 0, p.bowlingRating || 0, p.wicketkeepingRating || 0) >= 8.5).length, color: 'bg-amber-500' },
    { label: 'Gold (7.0 - 8.4)', count: store.players.filter((p) => { const r = Math.max(p.battingRating || 0, p.bowlingRating || 0, p.wicketkeepingRating || 0); return r >= 7.0 && r < 8.5; }).length, color: 'bg-yellow-400' },
    { label: 'Silver (5.0 - 6.9)', count: store.players.filter((p) => { const r = Math.max(p.battingRating || 0, p.bowlingRating || 0, p.wicketkeepingRating || 0); return r >= 5.0 && r < 7.0; }).length, color: 'bg-slate-400' },
    { label: 'Emerging (< 5.0)', count: store.players.filter((p) => Math.max(p.battingRating || 0, p.bowlingRating || 0, p.wicketkeepingRating || 0) < 5.0).length, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-midnight via-deepBlue to-electric rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-gold font-bold text-xs uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4" />
            <span>Administrator Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            SMYS Intra Hostel Cricket Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            75th Sathpantha Tournament Management • Realtime Session Sync Active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('live-control')}
            className="px-4 py-2.5 rounded-xl bg-gold text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-gold-hover shadow-md transition-all flex items-center space-x-2"
          >
            <Gavel className="w-4 h-4" />
            <span>Open Live Auction Desk</span>
          </button>
          <button
            onClick={() => onNavigate('verification')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/20 transition-all flex items-center space-x-2"
          >
            <span>Verify Registrations ({pendingCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Registrations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-electric" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalRegistrations}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total received profiles</p>
        </div>

        {/* Pending Verification */}
        <div
          onClick={() => onNavigate('verification')}
          className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 group-hover:scale-105 transition-transform">
            {pendingCount}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Requires approval</p>
        </div>

        {/* Verified Players */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Players</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{verifiedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Eligible for auction</p>
        </div>

        {/* Sold Players */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-royal mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Players Sold</span>
            <CheckCircle2 className="w-4 h-4 text-royal" />
          </div>
          <p className="text-2xl font-black text-royal">{soldCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">{eligibleForAuction} in queue</p>
        </div>

        {/* Total Expenditure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gold-dark mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Spend</span>
            <IndianRupee className="w-4 h-4 text-gold-dark" />
          </div>
          <p className="text-xl font-black text-slate-900">
            ₹{totalExpenditure.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across {totalTeams} teams</p>
        </div>
      </div>

      {/* Middle Row: Team Spending & Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Spending Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Team Purse & Spending Overview</h2>
              <p className="text-xs text-slate-500">Real-time expenditure vs initial ₹10,00,000 purse</p>
            </div>
            <button
              onClick={() => onNavigate('teams')}
              className="text-xs text-electric hover:underline font-bold"
            >
              Manage Teams →
            </button>
          </div>

          <div className="space-y-4">
            {store.teams.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-xs font-bold text-slate-700">No teams created yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Create your tournament teams to track real-time purse budgets.
                </p>
                <button
                  onClick={() => onNavigate('teams')}
                  className="mt-3 px-4 py-1.5 bg-electric hover:bg-electric-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  + Create First Team
                </button>
              </div>
            ) : (
              store.teams.map((team) => {
                const spentPct = Math.min(100, Math.round((team.spentPurse / team.initialPurse) * 100));
                return (
                  <div key={team.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{team.logo}</span>
                        <span className="font-bold text-slate-800">{team.name}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          {team.playersCount}/{team.maxSquadSize} Squad
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          ₹{team.spentPurse.toLocaleString('en-IN')} spent
                        </span>
                        <span className="text-slate-400 ml-1">
                          (₹{team.remainingPurse.toLocaleString('en-IN')} left)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${spentPct}%`,
                          backgroundColor: team.color || '#2563EB',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Player Rating Distribution Card (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Rating Distribution</h2>
              <p className="text-xs text-slate-500">Tier qualification spread</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {ratingDistribution.map((item) => {
              const pct = totalRegistrations > 0 ? Math.round((item.count / totalRegistrations) * 100) : 0;
              return (
                <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{item.count} players ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rejected Registrations:</span>
            <span className="font-bold text-red-500">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Tournament Activity & Audit Log</h2>
            <p className="text-xs text-slate-500">Automated ledger of verification, bids, sales, and administrative updates</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
            {store.auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {store.auditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-3 text-electric font-semibold">{log.performedBy}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
