import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Key,
  ShieldAlert,
  ShieldCheck,
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { Team } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';

export const TeamManagement: React.FC = () => {
  const store = useTournamentStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [resetPwdTeam, setResetPwdTeam] = useState<Team | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [viewSquadTeam, setViewSquadTeam] = useState<Team | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // New Team Form state
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [logo, setLogo] = useState('🏏');
  const [color, setColor] = useState('#2563EB');
  const [captain, setCaptain] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [initialPurse, setInitialPurse] = useState<number>(1000000);
  const [maxSquadSize, setMaxSquadSize] = useState<number>(15);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !loginId.trim() || !password.trim()) return;

    store.createTeam({
      teamId: teamId.trim() || `TM-${Date.now().toString().slice(-4)}`,
      name: teamName.trim(),
      shortName: shortName.trim() || teamName.slice(0, 3).toUpperCase(),
      logo: logo || '🏏',
      color,
      captain: captain.trim() || 'Team Captain',
      loginId: loginId.trim().toLowerCase(),
      passwordHash: password.trim(),
      initialPurse: Number(initialPurse),
      maxSquadSize: Number(maxSquadSize),
      status: 'active',
    });

    setIsCreateModalOpen(false);
    // Reset inputs
    setTeamName('');
    setShortName('');
    setTeamId('');
    setCaptain('');
    setLoginId('');
  };

  const handleSaveEditTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    store.updateTeam(editingTeam.id, {
      name: editingTeam.name,
      shortName: editingTeam.shortName,
      captain: editingTeam.captain,
      logo: editingTeam.logo,
      color: editingTeam.color,
      loginId: editingTeam.loginId?.trim().toLowerCase() || editingTeam.loginId,
      passwordHash: editingTeam.passwordHash?.trim() || editingTeam.passwordHash,
      initialPurse: Number(editingTeam.initialPurse),
      remainingPurse: Math.max(0, Number(editingTeam.initialPurse) - editingTeam.spentPurse),
      maxSquadSize: Number(editingTeam.maxSquadSize),
    });

    setEditingTeam(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTeam) return;
    store.deleteTeam(deletingTeam.id);
    setDeletingTeam(null);
  };

  const handleToggleStatus = (team: Team) => {
    const nextStatus = team.status === 'active' ? 'disabled' : 'active';
    store.updateTeam(team.id, { status: nextStatus });
  };

  const handleSavePasswordReset = () => {
    if (!resetPwdTeam || !newPassword.trim()) return;
    store.resetTeamCredentials(resetPwdTeam.id, newPassword.trim());
    setResetPwdTeam(null);
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-royal font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Franchise & Account Administration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Teams, Purses & Access Provisioning</h2>
          <p className="text-xs text-slate-500">
            Create participating teams, configure purses, edit details, or delete teams as needed.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Teams Grid / Empty State */}
      {store.teams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-electric/10 text-electric flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Teams Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have full control over the tournament franchises. Click below to add your first team with custom name, purse, captain, and colors.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {store.teams.map((team) => {
            const squad = store.sales.filter((s) => s.teamId === team.id);
            const spentPct = Math.min(100, Math.round((team.spentPurse / team.initialPurse) * 100));

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Card Header with Team Color accent */}
                <div
                  className="p-5 border-b border-slate-100 relative"
                  style={{
                    background: `linear-gradient(135deg, ${team.color}15 0%, #FFFFFF 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border"
                        style={{
                          backgroundColor: team.color,
                          borderColor: team.secondaryColor || '#FFFFFF',
                        }}
                      >
                        {team.logo}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {team.teamId} • {team.shortName}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                          {team.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Captain: {team.captain}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        team.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-red-100 text-red-700 border border-red-300'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  {/* Account Credentials Pill */}
                  <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/90 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400">Login ID:</span>{' '}
                        <span className="font-mono font-bold text-slate-800">{team.loginId}</span>
                      </div>
                      <button
                        onClick={() => setResetPwdTeam(team)}
                        className="text-royal hover:underline font-bold flex items-center space-x-1"
                      >
                        <Key className="w-3 h-3" />
                        <span>Reset Pass</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-400">Password:</span>{' '}
                        <span className="font-mono font-bold text-slate-800">
                          {revealedPasswords[team.id] ? team.passwordHash : '••••••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedPasswords((prev) => ({ ...prev, [team.id]: !prev[team.id] }))
                        }
                        className="text-slate-500 hover:text-slate-800 text-[10px] font-bold"
                      >
                        {revealedPasswords[team.id] ? 'Hide' : 'Show Password'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial & Squad Stats */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">
                        Remaining Purse
                      </span>
                      <span className="text-sm font-black text-emerald-600 block mt-0.5">
                        ₹{team.remainingPurse.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        of ₹{team.initialPurse.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">
                        Squad Filled
                      </span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">
                        {squad.length} / {team.maxSquadSize}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {team.maxSquadSize - squad.length} slots free
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Purse Utilization</span>
                      <span>{spentPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${spentPct}%`,
                          backgroundColor: team.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewSquadTeam(team)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center space-x-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Squad ({squad.length})</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleToggleStatus(team)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                        team.status === 'active'
                          ? 'text-slate-500 hover:bg-slate-200'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {team.status === 'active' ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => setEditingTeam(team)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingTeam(team)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Team */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleCreateTeam}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Cricket Team</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add your custom team, set purse amount, captain, and login account.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team Name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Name (3-4 chars)</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.toUpperCase())}
                    placeholder="GLD"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Team ID</label>
                  <input
                    type="text"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="TM-01"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Team Logo Emoji / Icon</label>
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Team Primary Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 p-1 rounded-xl border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Captain Name</label>
                <input
                  type="text"
                  value={captain}
                  onChange={(e) => setCaptain(e.target.value)}
                  placeholder="Captain Name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
                />
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Franchise Portal Credentials (Given to Team)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Assign the custom ID and password this franchise will use to authenticate at the Common Portal Gateway.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Team Login ID *</label>
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="Team Login ID"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-electric"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Team Password *</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Team Password"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-electric"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Purse (₹)</label>
                  <input
                    type="number"
                    value={initialPurse}
                    onChange={(e) => setInitialPurse(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Squad Size</label>
                  <input
                    type="number"
                    value={maxSquadSize}
                    onChange={(e) => setMaxSquadSize(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md"
              >
                Save Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Team */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSaveEditTeam}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Team: {editingTeam.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update team parameters, purse budget, and squad limits.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={editingTeam.shortName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, shortName: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Captain Name</label>
                  <input
                    type="text"
                    value={editingTeam.captain}
                    onChange={(e) => setEditingTeam({ ...editingTeam, captain: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Logo Emoji</label>
                  <input
                    type="text"
                    value={editingTeam.logo}
                    onChange={(e) => setEditingTeam({ ...editingTeam, logo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={editingTeam.color}
                    onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                    className="w-full h-10 p-1 rounded-xl border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Purse (₹)</label>
                  <input
                    type="number"
                    value={editingTeam.initialPurse}
                    onChange={(e) => setEditingTeam({ ...editingTeam, initialPurse: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Squad Size</label>
                  <input
                    type="number"
                    value={editingTeam.maxSquadSize}
                    onChange={(e) => setEditingTeam({ ...editingTeam, maxSquadSize: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <span className="text-xs font-bold text-amber-900 block">Franchise Authentication Access</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Team Login ID</label>
                    <input
                      type="text"
                      required
                      value={editingTeam.loginId}
                      onChange={(e) => setEditingTeam({ ...editingTeam, loginId: e.target.value.toLowerCase() })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Team Password</label>
                    <input
                      type="text"
                      required
                      value={editingTeam.passwordHash}
                      onChange={(e) => setEditingTeam({ ...editingTeam, passwordHash: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Team Confirmation */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Team</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Are you sure you want to delete {deletingTeam.name}?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              This will permanently remove this team from the tournament. Any players assigned to this team will be returned to the unassigned pool.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingTeam(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPwdTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset Password for {resetPwdTeam.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter new password credentials for login ID: <span className="font-mono font-bold">{resetPwdTeam.loginId}</span>
            </p>

            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setResetPwdTeam(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePasswordReset}
                className="px-4 py-2 rounded-xl bg-royal text-white text-xs font-bold shadow-md"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Squad */}
      {viewSquadTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{viewSquadTeam.logo}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{viewSquadTeam.name} Squad</h3>
                  <p className="text-xs text-slate-500">
                    Purchased players and expenditure breakdown
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewSquadTeam(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {(() => {
              const squad = store.sales.filter((s) => s.teamId === viewSquadTeam.id);
              if (squad.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold text-slate-600">No players purchased yet</p>
                    <p className="text-[11px] mt-0.5">Players bought in live auction will appear here.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {squad.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-slate-400 text-[10px]">#{idx + 1}</span>
                        <img
                          src={item.playerPhoto}
                          alt={item.playerName}
                          className="w-9 h-9 rounded-lg object-cover border"
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
              );
            })()}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewSquadTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
