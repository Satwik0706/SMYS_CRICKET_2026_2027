import React, { useState, useEffect } from 'react';
import {
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Camera,
  X,
} from 'lucide-react';
import { BattingStyle, BowlingStyle, PlayerRegistration, PlayingRole } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { compressAndResizeImage } from '../../utils/imageUtils';
import { getSupabaseCredentials, uploadPlayerPhotoToSupabase } from '../../services/supabaseClient';

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

interface PlayerRegistrationPortalProps {
  onGoToLive: () => void;
}

export const PlayerRegistrationPortal: React.FC<PlayerRegistrationPortalProps> = ({ onGoToLive }) => {
  const store = useTournamentStore();

  // Form states - ALL start empty with NO default prefilled values
  const [fullName, setFullName] = useState('');
  const [academicYear, setAcademicYear] = useState(''); // Fillable input (1, 2, 3...) - not a dropdown
  const [phone, setPhone] = useState('');
  const [matchesPlayed, setMatchesPlayed] = useState<number | ''>('');
  const [runsScored, setRunsScored] = useState<number | ''>('');
  const [wicketsTaken, setWicketsTaken] = useState<number | ''>('');
  const [playingRole, setPlayingRole] = useState<PlayingRole | ''>(''); // No default role preselected

  // Sliders with NA support - No default prefilled ratings
  const [isBattingNA, setIsBattingNA] = useState(false);
  const [battingRating, setBattingRating] = useState<number | null>(null);

  const [isBowlingNA, setIsBowlingNA] = useState(false);
  const [bowlingRating, setBowlingRating] = useState<number | null>(null);

  const [isWicketkeepingNA, setIsWicketkeepingNA] = useState(false);
  const [wicketkeepingRating, setWicketkeepingRating] = useState<number | null>(null);

  const [battingStyle, setBattingStyle] = useState<BattingStyle | ''>('');
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | ''>('');

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMessage, setPhotoUploadMessage] = useState<string | null>(null);

  // Status
  const [submittedPlayer, setSubmittedPlayer] = useState<PlayerRegistration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    store.autoSyncFromCloud();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadMessage('Optimizing photo...');
      const { dataUrl, blob, sizeKb } = await compressAndResizeImage(file, 480, 480, 0.82);

      const { isConfigured } = getSupabaseCredentials();
      if (isConfigured) {
        setPhotoUploadMessage('Uploading to Supabase Storage...');
        const res = await uploadPlayerPhotoToSupabase(blob, 'player-' + Date.now());
        if (res.success && res.url) {
          setPhotoUrl(res.url);
          setPhotoUploadMessage('Uploaded to Supabase CDN!');
        } else {
          setPhotoUrl(dataUrl);
          setPhotoUploadMessage(`Optimized (${sizeKb} KB)`);
        }
      } else {
        setPhotoUrl(dataUrl);
        setPhotoUploadMessage(`Optimized (${sizeKb} KB)`);
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    } catch (err) {
      console.error('Photo processing error:', err);
      alert('Could not process this image file.');
    } finally {
      setIsUploadingPhoto(false);
      setTimeout(() => setPhotoUploadMessage(null), 4000);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!academicYear.trim()) errs.academicYear = 'Academic Year is required (1, 2, 3, 4...)';
    if (!phone.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (phone.trim().length < 10) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!photoUrl) errs.photo = 'Please upload your front-facing profile photo';
    if (!playingRole) errs.playingRole = 'Please select your playing role';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isUploadingPhoto) {
      alert('Please wait for your photograph to finish uploading.');
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.form;
      return copy;
    });

    try {
      const registered = await store.registerPlayer({
        fullName: fullName.trim(),
        academicYear: academicYear.trim(),
        phone: phone.trim(),
        matchesPlayed: matchesPlayed === '' ? 0 : Number(matchesPlayed),
        runsScored: runsScored === '' ? 0 : Number(runsScored),
        wicketsTaken: wicketsTaken === '' ? 0 : Number(wicketsTaken),
        playingRole: (playingRole || 'All-Rounder') as PlayingRole,
        battingRating: isBattingNA ? 0 : (battingRating ?? 5),
        bowlingRating: isBowlingNA ? 0 : (bowlingRating ?? 5),
        wicketkeepingRating: isWicketkeepingNA ? 0 : (wicketkeepingRating ?? 5),
        battingStyle: (battingStyle || 'NA') as BattingStyle,
        bowlingStyle: (bowlingStyle || 'NA') as BowlingStyle,
        photoUrl,
      });

      setSubmittedPlayer(registered);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      const msg = err.message || 'Failed to submit registration. Please check your network connection and try again.';
      setErrors((prev) => ({ ...prev, form: msg }));
      alert(`Registration Notice: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setAcademicYear('');
    setPhone('');
    setMatchesPlayed('');
    setRunsScored('');
    setWicketsTaken('');
    setPlayingRole('');
    setBattingRating(null);
    setBowlingRating(null);
    setWicketkeepingRating(null);
    setIsBattingNA(false);
    setIsBowlingNA(false);
    setIsWicketkeepingNA(false);
    setBattingStyle('');
    setBowlingStyle('');
    setPhotoUrl('');
    setPhotoInputUrl('');
    setSubmittedPlayer(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      {/* Hero Section with Warm Creamy Luxury Aesthetic */}
      <div className="relative bg-gradient-to-b from-[#F5F0E6] via-[#FAF6EE] to-[#FAF8F5] border-b border-[#E6DFD1] text-slate-900 pt-10 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-sm">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D97706_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 text-amber-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Official Player Enrollment Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-slate-900 uppercase">
            SMYS — <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">Intra Hostel Cricket 2026</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-800">
            ORGANIZED BY 75TH SATHPANTHA
          </p>
          <p className="max-w-2xl mx-auto text-slate-600 text-xs sm:text-sm font-normal">
            Step onto the grandest stage of hostel cricket. Register your profile, submit your stats, and prepare for the premier live auction.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8">
        {submittedPlayer ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl shadow-[0_12px_45px_-8px_rgba(40,30,15,0.08)] border border-[#E6DFD1] p-6 sm:p-10 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle className="w-10 h-10" />
            </div>

            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Status: Pending Verification
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              Your details have been securely recorded. The administrator will review your statistics and assign your auction tier shortly.
            </p>

            {/* Digital Player Card Preview */}
            <div className="bg-gradient-to-br from-midnight via-deepBlue to-midnight-800 text-white rounded-2xl p-6 max-w-md mx-auto shadow-2xl border-2 border-gold/40 mb-8 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gold tracking-widest">
                    SMYS 75TH SATHPANTHA
                  </p>
                  <p className="text-xs text-slate-300 font-medium">Official Player Pass</p>
                </div>
                <div className="bg-gold text-slate-950 font-black text-xs px-2.5 py-1 rounded-md">
                  {submittedPlayer.regNumber}
                </div>
              </div>

              <div className="flex space-x-4 items-center mb-4">
                <img
                  src={submittedPlayer.photoUrl}
                  alt={submittedPlayer.fullName}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gold/60 shadow-md"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{submittedPlayer.fullName}</h3>
                  <p className="text-xs text-electric-light font-semibold">{submittedPlayer.playingRole}</p>
                  <p className="text-xs text-slate-300">Year: {submittedPlayer.academicYear}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">{submittedPlayer.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-midnight-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Matches</span>
                  <p className="text-sm font-extrabold text-white">{submittedPlayer.matchesPlayed}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Runs</span>
                  <p className="text-sm font-extrabold text-gold">{submittedPlayer.runsScored}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Wickets</span>
                  <p className="text-sm font-extrabold text-emerald-400">{submittedPlayer.wicketsTaken}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#D6CEC0] bg-[#FAF8F5] text-slate-700 font-bold text-sm hover:bg-white transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Register Another Player</span>
              </button>

              <button
                onClick={onGoToLive}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white font-bold text-sm hover:brightness-105 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>View Public Live Auction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form with White Creamy Luxury Styling */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-[0_12px_45px_-8px_rgba(40,30,15,0.08)] border border-[#E6DFD1] overflow-hidden divide-y divide-[#F0EBE1]"
          >
            {/* 1. Profile Photograph (Clean User Upload - No Sample Avatars) */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-slate-900">Profile Photograph</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {photoUrl ? (
                  <div className="relative group">
                    <img
                      src={photoUrl}
                      alt="Player Preview"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md ring-2 ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                      title="Remove uploaded photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                      Uploaded Photo
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#D6CEC0] bg-[#FAF7F2] flex flex-col items-center justify-center text-slate-400 p-2 text-center group-hover:border-amber-500 transition-colors">
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 leading-tight">No Photo Selected</span>
                  </div>
                )}

                <div className="flex-1 w-full space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload your personal front-facing headshot photograph. Clear photos work best on the live auction broadcast screen.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={`cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${
                        isUploadingPhoto ? 'bg-royal/60 cursor-not-allowed' : 'bg-gradient-to-r from-royal to-indigo-600 hover:brightness-105'
                      }`}
                    >
                      <Upload className={`w-3.5 h-3.5 ${isUploadingPhoto ? 'animate-bounce' : ''}`} />
                      <span>{isUploadingPhoto ? 'Processing Photo...' : 'Upload from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-[#D6CEC0] bg-[#FAF7F2] text-slate-700 text-xs font-bold hover:bg-white transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Use Image URL</span>
                    </button>

                    {photoUploadMessage && (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fadeIn">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{photoUploadMessage}</span>
                      </span>
                    )}
                  </div>

                  {showUrlInput && (
                    <div className="flex items-center space-x-2 pt-1 animate-fadeIn">
                      <input
                        type="url"
                        value={photoInputUrl}
                        onChange={(e) => setPhotoInputUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D6CEC0] bg-[#FDFCFA] text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (photoInputUrl.trim()) {
                            setPhotoUrl(photoInputUrl.trim());
                            setShowUrlInput(false);
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.photo;
                              return next;
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {errors.photo && (
                    <p className="text-xs text-red-600 font-bold flex items-center space-x-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{errors.photo}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Personal Information */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-royal focus:bg-white transition-all shadow-sm ${
                        errors.fullName ? 'border-red-400 bg-red-50/20' : 'border-[#D6CEC0]'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Academic Year - Fillable input (1, 2, 3...) - Not a Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="Enter Year (1, 2, 3, 4)"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-royal focus:bg-white transition-all shadow-sm ${
                        errors.academicYear ? 'border-red-400 bg-red-50/20' : 'border-[#D6CEC0]'
                      }`}
                    />
                  </div>
                  {errors.academicYear && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.academicYear}</span>
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number (10 digits)"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-royal focus:bg-white transition-all shadow-sm ${
                        errors.phone ? 'border-red-400 bg-red-50/20' : 'border-[#D6CEC0]'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Cricket Statistics */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-bold text-slate-900">Cricket Statistics</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Matches Played
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchesPlayed}
                    onChange={(e) => setMatchesPlayed(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6CEC0] bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal"
                  />
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Total Runs Scored
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={runsScored}
                    onChange={(e) => setRunsScored(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6CEC0] bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal"
                  />
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Total Wickets Taken
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={wicketsTaken}
                    onChange={(e) => setWicketsTaken(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6CEC0] bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal"
                  />
                </div>
              </div>
            </div>

            {/* 4. Playing Role (No preselected default) */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h2 className="text-lg font-bold text-slate-900">Primary Playing Role <span className="text-red-500">*</span></h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'NA'] as PlayingRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setPlayingRole(role);
                      if (role === 'Batsman') {
                        setIsBattingNA(false);
                        setIsBowlingNA(true);
                        setIsWicketkeepingNA(true);
                      } else if (role === 'Bowler') {
                        setIsBowlingNA(false);
                        setIsBattingNA(true);
                        setIsWicketkeepingNA(true);
                      } else if (role === 'Wicket-Keeper') {
                        setIsWicketkeepingNA(false);
                        setIsBattingNA(false);
                        setIsBowlingNA(true);
                      } else if (role === 'All-Rounder') {
                        setIsBattingNA(false);
                        setIsBowlingNA(false);
                        setIsWicketkeepingNA(false);
                      }
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.playingRole;
                        return next;
                      });
                    }}
                    className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                      playingRole === role
                        ? 'border-amber-600 bg-amber-500/15 text-amber-900 font-bold shadow-sm ring-2 ring-amber-500/30 scale-[1.02]'
                        : 'border-[#E5DDD0] bg-[#FAF8F4] text-slate-700 hover:border-slate-400 font-semibold'
                    }`}
                  >
                    <div className="text-xl mb-1">
                      {role === 'Batsman' && '🏏'}
                      {role === 'Bowler' && '🎯'}
                      {role === 'All-Rounder' && '⚡'}
                      {role === 'Wicket-Keeper' && '🧤'}
                      {role === 'NA' && '🛡️'}
                    </div>
                    <span className="text-xs">{role}</span>
                  </button>
                ))}
              </div>
              {errors.playingRole && (
                <p className="text-xs text-red-600 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.playingRole}</span>
                </p>
              )}
            </div>

            {/* 5. Skill Ratings (Sliders 1 to 10 with explicit NA - No prefilled defaults) */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Self Skill Ratings (1 to 10)</h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">Explicit NA allowed</span>
              </div>

              {/* Batting Rating */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">🏏 Batting Skill</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBattingNA(!isBattingNA);
                        if (!isBattingNA) setBattingRating(0);
                      }}
                      className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
                        isBattingNA
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isBattingNA ? 'Marked NA' : 'Mark as NA'}
                    </button>
                  </div>
                  <span className="text-lg font-extrabold text-blue-700">
                    {isBattingNA ? 'NA' : battingRating !== null ? `${battingRating}/10` : 'Not Rated'}
                  </span>
                </div>
                {!isBattingNA && (
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={battingRating ?? 5}
                    onChange={(e) => setBattingRating(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                )}
              </div>

              {/* Bowling Rating */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">🎯 Bowling Skill</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBowlingNA(!isBowlingNA);
                        if (!isBowlingNA) setBowlingRating(0);
                      }}
                      className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
                        isBowlingNA
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isBowlingNA ? 'Marked NA' : 'Mark as NA'}
                    </button>
                  </div>
                  <span className="text-lg font-extrabold text-royal">
                    {isBowlingNA ? 'NA' : bowlingRating !== null ? `${bowlingRating}/10` : 'Not Rated'}
                  </span>
                </div>
                {!isBowlingNA && (
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={bowlingRating ?? 5}
                    onChange={(e) => setBowlingRating(parseInt(e.target.value))}
                    className="w-full accent-royal cursor-pointer"
                  />
                )}
              </div>

              {/* Wicketkeeping Rating */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D3]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">🧤 Wicketkeeping Skill</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWicketkeepingNA(!isWicketkeepingNA);
                        if (!isWicketkeepingNA) setWicketkeepingRating(0);
                      }}
                      className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
                        isWicketkeepingNA
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isWicketkeepingNA ? 'Marked NA' : 'Mark as NA'}
                    </button>
                  </div>
                  <span className="text-lg font-extrabold text-amber-700">
                    {isWicketkeepingNA ? 'NA' : wicketkeepingRating !== null ? `${wicketkeepingRating}/10` : 'Not Rated'}
                  </span>
                </div>
                {!isWicketkeepingNA && (
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={wicketkeepingRating ?? 5}
                    onChange={(e) => setWicketkeepingRating(parseInt(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                )}
              </div>
            </div>

            {/* 6. Preferred Playing Styles (Empty by default) */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <h2 className="text-lg font-bold text-slate-900">Preferred Playing Styles</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Batting Style
                  </label>
                  <select
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value as BattingStyle)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CEC0] text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal bg-[#FDFCFA] focus:bg-white shadow-sm"
                  >
                    <option value="">Select Batting Style</option>
                    {BATTING_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bowling Style
                  </label>
                  <select
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value as BowlingStyle)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CEC0] text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal bg-[#FDFCFA] focus:bg-white shadow-sm"
                  >
                    <option value="">Select Bowling Style</option>
                    {BOWLING_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            {errors.form && (
              <div className="mx-6 sm:mx-8 my-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="p-6 sm:p-8 bg-[#F7F3EA] border-t border-[#E8E1D3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Registrations undergo verification by the 75th Sathpantha committee.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing with Cloud...</span>
                  </>
                ) : isUploadingPhoto ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Photo...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
