import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Eye,
  CheckCheck,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Upload,
  RefreshCw,
  Sliders,
  Edit3,
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Check,
  Star,
  Award,
  Zap,
} from 'lucide-react';
import { BattingStyle, BowlingStyle, PlayerRegistration, PlayingRole, RegistrationStatus } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { compressAndResizeImage } from '../../utils/imageUtils';
import { getSupabaseCredentials, uploadPlayerPhotoToSupabase } from '../../services/supabaseClient';
import {
  formatWhatsAppPhoneNumber,
  isMobileDevice,
  buildWhatsAppMessage,
  openWhatsAppNotice,
  getWhatsAppUrl,
} from '../../utils/whatsappUtils';

export const PlayerVerification: React.FC = () => {
  const store = useTournamentStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRegistration | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerRegistration | null>(null);

  // --- Ratings & Tier Editing Modal State ---
  const [editingRatingsPlayer, setEditingRatingsPlayer] = useState<PlayerRegistration | null>(null);
  const [editBattingRating, setEditBattingRating] = useState<number | null>(7);
  const [editIsBattingNA, setEditIsBattingNA] = useState(false);
  const [editBowlingRating, setEditBowlingRating] = useState<number | null>(6);
  const [editIsBowlingNA, setEditIsBowlingNA] = useState(false);
  const [editKeepingRating, setEditKeepingRating] = useState<number | null>(5);
  const [editIsKeepingNA, setEditIsKeepingNA] = useState(false);
  const [editTierId, setEditTierId] = useState<string>('auto'); // 'auto' or tier.id
  const [editNotes, setEditNotes] = useState('');
  const [isSavingRatings, setIsSavingRatings] = useState(false);
  const [ratingsSaveSuccess, setRatingsSaveSuccess] = useState(false);

  // --- WhatsApp Rejection & Suggest Correction Modal State ---
  const [whatsappModalPlayer, setWhatsappModalPlayer] = useState<PlayerRegistration | null>(null);
  const [noticeType, setNoticeType] = useState<'rejection' | 'correction'>('rejection');
  const [noticeReason, setNoticeReason] = useState('');
  const [noticePhone, setNoticePhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Common rejection & correction presets
  const REJECTION_PRESETS = [
    'Did not meet tournament eligibility criteria',
    'Discrepancy in player statistics / unverified record',
    'Missing required hostel room proof / student ID',
    'Ineligible academic year / branch criteria',
    'Duplicate registration entry detected',
  ];

  const CORRECTION_PRESETS = [
    'Please upload a clear front-facing passport photograph',
    'Please provide an active 10-digit WhatsApp phone number',
    'Please verify matches played and run/wicket stats with committee',
    'Please confirm your hostel branch and room allocation number',
    'Please select the appropriate bowling / batting style',
  ];

  // Auto-sync from Supabase on component mount and every 4 seconds for real-time registrations
  useEffect(() => {
    setIsSyncing(true);
    store.autoSyncFromCloud().finally(() => setIsSyncing(false));

    const interval = setInterval(() => {
      store.autoSyncFromCloud();
    }, 4000);

    return () => clearInterval(interval);
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
  const [newTierChoice, setNewTierChoice] = useState<string>('auto');
  const [newPhotoUrl, setNewPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

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

  // Open Edit Ratings & Tier Modal
  const openEditRatingsModal = (player: PlayerRegistration) => {
    setEditingRatingsPlayer(player);
    setEditBattingRating(player.battingRating);
    setEditIsBattingNA(player.battingRating === null);
    setEditBowlingRating(player.bowlingRating);
    setEditIsBowlingNA(player.bowlingRating === null);
    setEditKeepingRating(player.wicketkeepingRating);
    setEditIsKeepingNA(player.wicketkeepingRating === null);
    setEditTierId(player.tierId || 'auto');
    setEditNotes(player.verificationNotes || '');
    setRatingsSaveSuccess(false);
  };

  const handleSaveRatingsAndTier = async () => {
    if (!editingRatingsPlayer) return;
    setIsSavingRatings(true);
    try {
      const batRating = editIsBattingNA ? null : editBattingRating;
      const bowlRating = editIsBowlingNA ? null : editBowlingRating;
      const keepRating = editIsKeepingNA ? null : editKeepingRating;
      const tierId = editTierId === 'auto' ? null : editTierId;

      store.updatePlayerRatingsAndTier(
        editingRatingsPlayer.id,
        {
          battingRating: batRating,
          bowlingRating: bowlRating,
          wicketkeepingRating: keepRating,
          tierId: tierId,
          notes: editNotes.trim() || undefined,
        },
        'Chief Administrator'
      );

      setRatingsSaveSuccess(true);
      setTimeout(() => {
        setRatingsSaveSuccess(false);
        setEditingRatingsPlayer(null);
      }, 700);
    } catch (err: any) {
      alert('Error updating ratings: ' + (err.message || 'Please check connection'));
    } finally {
      setIsSavingRatings(false);
    }
  };

  // Open WhatsApp Rejection or Suggest Correction Modal
  const openWhatsAppModal = (player: PlayerRegistration, type: 'rejection' | 'correction') => {
    setWhatsappModalPlayer(player);
    setNoticeType(type);
    setNoticePhone(player.phone || '');
    setNoticeReason(
      type === 'rejection'
        ? 'Did not meet tournament eligibility criteria'
        : 'Please upload a clear front-facing passport photograph'
    );
    setIsCopied(false);
  };

  // Send WhatsApp Notice + Update Database Status
  const handleConfirmWhatsAppNotice = async (forceTarget?: 'web' | 'mobile') => {
    if (!whatsappModalPlayer) return;
    setIsUpdatingStatus(true);
    try {
      const cleanReason = noticeReason.trim() || 'No specific reason provided';

      if (noticeType === 'rejection') {
        store.verifyPlayer(
          whatsappModalPlayer.id,
          'rejected',
          `Rejected: ${cleanReason}`,
          'Chief Administrator'
        );
      } else {
        // Suggest Correction -> keeps or sets to pending with correction notes
        store.verifyPlayer(
          whatsappModalPlayer.id,
          'pending',
          `Correction Requested: ${cleanReason}`,
          'Chief Administrator'
        );
      }

      // Generate WhatsApp message
      const message = buildWhatsAppMessage({
        fullName: whatsappModalPlayer.fullName,
        regNumber: whatsappModalPlayer.regNumber,
        type: noticeType,
        reason: cleanReason,
        tournamentTitle: store.config.title || 'SMYS INTRA HOSTEL CRICKET AUCTION 2026',
      });

      // Launch WhatsApp (Web on PC or App on mobile)
      openWhatsAppNotice(noticePhone || whatsappModalPlayer.phone, message, forceTarget);

      setWhatsappModalPlayer(null);
      setNoticeReason('');
    } catch (err: any) {
      alert('Error processing notice: ' + (err.message || 'Failed'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Copy WhatsApp message to clipboard
  const handleCopyMessage = () => {
    if (!whatsappModalPlayer) return;
    const message = buildWhatsAppMessage({
      fullName: whatsappModalPlayer.fullName,
      regNumber: whatsappModalPlayer.regNumber,
      type: noticeType,
      reason: noticeReason.trim() || 'No specific reason provided',
      tournamentTitle: store.config.title || 'SMYS INTRA HOSTEL CRICKET AUCTION 2026',
    });
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPlayer) return;
    store.deletePlayer(deletingPlayer.id);
    setDeletingPlayer(null);
  };

  const handleDirectAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    setIsAddingPlayer(true);
    try {
      await store.addPlayerByAdmin({
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
        tierId: newTierChoice === 'auto' ? null : newTierChoice,
      });

      setIsAddPlayerModalOpen(false);
      // Reset form
      setNewFullName('');
      setNewPhone('');
      setNewMatches('');
      setNewRuns('');
      setNewWickets('');
      setNewTierChoice('auto');
    } catch (err: any) {
      alert('Error adding player: ' + (err.message || 'Please check your connection and try again.'));
    } finally {
      setIsAddingPlayer(false);
    }
  };

  // Preview computed highest rating for the edit modal
  const editMaxRating = Math.max(
    editIsBattingNA ? 0 : editBattingRating || 0,
    editIsBowlingNA ? 0 : editBowlingRating || 0,
    editIsKeepingNA ? 0 : editKeepingRating || 0
  );
  const autoTierPreview =
    store.tiers.find((t) => editMaxRating >= t.minRating && editMaxRating <= t.maxRating) ||
    store.tiers[store.tiers.length - 1];

  const currentDeviceIsMobile = isMobileDevice();

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
            Review incoming player registrations, adjust ratings, assign custom auction tiers, or reject/suggest corrections with direct WhatsApp notification.
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
            const isManualTier = Boolean(player.tierId);

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
                          {player.academicYear} • {player.phone}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
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

                  {/* Ratings Row with Edit button */}
                  <div className="space-y-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                        <Star className="w-3 h-3 text-gold" />
                        <span>Evaluation Ratings</span>
                      </span>
                      <button
                        onClick={() => openEditRatingsModal(player)}
                        className="text-[11px] font-bold text-electric hover:text-electric-hover flex items-center space-x-1 px-2 py-0.5 rounded bg-electric/10 hover:bg-electric/20 transition-colors"
                        title="Edit ratings and tier"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>🏏 Batting:</span>
                      <span className="font-bold text-slate-900">
                        {player.battingRating !== null ? `${player.battingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>🎯 Bowling:</span>
                      <span className="font-bold text-slate-900">
                        {player.bowlingRating !== null ? `${player.bowlingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>🧤 Keeping:</span>
                      <span className="font-bold text-slate-900">
                        {player.wicketkeepingRating !== null ? `${player.wicketkeepingRating}/10` : 'NA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span>Auction Tier:</span>
                      </span>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center space-x-1">
                          {isManualTier && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" title="Admin manual tier override" />}
                          <span>{tier.name}</span>
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Base: ₹{tier.minBid.toLocaleString('en-IN')} {isManualTier ? '(Manual)' : '(Auto)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {player.verificationNotes && (
                    <div className="mt-2.5 p-2 bg-amber-50/60 rounded-lg text-[11px] text-slate-600 border border-amber-200">
                      <span className="font-bold text-slate-700">Audit Note:</span> {player.verificationNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View Full Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditRatingsModal(player)}
                      className="p-1.5 rounded-lg text-electric hover:bg-blue-50 transition-colors"
                      title="Edit Player Ratings & Set Tier"
                    >
                      <Sliders className="w-4 h-4" />
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
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center space-x-1 shadow-sm"
                        title="Approve candidate"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => openWhatsAppModal(player, 'correction')}
                      className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 transition-colors flex items-center space-x-1"
                      title="Suggest correction and send notice via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Correction</span>
                    </button>

                    {player.status !== 'rejected' && (
                      <button
                        onClick={() => openWhatsAppModal(player, 'rejection')}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center space-x-1"
                        title="Reject player and send WhatsApp notice"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT RATINGS AND SET TIER */}
      {/* ============================================================ */}
      {editingRatingsPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <img
                  src={editingRatingsPlayer.photoUrl}
                  alt={editingRatingsPlayer.fullName}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-electric shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {editingRatingsPlayer.regNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-electric font-bold border border-blue-200">
                      {editingRatingsPlayer.playingRole}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{editingRatingsPlayer.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    Fine-tune cricket skill scores and set auction tier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRatingsPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Batting Rating */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>🏏 Batting Rating</span>
                    <span className="font-mono text-electric font-black text-sm">
                      {editIsBattingNA ? 'N/A' : `${editBattingRating}/10`}
                    </span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                    <input
                      type="checkbox"
                      checked={editIsBattingNA}
                      onChange={(e) => {
                        setEditIsBattingNA(e.target.checked);
                        if (e.target.checked) setEditBattingRating(null);
                        else setEditBattingRating(7);
                      }}
                      className="rounded text-electric focus:ring-electric"
                    />
                    <span>Not Applicable</span>
                  </label>
                </div>

                {!editIsBattingNA && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editBattingRating || 5}
                      onChange={(e) => setEditBattingRating(Number(e.target.value))}
                      className="flex-1 accent-electric cursor-pointer"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editBattingRating || ''}
                      onChange={(e) => setEditBattingRating(Math.min(10, Math.max(1, Number(e.target.value))))}
                      className="w-14 p-1.5 text-center font-bold font-mono rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Bowling Rating */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>🎯 Bowling Rating</span>
                    <span className="font-mono text-royal font-black text-sm">
                      {editIsBowlingNA ? 'N/A' : `${editBowlingRating}/10`}
                    </span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                    <input
                      type="checkbox"
                      checked={editIsBowlingNA}
                      onChange={(e) => {
                        setEditIsBowlingNA(e.target.checked);
                        if (e.target.checked) setEditBowlingRating(null);
                        else setEditBowlingRating(6);
                      }}
                      className="rounded text-royal focus:ring-royal"
                    />
                    <span>Not Applicable</span>
                  </label>
                </div>

                {!editIsBowlingNA && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editBowlingRating || 5}
                      onChange={(e) => setEditBowlingRating(Number(e.target.value))}
                      className="flex-1 accent-royal cursor-pointer"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editBowlingRating || ''}
                      onChange={(e) => setEditBowlingRating(Math.min(10, Math.max(1, Number(e.target.value))))}
                      className="w-14 p-1.5 text-center font-bold font-mono rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Wicketkeeping Rating */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>🧤 Wicketkeeping Rating</span>
                    <span className="font-mono text-emerald-600 font-black text-sm">
                      {editIsKeepingNA ? 'N/A' : `${editKeepingRating}/10`}
                    </span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                    <input
                      type="checkbox"
                      checked={editIsKeepingNA}
                      onChange={(e) => {
                        setEditIsKeepingNA(e.target.checked);
                        if (e.target.checked) setEditKeepingRating(null);
                        else setEditKeepingRating(5);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>Not Applicable</span>
                  </label>
                </div>

                {!editIsKeepingNA && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editKeepingRating || 5}
                      onChange={(e) => setEditKeepingRating(Number(e.target.value))}
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={editKeepingRating || ''}
                      onChange={(e) => setEditKeepingRating(Math.min(10, Math.max(1, Number(e.target.value))))}
                      className="w-14 p-1.5 text-center font-bold font-mono rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Live Rating & Tier Assignment Section */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      Skill Evaluation Score
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      Highest Rating: {editMaxRating > 0 ? `${editMaxRating}/10` : 'None'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Formula Suggestion</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {autoTierPreview?.name || 'Default Tier'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    🎯 Assign Auction Tier (Manual Override or Auto)
                  </label>
                  <select
                    value={editTierId}
                    onChange={(e) => setEditTierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="auto">
                      ⚡ Auto Calculate (Based on ratings: {autoTierPreview?.name})
                    </option>
                    {store.tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Base Bid: ₹{t.minBid.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selecting a specific tier manually fixes this player's auction tier, opening bid, and calling bracket.
                  </p>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrator Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Verified by chief scout, elevated to Tier 1 for power-hitting"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {ratingsSaveSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Ratings and Tier updated successfully! Synced to Supabase Cloud.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRatingsPlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingRatings}
                onClick={handleSaveRatingsAndTier}
                className="px-5 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-60"
              >
                {isSavingRatings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Cloud...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Ratings & Tier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REJECT OR SUGGEST CORRECTION WITH WHATSAPP INTEGRATION */}
      {/* ============================================================ */}
      {whatsappModalPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <img
                  src={whatsappModalPlayer.photoUrl}
                  alt={whatsappModalPlayer.fullName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {whatsappModalPlayer.regNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {whatsappModalPlayer.playingRole}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{whatsappModalPlayer.fullName}</h3>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModalPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Notice Type Switcher (Reject vs Correction) */}
            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setNoticeType('rejection');
                  setNoticeReason('Did not meet tournament eligibility criteria');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  noticeType === 'rejection'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Player</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNoticeType('correction');
                  setNoticeReason('Please upload a clear front-facing passport photograph');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  noticeType === 'correction'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suggest Correction</span>
              </button>
            </div>

            {/* Recipient Phone with WhatsApp verification hint */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>📱 Player WhatsApp Phone Number:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Formatted: <code className="font-mono text-slate-600">+{formatWhatsAppPhoneNumber(noticePhone || whatsappModalPlayer.phone)}</code>
                  </span>
                </label>
                <input
                  type="tel"
                  value={noticePhone}
                  onChange={(e) => setNoticePhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Presets Chips */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  ⚡ Quick Reason Presets (Click to choose):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(noticeType === 'rejection' ? REJECTION_PRESETS : CORRECTION_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNoticeReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors ${
                        noticeReason === preset
                          ? noticeType === 'rejection'
                            ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                            : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Details Textarea */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {noticeType === 'rejection' ? 'Rejection Reason (Sent to Player):' : 'Suggested Corrections Needed:'}
                </label>
                <textarea
                  rows={3}
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  placeholder="Provide specific notes or correction directions..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Device Detection Banner */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {currentDeviceIsMobile ? (
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Monitor className="w-4 h-4 text-blue-600" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      {currentDeviceIsMobile ? 'Detected: Mobile Phone' : 'Detected: Desktop PC'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {currentDeviceIsMobile
                        ? 'Will automatically launch WhatsApp Mobile App'
                        : 'Will launch WhatsApp Web (web.whatsapp.com) in browser'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Ready
                </span>
              </div>

              {/* Live WhatsApp Message Preview */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Preview of WhatsApp Message:
                </span>
                <div className="bg-[#e7f7e9] p-3 rounded-xl border border-emerald-200 text-slate-800 text-[11px] whitespace-pre-wrap font-sans max-h-36 overflow-y-auto shadow-inner leading-relaxed">
                  {buildWhatsAppMessage({
                    fullName: whatsappModalPlayer.fullName,
                    regNumber: whatsappModalPlayer.regNumber,
                    type: noticeType,
                    reason: noticeReason.trim() || 'No specific reason provided',
                    tournamentTitle: store.config.title || 'SMYS INTRA HOSTEL CRICKET AUCTION 2026',
                  })}
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-5 space-y-2 pt-3 border-t border-slate-200">
              {/* Primary Action Button */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleConfirmWhatsAppNotice()}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                  noticeType === 'rejection'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-60`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {noticeType === 'rejection'
                    ? 'Reject Player & Send WhatsApp Notice'
                    : 'Request Correction & Send WhatsApp Notice'}
                </span>
              </button>

              {/* Specific Platform Fallback / Secondary Actions */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleConfirmWhatsAppNotice('web')}
                  className="py-1.5 px-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1"
                  title="Force open in WhatsApp Web"
                >
                  <Monitor className="w-3 h-3 text-blue-500" />
                  <span>WhatsApp Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmWhatsAppNotice('mobile')}
                  className="py-1.5 px-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1"
                  title="Force open in WhatsApp App"
                >
                  <Smartphone className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp App</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-1.5 px-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1"
                  title="Copy text to clipboard"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Dismiss / Save without WhatsApp option */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cleanReason = noticeReason.trim() || 'No specific reason provided';
                    if (noticeType === 'rejection') {
                      store.verifyPlayer(whatsappModalPlayer.id, 'rejected', cleanReason, 'Chief Administrator');
                    } else {
                      store.verifyPlayer(whatsappModalPlayer.id, 'pending', `Correction: ${cleanReason}`, 'Chief Administrator');
                    }
                    setWhatsappModalPlayer(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  Save status to database only (skip WhatsApp)
                </button>

                <button
                  type="button"
                  onClick={() => setWhatsappModalPlayer(null)}
                  className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auction Tier</label>
                  <select
                    value={newTierChoice}
                    onChange={(e) => setNewTierChoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="auto">⚡ Auto (Based on Ratings)</option>
                    {store.tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                disabled={isAddingPlayer || isUploadingPhoto}
                className="px-5 py-2 rounded-xl bg-electric hover:bg-electric-hover text-white text-xs font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {isAddingPlayer ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding to Cloud...</span>
                  </>
                ) : (
                  <span>Add Player</span>
                )}
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
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Skill Evaluation & Auction Tier
                  </h4>
                  <button
                    onClick={() => {
                      const p = selectedPlayer;
                      setSelectedPlayer(null);
                      openEditRatingsModal(p);
                    }}
                    className="text-electric hover:underline text-[11px] font-bold flex items-center space-x-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Edit Ratings & Tier</span>
                  </button>
                </div>
                <div className="flex justify-between">
                  <span>Batting:</span>
                  <span className="font-bold">{selectedPlayer.battingRating !== null ? `${selectedPlayer.battingRating}/10` : 'NA'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bowling:</span>
                  <span className="font-bold">{selectedPlayer.bowlingRating !== null ? `${selectedPlayer.bowlingRating}/10` : 'NA'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wicketkeeping:</span>
                  <span className="font-bold">{selectedPlayer.wicketkeepingRating !== null ? `${selectedPlayer.wicketkeepingRating}/10` : 'NA'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Assigned Auction Tier:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {store.getPlayerTier(selectedPlayer).name}
                  </span>
                </div>
              </div>

              {selectedPlayer.verificationNotes && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-700">
                  <span className="font-bold">Audit Note:</span> {selectedPlayer.verificationNotes}
                </div>
              )}

              {selectedPlayer.verifiedBy && (
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Verified by <span className="font-bold text-slate-700">{selectedPlayer.verifiedBy}</span> at {selectedPlayer.verifiedAt}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    const p = selectedPlayer;
                    setSelectedPlayer(null);
                    openWhatsAppModal(p, 'correction');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 transition-colors flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Suggest Correction</span>
                </button>
                <button
                  onClick={() => {
                    const p = selectedPlayer;
                    setSelectedPlayer(null);
                    openWhatsAppModal(p, 'rejection');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

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
