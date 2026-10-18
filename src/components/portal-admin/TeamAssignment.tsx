import React, { useState } from 'react';
import {
  Shuffle,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';

export const TeamAssignment: React.FC = () => {
  const store = useTournamentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const verifiedPlayers = store.players.filter((p) => p.status === 'verified');

  const filteredPlayers = verifiedPlayers.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.playingRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam =
      selectedTeamFilter === 'all'
        ? true
        : selectedTeamFilter === 'unassigned'
        ? !p.assignedTeamId
        : p.assignedTeamId === selectedTeamFilter;

    return matchesSearch && matchesTeam;
  });

  const handleAutoAssign = () => {
    if (confirm('Run automated snake-draft balancing across all verified players based on skills and roles?')) {
      store.autoAssignTeams();
      setSuccessNotice('Squad balance algorithm executed successfully across all teams!');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleManualAssign = (playerId: string, teamId: string) => {
    store.assignPlayerToTeam(playerId, teamId === 'none' ? null : teamId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-electric font-bold text-xs uppercase tracking-wider mb-1">
            <Shuffle className="w-4 h-4" />
            <span>Squad Balancing Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Player & Squad Assignment</h2>
          <p className="text-xs text-slate-500">
            Generate balanced squads automatically using rating algorithms or manually assign verified players.
          </p>
        </div>

        <button
          onClick={handleAutoAssign}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric to-royal text-white font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span>Run Auto-Balance Algorithm</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Team filter dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Team:</label>
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="p-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">All Verified Players ({verifiedPlayers.length})</option>
            <option value="unassigned">Unassigned Only</option>
            {store.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified players..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-electric"
          />
        </div>
      </div>

      {/* Player Assignment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Role & Year</th>
                <th className="py-3 px-4">Career Stats</th>
                <th className="py-3 px-4">Rating Evaluation</th>
                <th className="py-3 px-4">Assigned Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPlayers.map((player) => {
                const assignedTeam = store.teams.find((t) => t.id === player.assignedTeamId);
                const overallRating = Math.max(
                  player.battingRating || 0,
                  player.bowlingRating || 0,
                  player.wicketkeepingRating || 0
                );

                return (
                  <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                    {/* Player */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={player.photoUrl}
                          alt={player.fullName}
                          className="w-10 h-10 rounded-xl object-cover border"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{player.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{player.regNumber}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Year */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-electric block">{player.playingRole}</span>
                      <span className="text-[11px] text-slate-400">{player.academicYear}</span>
                    </td>

                    {/* Stats */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] space-y-0.5">
                        <span className="text-slate-600 block">
                          <strong>{player.matchesPlayed}</strong> M • <strong>{player.runsScored}</strong> R • <strong>{player.wicketsTaken}</strong> W
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                        <span>★ {overallRating}/10</span>
                      </div>
                    </td>

                    {/* Assigned Team Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={player.assignedTeamId || 'none'}
                        onChange={(e) => handleManualAssign(player.id, e.target.value)}
                        className={`p-2 rounded-lg text-xs font-bold border ${
                          assignedTeam
                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                            : 'bg-amber-50/50 border-amber-300 text-amber-800'
                        }`}
                      >
                        <option value="none">-- Unassigned --</option>
                        {store.teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.logo} {team.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
