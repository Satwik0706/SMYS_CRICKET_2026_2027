import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Eye,
  CheckCheck,
  Shield,
  Phone,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  UserPlus,
  Upload,
  RefreshCw,
  DownloadCloud,
} from 'lucide-react';
import { BattingStyle, BowlingStyle, PlayerRegistration, PlayingRole, RegistrationStatus } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { compressAndResizeImage } from '../../utils/imageUtils';
import { getSupabaseCredentials, uploadPlayerPhotoToSupabase } from '../../services/supabaseClient';

export const PlayerVerification: React.FC = () => {
  const store = useTournamentStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRegistration | null>(null);
  const [rejectModalPlayer, setRejectModalPlayer] = useState<PlayerRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerRegistration | null>(null);

  // Auto-sync from Supabase on component mount
  useEffect(() => {
    setIsSyncing(true);
    store.autoSyncFromCloud().finally(() => setIsSyncing(false));
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await store.autoSyncFromCloud();
    setIsSyncing(false);
  };

  // Direct Add Player Modal state
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('3rd Year');
  const [newPhone, setNewPhone] = useState('');
  const [newMatches, setNewMatches] = useState<number | ''>('');
  const [newRuns, setNewRuns] = useState<number | ''>('');
  const [newWickets, setNewWickets] = useState<number | ''>('');
  const [newRole, setNewRole] = useState<PlayingRole>('All-Rounder');
  const [newBatRating, setNewBatRating] = useState<number>(7);
  const [newBowlRating, setNewBowlRating] = useState<number>(6);
  const [newKeepRating, setNewKeepRating] = useState<number>(5);
  const [newPhotoUrl, setNewPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setPhotoUploadMsg('Compressing...');
      const { dataUrl, blob, sizeKb } = await compressAndResizeImage(file, 480, 480, 0.82);
      const { isConfigured } = getSupabaseCredentials();
      if (isConfigured) {
        setPhotoUploadMsg('Uploading to Cloud...');
        const res = await uploadPlayerPhotoToSupabase(blob, 'admin-add-' + Date.now());
        if (res.success && res.url) {
          setNewPhotoUrl(res.url);
          setPhotoUploadMsg('Uploaded to Supabase CDN!');
        } else {
          setNewPhotoUrl(dataUrl);
          setPhotoUploadMsg(`Optimized (${sizeKb} KB)`);
        }
      } else {
        setNewPhotoUrl(dataUrl);
        setPhotoUploadMsg(`Optimized (${sizeKb} KB)`);
      }
    } catch {
      alert('Could not process photo');
    } finally {
      setIsUploadingPhoto(false);
      setTimeout(() => setPhotoUploadMsg(null), 4000);
    }
  };

  // Filtering
  const filteredPlayers = store.players.filter((p) => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.playingRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = store.players.filter((p) => p.status === 'pending').length;

  const handleApprove = (player: PlayerRegistration) => {
    store.verifyPlayer(player.id, 'verified', 'Approved for SMYS 2026 Auction Pool', 'Chief Administrator');
  };

  const handleRejectConfirm = () => {
    if (!rejectModalPlayer) return;
    store.verifyPlayer(
      rejectModalPlayer.id,
      'rejected',
      rejectReason.trim() || 'Did not meet tournament eligibility criteria',
      'Chief Administrator'
    );
    setRejectModalPlayer(null);
    setRejectReason('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingPlayer) return;
    store.deletePlayer(deletingPlayer.id);
    setDeletingPlayer(null);
  };

  const handleRequestCorrection = (player: PlayerRegistration) => {
    const notes = prompt(
      'Enter correction instructions for ' + player.fullName + ':',
      'Please update phone number or provide clearer photo.'
    );
    if (notes) {
      store.verifyPlayer(player.id, 'pending', `Correction Requested: ${notes}`, 'Chief Administrator');
    }
  };

  const handleDirectAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    store.addPlayerByAdmin({
      fullName: newFullName.trim(),
      academicYear: newAcademicYear,
      phone: newPhone.trim() || '+91 98000 00000',
      matchesPlayed: newMatches === '' ? 0 : Number(newMatches),
      runsScored: newRuns === '' ? 0 : Number(newRuns),
      wicketsTaken: newWickets === '' ? 0 : Number(newWickets),
      playingRole: newRole,
      battingRating: newBatRating,
      bowlingRating: newBowlRating,
      wicketkeepingRating: newRole === 'Wicket-Keeper' ? newKeepRating : null,
      battingStyle: 'Right-Handed — Top Order',
      bowlingStyle: 'Right Arm Medium',
      photoUrl: newPhotoUrl,
      status: 'verified', // Directly verified by administrator
      verifiedBy: 'Chief Administrator',
      verifiedAt: new Date().toLocaleString(),
    });

    setIsAddPlayerModalOpen(false);
    // Reset form
    setNewFullName('');
    setNewPhone('');
    setNewMatches('');
    setNewRuns('');
    setNewWickets('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-electric font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Registration Verification & Player Directory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Player Profile Review & Vetting</h2>
          <p className="text-xs text-slate-500">
            Review incoming player registrations, approve or reject candidates, add players directly, or delete entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 border border-slate-700"
            title="Fetch latest registrations directly from Supabase Cloud"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Supabase'}</span>
          </button>

          <button
            onClick={() => setIsAddPlayerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player Directly</span>
          </button>

          {pendingCount > 0 && (
            <button
              onClick={() => store.bulkApprovePending('Chief Administrator')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Bulk Approve All Pending ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-midnight text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all'
                ? `All (${store.players.length})`
                : status === 'pending'
                ? `Pending (${store.players.filter((p) => p.status === 'pending').length})`
                : status === 'verified'
                ? `Verified (${store.players.filter((p) => p.status === 'verified').length})`
                : `Rejected (${store.players.filter((p) => p.status === 'rejected').length})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, role, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-electric"
          />
        </div>
      </div>

      {/* Players Cards Grid / Empty State */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm text-slate-400 max-w-md mx-auto space-y-4">
          <UserCheck className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
          <div>
            <p className="text-base font-bold text-slate-700">No Players in Directory</p>
            <p className="text-xs text-slate-400 mt-1">
              Players can register via the Public Registration Portal (`/register`), or you can pull existing registrations from Supabase Cloud.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Fetching...' : 'Fetch from Supabase Cloud'}</span>
            </button>
            <button
              onClick={() => setIsAddPlayerModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-electric text-white text-xs font-bold shadow hover:bg-electric-hover"
            >
              Add Player Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map((player) => {
            const tier = store.getPlayerTier(player);

            return (
              <div
                key={player.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top: Photo & Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex space-x-3 items-center">
                      <img
                        src={player.photoUrl}
                        alt={player.fullName}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-slate-100 shadow-sm"
                      />
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">
                          {player.regNumber}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                          {player.fullName}
                        </h3>
                        <span className="inline-block mt-0.5 text-xs font-bold text-electric">
                          {player.playingRole}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {player.academicYear}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        player.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : player.status === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}
                    >
                      {player.status}
                    </span>
                  </div>

                  {/* Cricket Stats Pill Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Matches</span>
                      <p className="font-extrabold text-xs text-slate-800">{player.matchesPlayed}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Runs</span>
                      <p className="font-extrabold text-xs text-electric">{player.runsScored}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Wickets</span>
                      <p className="font-extrabold text-xs text-royal">{player.wicketsTaken}</p>
                    </div>
                  </div>

                  {/* Ratings Row */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>🏏 Batting Rating:</span>
                      <span className="font-bold text-slate-900">
                        {player.battingRating ? `${player.battingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>🎯 Bowling Rating:</span>
                      <span className="font-bold text-slate-900">
                        {player.bowlingRating ? `${player.bowlingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>🧤 Keeping Rating:</span>
                      <span className="font-bold text-slate-900">
                        {player.wicketkeepingRating ? `${player.wicketkeepingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">Auction Tier:</span>
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {tier.name}
                      </span>
                    </div>
                  </div>

                  {player.verificationNotes && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                      <span className="font-bold text-slate-700">Audit Note:</span> {player.verificationNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View Full Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPlayer(player)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {player.status !== 'verified' && (
                      <button
                        onClick={() => handleApprove(player)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {player.status !== 'rejected' && (
                      <button
                        onClick={() => setRejectModalPlayer(player)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {player.status === 'pending' && (
                      <button
                        onClick={() => handleRequestCorrection(player)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                        title="Request Correction"
                      >
                        Correction
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Direct Add Player by Admin */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleDirectAddPlayer}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center space-x-2 text-electric font-bold text-sm mb-1">
              <UserPlus className="w-4 h-4" />
              <span>Direct Player Enrollment</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Player to Directory</h3>
            <p className="text-xs text-slate-500 mb-4">
              Directly enroll a player into the tournament pool with verified status.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Yash Kadam"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Post-Grad">Post-Grad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Matches</label>
                  <input
                    type="number"
                    min="0"
                    value={newMatches}
                    onChange={(e) => setNewMatches(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Runs</label>
                  <input
                    type="number"
                    min="0"
                    value={newRuns}
                    onChange={(e) => setNewRuns(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="650"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wickets</label>
                  <input
                    type="number"
                    min="0"
                    value={newWickets}
                    onChange={(e) => setNewWickets(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="18"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Playing Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as PlayingRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bat Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newBatRating}
                    onChange={(e) => setNewBatRating(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bowl Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newBowlRating}
                    onChange={(e) => setNewBowlRating(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keep Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newKeepRating}
                    onChange={(e) => setNewKeepRating(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Player Photograph</label>
                <div className="flex items-center space-x-3">
                  <img
                    src={newPhotoUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-electric hover:bg-electric-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                        <Upload className={`w-3 h-3 ${isUploadingPhoto ? 'animate-bounce' : ''}`} />
                        <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Device Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          onChange={handleAdminFileUpload}
                          className="hidden"
                        />
                      </label>
                      {photoUploadMsg && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          {photoUploadMsg}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md"
              >
                Add Player
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Player Confirmation */}
      {deletingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Player</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete {deletingPlayer.fullName} ({deletingPlayer.regNumber})?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              This will permanently remove this player from the directory and auction pool.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingPlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Registration</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reject {rejectModalPlayer.fullName} ({rejectModalPlayer.regNumber})?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejected players will be excluded from the live auction calling queue.
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Administrator Notes:
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Ineligible semester / Missing hostel ID confirmation"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectModalPlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Profile View Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedPlayer.photoUrl}
                  alt={selectedPlayer.fullName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200"
                />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {selectedPlayer.regNumber}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedPlayer.fullName}</h3>
                  <p className="text-xs text-electric font-semibold">{selectedPlayer.playingRole}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="font-bold text-slate-800">{selectedPlayer.academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPlayer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batting Style:</span>
                  <span className="font-bold text-slate-800">{selectedPlayer.battingStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bowling Style:</span>
                  <span className="font-bold text-slate-800">{selectedPlayer.bowlingStyle}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Player Career Records
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase">Matches</span>
                    <p className="text-sm font-extrabold text-slate-900">{selectedPlayer.matchesPlayed}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase">Runs</span>
                    <p className="text-sm font-extrabold text-gold-dark">{selectedPlayer.runsScored}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase">Wickets</span>
                    <p className="text-sm font-extrabold text-emerald-600">{selectedPlayer.wicketsTaken}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Skill Evaluation (1-10)
                </h4>
                <div className="flex justify-between">
                  <span>Batting:</span>
                  <span className="font-bold">{selectedPlayer.battingRating ?? 'NA'}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Bowling:</span>
                  <span className="font-bold">{selectedPlayer.bowlingRating ?? 'NA'}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Wicketkeeping:</span>
                  <span className="font-bold">{selectedPlayer.wicketkeepingRating ?? 'NA'}/10</span>
                </div>
              </div>

              {selectedPlayer.verifiedBy && (
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Verified by <span className="font-bold text-slate-700">{selectedPlayer.verifiedBy}</span> at {selectedPlayer.verifiedAt}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
