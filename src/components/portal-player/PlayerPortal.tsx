import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Upload,
  RefreshCw,
  LogOut,
  Trophy,
  ArrowRight,
  Shield,
  Star,
  Award,
  Edit3,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  BattingStyle,
  BowlingStyle,
  PlayerRegistration,
  PlayingRole,
} from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { compressAndResizeImage } from '../../utils/imageUtils';
import {
  getSupabaseCredentials,
  uploadPlayerPhotoToSupabase,
} from '../../services/supabaseClient';

const BATTING_STYLES: BattingStyle[] = [
  'Right-Handed — Top Order',
  'Right-Handed — Middle Order',
  'Right-Handed — Lower Order',
  'Left-Handed — Top Order',
  'Left-Handed — Middle Order',
  'Left-Handed — Lower Order',
  'Aggressive',
  'Defensive',
  'NA',
];

const BOWLING_STYLES: BowlingStyle[] = [
  'Right Arm Fast',
  'Left Arm Fast',
  'Right Arm Medium',
  'Left Arm Medium',
  'Right Arm Off Spin',
  'Left Arm Off Spin',
  'Right Arm Leg Spin',
  'Left Arm Leg Spin',
  'NA',
];

interface PlayerPortalProps {
  onLogout: () => void;
  onGoToRegister: () => void;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({
  onLogout,
  onGoToRegister,
}) => {
  const store = useTournamentStore();
  const activePlayer = store.getActivePlayer();

  // Login form state (when not logged in)
  const [loginPhoneInput, setLoginPhoneInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Edit form states
  const [fullName, setFullName] = useState('');
  const [academicYear, setAcademicYear] = useState('3rd Year');
  const [phone, setPhone] = useState('');
  const [playingRole, setPlayingRole] = useState<PlayingRole>('All-Rounder');
  const [battingStyle, setBattingStyle] = useState<BattingStyle>('Right-Handed — Top Order');
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle>('Right Arm Medium');
  const [matchesPlayed, setMatchesPlayed] = useState<number | ''>(0);
  const [runsScored, setRunsScored] = useState<number | ''>(0);
  const [wicketsTaken, setWicketsTaken] = useState<number | ''>(0);

  // Ratings states
  const [isBattingNA, setIsBattingNA] = useState(false);
  const [battingRating, setBattingRating] = useState<number | null>(7);
  const [isBowlingNA, setIsBowlingNA] = useState(false);
  const [bowlingRating, setBowlingRating] = useState<number | null>(6);
  const [isKeepingNA, setIsKeepingNA] = useState(false);
  const [wicketkeepingRating, setWicketkeepingRating] = useState<number | null>(5);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);

  // Save/recheck states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync state whenever active player changes
  useEffect(() => {
    if (activePlayer) {
      setFullName(activePlayer.fullName || '');
      setAcademicYear(activePlayer.academicYear || '3rd Year');
      setPhone(activePlayer.phone || '');
      setPlayingRole(activePlayer.playingRole || 'All-Rounder');
      setBattingStyle(activePlayer.battingStyle || 'Right-Handed — Top Order');
      setBowlingStyle(activePlayer.bowlingStyle || 'Right Arm Medium');
      setMatchesPlayed(activePlayer.matchesPlayed ?? 0);
      setRunsScored(activePlayer.runsScored ?? 0);
      setWicketsTaken(activePlayer.wicketsTaken ?? 0);

      setIsBattingNA(activePlayer.battingRating === null);
      setBattingRating(activePlayer.battingRating);
      setIsBowlingNA(activePlayer.bowlingRating === null);
      setBowlingRating(activePlayer.bowlingRating);
      setIsKeepingNA(activePlayer.wicketkeepingRating === null);
      setWicketkeepingRating(activePlayer.wicketkeepingRating);

      setPhotoUrl(activePlayer.photoUrl || '');
      setSubmitFeedback(null);
    }
  }, [activePlayer?.id]);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = store.loginPlayer(loginPhoneInput);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  // Photo upload handler with image compression & Supabase Storage upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadMsg('Compressing photo...');
      const { dataUrl, blob, sizeKb } = await compressAndResizeImage(file, 480, 480, 0.82);

      const { isConfigured } = getSupabaseCredentials();
      if (isConfigured) {
        setPhotoUploadMsg('Uploading to Cloud CDN...');
        const res = await uploadPlayerPhotoToSupabase(
          blob,
          `player-self-${Date.now()}`
        );
        if (res.success && res.url) {
          setPhotoUrl(res.url);
          setPhotoUploadMsg('Photo uploaded to cloud!');
        } else {
          setPhotoUrl(dataUrl);
          setPhotoUploadMsg(`Optimized (${sizeKb} KB)`);
        }
      } else {
        setPhotoUrl(dataUrl);
        setPhotoUploadMsg(`Optimized (${sizeKb} KB)`);
      }
    } catch {
      alert('Could not process photo. Please choose another file.');
    } finally {
      setIsUploadingPhoto(false);
      setTimeout(() => setPhotoUploadMsg(null), 4000);
    }
  };

  // Submit profile updates and flag for recheck
  const handleSubmitForRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlayer) return;
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const batRating = isBattingNA ? null : battingRating;
      const bowlRating = isBowlingNA ? null : bowlingRating;
      const keepRating = isKeepingNA ? null : wicketkeepingRating;

      const res = await store.updatePlayerSelf(
        activePlayer.id,
        {
          fullName: fullName.trim(),
          academicYear,
          phone: phone.trim(),
          playingRole,
          battingStyle,
          bowlingStyle,
          matchesPlayed: matchesPlayed === '' ? 0 : Number(matchesPlayed),
          runsScored: runsScored === '' ? 0 : Number(runsScored),
          wicketsTaken: wicketsTaken === '' ? 0 : Number(wicketsTaken),
          battingRating: batRating,
          bowlingRating: bowlRating,
          wicketkeepingRating: keepRating,
          photoUrl: photoUrl.trim() || activePlayer.photoUrl,
        },
        true // Submit for recheck: resets status to 'pending' so administrators review it
      );

      if (res.success) {
        setSubmitFeedback({
          type: 'success',
          text: '✅ Profile updated and submitted for recheck! The tournament committee will review your changes shortly.',
        });
      } else {
        setSubmitFeedback({
          type: 'error',
          text: res.message || 'Could not update profile. Please try again.',
        });
      }
    } catch (err: any) {
      setSubmitFeedback({
        type: 'error',
        text: err.message || 'An error occurred while saving your profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to active player's saved state
  const handleResetForm = () => {
    if (!activePlayer) return;
    setFullName(activePlayer.fullName || '');
    setAcademicYear(activePlayer.academicYear || '3rd Year');
    setPhone(activePlayer.phone || '');
    setPlayingRole(activePlayer.playingRole || 'All-Rounder');
    setBattingStyle(activePlayer.battingStyle || 'Right-Handed — Top Order');
    setBowlingStyle(activePlayer.bowlingStyle || 'Right Arm Medium');
    setMatchesPlayed(activePlayer.matchesPlayed ?? 0);
    setRunsScored(activePlayer.runsScored ?? 0);
    setWicketsTaken(activePlayer.wicketsTaken ?? 0);
    setIsBattingNA(activePlayer.battingRating === null);
    setBattingRating(activePlayer.battingRating);
    setIsBowlingNA(activePlayer.bowlingRating === null);
    setBowlingRating(activePlayer.bowlingRating);
    setIsKeepingNA(activePlayer.wicketkeepingRating === null);
    setWicketkeepingRating(activePlayer.wicketkeepingRating);
    setPhotoUrl(activePlayer.photoUrl || '');
    setSubmitFeedback(null);
  };

  // Computed highest rating for tier preview
  const currentMaxRating = Math.max(
    isBattingNA ? 0 : battingRating || 0,
    isBowlingNA ? 0 : bowlingRating || 0,
    isKeepingNA ? 0 : wicketkeepingRating || 0
  );

  const expectedTier =
    store.tiers.find(
      (t) => currentMaxRating >= t.minRating && currentMaxRating <= t.maxRating
    ) || store.tiers[store.tiers.length - 1];

  // ============================================================
  // VIEW 1: NOT LOGGED IN — LOGIN SCREEN
  // ============================================================
  if (!activePlayer) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-900 text-xs font-bold tracking-wider">
              <User className="w-3.5 h-3.5 text-cyan-600" />
              <span>PLAYER SELF-SERVICE DESK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Player Portal & Status Check
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Check your application verification status, view admin audit notes, update your stats or ratings, and submit for recheck.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5DFD2] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Your Mobile Number or Registration ID
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginPhoneInput}
                    onChange={(e) => setLoginPhoneInput(e.target.value)}
                    placeholder="e.g. 9876543210 or SMYS-2026-001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the phone number you entered during tournament registration.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Check Status & Edit Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2 text-center text-xs">
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-cyan-700 hover:text-cyan-800 font-bold hover:underline"
              >
                Haven't registered yet? Register for SMYS 2026 (New Window) →
              </button>
              <p className="text-[11px] text-slate-400">
                Official SMYS 2026 Correction Desk • 75th Sathpantha
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // VIEW 2: LOGGED IN — PLAYER DESK & APPLICATION MANAGEMENT
  // ============================================================
  const playerTier = store.getPlayerTier(activePlayer);
  const assignedTeam = activePlayer.assignedTeamId
    ? store.teams.find((t) => t.id === activePlayer.assignedTeamId)
    : null;
  const saleRecord = store.sales.find((s) => s.playerId === activePlayer.id);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={photoUrl || activePlayer.photoUrl}
            alt={activePlayer.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                {activePlayer.regNumber}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {activePlayer.playingRole}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {activePlayer.fullName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Academic: {activePlayer.academicYear} • Phone: {activePlayer.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => {
              store.logoutPlayer();
              onLogout();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center space-x-1.5"
            title="Log out of Player Desk"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* APPLICATION STATUS HUB BANNER */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-6 border shadow-sm transition-all ${
          activePlayer.status === 'verified'
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-200'
            : activePlayer.status === 'rejected'
            ? 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-white border-red-300'
            : 'bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-white border-amber-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${
                  activePlayer.status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : activePlayer.status === 'rejected'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                }`}
              >
                {activePlayer.status === 'verified' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Application Status: Verified & Approved</span>
                  </>
                ) : activePlayer.status === 'rejected' ? (
                  <>
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span>Application Status: Rejected / Action Required</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Application Status: Under Committee Review</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              {activePlayer.status === 'verified'
                ? 'You are in the SMYS 2026 Auction Pool!'
                : activePlayer.status === 'rejected'
                ? 'Your Registration Requires Attention'
                : 'Registration Queued for Verification'}
            </h3>

            <p className="text-xs text-slate-600 max-w-xl">
              {activePlayer.status === 'verified'
                ? 'Your statistics and ratings have been evaluated and approved. You are ready to be called during live bidding rounds.'
                : activePlayer.status === 'rejected'
                ? 'Your registration could not be verified in its current state. Please read the administrator feedback below, edit your information or ratings, and submit for recheck.'
                : 'The tournament administration is currently vetting your player details. You may update your stats, ratings, or photo below anytime.'}
            </p>
          </div>

          {/* Quick Metrics Badges for Verified Players */}
          {activePlayer.status === 'verified' && (
            <div className="bg-white/90 p-4 rounded-2xl border border-emerald-200 text-center shrink-0 shadow-sm min-w-[200px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Assigned Auction Tier
              </span>
              <span className="text-sm font-black text-amber-700 block mt-0.5">
                {playerTier.name}
              </span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">
                Opening Base: ₹{playerTier.minBid.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Sold to Franchise Team Banner (If sold during live auction) */}
        {assignedTeam && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{assignedTeam.logo || '🏏'}</span>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">
                  Sold in Live Auction
                </span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {assignedTeam.name} ({assignedTeam.shortName})
                </p>
                <p className="text-[11px] text-slate-500">Captain: {assignedTeam.captain}</p>
              </div>
            </div>
            {saleRecord && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Winning Hammer Bid</span>
                <p className="text-base font-black text-gold-dark">
                  ₹{saleRecord.finalPrice.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Administrator Verification Notes / Correction Instructions */}
        {activePlayer.verificationNotes && (
          <div className="mt-4 p-4 rounded-2xl bg-white/95 border border-slate-300 shadow-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Administrator Audit Notice:</span>
            </div>
            <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              "{activePlayer.verificationNotes}"
            </p>
            {activePlayer.verifiedBy && (
              <span className="text-[10px] text-slate-400 block pt-0.5">
                Notes issued by {activePlayer.verifiedBy} at {activePlayer.verifiedAt}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* EDIT RATINGS & INFORMATION FORM */}
      {/* ============================================================ */}
      <form onSubmit={handleSubmitForRecheck} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-7">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-cyan-600" />
              <span>Edit Player Details & Ratings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify any incorrect information or update your skill self-evaluation, then submit for recheck.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
          >
            Revert Changes
          </button>
        </div>

        {submitFeedback && (
          <div
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
              submitFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            {submitFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{submitFeedback.text}</span>
          </div>
        )}

        {/* Section 1: Personal & Contact Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            1. Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Yash Kadam"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Post-Grad">Post-Grad</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                WhatsApp Phone Number (Used for Notifications) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Playing Style & Role */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            2. Cricket Role & Playing Styles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Playing Role</label>
              <select
                value={playingRole}
                onChange={(e) => setPlayingRole(e.target.value as PlayingRole)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Batting Style</label>
              <select
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value as BattingStyle)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                {BATTING_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bowling Style</label>
              <select
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value as BowlingStyle)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                {BOWLING_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Cricket Performance Statistics */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            3. Cricket Performance Career Records
          </h3>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Matches Played</label>
              <input
                type="number"
                min="0"
                value={matchesPlayed}
                onChange={(e) => setMatchesPlayed(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="25"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-center font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Runs Scored</label>
              <input
                type="number"
                min="0"
                value={runsScored}
                onChange={(e) => setRunsScored(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="650"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-center font-bold text-electric"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wickets Taken</label>
              <input
                type="number"
                min="0"
                value={wicketsTaken}
                onChange={(e) => setWicketsTaken(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="18"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-center font-bold text-royal"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Self-Evaluation Skill Ratings (1-10) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              4. Skill Ratings Self-Evaluation (1–10)
            </h3>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Expected Tier: {expectedTier.name.split('—')[0]}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Batting Rating */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  🏏 Batting Rating: <strong className="font-mono text-electric">{isBattingNA ? 'N/A' : `${battingRating}/10`}</strong>
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                  <input
                    type="checkbox"
                    checked={isBattingNA}
                    onChange={(e) => {
                      setIsBattingNA(e.target.checked);
                      if (e.target.checked) setBattingRating(null);
                      else setBattingRating(7);
                    }}
                    className="rounded text-electric"
                  />
                  <span>Not Applicable</span>
                </label>
              </div>
              {!isBattingNA && (
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={battingRating || 5}
                    onChange={(e) => setBattingRating(Number(e.target.value))}
                    className="flex-1 accent-electric cursor-pointer"
                  />
                  <span className="w-8 text-center font-bold font-mono bg-white p-1 rounded border border-slate-200">
                    {battingRating}
                  </span>
                </div>
              )}
            </div>

            {/* Bowling Rating */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  🎯 Bowling Rating: <strong className="font-mono text-royal">{isBowlingNA ? 'N/A' : `${bowlingRating}/10`}</strong>
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                  <input
                    type="checkbox"
                    checked={isBowlingNA}
                    onChange={(e) => {
                      setIsBowlingNA(e.target.checked);
                      if (e.target.checked) setBowlingRating(null);
                      else setBowlingRating(6);
                    }}
                    className="rounded text-royal"
                  />
                  <span>Not Applicable</span>
                </label>
              </div>
              {!isBowlingNA && (
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={bowlingRating || 5}
                    onChange={(e) => setBowlingRating(Number(e.target.value))}
                    className="flex-1 accent-royal cursor-pointer"
                  />
                  <span className="w-8 text-center font-bold font-mono bg-white p-1 rounded border border-slate-200">
                    {bowlingRating}
                  </span>
                </div>
              )}
            </div>

            {/* Wicketkeeping Rating */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  🧤 Wicketkeeping Rating: <strong className="font-mono text-emerald-600">{isKeepingNA ? 'N/A' : `${wicketkeepingRating}/10`}</strong>
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 text-[11px]">
                  <input
                    type="checkbox"
                    checked={isKeepingNA}
                    onChange={(e) => {
                      setIsKeepingNA(e.target.checked);
                      if (e.target.checked) setWicketkeepingRating(null);
                      else setWicketkeepingRating(5);
                    }}
                    className="rounded text-emerald-600"
                  />
                  <span>Not Applicable</span>
                </label>
              </div>
              {!isKeepingNA && (
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={wicketkeepingRating || 5}
                    onChange={(e) => setWicketkeepingRating(Number(e.target.value))}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                  <span className="w-8 text-center font-bold font-mono bg-white p-1 rounded border border-slate-200">
                    {wicketkeepingRating}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Player Photograph */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            5. Player Photograph
          </h3>

          <div className="flex items-center space-x-4">
            <img
              src={photoUrl || activePlayer.photoUrl}
              alt="Preview"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
            />
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-sm transition-colors">
                  <Upload className={`w-3.5 h-3.5 ${isUploadingPhoto ? 'animate-bounce' : ''}`} />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photoUploadMsg && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {photoUploadMsg}
                  </span>
                )}
              </div>

              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Or paste direct image URL"
                className="w-full p-2 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Submitting changes will queue your application for administrator re-verification.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingPhoto}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting for Recheck...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes & Submit for Recheck</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
